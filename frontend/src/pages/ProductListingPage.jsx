import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../apiConfig.js';

const EMPTY_FORM = { name: '', brand: '', family: '', description: '', cost: '', productTier: 1, onSpecial: false, discount: '' };

function Modal({ title, children, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 18, 0.9)',
        backdropFilter: 'blur(24px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#050d1a',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '540px',
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '22px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#fff' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.65)',
              fontSize: '26px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

function ProductForm({ form, setForm, onSubmit, loading, error, submitLabel }) {
  const field = (label, key, type = 'text', placeholder = '') => (
    <div key={key} style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>{label}</label>
      <input
        type={type}
        value={form[key] || ''}
        placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? e.target.value : e.target.value }))}
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: '14px',
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.04)',
          color: '#fff',
          fontSize: '13px',
          outline: 'none',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.65)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
      />
    </div>
  );

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '18px' }}>
        <div style={{ gridColumn: '1 / -1' }}>{field('Product Name *', 'name', 'text', 'e.g. Heavy Duty Packaging Tape')}</div>
        {field('Brand', 'brand', 'text', 'e.g. TapeMax')}
        {field('Family / Category', 'family', 'text', 'e.g. Packaging')}
        {field('Price (AUD) *', 'cost', 'number', '0.00')}
        {field('Product Tier', 'productTier', 'number', '1')}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Description</label>
        <textarea
          value={form.description || ''}
          placeholder="Brief product description..."
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={4}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.04)',
            color: '#fff',
            fontSize: '13px',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.65)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
      </div>

      <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="checkbox"
          id="onSpecial"
          checked={!!form.onSpecial}
          onChange={e => setForm(f => ({ ...f, onSpecial: e.target.checked }))}
          style={{ accentColor: '#60a5fa', width: '16px', height: '16px' }}
        />
        <label htmlFor="onSpecial" style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.75)', cursor: 'pointer' }}>
          On special
        </label>
      </div>

      {form.onSpecial && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
            Discount (0–1, e.g. 0.2 = 20%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={form.discount || ''}
            placeholder="0.20"
            onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.65)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
          />
        </div>
      )}

      {error && (
        <div
          style={{
            background: 'rgba(239,68,68,0.14)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '14px',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#fca5a5',
          }}
        >
          {error}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px 18px',
          borderRadius: '16px',
          border: 'none',
          background: loading ? 'rgba(37,99,235,0.35)' : 'linear-gradient(135deg, #2563eb, #7c3aed)',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={e => {
          if (!loading) e.currentTarget.style.opacity = '0.95';
        }}
        onMouseLeave={e => {
          if (!loading) e.currentTarget.style.opacity = '1';
        }}
      >
        {loading ? 'Saving…' : submitLabel}
      </button>
    </>
  );
}

