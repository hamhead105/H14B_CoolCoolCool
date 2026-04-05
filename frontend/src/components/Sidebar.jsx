// components/Sidebar.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Logo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
);

const icons = {
  dashboard: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  ),
  products: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  ),
  cart: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  orders: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  account: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

const BUYER_NAV = [
  { label: 'Dashboard', path: '/buyer/dashboard', icon: 'dashboard' },
  { label: 'Products', path: '/products', icon: 'products' },
  { label: 'Cart', path: '/cart', icon: 'cart' },
];

const SELLER_NAV = [
  { label: 'Dashboard', path: '/seller/dashboard', icon: 'dashboard' },
  { label: 'My Products', path: '/seller/products', icon: 'products' },
  { label: 'Orders', path: '/orders', icon: 'orders' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');
  const navItems = role === 'seller' ? SELLER_NAV : BUYER_NAV;

  return (
    <aside style={{
      width: '220px', flexShrink: 0, background: '#fff',
      borderRight: '1px solid #e8eaf0', display: 'flex',
      flexDirection: 'column', padding: '24px 0', minHeight: '100vh',
    }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', background: '#2563eb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Logo />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>CoolCoolCool</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{role === 'seller' ? 'Seller workspace' : 'Buyer workspace'}</div>
          </div>
        </div>
      </div>

      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <div style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.8px', padding: '0 8px', marginBottom: '8px' }}>NAVIGATION</div>
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <div key={item.label} onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 10px', borderRadius: '8px', cursor: 'pointer',
                background: active ? '#eff6ff' : 'transparent',
                color: active ? '#2563eb' : '#64748b',
                fontSize: '13px', fontWeight: active ? '600' : '500',
                marginBottom: '2px', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}}
            >
              {icons[item.icon]}
              {item.label}
            </div>
          );
        })}
      </nav>

      <div style={{ margin: '0 12px 16px', padding: '14px', background: '#f0f4ff', borderRadius: '10px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>Need help?</div>
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px', lineHeight: '1.5' }}>We respond within 1 business day.</div>
        <button style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: '600', cursor: 'pointer', padding: 0 }}>Contact support →</button>
      </div>

      <div style={{ padding: '0 12px' }}>
        <button onClick={() => { localStorage.clear(); navigate('/login'); }}
          style={{
            width: '100%', padding: '9px', background: 'transparent', border: '1px solid #e2e8f0',
            borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: '#64748b', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.color = '#dc2626'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}