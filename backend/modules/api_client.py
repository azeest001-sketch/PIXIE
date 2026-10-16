"""
api_client.py
-------------
FEATURE: Collector (get the current price from RapidAPI)

TODO (owner): call each platform's RapidAPI endpoint with RAPIDAPI_KEY
from the .env file, then normalize every raw payload into one shape.
"""

from dotenv import load_dotenv
import os

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "")
RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST", "")


def fetch_amazon_product(product_id: str) -> dict:
    """Calls the Amazon RapidAPI endpoint and returns the raw response."""
    # TODO: requests.get(..., headers={"X-RapidAPI-Key": RAPIDAPI_KEY, "X-RapidAPI-Host": ...})
    return {"placeholder": True, "platform": "amazon", "id": product_id}


def fetch_flipkart_product(product_id: str) -> dict:
    """Calls the Flipkart RapidAPI endpoint and returns the raw response."""
    # TODO: RapidAPI Flipkart host from FLIPKART_RAPIDAPI_HOST
    return {"placeholder": True, "platform": "flipkart", "id": product_id}


def fetch_myntra_product(product_id: str) -> dict:
    """Calls the Myntra RapidAPI endpoint and returns the raw response."""
    # TODO: RapidAPI Myntra host from MYNTRA_RAPIDAPI_HOST
    return {"placeholder": True, "platform": "myntra", "id": product_id}


def fetch_product(platform: str, product_id: str) -> dict:
    """Routes to fetch_<platform>_product(id)."""
    if platform == "flipkart":
        return fetch_flipkart_product(product_id)
    if platform == "myntra":
        return fetch_myntra_product(product_id)
    return fetch_amazon_product(product_id)


def normalize_response(raw: dict) -> dict:
    """Converts a raw RapidAPI response into the shared product format."""
    # TODO: map title, price, mrp, image, store from each platform payload
    return {
        "title": raw.get("title") or "Placeholder Product",
        "platform": raw.get("platform") or "amazon",
        "external_id": raw.get("id") or "PLACEHOLDER_PRODUCT_ID",
        "price": raw.get("price") or 1999,
        "mrp": raw.get("mrp") or 4999,
        "currency": "INR",
        "image_url": raw.get("image_url") or "",
        "store_name": raw.get("platform") or "amazon",
        "raw": raw,
    }
