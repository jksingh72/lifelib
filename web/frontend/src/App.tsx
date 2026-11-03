import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Navbar } from "./components/layout/Navbar";
import { ProductTabBar } from "./components/layout/ProductTabBar";
import { ProductCatalogModal } from "./components/catalog/ProductCatalogModal";
import { ProductCompareModal } from "./components/comparison/ProductCompareModal";
import { AccountValueChart } from "./components/charts/AccountValueChart";
import { PolicySelector } from "./components/dashboard/PolicySelector";
import { KpiCards } from "./components/dashboard/KpiCards";
import { CashFlowChart } from "./components/charts/CashFlowChart";
import { ProjectionTable } from "./components/datagrid/ProjectionTable";
import { SensitivityPanel } from "./components/controls/SensitivityPanel";
import { InspectorModal } from "./components/inspector/InspectorModal";
import {
  ProductItem,
  ModelPointInfo,
  ProductProjectionResponse,
  ModelInfo,
  PolicySummary,
  ProjectionResponse,
  ShockRequest,
  ShockResponse,
  CashFlowPoint,
} from "./types/actuarial";
import {
  fetchProducts,
  openProduct,
  closeProduct,
  fetchProductProjection,
  fetchModels,
  selectModel,
  fetchPolicies,
  fetchProjection,
  applyShock,
} from "./api/client";
import { User, Shield, DollarSign, Calendar } from "lucide-react";

interface OpenTab {
  product: ProductItem;
  points: ModelPointInfo[];
  activePointId: number;
  projection: ProductProjectionResponse;
}

