from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from enum import Enum

router = APIRouter(prefix="/referrals", tags=["Referrals"])

# Enums matching database definitions
class ReferralStatus(str, Enum):
    draft = "draft"
    issued = "issued"
    pending_ack = "pending_ack"
    acknowledged = "acknowledged"
    arrived = "arrived"
    outcome_recorded = "outcome_recorded"
    back_referral_pending = "back_referral_pending"
    back_referral_completed = "back_referral_completed"
    follow_up_pending = "follow_up_pending"
    follow_up_completed = "follow_up_completed"
    closed = "closed"
    rejected = "rejected"
    cancelled = "cancelled"

# Pydantic Schemas
class ReferralCreate(BaseModel):
    patient_id: str
    receiving_facility_id: str
    specialty: str
    reason: str
    clinical_summary: str
    back_referral_required: bool = True
    follow_up_required: bool = False
    follow_up_due_date: Optional[str] = None
    patient_name: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None

class ReferralRead(BaseModel):
    id: str
    referral_number: str
    patient_name: str
    receiving_facility_name: str
    specialty: str
    status: ReferralStatus
    created_at: str
    back_referral_required: bool
    follow_up_required: bool
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None

class ReferralEvent(BaseModel):
    id: str
    event_type: str
    timestamp: str
    notes: Optional[str] = None

class ReferralDetails(BaseModel):
    id: str
    referral_number: str
    patient_name: str
    receiving_facility_name: str
    status: ReferralStatus
    specialty: str
    reason: str
    clinical_summary: str
    back_referral_required: bool
    follow_up_required: bool
    follow_up_due_date: Optional[str] = None
    events: List[ReferralEvent] = []
    outcome: Optional[dict] = None
    follow_up_status: str = "not_required"
    created_at: Optional[str] = None
    patient_id: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None

class ClosureCheckResult(BaseModel):
    referral_id: str
    eligible_for_closure: bool
    missing_actions: List[str] = []
    responsible_facility: Optional[str] = None
    responsible_role: Optional[str] = None
    explanation: Optional[str] = None

# Mock data storage
_mock_referrals: dict = {}
_mock_events: dict = {}
_next_id = 100

FACILITY_NAMES = {
    "dh_bareilly": "District Hospital Bareilly",
    "sdh_aonla": "Sub-District Hospital Aonla",
}

def _seed_referrals() -> None:
    """Load a deterministic demo dataset so every workflow action has a record
    to mutate. Without this, list rows were synthetic and could not be updated.
    """
    now = datetime.now().isoformat()
    for i in range(1, 11):
        has_outcome = i % 2 != 0
        _mock_referrals[f"ref-{i}"] = {
            "id": f"ref-{i}",
            "referral_number": f"REF-2026-{i:03d}",
            "patient_id": f"PAT-{i:04d}",
            "patient_name": f"Patient {i}",
            "patient_age": 20 + i * 3,
            "patient_gender": "male" if i % 2 else "female",
            "receiving_facility_id": "dh_bareilly",
            "receiving_facility_name": "District Hospital Bareilly",
            "status": ReferralStatus.outcome_recorded if has_outcome else ReferralStatus.pending_ack,
            "specialty": "Cardiology",
            "reason": "Specialist evaluation required",
            "clinical_summary": "Referral from the demo dataset used to exercise the closed-loop workflow.",
            "back_referral_required": True,
            "follow_up_required": i % 2 == 0,
            "follow_up_due_date": None,
            "outcome_recorded": has_outcome,
            "acknowledged": has_outcome,
            "arrived": has_outcome,
            "back_referral_completed": False,
            "follow_up_completed": False,
            "created_at": now,
        }

_seed_referrals()

def _generate_referral_number() -> str:
    global _next_id
    year = datetime.now().year
    num = _next_id
    _next_id += 1
    return f"REF-{year}-{str(num).zfill(3)}"

def _mock_get_current_user():
    return {
        "id": "test-user",
        "email": "priya.sharma@saarthii.in",
        "role": "phc_staff",
        "facility_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
    }

