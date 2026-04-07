import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Spline from '@splinetool/react-spline';
import Sidebar from '../components/Sidebar';

const API_BASE = 'https://h14-b-cool-cool-cool.vercel.app';
const SPLINE_URL = 'https://prod.spline.design/p5AxFXq0h-FCdBdX/scene.splinecode';

// ── Icons (no emoji) ──────────────────────────────────────────
const IcBox = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
);
const IcOrders = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IcTag = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
const IcFolder = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);
const IcPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcTrend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

// ── Glass card ────────────────────────────────────────────────
function GlassCard({ children, style = {}, onClick, delay = 0, hover = true }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      onClick={onClick}
      style={{
        background: hovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)'}`,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '20px',
        transition: 'all 0.25s ease',
        boxShadow: hovered
          ? '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
          : '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, icon, delay, trend }) {
  return (
    <GlassCard delay={delay} style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{
          fontSize: '11px', fontWeight: '700',
          color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase', letterSpacing: '1.2px',
        }}>{label}</div>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px',
          background: `${accent}18`,
          border: `1px solid ${accent}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent,
        }}>{icon}</div>
      </div>
      <div style={{
        fontSize: '36px', fontWeight: '800', color: '#fff',
        fontFamily: "'Bricolage Grotesque', sans-serif",
        letterSpacing: '-1.5px', lineHeight: 1, marginBottom: '8px',
      }}>{value}</div>
      {sub && (
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.32)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          {trend && <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center' }}><IcTrend /></span>}
          {sub}
        </div>
      )}
    </GlassCard>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function SellerDashboard() {
  const navigate = useNavigate();
  const sellerId = localStorage.getItem('sellerId');
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [shouldMountSpline, setShouldMountSpline] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !sellerId) { navigate('/login'); return; }
    const t = setTimeout(() => setShouldMountSpline(true), 800);

    Promise.all([
      fetch(`${API_BASE}/sellers/${sellerId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_BASE}/products/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_BASE}/orders/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
    ]).then(([s, p, o]) => {
      setSeller(s);

      const myProds = Array.isArray(p) ? p.filter(prod => String(prod.sellerId) === String(sellerId)) : [];
      setProducts(myProds);

      const myFilteredOrders = Array.isArray(o) ? o.filter(order => {
        const items = order.inputData?.items || [];
        return items.some(item => String(item.sellerId) === String(sellerId));
      }) : [];
      
      setOrders(myFilteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }).catch(() => {}).finally(() => setLoading(false));

    return () => clearTimeout(t);
  }, [sellerId, navigate]);

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a', fontFamily: "'Geist','DM Sans',sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            style={{ width: '36px', height: '36px', border: '2px solid rgba(255,255,255,0.06)', borderTopColor: '#06b6d4', borderRadius: '50%', margin: '0 auto 16px' }}
          />
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.28)', fontWeight: '500' }}>Loading workspace…</div>
        </div>
      </div>
    </div>
  );

  const myProducts = products;
  const onSpecial = myProducts.filter(p => p.onSpecial);
  const families = [...new Set(myProducts.map(p => p.family).filter(Boolean))];
  const firstName = seller?.name?.split(' ')[0] || '';
  const recentProducts = myProducts.slice(0, 6);

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: '#050d1a',
      fontFamily: "'Geist','DM Sans','Segoe UI',sans-serif",
    }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>

        {/* ── Spline background ── */}
        <div style={{ position: 'fixed', inset: 0, left: '254px', zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {/* Grid texture — same as landing page */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }} />
          {/* Cyan glow top-right */}
          <div style={{ position: 'absolute', top: '-15%', right: '5%', width: '700px', height: '600px', background: 'radial-gradient(ellipse, rgba(6,182,212,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
          {/* Blue glow bottom-left */}
          <div style={{ position: 'absolute', bottom: '-10%', left: '10%', width: '500px', height: '500px', background: 'radial-gradient(ellipse, rgba(37,99,235,0.10) 0%, transparent 60%)', pointerEvents: 'none' }} />

          {shouldMountSpline && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: splineLoaded ? 0.55 : 0 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              style={{ position: 'absolute', inset: '-10%', width: '120%', height: '120%', transform: 'scaleX(-1)' }}
            >
              <Spline
                scene={SPLINE_URL}
                onLoad={() => setTimeout(() => setSplineLoaded(true), 300)}
                style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
              />
            </motion.div>
          )}
        </div>

        {/* ── Top bar ── */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'sticky', top: 0, zIndex: 100,
            height: '64px', padding: '0 40px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(5,13,26,0.75)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#06b6d4',
              boxShadow: '0 0 10px rgba(6,182,212,0.7)',
            }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.3px' }}>
                Seller Dashboard
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>
                {seller?.name || 'Your store'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <motion.button
              onClick={() => navigate('/orders')}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
              }}
            >
              <IcOrders />
              View orders
            </motion.button>
            <motion.button
              onClick={() => navigate('/seller/products')}
              whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(6,182,212,0.35)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 18px',
                background: 'linear-gradient(135deg, #0891b2, #2563eb)',
                border: 'none', borderRadius: '10px',
                fontSize: '13px', fontWeight: '700', color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(6,182,212,0.3)',
              }}
            >
              <IcPlus />
              Add product
            </motion.button>
          </div>
        </motion.header>

        {/* ── Scrollable content ── */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>

          {/* ── Hero ── */}
          <div style={{ padding: '60px 40px 36px' }}>
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)',
                borderRadius: '20px', padding: '5px 14px', marginBottom: '24px',
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 8px rgba(6,182,212,0.8)' }} />
                <span style={{ fontSize: '12px', color: 'rgba(6,182,212,0.9)', fontWeight: '600', letterSpacing: '0.3px' }}>
                  Supplier Portal
                </span>
              </div>

              <h1 style={{
                fontSize: 'clamp(38px, 4vw, 58px)',
                fontWeight: '800', color: '#fff',
                fontFamily: "'Bricolage Grotesque', sans-serif",
                letterSpacing: '-2px', lineHeight: 1.05,
                margin: '0 0 16px',
              }}>
                {firstName ? `Welcome, ${firstName}.` : 'Welcome back.'}<br />
                <span style={{
                  background: 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 50%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  {myProducts.length > 0 ? `${myProducts.length} SKU${myProducts.length !== 1 ? 's' : ''} listed.` : 'Build your catalog.'}
                </span>
              </h1>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.38)', maxWidth: '440px', lineHeight: '1.75', margin: 0 }}>
                Manage your product catalog, configure pricing tiers, and monitor incoming purchase orders from Australian retailers.
              </p>
            </motion.div>
          </div>

          {/* ── Stats ── */}
          <div style={{ padding: '0 40px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
            <StatCard delay={0.18} label="Total Products" value={myProducts.length} sub="Listed in catalog" accent="#06b6d4" icon={<IcBox />} trend={myProducts.length > 0} />
            <StatCard delay={0.25} label="Active Orders" value={orders.length} sub="Incoming sales" accent="#3b82f6" icon={<IcOrders />} trend={orders.length > 0} />
            <StatCard delay={0.32} label="On Special" value={onSpecial.length} sub="Active discounts" accent="#f59e0b" icon={<IcTag />} />
            <StatCard delay={0.39} label="Families" value={families.length} sub="Product categories" accent="#a78bfa" icon={<IcFolder />} />
          </div>

          {/* ── Two columns: actions + profile ── */}
          <div style={{ padding: '0 40px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '14px', marginBottom: '20px' }}>

            {/* Quick actions */}
            <GlassCard delay={0.44} style={{ padding: '28px' }}>
              <div style={{
                fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '20px',
              }}>Quick actions</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  {
                    label: 'Manage Catalog',
                    desc: 'Edit products, prices and stock levels',
                    icon: <IcBox />, accent: '#06b6d4',
                    action: () => navigate('/seller/products'), primary: true,
                  },
                  {
                    label: 'Process Orders',
                    desc: 'Review and confirm incoming orders',
                    icon: <IcOrders />, accent: '#3b82f6',
                    action: () => navigate('/orders'),
                  },
                ].map((a, i) => (
                  <motion.button
                    key={a.label}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.52 + i * 0.08 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={a.action}
                    style={{
                      background: a.primary ? `${a.accent}14` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${a.primary ? `${a.accent}35` : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: '14px', padding: '20px',
                      textAlign: 'left', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', gap: '14px',
                    }}
                  >
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: `${a.accent}20`, border: `1px solid ${a.accent}35`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: a.accent,
                    }}>{a.icon}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '4px', fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.2px' }}>{a.label}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.5' }}>{a.desc}</div>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.2)', marginTop: 'auto' }}><IcArrow /></div>
                  </motion.button>
                ))}
              </div>
            </GlassCard>

            {/* Business profile */}
            <GlassCard delay={0.50} style={{ padding: '28px' }}>
              <div style={{
                fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '22px',
              }}>Business profile</div>

              {seller ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {[
                    { label: 'Business name', value: seller.name },
                    { label: 'Email', value: seller.email },
                    { label: 'ABN', value: seller.companyId || '—' },
                    { label: 'Tax scheme', value: seller.taxSchemeId || '—' },
                  ].map(row => (
                    <div key={row.label}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{row.label}</div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.78)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value || '—'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>Profile unavailable.</div>
              )}
            </GlassCard>
          </div>

          {/* ── Products table ── */}
          <div style={{ padding: '0 40px 52px' }}>
            <GlassCard delay={0.58} hover={false} style={{ overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{
                padding: '22px 28px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.3px', marginBottom: '3px' }}>
                    Catalog overview
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)' }}>
                    Your active product listings
                  </div>
                </div>
                <motion.button
                  onClick={() => navigate('/seller/products')}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  style={{
                    background: 'rgba(6,182,212,0.12)',
                    border: '1px solid rgba(6,182,212,0.28)',
                    borderRadius: '8px', padding: '7px 16px',
                    color: '#06b6d4', fontSize: '12px', fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Manage all
                </motion.button>
              </div>

              {/* Column labels */}
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 110px',
                padding: '10px 28px',
                background: 'rgba(255,255,255,0.018)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                {['Product', 'Brand', 'Family', 'Price', 'Status'].map(h => (
                  <div key={h} style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '1.1px' }}>{h}</div>
                ))}
              </div>

              {/* Rows */}
              {recentProducts.length === 0 ? (
                <div style={{ padding: '60px 28px', textAlign: 'center' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#06b6d4' }}>
                    <IcBox />
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'rgba(255,255,255,0.65)', marginBottom: '6px', fontFamily: "'Bricolage Grotesque', sans-serif" }}>No products listed yet</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.28)', marginBottom: '24px' }}>Add your first product to start selling on the platform.</div>
                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: '0 8px 24px rgba(6,182,212,0.35)' }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate('/seller/products')}
                    style={{
                      padding: '11px 28px',
                      background: 'linear-gradient(135deg, #0891b2, #2563eb)',
                      border: 'none', borderRadius: '10px',
                      fontSize: '13px', fontWeight: '700', color: '#fff', cursor: 'pointer',
                      boxShadow: '0 4px 20px rgba(6,182,212,0.3)',
                    }}
                  >Add first product</motion.button>
                </div>
              ) : (
                <AnimatePresence>
                  {recentProducts.map((p, i) => (
                    <motion.div
                      key={p.productId || i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.65 + i * 0.05 }}
                      style={{
                        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 110px',
                        padding: '15px 28px',
                        borderBottom: i < recentProducts.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.82)' }}>{p.name}</div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.32)' }}>{p.brand || '—'}</div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.32)' }}>{p.family || '—'}</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.82)' }}>${Number(p.cost).toFixed(2)}</div>
                      <div>
                        {p.onSpecial
                          ? <span style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.28)', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>Special</span>
                          : <span style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.28)', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>Active</span>}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </GlassCard>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800&family=Geist:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.16); }
      `}</style>
    </div>
  );
}