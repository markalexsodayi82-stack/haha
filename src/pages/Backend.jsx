import { useEffect, useState } from 'react';
import * as Core from '../services/core-data.js';
const {api,money}=Core;

export default function Backend({ user, notify }) {
 const [products,setProducts]=useState([]),[loading,setLoading]=useState(true),[form,setForm]=useState({name:'',size:'5 Gallons',price:'',stock:0,reorder:10}),[edit,setEdit]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const load=async()=>{setLoading(true);setError('');try{const data=await api('/products');setProducts(data)}catch(e){setError(e.message)}finally{setLoading(false)}}; useEffect(()=>{load()},[]);
 const reset=()=>{setEdit(null);setForm({name:'',size:'5 Gallons',price:'',stock:0,reorder:10})};
 const submit=async e=>{e.preventDefault();setBusy(true);try{const body={...form,price:Number(form.price),stock:Number(form.stock),reorder:Number(form.reorder),actor:user?.name||'Admin'};if(edit)await api(`/products/${edit.id}`,{method:'PUT',body:JSON.stringify(body)});else await api('/products',{method:'POST',body:JSON.stringify(body)});reset();await load();notify(edit?'Product updated successfully.':'Product added successfully.')}catch(e){setError(e.message);notify(e.message,'danger')}finally{setBusy(false)}};
 const remove=async p=>{if(!confirm(`Delete ${p.name}?`))return;try{await api(`/products/${p.id}`,{method:'DELETE',body:JSON.stringify({actor:user?.name||'Admin'})});await load();notify('Product deleted successfully.')}catch(e){notify(e.message,'danger')}};
 const startEdit=p=>{setEdit(p);setForm({name:p.name,size:p.size,price:p.price,stock:p.stock,reorder:p.reorder})};
 return <div className="backend-page"><div className="card panel backend-panel">
 
  {error&&<div className="alert alert-danger">{error}</div>}
  <form className="backend-form-simple" onSubmit={submit}><div className="backend-form-row">
   <label className="form-label">Name<input className="form-control form-control-lg" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label>
   <label className="form-label">Size<input className="form-control form-control-lg" value={form.size} onChange={e=>setForm({...form,size:e.target.value})} required/></label>
   <label className="form-label">Price<input className="form-control form-control-lg" type="number" min="0" step=".01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required/></label>
   <label className="form-label">Stock<input className="form-control form-control-lg" type="number" min="0" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} required/></label>
   <label className="form-label">Reorder<input className="form-control form-control-lg" type="number" min="0" value={form.reorder} onChange={e=>setForm({...form,reorder:e.target.value})} required/></label>
  </div><div className="action-row"><button className="btn btn-primary" disabled={busy}>{busy?'Saving...':edit?'Save changes':'Add product'}</button>{edit&&<button type="button" className="btn btn-light" onClick={reset}>Cancel</button>}</div></form>
  <div className="backend-table-wrap"><div className="backend-table-head"><h5>Live Products</h5><button className="btn btn-sm btn-outline-secondary" onClick={load}>Refresh</button></div>
  {loading?<div className="empty">Loading...</div>:<div className="table-responsive"><table className="table align-middle backend-table"><thead><tr><th>ID</th><th>Name</th><th>Size</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td>{p.id}</td><td>{p.name}</td><td>{p.size}</td><td>{money(p.price)}</td><td>{p.stock}</td><td><div className="action-row"><button className="btn btn-sm btn-outline-primary" onClick={()=>startEdit(p)}>Edit</button><button className="btn btn-sm btn-outline-danger" onClick={()=>remove(p)}>Delete</button></div></td></tr>)}</tbody></table></div>}
  </div>
 </div></div>
}
