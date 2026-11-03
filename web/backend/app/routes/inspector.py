from fastapi import APIRouter
from app.services.model_service import ModelService

router = APIRouter(prefix="/api/inspector", tags=["Inspector"])

@router.get("/spaces")
def get_spaces():
    """Retrieve tree of modelx spaces and their formula cells."""
    service = ModelService.get_instance()
    return service.get_space_tree()