def _generate_mock_events(referral: dict) -> List[ReferralEvent]:
    events = [
        ReferralEvent(
            id="evt-1",
            event_type="created",
            timestamp=referral.get("created_at", datetime.now().isoformat()),
            notes="Referral created"
        )
    ]
    if referral.get("status") == "issued":
        events.append(ReferralEvent(
            id="evt-2",
            event_type="issued",
            timestamp=datetime.now().isoformat(),
            notes="Referral issued to receiving facility"
        ))
    return events

@router.get("", response_model=List[ReferralRead])
def list_referrals(
    facility_id: Optional[str] = None,
    status: Optional[str] = None
):
    """List referrals for current facility"""
    referrals = [
        ReferralRead(
            id=referral["id"],
            referral_number=referral["referral_number"],
            patient_name=referral.get("patient_name") or "Patient",
            receiving_facility_name=referral.get("receiving_facility_name", "District Hospital Bareilly"),
            specialty=referral["specialty"],
            status=referral["status"],
            created_at=referral["created_at"],
            back_referral_required=referral["back_referral_required"],
            follow_up_required=referral["follow_up_required"],
            patient_age=referral.get("patient_age"),
            patient_gender=referral.get("patient_gender"),
        )
        for referral in _mock_referrals.values()
    ]

    if status:
        referrals = [referral for referral in referrals if referral.status == status]

    return referrals

@router.post("", response_model=ReferralRead)
def create_referral(referral: ReferralCreate):
    """Create a new referral"""
    referral_id = f"ref-{_next_id}"
    referral_number = _generate_referral_number()
    created_at = datetime.now().isoformat()
    
    new_referral = {
        "id": referral_id,
        "referral_number": referral_number,
        "patient_id": referral.patient_id,
        "patient_name": referral.patient_name or "Test Patient",
        "patient_age": referral.patient_age,
        "patient_gender": referral.patient_gender,
        "receiving_facility_id": referral.receiving_facility_id,
        "receiving_facility_name": FACILITY_NAMES.get(
            referral.receiving_facility_id,
            "District Hospital Bareilly",
        ),
        "status": ReferralStatus.issued,
        "specialty": referral.specialty,
        "reason": referral.reason,
        "clinical_summary": referral.clinical_summary,
        "back_referral_required": referral.back_referral_required,
        "follow_up_required": referral.follow_up_required,
        "follow_up_due_date": referral.follow_up_due_date,
        "created_at": created_at,
        "created_by": _mock_get_current_user()["id"],
        "outcome_recorded": False,
        "acknowledged": False,
        "arrived": False,
        "back_referral_completed": False,
        "follow_up_completed": False,
    }
    
    _mock_referrals[referral_id] = new_referral
    return ReferralRead(
        id=referral_id,
        referral_number=referral_number,
        patient_name=new_referral["patient_name"],
        receiving_facility_name=new_referral["receiving_facility_name"],
        specialty=referral.specialty,
        status=ReferralStatus.issued,
        created_at=created_at,
        back_referral_required=referral.back_referral_required,
        follow_up_required=referral.follow_up_required,
        patient_age=referral.patient_age,
        patient_gender=referral.patient_gender,
    )

