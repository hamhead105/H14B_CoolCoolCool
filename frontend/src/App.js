import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeForm, setActiveForm] = useState(null); // 'register' or 'product'

  // --- FORM STATES ---
  const [regData, setRegData] = useState({
    name: '', email: '', password: '',
    street: '', city: '', postalCode: '', countryCode: '',
    companyId: '', legalEntityId: '', taxSchemeId: '',
    contactName: '', contactPhone: '', contactEmail: ''
  });

  const [productData, setProductData] = useState({
    productId: '', seller: '', name: '', description: '',
    cost: 0, brand: '', family: '', releaseDate: '',
    onSpecial: false, discount: 0, productTier: 1, nextProduct: ''
  });

  // --- API CALLS ---
  const fetchProducts = () => {
    fetch('/products/')
      .then(res => res.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => setError(err.message));
  };

  useEffect(() => { fetchProducts(); }, []);

  // FR-07/08: Register Seller
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
      alert(`Success! Seller ID ${data.sellerId} logged in.`);
      setActiveForm(null);
      window.location.reload();
    } catch (err) { alert(err.message); }
  };

  // FR-04: Create Product Listing
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/products/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...productData,
          cost: parseFloat(productData.cost),
          discount: parseFloat(productData.discount),
          productTier: parseInt(productData.productTier),
          onSpecial: Boolean(productData.onSpecial)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create listing');

      alert('Product Added!');
      setActiveForm(null);
      fetchProducts();
    } catch (err) { alert(err.message); }
  };

  // --- HELPERS ---
  const updateRegField = (e) => setRegData({ ...regData, [e.target.name]: e.target.value });
  
  const updateProductField = (e) => {
    const { name, value, type, checked } = e.target;
    setProductData({ ...productData, [name]: type === 'checkbox' ? checked : value });
  };

  if (loading) return <div className="loader">Loading...</div>;

  return (
    <div className="store-container">
      <h1>H14B CoolCoolCool</h1>

      <div className="admin-controls">
        <button onClick={() => setActiveForm(activeForm === 'register' ? null : 'register')}>
          {activeForm === 'register' ? 'Cancel' : 'Register Seller'}
        </button>
        <button onClick={() => setActiveForm(activeForm === 'product' ? null : 'product')}>
          {activeForm === 'product' ? 'Cancel' : 'Add New Product'}
        </button>
      </div>

      {/* SELLER REGISTRATION FORM (FR-07/08) */}
      {activeForm === 'register' && (
        <form className="listing-form wide-form" onSubmit={handleRegisterSeller}>
          <h2>Seller Registration</h2>
          <div className="form-grid">
            <input name="name" placeholder="Store Name" onChange={updateRegField} required />
            <input name="email" type="email" placeholder="Email" onChange={updateRegField} required />
            <input name="password" type="password" placeholder="Password" onChange={updateRegField} required />
            <input name="street" placeholder="Street" onChange={updateRegField} required />
            <input name="city" placeholder="City" onChange={updateRegField} required />
            <input name="postalCode" placeholder="Postal Code" onChange={updateRegField} required />
            <input name="countryCode" placeholder="Country Code" onChange={updateRegField} required />
            <input name="companyId" placeholder="Company ID" onChange={updateRegField} required />
            <input name="legalEntityId" placeholder="Legal ID" onChange={updateRegField} required />
            <input name="taxSchemeId" placeholder="Tax ID" onChange={updateRegField} required />
            <input name="contactName" placeholder="Contact Name" onChange={updateRegField} required />
            <input name="contactPhone" placeholder="Contact Phone" onChange={updateRegField} required />
            <input name="contactEmail" placeholder="Contact Email" onChange={updateRegField} required />
          </div>
          <button type="submit" className="submit-btn">Register Account</button>
        </form>
      )}

      {/* PRODUCT LISTING FORM (FR-04) */}
      {activeForm === 'product' && (
        <form className="listing-form" onSubmit={handleCreateProduct}>
          <h2>Create New Product Listing</h2>
          <div className="form-grid">
            <input name="productId" placeholder="Product ID (String)" onChange={updateProductField} required />
            <input name="seller" placeholder="Seller ID (String)" onChange={updateProductField} required />
            <input name="name" placeholder="Product Name" onChange={updateProductField} required />
            <input name="brand" placeholder="Brand" onChange={updateProductField} required />
            <input name="cost" type="number" step="0.01" placeholder="Cost" onChange={updateProductField} required />
            <input name="releaseDate" type="date" onChange={updateProductField} required />
            <input name="productTier" type="number" placeholder="Tier (1-3)" onChange={updateProductField} />
            <input name="family" placeholder="Family" onChange={updateProductField} />
            <input name="nextProduct" placeholder="Next Product ID" onChange={updateProductField} />
            <label>
              Special: <input name="onSpecial" type="checkbox" onChange={updateProductField} />
            </label>
            <input name="discount" type="number" step="0.1" placeholder="Discount" onChange={updateProductField} />
          </div>
          <textarea name="description" placeholder="Description" onChange={updateProductField} required />
          <button type="submit" className="submit-btn">Publish Product</button>
        </form>
      )}

      {error && <div className="error">Error: {error}</div>}

      <div className="product-grid">
        {products.map((p) => (
          <div key={p.productId || p.id} className="product-card">
            <h3>{p.name}</h3>
            <p className="price">${p.cost || p.price}</p>
            <p className="description">{p.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;