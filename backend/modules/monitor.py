"""
MODULE 5: monitor.py

--> check_tracked_products() pulls tracked products' rows from database.py, 
calls api_client for the current price, compares it to target_price, 
stores a history row, and calls notifier.send_price_alert() if the price dropped to target_price.

"""
#----------------------------------------------------------------------------------------------------------------------------------------
#IMPORTS

import time
from . import database, api_client, notifier
#----------------------------------------------------------------------------------------------------------------------------------------
CALL_GAP = 0.5   # seconds between API calls (Flipkart Rate limit allows 5/sec)
#----------------------------------------------------------------------------------------------------------------------------------------

def check_tracked_products() -> list[dict]:
    results = []
    for product in database.get_tracked_products():
        platform = product.get("platform")
        external_id = product.get("external_id")
        target_price = product.get("target_price")
        
        result = {
            "product_id": product.get("id"),
            "title": product.get("name") or product.get("title"),
            "current_price": None,
            "target_price": target_price,
            "dropped": False,
            "alert": None,
        }
        try:
            data = api_client.get_product_data(platform, external_id)   # 1 API request
        except Exception as e:
            print(f"[monitor] Error fetching {platform}/{external_id}: {e}")
            data = None
        
        if data is None:
            print(f"[monitor] Skipping {product.get('id')}: fetch failed.")
            results.append(result)
            time.sleep(CALL_GAP)
            continue
        
        # Out-of-stock prices can be stale -> don't save or alert on them
        if data.get("in_stock") is False:
            print(f"[monitor] {product.get('id')} is out of stock, skipping.")
            results.append(result)
            time.sleep(CALL_GAP)
            continue
        
        price = data["price"]
        result["current_price"] = price
        
        # Save the real data point for the price history graph
        try:
            database.insert_price_record(product.get("id"), price)
        except Exception as e:
            print(f"[monitor] Could not save price for {product.get('id')}: {e}")
            results.append(result)
            time.sleep(CALL_GAP)
            continue
        
        # Alert if price reached the user's target
        if target_price is not None and price <= target_price:
            result["dropped"] = True
            result["alert"] = notifier.send_price_alert(product, price)
        
        results.append(result)
        time.sleep(CALL_GAP)
        
    return results
        
#----------------------------------------------------------------------------------------------------------------------------------------
