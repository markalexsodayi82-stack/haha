import { useEffect, useMemo, useState } from 'react';
import * as UI from '../components/ui.jsx';
import * as Core from '../services/core-data.js';
const { Field, Sidebar, Topbar, Stat, OrderTable, Status, OrderDetails, SuccessModal, Loading, Empty } = UI;
const { api, money, read, save, emailOf, ADMIN_EMAIL, ADMIN_PASSWORD, DEMO_CUSTOMER, DEMO_ADMIN, FALLBACK_PRODUCTS } = Core;

function Favorites({ user, products, updateSession, notify }) { const ids = user.favorites || []; const fav = products.filter(p => ids.includes(p.id)); const toggle = async id => { const next = ids.includes(id) ? ids.filter(x => x !== id) : [...ids,id]; const updated={...user,favorites:next}; updateSession(updated); try { await api(`/customers/${encodeURIComponent(user.email)}`,{method:'PUT',body:JSON.stringify(updated)}); } catch {} notify(next.includes(id)?'Added to favorites.':'Removed from favorites.'); }; return <><div className="page-title"><div><span className="eyebrow">SAVED WATER</span><h1>Favorites</h1><p>Keep your regular products one tap away.</p></div></div>{fav.length ? <div className="product-grid">{fav.map(p=><article className="product-card" key={p.id}><div className="product-art"><i className="bi bi-droplet-fill" /></div><h4>{p.name}</h4><small>{p.size}</small><strong>{money(p.price)}</strong><button className="btn btn-outline-danger w-100" onClick={()=>toggle(p.id)}><i className="bi bi-heart-fill" /> Remove</button></article>)}</div> : <Empty text="You have no favorite products yet. Add them from the Products tab." />}</>; }

export { Favorites };
