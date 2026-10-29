"""
MODULE 1: url_handler.py 

Validates the pasted product URL, 
Detects the platform, 
Cleans the URL of unnecessary junk, and 
Extracts the product ID.
"""
#----------------------------------------------------------------------------------------------------------------------------------------
#IMPORTS

import re                                                                   #used to pull the ID out of the path
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse          

#----------------------------------------------------------------------------------------------------------------------------------------

#Supported Platforms and their domains:
PLATFORMS = {                           
    "amazon": ["amazon.in", "amazon.com"],
    "flipkart": ["flipkart.com"],
}

#----------------------------------------------------------------------------------------------------------------------------------------
#FORMAT/PATTERNS 

AMAZON_ID = re.compile(r"/(?:dp|gp/product|gp/aw/d)/([A-Z0-9]{10})")  # to match common Amazon URL formats,extract 10-char long productID
FLIPKART_KEEP = ("pid", "lid")     # parameters that identify the product/variant

#----------------------------------------------------------------------------------------------------------------------------------------

#CUSTOM EXCEPTIONS:

class InvalidURLError(Exception):
    pass

class UnsupportedPlatformError(Exception):
    pass
#----------------------------------------------------------------------------------------------------------------------------------------

#SUPPORTING FUNCTIONS:

def normalize(url):
    """Trim spaces and add https:// if missing."""
    url = (url or "").strip()                                # (url or "") converts None to "" so .strip() doesn't crash
    if url and not url.startswith(("http://", "https://")):    
        url = "https://" + url                                      # Why: without this urlparse can't read the domain correctly
    return url


def clean_url(url, platform, product_id):
    """Strip tracking codes, keep exact product/variant details."""
    p = urlparse(url)
    if platform == "amazon":
        # ASIN already identifies the exact variant
        return f"https://{p.netloc}/dp/{product_id}"
    # Flipkart: keep path + pid/lid only
    q = parse_qs(p.query)
    kept = {k: q[k][0] for k in FLIPKART_KEEP if k in q}
    return urlunparse(("https", p.netloc, p.path, "", urlencode(kept), ""))  # joins the relevant text back into URL form

#----------------------------------------------------------------------------------------------------------------------------------------

#CORE FUNCTIONS:

def is_valid_url(url):
    try:
        p = urlparse(url)
        return p.scheme in ("http", "https") and "." in p.netloc    
        # netloc(Network Location)--specifies the exact server or network endpoint that a request should be directed to.
    
    except Exception:           # just returns False instead of crashing if parsing fails.
        return False


def detect_platform(url):
    host = urlparse(url).netloc.lower()     # gets the domain in lowercase
    for name, domains in PLATFORMS.items():
        if any(host == d or host.endswith("." + d) for d in domains):   # checks from valid platform names,domains
            return name                                                 #returns detected platform name
    return None


def extract_product_id(url, platform):
    if platform == "amazon":
        m = AMAZON_ID.search(urlparse(url).path)        # searches for matching format pattern, in the path part, of the parsed URL.
        return m.group(1) if m else None                # returns the captured ASIN code if match found.
    if platform == "flipkart":
        return parse_qs(urlparse(url).query).get("pid", [None])[0]  #parses the query part of URL, retrieves the value(ID) for key pid
    return None

#----------------------------------------------------------------------------------------------------------------------------------------

# MAIN ENTRY POINT:

def process_url(raw_url):
    """Returns dict or raises a clear error."""
    url = normalize(raw_url)
    if not is_valid_url(url):
        raise InvalidURLError("Invalid URL format.")

    platform = detect_platform(url)
    if platform is None:
        raise UnsupportedPlatformError("Sorry! Only Amazon and Flipkart are supported.")

    product_id = extract_product_id(url, platform)
    if not product_id:
        raise InvalidURLError("Could not find a product ID. Please use a direct product page link.")

    return {
        "platform": platform,
        "product_id": product_id,
        "clean_url": clean_url(url, platform, product_id),
    }

#----------------------------------------------------------------------------------------------------------------------------------------
