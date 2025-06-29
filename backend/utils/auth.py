# Authentication utilities
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import os

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

def generate_jwt(user_id: str, email: Optional[str] = None) -> str:
    """Generate JWT token for user authentication"""
    payload = {
        "user_id": user_id,
        "email": email,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def extract_user_id_from_token(authorization: str) -> str:
    """Extract user ID from Authorization header"""
    try:
        token = authorization.replace("Bearer ", "")
        payload = verify_jwt(token)
        if not payload:
            raise Exception("Invalid token")
        return payload["user_id"]
    except Exception as e:
        raise Exception(f"Unauthorized: {str(e)}")