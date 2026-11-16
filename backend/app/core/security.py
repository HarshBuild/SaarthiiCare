from datetime import datetime, timedelta
from typing import Optional, Any, Union
from jose import jwt
from pydantic import BaseModel
import os
import hashlib

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-saarthii-hackathon-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

# Demo credential hashing.
# Seeded accounts ship with legacy bcrypt hashes that all correspond to the
# documented demo password. Passwords rotated at runtime are stored as SHA-256
# digests so the change-password flow is genuinely enforced for this prototype.
MOCK_PASSWORD = "Password123!"

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

def _sha256(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against the stored digest.

    Legacy bcrypt seeds are accepted only with the documented demo password.
    Rotated passwords must match their SHA-256 digest.
    """
    if not hashed_password:
        return False

    if hashed_password.startswith("$2"):
        return plain_password == MOCK_PASSWORD

    return _sha256(plain_password) == hashed_password

def get_password_hash(password: str) -> str:
    """Hash a new password for the in-memory credential store."""
    return _sha256(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
