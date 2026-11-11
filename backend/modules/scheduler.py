"""
MODULE 6: scheduler.py

--> Triggers price fetches and checks at set clock times, so tracked products are monitored automatically.
--> At each scheduled time it calls monitor.check_tracked_products().
"""
#----------------------------------------------------------------------------------------------------------------------------------------

import os
from dotenv import load_dotenv

from . import database
from .monitor import check_tracked_products
#----------------------------------------------------------------------------------------------------------------------------------------

#----------------------------------------------------------------------------------------------------------------------------------------

load_dotenv()
TIMEZONE = os.getenv("SCHEDULER_TIMEZONE", "Asia/Kolkata")

#----------------------------------------------------------------------------------------------------------------------------------------

def get_check_times() -> list[str]:
    # Default: 2 checks/day (fits the Amazon 100 requests/month plan)
    raw = os.getenv("CHECK_TIMES", "10:30,22:30")
    return [part.strip() for part in raw.split(",") if part.strip()]

#----------------------------------------------------------------------------------------------------------------------------------------

def run_check() -> None:
    """One scheduled run. Errors are caught so the scheduler keeps going."""
    print("[scheduler] Running price check...")
    try:
        results = check_tracked_products()
        print(f"[scheduler] Check done: {len(results)} products.")
    except Exception as e:
        print(f"[scheduler] Check failed: {e}")

#----------------------------------------------------------------------------------------------------------------------------------------

def start_scheduler() -> None:
    """
    Start the clock-based trigger(blocks until stopped with Ctrl+C).
    Needs: pip install "apscheduler<4"
    """
    from apscheduler.schedulers.blocking import BlockingScheduler
    scheduler = BlockingScheduler(timezone=TIMEZONE)

    valid_times = []
    
    for hhmm in get_check_times():
        try:
            hour, minute = hhmm.split(":")
            scheduler.add_job(
                run_check, "cron",
                hour=int(hour), minute=int(minute),
                misfire_grace_time=3600,   # still run if up to 1h late (e.g. laptop was busy)
                coalesce=True,             # if several runs were missed, run only once
                max_instances=1,           # never overlap two checks
            )
            valid_times.append(hhmm)
        except ValueError:
            print(f"[scheduler] Ignoring invalid time: {hhmm}")
    
    if not valid_times:
        print("[scheduler] No valid CHECK_TIMES set. Not starting.")
        return
    
    database.create_tables()
    print(f"[scheduler] Daily checks at {valid_times} ({TIMEZONE}). Ctrl+C to stop.")
    
    # Optional: one immediate check on startup (costs a full cycle of API calls)
    if os.getenv("RUN_ON_START", "false").lower() == "true":
        run_check()
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        print("[scheduler] Stopped.")
#----------------------------------------------------------------------------------------------------------------------------------------