import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const API_BASE = 'https://h14-b-cool-cool-cool.vercel.app';

function StatCard({ label, value, sub, color = '#2563eb', icon }) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e8eaf0', padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>{label}</div>
        <div style={{ width: '34px', height: '34px', background: `${color}18`, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{icon}</div>
      </div>
      <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: '#94a3b8' }}>{sub}</div>}
    </div>
  );
}

export default function SellerDashboard() {
  const navigate = useNavigate();
  const sellerId = localStorage.getItem('sellerId');
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !sellerId) { navigate('/login'); return; }
    
    Promise.all([
      fetch(`${API_BASE}/sellers/${sellerId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_BASE}/products/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_BASE}/orders/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()), // Add this
    ]).then(([s, p, o]) => {
      setSeller(s);
      setProducts(Array.isArray(p) ? p : []);
      
      const myOrders = Array.isArray(o) ? o.filter(order => {
        const items = order.inputData?.items || [];
        return items.some(item => item.sellerId == sellerId);
      }) : [];
      setOrders(myOrders);
      
    }).catch(() => {}).finally(() => setLoading(false));
  }, [sellerId, navigate]);

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Loading dashboard…</div>
        </div>
      </div>
    </div>
  );

  const myProducts = products.filter(p => p.sellerId == sellerId);
  const onSpecial = myProducts.filter(p => p.onSpecial);
  const families = [...new Set(myProducts.map(p => p.family).filter(Boolean))];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header style={{ background: '#fff', borderBottom: '1px solid #e8eaf0', padding: '0 28px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>Seller Dashboard</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Welcome back{seller?.businessName ? `, ${seller.businessName}` : ''}</div>
          </div>
          <button onClick={() => navigate('/seller/products')}
            style={{ padding: '8px 16px', background: '#2563eb', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
            onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
          >+ New Product</button>
        </header>

        <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '28px' }}>
            <StatCard label="Total Products" value={myProducts.length} sub="Listed in catalog" color="#2563eb" icon="📦" />
            <StatCard label="Active Orders" value={orders.length} sub="Incoming sales" color="#10b981" icon="💰" />
            <StatCard label="On Special" value={onSpecial.length} sub="Active discounts" color="#f59e0b" icon="🏷️" />
            <StatCard label="Categories" value={families.length} sub="Product families" color="#10b981" icon="🗂️" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
            {/* Quick actions */}
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8eaf0', padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 18px' }}>Quick actions</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { icon: '➕', label: 'Add Product', desc: 'List a new SKU to your catalog', action: () => navigate('/seller/products'), primary: true },
                  { icon: '📋', label: 'Manage Products', desc: 'Edit prices, stock & specials', action: () => navigate('/seller/products') },
                  { icon: '📦', label: 'View Orders', desc: 'Incoming buyer orders', action: () => navigate('/orders') },
                  { icon: '🔍', label: 'Browse Catalog', desc: 'See what buyers see', action: () => navigate('/products') },
                ].map(a => (
                  <button key={a.label} onClick={a.action}
                    style={{
                      background: a.primary ? '#eff6ff' : '#f8fafc',
                      border: `1px solid ${a.primary ? '#bfdbfe' : '#e8eaf0'}`,
                      borderRadius: '12px', padding: '18px', textAlign: 'left', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>{a.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{a.label}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{a.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Profile */}
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8eaf0', padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px' }}>Seller profile</h2>
              {seller ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Business', value: seller.name },
                    { label: 'Email', value: seller.email },
                    { label: 'Phone', value: seller.phone || '—' },
                    { label: 'Address', value: seller.address || '—' },
                  ].map(row => (
                    <div key={row.label}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '2px' }}>{row.label}</span>
                      <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '500' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>Unable to load profile.</div>
              )}
            </div>
          </div>

          {/* Recent products table */}
          {myProducts.length > 0 && (
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8eaf0', padding: '24px', marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Your products</h2>
                <button onClick={() => navigate('/seller/products')}
                  style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >View all →</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                      {['Name', 'Brand', 'Family', 'Price', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myProducts.slice(0, 6).map(p => (
                      <tr key={p.productId} style={{ borderBottom: '1px solid #f8fafc' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px 12px', fontWeight: '600', color: '#0f172a' }}>{p.name}</td>
                        <td style={{ padding: '10px 12px', color: '#64748b' }}>{p.brand || '—'}</td>
                        <td style={{ padding: '10px 12px', color: '#64748b' }}>{p.family || '—'}</td>
                        <td style={{ padding: '10px 12px', fontWeight: '600', color: '#0f172a' }}>${Number(p.cost).toFixed(2)}</td>
                        <td style={{ padding: '10px 12px' }}>
                          {p.onSpecial
                            ? <span style={{ background: '#fef3c7', color: '#d97706', fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px' }}>On Special</span>
                            : <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px' }}>Active</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}