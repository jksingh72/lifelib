from fastapi import APIRouter, HTTPException
from app.models.scenario import ShockRequest, ShockResponse
from app.services.scenario_service import ScenarioService

router = APIRouter(prefix="/api/scenarios", tags=["Scenarios"])

@router.post("/shock", response_model=ShockResponse)
def apply_shock(request: ShockRequest):
    """Recalculate policy projections and present values under stressed conditions."""
    try:
        return ScenarioService.calculate_shock(request)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Policy ID {request.policy_id} not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing scenario shock: {str(e)}")

