import express from 'express';
import cors from 'cors';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const PORT = Number(process.env.PORT || 8080);
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.AQUAFLOW_DATA_DIR || join(__dirname, 'data');
const DATA_FILE = join(DATA_DIR, 'aquaflow-db.json');
const ADMIN_EMAIL = 'markalexsodayi82@gmail.com';

const SEED = {
  products: [
    { id: 1, name: 'Purified Water', size: '5 Gallons', price: 35, stock: 50, reorder: 10, active: true },
    { id: 2, name: 'Mineral Water', size: '5 Gallons', price: 40, stock: 35, reorder: 8, active: true },
    { id: 3, name: 'Alkaline Water', size: '5 Gallons', price: 50, stock: 25, reorder: 6, active: true },
    { id: 4, name: 'Purified Water', size: '1 Gallon', price: 12, stock: 60, reorder: 15, active: true }
  ],
  customers: [],
  orders: [],
  payments: [],
  riders: [
    { id: 'rider-1', name: 'Mark Santos', phone: '09171234567', status: 'Available', active: true },
    { id: 'rider-2', name: 'John Cruz', phone: '09281234567', status: 'Available', active: true }
  ],
  notifications: [],
  activityLogs: [],
  gallonTransactions: [],
  promotions: [
    { id: 'promo-1', code: 'WELCOME10', description: '10% off for new customers', type: 'percent', value: 10, active: true, minSpend: 100 },
    { id: 'promo-2', code: 'FREEDELIVERY', description: 'Free delivery', type: 'delivery', value: 0, active: true, minSpend: 150 }
  ],
  feedback: [],
  announcements: [
    { id: 'ann-1', title: 'Welcome to AquaFlow', message: 'Order your water gallons and track your delivery in one place.', active: true, createdAt: new Date().toISOString() }
  ],
  subscriptions: []
};

