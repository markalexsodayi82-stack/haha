import { useState } from 'react';
import * as UI from '../components/ui.jsx';
import * as Core from '../services/core-data.js';
const { Field } = UI;
const { api, money } = Core;

function ProductsAdmin({ products, notify, refresh, user }) {
  const empty = { name:'', size:'5 Gallons', price:35, stock:0, reorder:10 };
  const [show,setShow]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState(empty);
  const [busy,setBusy]=useState(false);

  const openAdd=()=>{setEditing(null);setForm(empty);setShow(true)};
  const edit=p=>{setEditing(p);setForm({name:p.name,size:p.size,price:p.price,stock:p.stock,reorder:p.reorder});setShow(true)};
  const saveProduct=async e=>{
    e.preventDefault(); setBusy(true);
    try {
      const body={...form,actor:user?.name||'Admin'};
      const saved=editing
        ? await api(`/products/${editing.id}`,{method:'PUT',body:JSON.stringify(body)})
        : await api('/products',{method:'POST',body:JSON.stringify(body)});
      setShow(false); setEditing(null); setForm(empty); refresh();
      notify(editing ? `Product ${saved.name} updated.` : `Product ${saved.name} added.`);
    } catch(x){notify(x.message,'danger')} finally{setBusy(false)}
  };
  const remove=async p=>{
    if(!window.confirm(`Delete ${p.name}? This cannot be undone.`))return;
    try { await api(`/products/${p.id}`,{method:'DELETE',body:JSON.stringify({actor:user?.name||'Admin'})}); refresh(); notify(`${p.name} deleted.`); }
    catch(x){notify(x.message,'danger')}
  };
  return <>
    <div className="page-title"><div><span className="eyebrow">AQUAFLOW ADMIN</span><h1>Water Products</h1></div><button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg"/> Add product</button></div>
    <div className="product-grid">
      {products.map(p=><article className="product-card admin-product" key={p.id}>
        <div className="product-art"><i className="bi bi-droplet-fill"/></div><span>{p.size}</span><h4>{p.name}</h4><strong>{money(p.price)}</strong><small>Stock: {p.stock} · Reorder: {p.reorder}</small>
        <span className={`status-badge ${p.stock<=p.reorder?'warning':'success'}`}>{p.stock<=p.reorder?'Low stock':'Healthy stock'}</span>
        <div className="action-row"><button className="btn btn-sm btn-outline-primary" onClick={()=>edit(p)}>Edit</button><button className="btn btn-sm btn-outline-danger" onClick={()=>remove(p)}>Delete</button></div>
      </article>)}
      {!products.length&&<div className="card panel"><p>No products yet. Click Add product.</p></div>}
    </div>
    {show&&<div className="modal-backdrop-custom"><form className="modal-card" onSubmit={saveProduct}>
      <div className="panel-head"><h5>{editing?'Edit product':'Add product'}</h5><button type="button" className="btn-close" onClick={()=>setShow(false)}/></div>
      <Field label="Product name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
      <div className="two"><Field label="Size" value={form.size} onChange={e=>setForm({...form,size:e.target.value})}/><Field label="Price" type="number" min="0" step="0.01" value={form.price} onChange={e=>setForm({...form,price:Number(e.target.value)})}/></div>
      <div className="two"><Field label="Stock" type="number" min="0" value={form.stock} onChange={e=>setForm({...form,stock:Number(e.target.value)})}/><Field label="Reorder level" type="number" min="0" value={form.reorder} onChange={e=>setForm({...form,reorder:Number(e.target.value)})}/></div>
      <button className="btn btn-primary w-100" disabled={busy}>{busy?'Saving...':editing?'Save changes':'Add product'}</button>
    </form></div>}
  </>;
}
export { ProductsAdmin };
