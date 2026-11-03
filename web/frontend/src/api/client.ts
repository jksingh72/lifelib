import {
  PolicyListResponse,
  ProjectionResponse,
  ShockRequest,
  ShockResponse,
  SpaceTreeItem,
} from "../types/actuarial";

const API_BASE = "/api";

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

export async function fetchSpaceTree(): Promise<SpaceTreeItem[]> {
  const res = await fetch(`${API_BASE}/inspector/spaces`);
  if (!res.ok) throw new Error(`Failed to load spaces: ${res.statusText}`);
  return res.json();
}

