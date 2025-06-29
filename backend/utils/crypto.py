# Cryptocurrency utilities
import requests
from typing import Dict, Any, Optional

def get_crypto_prices(token_ids: str = "ethereum,bitcoin,usd-coin,chainlink,uniswap") -> Dict[str, Any]:
    """Fetch crypto prices from CoinGecko API"""
    try:
        url = "https://api.coingecko.com/api/v3/simple/price"
        params = {
            "ids": token_ids,
            "vs_currencies": "usd",
            "include_24hr_change": "true"
        }
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            # Fallback mock data
            return {
                "ethereum": {"usd": 2000.50, "usd_24h_change": 2.3},
                "bitcoin": {"usd": 65000.25, "usd_24h_change": -1.5},
                "usd-coin": {"usd": 1.00, "usd_24h_change": 0.01}
            }
    except Exception as e:
        print(f"Error fetching crypto prices: {e}")
        return {
            "ethereum": {"usd": 2000.50, "usd_24h_change": 2.3},
            "bitcoin": {"usd": 65000.25, "usd_24h_change": -1.5},
            "usd-coin": {"usd": 1.00, "usd_24h_change": 0.01}
        }

def calculate_portfolio_value(assets: list) -> float:
    """Calculate total portfolio value in USD"""
    return sum(asset.get("usd_value", 0) for asset in assets)