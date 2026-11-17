from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel

from app.api.referrals import _mock_referrals

router = APIRouter(prefix="/supervisor", tags=["Supervisor"])

STALE_AFTER_DAYS = 7

CLOSED_STATUSES = {"closed"}
TERMINAL_STATUSES = {"closed", "rejected", "cancelled"}


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


def _parse_datetime(value) -> Optional[datetime]:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def _age_days(referral: dict, now: datetime) -> float:
    created = _parse_datetime(referral.get("created_at"))
    if not created:
        return 0.0
    return max(0.0, (now - created).total_seconds() / 86400)


def _missing_action(referral: dict) -> str:
    """What is blocking this referral from closing, based on its own flags."""
    if not referral.get("outcome_recorded"):
        return "Outcome not recorded"
    if referral.get("back_referral_required") and not referral.get("back_referral_completed"):
        return "Back-referral pending"
    if referral.get("follow_up_required") and not referral.get("follow_up_completed"):
        return "Follow-up not completed"
    return "Ready for closure"


def _is_open(referral: dict) -> bool:
    return referral.get("status") not in TERMINAL_STATUSES


def _is_stale(referral: dict, now: datetime) -> bool:
    return _is_open(referral) and _age_days(referral, now) > STALE_AFTER_DAYS


def _build_snapshot():
    now = datetime.now(timezone.utc)
    referrals = list(_mock_referrals.values())

    open_referrals = [r for r in referrals if _is_open(r)]
    closed_referrals = [r for r in referrals if r.get("status") in CLOSED_STATUSES]
    stale = [r for r in referrals if _is_stale(r, now)]

    total = len(referrals)
    closure_rate = round((len(closed_referrals) / total) * 100, 1) if total else 0.0
    avg_closure_time = (
        round(sum(_age_days(r, now) for r in closed_referrals) / len(closed_referrals), 2)
        if closed_referrals
        else 0.0
    )

    facilities = {}
    for referral in referrals:
        name = referral.get("receiving_facility_name") or "Unassigned facility"
        group = facilities.setdefault(
            name,
            {"name": name, "referrals": 0, "closures": 0, "closed_age_days": []},
        )
        group["referrals"] += 1
        if referral.get("status") in CLOSED_STATUSES:
            group["closures"] += 1
            group["closed_age_days"].append(_age_days(referral, now))

    facility_rows = []
    for group in facilities.values():
        count = group["referrals"]
        closures = group["closures"]
        facility_rows.append(
            FacilityStats(
                facility_name=group["name"],
                facility_type="district_hospital",
                referrals_total=count,
                closures=closures,
                closure_rate=round((closures / count) * 100, 1) if count else 0.0,
                avg_time_days=(
                    round(sum(group["closed_age_days"]) / len(group["closed_age_days"]), 2)
                    if group["closed_age_days"]
                    else 0.0
                ),
            )
        )

    facility_rows.sort(key=lambda row: row.referrals_total, reverse=True)

    return {
        "now": now,
        "referrals": referrals,
        "open": open_referrals,
        "closed": closed_referrals,
        "stale": stale,
        "total": total,
        "closure_rate": closure_rate,
        "avg_closure_time": avg_closure_time,
        "facilities": facility_rows,
    }


@router.get("/analytics")
def get_analytics():
    """Cross-facility performance derived from the live referral records."""
    snapshot = _build_snapshot()

    return {
        "facilities": snapshot["facilities"],
        "total_referrals": snapshot["total"],
        "open_referrals": len(snapshot["open"]),
        "closed_referrals": len(snapshot["closed"]),
        "total_closure_rate": snapshot["closure_rate"],
        "avg_closure_time_days": snapshot["avg_closure_time"],
        "overdue_count": len(snapshot["stale"]),
    }


@router.get("/overdue")
def get_overdue_referrals(limit: int = 10):
    """Open referrals older than the expected window, with the blocking action."""
    snapshot = _build_snapshot()
    now = snapshot["now"]

    overdue = sorted(snapshot["stale"], key=lambda r: _age_days(r, now), reverse=True)

    return [
        OverdueReferral(
            id=referral["id"],
            referral_number=referral.get("referral_number", referral["id"]),
            patient_name=referral.get("patient_name") or "Patient",
            facility_name=referral.get("receiving_facility_name") or "Unassigned facility",
            days_overdue=max(1, int(round(_age_days(referral, now) - STALE_AFTER_DAYS))),
            missing_action=_missing_action(referral),
        )
        for referral in overdue[:limit]
    ]


@router.get("/metrics")
def get_metrics(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    facility_ids: Optional[List[str]] = None,
):
    """Detailed referral metrics derived from the live referral records."""
    snapshot = _build_snapshot()
    referrals = snapshot["referrals"]

    def count(predicate) -> int:
        return sum(1 for referral in referrals if predicate(referral))

    return {
        "metrics": {
            "total_referrals": snapshot["total"],
            "pending_acknowledgement": count(
                lambda r: r.get("status") in {"issued", "pending_ack"}
            ),
            "patient_arrivals": count(lambda r: bool(r.get("arrived"))),
            "outcomes_recorded": count(lambda r: bool(r.get("outcome_recorded"))),
            "back_referrals_sent": count(lambda r: bool(r.get("back_referral_completed"))),
            "follow_ups_assigned": count(lambda r: bool(r.get("follow_up_required"))),
            "follow_ups_completed": count(lambda r: bool(r.get("follow_up_completed"))),
        },
        "date_range": {
            "from": date_from,
            "to": date_to,
        },
    }
