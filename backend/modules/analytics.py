"""
analytics.py
------------
FEATURE: Analytics (pandas)

TODO (owner): min/max, % change, volatility, drop/spike flags,
and a deal score for the dashboard.
"""


def calculate_volatility(product_id: int) -> dict:
    """Computes min/max price % change from history."""
    # TODO: load history via database.get_price_history, then pandas
    return {
        "product_id": product_id,
        "min_price": 179,
        "max_price": 299,
        "percent_change": -25.4,
        "volatility": 0.18,
        "deal_score": 9.8,
        "verdict": "Verified Real Deal",
    }
