import React from "react";
import { PolicySummary } from "../../types/actuarial";
import { User, Shield, Calendar, DollarSign } from "lucide-react";

interface PolicySelectorProps {
  policies: PolicySummary[];
  selectedId: number;
  onSelect: (id: number) => void;
  isLoading: boolean;
}

export const PolicySelector: React.FC<PolicySelectorProps> = ({
  policies,
  selectedId,
  onSelect,
  isLoading,
}) => {
  const selectedPolicy = policies.find((p) => p.id === selectedId);

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label htmlFor="policy-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Active Policy:
        </label>
        <div className="relative">
          <select
            id="policy-select"
            value={selectedId}
            onChange={(e) => onSelect(Number(e.target.value))}
            disabled={isLoading || policies.length === 0}
            className="w-full sm:w-64 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5 font-medium pr-8 disabled:opacity-50"
          >
            {policies.map((p) => (
              <option key={p.id} value={p.id}>
                Policy #{p.id} ({p.product} - Age {p.issue_age}, {p.sex})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedPolicy && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200/60">
          <div className="flex items-center space-x-1">
            <Shield className="w-3.5 h-3.5 text-sky-600" />
            <span className="font-semibold text-slate-800">{selectedPolicy.product}</span>
          </div>
          <div className="flex items-center space-x-1">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span>Age: <strong className="text-slate-800">{selectedPolicy.issue_age} ({selectedPolicy.sex})</strong></span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Term: <strong className="text-slate-800">{selectedPolicy.policy_term} yrs</strong></span>
          </div>
          <div className="flex items-center space-x-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sum Assured: <strong className="text-slate-800">${selectedPolicy.sum_assured.toLocaleString()}</strong></span>
          </div>
          <div className="flex items-center space-x-1">
            <span>Annual Prem: <strong className="text-emerald-700">${selectedPolicy.annual_prem.toLocaleString()}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};

