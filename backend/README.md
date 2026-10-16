# PIXIE backend

Starting points only. Each file has a `TODO` for a teammate.

| Module | Feature | You implement |
| --- | --- | --- |
| `modules/url_handler.py` | Collector | `detect_platform`, `extract_product_id` |
| `modules/api_client.py` | Collector | RapidAPI `fetch_<platform>_product`, `normalize_response` |
| `modules/database.py` | Storage | sqlite `products` + `price_history` |
| `modules/analytics.py` | Analytics | volatility, % change, deal score |
| `modules/notifier.py` | Alert | Gmail via smtplib |
| `modules/monitor.py` | Collector + Alert | `check_tracked_products`, interval loop |
| `modules/scheduler.py` | Scheduler | clock times only → `check_tracked_products()` |
| `dashboard.py` | Dashboard | Streamlit + Plotly (optional) |
| `app.py` | UI bridge | keep these routes; do not rename them |

`scheduler.py` does **not** fetch prices. It only decides **when** to run.

## Run

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app:app --reload --port 8001
```

API: http://127.0.0.1:8000/docs

Put RapidAPI and Gmail keys in the repo-root `.env` (copy from `.env.example`).
