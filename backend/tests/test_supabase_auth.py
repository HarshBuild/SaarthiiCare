"""Tests for Supabase JWT verification and auth middleware.

These tests verify:
1. SupabaseAuthError and AuthUnavailableError exceptions
2. JWKS URL resolution and token verification
3. Legacy fallback when SUPABASE_AUTH_ENABLED=false
4. Role and facility access guards
"""

from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.core.config import Settings
from app.core.supabase_auth import (
    AuthUnavailableError,
    SupabaseAuthError,
    SupabaseJWTVerifier,
    verify_supabase_token,
)
from app.api import middleware
from app.api.middleware import (
    get_current_user,
    get_current_user_legacy,
    get_current_user_supabase,
)


def make_credentials(token: str):
    return MagicMock(spec=["credentials"], credentials=token)


class TestSupabaseAuthError:
    def test_error_is_exception(self):
        err = SupabaseAuthError("test error")
        assert str(err) == "test error"

    def test_auth_unavailable_inherits_error(self):
        err = AuthUnavailableError("unavailable")
        assert isinstance(err, SupabaseAuthError)
        assert str(err) == "unavailable"


class TestSupabaseJWTVerifier:
    def test_init_uses_default_settings(self):
        verifier = SupabaseJWTVerifier()
        assert verifier.settings is not None

    def test_init_accepts_custom_settings(self):
        custom = Settings(SUPABASE_URL="https://test.supabase.co")
        verifier = SupabaseJWTVerifier(custom)
        assert verifier.settings == custom

    def test_jwks_url_derived_from_project_url(self):
        settings = Settings(SUPABASE_URL="https://test.supabase.co")
        verifier = SupabaseJWTVerifier(settings)
        assert (
            verifier.jwks_url
            == "https://test.supabase.co/auth/v1/.well-known/jwks.json"
        )

    def test_jwks_url_uses_configured_override(self):
        settings = Settings(
            SUPABASE_URL="https://test.supabase.co",
            SUPABASE_JWKS_URL="https://custom.example.com/keys.json",
        )
        verifier = SupabaseJWTVerifier(settings)
        assert verifier.jwks_url == "https://custom.example.com/keys.json"

    def test_jwks_url_empty_when_not_configured(self):
        verifier = SupabaseJWTVerifier(Settings())
        assert verifier.jwks_url == ""

    def test_verify_empty_token_raises(self):
        verifier = SupabaseJWTVerifier()
        with pytest.raises(SupabaseAuthError, match="empty"):
            verifier.verify("")

    def test_verify_no_jwks_url_raises_unavailable(self):
        verifier = SupabaseJWTVerifier(Settings())
        with pytest.raises(AuthUnavailableError, match="not configured"):
            verifier.verify("some-token")

    def test_verify_bad_signature_raises_auth_error(self):
        verifier = SupabaseJWTVerifier(Settings())
        # Pretend JWKS lookup succeeded, but the signature is invalid.
        verifier._jwks = {
            "keys": [
                {
                    "kty": "RSA",
                    "kid": "test",
                    "n": "abc",
                    "e": "AQAB",
                }
            ]
        }
        verifier._fetched_at = 9999999999.0
        with pytest.raises(SupabaseAuthError, match="could not be verified"):
            verifier.verify("not.a.valid-token")


class TestVerifySupabaseToken:
    def test_module_wrapper_delegates_to_verifier(self):
        with patch.object(
            SupabaseJWTVerifier,
            "verify",
            return_value={"email": "test@example.com"},
        ) as mock_verify:
            result = verify_supabase_token("fake-token")
            assert result == {"email": "test@example.com"}


class TestGetCurrentUserLegacy:
    async def test_valid_hs256_token_returns_known_user(self):
        from app.core.security import create_access_token

        token = create_access_token(
            data={"sub": "priya.sharma@saarthii.in", "role": "phc_staff"}
        )
        user = await get_current_user_legacy(make_credentials(token))
        assert user["email"] == "priya.sharma@saarthii.in"
        assert user["role"] == "phc_staff"

    async def test_invalid_token_raises_401(self):
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user_legacy(make_credentials("invalid.token.here"))
        assert exc_info.value.status_code == 401


