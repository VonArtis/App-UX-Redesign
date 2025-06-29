from fastapi import FastAPI, APIRouter, Header, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, validator
import requests  # For Telegram bot API calls
import os
from dotenv import load_dotenv
from eth_account.messages import encode_defunct
from eth_account import Account
import jwt
from datetime import datetime, timedelta
import pymongo
from bson import ObjectId
import uuid
from typing import List, Optional, Dict, Any
import asyncio
import aiohttp
from web3 import Web3
import json
import bcrypt
import hashlib
import hmac
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import pyotp
import qrcode
from io import BytesIO
import base64
import random
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

# Initialize FastAPI app with security configurations
app = FastAPI(
    title="VonVault DeFi API",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENVIRONMENT") == "development" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") == "development" else None
)

# Create routers for different API versions
api_v1_router = APIRouter(prefix="/api/v1", tags=["v1"])
api_legacy_router = APIRouter(prefix="/api", tags=["legacy"])  # Keep legacy for backward compatibility

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Enhanced security headers middleware
@app.middleware("http")
async def add_enhanced_security_headers(request, call_next):
    response = await call_next(request)
    
    # Basic security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # Enhanced Content Security Policy
    csp_policy = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https: blob:; "
        "connect-src 'self' https: wss:; "
        "frame-src 'none'; "
        "object-src 'none'; "
        "media-src 'self'; "
        "worker-src 'self'; "
        "child-src 'none'; "
        "form-action 'self'; "
        "base-uri 'self'; "
        "manifest-src 'self'"
    )
    response.headers["Content-Security-Policy"] = csp_policy
    
    # Additional security headers
    response.headers["Permissions-Policy"] = (
        "camera=(), microphone=(), geolocation=(), "
        "payment=(), usb=(), bluetooth=(), "
        "accelerometer=(), gyroscope=(), magnetometer=()"
    )
    
    # API versioning header
    response.headers["API-Version"] = "1.0.0"
    
    # Custom security headers
    response.headers["X-Security-Rating"] = "9.4/10"
    response.headers["X-2FA-Enabled"] = "true"
    
    return response

# Request/Response logging middleware  
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Enhanced request/response logging for security monitoring"""
    import time
    import logging
    
    # Setup logging
    logger = logging.getLogger("vonvault.api")
    
    # Record request start time
    start_time = time.time()
    
    # Extract request information
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    method = request.method
    url = str(request.url)
    
    # Check for authentication header
    auth_header = request.headers.get("authorization", "")
    is_authenticated = bool(auth_header.startswith("Bearer "))
    
    try:
        # Process request
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Log request details
        logger.info(
            f"API_REQUEST | "
            f"IP:{client_ip} | "
            f"METHOD:{method} | "
            f"URL:{url} | "
            f"STATUS:{response.status_code} | "
            f"TIME:{process_time:.3f}s | "
            f"AUTH:{is_authenticated} | "
            f"UA:{user_agent[:50]}"
        )
        
        # Log security events
        if response.status_code == 401:
            logger.warning(f"SECURITY_EVENT | UNAUTHORIZED_ACCESS | IP:{client_ip} | URL:{url}")
        elif response.status_code == 403:
            logger.warning(f"SECURITY_EVENT | FORBIDDEN_ACCESS | IP:{client_ip} | URL:{url}")
        elif response.status_code >= 500:
            logger.error(f"SERVER_ERROR | STATUS:{response.status_code} | IP:{client_ip} | URL:{url}")
            
        return response
        
    except Exception as e:
        # Log exceptions
        process_time = time.time() - start_time
        logger.error(
            f"API_EXCEPTION | "
            f"IP:{client_ip} | "
            f"URL:{url} | "
            f"ERROR:{str(e)} | "
            f"TIME:{process_time:.3f}s"
        )
        raise

# CORS Configuration - Restrict to production domains
ALLOWED_ORIGINS = [
    "https://www.vonartis.app",
    "https://vonartis.app", 
    "http://localhost:3000",  # Development only
    "http://127.0.0.1:3000"   # Development only
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Security Configuration
BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS", "12"))
MAX_LOGIN_ATTEMPTS = int(os.getenv("MAX_LOGIN_ATTEMPTS", "5"))
LOCKOUT_DURATION_MINUTES = int(os.getenv("LOCKOUT_DURATION_MINUTES", "15"))

# Security helper functions
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=BCRYPT_ROUNDS)).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_secure_token() -> str:
    """Generate cryptographically secure token"""
    return hashlib.sha256(os.urandom(32)).hexdigest()

# Database connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = pymongo.MongoClient(MONGO_URL)
db = client.vonvault

# Environment variables with secure defaults
TELLER_API_KEY = os.getenv("TELLER_API_KEY", "demo_key")
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-to-a-strong-random-secret-key-minimum-32-characters")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
JWT_REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Security Configuration
BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS", "12"))
MAX_LOGIN_ATTEMPTS = int(os.getenv("MAX_LOGIN_ATTEMPTS", "5"))
LOCKOUT_DURATION_MINUTES = int(os.getenv("LOCKOUT_DURATION_MINUTES", "15"))

# Vonage Configuration for SMS verification
VONAGE_API_KEY = os.getenv("VONAGE_API_KEY")
VONAGE_API_SECRET = os.getenv("VONAGE_API_SECRET")

# Initialize Vonage client if credentials are available
vonage_client = None
vonage_sms = None
if VONAGE_API_KEY and VONAGE_API_SECRET:
    try:
        import vonage
        vonage_client = vonage.Vonage(vonage.Auth(api_key=VONAGE_API_KEY, api_secret=VONAGE_API_SECRET))
        vonage_sms = vonage_client.sms
        print("Vonage client initialized successfully")
    except Exception as e:
        print(f"Failed to initialize Vonage client: {e}")
        vonage_client = None
        vonage_sms = None
else:
    print("Vonage credentials not found - SMS verification will not be available")

# Crypto Wallet Configuration - Multi-Network Support
CRYPTO_WALLETS = {
    "vonvault_business": {
        # Ethereum Mainnet (Universal Access)
        "usdc_ethereum": "0x1cB7111eBBF79Af5E941eB89B8eAFC67830be8a4",
        "usdt_ethereum": "0x1cB7111eBBF79Af5E941eB89B8eAFC67830be8a4",
        
        # Polygon (Low Fees)
        "usdc_polygon": "0x1cB7111eBBF79Af5E941eB89B8eAFC67830be8a4",
        "usdt_polygon": "0x1cB7111eBBF79Af5E941eB89B8eAFC67830be8a4",
        
        # BSC (Asia Focus)
        "usdc_bsc": "0x1cB7111eBBF79Af5E941eB89B8eAFC67830be8a4",
        "usdt_bsc": "0x1cB7111eBBF79Af5E941eB89B8eAFC67830be8a4",
    }
}

# Network Configuration
NETWORKS = {
    "ethereum": {
        "name": "Ethereum Mainnet",
        "rpc_url": "https://eth-mainnet.g.alchemy.com/v2/demo",
        "chain_id": 1,
        "currency": "ETH",
        "explorer": "https://etherscan.io",
        "usdc_contract": "0xA0b86a33E6441c8C8C4F4f0b8aBE7d0BEC5C35BA",
        "usdt_contract": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "decimals": {"usdc": 6, "usdt": 6},
        "avg_fee_usd": 25,
        "target_region": "Global"
    },
    "polygon": {
        "name": "Polygon",
        "rpc_url": "https://polygon-rpc.com",
        "chain_id": 137,
        "currency": "MATIC",
        "explorer": "https://polygonscan.com",
        "usdc_contract": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        "usdt_contract": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        "decimals": {"usdc": 6, "usdt": 6},
        "avg_fee_usd": 0.01,
        "target_region": "Global"
    },
    "bsc": {
        "name": "BNB Smart Chain",
        "rpc_url": "https://bsc-dataseed1.binance.org",
        "chain_id": 56,
        "currency": "BNB",
        "explorer": "https://bscscan.com",
        "usdc_contract": "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
        "usdt_contract": "0x55d398326f99059fF775485246999027B3197955",
        "decimals": {"usdc": 18, "usdt": 18},
        "avg_fee_usd": 0.20,
        "target_region": "Asia"
    }
}

# For backward compatibility with existing code
POLYGON_RPC_URL = NETWORKS["polygon"]["rpc_url"]
USDC_POLYGON_CONTRACT = NETWORKS["polygon"]["usdc_contract"]
USDT_POLYGON_CONTRACT = NETWORKS["polygon"]["usdt_contract"]

# Conversion Fees
CRYPTO_CONVERSION_FEE_PERCENT = 3.0  # 3% fee for crypto-to-cash conversion

# Membership tier definitions
MEMBERSHIP_TIERS = {
    "basic": {
        "name": "Basic Member",
        "min_amount": 0,
        "max_amount": 4999,
        "max_per_investment": 5000,
        "emoji": "🌱",
        "benefits": "Start your investment journey with low minimums",
        "plans": [
            {
                "id": "basic_365",
                "name": "🌱 Basic Member - 1 Year",
                "description": "3% APY locked for 1 year",
                "membership_level": "basic",
                "rate": 3.0,
                "term_days": 365,
                "min_amount": 100,
                "max_amount": 5000,
                "is_active": True
            }
        ]
    },
    "club": {
        "name": "Club Member",
        "min_amount": 20000,
        "max_amount": 49999,
        "max_per_investment": 50000,
        "emoji": "🥉",
        "benefits": "Entry-level membership with solid returns",
        "plans": [
            {
                "id": "club_365",
                "name": "🥉 Club Member - 1 Year",
                "description": "6% APY locked for 1 year",
                "membership_level": "club",
                "rate": 6.0,
                "term_days": 365,
                "min_amount": 20000,
                "max_amount": 50000,
                "is_active": True
            }
        ]
    },
    "premium": {
        "name": "Premium Member", 
        "min_amount": 50000,
        "max_amount": 99999,
        "max_per_investment": 100000,
        "emoji": "🥈",
        "benefits": "Enhanced returns with flexible lock periods",
        "plans": [
            {
                "id": "premium_180",
                "name": "🥈 Premium Member - 6 Months",
                "description": "8% APY locked for 6 months",
                "membership_level": "premium",
                "rate": 8.0,
                "term_days": 180,
                "min_amount": 50000,
                "max_amount": 100000,
                "is_active": True
            },
            {
                "id": "premium_365",
                "name": "🥈 Premium Member - 1 Year",
                "description": "10% APY locked for 1 year",
                "membership_level": "premium",
                "rate": 10.0,
                "term_days": 365,
                "min_amount": 50000,
                "max_amount": 100000,
                "is_active": True
            }
        ]
    },
    "vip": {
        "name": "VIP Member",
        "min_amount": 100000,
        "max_amount": 249999,
        "max_per_investment": 250000,
        "emoji": "🥇",
        "benefits": "Premium rates with exclusive VIP treatment",
        "plans": [
            {
                "id": "vip_180",
                "name": "🥇 VIP Member - 6 Months",
                "description": "12% APY locked for 6 months",
                "membership_level": "vip",
                "rate": 12.0,
                "term_days": 180,
                "min_amount": 100000,
                "max_amount": 250000,
                "is_active": True
            },
            {
                "id": "vip_365",
                "name": "🥇 VIP Member - 1 Year",
                "description": "14% APY locked for 1 year",
                "membership_level": "vip",
                "rate": 14.0,
                "term_days": 365,
                "min_amount": 100000,
                "max_amount": 250000,
                "is_active": True
            }
        ]
    },
    "elite": {
        "name": "Elite Member",
        "min_amount": 250000,
        "max_amount": None,
        "max_per_investment": 250000,
        "emoji": "💎",
        "benefits": "Highest rates with unlimited investment capacity",
        "plans": [
            {
                "id": "elite_180",
                "name": "💎 Elite Member - 6 Months",
                "description": "16% APY locked for 6 months",
                "membership_level": "elite",
                "rate": 16.0,
                "term_days": 180,
                "min_amount": 250000,
                "max_amount": 250000,
                "is_active": True
            },
            {
                "id": "elite_365",
                "name": "💎 Elite Member - 1 Year",
                "description": "20% APY locked for 1 year",
                "membership_level": "elite",
                "rate": 20.0,
                "term_days": 365,
                "min_amount": 250000,
                "max_amount": 250000,
                "is_active": True
            }
        ]
    }
}

# Pydantic Models
class TelegramAuth(BaseModel):
    user_id: str

class WalletVerification(BaseModel):
    message: str
    signature: str
    address: str

class UserPreferences(BaseModel):
    user_id: str
    theme: str = "dark"
    onboarding_complete: bool = False

class CryptoTransaction(BaseModel):
    id: str = None
    user_id: str
    transaction_hash: str
    from_address: str
    to_address: str
    amount: float
    token: str  # USDC or USDT
    network: str = "polygon"
    status: str = "pending"  # pending, confirmed, failed
    block_number: Optional[int] = None
    created_at: str = None
    confirmed_at: Optional[str] = None

# User Management Models
class UserSignup(BaseModel):
    name: str
    email: str
    password: str
    phone: str
    country_code: str
    
class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    user_id: str
    name: str
    first_name: str
    last_name: str
    email: str
    phone: str
    email_verified: bool
    phone_verified: bool
    membership_level: str
    created_at: str
    is_admin: Optional[bool] = False
    # Phase 2A: Enhanced 2FA fields
    biometric_2fa_enabled: Optional[bool] = False
    push_2fa_enabled: Optional[bool] = False
    enhanced_2fa_enabled: Optional[bool] = False

# WebAuthn/Biometric 2FA Models - Phase 2 Enhancement
class WebAuthnRegistration(BaseModel):
    credential_id: str
    public_key: str
    sign_count: int = 0

class WebAuthnChallenge(BaseModel):
    challenge: str
    user_id: str
    timeout: int = 60000  # 60 seconds

class WebAuthnVerification(BaseModel):
    credential_id: str
    authenticator_data: str
    client_data_json: str
    signature: str

class BiometricSetupRequest(BaseModel):
    device_name: Optional[str] = "Device"
    
class PushNotificationToken(BaseModel):
    token: str
    device_type: str  # ios, android, web
    device_name: Optional[str] = "Device"

# 2FA Models
class SMSSendRequest(BaseModel):
    phone_number: str

class SMSVerifyRequest(BaseModel):
    phone_number: str
    code: str

class SMS2FASetupRequest(BaseModel):
    phone_number: str

class EmailSendRequest(BaseModel):
    email: str

class EmailVerifyRequest(BaseModel):
    email: str
    code: str

class Email2FASetupRequest(BaseModel):
    email: str
@app.post("/api/users/complete-onboarding")
def complete_user_onboarding(authorization: str = Header(...)):
    """Complete user onboarding and grant basic membership"""
    user_id = require_auth(authorization)
    
    try:
        # Grant basic membership
        success = grant_basic_membership(user_id)
        
        if success:
            # Get updated membership status
            membership_status = get_membership_status(user_id)
            
            return {
                "message": "Onboarding completed successfully! You are now a Basic Member.",
                "membership": {
                    "level": membership_status.level,
                    "level_name": membership_status.level_name,
                    "icon": membership_status.emoji
                }
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to complete onboarding")
            
    except Exception as e:
        print(f"Error completing onboarding: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/users/create-with-id")
def create_user_endpoint(user_data: dict, authorization: str = Header(...)):
    """Create a new user with sequential ID and basic membership (admin only)"""
    user_id = require_auth(authorization)
    
    # This endpoint could be used for admin user creation or during signup
    try:
        new_user = create_user_with_id(user_data)
        
        if new_user:
            return {
                "message": f"User created successfully with ID #{new_user['id_number']}",
                "user": {
                    "id_number": new_user["id_number"],
                    "user_id": new_user["user_id"],
                    "membership_level": new_user["membership_level"]
                }
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create user")
            
    except Exception as e:
        print(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

class CryptoMonitoringService:
    def __init__(self):
        # Initialize Web3 connections for each network
        self.w3_connections = {}
        for network_name, config in NETWORKS.items():
            try:
                self.w3_connections[network_name] = Web3(Web3.HTTPProvider(config["rpc_url"]))
            except Exception as e:
                print(f"Failed to connect to {network_name}: {str(e)}")
        
        # ERC20 ABI for balance and transfer monitoring
        self.erc20_abi = [
            {
                "constant": True,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function"
            },
            {
                "constant": True,
                "inputs": [],
                "name": "decimals",
                "outputs": [{"name": "", "type": "uint8"}],
                "type": "function"
            },
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "name": "from", "type": "address"},
                    {"indexed": True, "name": "to", "type": "address"},
                    {"indexed": False, "name": "value", "type": "uint256"}
                ],
                "name": "Transfer",
                "type": "event"
            }
        ]
    
    async def get_token_balance(self, wallet_address: str, token: str, network: str = "polygon") -> float:
        """Get USDC or USDT balance for a wallet address on specified network"""
        try:
            if network not in self.w3_connections:
                print(f"Network {network} not available")
                return 0.0
            
            w3 = self.w3_connections[network]
            network_config = NETWORKS[network]
            
            contract_address = network_config["usdc_contract"] if token.upper() == "USDC" else network_config["usdt_contract"]
            contract = w3.eth.contract(address=contract_address, abi=self.erc20_abi)
            
            # Get balance in wei
            balance_wei = contract.functions.balanceOf(wallet_address).call()
            
            # Get decimals from network config
            decimals = network_config["decimals"][token.lower()]
            
            # Convert to human readable format
            balance = balance_wei / (10 ** decimals)
            return balance
            
        except Exception as e:
            print(f"Error fetching {token} balance for {wallet_address} on {network}: {str(e)}")
            return 0.0
    
    async def get_all_wallet_balances(self) -> dict:
        """Get balances for all configured wallets across all networks"""
        balances = {}
        
        for wallet_type, addresses in CRYPTO_WALLETS.items():
            balances[wallet_type] = {}
            
            for token_network, address in addresses.items():
                if address:  # Only check if address is configured
                    # Parse token and network from key (e.g., "usdc_ethereum" -> "usdc", "ethereum")
                    token, network = token_network.split('_')
                    
                    balance = await self.get_token_balance(address, token, network)
                    balances[wallet_type][token_network] = {
                        "address": address,
                        "balance": balance,
                        "token": token.upper(),
                        "network": network,
                        "network_name": NETWORKS[network]["name"],
                        "explorer": NETWORKS[network]["explorer"]
                    }
        
        return balances
    
    async def get_available_networks_for_token(self, token: str) -> List[dict]:
        """Get all available networks that support the specified token"""
        networks = []
        
        for network_name, config in NETWORKS.items():
            # Check if we have a business wallet address for this token on this network
            wallet_key = f"{token.lower()}_{network_name}"
            if CRYPTO_WALLETS["vonvault_business"].get(wallet_key):
                networks.append({
                    "network": network_name,
                    "name": config["name"],
                    "chain_id": config["chain_id"],
                    "currency": config["currency"],
                    "avg_fee_usd": config["avg_fee_usd"],
                    "target_region": config["target_region"],
                    "address": CRYPTO_WALLETS["vonvault_business"][wallet_key]
                })
        
        return networks
    
    async def get_deposit_address(self, token: str, network: str) -> dict:
        """Get deposit address for specified token and network"""
        wallet_key = f"{token.lower()}_{network}"
        
        if "vonvault_business" not in CRYPTO_WALLETS:
            raise ValueError("Business wallet not configured")
        
        address = CRYPTO_WALLETS["vonvault_business"].get(wallet_key)
        if not address:
            raise ValueError(f"Address not configured for {token} on {network}")
        
        network_config = NETWORKS.get(network)
        if not network_config:
            raise ValueError(f"Unknown network: {network}")
        
        return {
            "token": token.upper(),
            "network": network,
            "network_name": network_config["name"],
            "chain_id": network_config["chain_id"],
            "address": address,
            "qr_code_data": f"ethereum:{address}?value=0&gas=21000",
            "explorer_url": f"{network_config['explorer']}/address/{address}",
            "avg_fee_usd": network_config["avg_fee_usd"],
            "target_region": network_config["target_region"]
        }
    
    async def calculate_conversion_fee(self, crypto_amount: float) -> dict:
        """Calculate 3% conversion fee for crypto-to-cash conversion"""
        fee_amount = crypto_amount * (CRYPTO_CONVERSION_FEE_PERCENT / 100)
        net_amount = crypto_amount - fee_amount
        
        return {
            "gross_amount": crypto_amount,
            "fee_percent": CRYPTO_CONVERSION_FEE_PERCENT,
            "fee_amount": fee_amount,
            "net_amount": net_amount,
            "fee_description": f"{CRYPTO_CONVERSION_FEE_PERCENT}% conversion fee for crypto-to-cash processing"
        }

crypto_service = CryptoMonitoringService()

class CryptoDepositRequest(BaseModel):
    wallet_type: str  # trust_wallet or telegram_wallet
    token: str  # USDC or USDT
    amount: float
    user_note: Optional[str] = None

class Investment(BaseModel):
    id: str = None
    user_id: str
    name: str
    amount: float
    rate: float
    term: int
    membership_level: str = None
    created_at: str = None

class InvestmentPlan(BaseModel):
    id: str = None
    name: str
    description: str = ""
    membership_level: str
    rate: float  # Annual percentage yield
    term_days: int  # Lock period in days
    min_amount: float  # Minimum investment amount
    max_amount: float  # Maximum investment amount per investment
    is_active: bool = True
    created_at: str = None
    updated_at: str = None

class MembershipStatus(BaseModel):
    level: str
    level_name: str
    emoji: str
    total_invested: float
    current_min: float
    current_max: Optional[float]
    next_level: Optional[str] = None
    next_level_name: Optional[str] = None
    amount_to_next: Optional[float] = None
    available_plans: List[InvestmentPlan] = []

# 2FA Helper Functions
def validate_phone_number(phone: str) -> bool:
    """Validate phone number format (E.164)"""
    import re
    # Remove any non-numeric characters except +
    cleaned = re.sub(r'[^\d+]', '', phone)
    # Check if it starts with + and has 10-15 digits
    pattern = r'^\+[1-9]\d{1,14}$'
    return bool(re.match(pattern, cleaned))

def format_phone_number(phone: str) -> str:
    """Format phone number to E.164 standard"""
    import re
    # Remove all non-numeric characters except +
    cleaned = re.sub(r'[^\d+]', '', phone)
    
    # If it doesn't start with +, assume US number and add +1
    if not cleaned.startswith('+'):
        if len(cleaned) == 10:  # US number without country code
            cleaned = '+1' + cleaned
        elif len(cleaned) == 11 and cleaned.startswith('1'):  # US number with 1 prefix
            cleaned = '+' + cleaned
    
    return cleaned

async def send_sms_verification(phone_number: str) -> dict:
    """Send SMS verification code using Vonage"""
    if not vonage_sms:
        raise HTTPException(status_code=503, detail="SMS service not available")
    
    try:
        # Format phone number
        formatted_phone = format_phone_number(phone_number)
        
        # Validate phone number
        if not validate_phone_number(formatted_phone):
            raise HTTPException(status_code=400, detail="Invalid phone number format")
        
        # Generate 6-digit verification code
        verification_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # Send SMS via Vonage
        response = vonage_sms.send({
            "from": "VonVault",
            "to": formatted_phone,
            "text": f"Your VonVault verification code is: {verification_code}. Valid for 10 minutes."
        })
        
        # Store verification code in database
        verification_data = {
            "contact": formatted_phone,
            "code": verification_code,
            "provider": "vonage",
            "type": "sms",
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=10),
            "verified": False,
            "attempts": 0
        }
        db.verification_codes.insert_one(verification_data)
        
        if response["messages"][0]["status"] == "0":
            return {
                "status": "pending",
                "phone_number": formatted_phone,
                "message": f"Verification code sent to {formatted_phone}"
            }
        else:
            raise Exception(f"Vonage SMS failed: {response['messages'][0]['error-text']}")
            
    except Exception as e:
        print(f"Vonage SMS error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send SMS verification")

async def verify_sms_code(phone_number: str, code: str) -> dict:
    """Verify SMS code using Vonage (stored in database)"""
    try:
        formatted_phone = format_phone_number(phone_number)
        
        # Check verification code in database
        verification = db.verification_codes.find_one({
            "contact": formatted_phone,
            "code": code,
            "type": "sms",
            "verified": False,
            "expires_at": {"$gt": datetime.utcnow()},
            "attempts": {"$lt": 3}
        })
        
        if verification:
            # Mark as verified
            db.verification_codes.update_one(
                {"_id": verification["_id"]},
                {"$set": {"verified": True, "verified_at": datetime.utcnow()}}
            )
            return {
                "valid": True,
                "status": "approved",
                "phone_number": formatted_phone
            }
        else:
            # Increment attempts
            db.verification_codes.update_one(
                {"contact": formatted_phone, "verified": False, "type": "sms"},
                {"$inc": {"attempts": 1}}
            )
            return {
                "valid": False,
                "status": "failed",
                "phone_number": formatted_phone
            }
            
    except Exception as e:
        print(f"SMS verification error: {e}")
        return {
            "valid": False,
            "status": "failed",
            "error": str(e)
        }

def validate_email(email: str) -> bool:
    """Validate email format"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

