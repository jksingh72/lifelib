import React, { useState } from "react";
import { X, GitCompare, ArrowRight } from "lucide-react";
import { ProductItem, CompareResponse } from "../../types/actuarial";
import { compareProducts } from "../../api/client";

interface ProductCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableProducts: ProductItem[];
  defaultProductAId?: string;
  defaultProductBId?: string;
}

const JURISDICTION_ORDER: Record<string, number> = {
  uslib: 1,
  uklib: 2,
  delib: 3,
  frlib: 4,
  jplib: 5,
  krlib: 6,
};

export const ProductCompareModal: React.FC<ProductCompareModalProps> = ({
  isOpen,
  onClose,
  availableProducts,
  defaultProductAId,
  defaultProductBId,
}) => {
  const sortedProducts = React.useMemo(() => {
    return [...availableProducts].sort((a, b) => {
      const orderA = JURISDICTION_ORDER[a.country] || 99;
      const orderB = JURISDICTION_ORDER[b.country] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
  }, [availableProducts]);

  const [productAId, setProductAId] = useState<string>(
    defaultProductAId || availableProducts[0]?.id || "uslib/universal_life"
  );
  const [productBId, setProductBId] = useState<string>(
    defaultProductBId || availableProducts[1]?.id || "uklib/critical_illness"
  );
  const [compareData, setCompareData] = useState<CompareResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleRunComparison = () => {
    setIsLoading(true);
    compareProducts(productAId, 1, productBId, 1)
      .then((res) => setCompareData(res))
      .catch((err) => console.error("Comparison error", err))
      .finally(() => setIsLoading(false));
  };

  if (!isOpen) return null;

  const formatCurrency = (val?: number) =>
    val !== undefined
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(val)
      : "$0";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <GitCompare className="w-5 h-5 text-sky-400" />
            <h2 className="font-bold text-base">Side-by-Side Actuarial Product Comparison</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Selectors */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Product A (Baseline)
            </label>
            <select
              value={productAId}
              onChange={(e) => setProductAId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-sky-500"
            >
              {sortedProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.country_label}: {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Product B (Comparative)
            </label>
            <select
              value={productBId}
              onChange={(e) => setProductBId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-sky-500"
            >
              {sortedProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.country_label}: {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-3 bg-white border-b border-slate-100 text-center">
          <button
            onClick={handleRunComparison}
            disabled={isLoading}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            {isLoading ? "Running Actuarial Comparison..." : "Run Side-by-Side Comparison"}
          </button>
        </div>

        {/* Comparative Results */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {compareData ? (
            <div>
              {/* Metrics Comparison Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Metric</th>
                      <th className="py-2.5 px-4 text-sky-700 font-bold">
                        {compareData.product_a.product_name} ({compareData.product_a.country.toUpperCase()})
                      </th>
                      <th className="py-2.5 px-4 text-indigo-700 font-bold">
                        {compareData.product_b.product_name} ({compareData.product_b.country.toUpperCase()})
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-slate-800">PV Net Cash Flow</td>
                      <td className="py-2.5 px-4 font-bold text-sky-700">
                        {formatCurrency(compareData.product_a.kpis.pv_net_cf)}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-indigo-700">
                        {formatCurrency(compareData.product_b.kpis.pv_net_cf)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-slate-800">PV Gross Premiums</td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {formatCurrency(compareData.product_a.kpis.pv_premiums)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {formatCurrency(compareData.product_b.kpis.pv_premiums)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-slate-800">Total Net Cash Flow (Horizon)</td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {formatCurrency(compareData.product_a.kpis.total_net_cf)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {formatCurrency(compareData.product_b.kpis.total_net_cf)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-slate-800">Total Premiums Collected</td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {formatCurrency(compareData.product_a.kpis.total_premiums)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {formatCurrency(compareData.product_b.kpis.total_premiums)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-slate-800">Total Benefits & Claims</td>
                      <td className="py-2.5 px-4 text-rose-600">
                        {formatCurrency(compareData.product_a.kpis.total_claims)}
                      </td>
                      <td className="py-2.5 px-4 text-rose-600">
                        {formatCurrency(compareData.product_b.kpis.total_claims)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-slate-800">Profit Margin %</td>
                      <td className="py-2.5 px-4 font-bold text-emerald-700">
                        {compareData.product_a.kpis.profit_margin_pct}%
                      </td>
                      <td className="py-2.5 px-4 font-bold text-emerald-700">
                        {compareData.product_b.kpis.profit_margin_pct}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <ArrowRight className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold">Select two products above and click "Run Side-by-Side Comparison"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

