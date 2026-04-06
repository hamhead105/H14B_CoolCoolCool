import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const API_BASE = 'https://h14-b-cool-cool-cool.vercel.app';

const FamilyIcon = ({ family, size = 24 }) => {
  const icons = {
    Packaging: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
    ),
    Office: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
    Hardware: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
  };
  return icons[family] || (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    </svg>
  );
};

function getCart() {
  try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
}
function saveCart(c) { localStorage.setItem('cart', JSON.stringify(c)); }

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState(getCart);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    Promise.all([
      fetch(`${API_BASE}/products/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (r.status === 401) { navigate('/login'); throw new Error(); } if (!r.ok) throw new Error('Product not found'); return r.json(); }),
      fetch(`${API_BASE}/products/`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()),
    ]).then(([p, all]) => {
      setProduct(p);
      // related: same family, exclude self
      const related = Array.isArray(all)
        ? all.filter(x => x.productId !== p.productId && x.family === p.family).slice(0, 4)
        : [];
      setRelatedProducts(related);
      // check if already in cart
      const currentCart = getCart();
      setAdded(currentCart.some(c => c.productId === p.productId));
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, token, navigate]);

  const handleAddToCart = () => {
    const currentCart = getCart();
    const idx = currentCart.findIndex(c => c.productId === product.productId);
    let updated;
    if (idx > -1) {
      updated = currentCart.map((c, i) => i === idx ? { ...c, qty: c.qty + qty } : c);
    } else {
      updated = [...currentCart, { ...product, qty }];
    }
    saveCart(updated);
    setCart(updated);
    setAdded(true);
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Loading product…</div>
        </div>
      </div>
    </div>
  );

  if (error || !product) return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '14px' }}>📦</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Product not found</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>{error || 'This product may have been removed.'}</div>
          <button onClick={() => navigate('/products')}
            style={{ padding: '10px 22px', background: '#2563eb', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer' }}>
            Back to Catalog
          </button>
        </div>
      </div>
    </div>
  );

  const finalPrice = product.onSpecial
    ? (product.cost * (1 - product.discount)).toFixed(2)
    : Number(product.cost).toFixed(2);
  const savings = product.onSpecial
    ? (product.cost * product.discount * qty).toFixed(2)
    : null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header style={{ background: '#fff', borderBottom: '1px solid #e8eaf0', padding: '0 28px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => navigate('/products')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: '500', cursor: 'pointer', padding: '6px 10px', borderRadius: '7px' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748b'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Catalog
            </button>
            <span style={{ color: '#e2e8f0' }}>/</span>
            <span style={{ fontSize: '13px', color: '#64748b' }}>{product.family || 'Products'}</span>
            <span style={{ color: '#e2e8f0' }}>/</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{product.name}</span>
          </div>
          {role === 'buyer' && (
            <button onClick={() => navigate('/cart')}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 14px', background: cart.length ? '#eff6ff' : '#f8fafc', border: `1px solid ${cart.length ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: '9px', fontSize: '13px', fontWeight: '600', color: cart.length ? '#2563eb' : '#64748b', cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              Cart
              {cart.length > 0 && (
                <span style={{ background: '#2563eb', color: '#fff', borderRadius: '10px', fontSize: '11px', fontWeight: '700', padding: '1px 6px' }}>{cart.length}</span>
              )}
            </button>
          )}
        </header>

        <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>

            {/* Main product section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', marginBottom: '40px', alignItems: 'start' }}>

              {/* Left: visual + details */}
              <div>
                {/* Hero card */}
                <div style={{
                  background: product.onSpecial ? 'linear-gradient(135deg,#fef9ec,#fde68a)' : 'linear-gradient(135deg,#eff6ff,#dbeafe)',
                  borderRadius: '16px', border: '1px solid #e8eaf0',
                  height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', marginBottom: '24px', overflow: 'hidden',
                }}>
                  <div style={{
                    width: '88px', height: '88px', background: '#fff', borderRadius: '20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  }}>
                    <FamilyIcon family={product.family} size={36} />
                  </div>
                  {product.onSpecial && (
                    <div style={{
                      position: 'absolute', top: '16px', right: '16px',
                      background: '#f59e0b', color: '#fff',
                      fontSize: '13px', fontWeight: '700', padding: '5px 12px', borderRadius: '20px',
                    }}>
                      -{Math.round(product.discount * 100)}% OFF
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: '16px', left: '16px', display: 'flex', gap: '6px' }}>
                    {product.family && (
                      <span style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)', color: '#3b82f6', fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px' }}>
                        {product.family}
                      </span>
                    )}
                    {product.brand && (
                      <span style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)', color: '#64748b', fontSize: '11px', fontWeight: '500', padding: '4px 10px', borderRadius: '6px' }}>
                        {product.brand}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8eaf0', padding: '24px', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 10px' }}>Product Description</h2>
                  <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.7', margin: 0 }}>
                    {product.description || 'No description has been provided for this product.'}
                  </p>
                </div>

                {/* Specs grid */}
                <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8eaf0', padding: '24px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px' }}>Product Details</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                      { label: 'Product ID', value: product.productId },
                      { label: 'SKU / Tier', value: `Tier ${product.productTier || 1}` },
                      { label: 'Brand / Supplier', value: product.brand || '—' },
                      { label: 'Category', value: product.family || '—' },
                      { label: 'Base Price', value: `$${Number(product.cost).toFixed(2)} AUD` },
                      { label: 'Release Date', value: product.releaseDate ? new Date(product.releaseDate).toLocaleDateString('en-AU') : '—' },
                    ].map(row => (
                      <div key={row.label} style={{ background: '#f8fafc', borderRadius: '9px', padding: '12px 14px' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{row.label}</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{row.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: purchase panel */}
              <div style={{ position: 'sticky', top: '80px' }}>
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e8eaf0', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{product.brand}</div>
                  <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 20px', lineHeight: '1.3' }}>{product.name}</h1>

                  {/* Price */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                      <span style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a' }}>${finalPrice}</span>
                      <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '500' }}>AUD</span>
                    </div>
                    {product.onSpecial && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <span style={{ fontSize: '14px', color: '#94a3b8', textDecoration: 'line-through' }}>${Number(product.cost).toFixed(2)}</span>
                        <span style={{ background: '#fef3c7', color: '#d97706', fontSize: '12px', fontWeight: '600', padding: '2px 8px', borderRadius: '6px' }}>
                          Save {Math.round(product.discount * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {role === 'buyer' && (
                    <>
                      {/* Qty selector */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Quantity</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '1px solid #e2e8f0', borderRadius: '9px', overflow: 'hidden', width: 'fit-content' }}>
                          <button onClick={() => setQty(q => Math.max(1, q - 1))}
                            style={{ width: '40px', height: '40px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b', fontWeight: '700', borderRight: '1px solid #e2e8f0' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                          >−</button>
                          <span style={{ padding: '0 20px', fontSize: '14px', fontWeight: '700', color: '#0f172a', minWidth: '40px', textAlign: 'center' }}>{qty}</span>
                          <button onClick={() => setQty(q => q + 1)}
                            style={{ width: '40px', height: '40px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b', fontWeight: '700', borderLeft: '1px solid #e2e8f0' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                          >+</button>
                        </div>
                      </div>

                      {savings && qty > 0 && (
                        <div style={{ background: '#fef3c7', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#92400e', fontWeight: '500' }}>
                          💰 You save <strong>${savings}</strong> on this order
                        </div>
                      )}

                      {/* Line total */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', marginBottom: '16px' }}>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Line total</span>
                        <span style={{ fontSize: '18px', fontWeight: '800', color: '#2563eb' }}>${(parseFloat(finalPrice) * qty).toFixed(2)}</span>
                      </div>

                      <button
                        onClick={handleAddToCart}
                        style={{
                          width: '100%', padding: '13px',
                          background: added ? '#dcfce7' : '#2563eb',
                          border: 'none', borderRadius: '10px',
                          fontSize: '14px', fontWeight: '700',
                          color: added ? '#16a34a' : '#fff',
                          cursor: 'pointer', marginBottom: '10px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { if (!added) e.currentTarget.style.background = '#1d4ed8'; }}
                        onMouseLeave={e => { if (!added) e.currentTarget.style.background = '#2563eb'; }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          {added
                            ? <><polyline points="20 6 9 17 4 12"/></>
                            : <><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></>
                          }
                        </svg>
                        {added ? 'Added to cart' : 'Add to cart'}
                      </button>

                      {added && (
                        <button onClick={() => navigate('/cart')}
                          style={{ width: '100%', padding: '11px', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontWeight: '600', color: '#2563eb', cursor: 'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#eff6ff'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'transparent'; }}
                        >View cart & checkout →</button>
                      )}
                    </>
                  )}

                  {role === 'seller' && (
                    <div style={{ background: '#f0f4ff', borderRadius: '10px', padding: '14px', marginTop: '8px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#2563eb', marginBottom: '4px' }}>Seller view</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>You're viewing this as a seller. Manage this product from My Products.</div>
                      <button onClick={() => navigate('/seller/products')}
                        style={{ marginTop: '10px', padding: '7px 14px', background: '#2563eb', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '600', color: '#fff', cursor: 'pointer' }}>
                        Manage Products →
                      </button>
                    </div>
                  )}
                </div>

                {/* Tier info */}
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e8eaf0', padding: '16px 18px', marginTop: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product Tier</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3].map(t => (
                      <div key={t} style={{
                        flex: 1, padding: '8px', borderRadius: '8px', textAlign: 'center',
                        background: (product.productTier || 1) === t ? '#eff6ff' : '#f8fafc',
                        border: `1px solid ${(product.productTier || 1) === t ? '#bfdbfe' : '#e8eaf0'}`,
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: (product.productTier || 1) === t ? '#2563eb' : '#94a3b8' }}>T{t}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Related products */}
            {relatedProducts.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: 0 }}>More from {product.family}</h2>
                  <button onClick={() => navigate('/products')}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>View all →</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' }}>
                  {relatedProducts.map(p => {
                    const price = p.onSpecial ? (p.cost * (1 - p.discount)).toFixed(2) : Number(p.cost).toFixed(2);
                    return (
                      <div key={p.productId}
                        onClick={() => navigate(`/products/${p.productId}`)}
                        style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e8eaf0', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        <div style={{ height: '80px', background: p.onSpecial ? 'linear-gradient(135deg,#fef9ec,#fef3d0)' : 'linear-gradient(135deg,#f0f4ff,#e8eeff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                          <FamilyIcon family={p.family} size={22} />
                        </div>
                        <div style={{ padding: '12px' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>{p.brand}</div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '6px', lineHeight: '1.3' }}>{p.name}</div>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: '#2563eb' }}>${price}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}