import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { CashFlowPoint } from "../../types/actuarial";

interface CashFlowChartProps {
  cashflows: CashFlowPoint[];
  title?: string;
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({
  cashflows,
  title = "Insurance Liability Cash Flows",
}) => {
  const [viewMode, setViewMode] = useState<"stacked" | "inforce">("stacked");

  const chartData = cashflows.map((cf) => ({
    year: `Yr ${cf.year}`,
    prem: cf.prem_income,
    ben_death: -cf.benefit_death,
    ben_surr: -cf.benefit_surr,
    expenses: -cf.exps_total,
    net_cf: cf.net_cf,
    pols_if: cf.pols_if,
  }));

  const formatTooltipValue = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-2">
        <div>
          <h3 className="font-bold text-slate-800 text-base">{title}</h3>
          <p className="text-xs text-slate-400">
            {viewMode === "stacked"
              ? "Positive: Premium Inflows | Negative: Benefits & Expense Outflows | Line: Net Cashflow"
              : "In-force policy count projection over policy lifetime"}
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setViewMode("stacked")}
            className={`px-3 py-1 rounded-md transition-all ${
              viewMode === "stacked"
                ? "bg-white text-slate-900 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Cash Flows ($)
          </button>
          <button
            onClick={() => setViewMode("inforce")}
            className={`px-3 py-1 rounded-md transition-all ${
              viewMode === "inforce"
                ? "bg-white text-slate-900 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Policies In-Force
          </button>
        </div>
      </div>

      <div className="w-full h-80">
        {viewMode === "stacked" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val: number) => formatTooltipValue(val)}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Bar dataKey="prem" name="Premium Income (+)" fill="#10b981" stackId="cf" />
              <Bar dataKey="ben_death" name="Death Claims (-)" fill="#f43f5e" stackId="cf" />
              <Bar dataKey="ben_surr" name="Surrenders (-)" fill="#fb923c" stackId="cf" />
              <Bar dataKey="expenses" name="Expenses (-)" fill="#6366f1" stackId="cf" />
              <Line
                type="monotone"
                dataKey="net_cf"
                name="Net Cash Flow"
                stroke="#0284c7"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#0284c7" }}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis
                domain={[0, 1.1]}
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              />
              <Tooltip
                formatter={(val: number) => `${(val * 100).toFixed(2)}% in-force`}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              <Bar dataKey="pols_if" name="In-Force Persistency Ratio" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

