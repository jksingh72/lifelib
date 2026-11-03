from typing import Optional
from pydantic import BaseModel

class PolicySummary(BaseModel):
    id: int
    product: str
    policy_type: int
    gen: int
    channel: Optional[str] = None
    sex: str
    issue_age: int
    policy_term: int
    sum_assured: float
    annual_prem: float
    prem_freq: int

class PolicyListResponse(BaseModel):
    total: int
    policies: list[PolicySummary]

