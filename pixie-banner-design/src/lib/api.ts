const API_BASE = import.meta.env.VITE_API_URL || '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`PIXIE API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type TrackedProduct = {
  id: number;
  name?: string;
  title?: string;
  drop?: string;
  saved?: number;
  active?: boolean;
  target_price?: number;
  price?: number;
};

export function parseUrl(url: string) {
  return request<{ url: string; platform: string; product_id: string }>('/api/parse-url', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

export function trackProduct(url: string, dropGoalPercent: number) {
  return request<{ product: TrackedProduct; target_price: number; drop_goal_percent: number }>(
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

export function getProductHistory(productId: number) {
  return request<{
    product_id: number;
    history: { month: string; price: number; recorded_at: string }[];
    analytics: { deal_score: number; percent_change: number; verdict: string };
  }>(`/api/products/${productId}/history`);
}

export function checkNow() {
  return request<{ results: unknown[] }>('/api/check-now', { method: 'POST' });
}
