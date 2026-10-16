"""
scheduler.py
------------
Separate module that triggers price fetches and checks at set clock times
so tracked products are monitored automatically.

It ONLY decides when to run. At each scheduled time it calls
monitor.check_tracked_products(). It does not talk to RapidAPI itself.

CHECK_TIMES in .env, e.g. 09:00,15:00,21:00
"""

import os
from dotenv import load_dotenv

from .monitor import check_tracked_products

load_dotenv()


def get_check_times() -> list[str]:
    raw = os.getenv("CHECK_TIMES", "09:00,15:00,21:00")
    return [part.strip() for part in raw.split(",") if part.strip()]


def start_scheduler() -> None:
    """
    Start the clock-based trigger.

    TODO (owner): use APScheduler / schedule to fire at get_check_times()
    and call check_tracked_products() each time. Do not put fetch logic here.
    """
    # from apscheduler.schedulers.blocking import BlockingScheduler
    # scheduler = BlockingScheduler()
    # for hhmm in get_check_times():
    #     hour, minute = hhmm.split(":")
    #     scheduler.add_job(check_tracked_products, "cron", hour=hour, minute=minute)
    # scheduler.start()
    print(f"[scheduler placeholder] would run check_tracked_products at {get_check_times()}")
    check_tracked_products()
