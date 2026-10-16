"""
url_handler.py
--------------
FEATURE: Collector (parse incoming product links)

TODO (owner): identify Amazon / Flipkart from a URL
and pull the unique product id with platform-specific logic.
Do not fetch prices here.
"""


def detect_platform(url: str) -> str:
    """Identifies the URL's platform. Placeholder until a teammate implements it."""
    # TODO: parse hostname (amazon.in, flipkart.com, ...)
    return "amazon"


def extract_product_id(url: str) -> str:
    """Pulls the unique product id out of the URL using platform-specific logic."""
    # TODO: Amazon ASIN, Flipkart /p/itm..., etc.
    return "PLACEHOLDER_PRODUCT_ID"