export default function App() {
  // Product Catalog & Tabs state
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [isCatalogOpen, setIsCatalogOpen] = useState<boolean>(false);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [openingProductId, setOpeningProductId] = useState<string | null>(null);

  // Classic Model & Sensitivity state
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [activeModelId, setActiveModelId] = useState<string>("simplelife");
  const [isClassicActive, setIsClassicActive] = useState<boolean>(false);

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

  const STORAGE_TABS_KEY = "lifelib_active_tabs";
  const STORAGE_ACTIVE_TAB_KEY = "lifelib_active_tab_index";
  const isInitializedRef = useRef<boolean>(false);

  // 1. Initial Load: Product Catalog & Restore persisted tabs across screen refreshes
  useEffect(() => {
    fetchProducts()
      .then(async (prods) => {
        setAllProducts(prods);

        // Check if user has saved tabs from previous session
        let savedTabs: { productId: string; pointId: number }[] = [];
        let savedIndex = 0;
        let explicitlyClosed = false;

        try {
          const rawTabs = localStorage.getItem(STORAGE_TABS_KEY);
          if (rawTabs !== null) {
            savedTabs = JSON.parse(rawTabs);
            if (Array.isArray(savedTabs) && savedTabs.length === 0) {
              explicitlyClosed = true;
            }
          }
          const rawIdx = localStorage.getItem(STORAGE_ACTIVE_TAB_KEY);
          if (rawIdx !== null) {
            savedIndex = Math.max(0, parseInt(rawIdx, 10) || 0);
          }
        } catch (e) {
          console.warn("Failed to parse saved tabs from localStorage", e);
        }

        // If first visit (no saved tabs), default to uslib/universal_life
        if (!explicitlyClosed && (!Array.isArray(savedTabs) || savedTabs.length === 0)) {
          savedTabs = [{ productId: "uslib/universal_life", pointId: 1 }];
        }

        // Restore all tabs sequentially to preserve order
        const loadedTabs: OpenTab[] = [];
        for (const saved of savedTabs) {
          try {
            const res = await openProduct(saved.productId);
            let proj = res.projection;
            let pointId = res.projection.point_id;

            // If user previously selected a specific point, restore that point's projection
            if (saved.pointId && saved.pointId !== res.projection.point_id) {
              try {
                const [country, prod] = saved.productId.split("/");
                proj = await fetchProductProjection(country, prod, saved.pointId);
                pointId = saved.pointId;
              } catch (ptErr) {
                console.warn(`Could not restore point ${saved.pointId} for ${saved.productId}:`, ptErr);
              }
            }

            loadedTabs.push({
              product: res.product,
              points: res.model_points,
              activePointId: pointId,
              projection: proj,
            });
          } catch (err) {
            console.warn(`Could not restore tab for product ${saved.productId}:`, err);
          }
        }

        if (loadedTabs.length > 0) {
          setOpenTabs(loadedTabs);
          setActiveTabIndex(Math.min(savedIndex, loadedTabs.length - 1));
          setAllProducts((prev) =>
            prev.map((p) => ({
              ...p,
              is_open: loadedTabs.some((t) => t.product.id === p.id),
            }))
          );
        }
        isInitializedRef.current = true;
      })
      .catch((err) => {
        console.error("Catalog fetch error", err);
        isInitializedRef.current = true;
      });

    fetchModels()
      .then((data) => {
        setModels(data);
        const active = data.find((m) => m.is_active);
        if (active) setActiveModelId(active.id);
      })
      .catch((err) => console.error("Models fetch error", err));
  }, []);

  // Sync open tabs to localStorage whenever they change
  useEffect(() => {
    if (!isInitializedRef.current) return;
    try {
      const stateToSave = openTabs.map((t) => ({
        productId: t.product.id,
        pointId: t.activePointId,
      }));
      localStorage.setItem(STORAGE_TABS_KEY, JSON.stringify(stateToSave));
      localStorage.setItem(STORAGE_ACTIVE_TAB_KEY, String(activeTabIndex));
    } catch (e) {
      console.warn("Failed to persist tabs to localStorage", e);
    }
  }, [openTabs, activeTabIndex]);

  // 2. Load policies for classic model
  const loadPoliciesForModel = useCallback(() => {
    setIsLoading(true);
    fetchPolicies(100)
      .then((res) => {
        setPolicies(res.policies);
        if (res.policies.length > 0) {
          const firstId = res.policies[0].id;
          setSelectedPolicyId(firstId);
          setShocks((prev) => ({ ...prev, policy_id: firstId }));
        }
      })
      .catch((err) => console.error("Policies fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  const loadProjection = useCallback((policyId: number) => {
    setIsLoading(true);
    fetchProjection(policyId)
      .then((proj) => {
        setBaseProjection(proj);
        setShockResponse(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadPoliciesForModel();
  }, [loadPoliciesForModel]);

  useEffect(() => {
    if (selectedPolicyId && openTabs.length === 0) {
      loadProjection(selectedPolicyId);
    }
  }, [selectedPolicyId, loadProjection, openTabs.length]);

  // 3. Tab Handlers
  const handleOpenProduct = (productId: string) => {
    setIsClassicActive(false);
    // Check if already open
    const existingIndex = openTabs.findIndex((t) => t.product.id === productId);
    if (existingIndex >= 0) {
      setActiveTabIndex(existingIndex);
      setIsCatalogOpen(false);
      return;
    }

    setOpeningProductId(productId);
    openProduct(productId)
      .then((res) => {
        const newTab: OpenTab = {
          product: res.product,
          points: res.model_points,
          activePointId: res.projection.point_id,
          projection: res.projection,
        };
        setOpenTabs((prev) => [...prev, newTab]);
        setActiveTabIndex(openTabs.length);
        setIsCatalogOpen(false);

        // Update catalog is_open flag
        setAllProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, is_open: true } : p))
        );
      })
      .catch((err) => setError(`Failed to initialize product: ${err.message}`))
      .finally(() => setOpeningProductId(null));
  };

  const handleCloseTab = (index: number) => {
    const tabToClose = openTabs[index];
    if (!tabToClose) return;

    closeProduct(tabToClose.product.id).catch((err) =>
      console.error("Error closing product backend environment", err)
    );

    const remaining = openTabs.filter((_, i) => i !== index);
    setOpenTabs(remaining);
    setActiveTabIndex(Math.max(0, index - 1));

    // Update catalog flag
    setAllProducts((prev) =>
      prev.map((p) =>
        p.id === tabToClose.product.id ? { ...p, is_open: false } : p
      )
    );
  };

  const handleSelectModelPoint = (pointId: number) => {
    const activeTab = openTabs[activeTabIndex];
    if (!activeTab) return;

    setIsLoading(true);
    const [country, prod] = activeTab.product.id.split("/");
    fetchProductProjection(country, prod, pointId)
      .then((proj) => {
        setOpenTabs((prev) =>
          prev.map((t, idx) =>
            idx === activeTabIndex
              ? { ...t, activePointId: pointId, projection: proj }
              : t
          )
        );
      })
      .catch((err) => setError(`Error loading model point: ${err.message}`))
      .finally(() => setIsLoading(false));
  };

  // 4. Classic Model Switcher Handler
  const handleSelectModel = (modelId: string) => {
    setIsClassicActive(true);
    if (modelId === activeModelId) return;
    setIsLoading(true);
    selectModel(modelId)
      .then((updated) => {
        setActiveModelId(updated.id);
        setModels((prev) =>
          prev.map((m) => ({ ...m, is_active: m.id === updated.id }))
        );
        loadPoliciesForModel();
      })
      .catch((err) => setError(`Failed to switch model: ${err.message}`))
      .finally(() => setIsLoading(false));
  };

  // Sensitivity shocks handler
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

    if (isClassicActive || !activeTab) {
      applyShock(updatedShocks)
        .then((res) => setShockResponse(res))
        .catch((err) => console.error("Shock calculation error", err));
    }
  };

  const handleResetShocks = () => {
    setShocks({
      policy_id: selectedPolicyId,
      interest_shock_bps: 0,
      mortality_multiplier: 1.0,
      lapse_multiplier: 1.0,
    });
    setShockResponse(null);
  };

  // Determine active view mode: Tabbed Product View vs Classic Model View
  const isProductTabActive = !isClassicActive && openTabs.length > 0 && !!openTabs[activeTabIndex];
  const activeTab = isProductTabActive ? openTabs[activeTabIndex] : null;

  const isShocked =
    shocks.interest_shock_bps !== 0 ||
    shocks.mortality_multiplier !== 1.0 ||
    shocks.lapse_multiplier !== 1.0;

  // Stressed calculation for active product tab in real time
  const stressedProductData = useMemo(() => {
    if (!activeTab) return null;
    const baseCfs = activeTab.projection.cashflows;
    const baseKpis = activeTab.projection.kpis;

    if (!isShocked) {
      return {
        cashflows: baseCfs.map((row: any) => ({
          t: Number(row.t) || 0,
          year: Number(row.year) || (row.t !== undefined ? row.t + 1 : 1),
          prem_income: Number(row.premiums) || 0,
          benefit_death: Number(row.claims_death) || Number(row.claims) || 0,
          benefit_surr: Number(row.claims_surr) || Number(row.claims_lapse) || 0,
          benefit_total: Number(row.claims_death || 0) + Number(row.claims_surr || row.claims_lapse || 0),
          exps_acq: Number(row.exps_acq) || 0,
          exps_maint: Number(row.exps_maint) || 0,
          exps_comm: Number(row.commissions) || 0,
          exps_total: Number(row.expenses) || 0,
          net_cf: Number(row.net_cf) || 0,
          pols_if: Number(row.pols_if) || 0,
        })),
        metrics: {
          pv_net_cf: baseKpis.pv_net_cf || 0,
          pv_premiums: baseKpis.pv_premiums || 0,
          pv_benefits: baseKpis.total_claims || 0,
          pv_expenses: baseKpis.total_expenses || 0,
          profit_margin_pct: baseKpis.profit_margin_pct || 0,
        },
        deltaNetCf: undefined as number | undefined,
        deltaPct: undefined as number | undefined,
      };
    }

    const mortMult = shocks.mortality_multiplier;
    const lapseMult = shocks.lapse_multiplier;
    const rateShift = shocks.interest_shock_bps / 10000;
    const baseRate = 0.03;
    const stressedRate = Math.max(0.001, baseRate + rateShift);

    let stressedNetCfSum = 0;
    let stressedPremSum = 0;
    let stressedClaimsSum = 0;
    let stressedExpsSum = 0;
    let stressedPvNet = 0;
    let stressedPvPrem = 0;

    const stressedCfs = baseCfs.map((row: any, i: number) => {
      const prem = Number(row.premiums) || 0;
      const death = (Number(row.claims_death) || Number(row.claims) || 0) * mortMult;
      const surr = (Number(row.claims_surr) || Number(row.claims_lapse) || 0) * lapseMult;
      const exps = Number(row.expenses) || 0;
      const net = prem - death - surr - exps;

      stressedPremSum += prem;
      stressedClaimsSum += (death + surr);
      stressedExpsSum += exps;
      stressedNetCfSum += net;

      const df = 1.0 / Math.pow(1.0 + stressedRate / 12, i + 0.5);
      stressedPvNet += net * df;
      stressedPvPrem += prem * df;

      return {
        t: Number(row.t) || 0,
        year: Number(row.year) || (row.t !== undefined ? row.t + 1 : 1),
        prem_income: Math.round(prem * 100) / 100,
        benefit_death: Math.round(death * 100) / 100,
        benefit_surr: Math.round(surr * 100) / 100,
        benefit_total: Math.round((death + surr) * 100) / 100,
        exps_acq: Number(row.exps_acq) || 0,
        exps_maint: Number(row.exps_maint) || 0,
        exps_comm: Number(row.commissions) || 0,
        exps_total: exps,
        net_cf: Math.round(net * 100) / 100,
        pols_if: Number(row.pols_if) || 0,
      };
    });

    const margin = stressedPvPrem !== 0 ? Math.round((stressedPvNet / stressedPvPrem * 100) * 100) / 100 : 0;
    const basePv = baseKpis.pv_net_cf || 0;
    const deltaNet = Math.round((stressedPvNet - basePv) * 100) / 100;
    const deltaPct = basePv !== 0 ? Math.round((deltaNet / Math.abs(basePv) * 100) * 100) / 100 : 0;

    return {
      cashflows: stressedCfs,
      metrics: {
        pv_net_cf: Math.round(stressedPvNet * 100) / 100,
        pv_premiums: Math.round(stressedPvPrem * 100) / 100,
        pv_benefits: Math.round(stressedClaimsSum * 100) / 100,
        pv_expenses: Math.round(stressedExpsSum * 100) / 100,
        profit_margin_pct: margin,
      },
      deltaNetCf: deltaNet,
      deltaPct: deltaPct,
    };
  }, [activeTab, isShocked, shocks]);

  const adaptedCashflows: CashFlowPoint[] = activeTab
    ? (stressedProductData?.cashflows || [])
    : (shockResponse ? shockResponse.shocked.cashflows : baseProjection?.cashflows || []);

  const adaptedMetrics = activeTab
    ? stressedProductData?.metrics
    : (shockResponse ? shockResponse.shocked.metrics : baseProjection?.metrics);

  const deltaNetCf = activeTab ? stressedProductData?.deltaNetCf : shockResponse?.delta_pv_net_cf;
  const deltaPct = activeTab ? stressedProductData?.deltaPct : shockResponse?.delta_pv_net_cf_pct;

  const activeModelPoint = activeTab?.points.find(
    (p) => p.point_id === activeTab.activePointId
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        models={models}
        activeModelId={activeModelId}
        onSelectModel={handleSelectModel}
        allProducts={allProducts}
        activeProductId={activeTab?.product.id}
        onSelectProduct={handleOpenProduct}
        isProductActive={!isClassicActive && !!activeTab}
        onOpenInspector={() => setIsInspectorOpen(true)}
        onOpenCatalog={() => setIsCatalogOpen(true)}
        onRefresh={() => {
          if (!isClassicActive && activeTab) handleSelectModelPoint(activeTab.activePointId);
          else loadProjection(selectedPolicyId);
        }}
        isLoading={isLoading}
        totalProductsCount={allProducts.length}
      />

      {/* Product Tabs Bar */}
      <ProductTabBar
        tabs={openTabs.map((t) => ({ product: t.product, pointId: t.activePointId }))}
        activeTabIndex={activeTabIndex}
        onSelectTab={(idx) => {
          setIsClassicActive(false);
          setActiveTabIndex(idx);
        }}
        onCloseTab={handleCloseTab}
        onOpenCatalog={() => setIsCatalogOpen(true)}
        onOpenCompare={() => setIsCompareOpen(true)}
        isClassicActive={isClassicActive}
        onSelectClassic={() => setIsClassicActive(true)}
        activeModelName={models.find((m) => m.id === activeModelId)?.name || "SimpleLife"}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-xs font-semibold underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Product Model Point Selector Banner OR Foundational Policy Selector */}
        {activeTab ? (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {activeTab.product.name} (Point):
              </span>
              <select
                value={activeTab.activePointId}
                onChange={(e) => handleSelectModelPoint(Number(e.target.value))}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 font-medium max-w-lg"
              >
                {activeTab.points.map((pt) => (
                  <option key={pt.point_id} value={pt.point_id}>
                    {pt.label || `Point #${pt.point_id}: ${pt.policy_id} (${pt.description || `Age ${pt.age}, ${pt.sex}`})`}
                  </option>
                ))}
              </select>
            </div>

            {activeModelPoint && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200/60">
                <div className="flex items-center space-x-1">
                  <Shield className="w-3.5 h-3.5 text-sky-600" />
                  <span className="font-semibold text-slate-800">{activeTab.product.country_label}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Age: <strong>{activeModelPoint.age} ({activeModelPoint.sex})</strong></span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Face: <strong>${activeModelPoint.sum_assured.toLocaleString()}</strong></span>
                </div>
                {activeModelPoint.description && (
                  <span className="bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                    {activeModelPoint.description}
                  </span>
                )}
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Policy ID: <strong>{activeModelPoint.policy_id}</strong></span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-sky-900">
                  {models.find((m) => m.id === activeModelId)?.name || "SimpleLife"} Portfolio
                </h3>
                <p className="text-xs text-sky-700">
                  Inspecting baseline portfolio models with 100 individual policies and Solvency II sensitivity analysis.
                </p>
              </div>
              <button
                onClick={() => setIsCatalogOpen(true)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Explore 57 Global Products
              </button>
            </div>

            {policies.length > 0 && (
              <PolicySelector
                policies={policies}
                selectedId={selectedPolicyId}
                onSelect={(id) => setSelectedPolicyId(id)}
                isLoading={isLoading}
              />
            )}
          </div>
        )}

        {/* KPI Cards */}
        {adaptedMetrics && (
          <KpiCards
            metrics={adaptedMetrics}
            deltaNetCf={deltaNetCf}
            deltaPct={deltaPct}
            isShocked={isShocked}
          />
        )}

        {/* Account Value Roll-Forward Chart (For Universal Life & Savings Products) */}
        {activeTab && activeTab.projection.has_account_value && (
          <AccountValueChart
            accountValues={activeTab.projection.account_values}
            productName={activeTab.product.name}
          />
        )}

        {/* Cash Flow Stacked Chart */}
        <CashFlowChart
          cashflows={adaptedCashflows}
          title={`${activeTab ? activeTab.product.name : (models.find((m) => m.id === activeModelId)?.name || "Portfolio")} Liability Cash Flows`}
        />

        {/* Real-Time Sensitivity & Stress Testing Panel (Available across ALL models & products) */}
        <SensitivityPanel
          shocks={shocks}
          onChange={handleShockChange}
          onReset={handleResetShocks}
          isShocked={isShocked}
        />

        {/* Detailed 50-Year Statement DataGrid */}
        <ProjectionTable
          cashflows={adaptedCashflows}
          policyId={activeTab ? activeTab.activePointId : selectedPolicyId}
        />
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        Lifelib Actuarial Studio &middot; Multi-Product & Multi-Jurisdictional Workspace (USLIB, UKLIB, JPLIB, KRLIB, FRLIB, DELIB)
      </footer>

      {/* Product Catalog Marketplace Modal */}
      <ProductCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        products={allProducts}
        onOpenProduct={handleOpenProduct}
        openingProductId={openingProductId}
      />

      {/* Side-by-Side Comparison Modal */}
      <ProductCompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        availableProducts={allProducts}
        defaultProductAId={openTabs[0]?.product.id}
        defaultProductBId={openTabs[1]?.product.id}
      />

      {/* Spaces & Formula Inspector Modal */}
      <InspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        productId={activeTab?.product.id}
        productName={activeTab?.product.name}
      />
    </div>
  );
}
