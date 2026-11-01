"""
MODULE 5: monitor.py

--> check_tracked_products() pulls all tracked products' rows from database.py, 
calls api_client for the current price, compares it to the target_price, 
stores a history row, and calls notifier.send_price_alert() if the price dropped to target_price.

--> run_monitoring_loop() is the interval loop (while True + time.sleep).

"""
#----------------------------------------------------------------------------------------------------------------------------------------
# IMPORTS

import time
import os
from dotenv import load_dotenv

from . import database, api_client, notifier

#----------------------------------------------------------------------------------------------------------------------------------------

load_dotenv()


def check_tracked_products() -> list[dict]:
    
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
