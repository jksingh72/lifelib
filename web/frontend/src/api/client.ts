import {
  ModelInfo,
  ProductItem,
  OpenProductResponse,
  ProductProjectionResponse,
  CompareResponse,
  PolicyListResponse,
  ProjectionResponse,
  ShockRequest,
  ShockResponse,
  SpaceTreeItem,
} from "../types/actuarial";

const API_BASE = "/api";

// --- Product Catalog & Multi-Product Environment API ---

export async function fetchProducts(country?: string, category?: string): Promise<ProductItem[]> {
  const params = new URLSearchParams();
  if (country) params.append("country", country);
  if (category) params.append("category", category);
  const res = await fetch(`${API_BASE}/products?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to load product catalog: ${res.statusText}`);
  return res.json();
}

export async function openProduct(productId: string): Promise<OpenProductResponse> {
  const res = await fetch(`${API_BASE}/products/open?product_id=${encodeURIComponent(productId)}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Failed to open product ${productId}: ${res.statusText}`);
  return res.json();
}

export async function closeProduct(productId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/products/close?product_id=${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Failed to close product ${productId}: ${res.statusText}`);
}

export async function fetchProductProjection(
  country: string,
  prodName: string,
  pointId: number
): Promise<ProductProjectionResponse> {
  const res = await fetch(`${API_BASE}/products/${country}/${prodName}/projection/${pointId}`);
  if (!res.ok) throw new Error(`Failed to project ${country}/${prodName} point ${pointId}: ${res.statusText}`);
  return res.json();
}

export async function compareProducts(
  productAId: string,
  pointAId: number,
  productBId: string,
  pointBId: number
): Promise<CompareResponse> {
  const res = await fetch(`${API_BASE}/products/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product_a_id: productAId,
      point_a_id: pointAId,
      product_b_id: productBId,
      point_b_id: pointBId,
    }),
  });
  if (!res.ok) throw new Error(`Failed to compare products: ${res.statusText}`);
  return res.json();
}

// --- Classic Models & Projections API ---

export async function fetchModels(): Promise<ModelInfo[]> {
  const res = await fetch(`${API_BASE}/models`);
  if (!res.ok) throw new Error(`Failed to load models: ${res.statusText}`);
  return res.json();
}

export async function selectModel(modelId: string): Promise<ModelInfo> {
  const res = await fetch(`${API_BASE}/models/select`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model_id: modelId }),
  });
  if (!res.ok) throw new Error(`Failed to switch model to ${modelId}: ${res.statusText}`);
  return res.json();
}

export async function fetchPolicies(limit = 100, offset = 0): Promise<PolicyListResponse> {
  const res = await fetch(`${API_BASE}/policies?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error(`Failed to load policies: ${res.statusText}`);
  return res.json();
}

export async function fetchProjection(policyId: number, horizon = 40): Promise<ProjectionResponse> {
  const res = await fetch(`${API_BASE}/projections/${policyId}?horizon=${horizon}`);
  if (!res.ok) throw new Error(`Failed to load projection for policy ${policyId}: ${res.statusText}`);
  return res.json();
}

export async function applyShock(req: ShockRequest): Promise<ShockResponse> {
  const res = await fetch(`${API_BASE}/scenarios/shock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Failed to run scenario shock: ${res.statusText}`);
  return res.json();
}

export async function fetchSpaceTree(productId?: string): Promise<SpaceTreeItem[]> {
  const url = productId
    ? `${API_BASE}/inspector/spaces?product_id=${encodeURIComponent(productId)}`
    : `${API_BASE}/inspector/spaces`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load spaces: ${res.statusText}`);
  return res.json();
}
