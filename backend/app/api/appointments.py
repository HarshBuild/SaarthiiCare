from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.api.referrals import _mock_referrals

router = APIRouter(prefix="/appointments", tags=["Appointments"])

ACTIVE_REFERRAL_STATUSES = {
    "draft",
    "issued",
    "pending_ack",
    "acknowledged",
    "arrived",
    "outcome_recorded",
    "back_referral_pending",
    "back_referral_completed",
    "follow_up_pending",
    "follow_up_completed",
}


class AppointmentCreate(BaseModel):
    referral_id: str
    scheduled_for: str
    duration_minutes: int = Field(default=30, ge=5, le=480)
    location: str = "Specialist OPD"
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    scheduled_for: Optional[str] = None
    duration_minutes: Optional[int] = Field(default=None, ge=5, le=480)
    location: Optional[str] = None
    notes: Optional[str] = None


class AppointmentComplete(BaseModel):
    notes: Optional[str] = None


class AppointmentCancel(BaseModel):
    reason: Optional[str] = None


class AppointmentRead(BaseModel):
    id: str
    referral_id: str
    referral_number: str
    patient_name: str
    scheduled_for: str
    duration_minutes: int
    location: str
    notes: Optional[str] = None
    status: str
    created_at: str
    updated_at: str
    completed_at: Optional[str] = None
    completion_notes: Optional[str] = None
    cancellation_reason: Optional[str] = None


_appointments: dict = {}


def _parse_slot(value: str) -> datetime:
    """Parse an ISO datetime, treating offset-aware values in server local time."""
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (AttributeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="scheduled_for must be an ISO 8601 date-time",
        )

    if parsed.tzinfo is not None:
        parsed = parsed.astimezone().replace(tzinfo=None)
    return parsed


def _active_for_referral(referral_id: str) -> Optional[dict]:
    for appointment in _appointments.values():
        if appointment["referral_id"] == referral_id and appointment["status"] == "scheduled":
            return appointment
    return None


def _seed_appointments() -> None:
    """Seed a small diary around today so the calendar has real records."""
    now = datetime.now()
    today = now.replace(hour=10, minute=0, second=0, microsecond=0)
    tomorrow = (today + timedelta(days=1)).replace(hour=11, minute=30)
    last_week = (today - timedelta(days=2)).replace(hour=9, minute=0)

    def build(appointment_id, referral_id, slot, **extra):
        referral = _mock_referrals.get(referral_id, {})
        stamp = now.isoformat()
        record = {
            "id": appointment_id,
            "referral_id": referral_id,
            "referral_number": referral.get("referral_number", referral_id),
            "patient_name": referral.get("patient_name", "Patient"),
            "scheduled_for": slot.isoformat(),
            "duration_minutes": 30,
            "location": "Specialist OPD",
            "notes": None,
            "status": "scheduled",
            "created_at": stamp,
            "updated_at": stamp,
            "completed_at": None,
            "completion_notes": None,
            "cancellation_reason": None,
        }
        record.update(extra)
        return record

    _appointments.clear()
    _appointments["apt-001"] = build("apt-001", "ref-1", today)
    _appointments["apt-002"] = build("apt-002", "ref-3", tomorrow)
    _appointments["apt-003"] = build(
        "apt-003",
        "ref-5",
        last_week,
        status="completed",
        completed_at=now.isoformat(),
        completion_notes="Reviewed in cardiology OPD.",
    )


def reset_appointments() -> None:
    """Reset the in-memory diary (used by tests)."""
    _seed_appointments()


_seed_appointments()


@router.get("", response_model=List[AppointmentRead])
def list_appointments(
    status: Optional[str] = None,
    referral_id: Optional[str] = None,
):
    """List the appointment diary, soonest first."""
    appointments = list(_appointments.values())

    if status:
        appointments = [item for item in appointments if item["status"] == status]

    if referral_id:
        appointments = [item for item in appointments if item["referral_id"] == referral_id]

    return sorted(appointments, key=lambda item: item["scheduled_for"])


