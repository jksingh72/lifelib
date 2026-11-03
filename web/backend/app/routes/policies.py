from fastapi import APIRouter, Query
from app.models.policy import PolicyListResponse
from app.services.model_service import ModelService

router = APIRouter(prefix="/api/policies", tags=["Policies"])

@router.get("", response_model=PolicyListResponse)
def get_policies(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0)
):
    """Retrieve the list of portfolio policies from lifelib model."""
    service = ModelService.get_instance()
    return service.get_policies(limit=limit, offset=offset)