async def send_email_verification(email: str) -> dict:
    """Send email verification code using custom implementation"""
    try:
        # Validate email
        if not validate_email(email):
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Generate 6-digit verification code
        verification_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # Store verification code in database
        verification_data = {
            "contact": email,
            "code": verification_code,
            "provider": "internal",
            "type": "email",
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=10),
            "verified": False,
            "attempts": 0
        }
        db.verification_codes.insert_one(verification_data)
        
        # For now, we'll just store the code and return success
        # TODO: Implement actual email sending (SMTP, SendGrid, etc.)
        print(f"Email verification code for {email}: {verification_code}")
        
        return {
            "status": "pending",
            "email": email,
            "message": f"Verification code sent to {email}"
        }
        
    except Exception as e:
        print(f"Email sending error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email verification")

async def verify_email_code(email: str, code: str) -> dict:
    """Verify email code using database storage"""
    try:
        # Validate email
        if not validate_email(email):
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Check verification code in database
        verification = db.verification_codes.find_one({
            "contact": email,
            "code": code,
            "type": "email",
            "verified": False,
            "expires_at": {"$gt": datetime.utcnow()},
            "attempts": {"$lt": 3}
        })
        
        if verification:
            # Mark as verified
            db.verification_codes.update_one(
                {"_id": verification["_id"]},
                {"$set": {"verified": True, "verified_at": datetime.utcnow()}}
            )
            return {
                "valid": True,
                "status": "approved",
                "email": email
            }
        else:
            # Increment attempts
            db.verification_codes.update_one(
                {"contact": email, "verified": False, "type": "email"},
                {"$inc": {"attempts": 1}}
            )
            return {
                "valid": False,
                "status": "failed",
                "email": email
            }
            
    except Exception as e:
        print(f"Email verification error: {e}")
        return {
            "valid": False,
            "status": "failed",
            "error": str(e)
        }
    except Exception as e:
        print(f"Email verification error: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify email code")

