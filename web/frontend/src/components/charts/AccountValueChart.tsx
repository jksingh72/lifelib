import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { formatCurrencyTick } from "./CashFlowChart";

interface AccountValueChartProps {
  accountValues: Record<string, any>[];
  productName: string;
}

export const AccountValueChart: React.FC<AccountValueChartProps> = ({
  accountValues,
  productName,
}) => {
  if (!accountValues || accountValues.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
        No account value roll-forward data for this product.
      </div>
    );
  }

  // Detect relevant columns in av_df
  // Common columns: av_beg, av_end, coi, int_credited, load, prem, wd
  const chartData = accountValues.map((row) => {
    const t = row.t !== undefined ? row.t : 0;
    const avEnd =
      row.av_pp_end !== undefined
        ? row.av_pp_end
        : row.av_end !== undefined
        ? row.av_end
        : row.av !== undefined
        ? row.av
        : 0;

    const coi =
      row.coi_pp !== undefined
        ? row.coi_pp
        : row.coi !== undefined
        ? row.coi
        : 0;

    const intCredited =
      row.int_credited_pp !== undefined
        ? row.int_credited_pp
        : row.int_credited !== undefined
        ? row.int_credited
        : 0;

    const monthNum = t + 1;
    const yearNum = Math.floor(t / 12) + 1;

    return {
      month: `M${monthNum}`,
      tooltipTitle: `Month ${monthNum} (Year ${yearNum})`,
      av: Number(avEnd) || 0,
      coi: Number(coi) || 0,
      interest: Number(intCredited) || 0,
    };
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">
            {productName} - Account Value Roll-Forward
          </h3>
          <p className="text-xs text-slate-400">
            Account Value accumulation, Cost of Insurance (COI) charges, and credited interest
          </p>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
          Universal Life / Savings Logic
        </span>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" minTickGap={20} tick={{ fontSize: 11, fill: "#64748b" }} />
            <YAxis
              width={65}
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickFormatter={formatCurrencyTick}
            />
            <Tooltip
              labelFormatter={(_, payload) => {
                if (payload && payload.length > 0 && payload[0]?.payload?.tooltipTitle) {
                  return payload[0].payload.tooltipTitle;
                }
                return "";
              }}
              formatter={(val: number) => formatCurrency(val)}
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
            <Line
              type="monotone"
              dataKey="av"
              name="Account Value ($)"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="interest"
              name="Credited Interest ($)"
              stroke="#10b981"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="coi"
              name="COI Mortality Charge ($)"
              stroke="#f43f5e"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

