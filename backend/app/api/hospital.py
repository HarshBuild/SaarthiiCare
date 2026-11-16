from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.referrals import _mock_referrals

router = APIRouter(prefix="/hospital", tags=["Hospital"])

class PatientArrival(BaseModel):
    patient_id: str
    arrival_time: Optional[str] = None
    notes: Optional[str] = None

class OutcomeRecord(BaseModel):
    outcome_category: str
    clinical_notes: str
    recommendations: Optional[str] = None
    follow_up_date: Optional[str] = None

class BackReferralCreate(BaseModel):
    outcome_summary: str
    recommendations: Optional[str] = None
    follow_up_recommended_date: Optional[str] = None
    back_referral_sent: bool = False

def _stored_referral(referral_id: str) -> dict:
    """Fetch a mutable referral record or fail with a clear 404."""
    referral = _mock_referrals.get(referral_id)
    if not referral:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Referral {referral_id} was not found",
        )
    return referral

@router.post("/intake/{referral_id}/acknowledge")
def acknowledge_referral(referral_id: str):
    """Mark referral as acknowledged by receiving hospital"""
    referral = _stored_referral(referral_id)
    referral["acknowledged"] = True
    if referral.get("status") in ("issued", "pending_ack", "draft"):
        referral["status"] = "acknowledged"
    return {"message": f"Referral {referral_id} acknowledged successfully"}

@router.post("/intake/{referral_id}/arrive")
def record_patient_arrival(referral_id: str, payload: PatientArrival):
    """Record that patient has arrived at hospital"""
    referral = _stored_referral(referral_id)
    referral["acknowledged"] = True
    referral["arrived"] = True
    if referral.get("status") != "closed":
        referral["status"] = "arrived"
    return {
        "message": f"Patient arrival recorded for referral {referral_id}",
        "patient_id": payload.patient_id,
        "arrival_time": payload.arrival_time or datetime.now().isoformat()
    }

@router.post("/outcomes/{referral_id}")
def record_outcome(referral_id: str, payload: OutcomeRecord):
    """Record treatment outcome and close referral thread"""
    referral = _stored_referral(referral_id)
    referral["arrived"] = True
    referral["outcome_recorded"] = True
    referral["outcome"] = {
        "outcome_category": payload.outcome_category,
        "clinical_notes": payload.clinical_notes,
        "recommendations": payload.recommendations,
        "follow_up_date": payload.follow_up_date,
        "recorded_at": datetime.now().isoformat(),
    }
    if referral.get("status") != "closed":
        referral["status"] = "outcome_recorded"
    return {
        "message": f"Outcome recorded for referral {referral_id}",
        "outcome_category": payload.outcome_category,
        "recorded_at": referral["outcome"]["recorded_at"]
    }

@router.post("/back-referrals/{referral_id}")
def create_back_referral(referral_id: str, payload: BackReferralCreate):
    """Send structured back-referral to originating PHC"""
    referral = _stored_referral(referral_id)
    referral["back_referral_completed"] = True
    referral["back_referral"] = {
        "outcome_summary": payload.outcome_summary,
        "recommendations": payload.recommendations,
        "follow_up_recommended_date": payload.follow_up_recommended_date,
        "back_referral_sent": payload.back_referral_sent,
        "sent_at": datetime.now().isoformat(),
    }
    if referral.get("status") != "closed":
        referral["status"] = "back_referral_completed"
    return {
        "message": f"Back-referral sent for referral {referral_id}",
        "outcome_summary": payload.outcome_summary,
        "back_referral_sent": payload.back_referral_sent
    }
