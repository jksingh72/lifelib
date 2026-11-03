from pydantic import BaseModel, Field
from app.models.cashflow import ProjectionResponse

class ShockRequest(BaseModel):
    policy_id: int
    interest_shock_bps: float = Field(default=0.0, description="Interest rate shift in basis points (e.g., +100 for +1.0%)")
    mortality_multiplier: float = Field(default=1.0, ge=0.1, le=3.0, description="Mortality rate factor (e.g., 1.2 for +20%)")
    lapse_multiplier: float = Field(default=1.0, ge=0.1, le=3.0, description="Surrender/lapse rate factor")

class ShockResponse(BaseModel):
    base: ProjectionResponse
    shocked: ProjectionResponse
    delta_pv_net_cf: float
    delta_pv_net_cf_pct: float

