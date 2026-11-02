"""
PIXIE API — thin layer between the React UI and the Python modules.

Teammates fill in modules/*.py. Keep route shapes stable so the frontend
does not break.
"""

import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from modules import analytics, api_client, compare, database, monitor, notifier, url_handler

app = FastAPI(title="PIXIE API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TrackRequest(BaseModel):
    url: str
    drop_goal_percent: int = 25


class GoalRequest(BaseModel):
    drop_goal_percent: int = 25


class ActiveRequest(BaseModel):
    active: bool


def read_product_link(url: str) -> dict:
    """
    Ask url_handler to read a pasted link.

    process_url is the function that module already provides.
    This file does not change url_handler.py.
    """
    try:
        return url_handler.process_url(url)
    except (url_handler.InvalidURLError, url_handler.UnsupportedPlatformError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.on_event("startup")
def startup() -> None:
    database.create_tables()


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "service": "pixie"}


@app.post("/api/parse-url")
def parse_url(payload: dict) -> dict:
    parsed = read_product_link(payload.get("url", ""))
    return {
        "url": parsed["clean_url"],
        "platform": parsed["platform"],
        "product_id": parsed["product_id"],
    }


@app.post("/api/track")
def track_product(body: TrackRequest) -> dict:
    parsed = read_product_link(body.url)
    # get_product_data fetches the price and returns the shared product shape.
    # This file does not change api_client.py.
    product = api_client.get_product_data(parsed["platform"], parsed["product_id"])
    if not product or product.get("price") is None:
        raise HTTPException(
            status_code=502,
            detail="Could not fetch this product. Check the link and RAPIDAPI_KEY in .env.",
        )

    product = {**product, "url": parsed["clean_url"]}
    # Target is the live price reduced by the discount the user picked.
    # A ₹699 product with a 25% goal is tracked at ₹524.25.
    target_price = round(product["price"] * (1 - body.drop_goal_percent / 100), 2)
    stored = database.insert_product(product, target_price, body.drop_goal_percent)
    database.insert_price_record(stored["id"], product["price"])
    # Read the row again so price, drop, and saved include the check we just stored.
    for row in database.get_tracked_products():
        if row["id"] == stored["id"]:
            stored = row
            break

    # The pasted product is already saved. A failed search on the other
    # store must not turn this request into an error.
    try:
        comparison = find_on_other_store(stored, product, body.drop_goal_percent)
    except Exception:
        other_name = compare.other_platform(product.get("platform") or "").title()
        comparison = {"found": False, "note": f"No close match on {other_name}."}
    return {
        "product": stored,
        "target_price": target_price,
        "drop_goal_percent": body.drop_goal_percent,
        "comparison": comparison,
    }


def find_on_other_store(stored: dict, product: dict, drop_goal_percent: int) -> dict:
    """
    Search the other store once and save the closest listing.

    A failed search still returns found=False. Tracking the pasted link
    does not depend on the other store.
    """
    other = compare.other_platform(product.get("platform") or "")
    no_match = {"found": False, "note": f"No close match on {other.title()}."}
    query = compare.short_query(product.get("title") or "")
    if not query:
        return no_match

    hits = api_client.search_product(other, query) or []
    match = compare.best_match(product.get("title") or "", hits)
    if match is None:
        return no_match

    other_product = api_client.get_product_data(other, compare.hit_id(match))
    if not other_product or other_product.get("price") is None:
        return no_match

    other_target = round(other_product["price"] * (1 - drop_goal_percent / 100), 2)
    other_stored = database.insert_product(other_product, other_target, drop_goal_percent)
    database.insert_price_record(other_stored["id"], other_product["price"])

    pair_id = stored.get("pair_id") or uuid.uuid4().hex
    database.set_pair(stored["id"], pair_id)
    database.set_pair(other_stored["id"], pair_id)
    stored["pair_id"] = pair_id

    partner = database.get_product(other_stored["id"]) or other_stored
    return {
        "found": True,
        "note": compare.price_note(stored, partner),
        "other": partner,
    }


@app.get("/api/products")
def list_products() -> dict:
    return {"products": database.get_tracked_products()}


@app.get("/api/products/{product_id}/history")
def product_history(product_id: int) -> dict:
    """Price history for one product, plus the other store when they are paired."""
    product = database.get_product(product_id)
    partner = database.get_partner(product_id)
    if product and partner:
        comparison = {
            "found": True,
            "note": compare.price_note(product, partner),
            "history": database.get_price_history(partner["id"]),
            "other": partner,
        }
    else:
        other_name = "Flipkart" if product and product.get("platform") == "amazon" else "Amazon"
        comparison = {"found": False, "note": f"No close match on {other_name}."}

    return {
        "product_id": product_id,
        "platform": product.get("platform") if product else "",
        "history": database.get_price_history(product_id),
        "analytics": analytics.calculate_volatility(product_id),
        "comparison": comparison,
    }


@app.post("/api/products/{product_id}/goal")
def update_goal(product_id: int, body: GoalRequest) -> dict:
    """Save a new target from the discount chosen on the page."""
    updated = database.set_drop_goal(product_id, body.drop_goal_percent)
    if updated is None:
        raise HTTPException(status_code=404, detail="That product is not being tracked.")
    return updated


@app.post("/api/products/{product_id}/active")
def update_active(product_id: int, body: ActiveRequest) -> dict:
    """Save the watchlist on/off toggle."""
    database.set_product_active(product_id, body.active)
    return {"id": product_id, "active": body.active}


@app.delete("/api/products/{product_id}")
def delete_product(product_id: int) -> dict:
    """Remove a tracked product after the UI has asked the user to confirm."""
    deleted = database.delete_product(product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="That product is not being tracked.")
    return {"id": product_id, "deleted": True}


@app.post("/api/check-now")
def check_now() -> dict:
    """Manual trigger used by the UI; scheduler.py calls the same function on a clock."""
    return {"results": monitor.check_tracked_products()}


@app.post("/api/alerts/connect")
def connect_alert() -> dict:
    """Send the one-time email that confirms the mailbox is connected."""
    return notifier.send_connection_email()
