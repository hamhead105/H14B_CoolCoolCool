import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';

const API_BASE = 'https://h14-b-cool-cool-cool.vercel.app';

export default function SpecialsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFamilies, setSelectedFamilies] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    fetch(`${API_BASE}/products/?onSpecial=true`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [navigate]);

  // Filter and sort products
  const filteredProducts = products
    .filter(p => {
      if (selectedFamilies.length > 0 && !selectedFamilies.includes(p.family)) return false;
      if (selectedBrand && p.brand !== selectedBrand) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.cost - b.cost;
        case 'price-high': return b.cost - a.cost;
        case 'discount': return (b.discount || 0) - (a.discount || 0);
        default: return a.name.localeCompare(b.name);
      }
    });

  // Get unique families and brands for filters
  const families = [...new Set(products.map(p => p.family))].sort();
  const brands = [...new Set(products.map(p => p.brand))].sort();

  const resetFilters = () => {
    setSelectedFamilies([]);
    setSelectedBrand('');
    setSearch('');
    setSortBy('name');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#050d1a' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>Loading specials...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a', fontFamily: "'Geist', sans-serif", overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0 }}>

        {/* Header */}
        <header style={{ height: '60px', padding: '0 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(5,13,26,0.7)', borderBottom: '1px solid rgba(255,255,255,0.07)', zIndex: 10 }}>
          <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: '700', letterSpacing: '1px' }}>
            SPECIALS
          </div>
          <div style={{ fontSize: '18px', color: '#fbbf24', fontWeight: '800' }}>
            ⚡ FLASH DEALS
          </div>
        </header>

        <main style={{ flex: 1, padding: '36px', overflowY: 'auto' }}>

          {/* Title & Stats */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#fff', margin: '0 0 8px' }}>
              Special Offers
            </h1>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
              Limited-time deals on premium products • {filteredProducts.length} items available
            </div>
          </div>

          {/* Filters */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', margin: 0 }}>FILTER SPECIALS</h3>
              {(selectedFamilies.length > 0 || selectedBrand || search) && (
                <button
                  onClick={resetFilters}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '16px', alignItems: 'end' }}>
              {/* Search */}
              <div>
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Search Products</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search specials..."
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
              </div>

              {/* Family Filter */}
              <div>
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Family</label>
                <select
                  value={selectedFamilies.length === 1 ? selectedFamilies[0] : ''}
                  onChange={(e) => setSelectedFamilies(e.target.value ? [e.target.value] : [])}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                >
                  <option value="">All Families</option>
                  {families.map(family => (
                    <option key={family} value={family}>{family}</option>
                  ))}
                </select>
              </div>

              {/* Brand Filter */}
              <div>
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Brand</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                >
                  <option value="">All Brands</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                >
                  <option value="name">Name</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="discount">Discount Amount</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No specials found</div>
              <div style={{ fontSize: '14px' }}>Try adjusting your filters or check back later for new deals</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.productId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => navigate(`/products/${product.productId}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(251, 191, 36, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Special Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '10px',
                    fontWeight: '800',
                    letterSpacing: '1px',
                    zIndex: 10
                  }}>
                    {product.discount > 0 ? `${product.discount}% OFF` : 'SPECIAL'}
                  </div>

                  {/* Product Image Placeholder */}
                  <div style={{
                    height: '200px',
                    background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.1))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <div style={{ fontSize: '48px', opacity: 0.6 }}>📦</div>
                  </div>

                  {/* Product Info */}
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', margin: 0, lineHeight: '1.3' }}>
                        {product.name}
                      </h3>
                    </div>

                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '12px' }}>
                      {product.brand} • {product.family}
                    </div>

                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: '1.4', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {product.description}
                    </p>

                    {/* Pricing */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {product.discount > 0 ? (
                        <>
                          <span style={{ fontSize: '18px', fontWeight: '800', color: '#fbbf24' }}>
                            ${(product.cost * (1 - product.discount / 100)).toFixed(2)}
                          </span>
                          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>
                            ${product.cost.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                          ${product.cost.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}