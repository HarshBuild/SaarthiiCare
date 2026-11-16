"""Supabase Auth middleware for FastAPI.

When SUPABASE_AUTH_ENABLED is true, this middleware verifies Supabase
RS256 JWTs and loads the caller's profile and facility assignments from
the database. When false, it falls back to the legacy in-memory mock users.
"""

from __future__ import annotations

from typing import Optional, List

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings as default_settings, Settings
from app.core.supabase_auth import verify_supabase_token, SupabaseAuthError, AuthUnavailableError

security = HTTPBearer()


MOCK_USER_DB = {
    "priya.sharma@saarthii.in": {
        "id": "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
        "email": "priya.sharma@saarthii.in",
        "full_name": "Dr. Priya Sharma",
        "role": "phc_staff",
        "facility_ids": ["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"],
        "facility_name": "Primary Health Centre Rampur",
    },
    "ravi.kumar@saarthii.in": {
        "id": "e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
        "email": "ravi.kumar@saarthii.in",
        "full_name": "Ravi Kumar",
        "role": "hospital_staff",
        "facility_ids": ["b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22"],
        "facility_name": "District Hospital Bareilly",
    },
    "anjali.reddy@saarthii.in": {
        "id": "f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66",
        "email": "anjali.reddy@saarthii.in",
        "full_name": "Dr. Anjali Reddy",
        "role": "supervisor",
        "facility_ids": ["b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22"],
        "facility_name": "District Hospital Bareilly",
    },
    "admin@saarthii.in": {
        "id": "a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
        "email": "admin@saarthii.in",
        "full_name": "System Administrator",
        "role": "admin",
        "facility_ids": ["b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22"],
        "facility_name": "District Hospital Bareilly",
    },
}


def _get_db():
    """Lazy database handle placeholder.

    Phase 6 will inject a real asyncpg/SQLAlchemy connection. For now,
    this yields None so the code structure is ready without wiring a DB.
    """
    yield None


async def get_current_user_supabase(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    settings_obj: Optional[Settings] = None,
    db=Depends(_get_db),
) -> dict:
    """Verify a Supabase JWT and return the user's profile dict.

    The payload's email is used to look up the profile row and facility
    assignments. Roles are never trusted from the token; they come from
    public.profiles.role.

    Raises HTTPException 401 on rejection, 503 if Supabase is unreachable.
    """
    cfg = settings_obj or default_settings

    try:
        payload = verify_supabase_token(credentials.credentials, cfg)
    except AuthUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except SupabaseAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    email: Optional[str] = payload.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing email claim.",
        )

    # Phase 6: replace this mock lookup with a real DB query:
    #   SELECT p.id, p.email, p.full_name, p.role,
    #          array_agg(ufa.facility_id) AS facility_ids,
    #          array_agg(f.name) AS facility_names
    #   FROM public.profiles p
    #   LEFT JOIN public.user_facility_assignments ufa ON ufa.user_id = p.id
    #   LEFT JOIN public.facilities f ON f.id = ufa.facility_id
    #   WHERE p.email = :email AND p.is_active
    #   GROUP BY p.id;
    #
    # For now, return a synthetic profile based on the demo seed.

    demo_map = {
        "priya.sharma@saarthii.in": {
            "id": "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
            "email": "priya.sharma@saarthii.in",
            "full_name": "Dr. Priya Sharma",
            "role": "phc_staff",
            "facility_ids": ["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"],
            "facility_name": "Primary Health Centre Rampur",
        },
        "ravi.kumar@saarthii.in": {
            "id": "e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
            "email": "ravi.kumar@saarthii.in",
            "full_name": "Ravi Kumar",
            "role": "hospital_staff",
            "facility_ids": ["b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22"],
            "facility_name": "District Hospital Bareilly",
        },
        "anjali.reddy@saarthii.in": {
            "id": "f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66",
            "email": "anjali.reddy@saarthii.in",
            "full_name": "Dr. Anjali Reddy",
            "role": "supervisor",
            "facility_ids": ["b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22"],
            "facility_name": "District Hospital Bareilly",
        },
        "admin@saarthii.in": {
            "id": "a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
            "email": "admin@saarthii.in",
            "full_name": "System Administrator",
            "role": "admin",
            "facility_ids": ["b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22"],
            "facility_name": "District Hospital Bareilly",
        },
    }

    profile = demo_map.get(email)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"No profile found for email {email}.",
        )

    return profile


async def get_current_user_legacy(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Legacy mock-user JWT verification for the pre-Supabase demo.

    This accepts the legacy HS256 tokens signed with SECRET_KEY and returns
    the matching mock user row. It is used only when SUPABASE_AUTH_ENABLED
    is false.
    """
    from jose import jwt, JWTError

    try:
        payload = jwt.decode(
            credentials.credentials,
            default_settings.SECRET_KEY,
            algorithms=["HS256"],
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user_id: Optional[str] = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject",
        )

    user = MOCK_USER_DB.get(user_id)
    if not user:
        user = MOCK_USER_DB["priya.sharma@saarthii.in"]

    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    settings_obj: Optional[Settings] = None,
    db=Depends(_get_db),
) -> dict:
    """Dispatch to Supabase or legacy auth based on SUPABASE_AUTH_ENABLED."""
    cfg = settings_obj or default_settings

    if cfg.SUPABASE_AUTH_ENABLED:
        return await get_current_user_supabase(credentials, cfg, db)
    else:
        return await get_current_user_legacy(credentials)


def role_required(*roles: str):
    """Dependency factory that requires the caller to have one of the roles."""

    async def checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required one of: {', '.join(roles)}",
            )
        return current_user

    return checker


def facility_access_required(facility_id_param: str = "facility_id"):
    """Dependency factory that requires facility access.

    Admins and supervisors bypass this check; other users must have an
    assignment to the facility.
    """

    async def check(
        facility_id: Optional[str] = None,
        current_user: dict = Depends(get_current_user),
    ):
        if current_user["role"] in ("admin", "supervisor"):
            return facility_id

        if facility_id not in (current_user.get("facility_ids") or []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Facility access denied",
            )
        return facility_id

    return check