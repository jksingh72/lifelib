from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.models.product_catalog import (
    ProductItem,
    OpenProductResponse,
    ProductProjectionResponse,
    CompareRequest,
    CompareResponse,
)
from app.services.product_service import ProductService

router = APIRouter(prefix="/api/products", tags=["Product Catalog"])

@router.get("", response_model=list[ProductItem])
def get_products(
    country: Optional[str] = Query(None, description="Filter by country: uslib, uklib, jplib, krlib, frlib, delib"),
    category: Optional[str] = Query(None, description="Filter by category"),
):
    """Retrieve catalog of all 57+ actuarial products with active open status."""
    service = ProductService.get_instance()
    return service.get_all_products(country=country, category=category)

@router.post("/open", response_model=OpenProductResponse)
def open_product(product_id: str = Query(..., description="ID of product, e.g. 'uslib/universal_life'")):
    """Initialize product environment and create an active tab."""
    try:
        service = ProductService.get_instance()
        return service.open_product(product_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to open product {product_id}: {str(e)}")

@router.delete("/close", response_model=dict)
def close_product(product_id: str = Query(..., description="ID of product to close")):
    """Close product environment and free memory."""
    service = ProductService.get_instance()
    service.close_product(product_id)
    return {"status": "closed", "product_id": product_id}

@router.get("/{country}/{prod_name}/projection/{point_id}", response_model=ProductProjectionResponse)
def get_product_projection(country: str, prod_name: str, point_id: int):
    """Retrieve cash flows and account value roll-forward for a product model point."""
    product_id = f"{country}/{prod_name}"
    try:
        service = ProductService.get_instance()
        return service.get_projection(product_id, point_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error projecting {product_id} point {point_id}: {str(e)}")

@router.post("/compare", response_model=CompareResponse)
def compare_products(request: CompareRequest):
    """Compare projections of two different products side-by-side."""
    try:
        service = ProductService.get_instance()
        return service.compare_products(
            request.product_a_id, request.point_a_id,
            request.product_b_id, request.point_b_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing products: {str(e)}")

