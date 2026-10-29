"""
MODULE 2: api_client.py

Loads the API key and the platform's host from .env,
Sends the API request to the platform using the product ID recieved from url_handler,
Fetches the product details(title, current price,..etc.)with a timestamp,
Retries for failed requests(up to 3 times)and handles errors,
Normalizes the raw API response into a common format for other modules,
Supplies the price data points that database.py stores as price history & analytics.py analyses.

""" 
#----------------------------------------------------------------------------------------------------------------------------------------
# IMPORTS

import os
import time
from datetime import datetime
import requests
#----------------------------------------------------------------------------------------------------------------------------------------
# ENVIRONMENT SETUP

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # fall back to normal environment variables

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "")

# Each platform can use its own RapidAPI host
HOSTS = {
    "amazon":   os.getenv("AMAZON_RAPIDAPI_HOST", ""),
    "flipkart": os.getenv("FLIPKART_RAPIDAPI_HOST", ""),
}

MAX_RETRIES = 3        # retry limit
RETRY_DELAY = 2        # seconds between tries
TIMEOUT = 10           # seconds per request

SUPPORTED_PLATFORMS = ("amazon", "flipkart")

# Endpoint + id parameter name for each platform

ENDPOINTS = {
    "amazon":   {"path": "/product-details", "id_param": "asin"},
    "flipkart": {"path": "/backend/rapidapi/product-details", "id_param": "pid"},
}
#----------------------------------------------------------------------------------------------------------------------------------------

# API KEY CHECK

def load_api_key():
    """Return the API key or None if missing."""
    if not RAPIDAPI_KEY:
        print("[api_client] API key not found. Set RAPIDAPI_KEY in .env") 
        return None
    return RAPIDAPI_KEY

#----------------------------------------------------------------------------------------------------------------------------------------
# SEND REQUEST
"""GET request for product details, with up to MAX_RETRIES attempts.
Returns parsed JSON (dict) or None on failure.
Error handling messages for potential errors"""

def send_request(platform, path, params):
    key = load_api_key()
    if key is None:
        return None

    host = HOSTS.get(platform)
    if not host:
        print(f"[api_client] No RapidAPI host set for {platform}.")
        return None

    headers = {"x-rapidapi-key": key, "x-rapidapi-host": host}
    url = f"https://{host}{path}"

    for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = requests.get(url, headers=headers, params=params, timeout=TIMEOUT)
    
                # Bad key / no access (cannot retry here; need to check valid api and permissions)
                if response.status_code in (401, 403):
                    print("[api_client] Invalid API key or no access.")
                    return None
    
                # Rate limit or server error (can retry)
                if response.status_code == 429 or response.status_code >= 500:
                    print(f"[api_client] Status {response.status_code} (try {attempt}/{MAX_RETRIES})")
                    time.sleep(RETRY_DELAY)
                    continue
    
                # Other client errors (404 etc.) -> product not found / bad request
                if response.status_code != 200:
                    print(f"[api_client] Request failed: {response.status_code}")
                    return None
    
                # <<< Valid response >>> --> parse JSON
                try:
                    return response.json()
                except ValueError:
                    print("[api_client] Response was not valid JSON.")
                    return None
                
            except (requests.ConnectionError, requests.Timeout):
                print(f"[api_client] Connection problem (try {attempt}/{MAX_RETRIES})")
                time.sleep(RETRY_DELAY)
    
    print("[api_client] All retries failed.")
    return None

#----------------------------------------------------------------------------------------------------------------------------------------
#RESPONSE CLEAN-UP

def clean_price(value):
    """'₹1,299.00' -> 1299.0,
    returns None if it can't be converted."""
    if value is None:
        return None
    if isinstance(value, (int, float)):   #checks the type of value-if it's either int/float
        return float(value)
    cleaned = "".join(ch for ch in str(value) if ch.isdigit() or ch == ".")
    try:
        return float(cleaned)
    except ValueError:
        return None
    
#----------------------------
def normalize_response(raw, platform=None, product_id=None):
    """
    --> Converts a raw API response into readable product format.
    --> Platform & product_id are only copied into the output dict.
    """
    data = raw.get("data") if isinstance(raw, dict) else None
    if not isinstance(data, dict):
        print("[api_client] Response has no product data.")
        return None

    # Extract platform-specific fields
    if platform == "amazon":
        title = data.get("product_title")
        price = clean_price(data.get("product_price"))
        mrp = clean_price(data.get("product_original_price"))
        image_url = data.get("product_photo", "")
        product_url = data.get("product_url")
        currency = data.get("currency") or "INR"
        availability = data.get("product_availability")
        in_stock = (
            availability.strip().lower() == "in stock"
            if isinstance(availability, str)
            else None
        )
        external_id = data.get("asin") or product_id

    elif platform == "flipkart":
        page_content = data.get("page_content") or {}
        title = page_content.get("title")
        price = clean_price(data.get("selling_price"))
        mrp = clean_price(data.get("mrp"))
        images = data.get("product_images") or []
        image_url = images[0] if images else ""
        product_url = data.get("url")
        currency = "INR"
        in_stock = None
        external_id = data.get("unique_identifier") or product_id

    else:
        print(f"[api_client] Unsupported platform: {platform}")
        return None
    
    if price is None:
        print("[api_client] Price missing in response.")
        return None
    
    # Convert Flipkart's relative URL into a full URL
    if platform == "flipkart" and product_url:
        if product_url.startswith("/"):
            product_url = "https://www.flipkart.com" + product_url
    
    return {
        "title": title,
        "platform": platform,
        "external_id": external_id,
        "price": price,
        "mrp": mrp,
        "currency": currency,
        "image_url": image_url,
        "store_name": platform,
        "in_stock": in_stock,
        "url": product_url,
        "fetched_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "raw": raw
    }
#----------------------------------------------------------------------------------------------------------------------------------------
#CORE FUNCTION

def fetch_product(platform, product_id):
    """Fetches the raw product response for the specified platform."""
    endpoint = ENDPOINTS[platform]
    params = {endpoint["id_param"]: product_id}

    if platform == "amazon":
        params["country"] = "IN"   # country is a required param by Amazon API endpoint

    return send_request(platform, endpoint["path"], params)
#----------------------------------------------------------------------------------------------------------------------------------------
# COMMON FUNCTIONS (used by other modules)

def get_product_data(platform, product_id):
    if platform not in SUPPORTED_PLATFORMS:
        print(f"[api_client] Unsupported platform: {platform}")
        return None
    if not product_id:
        print("[api_client] Missing product ID.")
        return None

    raw = fetch_product(platform, product_id)          # fetch_<platform>_product
    if raw is None:
        return None
    return normalize_response(raw, platform, product_id)   # normalize_response

#----------------------------
def get_current_price(platform, product_id):
    """Used by monitor.py: returns just the price (float) or None."""
    product = get_product_data(platform, product_id)
    return product["price"] if product else None

#----------------------------

#----Facing issues with search as the flipkart api doesn't support search endpoint---- 
def search_product(platform, query):
    """
    -->Used for the platform comparison: searches the OTHER platform by title.
    -->Returns the raw list of results (verification happens in analytics.py) or None.
    """
    if platform not in SUPPORTED_PLATFORMS:
        print(f"[api_client] Unsupported platform: {platform}")
        return None
    raw = send_request(platform, "/search", {"query": query})
    if raw is None:
        return None
    return raw.get("data", [])

#----------------------------------------------------------------------------------------------------------------------------------------
