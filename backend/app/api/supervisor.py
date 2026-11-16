from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/supervisor", tags=["Supervisor"])

class FacilityStats(BaseModel):
    facility_name: str
    facility_type: str
    referrals_total: int
    closures: int
    closure_rate: float
    avg_time_days: float

class OverdueReferral(BaseModel):
    id: str
    referral_number: str
    patient_name: str
    facility_name: str
    days_overdue: int
    missing_action: str

@router.get("/analytics")
def get_analytics():
    """Get cross-facility performance dashboard data"""
    stats = [
        FacilityStats(
            facility_name="PHC Rampur",
            facility_type="PHC",
            referrals_total=42,
            closures=36,
            closure_rate=86.0,
            avg_time_days=3.5
        ),
        FacilityStats(
            facility_name="District Hospital Bareilly",
            facility_type="district_hospital",
            referrals_total=82,
            closures=71,
            closure_rate=86.6,
            avg_time_days=4.2
        )
    ]
    
    return {
        "facilities": stats,
        "total_referrals": 124,
        "total_closure_rate": 86.3,
        "avg_closure_time_days": 3.85,
        "overdue_count": 5
    }

@router.get("/overdue")
def get_overdue_referrals(limit: int = 10):
    """Get list of overdue referrals for attention"""
    return [
        OverdueReferral(
            id="REF-2026-008",
            referral_number="REF-2026-008",
            patient_name="Meera Patel",
            facility_name="PHC Rampur",
            days_overdue=5,
            missing_action="Follow-up not completed"
        ),
        OverdueReferral(
            id="REF-2026-005",
            referral_number="REF-2026-005",
            patient_name="Rajesh Gupta",
            facility_name="PHC Rampur",
            days_overdue=3,
            missing_action="Back-referral pending"
        )
    ][:limit]

@router.get("/metrics")
def get_metrics(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    facility_ids: Optional[List[str]] = None
):
    """Get detailed referral metrics with filters"""
    return {
        "metrics": {
            "total_referrals": 124,
            "pending_acknowledgement": 8,
            "patient_arrivals": 14,
            "outcomes_recorded": 11,
            "back_referrals_sent": 9,
            "follow_ups_assigned": 12,
            "follow_ups_completed": 8
        },
        "date_range": {
            "from": date_from,
            "to": date_to
        }
    }