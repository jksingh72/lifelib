from typing import Optional, Any
from pydantic import BaseModel, Field

class ProductItem(BaseModel):
    id: str                               # e.g., "uslib/universal_life"
    name: str                             # e.g., "Universal Life"
    country: str                          # e.g., "uslib", "uklib", "jplib", etc.
    country_label: str                    # e.g., "United States", "United Kingdom", etc.
    category: str                         # "Universal Life / Savings", "Life & Protection", "Annuities", "Health & CI", "Pensions"
    description: str
    has_account_value: bool = False
    is_open: bool = False

class ModelPointInfo(BaseModel):
    point_id: int
    policy_id: str
    age: int
    sex: str
    sum_assured: float
    label: str = ""
    description: str = ""
    details: dict[str, Any] = Field(default_factory=dict)

class ProductProjectionResponse(BaseModel):
    product_id: str
    product_name: str
    country: str
    point_id: int
    model_point: dict[str, Any]
    has_account_value: bool
    cashflows: list[dict[str, Any]]
    account_values: list[dict[str, Any]]
    kpis: dict[str, Any]

class OpenProductResponse(BaseModel):
    product: ProductItem
    model_points: list[ModelPointInfo]
    projection: ProductProjectionResponse

class CompareRequest(BaseModel):
    product_a_id: str
    point_a_id: int = 1
    product_b_id: str
    point_b_id: int = 1

class CompareResponse(BaseModel):
    product_a: ProductProjectionResponse
    product_b: ProductProjectionResponse

