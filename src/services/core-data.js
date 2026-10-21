const ADMIN_EMAIL = 'markalexsodayi82@gmail.com';
const ADMIN_PASSWORD = 'ALEXADIEMARKSODAYI2006';
const DEMO_CUSTOMER = { id: 'customer-demo', name: 'Sample Customer', email: 'customer@aquaflow.com', password: 'customer123', phone: '09171234567', address: 'Sample Street, Barangay Poblacion', deliveryInstructions: '', role: 'customer', gallonBalance: 0, favorites: [] };
const DEMO_ADMIN = { id: 'admin-1', name: 'AquaFlow Admin', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin', gallonBalance: 0 };
const FALLBACK_PRODUCTS = [
  { id: 1, name: 'Purified Water', size: '5 Gallons', price: 35, stock: 50, reorder: 10, active: true },
  { id: 2, name: 'Mineral Water', size: '5 Gallons', price: 40, stock: 35, reorder: 8, active: true },
  { id: 3, name: 'Alkaline Water', size: '5 Gallons', price: 50, stock: 25, reorder: 6, active: true },
  { id: 4, name: 'Purified Water', size: '1 Gallon', price: 12, stock: 60, reorder: 15, active: true }
];
const money = v => `₱${Number(v || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
const read = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const emailOf = u => String(u?.email || '').toLowerCase();
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');

async function api(path, options = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(`${API_BASE_URL}/api${normalizedPath}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const type = res.headers.get('content-type') || '';
  const data = type.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}
export { ADMIN_EMAIL, ADMIN_PASSWORD, DEMO_CUSTOMER, DEMO_ADMIN, FALLBACK_PRODUCTS, money, read, save, emailOf, api };
