"""
notifier.py
-----------
Sends the price email.

monitor.py decides that the price changed, then calls send_price_alert().
This file only writes the email. It does not look up prices.

Two price messages:
  a drop that is still above the target
  a drop that has reached the chosen discount
"""

import os
import smtplib
from email.message import EmailMessage
from pathlib import Path

from dotenv import load_dotenv

# Read the project .env every time, so a new app password is picked up
# without leftover empty values from an earlier start.
ENV_PATH = Path(__file__).resolve().parents[2] / ".env"


def rupees(amount: float) -> str:
    """Show a price the way the page does, for example ₹524."""
    number = float(amount)
    if number.is_integer():
        return f"₹{number:,.0f}"
    return f"₹{number:,.2f}"


def mail_settings() -> dict:
    """Read the Gmail settings from .env. Empty values mean email is not set up yet."""
    load_dotenv(ENV_PATH, override=True)
    # Google prints the app password in groups of four. The real password has no spaces.
    password = os.getenv("SMTP_PASSWORD", "").replace(" ", "").strip()
    username = os.getenv("SMTP_EMAIL", "").strip()
    return {
        "host": os.getenv("SMTP_HOST", "smtp.gmail.com").strip() or "smtp.gmail.com",
        "port": int(os.getenv("SMTP_PORT", "587")),
        "username": username,
        "password": password,
        "from_email": os.getenv("ALERT_FROM_EMAIL", "").strip() or username,
        "to_email": os.getenv("ALERT_TO_EMAIL", "").strip() or username,
    }


def alert_lines(product: dict, price: float, reached_target: bool) -> list[str]:
    """The words in the email. The first line depends on the discount target."""
    title = product.get("title") or product.get("name") or "Tracked product"
    store = (product.get("platform") or "store").capitalize()
    target = product.get("target_price")
    link = product.get("url") or ""
    if reached_target:
        opening = f"{title} hit your target discount."
    else:
        opening = f"{title} price dropped. It is still above your target."
    lines = [
        opening,
        f"Store: {store}",
        f"Price now: {rupees(price)}",
    ]
    if target is not None:
        lines.append(f"Your target: {rupees(target)}")
    if link:
        lines.append(f"Link: {link}")
    return lines


def send_email(subject: str, body: str) -> dict:
    """Send one email. A missing password returns sent=False and does not raise."""
    settings = mail_settings()
    result = {"sent": False, "to": settings["to_email"], "message": ""}

    missing = []
    if not settings["username"]:
        missing.append("SMTP_EMAIL")
    if not settings["password"]:
        missing.append("SMTP_PASSWORD")
    if not settings["to_email"]:
        missing.append("ALERT_TO_EMAIL")
    if missing:
        result["message"] = "Email not sent. Fill in " + ", ".join(missing) + " in .env."
        return result

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings["from_email"]
    message["To"] = settings["to_email"]
    message.set_content(body)

    try:
        # Port 587 starts a normal connection, then upgrades it with starttls.
        with smtplib.SMTP(settings["host"], settings["port"], timeout=20) as server:
            server.starttls()
            server.login(settings["username"], settings["password"])
            server.send_message(message)
    except Exception as error:
        result["message"] = f"Email could not be sent: {error}"
        return result

    result["sent"] = True
    result["message"] = f"Email sent to {settings['to_email']}."
    return result


def send_connection_email() -> dict:
    """The message sent when Connect email is pressed on the page."""
    result = send_email(
        "PIXIE: Email connected",
        "Email has been successfully connected from PIXIE.",
    )
    if result["sent"]:
        result["message"] = "Email has been successfully connected from PIXIE."
    return result


def send_price_alert(product: dict, price: float, reached_target: bool = False) -> dict:
    """
    Email ALERT_TO_EMAIL about a price drop.

    reached_target=False means the price fell but is still above the discount.
    reached_target=True means the chosen discount has been met.
    A failed email does not stop the price check.
    """
    title = product.get("title") or product.get("name") or "Tracked product"
    if reached_target:
        subject = f"PIXIE: {title} hit your target"
    else:
        subject = f"PIXIE: {title} price dropped"
    sent = send_email(subject, "\n".join(alert_lines(product, price, reached_target)))
    return {
        "sent": sent["sent"],
        "product": title,
        "price": price,
        "to": sent["to"],
        "reached_target": reached_target,
        "message": sent["message"],
    }
