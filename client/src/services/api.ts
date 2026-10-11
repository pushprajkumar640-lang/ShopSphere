import type { Category, Order, Pagination, Product, ProductQuery, ShippingInfo, User } from '../lib/types';

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '/api';
const TOKEN_KEY = 'shopsphere_token';

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;
  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

type RequestOptions = Omit<RequestInit, 'body'> & { json?: unknown };

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { json, headers: extra, ...init } = opts;
  const headers: Record<string, string> = { Accept: 'application/json', ...(extra as Record<string, string>) };
  if (json !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers,
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const details = (data?.error?.details ?? []) as { field: string; message: string }[];
    const fieldErrors: Record<string, string> = {};
    if (Array.isArray(details)) {
      for (const d of details) if (d.field && !fieldErrors[d.field]) fieldErrors[d.field] = d.message;
    }
    // Only drop the session when the token itself is rejected, not on e.g. a wrong password.
    if (res.status === 401 && token) tokenStore.clear();
    throw new ApiError(res.status, data?.error?.message || 'Something went wrong', fieldErrors);
  }
  return data as T;
}

// Postgres NUMERIC -> string; convert every money/rating field to a real number.
const num = (v: unknown): number => Number(v ?? 0);
const normaliseProduct = (p: Product): Product => ({
  ...p,
  price: num(p.price),
  final_price: num(p.final_price),
  rating: num(p.rating),
  discount_percent: num(p.discount_percent),
});
const normaliseOrder = (o: Order): Order => ({
  ...o,
  subtotal: num(o.subtotal),
  shipping: num(o.shipping),
  total: num(o.total),
  items: (o.items ?? []).map((i) => ({ ...i, unit_price: num(i.unit_price ?? i.unitPrice) })),
});

export const api = {
  register: (name: string, email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/register', { method: 'POST', json: { name, email, password } }),
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', { method: 'POST', json: { email, password } }),
  me: () => request<{ user: User }>('/auth/me'),

  categories: async () => (await request<{ categories: Category[] }>('/categories')).categories,

  products: async (q: ProductQuery) => {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) params.set(k, String(v));
    });
    const data = await request<{ products: Product[]; pagination: Pagination }>(`/products?${params}`);
    return { products: data.products.map(normaliseProduct), pagination: data.pagination };
  },
  product: async (id: number) => normaliseProduct((await request<{ product: Product }>(`/products/${id}`)).product),

  placeOrder: async (items: { productId: number; quantity: number }[], shipping: ShippingInfo) =>
    normaliseOrder((await request<{ order: Order }>('/orders', { method: 'POST', json: { items, shipping, demoAcknowledged: true } })).order),
  myOrders: async () => (await request<{ orders: Order[] }>('/orders/mine')).orders.map(normaliseOrder),
  myOrder: async (id: string) => normaliseOrder((await request<{ order: Order }>(`/orders/mine/${id}`)).order),

  admin: {
    stats: async () => (await request<{ stats: Record<string, number> }>('/admin/stats')).stats,
    orders: async () => (await request<{ orders: Order[] }>('/admin/orders')).orders.map(normaliseOrder),
    createProduct: (body: Record<string, unknown>) => request<{ product: Product }>('/admin/products', { method: 'POST', json: body }),
    updateProduct: (id: number, body: Record<string, unknown>) => request<{ product: Product }>(`/admin/products/${id}`, { method: 'PATCH', json: body }),
    deleteProduct: (id: number) => request<void>(`/admin/products/${id}`, { method: 'DELETE' }),
  },
};
