import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [view, setView] = useState(localStorage.getItem('token') ? 'dashboard' : 'login');
  const [showProductForm, setShowProductForm] = useState(false);

  // --- FORM STATES ---
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [regData, setRegData] = useState({
    name: '', email: '', password: '', street: '', city: '', 
    postalCode: '', countryCode: '', companyId: '', legalEntityId: '', 
    taxSchemeId: '', contactName: '', contactPhone: '', contactEmail: ''
  });

  // Updated productData to include 'family'
  const [productData, setProductData] = useState({
    productId: '', sellerId: '', name: '', description: '',
    cost: 0, brand: '', family: '', releaseDate: '',
    onSpecial: false, discount: 0, productTier: 1, nextProduct: ''
  });

  const handleLogout = useCallback(() => {
    localStorage.clear();
    setView('login');
  }, []);

  // 1. Wrap fetchProducts in useCallback to fix the Build Error
  const fetchProducts = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setView('login');
      return;
    }

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
          throw new Error("Session expired. Please login again.");
        }
        if (!res.ok) throw new Error("Could not load products.");
        return res.json();
      })
      .then(data => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [handleLogout]); // Dependencies for fetchProducts

  // 2. Add fetchProducts to the dependency array
  useEffect(() => {
    if (view === 'dashboard') {
      fetchProducts();
    }
  }, [view, fetchProducts]);

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

  const handleRegisterSeller = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/sellers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData)
      });
      const data = await res.json();
      if (res.status === 409) throw new Error('Email already exists!');
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('sellerId', data.sellerId);
      alert("Registration Successful!");
      setView('dashboard');
    } catch (err) { alert(err.message); }
  };

  // --- PRODUCT HANDLER ---
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const storedSellerId = localStorage.getItem('sellerId');

    try {
      // Validation check matching your backend requirements
      if (!productData.productId || !productData.name || !productData.description || 
          !productData.brand || !productData.family || !productData.releaseDate) {
        throw new Error("Missing required fields: ID, Name, Description, Brand, Family, or Date.");
      }

      const res = await fetch('/products/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...productData,
          sellerId: storedSellerId,
          cost: parseFloat(productData.cost || 0),
          discount: parseFloat(productData.discount || 0),
          productTier: parseInt(productData.productTier || 1),
          releaseDate: new Date(productData.releaseDate).toISOString()
        })
      });
      
      if (res.status === 403) throw new Error("Unauthorized. Please login again.");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create product');

      alert('Product Added!');
      setShowProductForm(false);
      fetchProducts();
    } catch (err) { alert(err.message); }
  };

  if (view === 'login') {
    return (
      <div className="auth-container">
        <form className="auth-card" onSubmit={handleLogin}>
          <h2>Welcome Back</h2>
          <input type="email" placeholder="Email" onChange={e => setLoginData({...loginData, email: e.target.value})} required />
          <input type="password" placeholder="Password" onChange={e => setLoginData({...loginData, password: e.target.value})} required />
          <button type="submit" className="primary-btn">Login</button>
          <p>Don't have an account? <span onClick={() => setView('register')}>Register here</span></p>
        </form>
      </div>
    );
  }

  if (view === 'register') {
    return (
      <div className="auth-container">
        <form className="auth-card wide-card" onSubmit={handleRegisterSeller}>
          <h2>Seller Registration</h2>
          <div className="form-grid">
            {Object.keys(regData).map(key => (
              <input 
                key={key} 
                name={key} 
                type={key === 'password' ? 'password' : 'text'}
                placeholder={key.charAt(0).toUpperCase() + key.slice(1)} 
                onChange={e => setRegData({...regData, [e.target.name]: e.target.value})} 
                required 
              />
            ))}
          </div>
          <button type="submit" className="primary-btn">Create Account</button>
          <p>Already registered? <span onClick={() => setView('login')}>Login here</span></p>
        </form>
      </div>
    );
  }

  return (
    <div className="store-container">
      <header className="store-header">
        <h1>H14B CoolCoolCool</h1>
        <div className="header-btns">
          <button className="add-btn" onClick={() => setShowProductForm(!showProductForm)}>
            {showProductForm ? 'Close Form' : '+ Add Product'}
          </button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {loading && <div className="loading-state">Updating inventory...</div>}
      {error && <div className="error-banner">Error: {error}</div>}

      {showProductForm && (
        <form className="product-form-overlay" onSubmit={handleCreateProduct}>
          <h3>List New Item</h3>
          <div className="form-grid">
            <input name="productId" placeholder="Product ID" onChange={e => setProductData({...productData, productId: e.target.value})} required />
            <input name="name" placeholder="Name" onChange={e => setProductData({...productData, name: e.target.value})} required />
            <input name="brand" placeholder="Brand" onChange={e => setProductData({...productData, brand: e.target.value})} required />
            
            {/* Added missing Family field */}
            <input name="family" placeholder="Family" onChange={e => setProductData({...productData, family: e.target.value})} required />
            
            <input name="cost" type="number" step="0.01" placeholder="Cost" onChange={e => setProductData({...productData, cost: e.target.value})} required />
            <input name="releaseDate" type="date" onChange={e => setProductData({...productData, releaseDate: e.target.value})} required />
          </div>
          <textarea placeholder="Description" onChange={e => setProductData({...productData, description: e.target.value})} required />
          <button type="submit" className="primary-btn">Publish</button>
        </form>
      )}

      <div className="product-grid">
        {!loading && products.length === 0 && <p>No products found.</p>}
        {products.map(p => (
          <div key={p.productId || p.id} className="product-card">
            <h3>{p.name}</h3>
            <p className="price">${p.cost ?? p.price ?? 0}</p>
            <p>{p.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;