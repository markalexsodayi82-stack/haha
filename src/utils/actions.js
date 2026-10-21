export function openProof(payment) {
  if (!payment?.proofData) return;
  const win = window.open('', '_blank');
  if (!win) return;
  const safe = String(payment.proofData).replace(/"/g, '&quot;');
  win.document.write(`<html><head><title>${payment.orderId || 'Payment'} proof</title></head><body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#f5f7fb"><img src="${safe}" style="max-width:95vw;max-height:95vh;object-fit:contain" alt="Payment proof"/></body></html>`);
  win.document.close();
}

export function printInvoice(o) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<html><head><title>${o.id} - AquaFlow</title><style>body{font-family:Arial;padding:40px;max-width:760px;margin:auto;color:#172033}h1{color:#0d6efd}table{width:100%;border-collapse:collapse;margin-top:20px}td,th{border-bottom:1px solid #ddd;padding:10px;text-align:left}.total{font-size:24px;margin-top:20px}</style></head><body><h1>AquaFlow</h1><p>Water Station Management System</p><h2>Receipt ${o.id}</h2><p><b>Customer:</b> ${o.customer}<br><b>Phone:</b> ${o.phone || ''}<br><b>Delivery:</b> ${o.address || ''}<br><b>Date:</b> ${o.date || ''}<br><b>Payment:</b> ${o.paymentMethod || ''}</p><table><tr><th>Item</th><th>Qty</th></tr>${(o.items||[]).map(i => `<tr><td>Water Product #${i.productId}</td><td>${i.qty}</td></tr>`).join('')}</table><p class="total"><b>Total: ${o.total}</b></p><p>Status: ${o.status}</p><hr><p>Thank you for choosing AquaFlow.</p><script>window.print()</script></body></html>`);
  win.document.close();
}

export function exportReport(data) {
  const rows=[['Metric','Value'],['Revenue',data.revenue],['Total Orders',data.totalOrders],['Delivered Orders',data.deliveredOrders],['Pending Orders',data.pendingOrders],['Customers',data.customers],['Low Stock',data.lowStock]];
  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='aquaflow-report.csv'; a.click(); URL.revokeObjectURL(a.href);
}
