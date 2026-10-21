import { useEffect, useState } from 'react';
import * as UI from '../components/ui.jsx';
import * as Core from '../services/core-data.js';
const { Field, Empty } = UI;
const { api } = Core;

function Promotions({ notify, refresh, user }) {
  const empty = { code:'', description:'', type:'percent', value:10, minSpend:100, active:true };
  const [promos,setPromos]=useState([]), [form,setForm]=useState(empty), [editing,setEditing]=useState(null), [show,setShow]=useState(false), [busy,setBusy]=useState(false);
  const load=()=>api('/promotions').then(setPromos).catch(e=>notify(e.message,'danger'));
  useEffect(() => { load(); }, [refresh]);
  const openAdd=()=>{setEditing(null);setForm({...empty});setShow(true)};
  const edit=p=>{setEditing(p);setForm({code:p.code,description:p.description||'',type:p.type||'percent',value:p.value||0,minSpend:p.minSpend||0,active:p.active!==false});setShow(true)};
  const save=async e=>{e.preventDefault();setBusy(true);try{const body={...form,actor:user?.name||'Admin'};const saved=editing?await api(`/promotions/${editing.id}`,{method:'PUT',body:JSON.stringify(body)}):await api('/promotions',{method:'POST',body:JSON.stringify(body)});setPromos(p=>editing?p.map(x=>x.id===saved.id?saved:x):[...p,saved]);setShow(false);setEditing(null);setForm({...empty});notify(editing?'Promotion updated.':'Promotion added.')}catch(e){notify(e.message,'danger')}finally{setBusy(false)}};
  const remove=async p=>{if(!window.confirm(`Delete promotion ${p.code}?`))return;try{await api(`/promotions/${p.id}`,{method:'DELETE',body:JSON.stringify({actor:user?.name||'Admin'})});setPromos(x=>x.filter(y=>y.id!==p.id));notify(`${p.code} deleted.`)}catch(e){notify(e.message,'danger')}};
  const toggle=async p=>{try{const saved=await api(`/promotions/${p.id}`,{method:'PUT',body:JSON.stringify({active:!p.active,actor:user?.name||'Admin'})});setPromos(x=>x.map(y=>y.id===saved.id?saved:y));notify(`${saved.code} is now ${saved.active?'active':'inactive'}.`)}catch(e){notify(e.message,'danger')}};
  return <><div className="page-title"><div><span className="eyebrow">AQUAFLOW ADMIN</span><h1>Coupons &amp; Promotions</h1></div><button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg"/> Add promotion</button></div>
    <section className="card panel"><div className="panel-head"><div><h5>Promotion list</h5><small>Every change is saved through Express.</small></div><button className="btn btn-sm btn-light" onClick={load}><i className="bi bi-arrow-clockwise"/> Refresh</button></div>
      <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Code</th><th>Description</th><th>Type</th><th>Minimum</th><th>Status</th><th>Actions</th></tr></thead><tbody>{promos.map(p=><tr key={p.id}><td><b>{p.code}</b></td><td>{p.description||'—'}</td><td>{p.type==='percent'?`${p.value}% off`:'Free delivery'}</td><td>₱{Number(p.minSpend||0).toFixed(2)}</td><td><span className={`status-badge ${p.active?'success':'secondary'}`}>{p.active?'Active':'Inactive'}</span></td><td><div className="action-row"><button className="btn btn-sm btn-outline-primary" onClick={()=>edit(p)}>Edit</button><button className="btn btn-sm btn-outline-secondary" onClick={()=>toggle(p)}>{p.active?'Disable':'Activate'}</button><button className="btn btn-sm btn-outline-danger" onClick={()=>remove(p)}>Delete</button></div></td></tr>)}{!promos.length&&<tr><td colSpan="6"><Empty text="No promotions yet."/></td></tr>}</tbody></table></div>
    </section>
    {show&&<div className="modal-backdrop-custom"><form className="modal-card" onSubmit={save}><div className="panel-head"><h5>{editing?'Edit promotion':'Add promotion'}</h5><button type="button" className="btn-close" onClick={()=>setShow(false)}/></div><Field label="Code" value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} required/><Field label="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required/><div className="two"><label className="field"><span>Type</span><select className="form-select" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="percent">Percent discount</option><option value="delivery">Free delivery</option></select></label><Field label="Value" type="number" min="0" value={form.value} onChange={e=>setForm({...form,value:Number(e.target.value)})}/></div><Field label="Minimum spend" type="number" min="0" value={form.minSpend} onChange={e=>setForm({...form,minSpend:Number(e.target.value)})}/><button className="btn btn-primary w-100" disabled={busy}>{busy?'Saving...':editing?'Save changes':'Add promotion'}</button></form></div>}
  </>;
}
export { Promotions };
