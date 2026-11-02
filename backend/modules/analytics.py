"""
analytics.py
------------
Reads saved prices from database.py and scores the deal.

This file does not call Amazon or Flipkart. It only looks at history
that is already stored.
"""

import pandas as pd

from . import database


def calculate_volatility(product_id: int) -> dict:
    """
    Summarize one product's price history.

    percent_change compares the newest price with the first saved price.
    volatility is how much the price jumps around (0 means it never moves).
    deal_score is out of 10. 10 means the newest price is the lowest seen.
    """
    history = database.get_price_history(product_id)
    if len(history) == 0:
        return {
            "product_id": product_id,
            "min_price": 0,
            "max_price": 0,
            "percent_change": 0,
            "volatility": 0,
            "deal_score": 0,
            "verdict": "Not enough history",
            "is_drop": False,
            "is_spike": False,
        }

    prices = pd.Series([point["price"] for point in history], dtype="float64")
    first_price = float(prices.iloc[0])
    latest_price = float(prices.iloc[-1])
    min_price = float(prices.min())
    max_price = float(prices.max())
    average_price = float(prices.mean())

    if first_price == 0:
        percent_change = 0.0
    else:
        percent_change = round((latest_price - first_price) / first_price * 100, 1)

    # ddof=0 so a single price does not produce an empty result
    if average_price == 0:
        volatility = 0.0
    else:
        volatility = round(float(prices.std(ddof=0)) / average_price, 2)

    if max_price == min_price:
        deal_score = 5.0
    else:
        how_close_to_lowest = (max_price - latest_price) / (max_price - min_price)
        deal_score = round(how_close_to_lowest * 10, 1)

    previous_price = float(prices.iloc[-2]) if len(prices) > 1 else first_price
    is_drop = latest_price < first_price
    is_spike = latest_price > previous_price and latest_price >= average_price

    if len(history) == 1:
        verdict = "First price saved"
    elif deal_score >= 8 and is_drop:
        verdict = "Verified Real Deal"
    elif is_spike:
        verdict = "Price spike — wait"
    elif is_drop:
        verdict = "Price is down"
    else:
        verdict = "Keep watching"

    return {
        "product_id": product_id,
        "min_price": min_price,
        "max_price": max_price,
        "percent_change": percent_change,
        "volatility": volatility,
        "deal_score": deal_score,
        "verdict": verdict,
        "is_drop": is_drop,
        "is_spike": is_spike,
    }