const now = () => new Date().toISOString();
const id = prefix => `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
const money = value => Number(value || 0).toFixed(2);

async function ensureDb() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const merged = { ...SEED, ...parsed };
    for (const key of Object.keys(SEED)) if (!Array.isArray(merged[key])) merged[key] = SEED[key];
    await writeFile(DATA_FILE, JSON.stringify(merged, null, 2));
  } catch {
    await writeFile(DATA_FILE, JSON.stringify(SEED, null, 2));
  }
}

async function readDb() { return JSON.parse(await readFile(DATA_FILE, 'utf8')); }
async function writeDb(db) { await writeFile(DATA_FILE, JSON.stringify(db, null, 2), 'utf8'); }

function fail(message, status = 400) { const e = new Error(message); e.status = status; return e; }
function cleanEmail(value) { return String(value || '').trim().toLowerCase(); }
function logActivity(db, action, actor = 'System', details = '') {
  db.activityLogs.unshift({ id: id('log'), action, actor, details, createdAt: now() });
  db.activityLogs = db.activityLogs.slice(0, 1000);
}
function notify(db, customerEmail, title, message, type = 'info') {
  if (!customerEmail) return;
  db.notifications.unshift({ id: id('notif'), customerEmail: cleanEmail(customerEmail), title, message, type, read: false, createdAt: now() });
}
function validateProduct(body, old = {}) {
  const name = String(body.name ?? old.name ?? '').trim();
  const size = String(body.size ?? old.size ?? '1 Gallon').trim() || '1 Gallon';
  const price = Number(body.price ?? old.price);
  const stock = Number(body.stock ?? old.stock ?? 0);
  const reorder = Number(body.reorder ?? old.reorder ?? 0);
  if (!name) throw fail('Product name is required.');
  if (!Number.isFinite(price) || price < 0) throw fail('Valid price is required.');
  if (!Number.isFinite(stock) || stock < 0) throw fail('Valid stock is required.');
  if (!Number.isFinite(reorder) || reorder < 0) throw fail('Valid reorder level is required.');
  return { name, size, price, stock, reorder, active: body.active ?? old.active ?? true };
}
function getCustomer(db, email) { return db.customers.find(c => cleanEmail(c.email) === cleanEmail(email)); }
function orderTotal(items, db) {
  return items.reduce((sum, item) => {
    const p = db.products.find(x => Number(x.id) === Number(item.productId));
    return sum + (p ? Number(p.price) * Number(item.qty) : 0);
  }, 0);
}
function getOrderCustomerEmail(order) { return cleanEmail(order.customerEmail || order.email); }

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Non-browser clients (health checks, server-to-server) do not send Origin.
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  }
}));
app.use(express.json({ limit: '12mb' }));

// Concise terminal audit for every successful data mutation.
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !/^\/api\/products?(\/|$)/.test(req.path)) {
    res.on('finish', () => {
      if (res.statusCode < 400) console.log(`[API SUCCESS] ${req.method} ${req.path} -> ${res.statusCode}`);
    });
  }
  next();
});

app.get('/', (req, res) => res.type('text/plain').send('AquaFlow Backend is running. API: /api/health'));
app.get('/api/health', async (req, res) => res.json({ ok: true, service: 'AquaFlow API', port: PORT, time: now() }));

// Products / inventory
app.get(['/api/product', '/api/products'], async (req, res, next) => { try { const db = await readDb(); res.json(db.products); } catch (e) { next(e); } });
app.post(['/api/product', '/api/products'], async (req, res, next) => {
  try { const db = await readDb(); const product = { id: db.products.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) + 1, ...validateProduct(req.body) }; db.products.push(product); logActivity(db, 'Product added', req.body.actor || 'Admin', product.name); await writeDb(db); console.log(`\n========== PRODUCT ADDED ==========`);
    console.log(`Time      : ${now()}`);
    console.log(`ID        : ${product.id}`);
    console.log(`Name      : ${product.name}`);
    console.log(`Price     : ₱${money(product.price)}`);
    console.log(`Stock     : ${product.stock}`);
    console.log(`===================================`);
    res.status(201).json(product); } catch (e) { next(e); }
});
app.put(['/api/product/:id', '/api/products/:id'], async (req, res, next) => {
  try {
    const db = await readDb();
    const i = db.products.findIndex(p => Number(p.id) === Number(req.params.id));
    if (i < 0) throw fail('Product not found.', 404);
    const product = { ...db.products[i], ...validateProduct(req.body, db.products[i]) };
    db.products[i] = product;
    logActivity(db, 'Product updated', req.body.actor || 'Admin', product.name);
    await writeDb(db);
    console.log('');
    console.log('========== PRODUCT UPDATED ==========');
    console.log(`Time      : ${now()}`);
    console.log(`ID        : ${product.id}`);
    console.log(`Name      : ${product.name}`);
    console.log(`Price     : ₱${money(product.price)}`);
    console.log(`Stock     : ${product.stock}`);
    console.log('=====================================');
    res.json(product);
  } catch (e) { next(e); }
});
app.delete(['/api/product/:id', '/api/products/:id'], async (req, res, next) => {
  try {
    const db = await readDb();
    const i = db.products.findIndex(p => Number(p.id) === Number(req.params.id));
    if (i < 0) throw fail('Product not found.', 404);
    const [removed] = db.products.splice(i, 1);
    logActivity(db, 'Product deleted', req.body?.actor || 'Admin', removed.name);
    await writeDb(db);
    console.log('');
    console.log('========== PRODUCT DELETED ==========');
    console.log(`Time      : ${now()}`);
    console.log(`ID        : ${removed.id}`);
    console.log(`Name      : ${removed.name}`);
    console.log(`Price     : ₱${money(removed.price)}`);
    console.log(`Stock     : ${removed.stock}`);
    console.log('=====================================');
    res.json({ message: 'Product deleted.', product: removed });
  } catch (e) { next(e); }
});
app.post('/api/inventory/adjust', async (req, res, next) => {
  try {
    const db = await readDb(); const product = db.products.find(p => Number(p.id) === Number(req.body.productId)); if (!product) throw fail('Product not found.', 404);
    const quantity = Number(req.body.quantity); if (!Number.isFinite(quantity) || quantity === 0) throw fail('Quantity must be a non-zero number.');
    if (product.stock + quantity < 0) throw fail('Stock cannot go below zero.');
    product.stock += quantity;
    logActivity(db, quantity > 0 ? 'Stock in' : 'Stock out', req.body.actor || 'Admin', `${product.name}: ${quantity > 0 ? '+' : ''}${quantity}`);
    await writeDb(db); console.log(`[INVENTORY] ${product.name} ${quantity > 0 ? '+' : ''}${quantity} => ${product.stock}`); res.json(product);
  } catch (e) { next(e); }
});

// Customers / profiles
app.get('/api/customers', async (req, res, next) => { try { const db = await readDb(); res.json(db.customers); } catch (e) { next(e); } });
app.get('/api/customers/:email', async (req, res, next) => { try { const db = await readDb(); const c = getCustomer(db, req.params.email); if (!c) throw fail('Customer not found.', 404); res.json(c); } catch (e) { next(e); } });
app.post('/api/customers/upsert', async (req, res, next) => {
  try {
    const db = await readDb(); const email = cleanEmail(req.body.email); if (!email) throw fail('Email is required.');
    let customer = getCustomer(db, email);
    if (!customer) { customer = { id: req.body.id || id('customer'), name: String(req.body.name || 'Customer').trim(), email, phone: req.body.phone || '', address: req.body.address || '', deliveryInstructions: req.body.deliveryInstructions || '', photoURL: req.body.photoURL || '', role: 'customer', gallonBalance: Number(req.body.gallonBalance || 0), favorites: [], createdAt: now(), updatedAt: now() }; db.customers.push(customer); logActivity(db, 'Customer registered', customer.name, email); }
    else { Object.assign(customer, { name: req.body.name ?? customer.name, phone: req.body.phone ?? customer.phone, address: req.body.address ?? customer.address, deliveryInstructions: req.body.deliveryInstructions ?? customer.deliveryInstructions, photoURL: req.body.photoURL ?? customer.photoURL, favorites: req.body.favorites ?? customer.favorites ?? [], updatedAt: now() }); }
    await writeDb(db); console.log(`[CUSTOMER UPSERT] ${customer.name} | ${customer.email}`); res.json(customer);
  } catch (e) { next(e); }
});
app.put('/api/customers/:email', async (req, res, next) => {
  try {
    const db = await readDb();
    const email = cleanEmail(req.params.email);
    if (!email) throw fail('Customer email is required.');
    let c = getCustomer(db, email);
    if (!c) {
      c = { id: req.body.id || id('customer'), name: String(req.body.name || 'Customer').trim(), email, phone: req.body.phone || '', address: req.body.address || '', latitude: req.body.latitude, longitude: req.body.longitude, deliveryInstructions: req.body.deliveryInstructions || '', photoURL: req.body.photoURL || '', role: 'customer', gallonBalance: Number(req.body.gallonBalance || 0), favorites: req.body.favorites || [], createdAt: now(), updatedAt: now() };
      db.customers.push(c);
      logActivity(db, 'Customer created', req.body.actor || c.name, email);
    } else {
      Object.assign(c, { name: req.body.name ?? c.name, phone: req.body.phone ?? c.phone, address: req.body.address ?? c.address, latitude: Number.isFinite(Number(req.body.latitude)) ? Number(req.body.latitude) : c.latitude ?? null, longitude: Number.isFinite(Number(req.body.longitude)) ? Number(req.body.longitude) : c.longitude ?? null, deliveryInstructions: req.body.deliveryInstructions ?? c.deliveryInstructions, photoURL: req.body.photoURL ?? c.photoURL, favorites: req.body.favorites ?? c.favorites ?? [], updatedAt: now() });
      logActivity(db, 'Customer profile updated', req.body.actor || c.name, c.email);
    }
    await writeDb(db);
    console.log(`[CUSTOMER UPDATED] ${c.name} | ${c.email}`);
    res.json(c);
  } catch (e) { next(e); }
});


app.delete('/api/customers/:email', async (req, res, next) => {
  try {
    const db = await readDb();
    const email = cleanEmail(req.params.email);
    const index = db.customers.findIndex(c => cleanEmail(c.email) === email);
    if (index < 0) throw fail('Customer not found.', 404);
    const [removed] = db.customers.splice(index, 1);
    logActivity(db, 'Customer deleted', req.body?.actor || 'Admin', `${removed.name} · ${removed.email}`);
    await writeDb(db);
    console.log(`\n========== CUSTOMER DELETED ==========`);
    console.log(`Time      : ${now()}`);
    console.log(`Name      : ${removed.name}`);
    console.log(`Email     : ${removed.email}`);
    console.log(`======================================`);
    res.json({ message: 'Customer deleted.', customer: removed });
  } catch (e) { next(e); }
});

// Orders
app.get('/api/orders', async (req, res, next) => { try { const db = await readDb(); const email = cleanEmail(req.query.email); const list = email ? db.orders.filter(o => getOrderCustomerEmail(o) === email) : db.orders; res.json(list); } catch (e) { next(e); } });
app.get('/api/orders/:id', async (req, res, next) => { try { const db = await readDb(); const order = db.orders.find(o => String(o.id) === String(req.params.id)); if (!order) throw fail('Order not found.', 404); res.json(order); } catch (e) { next(e); } });
app.post('/api/orders', async (req, res, next) => {
  try {
    const db = await readDb(); const body = req.body || {}; const email = cleanEmail(body.customerEmail || body.email); const items = Array.isArray(body.items) ? body.items : [];
    if (!body.customer || !email || !body.phone || !body.address || !items.length) throw fail('Customer, email, phone, address and at least one item are required.');
    let customerRecord = getCustomer(db, email);
    if (!customerRecord) { customerRecord = { id: id('customer'), name: String(body.customer).trim(), email, phone: String(body.phone).trim(), address: String(body.address).trim(), latitude: Number.isFinite(Number(body.latitude)) ? Number(body.latitude) : null, longitude: Number.isFinite(Number(body.longitude)) ? Number(body.longitude) : null, deliveryInstructions: body.deliveryInstructions || '', photoURL: '', role: 'customer', gallonBalance: 0, favorites: [], createdAt: now(), updatedAt: now() }; db.customers.push(customerRecord); logActivity(db, 'Customer created from order', customerRecord.name, email); } else { Object.assign(customerRecord, { name: body.customer || customerRecord.name, phone: body.phone || customerRecord.phone, address: body.address || customerRecord.address, latitude: Number.isFinite(Number(body.latitude)) ? Number(body.latitude) : customerRecord.latitude ?? null, longitude: Number.isFinite(Number(body.longitude)) ? Number(body.longitude) : customerRecord.longitude ?? null, deliveryInstructions: body.deliveryInstructions ?? customerRecord.deliveryInstructions, updatedAt: now() }); }
    for (const item of items) { const p = db.products.find(x => Number(x.id) === Number(item.productId)); const qty = Number(item.qty); if (!p) throw fail('A selected product no longer exists.'); if (!Number.isInteger(qty) || qty < 1) throw fail('Invalid item quantity.'); if (qty > Number(p.stock)) throw fail(`${p.name} has only ${p.stock} available.`); }
    const subtotal = orderTotal(items, db); let deliveryFee = Number(body.deliveryFee ?? 0); const promoCode = String(body.promoCode || '').trim().toUpperCase(); const promo = db.promotions.find(p => p.code === promoCode && p.active && subtotal >= Number(p.minSpend || 0)); let discount = 0; if (promo?.type === 'percent') discount = subtotal * (Number(promo.value) / 100); if (promo?.type === 'delivery') deliveryFee = 0;
    const total = Math.max(0, subtotal - discount + deliveryFee); const order = { id: `AF-${Date.now().toString().slice(-8)}`, reference: id('AF'), customer: String(body.customer).trim(), customerEmail: email, phone: String(body.phone).trim(), address: String(body.address).trim(), latitude: Number.isFinite(Number(body.latitude)) ? Number(body.latitude) : null, longitude: Number.isFinite(Number(body.longitude)) ? Number(body.longitude) : null, deliveryInstructions: body.deliveryInstructions || '', items: items.map(i => ({ productId: Number(i.productId), qty: Number(i.qty) })), subtotal, deliveryFee, discount, promoCode: promo?.code || '', total, paymentMethod: body.paymentMethod || 'Cash', gcashNumber: body.gcashNumber || '', paymentStatus: body.paymentMethod === 'GCash' ? 'For Verification' : 'Unpaid', status: 'Pending', riderId: '', riderName: '', riderPhone: '', estimatedDelivery: body.estimatedDelivery || '', notes: body.notes || '', stockDeducted: false, createdAt: now(), updatedAt: now(), date: new Date().toLocaleDateString('en-PH') };
    db.orders.unshift(order);
    if (order.paymentMethod === 'GCash' && body.paymentProofData) db.payments.unshift({ id: id('pay'), orderId: order.id, method: 'GCash', amount: total, status: 'For Verification', gcashNumber: order.gcashNumber, proofName: body.paymentProofName || 'payment-proof', proofData: body.paymentProofData, createdAt: now() }); else db.payments.unshift({ id: id('pay'), orderId: order.id, method: order.paymentMethod, amount: total, gcashNumber: order.gcashNumber || '', status: order.paymentMethod === 'Cash' ? 'Unpaid' : 'For Verification', proofName: '', proofData: '', createdAt: now() });
    notify(db, email, 'Order received', `Your order ${order.id} has been received.`, 'success'); logActivity(db, 'Order placed', order.customer, `${order.id} · ${money(total)}`); await writeDb(db);
    console.log('========================================'); console.log('[ORDER SUCCESS]'); console.log(`Reference : ${order.id}`); console.log(`Customer  : ${order.customer}`); console.log(`Email     : ${order.customerEmail}`); console.log(`Items     : ${order.items.map(i => `${i.qty}x product-${i.productId}`).join(', ')}`); console.log(`Total     : ₱${money(order.total)}`); console.log(`Payment   : ${order.paymentMethod}`); console.log('Status    : Pending'); console.log('========================================'); res.status(201).json(order);
  } catch (e) { console.error(`[ORDER FAILED] ${e.message}`); next(e); }
});
app.put('/api/orders/:id/status', async (req, res, next) => {
  try {
    const db = await readDb(); const order = db.orders.find(o => String(o.id) === String(req.params.id)); if (!order) throw fail('Order not found.', 404); const allowed = ['Pending','Confirmed','Preparing','Out for Delivery','Delivered','Cancelled']; const status = String(req.body.status || ''); if (!allowed.includes(status)) throw fail('Invalid order status.');
    const old = order.status; if (status === 'Delivered' && old !== 'Delivered' && !order.stockDeducted) { for (const item of order.items) { const p = db.products.find(x => Number(x.id) === Number(item.productId)); if (!p || Number(p.stock) < Number(item.qty)) throw fail(`Not enough stock to complete ${order.id}.`); } for (const item of order.items) { const p = db.products.find(x => Number(x.id) === Number(item.productId)); p.stock -= Number(item.qty); } order.stockDeducted = true; const customer = getCustomer(db, order.customerEmail); const gallons = order.items.reduce((s, i) => s + Number(i.qty), 0); if (customer) { customer.gallonBalance = Number(customer.gallonBalance || 0) + gallons; db.gallonTransactions.unshift({ id: id('gallon'), customerEmail: customer.email, type: 'Borrowed/Delivered', quantity: gallons, orderId: order.id, createdAt: now() }); } }
    if (status === 'Cancelled' && old === 'Delivered') throw fail('Delivered orders cannot be cancelled.'); order.status = status; order.updatedAt = now(); if (req.body.riderId !== undefined) { const rider = db.riders.find(r => r.id === req.body.riderId); order.riderId = rider?.id || ''; order.riderName = rider?.name || ''; order.riderPhone = rider?.phone || ''; }
    const messages = { Confirmed: 'Your order has been confirmed.', Preparing: 'Your order is being prepared.', 'Out for Delivery': 'Your order is out for delivery.', Delivered: 'Your order has been delivered.', Cancelled: 'Your order was cancelled.' }; if (messages[status]) notify(db, order.customerEmail, `Order ${status}`, `${messages[status]} (${order.id})`, status === 'Cancelled' ? 'danger' : 'success'); logActivity(db, `Order ${status}`, req.body.actor || 'Admin', order.id); await writeDb(db);
    console.log(`[ORDER STATUS] ${order.id}: ${old} -> ${status}`); res.json(order);
  } catch (e) { next(e); }
});
app.post('/api/orders/:id/reorder', async (req, res, next) => {
  try { const db = await readDb(); const old = db.orders.find(o => String(o.id) === String(req.params.id)); if (!old) throw fail('Order not found.', 404); res.json({ items: old.items, address: old.address, phone: old.phone, deliveryInstructions: old.deliveryInstructions, paymentMethod: old.paymentMethod }); } catch (e) { next(e); }
});

// Payments
app.get('/api/payments', async (req, res, next) => { try { const db = await readDb(); const email = cleanEmail(req.query.email); const list = email ? db.payments.filter(p => db.orders.find(o => o.id === p.orderId && getOrderCustomerEmail(o) === email)) : db.payments; res.json(list); } catch (e) { next(e); } });
app.put('/api/payments/:id/status', async (req, res, next) => { try { const db = await readDb(); const p = db.payments.find(x => x.id === req.params.id); if (!p) throw fail('Payment not found.', 404); const allowed = ['Unpaid','For Verification','Paid','Rejected']; if (!allowed.includes(req.body.status)) throw fail('Invalid payment status.'); p.status = req.body.status; const order = db.orders.find(o => o.id === p.orderId); if (order) order.paymentStatus = p.status; logActivity(db, 'Payment updated', req.body.actor || 'Admin', `${p.orderId} · ${p.status}`); if (order && p.status === 'Paid') notify(db, order.customerEmail, 'Payment verified', `Payment for ${order.id} has been verified.`, 'success'); await writeDb(db); res.json(p); } catch (e) { next(e); } });

// Riders / deliveries
app.get('/api/riders', async (req, res, next) => { try { const db = await readDb(); res.json(db.riders); } catch (e) { next(e); } });
app.post('/api/riders', async (req, res, next) => { try { const db = await readDb(); const rider = { id: id('rider'), name: String(req.body.name || '').trim(), phone: String(req.body.phone || '').trim(), status: req.body.status || 'Available', active: true }; if (!rider.name || !rider.phone) throw fail('Rider name and phone are required.'); db.riders.push(rider); logActivity(db, 'Rider added', req.body.actor || 'Admin', rider.name); await writeDb(db);
    console.log(`\n========== RIDER ADDED ==========`);
    console.log(`Time      : ${now()}`);
    console.log(`ID        : ${rider.id}`);
    console.log(`Name      : ${rider.name}`);
    console.log(`Phone     : ${rider.phone}`);
    console.log(`=================================`);
    res.status(201).json(rider); } catch (e) { next(e); } });
app.put('/api/riders/:id', async (req, res, next) => { try { const db = await readDb(); const rider = db.riders.find(r => r.id === req.params.id); if (!rider) throw fail('Rider not found.', 404); Object.assign(rider, { name: req.body.name ?? rider.name, phone: req.body.phone ?? rider.phone, status: req.body.status ?? rider.status, active: req.body.active ?? rider.active });
    logActivity(db, 'Rider updated', req.body.actor || 'Admin', rider.name);
    await writeDb(db);
    console.log(`\n========== RIDER UPDATED ==========`);
    console.log(`Time      : ${now()}`);
    console.log(`Name      : ${rider.name}`);
    console.log(`Phone     : ${rider.phone}`);
    console.log(`Status    : ${rider.status}`);
    console.log(`===================================`);
    res.json(rider);
  } catch (e) { next(e); } });
app.put('/api/orders/:id/assign-rider', async (req, res, next) => { try { const db = await readDb(); const order = db.orders.find(o => o.id === req.params.id); const rider = db.riders.find(r => r.id === req.body.riderId); if (!order || !rider) throw fail('Order or rider not found.', 404); order.riderId = rider.id; order.riderName = rider.name; order.riderPhone = rider.phone; rider.status = 'On Delivery'; order.estimatedDelivery = req.body.estimatedDelivery || order.estimatedDelivery || 'Today'; notify(db, order.customerEmail, 'Rider assigned', `${rider.name} is assigned to your order ${order.id}.`, 'info'); logActivity(db, 'Rider assigned', req.body.actor || 'Admin', `${rider.name} → ${order.id}`); await writeDb(db); res.json(order); } catch (e) { next(e); } });


app.delete('/api/riders/:id', async (req, res, next) => {
  try {
    const db = await readDb();
    const index = db.riders.findIndex(r => r.id === req.params.id);
    if (index < 0) throw fail('Rider not found.', 404);
    const [removed] = db.riders.splice(index, 1);
    logActivity(db, 'Rider deleted', req.body?.actor || 'Admin', removed.name);
    await writeDb(db);
    console.log(`\n========== RIDER DELETED ==========`);
    console.log(`Time      : ${now()}`);
    console.log(`Name      : ${removed.name}`);
    console.log(`Phone     : ${removed.phone}`);
    console.log(`===================================`);
    res.json({ message: 'Rider deleted.', rider: removed });
  } catch (e) { next(e); }
});

// Notifications / activity
app.get('/api/notifications', async (req, res, next) => { try { const db = await readDb(); const email = cleanEmail(req.query.email); res.json(email ? db.notifications.filter(n => n.customerEmail === email) : db.notifications); } catch (e) { next(e); } });
app.put('/api/notifications/:id/read', async (req, res, next) => { try { const db = await readDb(); const n = db.notifications.find(x => x.id === req.params.id); if (!n) throw fail('Notification not found.', 404); n.read = true; await writeDb(db); res.json(n); } catch (e) { next(e); } });
app.post('/api/notifications/read-all', async (req, res, next) => { try { const db = await readDb(); const email = cleanEmail(req.body.email); db.notifications.filter(n => !email || n.customerEmail === email).forEach(n => n.read = true); await writeDb(db); res.json({ ok: true }); } catch (e) { next(e); } });
app.get('/api/activity-logs', async (req, res, next) => { try { const db = await readDb(); res.json(db.activityLogs.slice(0, 200)); } catch (e) { next(e); } });

// Gallon balance
app.get('/api/gallons/:email', async (req, res, next) => { try { const db = await readDb(); const customer = getCustomer(db, req.params.email); if (!customer) throw fail('Customer not found.', 404); res.json({ balance: Number(customer.gallonBalance || 0), transactions: db.gallonTransactions.filter(g => cleanEmail(g.customerEmail) === cleanEmail(req.params.email)).slice(0, 100) }); } catch (e) { next(e); } });
app.post('/api/gallons/return', async (req, res, next) => { try { const db = await readDb(); const customer = getCustomer(db, req.body.email); const qty = Number(req.body.quantity); if (!customer) throw fail('Customer not found.', 404); if (!Number.isInteger(qty) || qty < 1) throw fail('Enter a valid gallon quantity.'); if (Number(customer.gallonBalance || 0) < qty) throw fail('Returned gallons cannot exceed the current balance.'); customer.gallonBalance -= qty; db.gallonTransactions.unshift({ id: id('gallon'), customerEmail: customer.email, type: 'Returned', quantity: -qty, orderId: '', createdAt: now() }); logActivity(db, 'Gallons returned', customer.name, `${qty} gallon(s)`); await writeDb(db); res.json({ balance: customer.gallonBalance }); } catch (e) { next(e); } });

// Promotions, feedback, announcements, subscriptions
app.get('/api/promotions', async (req, res, next) => { try { const db = await readDb(); res.json(db.promotions); } catch (e) { next(e); } });
app.post('/api/promotions', async (req, res, next) => { try { const db = await readDb(); const promo = { id: id('promo'), code: String(req.body.code || '').trim().toUpperCase(), description: req.body.description || '', type: req.body.type || 'percent', value: Number(req.body.value || 0), minSpend: Number(req.body.minSpend || 0), active: req.body.active !== false }; if (!promo.code) throw fail('Promo code is required.'); if (db.promotions.some(p => p.code === promo.code)) throw fail('Promotion code already exists.'); db.promotions.push(promo); logActivity(db, 'Promotion added', req.body.actor || 'Admin', promo.code); await writeDb(db); console.log(`[PROMOTION ADDED] ${promo.code}`); res.status(201).json(promo); } catch (e) { next(e); } });
app.put('/api/promotions/:id', async (req, res, next) => { try { const db = await readDb(); const promo = db.promotions.find(p => p.id === req.params.id); if (!promo) throw fail('Promotion not found.', 404); const code = String(req.body.code ?? promo.code).trim().toUpperCase(); if (!code) throw fail('Promo code is required.'); if (db.promotions.some(p => p.id !== promo.id && p.code === code)) throw fail('Promotion code already exists.'); Object.assign(promo, { code, description: req.body.description ?? promo.description, type: req.body.type ?? promo.type, value: Number(req.body.value ?? promo.value), minSpend: Number(req.body.minSpend ?? promo.minSpend), active: req.body.active ?? promo.active }); logActivity(db, 'Promotion updated', req.body.actor || 'Admin', promo.code); await writeDb(db); console.log(`[PROMOTION UPDATED] ${promo.code}`); res.json(promo); } catch (e) { next(e); } });
app.delete('/api/promotions/:id', async (req, res, next) => { try { const db = await readDb(); const i = db.promotions.findIndex(p => p.id === req.params.id); if (i < 0) throw fail('Promotion not found.', 404); const [removed] = db.promotions.splice(i, 1); logActivity(db, 'Promotion deleted', req.body?.actor || 'Admin', removed.code); await writeDb(db); console.log(`[PROMOTION DELETED] ${removed.code}`); res.json(removed); } catch (e) { next(e); } });
app.get('/api/announcements', async (req, res, next) => { try { const db = await readDb(); res.json(db.announcements.filter(a => a.active)); } catch (e) { next(e); } });
app.post('/api/announcements', async (req, res, next) => { try { const db = await readDb(); const a = { id: id('ann'), title: String(req.body.title || '').trim(), message: String(req.body.message || '').trim(), active: true, createdAt: now() }; if (!a.title || !a.message) throw fail('Title and message are required.'); db.announcements.unshift(a); await writeDb(db); res.status(201).json(a); } catch (e) { next(e); } });
app.post('/api/feedback', async (req, res, next) => { try { const db = await readDb(); const rating = Number(req.body.rating); if (rating < 1 || rating > 5) throw fail('Rating must be 1 to 5.'); const feedback = { id: id('feedback'), customerEmail: cleanEmail(req.body.customerEmail), customer: req.body.customer || 'Customer', orderId: req.body.orderId || '', rating, comment: req.body.comment || '', createdAt: now() }; db.feedback.unshift(feedback); logActivity(db, 'Customer feedback', feedback.customer, `${rating}/5 · ${feedback.orderId}`); await writeDb(db); res.status(201).json(feedback); } catch (e) { next(e); } });
app.get('/api/feedback', async (req, res, next) => { try { const db = await readDb(); res.json(db.feedback); } catch (e) { next(e); } });
app.get('/api/subscriptions', async (req, res, next) => { try { const db = await readDb(); const email = cleanEmail(req.query.email); res.json(email ? db.subscriptions.filter(s => s.customerEmail === email) : db.subscriptions); } catch (e) { next(e); } });
app.post('/api/subscriptions', async (req, res, next) => { try { const db = await readDb(); const sub = { id: id('sub'), customerEmail: cleanEmail(req.body.customerEmail), customer: req.body.customer || 'Customer', frequency: req.body.frequency || 'Weekly', day: req.body.day || 'Monday', productId: Number(req.body.productId), quantity: Number(req.body.quantity || 1), active: true, createdAt: now() }; if (!sub.customerEmail || !sub.productId || sub.quantity < 1) throw fail('Subscription details are incomplete.'); db.subscriptions.unshift(sub); logActivity(db, 'Subscription created', sub.customer, `${sub.frequency} · ${sub.quantity} gallon(s)`); await writeDb(db); res.status(201).json(sub); } catch (e) { next(e); } });
app.delete('/api/subscriptions/:id', async (req, res, next) => { try { const db = await readDb(); const i = db.subscriptions.findIndex(s => s.id === req.params.id); if (i < 0) throw fail('Subscription not found.', 404); const [removed] = db.subscriptions.splice(i, 1); await writeDb(db); res.json(removed); } catch (e) { next(e); } });

// Reports
app.get('/api/reports/summary', async (req, res, next) => {
  try {
    const db = await readDb(); const delivered = db.orders.filter(o => o.status === 'Delivered'); const pending = db.orders.filter(o => !['Delivered','Cancelled'].includes(o.status)); const revenue = delivered.reduce((s,o) => s + Number(o.total || 0), 0); const lowStock = db.products.filter(p => Number(p.stock) <= Number(p.reorder)); const productSales = {};
    for (const o of delivered) for (const item of o.items) { const p = db.products.find(x => Number(x.id) === Number(item.productId)); if (p) productSales[p.name] = (productSales[p.name] || 0) + Number(item.qty); }
    const daily = {}; for (const o of delivered) { const day = String(o.createdAt || '').slice(0,10); daily[day] = (daily[day] || 0) + Number(o.total || 0); }
    res.json({ totalOrders: db.orders.length, deliveredOrders: delivered.length, pendingOrders: pending.length, revenue, customers: db.customers.length, lowStock: lowStock.length, lowStockItems: lowStock, productSales, dailySales: daily, payments: db.payments.length, riders: db.riders.length });
  } catch (e) { next(e); }
});

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((error, req, res, next) => { const status = Number(error.status) || 500; console.error(`[API ERROR] ${req.method} ${req.path} | ${error.message}`); res.status(status).json({ message: error.message || 'Internal server error.' }); });

ensureDb().then(() => app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('        AQUAFLOW BACKEND');
  console.log('========================================');
  console.log(`Server listening on port ${PORT}`);
  console.log(`Health endpoint: /api/health`);
  console.log('Status: ONLINE');
  console.log('========================================');
})).catch(error => { console.error('Could not start AquaFlow Backend:', error); process.exit(1); });
