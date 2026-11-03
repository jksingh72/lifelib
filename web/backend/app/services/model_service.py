import logging
from typing import Optional
import modelx as mx

from app.config import MODEL_PATH
from app.models.policy import PolicySummary, PolicyListResponse
from app.models.cashflow import CashFlowPoint, ProjectionMetrics, ProjectionResponse

logger = logging.getLogger("lifelib.web")

class ModelService:
    _instance: Optional["ModelService"] = None
    _model = None
    _policies_cache: list[PolicySummary] = []

    @classmethod
    def get_instance(cls) -> "ModelService":
        if cls._instance is None:
            cls._instance = ModelService()
        return cls._instance

    def __init__(self):
        self.load_model()

    def load_model(self):
        """Load or reload modelx model from disk."""
        logger.info(f"Loading lifelib model from {MODEL_PATH}...")
        self._model = mx.read_model(MODEL_PATH)
        self._policies_cache = []
        logger.info(f"Loaded model '{self._model.name}' successfully.")

    @property
    def model(self):
        if self._model is None:
            self.load_model()
        return self._model

    def get_policies(self, limit: int = 100, offset: int = 0) -> PolicyListResponse:
        """Return list of available policies from Input.PolicyData."""
        if not self._policies_cache:
            model = self.model
            pdata = model.Input.PolicyData
            # Keys in PolicyData are tuples of (PolicyID, AttrName)
            policy_ids = sorted(list(set(k[0] for k in pdata.keys())))
            
            cached = []
            for pid in policy_ids:
                try:
                    product = str(pdata.get((pid, "Product"), "TERM"))
                    policy_type = int(pdata.get((pid, "PolicyType"), 1))
                    gen = int(pdata.get((pid, "Gen"), 1))
                    channel = pdata.get((pid, "Channel"), None)
                    sex = str(pdata.get((pid, "Sex"), "M"))
                    issue_age = int(pdata.get((pid, "IssueAge"), 30))
                    policy_term = int(pdata.get((pid, "PolicyTerm"), 10))
                    sum_assured = float(pdata.get((pid, "SumAssured"), 100000.0))
                    prem_freq = int(pdata.get((pid, "PremFreq"), 1))

                    # Quick annual premium calculation via projection space
                    proj = model.Projection[pid]
                    gross_rate = float(proj.pol.GrossPremRate())
                    annual_prem = round(sum_assured * gross_rate, 2)
                    
                    cached.append(PolicySummary(
                        id=int(pid),
                        product=product,
                        policy_type=policy_type,
                        gen=gen,
                        channel=str(channel) if channel else None,
                        sex=sex,
                        issue_age=issue_age,
                        policy_term=policy_term,
                        sum_assured=sum_assured,
                        annual_prem=annual_prem,
                        prem_freq=prem_freq,
                    ))
                except Exception as ex:
                    logger.warning(f"Error reading policy {pid}: {ex}")
                    continue
            self._policies_cache = cached

        total = len(self._policies_cache)
        paginated = self._policies_cache[offset: offset + limit]
        return PolicyListResponse(total=total, policies=paginated)

    def get_projection(self, policy_id: int, horizon: int = 40) -> ProjectionResponse:
        """Calculate and return 40-50 year projection for a given policy."""
        model = self.model
        proj = model.Projection[policy_id]

        pv_net = float(proj.PV_NetCashflow(0))
        pv_prem = float(proj.PV_PremIncome(0))
        pv_ben = float(proj.PV_BenefitTotal(0))
        pv_exp = float(proj.PV_ExpsTotal(0))
        margin = round((pv_net / pv_prem * 100.0), 2) if pv_prem != 0 else 0.0

        metrics = ProjectionMetrics(
            pv_net_cf=round(pv_net, 2),
            pv_premiums=round(pv_prem, 2),
            pv_benefits=round(pv_ben, 2),
            pv_expenses=round(pv_exp, 2),
            profit_margin_pct=margin,
        )

        cashflows = []
        term = int(proj.pol.PolicyTerm())
        max_t = min(horizon, term + 2)

        for t in range(max_t):
            try:
                cf = CashFlowPoint(
                    t=t,
                    year=t + 1,
                    prem_income=round(float(proj.PremIncome[t]), 2),
                    benefit_death=round(float(proj.BenefitDeath[t]), 2),
                    benefit_surr=round(float(proj.BenefitSurr[t]), 2),
                    benefit_total=round(float(proj.BenefitTotal[t]), 2),
                    exps_acq=round(float(proj.ExpsAcq[t]), 2),
                    exps_maint=round(float(proj.ExpsMaint[t]), 2),
                    exps_comm=round(float(proj.ExpsCommTotal[t]), 2),
                    exps_total=round(float(proj.ExpsTotal[t]), 2),
                    net_cf=round(float(proj.NetInsurCF[t]), 2),
                    pols_if=round(float(proj.PolsIF_End[t]), 4),
                )
                cashflows.append(cf)
            except Exception as e:
                logger.error(f"Error computing cashflows for t={t}: {e}")
                break

        return ProjectionResponse(policy_id=policy_id, metrics=metrics, cashflows=cashflows)

    def get_space_tree(self) -> list[dict]:
        """Inspect modelx spaces, formulas, and cells for formula explorer."""
        tree = []
        for name, space in self.model.spaces.items():
            cells = []
            for cname in space.cells.keys():
                cells.append(cname)
            tree.append({
                "space": name,
                "cells_count": len(cells),
                "cells": sorted(cells)[:30],
            })
        return tree
