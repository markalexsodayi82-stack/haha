import { useEffect, useMemo, useState } from 'react';
import * as UI from '../components/ui.jsx';
import * as Core from '../services/core-data.js';
const { Field, Sidebar, Topbar, Stat, OrderTable, Status, OrderDetails, SuccessModal, Loading, Empty } = UI;
const { api, money, read, save, emailOf, ADMIN_EMAIL, ADMIN_PASSWORD, DEMO_CUSTOMER, DEMO_ADMIN, FALLBACK_PRODUCTS } = Core;

function Landing({ onLogin, onRegister }) {
  const features = [
    ['basket2-fill','Smart ordering','Build your cart, adjust gallons and checkout in seconds.'],
    ['geo-alt-fill','Live delivery','Follow every order from confirmation to your doorstep.'],
    ['shield-check','Secure payments','Cash or GCash with payment verification and receipts.'],
    ['droplet-half','Gallon tracking','See borrowed, returned and active gallon balances.'],
    ['speedometer2','Station control','Inventory, riders, customers and orders in one dashboard.'],
    ['graph-up-arrow','Clear reports','Sales, payments and stock insights for your team.']
  ];
  return <div className="landing-page">
    <nav className="landing-nav reveal-down">
      <div className="brand"><span className="brand-icon pulse-soft"><i className="bi bi-droplet-fill" /></span><div><b>AquaFlow</b><small>Water Station Management</small></div></div>
      <div className="landing-actions"><button className="btn btn-light" onClick={onLogin}>Sign in</button><button className="btn btn-primary" onClick={onRegister}>Create account</button></div>
    </nav>
    <section className="hero">
      <div className="hero-copy reveal-left">
        <span className="eyebrow"><i className="bi bi-stars" /> PURE WATER · SMART DELIVERY</span>
        <h1>Water service that keeps every <span>gallon moving.</span></h1>
        <p>Order, pay, track deliveries, manage gallon balances and stay connected with your water station in one beautiful system.</p>
        <div className="hero-buttons"><button className="btn btn-primary btn-lg btn-lift" onClick={onRegister}>Start ordering <i className="bi bi-arrow-right" /></button><button className="btn btn-link" onClick={onLogin}>I already have an account</button></div>
        <div className="hero-points"><span><i className="bi bi-check-circle-fill" /> Easy ordering</span><span><i className="bi bi-check-circle-fill" /> GCash & Cash</span><span><i className="bi bi-check-circle-fill" /> Delivery tracking</span><span><i className="bi bi-check-circle-fill" /> Digital receipts</span></div>
        <div className="hero-mini-stats"><div><b>24/7</b><small>Order access</small></div><div><b>5★</b><small>Service focus</small></div><div><b>1 app</b><small>Everything connected</small></div></div>
      </div>
      <div className="hero-visual reveal-right">
        <img className="hero-photo" src="https://upload.wikimedia.org/wikipedia/commons/5/5f/Water_dispensing_units_inside_a_water_refilling_station_in_Lobo%2C_Batangas_%282025%29.jpg" alt="Water refilling station in the Philippines" />
        <div className="hero-photo-overlay" />
        <div className="water-orb orb-a" /><div className="water-orb orb-b" /><div className="water-orb orb-c" />
        <div className="float-card fc-one floating-card"><i className="bi bi-truck" /><div><small>Delivery</small><b>Out for delivery</b></div><span className="live-dot" /></div>
        <div className="float-card fc-two floating-card"><i className="bi bi-shield-check" /><div><small>Payment</small><b>Verified securely</b></div></div>
        <div className="hero-caption"><span className="live-dot" /> Real station operations · built for everyday orders</div>
      </div>
    </section>
    <section className="landing-section landing-features"><span className="eyebrow">COMPLETE WATER STATION</span><h2>Everything in one place.</h2><p className="section-lead">A polished customer experience and a powerful control center for your station team.</p><div className="landing-grid">{features.map((x, i) => <article className="feature-card reveal-up" style={{'--delay': `${i * 70}ms`}} key={x[1]}><span><i className={`bi bi-${x[0]}`} /></span><div><h3>{x[1]}</h3><p>{x[2]}</p></div><i className="bi bi-arrow-up-right feature-arrow" /></article>)}</div></section>
    <section className="landing-showcase"><div className="showcase-card"><div><span className="eyebrow">BUILT FOR CUSTOMERS</span><h2>From first order to final delivery.</h2><p>Clear steps, live status updates and receipts keep customers informed without clutter.</p><div className="showcase-steps"><span><b>01</b> Order</span><span><b>02</b> Confirm</span><span><b>03</b> Deliver</span></div></div><div className="showcase-phone"><div className="phone-top"><span /> <b>AquaFlow</b><i className="bi bi-bell" /></div><div className="phone-order"><small>ORDER #AF-2048</small><b>3 × Purified Water</b><strong>₱105.00</strong><div className="phone-progress"><span /><span /><span className="active" /></div><small>Out for delivery</small></div></div></div></section>
    <section className="landing-cta reveal-up"><div><span className="eyebrow">READY WHEN YOU ARE</span><h2>Keep your water supply moving.</h2><p>Join AquaFlow and make every order easier to manage.</p></div><button className="btn btn-light btn-lg btn-lift" onClick={onRegister}>Create your account <i className="bi bi-arrow-right" /></button></section>
    <footer>© {new Date().getFullYear()} AquaFlow Water Station · Pure. Simple. On time.</footer>
  </div>;
}

