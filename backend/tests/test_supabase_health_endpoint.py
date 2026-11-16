from fastapi.testclient import TestClient

from app.api import health as health_module
from app.main import app


def test_supabase_health_endpoint_returns_safe_status(monkeypatch):
    async def fake_check():
        return {
            "configured": False,
            "status": "not_configured",
            "reachable": False,
            "missing": ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
            "has_service_role_key": False,
        }

    monkeypatch.setattr(health_module, "check_supabase_health", fake_check)

    response = TestClient(app).get("/api/health/supabase")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "not_configured"
    assert body["reachable"] is False
    assert "server-only" not in response.text
