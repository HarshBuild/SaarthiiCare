import json

import httpx
import pytest

from app.core.config import Settings
from app.core.supabase import check_supabase_health, get_supabase_config_status


def make_settings(**overrides):
    """Build Settings without inheriting local .env values."""
    values = {
        "SUPABASE_URL": "",
        "SUPABASE_SERVICE_ROLE_KEY": "",
        "SUPABASE_PUBLISHABLE_KEY": "",
        "SUPABASE_DB_URL": "",
        "SUPABASE_JWKS_URL": "",
        "CORS_ORIGINS": ["http://localhost:5173"],
    }
    values.update(overrides)
    return Settings(**values)


def test_config_reports_missing_values():
    status = get_supabase_config_status(make_settings())

    assert status["configured"] is False
    assert "SUPABASE_URL" in status["missing"]
    assert "SUPABASE_SERVICE_ROLE_KEY" in status["missing"]
    assert status["has_service_role_key"] is False


def test_config_reports_valid_values_without_leaking_secrets():
    settings = make_settings(
        SUPABASE_URL="https://example.supabase.co/",
        SUPABASE_SERVICE_ROLE_KEY="server-only-test-key",
    )

    status = get_supabase_config_status(settings)

    assert status["configured"] is True
    assert status["missing"] == []
    assert status["invalid"] == []
    assert status["url"] == "https://example.supabase.co"
    assert status["has_service_role_key"] is True
    assert "server-only-test-key" not in json.dumps(status)


def test_config_flags_invalid_url():
    settings = make_settings(
        SUPABASE_URL="not-a-url",
        SUPABASE_SERVICE_ROLE_KEY="server-only-test-key",
    )

    status = get_supabase_config_status(settings)

    assert status["configured"] is False
    assert "SUPABASE_URL" in status["invalid"]


def test_config_derives_jwks_url_from_project_url():
    settings = make_settings(
        SUPABASE_URL="https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY="server-only-test-key",
    )

    status = get_supabase_config_status(settings)

    assert status["jwks_url"] == (
        "https://example.supabase.co/auth/v1/.well-known/jwks.json"
    )


@pytest.mark.asyncio
async def test_health_check_does_not_call_network_when_not_configured():
    result = await check_supabase_health(make_settings())

    assert result["status"] == "not_configured"
    assert result["reachable"] is False
    assert result["configured"] is False


@pytest.mark.asyncio
async def test_health_check_reports_reachable_project():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/auth/v1/health"
        assert request.headers["apikey"] == "server-only-test-key"
        return httpx.Response(200, json={"name": "GoTrue", "version": "test"})

    settings = make_settings(
        SUPABASE_URL="https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY="server-only-test-key",
    )

    result = await check_supabase_health(
        settings, transport=httpx.MockTransport(handler)
    )

    assert result["status"] == "reachable"
    assert result["reachable"] is True
    assert result["http_status"] == 200
    assert "server-only-test-key" not in json.dumps(result)


@pytest.mark.asyncio
async def test_health_check_reports_unhealthy_response():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, json={"message": "unavailable"})

    settings = make_settings(
        SUPABASE_URL="https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY="server-only-test-key",
    )

    result = await check_supabase_health(
        settings, transport=httpx.MockTransport(handler)
    )

    assert result["status"] == "unhealthy"
    assert result["reachable"] is True
    assert result["http_status"] == 503


@pytest.mark.asyncio
async def test_health_check_reports_unreachable_network_safely():
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("connection refused")

    settings = make_settings(
        SUPABASE_URL="https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY="server-only-test-key",
    )

    result = await check_supabase_health(
        settings, transport=httpx.MockTransport(handler)
    )

    assert result["status"] == "unreachable"
    assert result["reachable"] is False
    assert "server-only-test-key" not in json.dumps(result)
    assert "connection refused" not in result["message"]
