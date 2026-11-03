import logging
from pathlib import Path
from typing import Optional
import modelx as mx

from app.config import BASE_DIR, MODEL_PATH
from app.models.catalog import ModelInfo
from app.models.policy import PolicySummary, PolicyListResponse
from app.models.cashflow import CashFlowPoint, ProjectionMetrics, ProjectionResponse

logger = logging.getLogger("lifelib.web")

AVAILABLE_MODELS = [
    ModelInfo(
        id="simplelife",
        name="SimpleLife",
        description="Individual Term & Whole Life projection portfolio",
        path=str(BASE_DIR / "my_project" / "model"),
        is_active=True,
    ),
    ModelInfo(
        id="TradLife_A",
        name="TradLife_A (Annual Life)",
        description="Traditional Life annual projection with expense loadings",
        path=str(BASE_DIR / "proj-annuallife" / "TradLife_A"),
        is_active=False,
    ),
    ModelInfo(
        id="TradLife_A_EX1",
        name="TradLife_A_EX1 (Solvency II)",
        description="Annual Life with Solvency II SCR shock calculations",
        path=str(BASE_DIR / "proj-annuallife" / "TradLife_A_EX1"),
        is_active=False,
    ),
    ModelInfo(
        id="TradLife_A_mx30",
        name="TradLife_A_mx30",
        description="Annual Life calibrated for modelx 0.30+",
        path=str(BASE_DIR / "proj-annuallife" / "TradLife_A_mx30"),
        is_active=False,
    ),
]