class TestGetCurrentUserSupabase:
    async def test_valid_supabase_token_returns_profile(self):
        with patch(
            "app.api.middleware.verify_supabase_token",
            return_value={"email": "priya.sharma@saarthii.in", "sub": "uuid-1"},
        ) as mock_verify:
            profile = await get_current_user_supabase(
                make_credentials("valid.jwt.token")
            )
        mock_verify.assert_called_once()
        assert profile["role"] == "phc_staff"
        assert profile["facility_name"] == "Primary Health Centre Rampur"

    async def test_unverified_token_raises_401(self):
        with patch(
            "app.api.middleware.verify_supabase_token",
            side_effect=SupabaseAuthError("Supabase token has expired."),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user_supabase(make_credentials("expired.token"))
            assert exc_info.value.status_code == 401

    async def test_jwks_unreachable_raises_503(self):
        with patch(
            "app.api.middleware.verify_supabase_token",
            side_effect=AuthUnavailableError("Could not fetch Supabase JWKS."),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user_supabase(make_credentials("any.token"))
            assert exc_info.value.status_code == 503

    async def test_token_without_email_claim_raises_401(self):
        with patch(
            "app.api.middleware.verify_supabase_token",
            return_value={"sub": "uuid-1"},
        ):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user_supabase(make_credentials("token"))
            assert exc_info.value.status_code == 401

    async def test_unknown_email_raises_401(self):
        with patch(
            "app.api.middleware.verify_supabase_token",
            return_value={"email": "nobody@example.com", "sub": "uuid-1"},
        ):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user_supabase(make_credentials("token"))
            assert exc_info.value.status_code == 401


class TestGetCurrentUserDispatch:
    async def test_supabase_enabled_dispatches_to_supabase(self):
        settings = Settings(SUPABASE_AUTH_ENABLED=True)
        with patch(
            "app.api.middleware.get_current_user_supabase",
            return_value={
                "id": "1",
                "email": "test@example.com",
                "role": "phc_staff",
            },
        ) as mock_supabase:
            result = await get_current_user(
                make_credentials("token"), settings_obj=settings
            )
        mock_supabase.assert_awaited_once()
        assert result["role"] == "phc_staff"

    async def test_supabase_disabled_dispatches_to_legacy(self):
        from app.core.security import create_access_token

        settings = Settings(SUPABASE_AUTH_ENABLED=False)
        token = create_access_token(
            data={"sub": "priya.sharma@saarthii.in", "role": "phc_staff"}
        )
        result = await get_current_user(
            make_credentials(token), settings_obj=settings
        )
        assert result["email"] == "priya.sharma@saarthii.in"


class TestRoleRequired:
    async def test_user_with_allowed_role_passes(self):
        user = {"id": "1", "email": "test@example.com", "role": "phc_staff"}
        checker = middleware.role_required("phc_staff", "hospital_staff")
        with patch.object(
            middleware, "get_current_user", new=MagicMock(return_value=user)
        ):
            result = await checker(current_user=user)
        assert result == user

    async def test_user_with_disallowed_role_gets_403(self):
        user = {"id": "1", "email": "test@example.com", "role": "phc_staff"}
        checker = middleware.role_required("supervisor")
        with pytest.raises(HTTPException) as exc_info:
            await checker(current_user=user)
        assert exc_info.value.status_code == 403
        assert "supervisor" in exc_info.value.detail


class TestFacilityAccessRequired:
    async def test_admin_bypasses_facility_check(self):
        admin = {
            "id": "1",
            "email": "admin@example.com",
            "role": "admin",
            "facility_ids": [],
        }
        checker = middleware.facility_access_required()
        result = await checker(facility_id="any-facility-id", current_user=admin)
        assert result == "any-facility-id"

    async def test_supervisor_bypasses_facility_check(self):
        supervisor = {
            "id": "1",
            "email": "supervisor@example.com",
            "role": "supervisor",
            "facility_ids": [],
        }
        checker = middleware.facility_access_required()
        result = await checker(facility_id="any-facility-id", current_user=supervisor)
        assert result == "any-facility-id"

    async def test_user_with_matching_facility_passes(self):
        user = {
            "id": "1",
            "email": "staff@example.com",
            "role": "phc_staff",
            "facility_ids": ["facility-a", "facility-b"],
        }
        checker = middleware.facility_access_required()
        result = await checker(facility_id="facility-a", current_user=user)
        assert result == "facility-a"

    async def test_user_without_matching_facility_gets_403(self):
        user = {
            "id": "1",
            "email": "staff@example.com",
            "role": "phc_staff",
            "facility_ids": ["facility-a"],
        }
        checker = middleware.facility_access_required()
        with pytest.raises(HTTPException) as exc_info:
            await checker(facility_id="facility-b", current_user=user)
        assert exc_info.value.status_code == 403


class TestSupabaseAuthFlag:
    def test_supabase_auth_enabled_defaults_to_true(self):
        settings = Settings()
        assert settings.SUPABASE_AUTH_ENABLED is True

    def test_supabase_auth_enabled_can_be_disabled(self):
        settings = Settings(SUPABASE_AUTH_ENABLED=False)
        assert settings.SUPABASE_AUTH_ENABLED is False