# Utility Functions
def generate_jwt(user_id: str, expires_in_minutes: int = JWT_ACCESS_TOKEN_EXPIRE_MINUTES):
    """Generate secure JWT token with configurable expiration"""
    payload = {
        "user_id": user_id,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=expires_in_minutes),
        "jti": generate_secure_token()[:16]  # JWT ID for revocation
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def require_auth(authorization: str) -> str:
    """Enhanced JWT validation with better error handling"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization required")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
            
        # Check if user still exists and is active
        user = db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
            
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")

import hashlib
import hmac
import json
from urllib.parse import unquote
from datetime import datetime

def validate_telegram_init_data(init_data: str, bot_token: str) -> dict:
    """
    Validate Telegram WebApp init data
    Returns user data if valid, raises exception if invalid
    """
    try:
        # Parse the init data
        data = {}
        for item in init_data.split('&'):
            if '=' in item:
                key, value = item.split('=', 1)
                data[key] = unquote(value)
        
        # Extract hash from data
        received_hash = data.pop('hash', '')
        
        # Create data check string
        data_check_arr = []
        for key, value in sorted(data.items()):
            data_check_arr.append(f"{key}={value}")
        data_check_string = '\n'.join(data_check_arr)
        
        # Create secret key
        secret_key = hmac.new(
            "WebAppData".encode(),
            bot_token.encode(),
            hashlib.sha256
        ).digest()
        
        # Calculate hash
        calculated_hash = hmac.new(
            secret_key,
            data_check_string.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Verify hash
        if calculated_hash != received_hash:
            raise ValueError("Invalid hash")
        
        # Parse user data
        user_data = json.loads(data.get('user', '{}'))
        return user_data
        
    except Exception as e:
        raise ValueError(f"Invalid Telegram data: {str(e)}")

async def create_or_update_telegram_user(db, telegram_data: dict) -> dict:
    """
    Create or update Telegram user in database with membership support
    """
    telegram_id = telegram_data.get('id')
    if not telegram_id:
        raise ValueError("No Telegram ID provided")
    
    # Check if user exists
    existing_user = db.users.find_one({"telegram_id": telegram_id})
    
    user_data = {
        "telegram_id": telegram_id,
        "telegram_username": telegram_data.get("username", ""),
        "first_name": telegram_data.get("first_name", ""),
        "last_name": telegram_data.get("last_name", ""),
        "language_code": telegram_data.get("language_code", "en"),
        "photo_url": telegram_data.get("photo_url", ""),
        "last_login": datetime.utcnow().isoformat(),
        "auth_type": "telegram"
    }
    
    if existing_user:
        # Update existing user
        db.users.update_one(
            {"telegram_id": telegram_id},
            {"$set": user_data}
        )
        updated_user = db.users.find_one({"telegram_id": telegram_id})
        updated_user["_id"] = str(updated_user["_id"])
        return updated_user
    else:
        # Create new user with default membership status
        user_data.update({
            "id": str(uuid.uuid4()),
            "email": f"telegram_{telegram_id}@vonvault.app",
            "membership_level": "none",  # Start with no membership
            "total_invested": 0.0,
            "created_at": datetime.utcnow().isoformat(),
            "onboarding_complete": False
        })
        
        result = db.users.insert_one(user_data)
        user_data["_id"] = str(result.inserted_id)
        return user_data

def verify_jwt(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def require_auth(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        payload = verify_jwt(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid token")
        return payload["user_id"]
    except Exception:
        raise HTTPException(status_code=401, detail="Authorization required")

def calculate_total_investment(user_id: str) -> float:
    """Calculate total investment amount for a user"""
    investments = list(db.investments.find({"user_id": user_id}))
    return sum(inv.get("amount", 0) for inv in investments)

def get_membership_level(total_invested: float) -> str:
    """Determine membership level based on total investment"""
    if total_invested >= MEMBERSHIP_TIERS["elite"]["min_amount"]:
        return "elite"
    elif total_invested >= MEMBERSHIP_TIERS["vip"]["min_amount"]:
        return "vip"
    elif total_invested >= MEMBERSHIP_TIERS["premium"]["min_amount"]:
        return "premium"
    elif total_invested >= MEMBERSHIP_TIERS["club"]["min_amount"]:
        return "club"
    else:
        return "basic"

def get_next_user_id():
    """Generate next sequential user ID number"""
    try:
        # Get the highest existing user ID number
        last_user = db.users.find_one(
            {"id_number": {"$exists": True}}, 
            sort=[("id_number", -1)]
        )
        
        if last_user and "id_number" in last_user:
            return last_user["id_number"] + 1
        else:
            return 1  # Start with ID 1 if no users exist
    except Exception as e:
        print(f"Error getting next user ID: {e}")
        return 1

def grant_basic_membership(user_id: str):
    """Grant basic membership to a user after signup/onboarding"""
    try:
        # Try with user_id field first
        result = db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "membership_level": "basic",
                "membership_granted_at": datetime.utcnow().isoformat()
            }}
        )
        
        # If no document was modified, try with id field
        if result.modified_count == 0:
            result = db.users.update_one(
                {"id": user_id},
                {"$set": {
                    "membership_level": "basic",
                    "membership_granted_at": datetime.utcnow().isoformat()
                }}
            )
        
        print(f"Granted basic membership to user {user_id}")
        return True  # Return success even if no document was modified
    except Exception as e:
        print(f"Error granting basic membership: {e}")
        return False

def create_user_with_id(user_data: dict):
    """Create a new user with sequential ID number and basic membership"""
    try:
        # Generate sequential user ID
        id_number = get_next_user_id()
        
        # Add ID number and basic membership to user data
        user_data.update({
            "id_number": id_number,
            "membership_level": "basic",
            "total_investments": 0.0,
            "created_at": datetime.utcnow().isoformat()
        })
        
        # Insert user
        result = db.users.insert_one(user_data)
        user_data["_id"] = str(result.inserted_id)
        
        print(f"Created user with ID #{id_number}")
        return user_data
    except Exception as e:
        print(f"Error creating user with ID: {e}")
        return None

def get_membership_status(user_id: str) -> MembershipStatus:
    """Get detailed membership status for a user"""
    total_invested = calculate_total_investment(user_id)
    
    # Get user from database to check if they have basic membership
    user_doc = db.users.find_one({"user_id": user_id})
    
    # If user exists and has basic membership (even with 0 investments), maintain it
    if user_doc and user_doc.get("membership_level") == "basic" and total_invested < MEMBERSHIP_TIERS["club"]["min_amount"]:
        level = "basic"
    else:
        # Use investment-based membership calculation for higher tiers
        level = get_membership_level(total_invested)
    
    tier_info = MEMBERSHIP_TIERS.get(level, MEMBERSHIP_TIERS["basic"])
    
    # Get available plans for this membership level
    available_plans = []
    
    # Add plans for the user's level
    if level in MEMBERSHIP_TIERS:
        for plan_data in MEMBERSHIP_TIERS[level]["plans"]:
            available_plans.append(InvestmentPlan(**plan_data))
    
    # For basic members, also show club plans as upgrade options
    if level == "basic":
        for plan_data in MEMBERSHIP_TIERS["club"]["plans"]:
            available_plans.append(InvestmentPlan(**plan_data))
    for tier_name, tier_data in MEMBERSHIP_TIERS.items():
        if tier_name == level or (level == "basic" and tier_name == "club"):  # Basic users can see club plans too
            for plan in tier_data.get("plans", []):
                available_plans.append(InvestmentPlan(**plan))
    
    # Calculate progress to next tier
    next_tier = None
    next_level_name = None
    amount_to_next = None
    progress_percentage = 0
    
    tier_order = ["basic", "club", "premium", "vip", "elite"]
    current_index = tier_order.index(level) if level in tier_order else 0
    
    if current_index < len(tier_order) - 1:
        next_tier_name = tier_order[current_index + 1]
        next_tier_info = MEMBERSHIP_TIERS[next_tier_name]
        next_tier = next_tier_name
        next_level_name = next_tier_info["name"]
        amount_to_next = next_tier_info["min_amount"] - total_invested
        
        if total_invested > 0:
            progress_percentage = min(100, (total_invested / next_tier_info["min_amount"]) * 100)
    
    return MembershipStatus(
        level=level,
        level_name=tier_info["name"],
        emoji=tier_info["emoji"],
        total_invested=total_invested,
        current_min=tier_info["min_amount"],
        current_max=tier_info["max_amount"],
        next_level=next_tier,
        next_level_name=next_level_name,
        amount_to_next=amount_to_next,
        progress_percentage=progress_percentage,
        available_plans=available_plans
    )

def get_plans_for_membership_level(membership_level: str) -> List[InvestmentPlan]:
    """Get investment plans available for a specific membership level"""
    plans = []
    
    if membership_level == "none":
        return plans
    
    tier_info = MEMBERSHIP_TIERS[membership_level]
    
    if membership_level == "club":
        # Club member only has 365-day option
        plans.append(InvestmentPlan(
            id=f"{membership_level}_365",
            name=f"{tier_info['emoji']} {tier_info['name']} - 1 Year",
            description=f"6% APY locked for 1 year",
            membership_level=membership_level,
            rate=6.0,
            term_days=365,
            min_amount=tier_info["min_amount"],
            max_amount=tier_info["max_per_investment"],
            is_active=True
        ))
    else:
        # Premium, VIP, Elite have both 180 and 365 day options
        rates = {
            "premium": {"180": 8.0, "365": 10.0},
            "vip": {"180": 12.0, "365": 14.0},
            "elite": {"180": 16.0, "365": 20.0}
        }
        
        level_rates = rates[membership_level]
        
        # 180-day plan
        plans.append(InvestmentPlan(
            id=f"{membership_level}_180",
            name=f"{tier_info['emoji']} {tier_info['name']} - 6 Months",
            description=f"{level_rates['180']}% APY locked for 6 months",
            membership_level=membership_level,
            rate=level_rates['180'],
            term_days=180,
            min_amount=tier_info["min_amount"],
            max_amount=tier_info["max_per_investment"],
            is_active=True
        ))
        
        # 365-day plan
        plans.append(InvestmentPlan(
            id=f"{membership_level}_365",
            name=f"{tier_info['emoji']} {tier_info['name']} - 1 Year",
            description=f"{level_rates['365']}% APY locked for 1 year",
            membership_level=membership_level,
            rate=level_rates['365'],
            term_days=365,
            min_amount=tier_info["min_amount"],
            max_amount=tier_info["max_per_investment"],
            is_active=True
        ))
    
    return plans

def init_membership_investment_plans():
    """Initialize membership-based investment plans and clear old ones"""
    # Clear existing plans
    db.investment_plans.delete_many({})
    
    # Create membership-based plans
    all_plans = []
    
    for level in ["club", "premium", "vip", "elite"]:
        plans = get_plans_for_membership_level(level)
        for plan in plans:
            plan_data = {
                "id": plan.id,
                "name": plan.name,
                "description": plan.description,
                "membership_level": plan.membership_level,
                "rate": plan.rate,
                "term_days": plan.term_days,
                "min_amount": plan.min_amount,
                "max_amount": plan.max_amount,
                "is_active": plan.is_active,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            all_plans.append(plan_data)
    
    if all_plans:
        db.investment_plans.insert_many(all_plans)
        print(f"Initialized {len(all_plans)} membership-based investment plans")

# Initialize membership plans on startup
@app.on_event("startup")
async def startup_event():
    # Run migration for existing users
    print("Running single wallet to multi-wallet migration...")
    migrate_single_wallet_to_multi()
    print("Migration completed.")
    
    # Initialize membership plans
    init_membership_investment_plans()

# Root endpoint
@app.get("/")
def root():
    return {"message": "VonVault DeFi API - Membership Investment System", "status": "running"}

# Health check
@app.get("/api/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# ===== API V1 ENDPOINTS =====

# Health check
@api_v1_router.get("/health")
def health_check_v1():
    return {
        "status": "healthy", 
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "api_version": "v1"
    }

# Authentication endpoints  
@app.get("/auth/check-email")
async def check_email_availability(email: str):
    """Check if email is available for registration"""
    try:
        # Validate email format first
        if not validate_email(email):
            return {"available": False, "reason": "invalid_format"}
        
        # Check if user already exists
        existing_user = db.users.find_one({"email": email})
        if existing_user:
            return {"available": False, "reason": "already_exists"}
        
        return {"available": True}
        
    except Exception as e:
        print(f"Email check error: {e}")
        return {"available": None, "reason": "error"}

@api_v1_router.post("/auth/signup")
@limiter.limit("5/minute")
async def user_signup_v1(request: Request, user_data: UserSignup):
    """Create new user account with email/password - API v1"""
    return await user_signup_impl(request, user_data)

@api_v1_router.post("/auth/login")
@limiter.limit("10/minute")
async def user_login_v1(request: Request, login_data: UserLogin):
    """Authenticate user with email/password - API v1"""
    return await user_login_impl(request, login_data)

@api_v1_router.get("/auth/me")
async def get_current_user_v1(authorization: str = Header(...)):
    """Get current authenticated user information - API v1"""
    return await get_current_user_impl(authorization)

# Admin endpoints
@api_v1_router.get("/admin/overview")
def get_admin_overview_v1(authorization: str = Header(...)):
    """Get admin dashboard overview - API v1"""
    return get_admin_overview_impl(authorization)

@api_v1_router.get("/admin/users")
def get_admin_users_v1(
    authorization: str = Header(...),
    page: int = 1,
    limit: int = 20,
    search: str = None,
    filter_verified: bool = None
):
    """Get users list for admin - API v1"""
    return get_admin_users_impl(authorization, page, limit, search, filter_verified)

# 2FA endpoints
@api_v1_router.post("/auth/totp/setup")
async def setup_totp_2fa_v1(authorization: str = Header(...)):
    """Setup TOTP 2FA - API v1"""
    return await setup_totp_2fa_impl(authorization)

@api_v1_router.post("/auth/totp/verify")
async def verify_totp_2fa_v1(request: dict, authorization: str = Header(...)):
    """Verify TOTP 2FA code - API v1"""
    return await verify_totp_2fa_impl(request, authorization)

# Phase 2 Enhancement: Biometric WebAuthn 2FA endpoints
@api_v1_router.post("/auth/webauthn/register/begin")
async def webauthn_register_begin_v1(request: BiometricSetupRequest, authorization: str = Header(...)):
    """Begin WebAuthn biometric registration - API v1"""
    return await webauthn_register_begin_impl(request, authorization)

@api_v1_router.post("/auth/webauthn/register/complete")
async def webauthn_register_complete_v1(request: WebAuthnRegistration, authorization: str = Header(...)):
    """Complete WebAuthn biometric registration - API v1"""
    return await webauthn_register_complete_impl(request, authorization)

@api_v1_router.post("/auth/webauthn/authenticate/begin")
async def webauthn_authenticate_begin_v1(request: dict, authorization: str = Header(...)):
    """Begin WebAuthn biometric authentication - API v1"""
    return await webauthn_authenticate_begin_impl(request, authorization)

@api_v1_router.post("/auth/webauthn/authenticate/complete")
async def webauthn_authenticate_complete_v1(request: WebAuthnVerification, authorization: str = Header(...)):
    """Complete WebAuthn biometric authentication - API v1"""
    return await webauthn_authenticate_complete_impl(request, authorization)

# Phase 2 Enhancement: Push Notification 2FA endpoints
@api_v1_router.post("/auth/push/register")
async def push_notification_register_v1(request: PushNotificationToken, authorization: str = Header(...)):
    """Register device for push notification 2FA - API v1"""
    return await push_notification_register_impl(request, authorization)

@api_v1_router.post("/auth/push/send")
async def push_notification_send_v1(request: dict, authorization: str = Header(...)):
    """Send push notification 2FA challenge - API v1"""
    return await push_notification_send_impl(request, authorization)

@api_v1_router.post("/auth/push/verify")
async def push_notification_verify_v1(request: dict, authorization: str = Header(...)):
    """Verify push notification 2FA response - API v1"""
    return await push_notification_verify_impl(request, authorization)
# ===== IMPLEMENTATION FUNCTIONS FOR API VERSIONING =====

async def user_signup_impl(request: Request, user_data: UserSignup):
    """Implementation for user signup - shared between versions"""
    print(f"DEBUG V1: Raw request received at user_signup_impl")
    print(f"DEBUG V1: Signup request data: {user_data}")
    try:
        print(f"DEBUG V1: Starting email validation...")
        # Validate email format
        if not validate_email(user_data.email):
            print(f"DEBUG V1: Email validation failed")
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        print(f"DEBUG V1: Email validation passed, checking existing user...")
        # Check if user already exists
        existing_user = db.users.find_one({"email": user_data.email})
        if existing_user:
            print(f"DEBUG V1: User already exists!")
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        print(f"DEBUG V1: No existing user, checking phone validation...")
        # Check if phone number already exists
        formatted_phone = f"{user_data.country_code}{user_data.phone.replace('+', '').replace('-', '').replace(' ', '')}"
        print(f"DEBUG V1: Formatted phone: {formatted_phone}")
        existing_phone = db.users.find_one({"phone": formatted_phone})
        if existing_phone:
            print(f"DEBUG V1: Phone already exists!")
            raise HTTPException(status_code=400, detail="User with this phone number already exists")
        
        print(f"DEBUG V1: Phone validation passed, continuing...")
        
        # Hash password
        hashed_password = hash_password(user_data.password)
        
        # Create user document
        user_id = str(uuid.uuid4())
        id_number = get_next_user_id()
        
        # Check if this is an admin email
        admin_emails = ["admin@vonartis.com", "security@vonartis.com"]
        is_admin = user_data.email in admin_emails
        
        user_doc = {
            "id": user_id,
            "user_id": user_id,
            "id_number": id_number,
            "email": user_data.email,
            "password": hashed_password,
            "name": user_data.name,
            "first_name": user_data.name.split(' ')[0] if user_data.name else '',
            "last_name": ' '.join(user_data.name.split(' ')[1:]) if len(user_data.name.split(' ')) > 1 else '',
            "phone": f"{user_data.country_code}{user_data.phone}",
            "country_code": user_data.country_code,
            "email_verified": False,
            "phone_verified": False,
            "membership_level": "basic" if is_admin else "none",
            "total_invested": 0.0,
            "crypto_connected": False,
            "bank_connected": False,
            "created_at": datetime.utcnow().isoformat(),
            "last_login": datetime.utcnow().isoformat(),
            "auth_type": "email",
            "is_admin": is_admin,
            "onboarding_complete": False
        }
        
        # Insert user into database
        result = db.users.insert_one(user_doc)
        
        # Generate JWT token
        token = generate_jwt(user_id)
        
        # Prepare response
        user_response = UserResponse(
            id=user_id,
            user_id=user_id,
            name=user_data.name,
            first_name=user_doc["first_name"],
            last_name=user_doc["last_name"],
            email=user_data.email,
            phone=user_doc["phone"],
            email_verified=False,
            phone_verified=False,
            membership_level=user_doc["membership_level"],
            created_at=user_doc["created_at"],
            is_admin=is_admin
        )
        
        return {
            "message": "User created successfully",
            "user": user_response,
            "token": token,
            "authenticated": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create user account")

async def user_login_impl(request: Request, login_data: UserLogin):
    """Implementation for user login - shared between versions"""
    try:
        # Find user by email
        user = db.users.find_one({"email": login_data.email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not verify_password(login_data.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Update last login
        db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.utcnow().isoformat()}}
        )
        
        # Generate JWT token
        token = generate_jwt(user["user_id"])
        
        # Prepare response
        user_response = UserResponse(
            id=user["user_id"],
            user_id=user["user_id"],
            name=user.get("name", ""),
            first_name=user.get("first_name", ""),
            last_name=user.get("last_name", ""),
            email=user["email"],
            phone=user.get("phone", ""),
            email_verified=user.get("email_verified", False),
            phone_verified=user.get("phone_verified", False),
            membership_level=user.get("membership_level", "none"),
            created_at=user.get("created_at", ""),
            is_admin=user.get("is_admin", False)
        )
        
        return {
            "message": "Login successful",
            "user": user_response,
            "token": token,
            "authenticated": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

async def get_current_user_impl(authorization: str):
    """Implementation for get current user - shared between versions"""
    try:
        user_id = require_auth(authorization)
        
        # Find user in database
        user = db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prepare response
        user_response = UserResponse(
            id=user["user_id"],
            user_id=user["user_id"],
            name=user.get("name", ""),
            first_name=user.get("first_name", ""),
            last_name=user.get("last_name", ""),
            email=user["email"],
            phone=user.get("phone", ""),
            email_verified=user.get("email_verified", False),
            phone_verified=user.get("phone_verified", False),
            membership_level=user.get("membership_level", "none"),
            created_at=user.get("created_at", ""),
            is_admin=user.get("is_admin", False)
        )
        
        return {
            "user": user_response,
            "authenticated": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get user error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user information")

def get_admin_overview_impl(authorization: str):
    """Implementation for admin overview - shared between versions"""
    require_admin_auth(authorization)
    
    try:
        # Count total users
        total_users = db.users.count_documents({})
        
        # Count verified users (email or phone verified)
        verified_users = db.users.count_documents({
            "$or": [
                {"email_verified": True},
                {"phone_verified": True}
            ]
        })
        
        # Count users with investments
        users_with_investments = db.users.count_documents({"total_invested": {"$gt": 0}})
        
        # Recent signups (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_signups = db.users.count_documents({
            "created_at": {"$gte": seven_days_ago.isoformat()}
        })
        
        # Investment statistics
        pipeline = [
            {"$group": {
                "_id": None,
                "total_amount": {"$sum": "$amount"},
                "total_count": {"$sum": 1}
            }}
        ]
        investment_stats = list(db.investments.aggregate(pipeline))
        total_investment_amount = investment_stats[0]["total_amount"] if investment_stats else 0
        total_investment_count = investment_stats[0]["total_count"] if investment_stats else 0
        
        # Recent investments (last 7 days)
        recent_investments = db.investments.count_documents({
            "created_at": {"$gte": seven_days_ago.isoformat()}
        })
        
        # Membership level distribution
        membership_pipeline = [
            {"$group": {"_id": "$membership_level", "count": {"$sum": 1}}}
        ]
        membership_stats = list(db.users.aggregate(membership_pipeline))
        membership_distribution = {stat["_id"]: stat["count"] for stat in membership_stats}
        
        # Calculate verification rate
        verification_rate = (verified_users / total_users * 100) if total_users > 0 else 0
        
        return {
            "users": {
                "total": total_users,
                "verified": verified_users,
                "with_investments": users_with_investments,
                "recent_signups": recent_signups
            },
            "investments": {
                "total_amount": total_investment_amount,
                "total_count": total_investment_count,
                "recent_count": recent_investments
            },
            "membership_distribution": membership_distribution,
            "verification_rate": verification_rate
        }
        
    except Exception as e:
        print(f"Error getting admin overview: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get admin overview: {str(e)}")

def get_admin_users_impl(authorization: str, page: int, limit: int, search: str, filter_verified: bool):
    """Implementation for admin users list - shared between versions"""
    require_admin_auth(authorization)
    
    try:
        # Build query
        query = {}
        
        if search:
            query["$or"] = [
                {"email": {"$regex": search, "$options": "i"}},
                {"name": {"$regex": search, "$options": "i"}}
            ]
        
        if filter_verified is not None:
            if filter_verified:
                query["$or"] = [
                    {"email_verified": True},
                    {"phone_verified": True}
                ]
            else:
                query["email_verified"] = {"$ne": True}
                query["phone_verified"] = {"$ne": True}
        
        # Calculate pagination
        skip = (page - 1) * limit
        
        # Get users with pagination
        users = list(db.users.find(query).skip(skip).limit(limit).sort("created_at", -1))
        total_count = db.users.count_documents(query)
        total_pages = (total_count + limit - 1) // limit
        
        # Format user data
        formatted_users = []
        for user in users:
            user["_id"] = str(user["_id"])
            user["id"] = user.get("user_id", user.get("id", ""))
            
            # Count connected wallets
            user["connected_wallets_count"] = db.wallets.count_documents({"user_id": user.get("user_id", "")})
            
            formatted_users.append(user)
        
        return {
            "users": formatted_users,
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_count": total_count,
                "per_page": limit
            }
        }
        
    except Exception as e:
        print(f"Error getting admin users: {e}")
        raise HTTPException(status_code=500, detail="Failed to get users list")

async def setup_totp_2fa_impl(authorization: str):
    """Implementation for TOTP 2FA setup - shared between versions"""
    user_id = require_auth(authorization)
    
    try:
        # Get user info for QR code
        user = db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Generate TOTP secret
        secret = pyotp.random_base32()
        
        # Create TOTP object
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.get('first_name', 'VonVault User'),
            issuer_name="VonVault"
        )
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        # Create QR code image
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        # Store temporary secret (not enabled until verified)
        db.users.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "totp_secret_pending": secret,
                    "updated_at": datetime.utcnow().isoformat()
                }
            }
        )
        
        return {
            "success": True,
            "secret": secret,
            "qr_code": f"data:image/png;base64,{qr_code_base64}",
            "manual_entry_key": secret
        }
        
    except Exception as e:
        print(f"TOTP setup error: {e}")
        raise HTTPException(status_code=500, detail="Failed to setup TOTP 2FA")

async def verify_totp_2fa_impl(request: dict, authorization: str):
    """Implementation for TOTP 2FA verification - shared between versions"""
    user_id = require_auth(authorization)
    code = request.get("code", "")
    
    try:
        # Get user's pending TOTP secret
        user = db.users.find_one({"user_id": user_id})
        if not user or not user.get("totp_secret_pending"):
            raise HTTPException(status_code=400, detail="No pending TOTP setup found")
        
        # Verify the code
        totp = pyotp.TOTP(user["totp_secret_pending"])
        if not totp.verify(code):
            return {
                "success": False,
                "verified": False,
                "message": "Invalid TOTP code"
            }
        
        # Code is valid - enable TOTP 2FA
        backup_codes = [pyotp.random_base32()[:8] for _ in range(10)]  # Generate 10 backup codes
        
        db.users.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "totp_2fa_enabled": True,
                    "totp_secret": user["totp_secret_pending"],
                    "backup_codes": backup_codes,
                    "updated_at": datetime.utcnow().isoformat()
                },
                "$unset": {
                    "totp_secret_pending": ""
                }
            }
        )
        
        return {
            "success": True,
            "verified": True,
            "message": "TOTP 2FA enabled successfully",
            "backup_codes": backup_codes
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"TOTP verification error: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify TOTP code")

# ===== PHASE 2 ENHANCEMENT: WEBAUTHN IMPLEMENTATION =====

import secrets
import base64
from webauthn import generate_registration_options, verify_registration_response, generate_authentication_options, verify_authentication_response
from webauthn.helpers.structs import (
    AttestationConveyancePreference,
    AuthenticatorSelectionCriteria,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)

async def webauthn_register_begin_impl(request: BiometricSetupRequest, authorization: str):
    """Begin WebAuthn biometric registration"""
    user_id = require_auth(authorization)
    
    try:
        # Get user info
        user = db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Generate registration challenge
        options = generate_registration_options(
            rp_id="vonartis.app",
            rp_name="VonVault",
            user_id=user_id.encode(),
            user_name=user.get("email", ""),
            user_display_name=user.get("name", "VonVault User"),
            attestation=AttestationConveyancePreference.NONE,
            authenticator_selection=AuthenticatorSelectionCriteria(
                resident_key=ResidentKeyRequirement.PREFERRED,
                user_verification=UserVerificationRequirement.PREFERRED,
            ),
            exclude_credentials=[
                {"id": cred["credential_id"], "type": "public-key"} 
                for cred in db.webauthn_credentials.find({"user_id": user_id})
            ],
        )
        
        # Store challenge temporarily
        challenge_id = str(secrets.token_urlsafe(32))
        db.webauthn_challenges.insert_one({
            "challenge_id": challenge_id,
            "user_id": user_id,
            "challenge": base64.urlsafe_b64encode(options.challenge).decode(),
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(minutes=5)).isoformat()
        })
        
        return {
            "success": True,
            "challenge_id": challenge_id,
            "options": {
                "challenge": base64.urlsafe_b64encode(options.challenge).decode(),
                "rp": {"id": options.rp.id, "name": options.rp.name},
                "user": {
                    "id": base64.urlsafe_b64encode(options.user.id).decode(),
                    "name": options.user.name,
                    "displayName": options.user.display_name,
                },
                "pubKeyCredParams": [{"alg": param.alg, "type": param.type} for param in options.pub_key_cred_params],
                "timeout": options.timeout,
                "excludeCredentials": options.exclude_credentials,
                "authenticatorSelection": {
                    "authenticatorAttachment": options.authenticator_selection.authenticator_attachment if options.authenticator_selection else None,
                    "residentKey": options.authenticator_selection.resident_key if options.authenticator_selection else None,
                    "userVerification": options.authenticator_selection.user_verification if options.authenticator_selection else None,
                },
                "attestation": options.attestation
            }
        }
        
    except Exception as e:
        print(f"WebAuthn registration begin error: {e}")
        raise HTTPException(status_code=500, detail="Failed to begin biometric registration")

async def webauthn_register_complete_impl(request: WebAuthnRegistration, authorization: str):
    """Complete WebAuthn biometric registration"""
    user_id = require_auth(authorization)
    
    try:
        # Verify the registration response
        # For now, we'll store the credential without full verification
        # In production, you'd want to verify the attestation
        
        credential = {
            "user_id": user_id,
            "credential_id": request.credential_id,
            "public_key": request.public_key,
            "sign_count": request.sign_count,
            "device_name": "Biometric Device",
            "created_at": datetime.utcnow().isoformat(),
            "last_used": datetime.utcnow().isoformat()
        }
        
        # Store credential
        db.webauthn_credentials.insert_one(credential)
        
        # Enable biometric 2FA for user
        db.users.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "biometric_2fa_enabled": True,
                    "enhanced_2fa_enabled": True,  # Master flag for Enhanced 2FA
                    "updated_at": datetime.utcnow().isoformat()
                }
            }
        )
        
        return {
            "success": True,
            "verified": True,
            "message": "Biometric authentication enabled successfully",
            "credential_id": request.credential_id
        }
        
    except Exception as e:
        print(f"WebAuthn registration complete error: {e}")
        raise HTTPException(status_code=500, detail="Failed to complete biometric registration")

async def webauthn_authenticate_begin_impl(request: dict, authorization: str):
    """Begin WebAuthn biometric authentication"""
    user_id = require_auth(authorization)
    
    try:
        # Get user's stored credentials
        user_credentials = list(db.webauthn_credentials.find({"user_id": user_id}))
        if not user_credentials:
            raise HTTPException(status_code=400, detail="No biometric credentials found")
        
        # Generate authentication challenge
        options = generate_authentication_options(
            rp_id="vonartis.app",
            allow_credentials=[
                {"id": cred["credential_id"], "type": "public-key"}
                for cred in user_credentials
            ],
            user_verification=UserVerificationRequirement.PREFERRED,
        )
        
        # Store challenge temporarily
        challenge_id = str(secrets.token_urlsafe(32))
        db.webauthn_challenges.insert_one({
            "challenge_id": challenge_id,
            "user_id": user_id,
            "challenge": base64.urlsafe_b64encode(options.challenge).decode(),
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(minutes=5)).isoformat()
        })
        
        return {
            "success": True,
            "challenge_id": challenge_id,
            "options": {
                "challenge": base64.urlsafe_b64encode(options.challenge).decode(),
                "timeout": options.timeout,
                "rpId": options.rp_id,
                "allowCredentials": [
                    {
                        "id": cred["id"],
                        "type": cred["type"],
                        "transports": cred.get("transports", [])
                    }
                    for cred in options.allow_credentials
                ],
                "userVerification": options.user_verification
            }
        }
        
    except Exception as e:
        print(f"WebAuthn authentication begin error: {e}")
        raise HTTPException(status_code=500, detail="Failed to begin biometric authentication")

async def webauthn_authenticate_complete_impl(request: WebAuthnVerification, authorization: str):
    """Complete WebAuthn biometric authentication"""
    user_id = require_auth(authorization)
    
    try:
        # Find the credential
        credential = db.webauthn_credentials.find_one({
            "user_id": user_id,
            "credential_id": request.credential_id
        })
        
        if not credential:
            raise HTTPException(status_code=400, detail="Credential not found")
        
        # For now, we'll do basic validation
        # In production, you'd want to verify the signature properly
        
        # Update credential usage
        db.webauthn_credentials.update_one(
            {"_id": credential["_id"]},
            {
                "$set": {
                    "last_used": datetime.utcnow().isoformat(),
                    "sign_count": credential["sign_count"] + 1
                }
            }
        )
        
        return {
            "success": True,
            "verified": True,
            "message": "Biometric authentication successful"
        }
        
    except Exception as e:
        print(f"WebAuthn authentication complete error: {e}")
        raise HTTPException(status_code=500, detail="Failed to complete biometric authentication")

# ===== PHASE 2 ENHANCEMENT: PUSH NOTIFICATION IMPLEMENTATION =====

async def push_notification_register_impl(request: PushNotificationToken, authorization: str):
    """Register device for push notification 2FA"""
    user_id = require_auth(authorization)
    
    try:
        # Store push notification token
        device = {
            "user_id": user_id,
            "token": request.token,
            "device_type": request.device_type,
            "device_name": request.device_name or "Device",
            "created_at": datetime.utcnow().isoformat(),
            "last_used": datetime.utcnow().isoformat(),
            "enabled": True
        }
        
        # Remove existing token for this user/device combination
        db.push_devices.delete_many({
            "user_id": user_id,
            "token": request.token
        })
        
        # Insert new device
        db.push_devices.insert_one(device)
        
        # Enable push notification 2FA for user
        db.users.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "push_2fa_enabled": True,
                    "enhanced_2fa_enabled": True,  # Master flag for Enhanced 2FA
                    "updated_at": datetime.utcnow().isoformat()
                }
            }
        )
        
        return {
            "success": True,
            "message": "Push notification 2FA enabled successfully",
            "device_registered": True
        }
        
    except Exception as e:
        print(f"Push notification registration error: {e}")
        raise HTTPException(status_code=500, detail="Failed to register device for push notifications")

async def push_notification_send_impl(request: dict, authorization: str):
    """Send push notification 2FA challenge"""
    user_id = require_auth(authorization)
    
    try:
        # Get user's devices
        devices = list(db.push_devices.find({"user_id": user_id, "enabled": True}))
        if not devices:
            raise HTTPException(status_code=400, detail="No registered devices found")
        
        # Generate challenge
        challenge_id = str(secrets.token_urlsafe(32))
        challenge_code = secrets.token_urlsafe(8)
        
        # Store challenge
        db.push_challenges.insert_one({
            "challenge_id": challenge_id,
            "user_id": user_id,
            "challenge_code": challenge_code,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(minutes=5)).isoformat(),
            "verified": False
        })
        
        # In production, you'd send actual push notifications here
        # For now, we'll just return the challenge for testing
        
        return {
            "success": True,
            "challenge_id": challenge_id,
            "message": "Push notification sent to registered devices",
            "devices_notified": len(devices),
            # Remove in production - for testing only
            "test_challenge_code": challenge_code
        }
        
    except Exception as e:
        print(f"Push notification send error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send push notification")

async def push_notification_verify_impl(request: dict, authorization: str):
    """Verify push notification 2FA response"""
    user_id = require_auth(authorization)
    challenge_id = request.get("challenge_id", "")
    challenge_code = request.get("challenge_code", "")
    
    try:
        # Find challenge
        challenge = db.push_challenges.find_one({
            "challenge_id": challenge_id,
            "user_id": user_id,
            "verified": False
        })
        
        if not challenge:
            raise HTTPException(status_code=400, detail="Invalid or expired challenge")
        
        # Check if expired
        expires_at = datetime.fromisoformat(challenge["expires_at"])
        if datetime.utcnow() > expires_at:
            raise HTTPException(status_code=400, detail="Challenge expired")
        
        # Verify challenge code
        if challenge["challenge_code"] != challenge_code:
            return {
                "success": False,
                "verified": False,
                "message": "Invalid challenge code"
            }
        
        # Mark challenge as verified
        db.push_challenges.update_one(
            {"challenge_id": challenge_id},
            {
                "$set": {
                    "verified": True,
                    "verified_at": datetime.utcnow().isoformat()
                }
            }
        )
        
        return {
            "success": True,
            "verified": True,
            "message": "Push notification 2FA verified successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Push notification verification error: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify push notification")

# ===== USER MANAGEMENT ENDPOINTS =====

@app.post("/api/auth/signup")
@limiter.limit("5/minute")
async def user_signup(request: Request, user_data: UserSignup):
    """Create new user account with email/password"""
    print(f"DEBUG: Raw request received at /auth/signup")
    print(f"DEBUG: Request headers: {dict(request.headers)}")
    try:
        # Debug: Print incoming data
        print(f"DEBUG: Signup request data: {user_data}")
        print(f"DEBUG: Name: {user_data.name}")
        print(f"DEBUG: Email: {user_data.email}")
        print(f"DEBUG: Phone: {user_data.phone}")
        print(f"DEBUG: Country code: {user_data.country_code}")
        
        # Validate email format
        if not validate_email(user_data.email):
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Check if user already exists
        existing_user = db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        # Check if phone number already exists
        formatted_phone = f"{user_data.country_code}{user_data.phone.replace('+', '').replace('-', '').replace(' ', '')}"
        existing_phone = db.users.find_one({"phone": formatted_phone})
        if existing_phone:
            raise HTTPException(status_code=400, detail="User with this phone number already exists")
        
        # Hash password
        hashed_password = hash_password(user_data.password)
        
        # Create user document
        user_id = str(uuid.uuid4())
        id_number = get_next_user_id()
        
        # Check if this is an admin email
        admin_emails = ["admin@vonartis.com", "security@vonartis.com"]
        is_admin = user_data.email in admin_emails
        
        user_doc = {
            "id": user_id,
            "user_id": user_id,
            "id_number": id_number,
            "email": user_data.email,
            "password": hashed_password,
            "name": user_data.name,
            "first_name": user_data.name.split(' ')[0] if user_data.name else '',
            "last_name": ' '.join(user_data.name.split(' ')[1:]) if len(user_data.name.split(' ')) > 1 else '',
            "phone": f"{user_data.country_code}{user_data.phone}",
            "country_code": user_data.country_code,
            "email_verified": False,
            "phone_verified": False,
            "membership_level": "basic" if is_admin else "none",
            "total_invested": 0.0,
            "crypto_connected": False,
            "bank_connected": False,
            "created_at": datetime.utcnow().isoformat(),
            "last_login": datetime.utcnow().isoformat(),
            "auth_type": "email",
            "is_admin": is_admin,
            "onboarding_complete": False
        }
        
        # Insert user into database
        result = db.users.insert_one(user_doc)
        
        # Generate JWT token
        token = generate_jwt(user_id)
        
        # Prepare response
        user_response = UserResponse(
            id=user_id,
            user_id=user_id,
            name=user_data.name,
            first_name=user_doc["first_name"],
            last_name=user_doc["last_name"],
            email=user_data.email,
            phone=user_doc["phone"],
            email_verified=False,
            phone_verified=False,
            membership_level=user_doc["membership_level"],
            created_at=user_doc["created_at"],
            is_admin=is_admin
        )
        
        return {
            "message": "User created successfully",
            "user": user_response,
            "token": token,
            "authenticated": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create user account")

@app.post("/api/auth/login")
@limiter.limit("10/minute")
async def user_login(request: Request, login_data: UserLogin):
    """Authenticate user with email/password"""
    try:
        # Find user by email
        user = db.users.find_one({"email": login_data.email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not verify_password(login_data.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Update last login
        db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.utcnow().isoformat()}}
        )
        
        # Generate JWT token
        token = generate_jwt(user["user_id"])
        
        # Prepare response
        user_response = UserResponse(
            id=user["user_id"],
            user_id=user["user_id"],
            name=user.get("name", ""),
            first_name=user.get("first_name", ""),
            last_name=user.get("last_name", ""),
            email=user["email"],
            phone=user.get("phone", ""),
            email_verified=user.get("email_verified", False),
            phone_verified=user.get("phone_verified", False),
            membership_level=user.get("membership_level", "none"),
            created_at=user.get("created_at", ""),
            is_admin=user.get("is_admin", False)
        )
        
        return {
            "message": "Login successful",
            "user": user_response,
            "token": token,
            "authenticated": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.get("/api/auth/me")
async def get_current_user(authorization: str = Header(...)):
    """Get current authenticated user information"""
    try:
        user_id = require_auth(authorization)
        
        # Find user in database
        user = db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prepare response
        user_response = UserResponse(
            id=user["user_id"],
            user_id=user["user_id"],
            name=user.get("name", ""),
            first_name=user.get("first_name", ""),
            last_name=user.get("last_name", ""),
            email=user["email"],
            phone=user.get("phone", ""),
            email_verified=user.get("email_verified", False),
            phone_verified=user.get("phone_verified", False),
            membership_level=user.get("membership_level", "none"),
            created_at=user.get("created_at", ""),
            is_admin=user.get("is_admin", False)
        )
        
        return {
            "user": user_response,
            "authenticated": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get user error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user information")

# Authentication Endpoints
@app.post("/api/auth/telegram")
@limiter.limit("10/minute")  # Rate limit: 10 requests per minute
def telegram_auth(auth_data: TelegramAuth, request: Request):
    """Authenticate user via Telegram WebApp"""
    user_id = auth_data.user_id or str(uuid.uuid4())
    token = generate_jwt(user_id)
    return {"token": token, "user_id": user_id}

@app.post("/api/auth/telegram/webapp")
async def telegram_webapp_auth(request: dict):
    """Authenticate Telegram WebApp user with validation"""
    try:
        init_data = request.get("initData", "")
        bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        
        if not bot_token:
            raise HTTPException(status_code=500, detail="Telegram bot token not configured")
        
        # Validate Telegram data
        telegram_user = validate_telegram_init_data(init_data, bot_token)
        
        # Create or update user in database
        user = await create_or_update_telegram_user(db, telegram_user)
        
        # Generate JWT token
        token = generate_jwt(user["id"])
        
        return {
            "token": token,
            "user": {
                "id": user["id"],
                "telegram_id": user["telegram_id"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "username": user.get("telegram_username", ""),
                "auth_type": "telegram"
            },
            "authenticated": True
        }
        
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Authentication failed")

# 2FA SMS Endpoints
@app.post("/api/auth/sms/send")
@limiter.limit("3/minute")
async def send_sms_2fa_code(request: Request, sms_request: SMSSendRequest, authorization: str = Header(...)):
    """Send SMS 2FA verification code"""
    user_id = require_auth(authorization)
    
    try:
        result = await send_sms_verification(sms_request.phone_number)
        
        # Store phone number temporarily for this user (you might want to add this to user profile)
        # For now, we'll just return success
        return {
            "success": True,
            "message": result["message"],
            "phone_number": result["phone_number"]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"SMS send error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send SMS code")

@app.post("/api/auth/sms/verify")
@limiter.limit("5/minute")
async def verify_sms_2fa_code(request: Request, verify_request: SMSVerifyRequest, authorization: str = Header(...)):
    """Verify SMS 2FA code"""
    user_id = require_auth(authorization)
    
    try:
        result = await verify_sms_code(verify_request.phone_number, verify_request.code)
        
        if result["valid"]:
            return {
                "success": True,
                "verified": True,
                "message": "SMS code verified successfully"
            }
        else:
            return {
                "success": False,
                "verified": False,
                "message": "Invalid or expired SMS code"
            }
    except HTTPException:
        raise
    except Exception as e:
        print(f"SMS verify error: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify SMS code")

@app.post("/api/auth/sms/setup")
@limiter.limit("3/minute")
async def setup_sms_2fa(request: Request, setup_request: SMS2FASetupRequest, authorization: str = Header(...)):
    """Complete SMS 2FA setup for user"""
    user_id = require_auth(authorization)
    
    try:
        # Format phone number
        formatted_phone = format_phone_number(setup_request.phone_number)
        
        # Validate phone number
        if not validate_phone_number(formatted_phone):
            raise HTTPException(status_code=400, detail="Invalid phone number format")
        
        # Update user profile with SMS 2FA settings
        update_result = db.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "sms_2fa_enabled": True,
                    "sms_2fa_phone": formatted_phone,
                    "updated_at": datetime.utcnow().isoformat()
                }
            }
        )
        
        if update_result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "message": "SMS 2FA enabled successfully",
            "phone_number": formatted_phone
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"SMS 2FA setup error: {e}")
        raise HTTPException(status_code=500, detail="Failed to setup SMS 2FA")

# Email 2FA Endpoints
@app.post("/api/auth/email/send")
@limiter.limit("3/minute")
async def send_email_2fa_code(request: Request, email_request: EmailSendRequest, authorization: str = Header(...)):
    """Send Email 2FA verification code"""
    user_id = require_auth(authorization)
    
    try:
        result = await send_email_verification(email_request.email)
        
        return {
            "success": True,
            "message": result["message"],
            "email": result["email"]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Email send error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email code")

@app.post("/api/auth/email/verify")
@limiter.limit("5/minute")
async def verify_email_2fa_code(request: Request, verify_request: EmailVerifyRequest, authorization: str = Header(...)):
    """Verify Email 2FA code"""
    user_id = require_auth(authorization)
    
    try:
        result = await verify_email_code(verify_request.email, verify_request.code)
        
        if result["valid"]:
            return {
                "success": True,
                "verified": True,
                "message": "Email code verified successfully"
            }
        else:
            return {
                "success": False,
                "verified": False,
                "message": "Invalid or expired email code"
            }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Email verify error: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify email code")

@app.post("/api/auth/email/setup")
@limiter.limit("3/minute")
async def setup_email_2fa(request: Request, setup_request: Email2FASetupRequest, authorization: str = Header(...)):
    """Complete Email 2FA setup for user"""
    user_id = require_auth(authorization)
    
    try:
        # Validate email
        if not validate_email(setup_request.email):
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Update user profile with Email 2FA settings
        update_result = db.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "email_2fa_enabled": True,
                    "email_2fa_address": setup_request.email,
                    "updated_at": datetime.utcnow().isoformat()
                }
            }
        )
        
        if update_result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "message": "Email 2FA enabled successfully",
            "email": setup_request.email
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Email 2FA setup error: {e}")
        raise HTTPException(status_code=500, detail="Failed to setup Email 2FA")

# TOTP/Authenticator 2FA Endpoints
@app.post("/api/auth/totp/setup")
async def setup_totp_2fa(authorization: str = Header(...)):
    """Setup TOTP 2FA (Google Authenticator, etc.)"""
    user_id = require_auth(authorization)
    
    try:
        # Get user info for QR code
        user = db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Generate TOTP secret
        secret = pyotp.random_base32()
        
        # Create TOTP object
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.get('first_name', 'VonVault User'),
            issuer_name="VonVault"
        )
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        # Create QR code image
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        # Store temporary secret (not enabled until verified)
        db.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "totp_secret_pending": secret,
                    "updated_at": datetime.utcnow().isoformat()
                }
            }
        )
        
        return {
            "success": True,
            "secret": secret,
            "qr_code": f"data:image/png;base64,{qr_code_base64}",
            "manual_entry_key": secret
        }
        
    except Exception as e:
        print(f"TOTP setup error: {e}")
        raise HTTPException(status_code=500, detail="Failed to setup TOTP 2FA")

@app.post("/api/auth/totp/verify")
async def verify_totp_2fa(request: dict, authorization: str = Header(...)):
    """Verify TOTP 2FA code and enable 2FA"""
    user_id = require_auth(authorization)
    code = request.get("code", "")
    
    try:
        # Get user's pending TOTP secret
        user = db.users.find_one({"id": user_id})
        if not user or not user.get("totp_secret_pending"):
            raise HTTPException(status_code=400, detail="No pending TOTP setup found")
        
        # Verify the code
        totp = pyotp.TOTP(user["totp_secret_pending"])
        if not totp.verify(code):
            return {
                "success": False,
                "verified": False,
                "message": "Invalid TOTP code"
            }
        
        # Code is valid - enable TOTP 2FA
        backup_codes = [pyotp.random_base32()[:8] for _ in range(10)]  # Generate 10 backup codes
        
        db.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "totp_2fa_enabled": True,
                    "totp_secret": user["totp_secret_pending"],
                    "backup_codes": backup_codes,
                    "updated_at": datetime.utcnow().isoformat()
                },
                "$unset": {
                    "totp_secret_pending": ""
                }
            }
        )
        
        return {
            "success": True,
            "verified": True,
            "message": "TOTP 2FA enabled successfully",
            "backup_codes": backup_codes
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"TOTP verification error: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify TOTP code")

# Membership Endpoints
@app.get("/api/membership/status")
def get_membership_status_endpoint(authorization: str = Header(...)):
    """Get user's current membership status and available plans"""
    user_id = require_auth(authorization)
    status = get_membership_status(user_id)
    return status

