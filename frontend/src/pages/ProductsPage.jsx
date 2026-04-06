import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'https://h14-b-cool-cool-cool.vercel.app';

const FamilyIcon = ({ family }) => {
  const icons = {
    Packaging: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
    ),
    Office: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
    Hardware: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
  };
  return icons[family] || (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    </svg>
  );
};

const CartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const GridIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);

const TreeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

function ProductCard({ product, onAdd, onNavigate, inCart }) {
  const finalPrice = product.onSpecial
    ? (product.cost * (1 - product.discount)).toFixed(2)
    : Number(product.cost).toFixed(2);

  return (
    <div
      onClick={() => onNavigate(product)}
      style={{
        background: '#fff', border: '1px solid #e8eaf0', borderRadius: '12px',
        overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s',
        cursor: 'pointer', display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{
        height: '120px',
        background: product.onSpecial ? 'linear-gradient(135deg,#fef9ec,#fef3d0)' : 'linear-gradient(135deg,#f0f4ff,#e8eeff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
      }}>
        <div style={{
          width: '48px', height: '48px', background: '#fff', borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#64748b', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <FamilyIcon family={product.family} />
        </div>
        {product.onSpecial && (
          <div style={{
            position: 'absolute', top: '10px', right: '10px',
            background: '#f59e0b', color: '#fff',
            fontSize: '11px', fontWeight: '600', padding: '2px 7px', borderRadius: '20px',
          }}>
            -{Math.round(product.discount * 100)}%
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: '500' }}>{product.brand}</div>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '8px', lineHeight: '1.3' }}>{product.name}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
          <span style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>${finalPrice}</span>
          {product.onSpecial && (
            <span style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>${Number(product.cost).toFixed(2)}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
          <button
            onClick={e => { e.stopPropagation(); onNavigate(product); }}
            style={{
              flex: 1, padding: '8px 0', background: 'transparent',
              border: '1px solid #e2e8f0', borderRadius: '8px',
              fontSize: '12px', fontWeight: '500', color: '#64748b', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
          >Details</button>
          <button
            onClick={e => { e.stopPropagation(); onAdd(product); }}
            style={{
              flex: 1, padding: '8px 0',
              background: inCart ? '#dcfce7' : '#2563eb', border: 'none', borderRadius: '8px',
              fontSize: '12px', fontWeight: '600', color: inCart ? '#16a34a' : '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            }}
          ><CartIcon />{inCart ? 'Added' : 'Add'}</button>
        </div>
      </div>
    </div>
  );
}

function TreeView({ products, onNavigate, onAdd, cart }) {
  const families = products.reduce((acc, p) => {
    const fam = p.family || 'Other';
    if (!acc[fam]) acc[fam] = [];
    acc[fam].push(p);
    return acc;
  }, {});
  Object.keys(families).forEach(fam => families[fam].sort((a, b) => (a.productTier || 0) - (b.productTier || 0)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {Object.entries(families).map(([familyName, items]) => (
        <div key={familyName}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '28px', height: '28px', background: '#f0f4ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <FamilyIcon family={familyName} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{familyName}</span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{items.length} products</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: '8px' }}>
            {items.map((product, idx) => {
              const finalPrice = product.onSpecial ? (product.cost * (1 - product.discount)).toFixed(2) : Number(product.cost).toFixed(2);
              const inCart = cart.some(c => c.productId === product.productId);
              return (
                <React.Fragment key={product.productId}>
                  <div
                    style={{
                      background: '#fff', border: `2px solid ${inCart ? '#3b82f6' : '#e8eaf0'}`,
                      borderRadius: '12px', padding: '14px', minWidth: '160px', maxWidth: '180px',
                      transition: 'all 0.2s', cursor: 'pointer', position: 'relative',
                    }}
                    onClick={() => onNavigate(product)}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.15)'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = inCart ? '#3b82f6' : '#e8eaf0'; }}
                  >
                    {product.onSpecial && (
                      <div style={{ position: 'absolute', top: '-8px', right: '10px', background: '#f59e0b', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '10px' }}>
                        -{Math.round(product.discount * 100)}%
                      </div>
                    )}
                    <div style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tier {product.productTier || 1}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '6px', lineHeight: '1.3' }}>{product.name}</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#2563eb', marginBottom: '10px' }}>${finalPrice}</div>
                    <button
                      onClick={e => { e.stopPropagation(); onAdd(product); }}
                      style={{ width: '100%', padding: '6px 0', background: inCart ? '#dcfce7' : '#2563eb', border: 'none', borderRadius: '7px', fontSize: '11px', fontWeight: '600', color: inCart ? '#16a34a' : '#fff', cursor: 'pointer' }}
                    >{inCart ? 'Added' : '+ Add'}</button>
                  </div>
                  {idx < items.length - 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', minWidth: '40px' }}>
                      <div style={{ flex: 1, height: '2px', background: '#e2e8f0' }} />
                      <div style={{ width: '6px', height: '6px', borderTop: '2px solid #94a3b8', borderRight: '2px solid #94a3b8', transform: 'rotate(45deg)', marginLeft: '-3px' }} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Sidebar({ navigate }) {
  const role = localStorage.getItem('role');
  const navItems = role === 'seller'
    ? [
        { label: 'Dashboard', path: '/seller/dashboard', icon: '▦' },
        { label: 'My Products', path: '/seller/products', icon: '◫' },
        { label: 'Orders', path: '/orders', icon: '◨' },
        { label: 'Browse Catalog', path: '/products', icon: '🔍', active: true },
      ]
    : [
        { label: 'Dashboard', path: '/buyer/dashboard', icon: '▦' },
        { label: 'Products', path: '/products', icon: '◫', active: true },
        { label: 'Cart', path: '/cart', icon: '◨' },
      ];

  return (
    <aside style={{ width: '220px', flexShrink: 0, background: '#fff', borderRight: '1px solid #e8eaf0', display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', background: '#2563eb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>CoolCoolCool</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{role === 'seller' ? 'Seller workspace' : 'Buyer workspace'}</div>
          </div>
        </div>
      </div>
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <div style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.8px', padding: '0 8px', marginBottom: '8px' }}>NAVIGATION</div>
        {navItems.map(item => (
          <div key={item.label} onClick={() => navigate(item.path)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', cursor: 'pointer', background: item.active ? '#eff6ff' : 'transparent', color: item.active ? '#2563eb' : '#64748b', fontSize: '13px', fontWeight: item.active ? '600' : '500', marginBottom: '2px', transition: 'all 0.15s' }}
            onMouseEnter={e => { if (!item.active) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; } }}
            onMouseLeave={e => { if (!item.active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}
          >
            <span style={{ fontSize: '14px' }}>{item.icon}</span>{item.label}
          </div>
        ))}
      </nav>
      <div style={{ margin: '0 12px', padding: '14px', background: '#f0f4ff', borderRadius: '10px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>Need help with an order?</div>
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px', lineHeight: '1.5' }}>We respond within 1 business day.</div>
        <button style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: '600', cursor: 'pointer', padding: 0 }}>Contact support →</button>
      </div>
    </aside>
  );
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [selectedFamilies, setSelectedFamilies] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [onSpecialOnly, setOnSpecialOnly] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch { return []; }
  });

  const handleAddToCart = (product) => {
    const updatedCart = [...cart];
    const itemIndex = updatedCart.findIndex(item => item.productId === product.productId);
    if (itemIndex > -1) {
      updatedCart[itemIndex].qty += 1;
    } else {
      updatedCart.push({ ...product, qty: 1 });
    }
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCartPulse(true);
    setTimeout(() => setCartPulse(false), 400);
  };

  const handleNavigateToProduct = (product) => {
    navigate(`/products/${product.productId}`);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetch(`${API_BASE}/products/`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.status === 401) { navigate('/login'); throw new Error('Unauthorized'); }
        if (!res.ok) throw new Error('Failed to load products');
        return res.json();
      })
      .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [navigate]);

  const families = [...new Set(products.map(p => p.family).filter(Boolean))];
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];

  const filteredProducts = products.filter(p => {
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase()) && !p.brand?.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedFamilies.length && !selectedFamilies.includes(p.family)) return false;
    if (selectedBrand && p.brand !== selectedBrand) return false;
    if (onSpecialOnly && !p.onSpecial) return false;
    return true;
  });

  const specialProducts = filteredProducts.filter(p => p.onSpecial);
  const toggleFamily = fam => setSelectedFamilies(prev => prev.includes(fam) ? prev.filter(f => f !== fam) : [...prev, fam]);
  const resetFilters = () => { setSelectedFamilies([]); setSelectedBrand(''); setOnSpecialOnly(false); setSearch(''); };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Loading catalog...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ textAlign: 'center', maxWidth: '360px' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>◫</div>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Failed to load products</div>
        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Try again</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <Sidebar navigate={navigate} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* ── Top bar ── */}
        <header style={{ background: '#fff', borderBottom: '1px solid #e8eaf0', padding: '0 28px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>Products</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Explore catalog</div>
          </div>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: '480px', margin: '0 32px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><SearchIcon /></div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products, suppliers, SKUs..."
              style={{ width: '100%', padding: '9px 12px 9px 38px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', color: '#0f172a', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Cart button */}
            <button
              onClick={() => navigate('/cart')}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '8px 14px',
                background: cart.length ? '#eff6ff' : '#f8fafc',
                border: `1px solid ${cart.length ? '#bfdbfe' : '#e2e8f0'}`,
                borderRadius: '9px', fontSize: '13px', fontWeight: '600',
                color: cart.length ? '#2563eb' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s',
                transform: cartPulse ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              <CartIcon />
              Cart
              {cart.length > 0 && (
                <span style={{ background: '#2563eb', color: '#fff', borderRadius: '10px', fontSize: '11px', fontWeight: '700', padding: '1px 6px' }}>
                  {cart.length}
                </span>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
              title="Logout"
              style={{ width: '36px', height: '36px', background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
              onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </button>
          </div>
        </header>

        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

          {/* ── Filter sidebar ── */}
          <div style={{ width: '240px', flexShrink: 0, background: '#fff', borderRight: '1px solid #e8eaf0', padding: '20px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Filters</span>
              <button onClick={resetFilters} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', fontWeight: '500', cursor: 'pointer', padding: 0 }}>↺ Reset</button>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 20px' }}>Refine results across the full catalog.</p>

            {families.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.6px', marginBottom: '10px' }}>CATEGORY</div>
                {families.map(fam => (
                  <label key={fam} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                    <input type="checkbox" checked={selectedFamilies.includes(fam)} onChange={() => toggleFamily(fam)} style={{ accentColor: '#2563eb', width: '14px', height: '14px' }} />
                    {fam}
                  </label>
                ))}
              </div>
            )}

            {brands.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.6px', marginBottom: '10px' }}>SUPPLIER</div>
                <select
                  value={selectedBrand}
                  onChange={e => setSelectedBrand(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#374151', background: '#fff', cursor: 'pointer', outline: 'none' }}
                >
                  <option value="">All suppliers</option>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            )}

            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.6px', marginBottom: '10px' }}>SPECIALS</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                <input type="checkbox" checked={onSpecialOnly} onChange={e => setOnSpecialOnly(e.target.checked)} style={{ accentColor: '#2563eb', width: '14px', height: '14px' }} />
                On special only
              </label>
            </div>
          </div>

          {/* ── Main content ── */}
          <main style={{ flex: 1, padding: '28px', overflowY: 'auto', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Catalog</span>
                </div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Explore Products</h1>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Compare suppliers, check pricing, and add to cart.</p>
              </div>
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px' }}>
                {[{ mode: 'grid', icon: <GridIcon />, label: 'Grid' }, { mode: 'tree', icon: <TreeIcon />, label: 'Tree View' }].map(({ mode, icon, label }) => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', background: viewMode === mode ? '#fff' : 'transparent', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: viewMode === mode ? '#0f172a' : '#64748b', cursor: 'pointer', boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}
                  >{icon} {label}</button>
                ))}
              </div>
            </div>

            {viewMode === 'grid' ? (
              <>
                {/* On Special section */}
                {specialProducts.length > 0 && (
                  <section style={{ marginBottom: '36px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div>
                        <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: '0 0 3px' }}>On Special</h2>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Limited-time pricing from verified suppliers.</p>
                      </div>
                      <span style={{ background: '#fef3c7', color: '#d97706', fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                        {specialProducts.length} deals
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '16px' }}>
                      {specialProducts.map(p => (
                        <ProductCard
                          key={p.productId}
                          product={p}
                          onAdd={handleAddToCart}
                          onNavigate={handleNavigateToProduct}
                          inCart={cart.some(c => c.productId === p.productId)}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* All Products section */}
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                      <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: '0 0 3px' }}>All Products</h2>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Everything in your selected categories and suppliers.</p>
                    </div>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>Showing {filteredProducts.length} of {products.length}</span>
                  </div>
                  {filteredProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: '12px', border: '1px solid #e8eaf0' }}>
                      <div style={{ fontSize: '32px', marginBottom: '12px' }}>◫</div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>No products match your filters</div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Try widening your category selection or removing supplier constraints.</div>
                      <button onClick={resetFilters} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Reset filters</button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '16px' }}>
                      {filteredProducts.map(p => (
                        <ProductCard
                          key={p.productId}
                          product={p}
                          onAdd={handleAddToCart}
                          onNavigate={handleNavigateToProduct}
                          inCart={cart.some(c => c.productId === p.productId)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </>
            ) : (
              <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '14px', padding: '28px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Tree View</h2>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Products grouped by family. Lines connect items in the same product line.</p>
                </div>
                <TreeView
                  products={filteredProducts}
                  onNavigate={handleNavigateToProduct}
                  onAdd={handleAddToCart}
                  cart={cart}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}