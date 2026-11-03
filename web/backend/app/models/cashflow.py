from pydantic import BaseModel

class CashFlowPoint(BaseModel):
    t: int
    year: int
    prem_income: float
    benefit_death: float
    benefit_surr: float
    benefit_total: float
    exps_acq: float
    exps_maint: float
    exps_comm: float
    exps_total: float
    net_cf: float
    pols_if: float

class ProjectionMetrics(BaseModel):
    pv_net_cf: float
    pv_premiums: float
    pv_benefits: float
    pv_expenses: float
    profit_margin_pct: float

class ProjectionResponse(BaseModel):
    policy_id: int
    metrics: ProjectionMetrics
    cashflows: list[CashFlowPoint]

