"""Storage endpoints for referral documents.

Provides signed URLs and metadata for the private `referral-documents` bucket.
All endpoints require authentication and facility access (enforced by RLS on the
Supabase side; backend performs an additional guard).
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.api.middleware import facility_access_required, get_current_user, role_required
from app.core.config import settings

router = APIRouter(prefix="/storage", tags=["Storage"])


class SignedUrlRequest(BaseModel):
    object_paths: List[str] = Field(..., min_length=1, max_length=50)
    expires_in: int = Field(default=3600, ge=60, le=86400)  # 1 min to 24 hours


class SignedUrlResponse(BaseModel):
    object_path: str
    signed_url: str


class SignedUrlsResponse(BaseModel):
    urls: List[SignedUrlResponse]


class ObjectMetadata(BaseModel):
    name: str
    id: str
    updated_at: str
    metadata: dict


class ListResponse(BaseModel):
    objects: List[ObjectMetadata]


@router.post(
    "/signed-urls",
    response_model=SignedUrlsResponse,
    summary="Create signed download URLs for referral documents",
)
async def create_signed_urls(
    payload: SignedUrlRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Generate signed download URLs for one or more objects in the
    `referral-documents` bucket.

    The caller must have facility access to the objects (enforced by RLS).
    Object paths follow the convention: `<facility_id>/<referral_id>/<filename>`.
    """
    # Use Supabase service client for admin operations
    from app.core.supabase import get_supabase_admin_client

    client = get_supabase_admin_client()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase admin client not configured.",
        )

    try:
        result = client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).create_signed_urls(
            payload.object_paths, payload.expires_in
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not create signed URLs: {exc}",
        ) from exc

    urls = [
        SignedUrlResponse(object_path=item["path"], signed_url=item["signedUrl"])
        for item in result
    ]
    return SignedUrlsResponse(urls=urls)


@router.get(
    "/referrals/{referral_id}/documents",
    response_model=ListResponse,
    summary="List documents for a referral",
)
async def list_referral_documents(
    referral_id: str,
    facility_id: str = Depends(facility_access_required("facility_id")),
    current_user: dict = Depends(get_current_user),
):
    """
    List all documents uploaded for a referral within the caller's facility.
    """
    from app.core.supabase import get_supabase_admin_client

    client = get_supabase_admin_client()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase admin client not configured.",
        )

    prefix = f"{facility_id}/{referral_id}/"

    try:
        result = client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).list(prefix)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not list documents: {exc}",
        ) from exc

    objects = [
        ObjectMetadata(
            name=item["name"],
            id=item["id"],
            updated_at=item["updated_at"],
            metadata=item.get("metadata", {}),
        )
        for item in (result or [])
    ]
    return ListResponse(objects=objects)


@router.delete(
    "/documents/{object_path:path}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a referral document",
)
async def delete_referral_document(
    object_path: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Delete a document from the `referral-documents` bucket.

    The caller must have facility access (enforced by RLS policy).
    """
    from app.core.supabase import get_supabase_admin_client

    client = get_supabase_admin_client()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase admin client not configured.",
        )

    try:
        client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).remove([object_path])
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not delete document: {exc}",
        ) from exc