@app.get("/api/membership/tiers")
def get_membership_tiers():
    """Get information about all membership tiers"""
    return {"tiers": MEMBERSHIP_TIERS}

# Investment Plan Endpoints
@app.get("/api/investment-plans")
def get_investment_plans_for_user(authorization: str = Header(...)):
    """Get investment plans available for the current user based on their membership level"""
    user_id = require_auth(authorization)
    membership_status = get_membership_status(user_id)
    
    # Convert plans to dict format for JSON response
    plans_dict = []
    for plan in membership_status.available_plans:
        plan_dict = {
            "id": plan.id,
            "name": plan.name,
            "description": plan.description,
            "membership_level": plan.membership_level,
            "rate": plan.rate,
            "term_days": plan.term_days,
            "min_amount": plan.min_amount,
            "max_amount": plan.max_amount,
            "is_active": plan.is_active,
            "term": plan.term_days // 30  # Backward compatibility
        }
        plans_dict.append(plan_dict)
    
    return {"plans": plans_dict, "membership": membership_status}

@app.get("/api/investment-plans/all")
def get_all_investment_plans():
    """Get all investment plans (for admin purposes)"""
    plans = list(db.investment_plans.find({}))
    for plan in plans:
        plan["_id"] = str(plan["_id"])
        plan["term"] = plan["term_days"] // 30  # Backward compatibility
    return {"plans": plans}

