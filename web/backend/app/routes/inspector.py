from typing import Optional
from fastapi import APIRouter, Query
from app.services.model_service import ModelService
from app.services.product_service import ProductService

router = APIRouter(prefix="/api/inspector", tags=["Inspector"])

@router.get("/spaces")
def get_spaces(product_id: Optional[str] = Query(None, description="Optional product ID to inspect, e.g. 'uslib/universal_life'")):
    """Retrieve tree of modelx spaces and their formula cells for active product or model."""
    if product_id:
        prod_service = ProductService.get_instance()
        return prod_service.get_space_tree(product_id)

    service = ModelService.get_instance()
    return service.get_space_tree()
