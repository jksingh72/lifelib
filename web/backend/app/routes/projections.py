from fastapi import APIRouter, Path, Query, HTTPException
from app.models.cashflow import ProjectionResponse
from app.services.model_service import ModelService

router = APIRouter(prefix="/api/projections", tags=["Projections"])

@router.get("/{policy_id}", response_model=ProjectionResponse)
def get_projection(
    policy_id: int = Path(..., description="ID of the policy to project"),
    horizon: int = Query(default=40, ge=1, le=100, description="Number of years to project")
):
    """Retrieve 40-50 year cash flow projections and PV metrics for a given policy."""
    try:
        service = ModelService.get_instance()
        return service.get_projection(policy_id=policy_id, horizon=horizon)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Policy ID {policy_id} not found in model.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing projection: {str(e)}")

