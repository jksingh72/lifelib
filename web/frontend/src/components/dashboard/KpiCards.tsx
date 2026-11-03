import React from "react";
import { DollarSign, ShieldAlert, TrendingUp, Wallet, Percent } from "lucide-react";
import { ProjectionMetrics } from "../../types/actuarial";

interface KpiCardsProps {
  metrics: ProjectionMetrics;
  deltaNetCf?: number;
  deltaPct?: number;
  isShocked?: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  metrics,
  deltaNetCf,
  deltaPct,
  isShocked,
}) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* PV Net Cashflow */}
      <div className={`p-4 rounded-xl border bg-white shadow-sm transition-all ${isShocked ? "ring-2 ring-amber-400/50 bg-amber-50/20" : ""}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            PV Net Cashflow
          </span>
          <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold text-slate-900">
          {formatCurrency(metrics.pv_net_cf)}
        </div>
        {isShocked && deltaNetCf !== undefined && (
          <div className={`mt-1 text-xs font-medium flex items-center ${deltaNetCf >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            <span>{deltaNetCf >= 0 ? "+" : ""}{formatCurrency(deltaNetCf)}</span>
            <span className="ml-1">({deltaPct && deltaPct >= 0 ? "+" : ""}{deltaPct}%)</span>
          </div>
        )}
        <div className="text-[11px] text-slate-400 mt-1">Discounted liability profit</div>
      </div>

      {/* PV Premium Income */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            PV Premiums
          </span>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold text-emerald-700">
          {formatCurrency(metrics.pv_premiums)}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">Gross inflow discounted</div>
      </div>

      {/* PV Benefits Paid */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            PV Benefits
          </span>
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold text-rose-700">
          {formatCurrency(metrics.pv_benefits)}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">Claims + Surrenders</div>
      </div>

      {/* PV Expenses */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            PV Expenses
          </span>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold text-indigo-700">
          {formatCurrency(metrics.pv_expenses)}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">Acquisition + Maintenance</div>
      </div>

      {/* Profit Margin */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Profit Margin
          </span>
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold text-purple-700">
          {metrics.profit_margin_pct}%
        </div>
        <div className="text-[11px] text-slate-400 mt-1">PV Net CF / PV Prem</div>
      </div>
    </div>
  );
};

