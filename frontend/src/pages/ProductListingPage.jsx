import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const API_BASE = 'https://h14-b-cool-cool-cool.vercel.app';

const EMPTY_FORM = { name: '', brand: '', family: '', description: '', cost: '', productTier: 1, onSpecial: false, discount: '' };

function Modal({ title, children, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

function ProductForm({ form, setForm, onSubmit, loading, error, submitLabel }) {
  const field = (label, key, type = 'text', placeholder = '') => (
    <div key={key} style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>{label}</label>
      <input type={type} value={form[key] || ''} placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? e.target.value : e.target.value }))}
        style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#0f172a', boxSizing: 'border-box', outline: 'none' }}
        onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
        onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
      />
    </div>
  );

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div style={{ gridColumn: '1/-1' }}>{field('Product Name *', 'name', 'text', 'e.g. Heavy Duty Packaging Tape')}</div>
        {field('Brand', 'brand', 'text', 'e.g. TapeMax')}
        {field('Family / Category', 'family', 'text', 'e.g. Packaging')}
        {field('Price (AUD) *', 'cost', 'number', '0.00')}
        {field('Product Tier', 'productTier', 'number', '1')}
      </div>
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Description</label>
        <textarea value={form.description || ''} placeholder="Brief product description..."
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={3}
          style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#0f172a', boxSizing: 'border-box', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
          onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
          onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
        />
      </div>
      <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input type="checkbox" id="onSpecial" checked={!!form.onSpecial} onChange={e => setForm(f => ({ ...f, onSpecial: e.target.checked }))} style={{ accentColor: '#2563eb', width: '15px', height: '15px' }} />
        <label htmlFor="onSpecial" style={{ fontSize: '13px', fontWeight: '500', color: '#374151', cursor: 'pointer' }}>On Special (discounted)</label>
      </div>
      {form.onSpecial && (
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Discount (0–1, e.g. 0.2 = 20%)</label>
          <input type="number" step="0.01" min="0" max="1" value={form.discount || ''} placeholder="0.20"
            onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#0f172a', boxSizing: 'border-box', outline: 'none' }}
            onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
            onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
          />
        </div>
      )}
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#dc2626' }}>{error}</div>}
      <button onClick={onSubmit} disabled={loading}
        style={{ width: '100%', padding: '12px', background: loading ? '#93c5fd' : '#2563eb', border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: '700', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer' }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#1d4ed8'; }}
        onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#2563eb'; }}
      >{loading ? 'Saving…' : submitLabel}</button>
    </>
  );
}

export default function ProductListingPage() {
  const navigate = useNavigate();
  const sellerId = localStorage.getItem('sellerId');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');

  const token = localStorage.getItem('token');

  const load = () => {
    fetch(`${API_BASE}/products/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (r.status === 401) { navigate('/login'); throw new Error(); } return r.json(); })
      .then(d => setProducts(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    load();
  }, []);

  const myProducts = products.filter(p => p.sellerId === sellerId);
  const filtered = myProducts.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    setFormError('');
    if (!form.name || !form.cost) { setFormError('Name and price are required.'); return; }
    setFormLoading(true);
    try {
      const body = { ...form, cost: parseFloat(form.cost), productTier: parseInt(form.productTier) || 1, discount: form.onSpecial ? parseFloat(form.discount) || 0 : 0 };
      const res = await fetch(`${API_BASE}/products/`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create product');
      setShowAdd(false); setForm(EMPTY_FORM); load();
    } catch (e) { setFormError(e.message); } finally { setFormLoading(false); }
  };

  const handleEdit = async () => {
    setFormError('');
    if (!form.name || !form.cost) { setFormError('Name and price are required.'); return; }
    setFormLoading(true);
    try {
      const body = { ...form, cost: parseFloat(form.cost), productTier: parseInt(form.productTier) || 1, discount: form.onSpecial ? parseFloat(form.discount) || 0 : 0 };
      const res = await fetch(`${API_BASE}/products/${editProduct.productId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update product');
      setEditProduct(null); load();
    } catch (e) { setFormError(e.message); } finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    try {
      await fetch(`${API_BASE}/products/${deleteId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setDeleteId(null); load();
    } catch (e) {}
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Loading products…</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ background: '#fff', borderBottom: '1px solid #e8eaf0', padding: '0 28px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>My Products</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{myProducts.length} product{myProducts.length !== 1 ? 's' : ''} listed</div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
              style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', width: '220px' }}
              onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
            <button onClick={() => { setForm(EMPTY_FORM); setFormError(''); setShowAdd(true); }}
              style={{ padding: '9px 18px', background: '#2563eb', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
              onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
            >+ Add Product</button>
          </div>
        </header>

        <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', background: '#fff', borderRadius: '14px', border: '1px solid #e8eaf0' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>📦</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                {search ? 'No products match your search' : 'No products yet'}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
                {search ? 'Try a different search term.' : 'Add your first product to start selling.'}
              </div>
              {!search && (
                <button onClick={() => { setForm(EMPTY_FORM); setFormError(''); setShowAdd(true); }}
                  style={{ padding: '10px 22px', background: '#2563eb', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer' }}
                >+ Add your first product</button>
              )}
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8eaf0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', background: '#f8fafc' }}>
                    {['Product', 'Brand', 'Family', 'Tier', 'Price', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.productId} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '2px' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{p.productId}</div>
                      </td>
                      <td style={{ padding: '13px 16px', color: '#64748b' }}>{p.brand || '—'}</td>
                      <td style={{ padding: '13px 16px', color: '#64748b' }}>{p.family || '—'}</td>
                      <td style={{ padding: '13px 16px', color: '#64748b' }}>T{p.productTier || 1}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>${Number(p.cost).toFixed(2)}</div>
                        {p.onSpecial && <div style={{ fontSize: '11px', color: '#f59e0b' }}>-{Math.round(p.discount * 100)}% off</div>}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        {p.onSpecial
                          ? <span style={{ background: '#fef3c7', color: '#d97706', fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '10px' }}>On Special</span>
                          : <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '10px' }}>Active</span>
                        }
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => { setForm({ ...p, discount: p.discount ?? '' }); setFormError(''); setEditProduct(p); }}
                            style={{ padding: '5px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#2563eb', cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => setDeleteId(p.productId)}
                            style={{ padding: '5px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#dc2626', cursor: 'pointer' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {showAdd && (
        <Modal title="Add New Product" onClose={() => setShowAdd(false)}>
          <ProductForm form={form} setForm={setForm} onSubmit={handleAdd} loading={formLoading} error={formError} submitLabel="Create Product" />
        </Modal>
      )}

      {editProduct && (
        <Modal title="Edit Product" onClose={() => setEditProduct(null)}>
          <ProductForm form={form} setForm={setForm} onSubmit={handleEdit} loading={formLoading} error={formError} submitLabel="Save Changes" />
        </Modal>
      )}

      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '32px', maxWidth: '360px', width: '100%', textAlign: 'center', boxShadow: '0 16px 48px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' }}>Delete product?</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px', lineHeight: '1.6' }}>This action cannot be undone. The product will be removed from the catalog.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: '11px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', fontSize: '13px', fontWeight: '600', color: '#64748b', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '11px', background: '#dc2626', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}