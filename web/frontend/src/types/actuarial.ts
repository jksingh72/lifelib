export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  path: string;
  is_active: boolean;
}

export interface ProductItem {
  id: string;               // e.g., "uslib/universal_life"
  name: string;             // e.g., "Universal Life (UL)"
  country: string;          // "uslib", "uklib", "jplib", etc.
  country_label: string;    // "United States", "United Kingdom", etc.
  category: string;         // "Universal Life & Savings", "Life & Protection", "Annuities", etc.
  description: string;
  has_account_value: boolean;
  is_open: boolean;
}

export interface ModelPointInfo {
  point_id: number;
  policy_id: string;
  age: number;
  sex: string;
  sum_assured: number;
  label?: string;
  description?: string;
  details: Record<string, any>;
}

export interface ProductProjectionResponse {
  product_id: string;
  product_name: string;
  country: string;
  point_id: number;
  model_point: Record<string, any>;
  has_account_value: boolean;
  cashflows: Record<string, any>[];
  account_values: Record<string, any>[];
  kpis: {
    pv_net_cf?: number;
    pv_premiums?: number;
    total_net_cf?: number;
    total_premiums?: number;
    total_claims?: number;
    total_expenses?: number;
    profit_margin_pct?: number;
  };
}

export interface OpenProductResponse {
  product: ProductItem;
  model_points: ModelPointInfo[];
  projection: ProductProjectionResponse;
}

export interface CompareResponse {
  product_a: ProductProjectionResponse;
  product_b: ProductProjectionResponse;
}

export interface PolicySummary {
  id: number;
  product: string;
  policy_type: number;
  gen: number;
  channel: string | null;
  sex: string;
  issue_age: number;
  policy_term: number;
  sum_assured: number;
  annual_prem: number;
  prem_freq: number;
}

export interface PolicyListResponse {
  total: number;
  policies: PolicySummary[];
}

export interface CashFlowPoint {
  t: number;
  year: number;
  prem_income: number;
  benefit_death: number;
  benefit_surr: number;
  benefit_total: number;
  exps_acq: number;
  exps_maint: number;
  exps_comm: number;
  exps_total: number;
  net_cf: number;
  pols_if: number;
}

export interface ProjectionMetrics {
  pv_net_cf: number;
  pv_premiums: number;
  pv_benefits: number;
  pv_expenses: number;
  profit_margin_pct: number;
}

export interface ProjectionResponse {
  policy_id: number;
  metrics: ProjectionMetrics;
  cashflows: CashFlowPoint[];
}

export interface ShockRequest {
  policy_id: number;
  interest_shock_bps: number;
  mortality_multiplier: number;
  lapse_multiplier: number;
}

export interface ShockResponse {
  base: ProjectionResponse;
  shocked: ProjectionResponse;
  delta_pv_net_cf: number;
  delta_pv_net_cf_pct: number;
}

export interface SpaceTreeItem {
  space: string;
  cells_count: number;
  cells: string[];
}
