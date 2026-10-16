"""
PIXIE API — thin layer between the React UI and the Python modules.

Teammates fill in modules/*.py. Keep route shapes stable so the frontend
does not break.
"""

from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from modules import analytics, api_client, database, monitor, notifier, url_handler

app = FastAPI(title="PIXIE API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TrackRequest(BaseModel):
    url: str
    drop_goal_percent: int = 25


@app.on_event("startup")
def startup() -> None:
    database.create_tables()


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "service": "pixie"}


@app.post("/api/parse-url")
def parse_url(payload: dict) -> dict:
    url = payload.get("url", "")
    platform = url_handler.detect_platform(url)
    product_id = url_handler.extract_product_id(url)
    return {"url": url, "platform": platform, "product_id": product_id}


@app.post("/api/track")
def track_product(body: TrackRequest) -> dict:
    platform = url_handler.detect_platform(body.url)
    product_id = url_handler.extract_product_id(body.url)
    raw = api_client.fetch_product(platform, product_id)
    product = api_client.normalize_response(raw)
    target_price = round(product["price"] * (1 - body.drop_goal_percent / 100), 2)
    stored = database.insert_product({**product, "url": body.url}, target_price)
    database.insert_price_record(stored["id"], product["price"])
    return {"product": stored, "target_price": target_price, "drop_goal_percent": body.drop_goal_percent}


@app.get("/api/products")
def list_products() -> dict:
    return {"products": database.get_tracked_products()}


@app.get("/api/products/{product_id}/history")
def product_history(product_id: int) -> dict:
    return {
        "product_id": product_id,
        "history": database.get_price_history(product_id),
        "analytics": analytics.calculate_volatility(product_id),
    }


@app.post("/api/check-now")
def check_now() -> dict:
    """Manual trigger used by the UI; scheduler.py calls the same function on a clock."""
    return {"results": monitor.check_tracked_products()}


@app.post("/api/alerts/test")
def test_alert() -> dict:
    return notifier.send_price_alert({"title": "Placeholder Product"}, 179)
