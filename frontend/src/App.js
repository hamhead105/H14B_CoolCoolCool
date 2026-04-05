import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// ─── Product Detail Page ──────────────────────────────────────────────────────
function ProductDetail({ productId, onBack }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { onBack(); return; }

    fetch(`/products/${productId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then(data => { setProduct(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [productId, onBack]);

  if (loading) return (
    <div className="detail-state">
      <div className="detail-spinner" />
      <p>Loading product…</p>
    </div>
  );

  if (error) return (
    <div className="detail-state">
      <p className="detail-error">{error}</p>
      <button className="back-btn" onClick={onBack}>← Back</button>
    </div>
  );

  if (!product) return null;

  const finalPrice = product.onSpecial
    ? (product.cost * (1 - product.discount)).toFixed(2)
    : Number(product.cost).toFixed(2);

  const releaseDate = product.releaseDate
    ? new Date(product.releaseDate).toLocaleDateString('en-AU', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : '—';

  return (
    <div className="detail-page">
      <div className="detail-topbar">
        <button className="back-btn" onClick={onBack}>← Back</button>
      </div>

      <div className="detail-layout">
        {/* Left: identity */}
        <div className="detail-identity">
          <div className="detail-badges">
            {product.family && <span className="badge badge-family">{product.family}</span>}
            {product.brand  && <span className="badge badge-brand">{product.brand}</span>}
            {product.onSpecial && <span className="badge badge-sale">SALE</span>}
          </div>

          <h1 className="detail-name">{product.name}</h1>
          <p className="detail-id">ID: {product.productId}</p>

          <div className="detail-price-block">
            {product.onSpecial ? (
              <>
                <span className="detail-price-original">${Number(product.cost).toFixed(2)}</span>
                <span className="detail-price-final">${finalPrice}</span>
                <span className="detail-discount-label">
                  {Math.round(product.discount * 100)}% off
                </span>
              </>
            ) : (
              <span className="detail-price-final">${finalPrice}</span>
            )}
          </div>

          <p className="detail-description">{product.description || 'No description provided.'}</p>
        </div>

        {/* Right: metadata */}
        <div className="detail-meta-panel">
          <h2 className="detail-meta-heading">Details</h2>
          <dl className="detail-meta-list">
            <div className="meta-row">
              <dt>Tier</dt>
              <dd>
                <span className="tier-pip">{product.productTier || '—'}</span>
              </dd>
            </div>
            <div className="meta-row">
              <dt>Brand</dt>
              <dd>{product.brand || '—'}</dd>
            </div>
            <div className="meta-row">
              <dt>Family</dt>
              <dd>{product.family || '—'}</dd>
            </div>
            <div className="meta-row">
              <dt>Released</dt>
              <dd>{releaseDate}</dd>
            </div>
            <div className="meta-row">
              <dt>Seller ID</dt>
              <dd>{product.sellerId || '—'}</dd>
            </div>
            {product.nextProduct && (
              <div className="meta-row">
                <dt>Next Product</dt>
                <dd>{product.nextProduct}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // High-level navigation: 'login', 'register', 'dashboard', or 'product'
  const [view, setView] = useState(() => {
    if (!localStorage.getItem('token')) return 'login';
    // Restore deep-link on page load
    const match = window.location.pathname.match(/^\/products\/(.+)$/);
    if (match) return 'product';
    return 'dashboard';
  });

  // Track which product is open
  const [activeProductId, setActiveProductId] = useState(() => {
    const match = window.location.pathname.match(/^\/products\/(.+)$/);
    return match ? match[1] : null;
  });

  const [viewMode, setViewMode] = useState('tree');
  const [showProductForm, setShowProductForm] = useState(false);

  // --- FORM STATES ---
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [regData, setRegData] = useState({
    name: '', email: '', password: '', street: '', city: '',
    postalCode: '', countryCode: '', companyId: '', legalEntityId: '',
    taxSchemeId: '', contactName: '', contactPhone: '', contactEmail: ''
  });
  const [productData, setProductData] = useState({
    productId: '', sellerId: '', name: '', description: '',
    cost: 0, brand: '', family: '', releaseDate: '',
    onSpecial: false, discount: 0, productTier: 1, nextProduct: ''
  });

  const handleLogout = useCallback(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
    setView('login');
  }, []);

  const fetchProducts = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) { setView('login'); return; }

    setLoading(true);
    fetch('/products/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          handleLogout();
          throw new Error('Session expired.');
        }
        return res.json();
      })
      .then(data => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [handleLogout]);

  useEffect(() => {
    if (view === 'dashboard') fetchProducts();
  }, [view, fetchProducts]);

  // Sync browser back/forward buttons
  useEffect(() => {
    const onPop = () => {
      const match = window.location.pathname.match(/^\/products\/(.+)$/);
      if (match) {
        setActiveProductId(match[1]);
        setView('product');
      } else {
        setActiveProductId(null);
        setView(localStorage.getItem('token') ? 'dashboard' : 'login');
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // --- NAVIGATE TO PRODUCT ---
  const openProduct = useCallback((productId) => {
    window.history.pushState({}, '', `/products/${productId}`);
    setActiveProductId(productId);
    setView('product');
  }, []);

  const backToDashboard = useCallback(() => {
    window.history.pushState({}, '', '/');
    setActiveProductId(null);
    setView('dashboard');
  }, []);

  // --- AUTH HANDLERS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/sellers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('sellerId', data.sellerId);
      setView('dashboard');
    } catch (err) { alert(err.message); }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const storedSellerId = localStorage.getItem('sellerId');
    try {
      const res = await fetch('/products/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...productData,
          sellerId: storedSellerId,
          cost: parseFloat(productData.cost || 0),
          discount: parseFloat(productData.discount || 0),
          productTier: parseInt(productData.productTier || 1),
          releaseDate: new Date(productData.releaseDate).toISOString()
        })
      });
      if (!res.ok) throw new Error('Failed');
      setShowProductForm(false);
      fetchProducts();
    } catch (err) { alert(err.message); }
  };

  // --- PRE-PROCESS DATA FOR TREE ---
  const families = products.reduce((acc, p) => {
    const fam = p.family || 'Uncategorized';
    if (!acc[fam]) acc[fam] = [];
    acc[fam].push(p);
    return acc;
  }, {});

  Object.keys(families).forEach(fam => {
    families[fam].sort((a, b) => a.productTier - b.productTier);
  });

  // ── RENDER ──────────────────────────────────────────────────────────────────

  if (view === 'login') return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleLogin}>
        <h2>HB14 Login</h2>
        <input type="email" placeholder="Email" onChange={e => setLoginData({...loginData, email: e.target.value})} required />
        <input type="password" placeholder="Password" onChange={e => setLoginData({...loginData, password: e.target.value})} required />
        <button type="submit" className="primary-btn">Login</button>
        <p>No account? <span onClick={() => setView('register')}>Register here</span></p>
      </form>
    </div>
  );

  if (view === 'product') return (
    <div className="store-container">
      <header className="store-header">
        <div className="header-left">
          <h1>HB14_CoolCoolCool</h1>
        </div>
        <div className="header-btns">
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <ProductDetail productId={activeProductId} onBack={backToDashboard} />
    </div>
  );

  // DASHBOARD VIEW
  return (
    <div className="store-container">
      <header className="store-header">
        <div className="header-left">
          <h1>HB14_CoolCoolCool</h1>
          <div className="view-toggle">
            <button className={viewMode === 'tree' ? 'active' : ''} onClick={() => setViewMode('tree')}>Tree View</button>
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>List View</button>
          </div>
        </div>
        <div className="header-btns">
          <button className="add-btn" onClick={() => setShowProductForm(!showProductForm)}>+ Add Product</button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {showProductForm && (
        <form className="product-form-overlay" onSubmit={handleCreateProduct}>
          <h3>Add New Product</h3>
          <div className="form-grid">
            <input name="productId" placeholder="Product ID" onChange={e => setProductData({...productData, productId: e.target.value})} required />
            <input name="name" placeholder="Name" onChange={e => setProductData({...productData, name: e.target.value})} required />
            <input name="brand" placeholder="Brand" onChange={e => setProductData({...productData, brand: e.target.value})} required />
            <input name="family" placeholder="Family" onChange={e => setProductData({...productData, family: e.target.value})} required />
            <input name="cost" type="number" step="0.01" placeholder="Cost" onChange={e => setProductData({...productData, cost: e.target.value})} required />
            <input name="productTier" type="number" placeholder="Tier" onChange={e => setProductData({...productData, productTier: e.target.value})} required />
            <input name="releaseDate" type="date" onChange={e => setProductData({...productData, releaseDate: e.target.value})} required />
          </div>
          <textarea placeholder="Description" onChange={e => setProductData({...productData, description: e.target.value})} required />
          <button type="submit" className="primary-btn">Publish</button>
        </form>
      )}

      {viewMode === 'tree' ? (
        <div className="tree-viewport">
          <div className="tree-container">
            {Object.keys(families).map((familyName) => (
              <div key={familyName} className="family-row">
                <div className="family-label">{familyName}</div>
                <div className="nodes-container">
                  {families[familyName].map((p, pIndex) => {
                    const finalPrice = p.onSpecial ? (p.cost * (1 - p.discount)).toFixed(2) : p.cost;
                    return (
                      <React.Fragment key={p.productId}>
                        <div
                          className="tree-node"
                          style={{ gridColumn: p.productTier }}
                          onClick={() => openProduct(p.productId)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => e.key === 'Enter' && openProduct(p.productId)}
                          aria-label={`View details for ${p.name}`}
                        >
                          <div className="node-box" title={p.description}>
                            {p.onSpecial && <div className="popular-sash">SALE</div>}
                            <div className="node-main-content">
                              <div className="node-footer">
                                <div className="node-name">{p.name}</div>
                              </div>
                            </div>
                            <div className="node-price-display">
                              <footer className="amount">${finalPrice}</footer>
                            </div>
                          </div>
                        </div>
                        {pIndex < families[familyName].length - 1 && (
                          <div className="tree-line" style={{ gridColumn: p.productTier }}></div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="product-grid">
          {products.map(p => (
            <div
              key={p.productId}
              className="product-card"
              onClick={() => openProduct(p.productId)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && openProduct(p.productId)}
              aria-label={`View details for ${p.name}`}
            >
              <h3>{p.name}</h3>
              <p>${p.cost}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;