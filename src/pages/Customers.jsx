import { useState } from 'react';
import * as UI from '../components/ui.jsx';
import * as Core from '../services/core-data.js';
const { Field, Empty } = UI;
const { api, money, emailOf } = Core;

function Customers({ users, orders, setUsers, notify, refresh, user }) {
  const customers=users.filter(u=>u.role==='customer' && emailOf(u)!=='customer@aquaflow.com' && emailOf(u)!=='markalexsodayi82@gmail.com' && !['sample customer','mark alex sodayi','aquaflow admin'].includes(String(u.name||'').trim().toLowerCase()));
  const empty={name:'',email:'',phone:'',address:'',deliveryInstructions:''};
  const [show,setShow]=useState(false), [editing,setEditing]=useState(null), [form,setForm]=useState(empty), [busy,setBusy]=useState(false);
  const openAdd=()=>{setEditing(null);setForm(empty);setShow(true)};
  const edit=c=>{setEditing(c);setForm({name:c.name||'',email:c.email||'',phone:c.phone||'',address:c.address||'',deliveryInstructions:c.deliveryInstructions||''});setShow(true)};
  const saveCustomer=async e=>{
    e.preventDefault();setBusy(true);
    try {
      if(!form.email.trim()) throw new Error('Email is required.');
      let saved;
      if(editing) saved=await api(`/customers/${encodeURIComponent(editing.email)}`,{method:'PUT',body:JSON.stringify({name:form.name,phone:form.phone,address:form.address,deliveryInstructions:form.deliveryInstructions,actor:user?.name||'Admin'})});
      else saved=await api('/customers/upsert',{method:'POST',body:JSON.stringify({...form,role:'customer',actor:user?.name||'Admin'})});
      setUsers(prev=>editing?prev.map(x=>emailOf(x)===emailOf(editing)?{...x,...saved}:x):[...prev,saved]);
      setShow(false);refresh();notify(editing?'Customer updated.':'Customer added.');
    }catch(x){notify(x.message,'danger')}finally{setBusy(false)}
  };
  const remove=async c=>{
    if(!window.confirm(`Delete customer ${c.name}?`))return;
    try{await api(`/customers/${encodeURIComponent(c.email)}`,{method:'DELETE',body:JSON.stringify({actor:user?.name||'Admin'})});setUsers(prev=>prev.filter(x=>emailOf(x)!==emailOf(c)));refresh();notify('Customer deleted.')}catch(x){notify(x.message,'danger')}
  };
  return <>
    <div className="page-title"><div><span className="eyebrow">AQUAFLOW ADMIN</span><h1>Customers</h1></div><button className="btn btn-primary" onClick={openAdd}><i className="bi bi-person-plus"/> Add customer</button></div>
    <div className="card panel"><div className="table-responsive"><table className="table align-middle"><thead><tr><th>Customer</th><th>Contact</th><th>Address</th><th>Gallons</th><th>Orders</th><th>Spend</th><th>Actions</th></tr></thead><tbody>
      {customers.map(c=>{const own=orders.filter(o=>emailOf(o.customerEmail)===emailOf(c));return <tr key={c.email}><td><div className="customer-name"><span>{String(c.name||'C')[0]}</span><b>{c.name}</b></div></td><td>{c.phone||'—'}<small className="d-block text-muted">{c.email}</small></td><td>{c.address||'—'}</td><td><span className="gallon-badge">{c.gallonBalance||0}</span></td><td>{own.length}</td><td><b>{money(own.reduce((s,o)=>s+Number(o.total||0),0))}</b></td><td><div className="action-row"><button className="btn btn-sm btn-outline-primary" onClick={()=>edit(c)}>Edit</button><button className="btn btn-sm btn-outline-danger" onClick={()=>remove(c)}>Delete</button></div></td></tr>})}
      {!customers.length&&<tr><td colSpan="7"><Empty text="No registered customers yet."/></td></tr>}
    </tbody></table></div></div>
    {show&&<div className="modal-backdrop-custom"><form className="modal-card" onSubmit={saveCustomer}><div className="panel-head"><h5>{editing?'Edit customer':'Add customer'}</h5><button type="button" className="btn-close" onClick={()=>setShow(false)}/></div>
      <Field label="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/><Field label="Email" type="email" value={form.email} disabled={!!editing} onChange={e=>setForm({...form,email:e.target.value})} required/><Field label="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><Field label="Address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/><Field label="Delivery instructions" value={form.deliveryInstructions} onChange={e=>setForm({...form,deliveryInstructions:e.target.value})}/><button className="btn btn-primary w-100" disabled={busy}>{busy?'Saving...':editing?'Save changes':'Add customer'}</button>
    </form></div>}
  </>;
}
export { Customers };
