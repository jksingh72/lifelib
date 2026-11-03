from fastapi import APIRouter, HTTPException
from app.models.catalog import ModelInfo, SelectModelRequest
from app.services.model_service import ModelService

router = APIRouter(prefix="/api/models", tags=["Models"])

@router.get("", response_model=list[ModelInfo])
def get_available_models():
    """Retrieve catalog of available lifelib models."""
    service = ModelService.get_instance()
    return service.get_available_models()

@router.get("/active", response_model=ModelInfo)
def get_active_model():
    """Retrieve the currently active model."""
    service = ModelService.get_instance()
    active = next((m for m in service.get_available_models() if m.is_active), None)
    if not active:
        raise HTTPException(status_code=404, detail="No active model loaded.")
    return active

@router.post("/select", response_model=ModelInfo)
def select_model(request: SelectModelRequest):
    """Switch active lifelib model in memory."""
    try:
        service = ModelService.get_instance()
        return service.select_model(request.model_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")

