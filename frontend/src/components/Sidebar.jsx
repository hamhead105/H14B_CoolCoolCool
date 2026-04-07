import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Logo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
);

const icons = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  products: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  ),
  specials: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  cart: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1.5"/><circle cx="20" cy="21" r="1.5"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  orders: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
};

const BUYER_NAV = [
  { label: 'Dashboard', path: '/buyer/dashboard', icon: 'dashboard' },
  { label: 'Products', path: '/products', icon: 'products' },
  { label: 'Specials', path: '/specials', icon: 'specials' },
  { label: 'Cart', path: '/cart', icon: 'cart' },
  { label: 'My Orders', path: '/buyer/orders', icon: 'orders' },
];

const SELLER_NAV = [
  { label: 'Dashboard', path: '/seller/dashboard', icon: 'dashboard' },
  { label: 'My Products', path: '/seller/products', icon: 'products' },
  { label: 'Specials', path: '/specials', icon: 'specials' },
  { label: 'Orders', path: '/orders', icon: 'orders' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');
  const navItems = role === 'seller' ? SELLER_NAV : BUYER_NAV;

  return (
    <aside style={{
      width: '260px', // Slightly wider for a premium feel
      flexShrink: 0, 
      background: 'rgba(3, 8, 18, 0.4)', // Deep dark transparent base
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', 
      padding: '32px 0 24px', minHeight: '100vh',
      position: 'relative', zIndex: 50,
      fontFamily: "'Geist', 'Segoe UI', sans-serif"
    }}>
      
      {/* ── Brand / Logo Area ── */}
      <div style={{ padding: '0 24px 32px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <div style={{ 
            width: '38px', height: '38px', 
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)', 
            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(37,99,235,0.4)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <Logo />
          </div>
          <div>
            <div style={{ 
              fontSize: '15px', fontWeight: '800', color: '#fff', 
              fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.3px' 
            }}>CoolCoolCool</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>
              {role === 'seller' ? 'Seller Workspace' : 'Buyer Workspace'}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ padding: '24px 16px', flex: 1 }}>
        <div style={{ 
          fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.25)', 
          letterSpacing: '1.5px', padding: '0 12px', marginBottom: '16px', textTransform: 'uppercase' 
        }}>
          Navigation
        </div>
        
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <motion.div 
              key={item.label} 
              onClick={() => navigate(item.path)}
              initial={false}
              animate={{
                background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0)',
                color: active ? '#fff' : 'rgba(255,255,255,0.4)'
              }}
              whileHover={{
                background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                x: active ? 0 : 4
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
                fontSize: '13px', fontWeight: active ? '600' : '500',
                marginBottom: '6px', position: 'relative', overflow: 'hidden',
                transition: 'color 0.2s ease, background 0.2s ease'
              }}
            >
              {/* Premium Active Tab Indicator */}
              {active && (
                <motion.div 
                  layoutId="activeNavIndicator"
                  style={{ 
                    position: 'absolute', left: 0, top: '25%', bottom: '25%', 
                    width: '3px', background: '#60a5fa', borderRadius: '0 4px 4px 0',
                    boxShadow: '0 0 10px rgba(96,165,250,0.6)'
                  }} 
                />
              )}
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: active ? '#60a5fa' : 'inherit', display: 'flex' }}>
                  {icons[item.icon]}
                </span>
                {item.label}
              </span>
            </motion.div>
          );
        })}
      </nav>

      {/* ── Support Widget ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ 
          margin: '0 16px 20px', padding: '20px', 
          background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(124,58,237,0.1))', 
          border: '1px solid rgba(255,255,255,0.05)', 
          borderRadius: '16px', position: 'relative', overflow: 'hidden' 
        }}
      >
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '70px', height: '70px', background: '#3b82f6', filter: 'blur(40px)', opacity: 0.3 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>Need help?</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '14px', lineHeight: '1.5' }}>Our support team responds within 1 business day.</div>
          <motion.button 
            whileHover={{ x: 3, color: '#93c5fd' }}
            style={{ 
              background: 'transparent', border: 'none', color: '#60a5fa', 
              fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            Contact support →
          </motion.button>
        </div>
      </motion.div>

      {/* ── Sign Out ── */}
      <div style={{ padding: '0 16px' }}>
        <motion.button 
          onClick={() => { localStorage.clear(); navigate('/login'); }}
          whileHover={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}
          whileTap={{ scale: 0.97 }}
          style={{
            width: '100%', padding: '12px', 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', 
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign out
        </motion.button>
      </div>
    </aside>
  );
}