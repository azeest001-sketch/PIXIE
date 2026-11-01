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

import re
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

MAX_RETRIES = 2        # retry limit
RETRY_DELAY = 2        # seconds between tries
TIMEOUT = 30           # seconds per request

SUPPORTED_PLATFORMS = ("amazon", "flipkart")

# Product-details endpoint for each platform.
PROD_ENDPOINTS = {
    "amazon":   {"method": "GET",  "path": "/product-details", "id_param": "asin"},
    "flipkart": {"method": "POST", "path": "/flipkart/v1/product", "id_param": "itm_id"},
}

# Search endpoint for each platform
SEARCH_ENDPOINTS = {
    "amazon":   {"method": "GET",  "path": "/search", "query_param": "query"},
    "flipkart": {"method": "POST", "path": "/flipkart/v1/search", "query_param": "q"},
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
"""GET or POST request, with up to MAX_RETRIES attempts.
GET sends params in the URL, POST sends them as JSON body.
Returns parsed JSON (dict) or None on failure.
Error handling messages for potential errors"""

def send_request(platform, path, params, method="GET"):
    key = load_api_key()
    if key is None:
        return None

    host = HOSTS.get(platform)
    if not host:
        print(f"[api_client] No RapidAPI host set for {platform}.")
        return None

    headers = {"x-rapidapi-key": key, "x-rapidapi-host": host}
    if method == "POST":
        headers["Content-Type"] = "application/json"
    url = f"https://{host}{path}"

    for attempt in range(1, MAX_RETRIES + 1):
            try:
                if method == "POST":
                    response = requests.post(url, headers=headers, json=params, timeout=TIMEOUT)
                else:
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
                    data = response.json()
                except ValueError:
                    print("[api_client] Response was not valid JSON.")
                    return None
                if isinstance(data, dict) and data.get("ok") is False:
                    print("[api_client] API returned ok=false.")
                    return None
                return data
                
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
        # Flipkart Product Data API: everything is inside data["product"]
        p = data.get("product")
        if not isinstance(p, dict):
            print("[api_client] Flipkart response has no 'product' object.")
            return None

        title = p.get("title")
        if title:
            # remove SEO suffix: "... Online at Best Price On Flipkart.com"
            title = re.sub(r"\s*Online at Best Price.*$", "", title, flags=re.I).strip()

        price = clean_price(p.get("price"))
        mrp = clean_price(p.get("mrp"))
        images = p.get("images") or []
        image_url = p.get("image") or (images[0] if images else "")
        if image_url.startswith("http://"):
            image_url = "https://" + image_url[len("http://"):]
        product_url = p.get("url")
        currency = p.get("currency") or "INR"
        in_stock = p.get("in_stock")   #already True/False
        external_id = p.get("itm_id") or product_id

    else:
        print(f"[api_client] Unsupported platform: {platform}")
        return None
    
    if price is None:
        print("[api_client] Price missing in response.")
        return None
    
    # Convert relative URL into a full URL
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
    endpoint = PROD_ENDPOINTS[platform]
    params = {endpoint["id_param"]: product_id}

    if platform == "amazon":
        params["country"] = "IN"   # country is a required param by Amazon API endpoint

    return send_request(platform, endpoint["path"], params, endpoint["method"])
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
def search_product(platform, query):
    """
    Search one store by a short product name.
    Returns a list of raw result dicts, or None when the search fails.
    Amazon prices are for India (country=IN). The result list is inside
    data.products (Amazon) or data.results (Flipkart).
    analytics.py decides which result is the same item.
    price comparison across platforms
    """
    if platform not in SUPPORTED_PLATFORMS:
        print(f"[api_client] Unsupported platform: {platform}")
        return None

    ep = SEARCH_ENDPOINTS[platform]
    params = {ep["query_param"]: query}
    if platform == "amazon":
        params["country"] = "IN"
    
    raw = send_request(platform, ep["path"], params, ep["method"])
    if not isinstance(raw, dict):
        return None
    
    data = raw.get("data")
    if isinstance(data, dict):
        products = data.get("products") or data.get("results")
        if isinstance(products, list):
            return products
    if isinstance(data, list):
        return data
    return []
#----------------------------------------------------------------------------------------------------------------------------------------
