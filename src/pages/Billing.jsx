import { useEffect, useMemo, useState } from 'react';
import * as UI from '../components/ui.jsx';
import * as Core from '../services/core-data.js';
import { printInvoice } from '../utils/actions.js';
const { Field, Sidebar, Topbar, Stat, OrderTable, Status, OrderDetails, SuccessModal, Loading, Empty } = UI;
const { api, money, read, save, emailOf, ADMIN_EMAIL, ADMIN_PASSWORD, DEMO_CUSTOMER, DEMO_ADMIN, FALLBACK_PRODUCTS } = Core;

function Billing({ user, orders }) { const visible = user.role === 'admin' ? orders : orders.filter(o => emailOf(o.customerEmail) === emailOf(user)); return <><div className="page-title"><div><span className="eyebrow">BILLING</span><h1>{user.role === 'admin' ? 'Invoices' : 'Bills & receipts'}</h1><p>Printable digital billing records.</p></div></div><div className="card panel"><div className="table-responsive"><table className="table align-middle"><thead><tr><th>Invoice</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th /></tr></thead><tbody>{visible.map(o => <tr key={o.id}><td><b>{o.id}</b><small className="d-block text-muted">{o.date}</small></td><td>{o.customer}</td><td><b>{money(o.total)}</b></td><td>{o.paymentMethod}<small className="d-block text-muted">{o.paymentStatus}</small></td><td><Status status={o.status} /></td><td><button className="btn btn-sm btn-outline-primary" onClick={() => printInvoice(o)}><i className="bi bi-printer" /> Print receipt</button></td></tr>)}{!visible.length && <tr><td colSpan="6"><Empty text="No billing records yet." /></td></tr>}</tbody></table></div></div></>; }

export { Billing };