function Login({ initialRegister, onBack, onLogin, onRegister, onGoogle }) {
  const [registerMode, setRegisterMode] = useState(initialRegister); const [googleLoading, setGoogleLoading] = useState(false); const [error, setError] = useState(''); const [showPassword, setShowPassword] = useState(false); const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '', deliveryInstructions: '' });
  const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async e => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    if (registerMode) {
      if (!Object.values(form).slice(0, 5).every(Boolean)) {
        setSubmitting(false);
        setError('Please complete name, email, password, phone and address.');
        return;
      }
      if (form.password.length < 6) {
        setSubmitting(false);
        setError('Password must be at least 6 characters.');
        return;
      }
      const err = await onRegister(form);
      if (err) {
        setSubmitting(false);
        setError(err);
      }
      return;
    }
    const ok = onLogin(form.email, form.password);
    if (!ok) setError('Incorrect email or password.');
    setSubmitting(false);
  };
  const google = async () => { setError(''); setGoogleLoading(true); try { await onGoogle(); } catch (e) { const code = e?.code || ''; const map = { 'auth/popup-blocked':'Allow popups for localhost.', 'auth/unauthorized-domain':'Add localhost to Firebase Authentication authorized domains.', 'auth/operation-not-allowed':'Enable Google sign-in in Firebase.', 'auth/popup-closed-by-user':'Google sign-in was cancelled.' }; setError(map[code] || e.message || 'Google sign-in failed.'); } finally { setGoogleLoading(false); } };
  const passwordScore = form.password.length >= 10 ? 3 : form.password.length >= 6 ? 2 : form.password.length ? 1 : 0;
  const strengthLabel = passwordScore === 3 ? 'Strong password' : passwordScore === 2 ? 'Good password' : passwordScore === 1 ? 'Use at least 6 characters' : '';
  return <div className="login-page"><div className="login-shell login-shell-modern">
    <section className="login-art">
      <div className="login-art-glow glow-one" /><div className="login-art-glow glow-two" />
      <div className="brand reveal-down"><span className="brand-icon pulse-soft"><i className="bi bi-droplet-fill" /></span><div><b>AquaFlow</b><small>Water Station Management</small></div></div>
      <div className="login-art-copy reveal-left"><span className="eyebrow">PURE · SIMPLE · ON TIME</span><h2>Water delivery made easier.</h2><p>Order gallons, manage payments and track deliveries from one clean customer portal.</p><div className="login-benefits"><span><i className="bi bi-check2-circle" /> Fast checkout</span><span><i className="bi bi-check2-circle" /> Live delivery status</span><span><i className="bi bi-check2-circle" /> Digital receipts</span></div></div>
      <div className="login-photo-wrap">
        <img className="login-photo" src="https://upload.wikimedia.org/wikipedia/commons/5/5f/Water_dispensing_units_inside_a_water_refilling_station_in_Lobo%2C_Batangas_%282025%29.jpg" alt="Water refilling station" />
        <div className="login-photo-badge"><i className="bi bi-droplet-fill" /><span>Real water station workflow</span></div>
      </div>
      <div className="login-art-status floating-card"><i className="bi bi-shield-check" /><div><small>Account security</small><b>Protected access</b></div></div>
    </section>
    <section className="login-card reveal-right">
      <button className="back-button btn-lift" onClick={onBack}><i className="bi bi-arrow-left" /> Back to home</button>
      <span className="eyebrow"><i className="bi bi-stars" /> {registerMode ? 'CUSTOMER REGISTRATION' : 'WELCOME BACK'}</span>
      <h1>{registerMode ? 'Create your account' : 'Sign in to AquaFlow'}</h1>
      <p className="muted">{registerMode ? 'Save your delivery details for faster checkout.' : 'Manage your water orders and account in one place.'}</p>
      {error && <div className="alert alert-danger login-alert"><i className="bi bi-exclamation-circle-fill" /> <span>{error}</span></div>}
      {!registerMode && <><button className="google-btn btn-lift" onClick={google} disabled={googleLoading}>{googleLoading ? <><span className="spinner-border spinner-border-sm" /> Signing in...</> : <><b className="google-g">G</b> Continue with Google</>}</button><div className="divider"><span>or continue with email</span></div></>}
      <form onSubmit={submit} className="login-form">
        {registerMode && <><Field label="Full name" name="name" value={form.name} onChange={change} placeholder="Juan Dela Cruz" /><div className="two"><Field label="Cellphone" name="phone" value={form.phone} onChange={change} placeholder="09XXXXXXXXX" /><Field label="Delivery address" name="address" value={form.address} onChange={change} placeholder="Barangay, Street" /></div><Field label="Delivery instructions (optional)" name="deliveryInstructions" value={form.deliveryInstructions} onChange={change} placeholder="Gate color, landmark, etc." /> </>}
        <Field label="Email" type="email" name="email" value={form.email} onChange={change} placeholder="you@example.com" />
        <label className="field password-field"><span>Password</span><div className="password-wrap"><input className="form-control" required type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={change} placeholder="••••••••" /><button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}><i className={`bi bi-eye${showPassword ? '-slash' : ''}`} /></button></div>{registerMode && passwordScore > 0 && <div className="password-meter"><span className={`meter-fill score-${passwordScore}`} /><small>{strengthLabel}</small></div>}</label>
        <button className="btn btn-primary btn-lg w-100 btn-lift" disabled={submitting}>{submitting ? <><span className="spinner-border spinner-border-sm" /> {registerMode ? 'Creating account...' : 'Signing in...'}</> : <>{registerMode ? 'Create account' : 'Sign in'} <i className="bi bi-arrow-right" /></>}</button>
      </form>
      <div className="switch">{registerMode ? 'Already have an account?' : 'New to AquaFlow?'} <button onClick={() => { setRegisterMode(v => !v); setError(''); setShowPassword(false); }}>{registerMode ? 'Sign in' : 'Create account'}</button></div>
      <div className="login-footer"><i className="bi bi-lock-fill" /> Your session stays protected on this device.</div>
    </section>
  </div></div>;

}

export { Landing, Login };
