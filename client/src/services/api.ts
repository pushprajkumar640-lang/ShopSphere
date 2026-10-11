
import type {
  Category,
  Order,
  Pagination,
  Product,
  ProductQuery,
  ShippingInfo,
  User,
} from '../lib/types';

const BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ??
  '/api';

const TOKEN_KEY = 'shopsphere_token';

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;

  constructor(
    status: number,
    message: string,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

type RequestOptions = Omit<RequestInit, 'body'> & {
  json?: unknown;
};

async function request<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { json, headers: extra, ...init } = opts;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(extra as Record<string, string>),
  };

  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = tokenStore.get();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;

  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers,
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      'Cannot reach the server. Check your connection and try again.',
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const details = (data?.error?.details ?? []) as {
      field: string;
      message: string;
    }[];

    const fieldErrors: Record<string, string> = {};

    if (Array.isArray(details)) {
      for (const detail of details) {
        if (detail.field && !fieldErrors[detail.field]) {
          fieldErrors[detail.field] = detail.message;
        }
      }
    }

    if (res.status === 401 && token) {
      tokenStore.clear();
    }

    throw new ApiError(
      res.status,
      data?.error?.message || 'Something went wrong',
      fieldErrors,
    );
  }

  return data as T;
}

// Convert PostgreSQL numeric values to JavaScript numbers.
const num = (value: unknown): number => Number(value ?? 0);

const normaliseProduct = (product: Product): Product => ({
  ...product,
  price: num(product.price),
  final_price: num(product.final_price),
  rating: num(product.rating),
  discount_percent: num(product.discount_percent),
});

const normaliseOrder = (order: Order): Order => ({
  ...order,
  subtotal: num(order.subtotal),
  shipping: num(order.shipping),
  total: num(order.total),
  items: (order.items ?? []).map((item) => ({
    ...item,
    unit_price: num(item.unit_price ?? item.unitPrice),
  })),
});

export const api = {
  // Authentication
  register: (name: string, email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      json: { name, email, password },
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      json: { email, password },
    }),

  me: () => request<{ user: User }>('/auth/me'),

  // Categories
  categories: async (): Promise<Category[]> => {
    const data = await request<{ categories: Category[] }>('/categories');

    return Array.isArray(data?.categories) ? data.categories : [];
  },

  // Product listing
  products: async (query: ProductQuery) => {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        params.set(key, String(value));
      }
    });

    const data = await request<{
      products?: Product[];
      pagination?: Pagination;
    }>(`/products?${params.toString()}`);

    const products = Array.isArray(data?.products)
      ? data.products.map(normaliseProduct)
      : [];

    const pagination: Pagination = data?.pagination ?? {
      page: 1,
      limit: 12,
      total: products.length,
      totalPages: 1,
    };

    return { products, pagination };
  },

  // Single product
  product: async (id: number) => {
    const data = await request<{ product: Product }>(`/products/${id}`);

    if (!data?.product) {
      throw new ApiError(404, 'Product not found');
    }

    return normaliseProduct(data.product);
  },

  // Orders
  placeOrder: async (
    items: { productId: number; quantity: number }[],
    shipping: ShippingInfo,
  ) => {
    const data = await request<{ order: Order }>('/orders', {
      method: 'POST',
      json: {
        items,
        shipping,
        demoAcknowledged: true,
      },
    });

    return normaliseOrder(data.order);
  },

  myOrders: async () => {
    const data = await request<{ orders: Order[] }>('/orders/mine');

    return Array.isArray(data?.orders)
      ? data.orders.map(normaliseOrder)
      : [];
  },

  myOrder: async (id: string) => {
    const data = await request<{ order: Order }>(`/orders/mine/${id}`);

    return normaliseOrder(data.order);
  },

  // Admin
  admin: {
    stats: async () => {
      const data = await request<{ stats: Record<string, number> }>(
        '/admin/stats',
      );

      return data.stats;
    },

    orders: async () => {
      const data = await request<{ orders: Order[] }>('/admin/orders');

      return Array.isArray(data?.orders)
        ? data.orders.map(normaliseOrder)
        : [];
    },

    createProduct: (body: Record<string, unknown>) =>
      request<{ product: Product }>('/admin/products', {
        method: 'POST',
        json: body,
      }),

    updateProduct: (id: number, body: Record<string, unknown>) =>
      request<{ product: Product }>(`/admin/products/${id}`, {
        method: 'PATCH',
        json: body,
      }),

    deleteProduct: (id: number) =>
      request<void>(`/admin/products/${id}`, {
        method: 'DELETE',
      }),
  },
};