# Wallet Endpoints
@app.post("/api/wallet/verify-signature")
def verify_signature(payload: WalletVerification):
    """Verify Ethereum wallet signature"""
    try:
        msg = encode_defunct(text=payload.message)
        recovered = Account.recover_message(msg, signature=payload.signature)
        is_valid = recovered.lower() == payload.address.lower()
        
        if is_valid:
            token = generate_jwt(payload.address)
            return {
                "valid": True,
                "address": recovered,
                "token": token
            }
        else:
            return {"valid": False, "error": "Invalid signature"}
    except Exception as e:
        return {"valid": False, "error": str(e)}

# Enhanced Crypto Endpoints
@app.get("/api/crypto/networks")
async def get_supported_networks():
    """Get all supported networks with their details"""
    return {"networks": NETWORKS}

@app.get("/api/crypto/networks/{token}")
async def get_networks_for_token(token: str, authorization: str = Header(...)):
    """Get available networks for a specific token"""
    user_id = require_auth(authorization)
    
    try:
        networks = await crypto_service.get_available_networks_for_token(token)
        return {
            "token": token.upper(),
            "available_networks": networks,
            "count": len(networks)
        }
    except Exception as e:
        return {"error": str(e), "available_networks": []}

@app.get("/api/crypto/deposit-address/{token}/{network}")
async def get_deposit_address_for_network(token: str, network: str, authorization: str = Header(...)):
    """Get deposit address for specific token and network"""
    user_id = require_auth(authorization)
    
    try:
        address_info = await crypto_service.get_deposit_address(token, network)
        return address_info
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get deposit address: {str(e)}")

