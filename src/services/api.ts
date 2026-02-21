import { Product, Order, OrderItem, User } from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// ── Token helpers ─────────────────────────────────────────────

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// ── Generic fetch wrapper with auto-refresh ───────────────────

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return apiFetch<T>(path, options, false);
    clearTokens();
    window.location.href = '/';
    throw new ApiError(401, 'Session expired');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message || res.statusText);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    setTokens(json.data.accessToken, json.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

// ── Auth ──────────────────────────────────────────────────────

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export async function loginApi(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message || 'Login failed');
  }

  const json = await res.json();
  return json.data;
}

export async function logoutApi(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return;
  try {
    await apiFetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // ignore logout failures
  }
}

// ── Products ──────────────────────────────────────────────────

export async function fetchProducts(): Promise<Product[]> {
  const products = await apiFetch<any[]>('/products');
  return products.map(mapProduct);
}

export async function fetchProduct(id: string): Promise<Product> {
  const product = await apiFetch<any>(`/products/${id}`);
  return mapProduct(product);
}

export async function createProduct(
  data: Omit<Product, 'id' | 'createdAt'>,
): Promise<Product> {
  const product = await apiFetch<any>('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return mapProduct(product);
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, 'id' | 'createdAt'>>,
): Promise<Product> {
  const product = await apiFetch<any>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return mapProduct(product);
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch(`/products/${id}`, { method: 'DELETE' });
}

function mapProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    styleNumber: p.styleNumber,
    description: p.description || undefined,
    colors: p.colors || [],
    sizes: p.sizes || [],
    sizesInNumber: p.sizesInNumber || [],
    imageUrl: p.imageUrl || undefined,
    price: p.price != null ? Number(p.price) : undefined,
    createdAt: new Date(p.createdAt),
  };
}

// ── Orders ────────────────────────────────────────────────────

export async function fetchOrders(): Promise<Order[]> {
  const orders = await apiFetch<any[]>('/orders');
  return orders.map(mapOrder);
}

export async function fetchOrder(id: string): Promise<Order> {
  const order = await apiFetch<any>(`/orders/${id}`);
  return mapOrder(order);
}

export async function createOrder(data: {
  poNumber: string;
  items: OrderItem[];
}): Promise<Order> {
  const order = await apiFetch<any>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      poNumber: data.poNumber,
      totalItems: data.items.reduce((sum, i) => sum + i.quantity, 0),
      items: data.items,
    }),
  });
  return mapOrder(order);
}

export async function updateOrderStatus(
  id: string,
  status: string,
): Promise<Order> {
  const order = await apiFetch<any>(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return mapOrder(order);
}

export async function exportOrdersCsv(): Promise<void> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}/orders/export/csv`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError(res.status, 'Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function mapOrder(o: any): Order {
  return {
    id: o.id,
    customerId: o.customerId,
    customerName: o.customer?.name || o.customerName || '',
    customerEmail: o.customer?.email || o.customerEmail || '',
    poNumber: o.poNumber,
    items: (o.items || []).map((i: any) => ({
      productId: i.productId,
      productName: i.productName,
      styleNumber: i.styleNumber,
      color: i.color,
      size: i.size,
      quantity: i.quantity,
    })),
    status: o.status,
    totalItems: o.totalItems,
    createdAt: new Date(o.createdAt),
  };
}

// ── Customers ─────────────────────────────────────────────────

export async function fetchCustomers(): Promise<User[]> {
  const customers = await apiFetch<any[]>('/customers');
  return customers.map(mapUser);
}

export async function fetchCustomer(id: string): Promise<User> {
  const customer = await apiFetch<any>(`/customers/${id}`);
  return mapUser(customer);
}

export async function createCustomer(data: {
  name: string;
  email: string;
  company?: string;
  password: string;
}): Promise<User> {
  const customer = await apiFetch<any>('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return mapUser(customer);
}

export async function updateCustomer(
  id: string,
  data: { name?: string; email?: string; company?: string },
): Promise<User> {
  const customer = await apiFetch<any>(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return mapUser(customer);
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiFetch(`/customers/${id}`, { method: 'DELETE' });
}

function mapUser(u: any): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    company: u.company || undefined,
    role: u.role,
    createdAt: new Date(u.createdAt),
  };
}

// ── Dashboard ─────────────────────────────────────────────────

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  totalCustomers: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>('/dashboard/stats');
}
