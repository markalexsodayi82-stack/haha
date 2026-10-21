import React, { useEffect, useState } from 'react';
import { signInWithGoogle, signOutFirebase } from './firebase.js';
import { api, read, save, emailOf, ADMIN_EMAIL, ADMIN_PASSWORD, DEMO_CUSTOMER, DEMO_ADMIN, FALLBACK_PRODUCTS } from './services/core-data.js';
import { Landing, Login } from './pages/Auth.jsx';
import { Sidebar, Topbar } from './components/ui.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Shop } from './pages/Shop.jsx';
import { Orders, TrackDelivery } from './pages/Orders.jsx';
import { Billing } from './pages/Billing.jsx';
import { Gallons } from './pages/Gallons.jsx';
import { Favorites } from './pages/Favorites.jsx';
import { Subscriptions } from './pages/Subscriptions.jsx';
import { Profile } from './pages/Profile.jsx';
import { Delivery } from './pages/Delivery.jsx';
import { Payments } from './pages/Payments.jsx';
import { Inventory } from './pages/Inventory.jsx';
import { ProductsAdmin } from './pages/Products.jsx';
import { Customers } from './pages/Customers.jsx';
import { Riders } from './pages/Riders.jsx';
import { Reports } from './pages/Reports.jsx';
import { Promotions } from './pages/Promotions.jsx';
import { ActivityLogs } from './pages/ActivityLogs.jsx';
import Backend from './pages/Backend.jsx';

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown page error.' };
  }
  componentDidCatch(error, info) {
    console.error('[AquaFlow] Page render error:', error, info);
  }
  componentDidUpdate(prevProps) {
    if (prevProps.page !== this.props.page && this.state.hasError) {
      this.setState({ hasError: false, message: '' });
    }
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <section className="card panel route-error">
      <div className="route-error-icon"><i className="bi bi-exclamation-triangle" /></div>
      <span className="eyebrow">PAGE RECOVERY</span>
      <h2>{this.props.pageLabel || 'Module'} did not load</h2>
      <p>The navigation is still working. The page renderer hit an error, so AquaFlow kept the shell visible instead of showing a blank screen.</p>
      <div className="route-error-detail">{this.state.message}</div>
      <div className="action-row">
        <button type="button" className="btn btn-primary" onClick={() => this.setState({ hasError: false, message: '' })}>Try again</button>
        <button type="button" className="btn btn-light" onClick={() => this.props.onNavigate?.('dashboard')}>Dashboard</button>
      </div>
    </section>;
  }
}

class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, message: '' }; }
  static getDerivedStateFromError(error) { return { hasError: true, message: error?.message || 'Unknown application error.' }; }
  componentDidCatch(error, info) { console.error('[AquaFlow] App render error:', error, info); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <div className="app-fatal-recovery">
      <div className="card panel fatal-card">
        <div className="route-error-icon"><i className="bi bi-shield-exclamation" /></div>
        <span className="eyebrow">AQUAFLOW RECOVERY</span>
        <h1>The screen hit an error</h1>
        <p>AquaFlow stopped the broken render instead of leaving you on a blank page.</p>
        <div className="route-error-detail">{this.state.message}</div>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Reload AquaFlow</button>
      </div>
    </div>;
  }
}

function Page(props) {
  const { page } = props;
  const map = { dashboard: Dashboard, shop: Shop, orders: Orders, track: TrackDelivery, billing: Billing, gallons: Gallons, favorites: Favorites, subscription: Subscriptions, profile: Profile, delivery: Delivery, payments: Payments, inventory: Inventory, products: ProductsAdmin, customers: Customers, riders: Riders, reports: Reports, promotions: Promotions, activity: ActivityLogs, backend: Backend };
  const C = map[page] || Dashboard;
  return <C {...props} />;
}

function safeArray(key, fallback) {
  const value = read(key, fallback);
  return Array.isArray(value) ? value : fallback;
}