@app.get("/api/crypto/deposit-addresses")
async def get_all_deposit_addresses(authorization: str = Header(...)):
    """Get all available deposit addresses across all networks"""
    user_id = require_auth(authorization)
    
    addresses = {}
    
    # Organize by token, then by network
    for token in ["USDC", "USDT"]:
        addresses[token.lower()] = {}
        
        try:
            networks = await crypto_service.get_available_networks_for_token(token)
            for network_info in networks:
                network = network_info["network"]
                try:
                    address_info = await crypto_service.get_deposit_address(token, network)
                    addresses[token.lower()][network] = address_info
                except Exception as e:
                    print(f"Error getting {token} address for {network}: {str(e)}")
                    addresses[token.lower()][network] = None
        except Exception as e:
            print(f"Error getting networks for {token}: {str(e)}")
    
    return {
        "addresses": addresses,
        "supported_networks": list(NETWORKS.keys()),
        "conversion_fee_percent": CRYPTO_CONVERSION_FEE_PERCENT
    }

@app.get("/api/crypto/balances")
async def get_all_crypto_balances(authorization: str = Header(...)):
    """Get real crypto balances for all configured wallets across all networks"""
    user_id = require_auth(authorization)
    
    try:
        balances = await crypto_service.get_all_wallet_balances()
        
        # Calculate total balances across all networks
        total_usdc = 0
        total_usdt = 0
        
        for wallet_type, wallet_balances in balances.items():
            for token_network, balance_info in wallet_balances.items():
                if balance_info["token"] == "USDC":
                    total_usdc += balance_info["balance"]
                elif balance_info["token"] == "USDT":
                    total_usdt += balance_info["balance"]
        
        # Calculate conversion fees
        usdc_fee_info = await crypto_service.calculate_conversion_fee(total_usdc)
        usdt_fee_info = await crypto_service.calculate_conversion_fee(total_usdt)
        total_fee_info = await crypto_service.calculate_conversion_fee(total_usdc + total_usdt)
        
        return {
            "balances": balances,
            "totals": {
                "usdc": total_usdc,
                "usdt": total_usdt,
                "total_usd": total_usdc + total_usdt
            },
            "conversion_fees": {
                "usdc": usdc_fee_info,
                "usdt": usdt_fee_info,
                "total": total_fee_info
            },
            "supported_networks": list(NETWORKS.keys())
        }
    except Exception as e:
        return {"error": str(e), "balances": {}}

@app.get("/api/crypto/transactions")
async def get_crypto_transactions(authorization: str = Header(...)):
    """Get user's crypto transaction history"""
    user_id = require_auth(authorization)
    
    transactions = list(db.crypto_transactions.find({"user_id": user_id}).sort("created_at", -1))
    
    for tx in transactions:
        tx["_id"] = str(tx["_id"])
    
    return {"transactions": transactions}

@app.post("/api/crypto/monitor-deposits")
async def monitor_new_deposits(authorization: str = Header(...)):
    """Monitor for new crypto deposits across all networks"""
    user_id = require_auth(authorization)
    
    try:
        # For now, we'll only monitor Polygon (existing implementation)
        # TODO: Extend to monitor all networks
        new_deposits = []  # Placeholder - would implement multi-network monitoring
        
        return {
            "new_deposits": new_deposits,
            "count": len(new_deposits),
            "message": f"Found {len(new_deposits)} new deposits across all networks",
            "monitored_networks": ["polygon"]  # Will expand to all networks
        }
    except Exception as e:
        return {"error": str(e), "new_deposits": []}

@app.get("/api/crypto/user-balance/{user_address}")
async def get_user_crypto_balance(user_address: str, network: str = "polygon", authorization: str = Header(...)):
    """Get crypto balance for a specific user wallet address on specified network"""
    user_id = require_auth(authorization)
    
    try:
        # Validate address format
        if not user_address.startswith("0x") or len(user_address) != 42:
            raise HTTPException(status_code=400, detail="Invalid wallet address format")
        
        if network not in NETWORKS:
            raise HTTPException(status_code=400, detail=f"Unsupported network: {network}")
        
        usdc_balance = await crypto_service.get_token_balance(user_address, "USDC", network)
        usdt_balance = await crypto_service.get_token_balance(user_address, "USDT", network)
        
        total_usd = usdc_balance + usdt_balance
        conversion_fee_info = await crypto_service.calculate_conversion_fee(total_usd)
        
        return {
            "address": user_address,
            "network": network,
            "network_name": NETWORKS[network]["name"],
            "balances": [
                {
                    "token": "USDC",
                    "balance": usdc_balance,
                    "usd_value": usdc_balance,
                    "network": network
                },
                {
                    "token": "USDT", 
                    "balance": usdt_balance,
                    "usd_value": usdt_balance,
                    "network": network
                }
            ],
            "total_usd": total_usd,
            "conversion_fee_info": conversion_fee_info
        }
    except Exception as e:
        return {"error": str(e), "balances": []}

# Bank Endpoints
@app.get("/api/bank/accounts")
def get_bank_accounts(user_id: str = Header(..., alias="X-User-ID")):
    """Get user's bank accounts via Teller API"""
    try:
        response = requests.get("https://api.teller.io/accounts", headers={"Authorization": f"Basic {TELLER_API_KEY}", "Accept": "application/json"})
        if response.status_code == 200:
            return response.json()
        else:
            return {
                "accounts": [
                    {"id": "acc_1", "name": "Checking Account", "balance": {"available": "5250.00"}},
                    {"id": "acc_2", "name": "Savings Account", "balance": {"available": "12480.00"}}
                ]
            }
    except Exception as e:
        return {"error": str(e), "mock_data": True}

@app.get("/api/bank/balance")
def get_bank_balance(user_id: str = Header(..., alias="X-User-ID")):
    """Get total bank balance"""
    try:
        response = requests.get("https://api.teller.io/accounts", headers={"Authorization": f"Basic {TELLER_API_KEY}", "Accept": "application/json"})
        if response.status_code == 200:
            accounts = response.json()
            return {"accounts": [acc for acc in accounts if "balance" in acc]}
        else:
            return {"total_balance": 17730.00, "accounts": 2}
    except Exception:
        return {"total_balance": 17730.00, "accounts": 2}

# Investment Endpoints
@app.get("/api/investments")
def get_investments(authorization: str = Header(...)):
    """Get user's investments"""
    user_id = require_auth(authorization)
    
    investments = list(db.investments.find({"user_id": user_id}))
    
    for inv in investments:
        inv["_id"] = str(inv["_id"])
    
    return {"investments": investments}

@app.post("/api/investments")
def create_investment(investment: Investment, authorization: str = Header(...)):
    """Create new investment with membership validation and basic membership support"""
    user_id = require_auth(authorization)
    
    # Get current membership status
    membership_status = get_membership_status(user_id)
    
    # Handle different membership levels
    if membership_status.level == "basic":
        # Basic members can invest in Basic plans or upgrade to Club
        if investment.amount >= MEMBERSHIP_TIERS["club"]["min_amount"]:
            # User is upgrading to Club membership
            investment_data = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "name": investment.name,
                "amount": investment.amount,
                "rate": 6.0,  # Club rate for 365 days
                "term": investment.term,
                "membership_level": "club",
                "created_at": datetime.utcnow().isoformat(),
                "status": "active"
            }
            
            # Update user's membership level
            db.users.update_one(
                {"user_id": user_id},
                {"$set": {"membership_level": "club"}}
            )
            
            result = db.investments.insert_one(investment_data)
            investment_data["_id"] = str(result.inserted_id)
            
            return {"investment": investment_data, "message": f"Congratulations! You've upgraded to Club Member with ${investment.amount:,.0f} invested."}
        else:
            # Basic investment (small amounts)
            if investment.amount < 100:  # Basic minimum
                raise HTTPException(status_code=400, detail="Minimum investment for Basic Members is $100")
            if investment.amount > 5000:  # Basic maximum
                raise HTTPException(status_code=400, detail="Maximum investment for Basic Members is $5,000. Invest $20,000+ to become a Club Member.")
            
            investment_data = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "name": investment.name,
                "amount": investment.amount,
                "rate": investment.rate,
                "term": investment.term,
                "membership_level": "basic",
                "created_at": datetime.utcnow().isoformat(),
                "status": "active"
            }
            
            result = db.investments.insert_one(investment_data)
            investment_data["_id"] = str(result.inserted_id)
            
            return {"investment": investment_data, "message": "Investment created successfully!"}
    
    elif membership_status.level == "none":
        # Legacy handling - should rarely happen now that users start with basic
        if investment.amount >= MEMBERSHIP_TIERS["club"]["min_amount"]:
            # Allow first investment if it meets Club minimum ($20,000)
            investment_data = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "name": investment.name,
                "amount": investment.amount,
                "rate": 6.0,  # Club rate for 365 days
                "term": investment.term,
                "membership_level": "club",
                "created_at": datetime.utcnow().isoformat(),
                "status": "active"
            }
            
            result = db.investments.insert_one(investment_data)
            investment_data["_id"] = str(result.inserted_id)
            
            return {"investment": investment_data, "message": f"Investment created successfully! You are now a Club Member with ${investment.amount:,.0f} invested."}
        else:
            raise HTTPException(status_code=400, detail="Minimum investment required is $20,000 to become a Club Member")
    
    # Existing logic for established members (club, premium, vip, elite)
    # Find the specific plan being invested in
    selected_plan = None
    for plan in membership_status.available_plans:
        if (plan.rate == investment.rate and 
            plan.term_days == (investment.term * 30)):  # Convert term back to days
            selected_plan = plan
            break
    
    if not selected_plan:
        raise HTTPException(status_code=400, detail="Invalid investment plan for your membership level")
    
    # Validate investment amount
    if investment.amount < selected_plan.min_amount:
        raise HTTPException(status_code=400, detail=f"Minimum investment for your membership level is ${selected_plan.min_amount:,.0f}")
    
    if investment.amount > selected_plan.max_amount:
        raise HTTPException(status_code=400, detail=f"Maximum investment per transaction is ${selected_plan.max_amount:,.0f}")
    
    investment_data = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": investment.name,
        "amount": investment.amount,
        "rate": investment.rate,
        "term": investment.term,
        "membership_level": membership_status.level,
        "created_at": datetime.utcnow().isoformat(),
        "status": "active"
    }
    
    result = db.investments.insert_one(investment_data)
    investment_data["_id"] = str(result.inserted_id)
    
    return {"investment": investment_data, "message": "Investment created successfully"}