@router.get("/{referral_id}", response_model=ReferralDetails)
def get_referral(referral_id: str):
    """Get detailed referral info"""
    stored = _mock_referrals.get(referral_id)

    if stored:
        return ReferralDetails(
            id=stored["id"],
            referral_number=stored["referral_number"],
            patient_name=stored.get("patient_name") or "Test Patient",
            receiving_facility_name=stored.get("receiving_facility_name", "District Hospital Bareilly"),
            status=stored["status"],
            specialty=stored["specialty"],
            reason=stored["reason"],
            clinical_summary=stored["clinical_summary"],
            back_referral_required=stored["back_referral_required"],
            follow_up_required=stored["follow_up_required"],
            follow_up_due_date=stored.get("follow_up_due_date"),
            events=_generate_mock_events(stored),
            follow_up_status="pending" if stored["follow_up_required"] else "not_required",
            created_at=stored.get("created_at"),
            patient_id=stored.get("patient_id"),
            patient_age=stored.get("patient_age"),
            patient_gender=stored.get("patient_gender"),
        )

    mock_data = {
        "id": referral_id,
        "referral_number": f"REF-2026-{referral_id.split('-')[-1]}",
        "patient_name": "Test Patient",
        "receiving_facility_name": "District Hospital Bareilly",
        "status": ReferralStatus.outcome_recorded,
        "specialty": "Cardiology",
        "reason": "Routine follow-up",
        "clinical_summary": "Patient presenting with chest pain",
        "back_referral_required": True,
        "follow_up_required": True,
        "follow_up_due_date": "2026-11-28",
        "events": _generate_mock_events({"status": ReferralStatus.outcome_recorded, "created_at": datetime.now().isoformat()}),
        "follow_up_status": "pending",
        "created_at": datetime.now().isoformat(),
        "patient_id": referral_id,
        "patient_age": None,
        "patient_gender": None,
    }
    return ReferralDetails(**mock_data)

@router.get("/{referral_id}/closure-check", response_model=ClosureCheckResult)
def check_closure(referral_id: str):
    """
    Referral Closure Intelligence (RCI) Engine
    Evaluates whether a referral is eligible for closure based on workflow rules.
    """
    ref_id = referral_id
    
    # Simulate RCI evaluation - this would normally check database records
    referral = _mock_referrals.get(ref_id, {
        "id": ref_id,
        "status": ReferralStatus.outcome_recorded,
        "back_referral_required": True,
        "follow_up_required": True,
    })
    
    status = referral.get("status", ReferralStatus.outcome_recorded)
    back_ref_required = referral.get("back_referral_required", False)
    follow_up_required = referral.get("follow_up_required", False)

    # Workflow completion is tracked with explicit flags. Status alone cannot
    # represent "outcome + back-referral + follow-up" simultaneously.
    outcome_done = referral.get("outcome_recorded", status in [
        ReferralStatus.outcome_recorded,
        ReferralStatus.back_referral_completed,
        ReferralStatus.follow_up_completed,
        ReferralStatus.closed,
    ])
    back_ref_done = referral.get(
        "back_referral_completed",
        status == ReferralStatus.back_referral_completed,
    )
    follow_up_done = referral.get(
        "follow_up_completed",
        status == ReferralStatus.follow_up_completed,
    )

    missing = []

    # Rule 1: Must have outcome recorded
    if not outcome_done:
        missing.append("OUTCOME_NOT_RECORDED")

    # Rule 2: If back-referral required, must be completed
    if back_ref_required and not back_ref_done:
        missing.append("BACK_REFERRAL_PENDING")

    # Rule 3: If follow-up required, must be completed
    if follow_up_required and not follow_up_done:
        missing.append("FOLLOW_UP_PENDING")
    
    is_eligible = len(missing) == 0
    
    responsible = None
    role = None
    
    if missing:
        if "BACK_REFERRAL_PENDING" in missing:
            responsible = "District Hospital Bareilly"
            role = "Hospital Intake Staff"
        elif "FOLLOW_UP_PENDING" in missing:
            responsible = "Primary Health Centre Rampur"
            role = "PHC Medical Officer"
        elif "OUTCOME_NOT_RECORDED" in missing:
            responsible = "District Hospital Bareilly"
            role = "Hospital Intake Staff"
    
    return ClosureCheckResult(
        referral_id=ref_id,
        eligible_for_closure=is_eligible,
        missing_actions=missing,
        responsible_facility=responsible,
        responsible_role=role,
        explanation=f"Closure blocked. Missing: {', '.join(missing)}." if missing else "All workflow obligations satisfied."
    )

@router.post("/{referral_id}/close")
def close_referral(referral_id: str):
    """Attempt to close a referral after RCI validation"""
    result = check_closure(referral_id)

    if not result.eligible_for_closure:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=result.explanation
        )

    stored = _mock_referrals.get(referral_id)
    if stored:
        stored["status"] = ReferralStatus.closed

    return {"message": "Referral closed successfully"}