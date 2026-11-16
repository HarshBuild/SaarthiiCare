from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.api.referrals import _mock_referrals

router = APIRouter(prefix="/follow-ups", tags=["Follow-Ups"])

class FollowUpCreate(BaseModel):
    referral_id: str
    assigned_to_user_id: str
    task_description: str
    due_date: str

class FollowUpUpdate(BaseModel):
    completion_notes: Optional[str] = None

class FollowUpRead(BaseModel):
    id: str
    referral_id: str
    task_description: str
    assigned_to_user_id: str
    due_date: str
    status: str
    completed_at: Optional[str] = None

# In-memory follow-up store so assigned tasks persist for the session.
_follow_ups: dict = {
    "fu-001": {
        "id": "fu-001",
        "referral_id": "REF-2026-001",
        "task_description": "Verify patient medication compliance",
        "assigned_to_user_id": "user-1",
        "due_date": "2026-11-28",
        "status": "pending",
        "completed_at": None,
    },
    "fu-002": {
        "id": "fu-002",
        "referral_id": "REF-2026-003",
        "task_description": "Schedule post-surgery review",
        "assigned_to_user_id": "user-1",
        "due_date": "2026-11-30",
        "status": "overdue",
        "completed_at": None,
    },
}

def _mark_referral_follow_up_complete(referral_reference: str) -> None:
    """Reflect follow-up completion on the parent referral."""
    for referral in _mock_referrals.values():
        if referral_reference in (referral.get("id"), referral.get("referral_number")):
            referral["follow_up_completed"] = True
            if referral.get("status") != "closed":
                referral["status"] = "follow_up_completed"
            break

@router.get("", response_model=List[FollowUpRead])
def list_follow_ups(
    assigned_to_user_id: Optional[str] = None,
    status: Optional[str] = None
):
    """List follow-up tasks for current user"""
    tasks = list(_follow_ups.values())

    if assigned_to_user_id:
        tasks = [task for task in tasks if task["assigned_to_user_id"] == assigned_to_user_id]

    if status:
        tasks = [task for task in tasks if task["status"] == status]

    return tasks

@router.patch("/{follow_up_id}")
def update_follow_up(follow_up_id: str, payload: FollowUpUpdate):
    """Mark follow-up as completed"""
    task = _follow_ups.get(follow_up_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Follow-up {follow_up_id} was not found",
        )

    task["status"] = "completed"
    task["completed_at"] = datetime.now().isoformat()
    task["completion_notes"] = payload.completion_notes
    _mark_referral_follow_up_complete(task["referral_id"])

    return {
        "message": f"Follow-up {follow_up_id} marked as completed",
        "completed_at": task["completed_at"],
        "completion_notes": payload.completion_notes
    }

@router.post("")
def create_follow_up(payload: FollowUpCreate):
    """Create a new follow-up task"""
    task = {
        "id": f"fu-{int(datetime.now().timestamp() * 1000)}",
        "referral_id": payload.referral_id,
        "task_description": payload.task_description,
        "assigned_to_user_id": payload.assigned_to_user_id,
        "due_date": payload.due_date,
        "status": "pending",
        "completed_at": None,
        "created_at": datetime.now().isoformat(),
    }
    _follow_ups[task["id"]] = task
    return task
