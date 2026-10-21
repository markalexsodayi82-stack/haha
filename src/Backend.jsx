import { useEffect, useState } from 'react';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
const API_URL = `${API_BASE_URL}/api/product`;

export default function Backend() {
  const [product, setProduct] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [health, setHealth] = useState(null);

  async function loadProducts() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || `Server returned ${response.status}`);
      }

      setProduct(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(`Hindi makonekta sa backend. ${err.message}`);
      console.error('[Backend] GET products failed:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadHealth() {
    try { const response = await fetch(`${API_BASE_URL}/api/health`); const data = await response.json(); if (response.ok) setHealth(data); } catch { setHealth(null); }
  }

  useEffect(() => {
    loadProducts();
    loadHealth();
  }, []);

  async function formSubmit(e) {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    const numericPrice = Number(price);

    if (!cleanName) {
      setError('Ilagay ang product name.');
      return;
    }

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setError('Valid price ang kailangan.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          price: numericPrice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || `Server returned ${response.status}`);
      }

      // Add the newly created product immediately so the table stays in sync.
      setProduct((current) => [...current, data]);
      setName('');
      setPrice('');
    } catch (err) {
      setError(`Hindi na-save ang product. ${err.message}`);
      console.error('[Backend] POST product failed:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="backend-page">
      <div className="card panel backend-panel">
        <div className="backend-heading">
          <span className="eyebrow">SERVER CONTROL</span>
          <h2>AquaFlow Backend</h2>
          <p className="muted">Manage API-connected products and confirm that the server is online.</p>
        </div>

        <div className="backend-health">
          <div><span className={`status-dot ${health?.ok ? 'online' : 'offline'}`} /><b>{health?.ok ? 'API Online' : 'API Offline'}</b><small>{health ? `Port ${health.port}` : 'Start the backend with npm run dev'}</small></div>
          <button className="btn btn-sm btn-light" type="button" onClick={() => { loadHealth(); loadProducts(); }}>Check server</button>
        </div>

        {error && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center">
            <span>
              <i className="bi bi-exclamation-triangle me-2" />
              {error}
            </span>
            <button className="btn btn-sm btn-outline-danger" type="button" onClick={loadProducts}>
              Retry
            </button>
          </div>
        )}

        <form className="backend-form-simple" onSubmit={formSubmit}>
          <div className="backend-form-row">
            <label className="form-label" htmlFor="name">
              Name
              <input
                className="form-control form-control-lg"
                type="text"
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Product name"
                required
              />
            </label>

            <label className="form-label" htmlFor="price">
              Price
              <input
                className="form-control form-control-lg"
                type="number"
                id="price"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="0.00"
                required
              />
            </label>
          </div>

          <button className="btn btn-primary btn-lg backend-submit" type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Saving...
              </>
            ) : (
              'Submit'
            )}
          </button>
        </form>

        <div className="backend-table-wrap">
          <div className="backend-table-head">
            <div>
              <h5>Products</h5>
            </div>
            <button className="btn btn-sm btn-outline-secondary" type="button" onClick={loadProducts} disabled={loading}>
              <i className="bi bi-arrow-clockwise me-1" />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="empty">
              <span className="spinner-border" />
              <p>Loading products...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle backend-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {product.map((products) => (
                    <tr key={products.id ?? `${products.name}-${products.price}`}>
                      <td>{products.name}</td>
                      <td>{products.price}</td>
                    </tr>
                  ))}

                  {!product.length && (
                    <tr>
                      <td colSpan="2">
                        <div className="empty">
                          <i className="bi bi-inbox" />
                          <p>No products found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