@router.post("", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED)
def create_appointment(payload: AppointmentCreate):
    """Book an appointment for a referral and accept it into the receiving facility."""
    referral = _mock_referrals.get(payload.referral_id)
    if not referral:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Referral {payload.referral_id} was not found",
        )

    if referral.get("status") not in ACTIVE_REFERRAL_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Closed, rejected or cancelled referrals cannot be scheduled.",
        )

    existing = _active_for_referral(payload.referral_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Referral {payload.referral_id} already has an active appointment "
                f"({existing['id']}). Reschedule or cancel it first."
            ),
        )

    slot = _parse_slot(payload.scheduled_for)
    if slot < datetime.now() - timedelta(minutes=1):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Appointments cannot be booked in the past.",
        )

    stamp = datetime.now().isoformat()
    appointment_id = f"apt-{int(datetime.now().timestamp() * 1000)}"
    record = {
        "id": appointment_id,
        "referral_id": payload.referral_id,
        "referral_number": referral.get("referral_number", payload.referral_id),
        "patient_name": referral.get("patient_name", "Patient"),
        "scheduled_for": slot.isoformat(),
        "duration_minutes": payload.duration_minutes,
        "location": payload.location,
        "notes": payload.notes,
        "status": "scheduled",
        "created_at": stamp,
        "updated_at": stamp,
        "completed_at": None,
        "completion_notes": None,
        "cancellation_reason": None,
    }
    _appointments[appointment_id] = record

    # Booking a slot is the receiving facility accepting the referral. This is
    # a workflow transition, not a clinical finding, so it is safe to record.
    referral["acknowledged"] = True
    if referral.get("status") in ("draft", "issued", "pending_ack"):
        referral["status"] = "acknowledged"

    return record


@router.get("/{appointment_id}", response_model=AppointmentRead)
def get_appointment(appointment_id: str):
    appointment = _appointments.get(appointment_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment {appointment_id} was not found",
        )
    return appointment


@router.patch("/{appointment_id}", response_model=AppointmentRead)
def update_appointment(appointment_id: str, payload: AppointmentUpdate):
    appointment = _appointments.get(appointment_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment {appointment_id} was not found",
        )

    if appointment["status"] != "scheduled":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A {appointment['status']} appointment cannot be rescheduled.",
        )

    if payload.scheduled_for is not None:
        slot = _parse_slot(payload.scheduled_for)
        if slot < datetime.now() - timedelta(minutes=1):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Appointments cannot be moved into the past.",
            )
        appointment["scheduled_for"] = slot.isoformat()

    if payload.duration_minutes is not None:
        appointment["duration_minutes"] = payload.duration_minutes
    if payload.location is not None:
        appointment["location"] = payload.location
    if payload.notes is not None:
        appointment["notes"] = payload.notes

    appointment["updated_at"] = datetime.now().isoformat()
    return appointment


@router.post("/{appointment_id}/complete", response_model=AppointmentRead)
def complete_appointment(appointment_id: str, payload: AppointmentComplete):
    appointment = _appointments.get(appointment_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment {appointment_id} was not found",
        )

    if appointment["status"] != "scheduled":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A {appointment['status']} appointment cannot be completed.",
        )

    stamp = datetime.now().isoformat()
    appointment["status"] = "completed"
    appointment["completed_at"] = stamp
    appointment["updated_at"] = stamp
    if payload.notes:
        appointment["completion_notes"] = payload.notes

    return appointment


@router.post("/{appointment_id}/cancel", response_model=AppointmentRead)
def cancel_appointment(appointment_id: str, payload: AppointmentCancel):
    appointment = _appointments.get(appointment_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment {appointment_id} was not found",
        )

    if appointment["status"] != "scheduled":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A {appointment['status']} appointment cannot be cancelled.",
        )

    stamp = datetime.now().isoformat()
    appointment["status"] = "cancelled"
    appointment["updated_at"] = stamp
    appointment["cancellation_reason"] = payload.reason

    return appointment
