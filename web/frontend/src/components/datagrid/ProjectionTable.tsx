import React, { useState } from "react";
import { Download, Table } from "lucide-react";
import { CashFlowPoint } from "../../types/actuarial";

interface ProjectionTableProps {
  cashflows: CashFlowPoint[];
  policyId: number;
}

export const ProjectionTable: React.FC<ProjectionTableProps> = ({
  cashflows,
  policyId,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const formatNum = (val: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);

  const downloadCSV = () => {
    const headers = [
      "t",
      "Year",
      "Premium Income",
      "Death Benefits",
      "Surrender Benefits",
      "Total Benefits",
      "Acq Expenses",
      "Maint Expenses",
      "Commission",
      "Total Expenses",
      "Net Cash Flow",
      "In-Force Pols",
    ];

    const rows = cashflows.map((cf) => [
      cf.t,
      cf.year,
      cf.prem_income,
      cf.benefit_death,
      cf.benefit_surr,
      cf.benefit_total,
      cf.exps_acq,
      cf.exps_maint,
      cf.exps_comm,
      cf.exps_total,
      cf.net_cf,
      cf.pols_if,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lifelib_projection_policy_${policyId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCashflows = cashflows.filter(
    (cf) => searchTerm === "" || cf.year.toString().includes(searchTerm)
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Table className="w-5 h-5 text-sky-600" />
          <h3 className="font-bold text-slate-800 text-sm">
            Cash Flow Statement ({cashflows.length} Projected Years)
          </h3>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Filter year..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 w-28"
          />
          <button
            onClick={downloadCSV}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-80">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 shadow-sm border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">Yr (t)</th>
              <th className="py-2.5 px-3 text-right">Premium ($)</th>
              <th className="py-2.5 px-3 text-right">Death Claims ($)</th>
              <th className="py-2.5 px-3 text-right">Surrenders ($)</th>
              <th className="py-2.5 px-3 text-right">Total Benefits ($)</th>
              <th className="py-2.5 px-3 text-right">Expenses ($)</th>
              <th className="py-2.5 px-3 text-right">Net Cash Flow ($)</th>
              <th className="py-2.5 px-3 text-right">In-Force Pols</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCashflows.map((cf) => (
              <tr key={cf.t} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2 px-3 font-medium text-slate-900">
                  Yr {cf.year} ({cf.t})
                </td>
                <td className="py-2 px-3 text-right text-emerald-600 font-medium">
                  {formatNum(cf.prem_income)}
                </td>
                <td className="py-2 px-3 text-right text-rose-600">
                  {formatNum(cf.benefit_death)}
                </td>
                <td className="py-2 px-3 text-right text-amber-600">
                  {formatNum(cf.benefit_surr)}
                </td>
                <td className="py-2 px-3 text-right text-rose-700 font-semibold">
                  {formatNum(cf.benefit_total)}
                </td>
                <td className="py-2 px-3 text-right text-indigo-600">
                  {formatNum(cf.exps_total)}
                </td>
                <td
                  className={`py-2 px-3 text-right font-bold ${
                    cf.net_cf >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {formatNum(cf.net_cf)}
                </td>
                <td className="py-2 px-3 text-right text-slate-500 font-mono">
                  {(cf.pols_if * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

