import { useEffect, useState, useCallback } from "react";
import { Navbar } from "./components/layout/Navbar";
import { KpiCards } from "./components/dashboard/KpiCards";
import { PolicySelector } from "./components/dashboard/PolicySelector";
import { CashFlowChart } from "./components/charts/CashFlowChart";
import { ProjectionTable } from "./components/datagrid/ProjectionTable";
import { SensitivityPanel } from "./components/controls/SensitivityPanel";
import { InspectorModal } from "./components/inspector/InspectorModal";
import {
  PolicySummary,
  ProjectionResponse,
  ShockRequest,
  ShockResponse,
} from "./types/actuarial";
import { fetchPolicies, fetchProjection, applyShock } from "./api/client";

export default function App() {
  const [policies, setPolicies] = useState<PolicySummary[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<number>(1);
  const [baseProjection, setBaseProjection] = useState<ProjectionResponse | null>(null);
  const [shockResponse, setShockResponse] = useState<ShockResponse | null>(null);

  const [shocks, setShocks] = useState<ShockRequest>({
    policy_id: 1,
    interest_shock_bps: 0,
    mortality_multiplier: 1.0,
    lapse_multiplier: 1.0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isShocked =
    shocks.interest_shock_bps !== 0 ||
    shocks.mortality_multiplier !== 1.0 ||
    shocks.lapse_multiplier !== 1.0;

  // Initial load: Fetch policy list
  useEffect(() => {
    fetchPolicies(100)
      .then((res) => {
        setPolicies(res.policies);
        if (res.policies.length > 0) {
          setSelectedPolicyId(res.policies[0].id);
          setShocks((prev) => ({ ...prev, policy_id: res.policies[0].id }));
        }
      })
      .catch((err) => {
        console.error("Failed to load policies", err);
        setError("Could not connect to FastAPI lifelib backend. Ensure the backend server is running.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Fetch projection when active policy changes
  const loadProjection = useCallback((policyId: number) => {
    setIsLoading(true);
    setError(null);
    fetchProjection(policyId)
      .then((proj) => {
        setBaseProjection(proj);
        setShockResponse(null);
        setShocks({
          policy_id: policyId,
          interest_shock_bps: 0,
          mortality_multiplier: 1.0,
          lapse_multiplier: 1.0,
        });
      })
      .catch((err) => {
        console.error("Projection fetch error", err);
        setError(err.message || "Failed to calculate projection");
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (selectedPolicyId) {
      loadProjection(selectedPolicyId);
    }
  }, [selectedPolicyId, loadProjection]);

  // Handle sensitivity shocks
  const handleShockChange = (updatedShocks: ShockRequest) => {
    setShocks(updatedShocks);

    const hasActiveShocks =
      updatedShocks.interest_shock_bps !== 0 ||
      updatedShocks.mortality_multiplier !== 1.0 ||
      updatedShocks.lapse_multiplier !== 1.0;

    if (!hasActiveShocks) {
      setShockResponse(null);
      return;
    }

    applyShock(updatedShocks)
      .then((res) => {
        setShockResponse(res);
      })
      .catch((err) => console.error("Shock calculation error", err));
  };

  const handleResetShocks = () => {
    const resetValues = {
      policy_id: selectedPolicyId,
      interest_shock_bps: 0,
      mortality_multiplier: 1.0,
      lapse_multiplier: 1.0,
    };
    setShocks(resetValues);
    setShockResponse(null);
  };

  // Determine active view data (base vs shocked)
  const currentMetrics = shockResponse
    ? shockResponse.shocked.metrics
    : baseProjection?.metrics;

  const currentCashflows = shockResponse
    ? shockResponse.shocked.cashflows
    : baseProjection?.cashflows || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        onOpenInspector={() => setIsInspectorOpen(true)}
        onRefresh={() => loadProjection(selectedPolicyId)}
        isLoading={isLoading}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => loadProjection(selectedPolicyId)}
              className="text-xs font-semibold underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Policy Selector */}
        <PolicySelector
          policies={policies}
          selectedId={selectedPolicyId}
          onSelect={(id) => setSelectedPolicyId(id)}
          isLoading={isLoading}
        />

        {/* KPI Cards */}
        {currentMetrics && (
          <KpiCards
            metrics={currentMetrics}
            deltaNetCf={shockResponse?.delta_pv_net_cf}
            deltaPct={shockResponse?.delta_pv_net_cf_pct}
            isShocked={isShocked}
          />
        )}

        {/* Real-time Sensitivity Panel */}
        <SensitivityPanel
          shocks={shocks}
          onChange={handleShockChange}
          onReset={handleResetShocks}
          isShocked={isShocked}
        />

        {/* Cash Flow Stacked Chart */}
        <CashFlowChart
          cashflows={currentCashflows}
          title={`Liability Cash Flows ${isShocked ? "(Stressed Scenario)" : "(Baseline)"}`}
        />

        {/* Detailed 50-Year Statement DataGrid */}
        <ProjectionTable cashflows={currentCashflows} policyId={selectedPolicyId} />
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        Lifelib Web Platform &middot; Powered by FastAPI & modelx &middot; Open-source Actuarial Science
      </footer>

      <InspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />
    </div>
  );
}