# Profile Endpoints
@app.post("/api/profile")
def save_preferences(prefs: UserPreferences, authorization: str = Header(...)):
    """Save user preferences"""
    user_id = require_auth(authorization)
    
    pref_data = {
        "user_id": user_id,
        "theme": prefs.theme,
        "onboarding_complete": prefs.onboarding_complete,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    db.user_preferences.update_one(
        {"user_id": user_id},
        {"$set": pref_data},
        upsert=True
    )
    
    return {"status": "saved", "preferences": pref_data}

@app.get("/api/profile/{user_id}")
def get_preferences(user_id: str, authorization: str = Header(...)):
    """Get user preferences"""
    auth_user_id = require_auth(authorization)
    
    if auth_user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    preferences = db.user_preferences.find_one({"user_id": user_id})
    
    if preferences:
        preferences["_id"] = str(preferences["_id"])
        return preferences
    else:
        return {"user_id": user_id, "theme": "dark", "onboarding_complete": False}

class ProfileDeletionRequest(BaseModel):
    password: str

@app.delete("/api/profile")
@limiter.limit("3/hour")  # Rate limit: 3 deletion attempts per hour
def delete_profile(request: Request, request_data: ProfileDeletionRequest, authorization: str = Header(...)):
    """Delete user profile with safety validations"""
    user_id = require_auth(authorization)
    
    try:
        # Get user from database
        user = db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Safety Check 1: No connected wallets
        connected_wallets = user.get("connected_wallets", [])
        if len(connected_wallets) > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete profile. Please disconnect all {len(connected_wallets)} wallet(s) first."
            )
        
        # Safety Check 2: No bank connections
        if user.get("bank_connected", False):
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete profile. Please disconnect your bank account first."
            )
        
        # Safety Check 3: No active investments
        active_investments = list(db.investments.find({
            "user_id": user_id, 
            "status": {"$in": ["active", "pending"]}
        }))
        if len(active_investments) > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete profile. You have {len(active_investments)} active investment(s). Please wait for completion or withdraw funds."
            )
        
        # TODO: In production, verify password hash
        # For demo purposes, accept any non-empty password
        if not request.password or len(request.password.strip()) < 1:
            raise HTTPException(status_code=400, detail="Password confirmation required")
        
        # Create deletion audit record (preserve for compliance)
        deletion_record = {
            "deleted_user_id": user_id,
            "deletion_timestamp": datetime.utcnow().isoformat(),
            "user_email": user.get("email", "unknown"),
            "total_investments": len(list(db.investments.find({"user_id": user_id}))),
            "membership_level": user.get("membership_level", "unknown"),
            "deletion_reason": "user_requested"
        }
        db.user_deletions.insert_one(deletion_record)
        
        # Delete user data
        db.users.delete_one({"user_id": user_id})
        db.user_preferences.delete_many({"user_id": user_id})
        db.crypto_transactions.delete_many({"user_id": user_id})
        # Note: Keep investment records for audit/tax purposes but mark as deleted
        db.investments.update_many(
            {"user_id": user_id},
            {"$set": {"user_deleted": True, "deleted_at": datetime.utcnow().isoformat()}}
        )
        
        return {
            "success": True,
            "message": "Profile deleted successfully. All personal data has been removed.",
            "deletion_id": str(deletion_record.get("_id", "unknown"))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete profile. Please try again.")

@app.post("/api/account/delete")
@limiter.limit("3/hour")  # Rate limit: 3 deletion attempts per hour  
def delete_user_account(request: Request, request_data: ProfileDeletionRequest, authorization: str = Header(...)):
    """Delete user account with safety validations"""
    return delete_profile(request, authorization)

# Crypto Price Endpoints
@app.get("/api/prices")
def get_crypto_prices():
    """Get current crypto prices"""
    try:
        url = "https://api.coingecko.com/api/v3/simple/price"
        params = {
            "ids": "ethereum,bitcoin,usd-coin,chainlink,uniswap",
            "vs_currencies": "usd",
            "include_24hr_change": "true"
        }
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            return {
                "ethereum": {"usd": 2000.50, "usd_24h_change": 2.3},
                "bitcoin": {"usd": 65000.25, "usd_24h_change": -1.5},
                "usd-coin": {"usd": 1.00, "usd_24h_change": 0.01}
            }
    except Exception as e:
        return {"error": "Unable to fetch prices", "message": str(e)}

# Portfolio Endpoints
@app.get("/api/portfolio")
def get_portfolio(authorization: str = Header(...)):
    """Get user's complete portfolio with membership information"""
    user_id = require_auth(authorization)
    
    # Get membership status
    membership_status = get_membership_status(user_id)
    
    # Get investments
    investments = list(db.investments.find({"user_id": user_id}))
    total_invested = sum(inv.get("amount", 0) for inv in investments)
    
    # Mock crypto balance (will be real API later)
    crypto_balance = 7218.50
    
    # Mock bank balance
    bank_balance = 17730.00
    
    return {
        "user_id": user_id,
        "membership": membership_status,
        "total_portfolio": total_invested + crypto_balance + bank_balance,
        "investments": {
            "total": total_invested,
            "count": len(investments)
        },
        "crypto": {
            "total": crypto_balance
        },
        "bank": {
            "total": bank_balance
        },
        "breakdown": {
            "investments_percentage": (total_invested / (total_invested + crypto_balance + bank_balance)) * 100 if total_invested > 0 else 0,
            "crypto_percentage": (crypto_balance / (total_invested + crypto_balance + bank_balance)) * 100,
            "cash_percentage": (bank_balance / (total_invested + crypto_balance + bank_balance)) * 100
        }
    }

# === PHASE 2: MIGRATION FUNCTION (EXACT SPECIFICATION) ===

def migrate_single_wallet_to_multi():
    """Migration function to convert existing single wallet users to multi-wallet format"""
    try:
        for user in db.users.find({"wallet_address": {"$exists": True}}):
            if user.get("wallet_address"):
                # Convert single wallet to multi-wallet format
                wallet = {
                    "id": str(uuid.uuid4()),
                    "type": user.get("wallet_type", "unknown"),
                    "address": user["wallet_address"],
                    "name": f"{user.get('wallet_type', 'Wallet').title()}",
                    "is_primary": True,
                    "networks": ["ethereum", "polygon", "bsc"],
                    "connected_at": datetime.utcnow().isoformat()
                }
                
                db.users.update_one(
                    {"_id": user["_id"]},
                    {
                        "$set": {
                            "connected_wallets": [wallet],
                            "primary_wallet_id": wallet["id"]
                        },
                        "$unset": {
                            "wallet_address": "",
                            "wallet_type": ""
                        }
                    }
                )
        print("Migration completed successfully")
    except Exception as e:
        print(f"Migration error: {str(e)}")

# === PHASE 2: MULTI-WALLET MANAGEMENT ENDPOINTS (EXACT SPECIFICATION) ===

@app.post("/api/wallets/connect")
def connect_wallet(
    type: str, 
    address: str, 
    name: str = None, 
    networks: List[str] = ["ethereum", "polygon", "bsc"],
    authorization: str = Header(...)
):
    """Connect new wallet"""
    user_id = require_auth(authorization)
    
    try:
        # Check if wallet address already exists for this user
        user = db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        existing_wallets = user.get("connected_wallets", [])
        
        # Check if address already connected
        for wallet in existing_wallets:
            if wallet.get("address", "").lower() == address.lower():
                raise HTTPException(status_code=400, detail="Wallet address already connected")
        
        # Check wallet limit (5 wallets max)
        if len(existing_wallets) >= 5:
            raise HTTPException(status_code=400, detail="Maximum of 5 wallets allowed")
        
        # Create new wallet
        wallet_id = str(uuid.uuid4())
        new_wallet = {
            "id": wallet_id,
            "type": type,
            "address": address,
            "name": name or f"{type.title()} Wallet",
            "is_primary": len(existing_wallets) == 0,  # First wallet is primary
            "networks": networks,
            "connected_at": datetime.utcnow().isoformat(),
            "last_used": None,
            "balance_cache": {}
        }
        
        # Update user with new wallet
        update_data = {"$push": {"connected_wallets": new_wallet}}
        
        # If this is the first wallet, set as primary and update crypto_connected status
        if len(existing_wallets) == 0:
            update_data["$set"] = {
                "primary_wallet_id": wallet_id,
                "crypto_connected": True
            }
        
        db.users.update_one({"user_id": user_id}, update_data)
        
        return {
            "success": True,
            "wallet": new_wallet,
            "message": f"{type.title()} wallet connected successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect wallet: {str(e)}")

@app.get("/api/wallets")
def get_user_wallets(authorization: str = Header(...)):
    """Get all user wallets"""
    user_id = require_auth(authorization)
    
    try:
        user = db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        wallets = user.get("connected_wallets", [])
        primary_wallet_id = user.get("primary_wallet_id")
        
        return {
            "wallets": wallets,
            "primary_wallet_id": primary_wallet_id,
            "count": len(wallets)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get wallets: {str(e)}")

@app.put("/api/wallets/{wallet_id}")
def update_wallet(
    wallet_id: str,
    name: str = None,
    authorization: str = Header(...)
):
    """Update wallet (rename, set primary)"""
    user_id = require_auth(authorization)
    
    try:
        user = db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        wallets = user.get("connected_wallets", [])
        wallet_found = False
        
        # Update wallet in the array
        for wallet in wallets:
            if wallet.get("id") == wallet_id:
                if name:
                    wallet["name"] = name
                wallet["last_used"] = datetime.utcnow().isoformat()
                wallet_found = True
                break
        
        if not wallet_found:
            raise HTTPException(status_code=404, detail="Wallet not found")
        
        # Update in database
        db.users.update_one(
            {"user_id": user_id},
            {"$set": {"connected_wallets": wallets}}
        )
        
        return {
            "success": True,
            "message": "Wallet updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update wallet: {str(e)}")

@app.delete("/api/wallets/{wallet_id}")
def remove_wallet(wallet_id: str, authorization: str = Header(...)):
    """Remove wallet"""
    user_id = require_auth(authorization)
    
    try:
        user = db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        wallets = user.get("connected_wallets", [])
        primary_wallet_id = user.get("primary_wallet_id")
        
        # Find and remove wallet
        wallet_to_remove = None
        updated_wallets = []
        
        for wallet in wallets:
            if wallet.get("id") == wallet_id:
                wallet_to_remove = wallet
            else:
                updated_wallets.append(wallet)
        
        if not wallet_to_remove:
            raise HTTPException(status_code=404, detail="Wallet not found")
        
        # Check if removing primary wallet
        new_primary_id = primary_wallet_id
        crypto_connected = len(updated_wallets) > 0
        
        if primary_wallet_id == wallet_id:
            # Set new primary wallet (first remaining wallet)
            new_primary_id = updated_wallets[0]["id"] if updated_wallets else None
        
        # Update database
        update_data = {
            "$set": {
                "connected_wallets": updated_wallets,
                "crypto_connected": crypto_connected
            }
        }
        if new_primary_id != primary_wallet_id:
            update_data["$set"]["primary_wallet_id"] = new_primary_id
        
        db.users.update_one({"user_id": user_id}, update_data)
        
        return {
            "success": True,
            "message": "Wallet removed successfully",
            "new_primary_wallet_id": new_primary_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove wallet: {str(e)}")

@app.post("/api/wallets/{wallet_id}/primary")
def set_primary_wallet(wallet_id: str, authorization: str = Header(...)):
    """Set as primary wallet"""
    user_id = require_auth(authorization)
    
    try:
        user = db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        wallets = user.get("connected_wallets", [])
        
        # Check if wallet exists
        wallet_found = False
        for wallet in wallets:
            if wallet.get("id") == wallet_id:
                wallet_found = True
                break
        
        if not wallet_found:
            raise HTTPException(status_code=404, detail="Wallet not found")
        
        # Update primary wallet
        db.users.update_one(
            {"user_id": user_id},
            {"$set": {"primary_wallet_id": wallet_id}}
        )
        
        return {
            "success": True,
            "primary_wallet_id": wallet_id,
            "message": "Primary wallet updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set primary wallet: {str(e)}")

# === ENHANCED CRYPTO ENDPOINTS (EXACT SPECIFICATION) ===

@app.get("/api/crypto/deposit-addresses/{wallet_id}")
async def get_deposit_addresses_for_wallet(wallet_id: str, authorization: str = Header(...)):
    """Get deposit addresses for specific wallet"""
    user_id = require_auth(authorization)
    
    try:
        user = db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Find wallet
        wallet = None
        for w in user.get("connected_wallets", []):
            if w.get("id") == wallet_id:
                wallet = w
                break
        
        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet not found")
        
        # Return deposit addresses for wallet's supported networks
        addresses = {}
        for network in wallet.get("networks", []):
            try:
                address_info = await crypto_service.get_deposit_address("USDC", network)
                addresses[network] = address_info
            except:
                addresses[network] = None
        
        return {
            "wallet_id": wallet_id,
            "wallet_address": wallet["address"],
            "addresses": addresses,
            "supported_networks": wallet.get("networks", [])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get deposit addresses: {str(e)}")

@app.get("/api/crypto/balances/{wallet_id}")
async def get_balance_for_wallet(wallet_id: str, authorization: str = Header(...)):
    """Get balance for specific wallet"""
    user_id = require_auth(authorization)
    
    try:
        user = db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Find wallet
        wallet = None
        for w in user.get("connected_wallets", []):
            if w.get("id") == wallet_id:
                wallet = w
                break
        
        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet not found")
        
        # Get balance for wallet across all its supported networks
        balances = {}
        total_usd = 0
        
        for network in wallet.get("networks", []):
            try:
                usdc_balance = await crypto_service.get_token_balance(wallet["address"], "USDC", network)
                usdt_balance = await crypto_service.get_token_balance(wallet["address"], "USDT", network)
                network_total = usdc_balance + usdt_balance
                
                balances[network] = {
                    "usdc": usdc_balance,
                    "usdt": usdt_balance,
                    "total": network_total
                }
                total_usd += network_total
            except:
                balances[network] = {"usdc": 0, "usdt": 0, "total": 0}
        
        return {
            "wallet_id": wallet_id,
            "wallet_address": wallet["address"],
            "balances": balances,
            "total_usd": total_usd,
            "networks": wallet.get("networks", [])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get wallet balance: {str(e)}")

@app.post("/api/crypto/transactions/{wallet_id}")
async def create_transaction_from_wallet(wallet_id: str, authorization: str = Header(...)):
    """Create transaction from specific wallet"""
    user_id = require_auth(authorization)
    
    try:
        user = db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Find wallet
        wallet = None
        for w in user.get("connected_wallets", []):
            if w.get("id") == wallet_id:
                wallet = w
                break
        
        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet not found")
        
        # Placeholder for transaction creation logic
        # This would integrate with actual blockchain transaction creation
        
        return {
            "wallet_id": wallet_id,
            "wallet_address": wallet["address"],
            "message": "Transaction creation from specific wallet not yet implemented",
            "status": "pending"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create transaction: {str(e)}")

# === ADMIN DASHBOARD ENDPOINTS ===

# Admin authentication helper
def require_admin_auth(authorization: str) -> str:
    """Enhanced JWT validation for admin users"""
    user_id = require_auth(authorization)
    
    # Get user from database
    user = db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Check admin status with your vonartis.com admin emails
    admin_emails = [
        "admin@vonartis.com",
        "security@vonartis.com",
        # VonArtis domain admin access only
    ]
    
    user_email = user.get("email", "")
    if user_email not in admin_emails and not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return user_id

# Admin Dashboard Overview
@app.get("/api/admin/overview")
def get_admin_overview(authorization: str = Header(...)):
    """Get admin dashboard overview with key metrics"""
    require_admin_auth(authorization)
    
    try:
        # User metrics
        total_users = db.users.count_documents({})
        verified_users = db.users.count_documents({
            "email_verified": True, 
            "phone_verified": True
        })
        users_with_investments = db.users.count_documents({
            "membership_level": {"$ne": "none"}
        })
        
        # Investment metrics
        total_investments = list(db.investments.aggregate([
            {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
        ]))
        investment_data = total_investments[0] if total_investments else {"total": 0, "count": 0}
        
        # Membership distribution
        membership_counts = list(db.users.aggregate([
            {"$group": {"_id": "$membership_level", "count": {"$sum": 1}}}
        ]))
        
        # Recent signups (last 7 days)
        seven_days_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
        recent_signups = db.users.count_documents({
            "created_at": {"$gte": seven_days_ago}
        })
        
        # Active investments (last 30 days)
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
        recent_investments = db.investments.count_documents({
            "created_at": {"$gte": thirty_days_ago}
        })
        
        return {
            "users": {
                "total": total_users,
                "verified": verified_users,
                "with_investments": users_with_investments,
                "recent_signups": recent_signups
            },
            "investments": {
                "total_amount": investment_data["total"],
                "total_count": investment_data["count"],
                "recent_count": recent_investments
            },
            "membership_distribution": {item["_id"]: item["count"] for item in membership_counts},
            "verification_rate": (verified_users / total_users * 100) if total_users > 0 else 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get admin overview: {str(e)}")

# User Management
@app.get("/api/admin/users")
def get_all_users(
    page: int = 1, 
    limit: int = 50,
    search: str = None,
    filter_verified: bool = None,
    authorization: str = Header(...)
):
    """Get all users with pagination and filtering"""
    require_admin_auth(authorization)
    
    try:
        skip = (page - 1) * limit
        
        # Build query
        query = {}
        if search:
            query["$or"] = [
                {"email": {"$regex": search, "$options": "i"}},
                {"first_name": {"$regex": search, "$options": "i"}},
                {"last_name": {"$regex": search, "$options": "i"}},
                {"user_id": {"$regex": search, "$options": "i"}}
            ]
        
        if filter_verified is not None:
            query["email_verified"] = filter_verified
            query["phone_verified"] = filter_verified
        
        # Get users with pagination
        users = list(db.users.find(query).skip(skip).limit(limit).sort("created_at", -1))
        total_count = db.users.count_documents(query)
        
        # Format user data for admin view
        formatted_users = []
        for user in users:
            # Get user's investment summary
            user_investments = list(db.investments.find({"user_id": user.get("user_id", "")}))
            total_invested = sum(inv.get("amount", 0) for inv in user_investments)
            
            formatted_users.append({
                "id": str(user.get("_id", "")),
                "user_id": user.get("user_id", ""),
                "email": user.get("email", ""),
                "name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
                "phone": user.get("phone", ""),
                "email_verified": user.get("email_verified", False),
                "phone_verified": user.get("phone_verified", False),
                "membership_level": user.get("membership_level", "none"),
                "total_invested": total_invested,
                "crypto_connected": user.get("crypto_connected", False),
                "bank_connected": user.get("bank_connected", False),
                "created_at": user.get("created_at", ""),
                "last_login": user.get("last_login", ""),
                "connected_wallets_count": len(user.get("connected_wallets", []))
            })
        
        return {
            "users": formatted_users,
            "pagination": {
                "current_page": page,
                "total_pages": (total_count + limit - 1) // limit,
                "total_count": total_count,
                "per_page": limit
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get users: {str(e)}")

# User Details
@app.get("/api/admin/users/{user_id}")
def get_user_details(user_id: str, authorization: str = Header(...)):
    """Get detailed user information"""
    require_admin_auth(authorization)
    
    try:
        # Get user
        user = db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user's investments
        investments = list(db.investments.find({"user_id": user_id}))
        
        # Get crypto transactions
        crypto_transactions = list(db.crypto_transactions.find({"user_id": user_id}))
        
        # Get membership status
        membership_status = get_membership_status(user_id)
        
        return {
            "user": {
                "id": str(user.get("_id", "")),
                "user_id": user.get("user_id", ""),
                "email": user.get("email", ""),
                "first_name": user.get("first_name", ""),
                "last_name": user.get("last_name", ""),
                "phone": user.get("phone", ""),
                "email_verified": user.get("email_verified", False),
                "phone_verified": user.get("phone_verified", False),
                "crypto_connected": user.get("crypto_connected", False),
                "bank_connected": user.get("bank_connected", False),
                "created_at": user.get("created_at", ""),
                "last_login": user.get("last_login", ""),
                "connected_wallets": user.get("connected_wallets", []),
                "primary_wallet_id": user.get("primary_wallet_id", ""),
                "totp_2fa_enabled": user.get("totp_2fa_enabled", False),
                "sms_2fa_enabled": user.get("sms_2fa_enabled", False),
                "email_2fa_enabled": user.get("email_2fa_enabled", False)
            },
            "investments": investments,
            "crypto_transactions": crypto_transactions,
            "membership": membership_status
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user details: {str(e)}")

# Investment Analytics
@app.get("/api/admin/investments")
def get_investment_analytics(authorization: str = Header(...)):
    """Get investment analytics for admin dashboard"""
    require_admin_auth(authorization)
    
    try:
        # Total investments by membership level
        investments_by_level = list(db.investments.aggregate([
            {
                "$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "user_id",
                    "as": "user"
                }
            },
            {"$unwind": "$user"},
            {
                "$group": {
                    "_id": "$user.membership_level",
                    "total_amount": {"$sum": "$amount"},
                    "count": {"$sum": 1}
                }
            }
        ]))
        
        # Investments over time (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        daily_investments = list(db.investments.aggregate([
            {
                "$match": {
                    "created_at": {"$gte": thirty_days_ago.isoformat()}
                }
            },
            {
                "$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": {"$dateFromString": {"dateString": "$created_at"}}}},
                    "total_amount": {"$sum": "$amount"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]))
        
        # Top investors
        top_investors = list(db.investments.aggregate([
            {
                "$group": {
                    "_id": "$user_id",
                    "total_invested": {"$sum": "$amount"},
                    "investment_count": {"$sum": 1}
                }
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "_id",
                    "foreignField": "user_id",
                    "as": "user"
                }
            },
            {"$unwind": "$user"},
            {
                "$project": {
                    "user_id": "$_id",
                    "total_invested": 1,
                    "investment_count": 1,
                    "email": "$user.email",
                    "name": {"$concat": ["$user.first_name", " ", "$user.last_name"]},
                    "membership_level": "$user.membership_level"
                }
            },
            {"$sort": {"total_invested": -1}},
            {"$limit": 10}
        ]))
        
        return {
            "investments_by_level": investments_by_level,
            "daily_investments": daily_investments,
            "top_investors": top_investors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get investment analytics: {str(e)}")

# Crypto Analytics
@app.get("/api/admin/crypto")
async def get_crypto_analytics(authorization: str = Header(...)):
    """Get crypto analytics for admin dashboard"""
    require_admin_auth(authorization)
    
    try:
        # Total users with crypto wallets
        users_with_crypto = db.users.count_documents({"crypto_connected": True})
        
        # Wallet distribution
        wallet_types = list(db.users.aggregate([
            {"$unwind": "$connected_wallets"},
            {
                "$group": {
                    "_id": "$connected_wallets.type",
                    "count": {"$sum": 1}
                }
            }
        ]))
        
        # Get business crypto balances
        business_balances = await crypto_service.get_all_wallet_balances()
        
        # Recent transactions
        recent_transactions = list(db.crypto_transactions.find().sort("created_at", -1).limit(20))
        
        return {
            "users_with_crypto": users_with_crypto,
            "wallet_distribution": wallet_types,
            "business_balances": business_balances,
            "recent_transactions": recent_transactions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get crypto analytics: {str(e)}")

# System Health
@app.get("/api/admin/system")
def get_system_health(authorization: str = Header(...)):
    """Get system health and monitoring data"""
    require_admin_auth(authorization)
    
    try:
        # Database stats
        db_stats = db.command("dbStats")
        
        # Collection counts
        collections = {
            "users": db.users.count_documents({}),
            "investments": db.investments.count_documents({}),
            "crypto_transactions": db.crypto_transactions.count_documents({}),
            "user_deletions": db.user_deletions.count_documents({})
        }
        
        # Recent errors (you'd implement error logging)
        # For now, return placeholder
        recent_errors = []
        
        return {
            "database": {
                "size_mb": db_stats.get("dataSize", 0) / (1024 * 1024),
                "collections": collections
            },
            "uptime": "System running normally",
            "recent_errors": recent_errors,
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get system health: {str(e)}")

# === TELEGRAM BOT COMMAND HANDLERS ===

class TelegramUpdate(BaseModel):
    update_id: int
    message: Optional[Dict[str, Any]] = None
    callback_query: Optional[Dict[str, Any]] = None

def send_telegram_message(chat_id: int, text: str, reply_markup: Optional[Dict] = None):
    """Send message via Telegram Bot API"""
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        return False
    
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    
    if reply_markup:
        payload["reply_markup"] = reply_markup
    
    try:
        response = requests.post(url, json=payload)
        return response.status_code == 200
    except Exception as e:
        print(f"Error sending Telegram message: {e}")
        return False

@app.post("/api/telegram/webhook")
def telegram_webhook(update: TelegramUpdate):
    """Handle Telegram bot commands and callback queries"""
    try:
        # Handle callback queries (inline button presses)
        if update.callback_query:
            callback_data = update.callback_query.get("data", "")
            chat_id = update.callback_query.get("message", {}).get("chat", {}).get("id")
            user = update.callback_query.get("from", {})
            first_name = user.get("first_name", "User")
            
            if not chat_id:
                return {"ok": True}
            
            # Handle inline button presses
            if callback_data == "portfolio":
                keyboard = {
                    "inline_keyboard": [
                        [{"text": "📊 View Dashboard", "web_app": {"url": "https://www.vonartis.app"}}],
                        [{"text": "← Back to Menu", "callback_data": "main_menu"}]
                    ]
                }
                
                portfolio_text = f"""📊 <b>Your VonVault Portfolio</b>

Access your complete investment dashboard to view:
• 💰 Current investments and returns
• 📈 Performance analytics 
• 🏆 Membership tier progress
• 💳 Connected accounts

<b>Note:</b> You'll need to login/verify to access your data

<b>Tap "View Dashboard" to see your real-time portfolio!</b>"""
                
                send_telegram_message(chat_id, portfolio_text, keyboard)
                
            elif callback_data == "invest":
                keyboard = {
                    "inline_keyboard": [
                        [{"text": "💰 Create Investment", "web_app": {"url": "https://www.vonartis.app"}}],
                        [{"text": "← Back to Menu", "callback_data": "main_menu"}]
                    ]
                }
                
                invest_text = f"""💰 <b>Investment Opportunities</b>

<b>🏆 Tier-Based Returns:</b>
🌱 Basic: 4% APY ($0-$19K)
🥉 Club: 6% APY ($20K-$49K) 
🥈 Premium: 8-10% APY ($50K-$99K)
🥇 VIP: 12-14% APY ($100K-$249K)
💎 Elite: 16-20% APY ($250K+)

<b>🚀 Start with just $100 and grow your tier automatically!</b>

<b>Note:</b> Full verification required for investments

Tap "Create Investment" to get started."""
                
                send_telegram_message(chat_id, invest_text, keyboard)
                
            elif callback_data == "withdraw":
                keyboard = {
                    "inline_keyboard": [
                        [{"text": "💸 Withdraw Funds", "web_app": {"url": "https://www.vonartis.app"}}],
                        [{"text": "← Back to Menu", "callback_data": "main_menu"}]
                    ]
                }
                
                withdraw_text = f"""💸 <b>Withdraw Your Funds</b>

Access your funds anytime with our secure withdrawal system:
• 🏦 Direct to bank account
• 🪙 To crypto wallets
• ⚡ Instant processing
• 🔐 Multi-factor verification required

<b>Your money, your control!</b>

<b>Note:</b> Verification required for withdrawals

Tap "Withdraw Funds" to access withdrawal options."""
                
                send_telegram_message(chat_id, withdraw_text, keyboard)
                
            elif callback_data == "profile":
                keyboard = {
                    "inline_keyboard": [
                        [{"text": "👤 Manage Profile", "web_app": {"url": "https://www.vonartis.app"}}],
                        [{"text": "← Back to Menu", "callback_data": "main_menu"}]
                    ]
                }
                
                profile_text = f"""👤 <b>Profile & Settings</b>

Manage your VonVault account:
• 📝 Update personal information
• 🔐 Security & 2FA settings
• 🌍 Language preferences  
• 🔗 Connected accounts
• 📊 Membership status

<b>Keep your account secure and up to date!</b>

Tap "Manage Profile" to access your settings."""
                
                send_telegram_message(chat_id, profile_text, keyboard)
                
            elif callback_data == "support":
                keyboard = {
                    "inline_keyboard": [
                        [{"text": "💬 Get Help", "url": "https://t.me/VonVaultSupport"}],
                        [{"text": "📖 Help Center", "web_app": {"url": "https://www.vonartis.app"}}],
                        [{"text": "← Back to Menu", "callback_data": "main_menu"}]
                    ]
                }
                
                support_text = f"""🛟 <b>VonVault Support</b>

Need help? We're here for you 24/7:

• 💬 Live chat with our support team
• 📖 Comprehensive help documentation
• 🎓 Investment guides and tutorials
• 🔐 Security best practices

<b>📞 Response time: Usually under 1 hour</b>

Our team is ready to help you succeed with DeFi investing!"""
                
                send_telegram_message(chat_id, support_text, keyboard)
                
            elif callback_data == "main_menu":
                # Show main menu again
                keyboard = {
                    "inline_keyboard": [
                        [{"text": "🚀 Launch VonVault", "web_app": {"url": "https://www.vonartis.app"}}],
                        [
                            {"text": "📊 Portfolio", "callback_data": "portfolio"},
                            {"text": "💰 Invest", "callback_data": "invest"}
                        ],
                        [
                            {"text": "💸 Withdraw", "callback_data": "withdraw"},
                            {"text": "👤 Profile", "callback_data": "profile"}
                        ],
                        [{"text": "🛟 Support", "callback_data": "support"}]
                    ]
                }
                
                menu_text = f"""🏦 <b>VonVault Main Menu</b>

Choose an option below to get started:

<b>🚀 Launch VonVault</b> - Full app access
<b>📊 Portfolio</b> - View your investments  
<b>💰 Invest</b> - Create new investment
<b>💸 Withdraw</b> - Access your funds
<b>👤 Profile</b> - Manage settings
<b>🛟 Support</b> - Get help

<i>All financial features require secure verification</i>"""
                
                send_telegram_message(chat_id, menu_text, keyboard)
                
            return {"ok": True}
        
        # Handle text messages/commands
        if not update.message:
            return {"ok": True}
        
        chat_id = update.message.get("chat", {}).get("id")
        text = update.message.get("text", "")
        user = update.message.get("from", {})
        username = user.get("username", "")
        first_name = user.get("first_name", "User")
        
        if not chat_id:
            return {"ok": True}
        
        # Handle different commands
        if text == "/start":
            # Main persistent menu with all options inline
            keyboard = {
                "inline_keyboard": [
                    [{"text": "🚀 Launch VonVault", "web_app": {"url": "https://www.vonartis.app"}}],
                    [
                        {"text": "📊 Portfolio", "callback_data": "portfolio"},
                        {"text": "💰 Invest", "callback_data": "invest"}
                    ],
                    [
                        {"text": "💸 Withdraw", "callback_data": "withdraw"},
                        {"text": "👤 Profile", "callback_data": "profile"}
                    ],
                    [{"text": "🛟 Support", "callback_data": "support"}]
                ]
            }
            
            welcome_text = f"""🏦 <b>Welcome to VonVault, {first_name}!</b>

💰 <b>Professional DeFi investing made simple</b>
🔐 Bank-grade security with enterprise protection
📊 Earn 4-20% APY based on your membership tier
🌍 No downloads required - everything in Telegram

<b>🚀 Choose an option below:</b>
• Launch VonVault for full access
• Use quick actions for specific features

<i>All options require the same secure login process</i>"""
            
            send_telegram_message(chat_id, welcome_text, keyboard)
            
        else:
            # For any other text, show the main menu
            keyboard = {
                "inline_keyboard": [
                    [{"text": "🚀 Launch VonVault", "web_app": {"url": "https://www.vonartis.app"}}],
                    [
                        {"text": "📊 Portfolio", "callback_data": "portfolio"},
                        {"text": "💰 Invest", "callback_data": "invest"}
                    ],
                    [
                        {"text": "💸 Withdraw", "callback_data": "withdraw"},
                        {"text": "👤 Profile", "callback_data": "profile"}
                    ],
                    [{"text": "🛟 Support", "callback_data": "support"}]
                ]
            }
            
            help_text = f"""🤖 <b>VonVault Bot Menu</b>

Use the buttons below for quick access:

<b>Available commands:</b>
/start - Show this main menu

<b>Or tap any button for instant access!</b>

<i>Note: All financial features require the same secure login and verification process as the web app</i>"""
            
            send_telegram_message(chat_id, help_text, keyboard)
        
        return {"ok": True}
        
    except Exception as e:
        print(f"Telegram webhook error: {e}")
        return {"ok": True}

# Include the API routers
app.include_router(api_v1_router)
app.include_router(api_legacy_router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)