function App() {
  const [session, setSession] = useState(() => { const saved = read('aquaflow_session', null); if (!saved) return null; const email = emailOf(saved); return { ...saved, role: email === ADMIN_EMAIL ? 'admin' : 'customer' }; });
  const [page, setPage] = useState(() => read('aquaflow_page', 'landing'));
  const [products, setProducts] = useState(() => safeArray('aquaflow_products', FALLBACK_PRODUCTS));
  const [users, setUsers] = useState(() => safeArray('aquaflow_users', [DEMO_ADMIN]).filter(u => emailOf(u) !== 'customer@aquaflow.com' && !(emailOf(u) === ADMIN_EMAIL && u.role === 'customer') && String(u.name || '').trim().toLowerCase() !== 'sample customer'));
  const [orders, setOrders] = useState(() => safeArray('aquaflow_orders', []));
  const [notice, setNotice] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [refreshKey, setRefreshKey] = useState(0);
  const notify = (text, type = 'success') => setNotice({ text, type });
  const logout = async () => { try { await signOutFirebase(); } catch {} setSession(null); localStorage.removeItem('aquaflow_session'); localStorage.removeItem('aquaflow_page'); setPage('landing'); };
  useEffect(() => { save('aquaflow_page', page); }, [page]);
  useEffect(() => { save('aquaflow_products', products); }, [products]);
  useEffect(() => { save('aquaflow_users', users); }, [users]);
  useEffect(() => { save('aquaflow_orders', orders); }, [orders]);
  useEffect(() => { const a=()=>setOnline(true), b=()=>setOnline(false); addEventListener('online',a); addEventListener('offline',b); return()=>{removeEventListener('online',a);removeEventListener('offline',b)}; }, []);
  useEffect(() => { if (!notice) return; const t=setTimeout(()=>setNotice(null),3500); return()=>clearTimeout(t); }, [notice]);
  useEffect(() => { let dead=false; Promise.allSettled([api('/product'),api('/orders'),api('/customers')]).then(([p,o,c])=>{ if(dead)return; if(p.status==='fulfilled'&&Array.isArray(p.value)&&p.value.length)setProducts(p.value); if(o.status==='fulfilled'&&Array.isArray(o.value))setOrders(o.value); if(c.status==='fulfilled'&&Array.isArray(c.value))setUsers(prev=>{ const admin=prev.find(u=>emailOf(u)===ADMIN_EMAIL)||DEMO_ADMIN; const local=prev.filter(u=>u.role==='customer'); const merged=[...c.value,...local.filter(x=>!c.value.some(y=>emailOf(y)===emailOf(x)))]; return [admin,...merged]; }); }); return()=>{dead=true}; }, [refreshKey]);
  const login=(email,password)=>{const user=users.find(u=>emailOf(u)===email.trim().toLowerCase()&&u.password===password);if(!user)return false;setSession(user);save('aquaflow_session',user);setPage('dashboard');return true};
  const register=async data=>{const email=data.email.trim().toLowerCase();if(users.some(u=>emailOf(u)===email))return 'Email is already registered.';const user={...data,id:`customer-${Date.now()}`,email,role:'customer',gallonBalance:0,favorites:[]};try{await api('/customers/upsert',{method:'POST',body:JSON.stringify(user)})}catch{}setUsers(p=>[...p,user]);setSession(user);save('aquaflow_session',user);setPage('dashboard');return null};
  const updateSession=user=>{setSession(user);save('aquaflow_session',user);setUsers(prev=>prev.map(u=>emailOf(u)===emailOf(user)?user:u))};
  const handleGoogle=async()=>{const result=await signInWithGoogle();const g=result.user;const email=emailOf(g);if(!email)throw new Error('Google did not return an email.');if(email===ADMIN_EMAIL){updateSession({...DEMO_ADMIN,id:g.uid,photoURL:g.photoURL||''});setPage('dashboard');return;}const existing=users.find(u=>emailOf(u)===email);const customer={...(existing||{}),id:existing?.id||g.uid,name:existing?.name||g.displayName||'Google Customer',email,phone:existing?.phone||g.phoneNumber||'',address:existing?.address||'',deliveryInstructions:existing?.deliveryInstructions||'',photoURL:g.photoURL||existing?.photoURL||'',role:'customer',gallonBalance:existing?.gallonBalance||0,favorites:existing?.favorites||[],password:`google:${g.uid}`};try{await api('/customers/upsert',{method:'POST',body:JSON.stringify(customer)})}catch{}setUsers(prev=>prev.some(u=>emailOf(u)===email)?prev.map(u=>emailOf(u)===email?customer:u):[...prev,customer]);updateSession(customer);setPage('dashboard')};
  if(!session&&page==='landing')return <Landing onLogin={()=>setPage('login')} onRegister={()=>setPage('register')}/>;
  if(!session)return <Login initialRegister={page==='register'} onBack={()=>setPage('landing')} onLogin={login} onRegister={register} onGoogle={handleGoogle}/>;
  const adminPages = new Set(['dashboard','orders','delivery','payments','inventory','products','customers','riders','reports','promotions','activity','backend']);
  const customerPages = new Set(['dashboard','shop','orders','track','billing','gallons','favorites','subscription','profile']);
  const allowed = session.role === 'admin' ? adminPages : customerPages;
  const safePage = typeof page === 'string' && allowed.has(page) ? page : 'dashboard';
  if (safePage !== page) { queueMicrotask(() => setPage('dashboard')); }
  const navigate = nextPage => {
    if (!allowed.has(nextPage)) return;
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const labels = { dashboard:'Dashboard', shop:'Order Water', orders:'Orders', track:'Track Delivery', billing:'Bills & Receipts', gallons:'Gallon Balance', favorites:'Favorites', subscription:'Subscriptions', profile:'Profile', delivery:'Delivery', payments:'Payments', inventory:'Inventory', products:'Products', customers:'Customers', riders:'Riders', reports:'Reports', promotions:'Promotions', activity:'Activity Logs', backend:'Backend' };
  return <AppErrorBoundary>
    <div className={`app-shell role-${session.role}`}>
      <Sidebar user={session} page={safePage} setPage={navigate} logout={logout}/>
      <main className="main-area">
        <Topbar user={session} online={online} page={safePage} onRefresh={()=>setRefreshKey(x=>x+1)} products={products} orders={orders} users={users} setPage={navigate}/>
        {notice&&<div className={`alert alert-${notice.type} global-notice`}>{notice.text}</div>}
        <div className="page-transition" key={safePage}>
          <PageErrorBoundary page={safePage} pageLabel={labels[safePage]} onNavigate={navigate}>
            <Page key={safePage} page={safePage} user={session} products={products} setProducts={setProducts} orders={orders} setOrders={setOrders} users={users} setUsers={setUsers} notify={notify} updateSession={updateSession} refresh={()=>setRefreshKey(x=>x+1)} setPage={navigate}/>
          </PageErrorBoundary>
        </div>
      </main>
    </div>
  </AppErrorBoundary>;
}

export default App;
