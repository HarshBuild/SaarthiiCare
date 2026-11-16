"""Supabase server-side configuration and connection checks.

This module never returns or logs the service-role key. It is intentionally
kept separate from the domain API so the later auth, storage and database
layers can depend on one validated configuration surface.
"""

from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlparse

import httpx
from supabase import create_client as create_supabase_client

from app.core.config import Settings, settings as default_settings


def _clean(value: Optional[str]) -> str:
    return (value or "").strip()


def _is_http_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)


def _resolve_jwks_url(url: str, configured: str) -> str:
    if configured:
        return configured
    if not url:
        return ""
    return f"{url}/auth/v1/.well-known/jwks.json"


def get_supabase_config_status(
    settings_obj: Optional[Settings] = None,
) -> dict:
    """Return a safe, serialisable view of the server-side configuration.

    The service-role key is only reported as present/absent. It is never
    included in the returned mapping.
    """
    cfg = settings_obj or default_settings

    url = _clean(cfg.SUPABASE_URL).rstrip("/")
    service_role_key = _clean(cfg.SUPABASE_SERVICE_ROLE_KEY)
    publishable_key = _clean(cfg.SUPABASE_PUBLISHABLE_KEY)
    database_url = _clean(cfg.SUPABASE_DB_URL)
    jwks_url = _resolve_jwks_url(url, _clean(cfg.SUPABASE_JWKS_URL))

    missing: list[str] = []
    invalid: list[str] = []

    if not url:
        missing.append("SUPABASE_URL")
    elif not _is_http_url(url):
        invalid.append("SUPABASE_URL")

    if not service_role_key:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")

    if jwks_url and not _is_http_url(jwks_url):
        invalid.append("SUPABASE_JWKS_URL")

    return {
        "configured": not missing and not invalid,
        "environment": cfg.APP_ENV,
        "url": url or None,
        "jwks_url": jwks_url or None,
        "missing": missing,
        "invalid": invalid,
        "has_service_role_key": bool(service_role_key),
        "has_publishable_key": bool(publishable_key),
        "has_database_url": bool(database_url),
        "storage_bucket": cfg.SUPABASE_STORAGE_BUCKET,
    }


async def check_supabase_health(
    settings_obj: Optional[Settings] = None,
    transport: Optional[httpx.AsyncBaseTransport] = None,
    timeout_seconds: Optional[float] = None,
) -> dict:
    """Check reachability without exposing credentials or raw exceptions.

    A successful HTTP response proves the project endpoint is reachable. It
    does not prove that RLS, tables or migrations are correct; those checks
    belong to the schema and workflow phases.
    """
    cfg = settings_obj or default_settings
    config_status = get_supabase_config_status(cfg)
    checked_at = datetime.now(timezone.utc).isoformat()

    if not config_status["configured"]:
        return {
            **config_status,
            "status": "not_configured",
            "reachable": False,
            "http_status": None,
            "message": (
                "Supabase is not configured. Add SUPABASE_URL and "
                "SUPABASE_SERVICE_ROLE_KEY to backend/.env."
            ),
            "checked_at": checked_at,
        }

    request_timeout = (
        timeout_seconds
        if timeout_seconds is not None
        else float(cfg.SUPABASE_REQUEST_TIMEOUT_SECONDS or 5.0)
    )
    headers = {
        "apikey": cfg.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {cfg.SUPABASE_SERVICE_ROLE_KEY}",
        "Accept": "application/json",
    }

    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(request_timeout),
            transport=transport,
        ) as client:
            response = await client.get(
                f"{config_status['url']}/auth/v1/health",
                headers=headers,
            )
    except Exception as exc:  # noqa: BLE001 - sanitise all transport failures
        return {
            **config_status,
            "status": "unreachable",
            "reachable": False,
            "http_status": None,
            "message": (
                "Could not reach Supabase. Check the project URL, network "
                f"access and credentials ({type(exc).__name__})."
            ),
            "checked_at": checked_at,
        }

    healthy = response.status_code == 200
    return {
        **config_status,
        "status": "reachable" if healthy else "unhealthy",
        "reachable": True,
        "http_status": response.status_code,
        "message": (
            "Supabase Auth endpoint responded successfully."
            if healthy
            else "Supabase responded, but the Auth health check was not successful."
        ),
        "checked_at": checked_at,
    }


_admin_client = None


def get_supabase_admin_client(settings_obj: Optional[Settings] = None):
    """
    Return a Supabase admin client using the service-role key.

    The client is cached for the process lifetime. Returns None if the
    service-role key is not configured.

    WARNING: This client bypasses RLS. Use only for admin operations
    (storage, auth admin, migrations) where the caller has already been
    authenticated and authorised by the FastAPI layer.
    """
    global _admin_client
    cfg = settings_obj or default_settings

    if not cfg.SUPABASE_URL or not cfg.SUPABASE_SERVICE_ROLE_KEY:
        return None

    if _admin_client is None:
        _admin_client = create_supabase_client(
            cfg.SUPABASE_URL,
            cfg.SUPABASE_SERVICE_ROLE_KEY,
            options={
                "auth": {
                    "autoRefreshToken": False,
                    "persistSession": False,
                }
            },
        )
    return _admin_client
