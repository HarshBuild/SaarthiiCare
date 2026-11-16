"""Supabase JWT verification and profile loading.

This module verifies RS256 JWTs issued by Supabase Auth using the public
JWKS, then resolves the caller's application profile and facility
assignments. It never trusts client-supplied role or facility claims.
"""

from __future__ import annotations

import time
from typing import Optional

import httpx
from jose import jwt
from jose.exceptions import ExpiredSignatureError, JWTError

from app.core.config import Settings, settings as default_settings

JWKS_CACHE_TTL = 300  # seconds


class SupabaseAuthError(Exception):
    """Raised when a Supabase JWT cannot be verified or is rejected."""


class AuthUnavailableError(SupabaseAuthError):
    """Raised when Supabase is configured but the JWKS endpoint is unreachable."""


def _clean(value: Optional[str]) -> str:
    return (value or "").strip()


def _resolve_jwks_url(url: str, configured: str) -> str:
    if configured:
        return configured
    if not url:
        return ""
    return f"{url.rstrip('/')}/auth/v1/.well-known/jwks.json"


class SupabaseJWTVerifier:
    """Verifies Supabase RS256 JWTs against the project JWKS.

    JWKS responses are cached for a short period so a login burst does not
    hammer the Supabase endpoint. The cache is intentionally simple: a
    timestamp and the parsed keys.
    """

    def __init__(self, settings_obj: Optional[Settings] = None) -> None:
        self.settings = settings_obj or default_settings
        self._jwks: Optional[dict] = None
        self._fetched_at = 0.0

    @property
    def jwks_url(self) -> str:
        return _resolve_jwks_url(self.settings.SUPABASE_URL, self.settings.SUPABASE_JWKS_URL)

    def _fetch_jwks(self) -> dict:
        url = self.jwks_url
        if not url:
            raise AuthUnavailableError(
                "Supabase JWKS URL is not configured. Set SUPABASE_URL."
            )

        try:
            response = httpx.get(
                url,
                timeout=float(self.settings.SUPABASE_REQUEST_TIMEOUT_SECONDS or 5.0),
                headers={"Accept": "application/json"},
            )
        except Exception as exc:  # noqa: BLE001 - transport failures are sanitised
            raise AuthUnavailableError(
                f"Could not fetch Supabase JWKS ({type(exc).__name__})."
            ) from exc

        if response.status_code != 200:
            raise AuthUnavailableError(
                f"Supabase JWKS endpoint returned HTTP {response.status_code}."
            )

        try:
            data = response.json()
        except ValueError as exc:
            raise AuthUnavailableError("Supabase JWKS response was not valid JSON.") from exc

        if "keys" not in data:
            raise AuthUnavailableError("Supabase JWKS response is missing 'keys'.")
        return data

    def get_jwks(self, force: bool = False) -> dict:
        now = time.time()
        if force or self._jwks is None or (now - self._fetched_at) > JWKS_CACHE_TTL:
            self._jwks = self._fetch_jwks()
            self._fetched_at = now
        return self._jwks

    def verify(self, token: str) -> dict:
        """Verify a Supabase JWT and return its payload.

        Raises SupabaseAuthError on any rejection. The audience is checked
        against SUPABASE_JWT_AUD (default 'authenticated') and the issuer
        against the configured Supabase URL.
        """
        token = _clean(token)
        if not token:
            raise SupabaseAuthError("Token is empty.")

        jwks = self.get_jwks()
        try:
            payload = jwt.decode(
                token,
                jwks,
                algorithms=["RS256"],
                audience=self.settings.SUPABASE_JWT_AUD,
                issuer=f"{self.settings.SUPABASE_URL.rstrip('/')}/auth/v1",
                options={"verify_exp": True, "verify_iat": True},
            )
        except ExpiredSignatureError as exc:
            raise SupabaseAuthError("Supabase token has expired.") from exc
        except JWTError as exc:
            raise SupabaseAuthError(f"Supabase token could not be verified: {exc}") from exc

        return payload


def get_verifier(settings_obj: Optional[Settings] = None) -> SupabaseJWTVerifier:
    return SupabaseJWTVerifier(settings_obj)


def verify_supabase_token(
    token: str,
    settings_obj: Optional[Settings] = None,
) -> dict:
    """Module-level convenience wrapper around SupabaseJWTVerifier.verify."""
    return get_verifier(settings_obj).verify(token)