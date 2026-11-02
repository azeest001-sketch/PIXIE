"""
database.py
-----------
Saves tracked products and every price check in a SQLite file.

Other modules call these functions. They do not need to know SQL.
"""

import os
import sqlite3
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

# .env lives in the project root, one folder above backend/
PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")

DATABASE_PATH = os.getenv("DATABASE_PATH", "backend/data/pixie.db")


def get_db_path() -> Path:
    """Find the database file and create its folder if needed."""
    path = Path(DATABASE_PATH)
    if not path.is_absolute():
        path = PROJECT_ROOT / path
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def connect() -> sqlite3.Connection:
    """Open the database. Rows can be read by column name."""
    connection = sqlite3.connect(get_db_path())
    connection.row_factory = sqlite3.Row
    return connection


def create_tables() -> None:
    """Create the two tables the first time the app starts."""
    with connect() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                platform TEXT NOT NULL,
                external_id TEXT NOT NULL,
                url TEXT,
                target_price REAL NOT NULL,
                mrp REAL,
                first_seen TEXT NOT NULL,
                active INTEGER NOT NULL DEFAULT 1,
                UNIQUE(platform, external_id)
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS price_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                price REAL NOT NULL,
                recorded_at TEXT NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
            """
        )
        columns = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(products)")
        }
        if "drop_goal_percent" not in columns:
            connection.execute(
                "ALTER TABLE products ADD COLUMN drop_goal_percent REAL"
            )
        columns = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(products)")
        }
        if "pair_id" not in columns:
            # Two rows with the same pair_id are the same product on both stores.
            connection.execute("ALTER TABLE products ADD COLUMN pair_id TEXT")
        columns = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(products)")
        }
        if "image_url" not in columns:
            # The store photo. The API sends this with the product.
            connection.execute("ALTER TABLE products ADD COLUMN image_url TEXT")
        # Older rows only stored the target price. Fill the percent from that target
        # and the first price saved when the product was tracked.
        for row in connection.execute(
            "SELECT id, target_price, drop_goal_percent FROM products"
        ):
            if row["drop_goal_percent"] is not None:
                continue
            first = first_price(connection, row["id"])
            target = row["target_price"]
            if not first or target is None:
                continue
            percent = round((1 - float(target) / float(first)) * 100)
            connection.execute(
                "UPDATE products SET drop_goal_percent = ? WHERE id = ?",
                (percent, row["id"]),
            )


def drop_saved(list_price: float, price: float) -> tuple[str, float]:
    """
    drop is a string like '-20%' for the watchlist.
    saved is how many rupees below the list price the product is.
    """
    if not list_price:
        return "0%", 0
    percent = round((price - list_price) / list_price * 100)
    saved = round(max(list_price - price, 0), 2)
    return f"{percent}%", saved


def latest_price(connection: sqlite3.Connection, product_id: int) -> float | None:
    row = connection.execute(
        """
        SELECT price FROM price_history
        WHERE product_id = ?
        ORDER BY recorded_at DESC, id DESC
        LIMIT 1
        """,
        (product_id,),
    ).fetchone()
    if row is None:
        return None
    return float(row["price"])


def first_price(connection: sqlite3.Connection, product_id: int) -> float | None:
    row = connection.execute(
        """
        SELECT price FROM price_history
        WHERE product_id = ?
        ORDER BY recorded_at ASC, id ASC
        LIMIT 1
        """,
        (product_id,),
    ).fetchone()
    if row is None:
        return None
    return float(row["price"])


def as_product(connection: sqlite3.Connection, row: sqlite3.Row) -> dict:
    """Turn one database row into the dictionary the UI already expects."""
    price = latest_price(connection, row["id"])
    if price is None:
        price = 0
    list_price = float(row["mrp"]) if row["mrp"] else (first_price(connection, row["id"]) or price)
    drop, saved = drop_saved(list_price, price)
    return {
        "id": row["id"],
        "title": row["title"],
        "name": row["title"],
        "platform": row["platform"],
        "external_id": row["external_id"],
        "url": row["url"],
        "target_price": row["target_price"],
        "drop_goal_percent": row["drop_goal_percent"],
        "price": price,
        "mrp": row["mrp"],
        "drop": drop,
        "saved": saved,
        "active": bool(row["active"]),
        "first_seen": row["first_seen"],
        "pair_id": row["pair_id"] if "pair_id" in row.keys() else None,
        "image_url": row["image_url"] if "image_url" in row.keys() else "",
    }


def insert_product(product: dict, target_price: float, drop_goal_percent: float = 25) -> dict:
    """
    Save a product if this Amazon or Flipkart id is new.
    If it is already tracked, update the title and target price and return that row.
    """
    now = datetime.now().isoformat(timespec="seconds")
    platform = product.get("platform") or "amazon"
    external_id = product.get("external_id") or ""
    title = product.get("title") or "Tracked product"
    url = product.get("url") or ""
    mrp = product.get("mrp")
    image_url = product.get("image_url") or ""

    with connect() as connection:
        existing = connection.execute(
            """
            SELECT * FROM products
            WHERE platform = ? AND external_id = ?
            """,
            (platform, external_id),
        ).fetchone()

        if existing is None:
            cursor = connection.execute(
                """
                INSERT INTO products
                    (title, platform, external_id, url, target_price, drop_goal_percent, mrp, image_url, first_seen, active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                """,
                (title, platform, external_id, url, target_price, drop_goal_percent, mrp, image_url, now),
            )
            product_id = cursor.lastrowid
        else:
            product_id = existing["id"]
            connection.execute(
                """
                UPDATE products
                SET title = ?, url = ?, target_price = ?, drop_goal_percent = ?, mrp = ?,
                    image_url = CASE WHEN ? != '' THEN ? ELSE image_url END
                WHERE id = ?
                """,
                (title, url, target_price, drop_goal_percent, mrp, image_url, image_url, product_id),
            )

        row = connection.execute(
            "SELECT * FROM products WHERE id = ?",
            (product_id,),
        ).fetchone()
        return as_product(connection, row)


def insert_price_record(product_id: int, price: float) -> dict:
    """Add one price check for a product."""
    recorded_at = datetime.now().isoformat(timespec="seconds")
    with connect() as connection:
        connection.execute(
            """
            INSERT INTO price_history (product_id, price, recorded_at)
            VALUES (?, ?, ?)
            """,
            (product_id, price, recorded_at),
        )
    return {
        "product_id": product_id,
        "price": price,
        "recorded_at": recorded_at,
    }


def month_label(recorded_at: str, is_latest: bool) -> str:
    """The chart shows 'Today' on the newest point and a short month name on older ones."""
    if is_latest:
        return "Today"
    try:
        when = datetime.fromisoformat(recorded_at)
    except ValueError:
        return recorded_at[:7]
    return when.strftime("%b")


def get_price_history(product_id: int) -> list[dict]:
    """Return every saved price for one product, oldest first."""
    with connect() as connection:
        rows = connection.execute(
            """
            SELECT price, recorded_at FROM price_history
            WHERE product_id = ?
            ORDER BY recorded_at ASC, id ASC
            """,
            (product_id,),
        ).fetchall()

    history = []
    last_index = len(rows) - 1
    for index, row in enumerate(rows):
        recorded_at = row["recorded_at"]
        history.append(
            {
                "month": month_label(recorded_at, index == last_index),
                "price": row["price"],
                "recorded_at": recorded_at,
            }
        )
    return history


def get_product(product_id: int) -> dict | None:
    """Return one saved product, or None if that id is not tracked."""
    with connect() as connection:
        row = connection.execute(
            "SELECT * FROM products WHERE id = ?",
            (product_id,),
        ).fetchone()
        if row is None:
            return None
        return as_product(connection, row)


def set_pair(product_id: int, pair_id: str | None) -> None:
    """Link this product to the same item on the other store."""
    with connect() as connection:
        connection.execute(
            "UPDATE products SET pair_id = ? WHERE id = ?",
            (pair_id, product_id),
        )


def get_partner(product_id: int) -> dict | None:
    """The other store's row that shares this product's pair_id."""
    with connect() as connection:
        row = connection.execute(
            "SELECT pair_id FROM products WHERE id = ?",
            (product_id,),
        ).fetchone()
        if row is None or not row["pair_id"]:
            return None
        partner = connection.execute(
            """
            SELECT * FROM products
            WHERE pair_id = ? AND id != ?
            ORDER BY id ASC
            LIMIT 1
            """,
            (row["pair_id"], product_id),
        ).fetchone()
        if partner is None:
            return None
        return as_product(connection, partner)


def get_tracked_products() -> list[dict]:
    """Return every product on the watchlist, newest first."""
    with connect() as connection:
        rows = connection.execute(
            "SELECT * FROM products ORDER BY id DESC"
        ).fetchall()
        return [as_product(connection, row) for row in rows]


def set_drop_goal(product_id: int, drop_goal_percent: float) -> dict | None:
    """Set a product's target from its latest price and the chosen discount."""
    with connect() as connection:
        found = connection.execute(
            "SELECT id FROM products WHERE id = ?",
            (product_id,),
        ).fetchone()
        if found is None:
            return None
        price = latest_price(connection, product_id)
        if price is None:
            price = first_price(connection, product_id) or 0
        target_price = round(float(price) * (1 - drop_goal_percent / 100), 2)
        connection.execute(
            """
            UPDATE products
            SET target_price = ?, drop_goal_percent = ?
            WHERE id = ?
            """,
            (target_price, drop_goal_percent, product_id),
        )
        row = connection.execute(
            "SELECT * FROM products WHERE id = ?",
            (product_id,),
        ).fetchone()
        return as_product(connection, row)


def set_product_active(product_id: int, active: bool) -> None:
    """Turn a watchlist item on or off. 1 means active, 0 means paused."""
    with connect() as connection:
        connection.execute(
            "UPDATE products SET active = ? WHERE id = ?",
            (1 if active else 0, product_id),
        )


def delete_product(product_id: int) -> bool:
    """Remove one product and every price saved for it."""
    with connect() as connection:
        found = connection.execute(
            "SELECT id FROM products WHERE id = ?",
            (product_id,),
        ).fetchone()
        if found is None:
            return False
        connection.execute(
            "DELETE FROM price_history WHERE product_id = ?",
            (product_id,),
        )
        connection.execute(
            "DELETE FROM products WHERE id = ?",
            (product_id,),
        )
    return True
