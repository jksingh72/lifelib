import math
from app.models.scenario import ShockRequest, ShockResponse
from app.models.cashflow import CashFlowPoint, ProjectionMetrics, ProjectionResponse
from app.services.model_service import ModelService

class ScenarioService:
    @staticmethod
    def calculate_shock(request: ShockRequest) -> ShockResponse:
        service = ModelService.get_instance()
        base_proj = service.get_projection(request.policy_id)

        # Interest rate shock in decimals
        int_shift = request.interest_shock_bps / 10000.0
        m_mult = request.mortality_multiplier
        l_mult = request.lapse_multiplier

        shocked_cashflows: list[CashFlowPoint] = []
        shocked_pv_net = 0.0
        shocked_pv_prem = 0.0
        shocked_pv_ben = 0.0
        shocked_pv_exp = 0.0

        # Base annual discount rate in simplelife is typically 0.02 (2%)
        base_rate = 0.02
        new_rate = max(0.0001, base_rate + int_shift)

        for cf in base_proj.cashflows:
            t = cf.t
            disc_factor = 1.0 / ((1.0 + new_rate) ** (t + 0.5))

            death = round(cf.benefit_death * m_mult, 2)
            surr = round(cf.benefit_surr * l_mult, 2)
            total_ben = round(death + surr, 2)
            total_exp = cf.exps_total
            prem = cf.prem_income
            net_cf = round(prem - total_ben - total_exp, 2)

            shocked_cf = CashFlowPoint(
                t=t,
                year=cf.year,
                prem_income=prem,
                benefit_death=death,
                benefit_surr=surr,
                benefit_total=total_ben,
                exps_acq=cf.exps_acq,
                exps_maint=cf.exps_maint,
                exps_comm=cf.exps_comm,
                exps_total=total_exp,
                net_cf=net_cf,
                pols_if=cf.pols_if,
            )
            shocked_cashflows.append(shocked_cf)

            shocked_pv_net += net_cf * disc_factor
            shocked_pv_prem += prem * disc_factor
            shocked_pv_ben += -total_ben * disc_factor
            shocked_pv_exp += -total_exp * disc_factor

        margin = round((shocked_pv_net / shocked_pv_prem * 100.0), 2) if shocked_pv_prem != 0 else 0.0
        shocked_metrics = ProjectionMetrics(
            pv_net_cf=round(shocked_pv_net, 2),
            pv_premiums=round(shocked_pv_prem, 2),
            pv_benefits=round(shocked_pv_ben, 2),
            pv_expenses=round(shocked_pv_exp, 2),
            profit_margin_pct=margin,
        )

        shocked_proj = ProjectionResponse(
            policy_id=request.policy_id,
            metrics=shocked_metrics,
            cashflows=shocked_cashflows,
        )

        delta_pv = round(shocked_metrics.pv_net_cf - base_proj.metrics.pv_net_cf, 2)
        base_pv = base_proj.metrics.pv_net_cf
        delta_pct = round((delta_pv / abs(base_pv) * 100.0), 2) if base_pv != 0 else 0.0

        return ShockResponse(
            base=base_proj,
            shocked=shocked_proj,
            delta_pv_net_cf=delta_pv,
            delta_pv_net_cf_pct=delta_pct,
        )

