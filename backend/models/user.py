# User model definitions
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class User(BaseModel):
    user_id: Optional[str] = None
    id_number: Optional[int] = None  # Sequential user ID number
    username: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    is_verified: bool = False
    
    # === PHASE 2: MULTI-WALLET SUPPORT (EXACT SPECIFICATION) ===
    connected_wallets: List[dict] = []         # List of ConnectedWallet dicts
    primary_wallet_id: Optional[str] = None    # Primary wallet reference
    
    # === LEGACY FIELDS (MAINTAINED FOR BACKWARD COMPATIBILITY) ===
    wallet_address: Optional[str] = None       # DEPRECATED - will be removed after migration
    
    # === EXISTING FIELDS ===
    crypto_connected: bool = False
    bank_connected: bool = False
    verification_status: dict = {}
    membership_level: str = "basic"  # Default to basic instead of none
    total_investments: float = 0.0
    auth_type: Optional[str] = None
    created_at: Optional[str] = None

class UserPreferences(BaseModel):
    user_id: str
    theme: str = "dark"
    onboarding_complete: bool = False
    notifications_enabled: bool = True
    updated_at: Optional[datetime] = None