# PIXIE — group project

## Suggested ownership

| Person | Files |
| --- | --- |
| URL / platforms | `backend/modules/url_handler.py` |
| RapidAPI collector | `backend/modules/api_client.py` |
| Storage | `backend/modules/database.py` |
| Analytics | `backend/modules/analytics.py` |
| Email alerts | `backend/modules/notifier.py` |
| Monitor loop | `backend/modules/monitor.py` |
| Clock scheduler | `backend/modules/scheduler.py` |
| Dashboard | `backend/dashboard.py` + `pixie-banner-design` |

Keep function names from the spec. Return the same dict keys the UI already reads.

## Local setup

1. Copy `.env.example` → `.env` and add your RapidAPI key.
2. Backend: `python -m uvicorn app:app --reload --port 8001` from `backend/`.
3. UI: `npm run dev` in `pixie-banner-design` (proxies `/api` to port 8001).

Do not commit `.env`.
