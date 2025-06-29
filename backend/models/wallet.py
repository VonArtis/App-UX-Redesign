# Wallet and crypto model definitions
from pydantic import BaseModel
from typing import Optional, List

# === PHASE 2: MULTI-WALLET MODELS (EXACT SPECIFICATION) ===

class ConnectedWallet(BaseModel):
    id: str                                    # Unique wallet ID
    type: str                                  # 'metamask', 'trustwallet', etc.
    address: str                               # Wallet address
    name: Optional[str] = None                 # User-defined name
    is_primary: bool = False                   # Primary wallet flag
    networks: List[str] = []                   # Supported networks
    connected_at: str                          # Connection timestamp
    last_used: Optional[str] = None            # Last usage timestamp
    balance_cache: Optional[dict] = {}         # Cached balance data

# === EXISTING MODELS (MAINTAINED FOR COMPATIBILITY) ===

class WalletVerification(BaseModel):
    message: str
    signature: str
    address: str

class CryptoAsset(BaseModel):
    symbol: str
    name: str
    balance: float
    usd_value: float
    price_per_token: Optional[float] = None

class WalletBalance(BaseModel):
    address: str
    total_usd_value: float
    assets: List[CryptoAsset]

class BankAccount(BaseModel):
    id: Optional[str] = None
    account_name: str
    account_type: str
    balance: float
    currency: str = "USD"
    last_updated: Optional[str] = None