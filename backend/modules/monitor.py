"""
monitor.py
----------
FEATURE: Collector + Alert loop

check_tracked_products() pulls tracked rows, asks api_client for the
current price, compares to target_price, stores a history row, and
calls notifier.send_price_alert() if the price dropped.

run_monitoring_loop() is the interval loop (while True + time.sleep).
scheduler.py is separate — it only decides WHEN to call
check_tracked_products(), it does not fetch prices itself.
"""

import time
import os
from dotenv import load_dotenv

from . import database, api_client, notifier

load_dotenv()


def check_tracked_products() -> list[dict]:
    """
    Pull all tracked products from database.py, call api_client for the
    current price, compare to target_price, and alert if it dropped.
    """
    # TODO: replace this placeholder pass-through with real fetch + compare
    results = []
    for product in database.get_tracked_products():
        results.append(
            {
                "product_id": product.get("id"),
                "title": product.get("name") or product.get("title"),
                "current_price": product.get("price"),
                "target_price": product.get("target_price"),
                "dropped": False,
                "alert": None,
            }
        )
        # database.insert_price_record(...)
        # if current_price <= target_price: notifier.send_price_alert(...)
    return results


def run_monitoring_loop() -> None:
    """Runs forever, sleeping POLL_INTERVAL_SECONDS between checks."""
    interval = int(os.getenv("POLL_INTERVAL_SECONDS", "3600"))
    while True:
        check_tracked_products()
        time.sleep(interval)
