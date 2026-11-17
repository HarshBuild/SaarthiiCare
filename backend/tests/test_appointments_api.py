from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.api import appointments as appointments_module
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_appointments():
    """Each test starts from the seeded diary, not the previous test's edits."""
    appointments_module.reset_appointments()
    yield
    appointments_module.reset_appointments()


def future(hours=24):
    return (datetime.now() + timedelta(hours=hours)).replace(microsecond=0).isoformat()


def test_lists_seeded_appointments_with_referral_context():
    response = client.get("/api/appointments")

    assert response.status_code == 200
    body = response.json()
    assert len(body) >= 3
    first = body[0]
    assert {"id", "referral_id", "referral_number", "patient_name", "scheduled_for", "status"} <= set(first)
    assert first["status"] in {"scheduled", "completed", "cancelled"}


def test_creates_an_appointment_and_accepts_the_referral():
    response = client.post(
        "/api/appointments",
        json={
            "referral_id": "ref-2",
            "scheduled_for": future(),
            "duration_minutes": 45,
            "location": "Cardiology OPD",
            "notes": "Bring previous ECG",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["referral_id"] == "ref-2"
    assert body["referral_number"] == "REF-2026-002"
    assert body["patient_name"] == "Patient 2"
    assert body["duration_minutes"] == 45
    assert body["status"] == "scheduled"

    referral = client.get("/api/referrals/ref-2").json()
    assert referral["status"] == "acknowledged"


def test_rejects_a_second_active_appointment_for_the_same_referral():
    payload = {"referral_id": "ref-4", "scheduled_for": future()}
    assert client.post("/api/appointments", json=payload).status_code == 201

    duplicate = client.post("/api/appointments", json=payload)
    assert duplicate.status_code == 409
    assert "active appointment" in duplicate.json()["detail"].lower()


def test_rejects_unknown_referral_and_past_slot():
    unknown = client.post(
        "/api/appointments",
        json={"referral_id": "ref-does-not-exist", "scheduled_for": future()},
    )
    assert unknown.status_code == 404

    past = client.post(
        "/api/appointments",
        json={
            "referral_id": "ref-6",
            "scheduled_for": (datetime.now() - timedelta(days=2)).isoformat(),
        },
    )
    assert past.status_code == 422


def test_reschedules_an_appointment():
    created = client.post(
        "/api/appointments",
        json={"referral_id": "ref-6", "scheduled_for": future(48)},
    ).json()

    new_slot = future(72)
    response = client.patch(
        f"/api/appointments/{created['id']}",
        json={"scheduled_for": new_slot, "location": "Orthopaedics OPD"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["location"] == "Orthopaedics OPD"
    assert body["scheduled_for"].startswith(new_slot[:16])


def test_completes_and_cancels_appointments_with_guarded_transitions():
    created = client.post(
        "/api/appointments",
        json={"referral_id": "ref-6", "scheduled_for": future()},
    ).json()

    completed = client.post(f"/api/appointments/{created['id']}/complete", json={"notes": "Seen by specialist"})
    assert completed.status_code == 200
    assert completed.json()["status"] == "completed"
    assert completed.json()["completed_at"]

    cannot_cancel = client.post(f"/api/appointments/{created['id']}/cancel", json={"reason": "too late"})
    assert cannot_cancel.status_code == 409

    second = client.post(
        "/api/appointments",
        json={"referral_id": "ref-8", "scheduled_for": future()},
    ).json()
    cancelled = client.post(f"/api/appointments/{second['id']}/cancel", json={"reason": "Patient unwell"})
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"
    assert cancelled.json()["cancellation_reason"] == "Patient unwell"


def test_filters_by_status_and_referral():
    scheduled = client.get("/api/appointments", params={"status": "scheduled"}).json()
    assert scheduled
    assert all(item["status"] == "scheduled" for item in scheduled)

    by_referral = client.get("/api/appointments", params={"referral_id": "ref-3"}).json()
    assert by_referral
    assert all(item["referral_id"] == "ref-3" for item in by_referral)


def test_unknown_appointment_returns_404():
    assert client.patch("/api/appointments/apt-nope", json={"location": "X"}).status_code == 404
    assert client.post("/api/appointments/apt-nope/complete", json={}).status_code == 404
