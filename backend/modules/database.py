"""
database.py
-----------
FEATURE: Storage (sqlite3)

TODO (owner): create tables and persist products + price_history.
Use DATABASE_PATH from .env.
"""

from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_PATH = os.getenv("DATABASE_PATH", "backend/data/pixie.db")

# Suggested schema (implement in create_tables):
# products(id, title, platform, external_id, url, target_price, first_seen, active)
# price_history(id, product_id, price, recorded_at)


def create_tables() -> None:
    """Set up `products` and `price_history` tables."""
    # TODO: sqlite3 connect + CREATE TABLE IF NOT EXISTS
    return None


def insert_product(product: dict, target_price: float) -> dict:
    """
    Adds a new product record if it is not already being tracked.
    first_seen should be datetime.now().
    """
    # TODO: INSERT OR IGNORE, then return the stored row
    return {
        "id": 1,
        "title": product.get("title", "Placeholder Product"),
        "platform": product.get("platform", "amazon"),
        "external_id": product.get("external_id", "PLACEHOLDER_PRODUCT_ID"),
        "target_price": target_price,
        "price": product.get("price", 1999),
        "drop": "-25%",
        "saved": 50,
        "active": True,
        "first_seen": datetime.now().isoformat(),
    }


def insert_price_record(product_id: int, price: float) -> dict:
    """Adds a new price entry with the current timestamp."""
    # TODO: INSERT INTO price_history
    return {
        "product_id": product_id,
        "price": price,
        "recorded_at": datetime.now().isoformat(),
    }


def get_price_history(product_id: int) -> list[dict]:
    """Retrieves the product's historical price records."""
    # TODO: SELECT * FROM price_history WHERE product_id = ? ORDER BY recorded_at
    return [
        {"month": "Nov", "price": 240, "recorded_at": "2025-11-01"},
        {"month": "Dec", "price": 299, "recorded_at": "2025-12-01"},
        {"month": "Jan", "price": 235, "recorded_at": "2026-01-01"},
        {"month": "Feb", "price": 215, "recorded_at": "2026-02-01"},
        {"month": "Mar", "price": 229, "recorded_at": "2026-03-01"},
        {"month": "Today", "price": 179, "recorded_at": datetime.now().isoformat()},
    ]


def get_tracked_products() -> list[dict]:
    """Returns every product currently on the watchlist."""
    # TODO: SELECT from products
    return [
        {"id": 1, "name": "Minimalist Desk Lamp", "drop": "-18%", "saved": 28, "active": True, "target_price": 1800, "price": 2100},
        {"id": 2, "name": "Mechanical Keycap Set", "drop": "-30%", "saved": 45, "active": True, "target_price": 900, "price": 1200},
        {"id": 3, "name": "Portable SSD 2TB", "drop": "-22%", "saved": 52, "active": False, "target_price": 6500, "price": 7999},
    ]