export default function ProductListingPage() {
  const navigate = useNavigate();
  const sellerId = localStorage.getItem('sellerId');
  const token = localStorage.getItem('token');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');

  const load = React.useCallback(() => {
    fetch(`${API_BASE}/products/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.status === 401) {
          navigate('/login');
          throw new Error();
        }
        return r.json();
      })
      .then(d => setProducts(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [navigate, token]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    load();
  }, [token, navigate, load]);

  const myProducts = products.filter(p => String(p.sellerId) === String(sellerId));
  const filtered = myProducts.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    setFormError('');
    if (!form.name || !form.cost) {
      setFormError('Name and price are required.');
      return;
    }

    setFormLoading(true);
    try {
      const body = {
        ...form,
        productId: `PROD-${Date.now()}`,
        releaseDate: new Date().toISOString(),
        nextProduct: '',
        cost: parseFloat(form.cost),
        productTier: parseInt(form.productTier, 10) || 1,
        discount: form.onSpecial ? parseFloat(form.discount) || 0 : 0,
      };

      const res = await fetch(`${API_BASE}/products/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create product');

      setShowAdd(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async () => {
    setFormError('');
    if (!form.name || !form.cost) {
      setFormError('Name and price are required.');
      return;
    }

    setFormLoading(true);
    try {
      const body = {
        ...form,
        cost: parseFloat(form.cost),
        productTier: parseInt(form.productTier, 10) || 1,
        discount: form.onSpecial ? parseFloat(form.discount) || 0 : 0,
      };

      const res = await fetch(`${API_BASE}/products/${editProduct.productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update product');
      setEditProduct(null);
      load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`${API_BASE}/products/${deleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteId(null);
      load();
    } catch (e) {}
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#050d1a', fontFamily: "'Geist', 'Segoe UI', sans-serif" }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.08)', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>Loading product catalog…</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050d1a', color: '#fff', fontFamily: "'Geist', 'Segoe UI', sans-serif" }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at top left, rgba(37,99,235,0.16), transparent 24%), radial-gradient(circle at bottom right, rgba(124,58,237,0.14), transparent 22%)',
            pointerEvents: 'none',
          }}
        />

        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            padding: '28px 36px',
            gap: '24px',
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
            background: 'rgba(5,13,26,0.78)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '6px' }}>My Product Catalog</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{myProducts.length} product{myProducts.length !== 1 ? 's' : ''} listed</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <div style={{ minWidth: '240px', width: '100%', maxWidth: '320px' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products…"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.65)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
              />
            </div>
            <button
              onClick={() => {
                setForm(EMPTY_FORM);
                setFormError('');
                setShowAdd(true);
              }}
              style={{
                padding: '12px 22px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 16px 36px rgba(37,99,235,0.22)',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.95')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              + Add Product
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: '34px 36px 40px', overflowY: 'auto', position: 'relative', zIndex: 10 }}>
          {filtered.length === 0 ? (
            <div
              style={{
                maxWidth: '760px',
                margin: '0 auto',
                padding: '72px 44px',
                borderRadius: '26px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '46px', marginBottom: '18px' }}>📦</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>
                {search ? 'No products match your search' : 'No products in your catalog yet'}
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '24px', lineHeight: 1.7 }}>
                {search ? 'Try another term or clear the search to see your full list.' : 'Create a new product to start selling to buyers today.'}
              </div>
              {!search && (
                <button
                  onClick={() => {
                    setForm(EMPTY_FORM);
                    setFormError('');
                    setShowAdd(true);
                  }}
                  style={{
                    padding: '12px 22px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  + Add your first product
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                overflow: 'hidden',
                borderRadius: '26px',
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.025)',
                backdropFilter: 'blur(24px)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1040px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Product', 'Brand', 'Family', 'Tier', 'Price', 'Status', 'Actions'].map(h => (
                      <th
                        key={h}
                        style={{
                          padding: '18px 22px',
                          textAlign: 'left',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'rgba(255,255,255,0.45)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.14em',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr
                      key={p.productId}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.2s ease' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '18px 22px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{p.name}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>{p.productId}</div>
                      </td>
                      <td style={{ padding: '18px 22px', color: 'rgba(255,255,255,0.65)' }}>{p.brand || '—'}</td>
                      <td style={{ padding: '18px 22px', color: 'rgba(255,255,255,0.65)' }}>{p.family || '—'}</td>
                      <td style={{ padding: '18px 22px', color: 'rgba(255,255,255,0.65)' }}>T{p.productTier || 1}</td>
                      <td style={{ padding: '18px 22px' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>${Number(p.cost).toFixed(2)}</div>
                        {p.onSpecial && <div style={{ fontSize: '11px', color: '#fbbf24' }}>-{Math.round(p.discount)}%</div>}
                      </td>
                      <td style={{ padding: '18px 22px' }}>
                        {p.onSpecial ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'linear-gradient(135deg, rgba(245,158,11,0.16), rgba(239,68,68,0.16))',
                              color: '#f59e0b',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '6px 12px',
                              borderRadius: '999px',
                            }}
                          >
                            On Special
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'rgba(16,185,129,0.12)',
                              color: '#6ee7b7',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '6px 12px',
                              borderRadius: '999px',
                            }}
                          >
                            Active
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '18px 22px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                          <button
                            onClick={() => {
                              setForm({ ...p, discount: p.discount ?? '' });
                              setFormError('');
                              setEditProduct(p);
                            }}
                            style={{
                              padding: '10px 16px',
                              borderRadius: '14px',
                              border: '1px solid rgba(255,255,255,0.14)',
                              background: 'rgba(255,255,255,0.04)',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteId(p.productId)}
                            style={{
                              padding: '10px 16px',
                              borderRadius: '14px',
                              border: '1px solid rgba(248,113,113,0.35)',
                              background: 'rgba(248,113,113,0.12)',
                              color: '#fca5a5',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.18)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.12)')}
                          >
                            Delete
                          </button>
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
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 8, 18, 0.9)',
            backdropFilter: 'blur(24px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#050d1a',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px',
              padding: '34px',
              maxWidth: '420px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ fontSize: '44px', marginBottom: '16px' }}>🗑️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>Delete product?</h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', margin: '0 0 24px', lineHeight: 1.7 }}>
              This action cannot be undone. The product will be removed from the catalog.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  flex: '1 1 140px',
                  padding: '12px 18px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  flex: '1 1 140px',
                  padding: '12px 18px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #f97316)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.95')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
