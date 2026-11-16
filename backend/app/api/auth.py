from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.core.config import settings as default_settings, Settings
from app.core.security import verify_password, create_access_token, get_password_hash
from app.api.middleware import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    facility_id: str
    facility_name: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ChangePasswordRequest(BaseModel):
    email: EmailStr
    current_password: str
    new_password: str


# Legacy in-memory credential store. Used only when SUPABASE_AUTH_ENABLED
# is false. Supabase Auth is the canonical source of truth.
MOCK_USERS = [
    {
        "id": "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
        "email": "priya.sharma@saarthii.in",
        "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.i.eK",
        "full_name": "Dr. Priya Sharma",
        "role": "phc_staff",
        "facility_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "facility_name": "Primary Health Centre Rampur",
    },
    {
        "id": "e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
        "email": "ravi.kumar@saarthii.in",
        "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.i.eK",
        "full_name": "Ravi Kumar",
        "role": "hospital_staff",
        "facility_id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
        "facility_name": "District Hospital Bareilly",
    },
    {
        "id": "f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66",
        "email": "anjali.reddy@saarthii.in",
        "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.i.eK",
        "full_name": "Dr. Anjali Reddy",
        "role": "supervisor",
        "facility_id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
        "facility_name": "District Hospital Bareilly",
    },
    {
        "id": "a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
        "email": "admin@saarthii.in",
        "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.i.eK",
        "full_name": "System Administrator",
        "role": "admin",
        "facility_id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
        "facility_name": "District Hospital Bareilly",
    },
]


def _user_response(user: dict) -> UserResponse:
    return UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        facility_id=user["facility_id"],
        facility_name=user["facility_name"],
    )


@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    """Authenticate a user.

    When Supabase Auth is enabled this endpoint is deprecated: the browser
    should use supabase.auth.signInWithPassword instead. This endpoint
    remains for the legacy demo flow and for environments where Supabase is
    not reachable.
    """
    user = next((u for u in MOCK_USERS if u["email"] == credentials.email), None)

    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={
            "sub": user["email"],
            "role": user["role"],
            "facility_id": user["facility_id"],
        }
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=_user_response(user),
    )


@router.post("/change-password")
async def change_password(payload: ChangePasswordRequest):
    """Rotate the password for a legacy demo account.

    With Supabase Auth enabled, password rotation should go through the
    Supabase Admin API instead. This endpoint keeps the legacy in-memory
    flow working when SUPABASE_AUTH_ENABLED is false.
    """
    user = next((u for u in MOCK_USERS if u["email"] == payload.email), None)

    if not user or not verify_password(payload.current_password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )

    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long",
        )

    if payload.new_password == payload.current_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password",
        )

    user["password_hash"] = get_password_hash(payload.new_password)
    return {"message": "Password updated successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
) -> UserResponse:
    """Return the authenticated user's profile.

    When Supabase Auth is enabled this reads the profile resolved from the
    verified Supabase JWT. When disabled it falls back to the legacy mock.
    """
    return _user_response(current_user)