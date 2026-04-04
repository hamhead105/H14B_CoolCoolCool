import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  
  // NAVIGATION STATE: 'login', 'register', or 'dashboard'
  const [view, setView] = useState(localStorage.getItem('token') ? 'dashboard' : 'login');
  const [showProductForm, setShowProductForm] = useState(false);

  // --- FORM STATES ---
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [regData, setRegData] = useState({
    name: '', email: '', password: '', street: '', city: '', 
    postalCode: '', countryCode: '', companyId: '', legalEntityId: '', 
    taxSchemeId: '', contactName: '', contactPhone: '', contactEmail: ''
  });
  const [productData, setProductData] = useState({
    productId: '', seller: '', name: '', description: '',
    cost: 0, brand: '', family: '', releaseDate: '',
    onSpecial: false, discount: 0, productTier: 1, nextProduct: ''
  });

  useEffect(() => {
    if (view === 'dashboard') fetchProducts();
  }, [view]);

  const fetchProducts = () => {
    fetch('/products/')
      .then(res => res.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => setError(err.message));
  };

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

  const handleLogout = () => {
    localStorage.clear();
    setView('login');
  };

  // --- PRODUCT HANDLER ---
const handleCreateProduct = async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');
  const storedSellerId = localStorage.getItem('sellerId'); // Get the ID from storage

  try {
    const res = await fetch('/products/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...productData,
        sellerId: storedSellerId, // Ensure the backend gets the ID of the logged-in user
        cost: parseFloat(productData.cost),
        discount: parseFloat(productData.discount || 0),
        productTier: parseInt(productData.productTier || 1),
      })
    });
    
    if (res.status === 403) throw new Error("Session expired or unauthorized. Please login again.");
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to create product');
    }

    alert('Product Added!');
    setShowProductForm(false);
    fetchProducts();
  } catch (err) { alert(err.message); }
};

  // --- UI RENDERING ---
  
  // 1. LOGIN VIEW
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

  // 2. REGISTER VIEW
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

  // 3. DASHBOARD VIEW (Logged In)
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

      {showProductForm && (
        <form className="product-form-overlay" onSubmit={handleCreateProduct}>
          <h3>List New Item</h3>
          <div className="form-grid">
            <input name="productId" placeholder="Product ID" onChange={e => setProductData({...productData, productId: e.target.value})} required />
            <input name="seller" placeholder="Seller ID" onChange={e => setProductData({...productData, seller: e.target.value})} required />
            <input name="name" placeholder="Name" onChange={e => setProductData({...productData, name: e.target.value})} required />
            <input name="cost" type="number" placeholder="Cost" onChange={e => setProductData({...productData, cost: e.target.value})} required />
            <input name="brand" placeholder="Brand" onChange={e => setProductData({...productData, brand: e.target.value})} required />
            <input name="releaseDate" type="date" onChange={e => setProductData({...productData, releaseDate: e.target.value})} required />
          </div>
          <textarea placeholder="Description" onChange={e => setProductData({...productData, description: e.target.value})} required />
          <button type="submit" className="primary-btn">Publish</button>
        </form>
      )}

      <div className="product-grid">
        {products.map(p => (
          <div key={p.productId || p.id} className="product-card">
            <h3>{p.name}</h3>
            <p className="price">${p.cost || p.price}</p>
            <p>{p.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;