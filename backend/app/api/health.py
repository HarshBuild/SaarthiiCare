from fastapi import APIRouter
from app.schemas.health import HealthCheckResponse
from app.core.config import settings
from app.core.supabase import check_supabase_health

router = APIRouter()

@router.get("/health", response_model=HealthCheckResponse, tags=["Health"])
async def get_health_status():
    """
    Returns the current health status of the SAARTHII backend API.
    Used by load balancers, frontend verification, and diagnostic scripts.
    """
    return HealthCheckResponse(
        status="healthy",
        application=settings.PROJECT_NAME,
        version=settings.VERSION
    )


@router.get("/health/supabase", tags=["Health"])
async def get_supabase_health_status():
    """Report safe Supabase configuration and reachability.

    This endpoint never returns the service-role key. It is intended for
    local setup checks and deployment diagnostics, not as a substitute for
    RLS or workflow tests.
    """
    return await check_supabase_health()