class ModelService:
    _instance: Optional["ModelService"] = None
    _model = None
    _active_model_id: str = "simplelife"
    _policies_cache: dict[str, list[PolicySummary]] = {}

    @classmethod
    def get_instance(cls) -> "ModelService":
        if cls._instance is None:
            cls._instance = ModelService()
        return cls._instance

    def __init__(self):
        self.load_model(self._active_model_id)

    def get_available_models(self) -> list[ModelInfo]:
        """Return catalog of available models indicating which is active."""
        models = []
        for m in AVAILABLE_MODELS:
            models.append(
                ModelInfo(
                    id=m.id,
                    name=m.name,
                    description=m.description,
                    path=m.path,
                    is_active=(m.id == self._active_model_id),
                )
            )
        return models

    def select_model(self, model_id: str) -> ModelInfo:
        """Switch the active model in memory."""
        found = next((m for m in AVAILABLE_MODELS if m.id == model_id), None)
        if not found:
            raise ValueError(f"Unknown model ID: {model_id}")

        self.load_model(model_id)
        return next(m for m in self.get_available_models() if m.id == model_id)

    def load_model(self, model_id: str):
        """Load or reload specified model from disk."""
        target = next((m for m in AVAILABLE_MODELS if m.id == model_id), None)
        path = target.path if target else MODEL_PATH

        logger.info(f"Loading lifelib model [{model_id}] from {path}...")
        self._model = mx.read_model(path)
        self._active_model_id = model_id
        logger.info(f"Loaded model '{self._model.name}' successfully.")

    @property
    def model(self):
        if self._model is None:
            self.load_model(self._active_model_id)
        return self._model

    def _get_policy_data_source(self):
        """Return the dictionary or range containing policy attributes."""
        m = self.model
        if hasattr(m, "Input") and hasattr(m.Input, "PolicyData"):
            return m.Input.PolicyData
        if hasattr(m, "InputData") and hasattr(m.InputData, "policy_data"):
            return m.InputData.policy_data
        return None

    def get_policies(self, limit: int = 100, offset: int = 0) -> PolicyListResponse:
        """Return list of available policies from active model."""
        active_id = self._active_model_id
        if active_id not in self._policies_cache:
            model = self.model
            pdata = self._get_policy_data_source()
            cached = []

            if pdata is not None:
                policy_ids = sorted(list(set(k[0] for k in pdata.keys())))
                for pid in policy_ids:
                    try:
                        product = str(pdata.get((pid, "Product")) or pdata.get((pid, "ProductID")) or "TERM")
                        policy_type = int(pdata.get((pid, "PolicyType")) or pdata.get((pid, "policy_type")) or 1)
                        gen = int(pdata.get((pid, "Gen")) or pdata.get((pid, "gen")) or 1)
                        channel = pdata.get((pid, "Channel")) or pdata.get((pid, "channel"))
                        sex = str(pdata.get((pid, "Sex")) or pdata.get((pid, "sex")) or pdata.get((pid, "SexID")) or "M")
                        issue_age = int(pdata.get((pid, "IssueAge")) or pdata.get((pid, "issue_age")) or 30)
                        policy_term = int(pdata.get((pid, "PolicyTerm")) or pdata.get((pid, "policy_term")) or 10)
                        sum_assured = float(pdata.get((pid, "SumAssured")) or pdata.get((pid, "sum_assured")) or 100000.0)
                        prem_freq = int(pdata.get((pid, "PremFreq")) or pdata.get((pid, "prem_freq")) or 1)

                        # Quick calculation of gross rate / premium
                        proj = model.Projection[pid]
                        gross_cell = getattr(proj.pol, "GrossPremRate", getattr(proj.pol, "gross_prem_rate", None))
                        gross_rate = float(gross_cell()) if gross_cell else 0.003
                        annual_prem = round(sum_assured * gross_rate, 2)

                        cached.append(
                            PolicySummary(
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
                            )
                        )
                    except Exception as ex:
                        logger.warning(f"Error reading policy {pid} in model {active_id}: {ex}")
                        continue
            self._policies_cache[active_id] = cached

        cached_list = self._policies_cache[active_id]
        total = len(cached_list)
        paginated = cached_list[offset : offset + limit]
        return PolicyListResponse(total=total, policies=paginated)

    def _call_cell(self, space, *names, default=0.0):
        for n in names:
            if hasattr(space, n):
                try:
                    cell = getattr(space, n)
                    val = cell(0) if callable(cell) else cell
                    return float(val)
                except Exception:
                    pass
        return default

    def _get_ts(self, space, t, *names, default=0.0):
        for n in names:
            if hasattr(space, n):
                try:
                    cell = getattr(space, n)
                    return float(cell[t])
                except Exception:
                    pass
        return default

    def get_projection(self, policy_id: int, horizon: int = 40) -> ProjectionResponse:
        """Calculate projection with universal support for CamelCase and snake_case models."""
        model = self.model
        proj = model.Projection[policy_id]

        pv_net = self._call_cell(proj, "PV_NetCashflow", "pv_net_cf")
        pv_prem = self._call_cell(proj, "PV_PremIncome", "pv_premiums")
        pv_ben = self._call_cell(proj, "PV_BenefitTotal", "pv_claims")
        pv_exp = self._call_cell(proj, "PV_ExpsTotal", "pv_expenses")
        margin = round((pv_net / pv_prem * 100.0), 2) if pv_prem != 0 else 0.0

        metrics = ProjectionMetrics(
            pv_net_cf=round(pv_net, 2),
            pv_premiums=round(pv_prem, 2),
            pv_benefits=round(pv_ben, 2),
            pv_expenses=round(pv_exp, 2),
            profit_margin_pct=margin,
        )

        cashflows = []
        term_cell = getattr(proj.pol, "PolicyTerm", getattr(proj.pol, "policy_term", None))
        try:
            val = term_cell() if callable(term_cell) else 15
            # In some models, policy_term can return an array if indexed
            term = int(val[0]) if hasattr(val, "__iter__") else int(val)
        except Exception:
            term = 15

        max_t = min(horizon, term + 2)

        for t in range(max_t):
            try:
                prem = self._get_ts(proj, t, "PremIncome", "premiums")
                ben_death = self._get_ts(proj, t, "BenefitDeath", "claims_death")
                ben_surr = self._get_ts(proj, t, "BenefitSurr", "claims_surr")
                ben_total = self._get_ts(proj, t, "BenefitTotal", "claims")
                exps_acq = self._get_ts(proj, t, "ExpsAcq", "exps_acq")
                exps_maint = self._get_ts(proj, t, "ExpsMaint", "exps_maint")
                exps_comm = self._get_ts(proj, t, "ExpsCommTotal", "commissions")
                exps_total = self._get_ts(proj, t, "ExpsTotal", "expenses")
                net_cf = self._get_ts(proj, t, "NetInsurCF", "net_cf")
                pols_if = self._get_ts(proj, t, "PolsIF_End", "pols_if", "pols_if_beg")

                cf = CashFlowPoint(
                    t=t,
                    year=t + 1,
                    prem_income=round(prem, 2),
                    benefit_death=round(ben_death, 2),
                    benefit_surr=round(ben_surr, 2),
                    benefit_total=round(ben_total, 2),
                    exps_acq=round(exps_acq, 2),
                    exps_maint=round(exps_maint, 2),
                    exps_comm=round(exps_comm, 2),
                    exps_total=round(exps_total, 2),
                    net_cf=round(net_cf, 2),
                    pols_if=round(pols_if, 4),
                )
                cashflows.append(cf)
            except Exception as e:
                logger.error(f"Error computing cashflows for t={t}: {e}")
                break

        return ProjectionResponse(policy_id=policy_id, metrics=metrics, cashflows=cashflows)

    def get_space_tree(self) -> list[dict]:
        """Inspect modelx spaces, formulas, and cells for active model."""
        tree = []
        for name, space in self.model.spaces.items():
            cells = []
            for cname in space.cells.keys():
                cells.append(cname)
            tree.append({
                "space": name,
                "cells_count": len(cells),
                "cells": sorted(cells)[:35],
            })
        return tree
