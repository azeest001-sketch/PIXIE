"""
notifier.py
-----------
FEATURE: Alert (email / smtplib)

TODO (owner): compose and send a Gmail alert when price hits target_price.
Read SMTP_* keys from .env. Do not fetch prices here.
"""

import os
from dotenv import load_dotenv

load_dotenv()


def send_price_alert(product: dict, price: float) -> dict:
    """Composes and sends an email alert (via smtplib) for a price drop to target."""
    # TODO: smtplib + SMTP_EMAIL / SMTP_PASSWORD from .env
    return {
        "sent": False,
        "placeholder": True,
        "product": product.get("title") or product.get("name"),
        "price": price,
        "to": os.getenv("ALERT_TO_EMAIL", ""),
        "message": "Placeholder — email not sent yet.",
    }
