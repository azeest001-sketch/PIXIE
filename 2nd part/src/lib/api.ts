const API_BASE = '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body && typeof body.detail === 'string' ? body.detail : '';
    throw new Error(detail || `PIXIE API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type TrackedProduct = {
  id: number;
  title?: string;
  name?: string;
  price?: number;
  target_price?: number;
  drop_goal_percent?: number;
  drop?: string;
  saved?: number;
  platform?: string;
  image_url?: string;
  pair_id?: string | null;
};

export function trackProduct(url: string, dropGoalPercent: number) {
  return request<{
    product: TrackedProduct;
    target_price: number;
    comparison?: StoreComparison;
  }>(
    '/api/track',
    {
      method: 'POST',
      body: JSON.stringify({ url, drop_goal_percent: dropGoalPercent }),
    }
  );
}

export function listProducts() {
  return request<{ products: TrackedProduct[] }>('/api/products');
}

export type PricePoint = { month: string; price: number; recorded_at?: string };

export type StoreComparison = {
  found: boolean;
  note?: string;
  history?: PricePoint[];
};

export function getProductHistory(productId: number) {
  return request<{
    platform?: string;
    history: PricePoint[];
    analytics: {
      deal_score: number;
      percent_change: number;
      verdict: string;
      min_price: number;
      max_price: number;
    };
    comparison?: StoreComparison;
  }>(`/api/products/${productId}/history`);
}

export function setDropGoal(productId: number, dropGoalPercent: number) {
  return request<TrackedProduct>(`/api/products/${productId}/goal`, {
    method: 'POST',
    body: JSON.stringify({ drop_goal_percent: dropGoalPercent }),
  });
}

export function connectEmail() {
  return request<{ sent: boolean; message: string }>('/api/alerts/connect', {
    method: 'POST',
  });
}

export function deleteProduct(productId: number) {
  return request<{ id: number; deleted: boolean }>(`/api/products/${productId}`, {
    method: 'DELETE',
  });
}
