import { useEffect, useMemo, useState } from 'react';
import * as UI from '../components/ui.jsx';
import * as Core from '../services/core-data.js';
const { Field, Sidebar, Topbar, Stat, OrderTable, Status, OrderDetails, SuccessModal, Loading, Empty } = UI;
const { api, money, read, save, emailOf, ADMIN_EMAIL, ADMIN_PASSWORD, DEMO_CUSTOMER, DEMO_ADMIN, FALLBACK_PRODUCTS } = Core;

function ActivityLogs() { const [logs,setLogs]=useState([]); useEffect(()=>{api('/activity-logs').then(setLogs).catch(()=>{})},[]); return <><div className="page-title"><div><span className="eyebrow">AUDIT TRAIL</span><h1>Activity logs</h1><p>Track important system and admin actions.</p></div></div><div className="card panel"><div className="activity-list">{logs.length?logs.map(l=><div className="activity-item" key={l.id}><span className="activity-dot"/><div><b>{l.action}</b><small>{l.actor} · {l.details}</small></div><time>{new Date(l.createdAt).toLocaleString()}</time></div>):<Empty text="No activity yet."/>}</div></div></>; }

export { ActivityLogs };
