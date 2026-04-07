import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Spline from '@splinetool/react-spline';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../apiConfig.js';

const SPLINE_URL = 'https://prod.spline.design/p5AxFXq0h-FCdBdX/scene.splinecode';

// ── Tier config ───────────────────────────────────────────────
const TIERS = {
  Bronze: { color: '#cd7c54', glow: 'rgba(205,124,84,0.25)', next: 200 },
  Silver: { color: '#94a3b8', glow: 'rgba(148,163,184,0.25)', next: 500 },
  Gold:   { color: '#f59e0b', glow: 'rgba(245,158,11,0.25)',  next: null },
};

// ── Icons ─────────────────────────────────────────────────────
const IcBox = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
);
const IcCart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const IcAward = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);
const IcDoc = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IcCal = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IcArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M5 12h14M12 5l7 7-7 7"/>
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
function StatCard({ label, value, sub, accent, icon, delay }) {
  return (
    <GlassCard delay={delay} style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1.2px' }}>{label}</div>
        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${accent}18`, border: `1px solid ${accent}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>{icon}</div>
      </div>
      <div style={{ fontSize: '36px', fontWeight: '800', color: '#fff', fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-1.5px', lineHeight: 1, marginBottom: '8px' }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.32)' }}>{sub}</div>}
    </GlassCard>
  );
}

// ── Status badge ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    'order placed': { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', dot: '#3b82f6' },
    pending:        { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', dot: '#f59e0b' },
    confirmed:      { bg: 'rgba(34,197,94,0.15)',  color: '#4ade80', dot: '#22c55e' },
    despatched:     { bg: 'rgba(139,92,246,0.15)', color: '#a78bfa', dot: '#8b5cf6' },
    cancelled:      { bg: 'rgba(239,68,68,0.15)',  color: '#f87171', dot: '#ef4444' },
  };
  const key = status?.toLowerCase() || 'pending';
  const s = map[key] || map.pending;
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: s.bg, color: s.color,
      fontSize: '11px', fontWeight: '700',
      padding: '3px 10px', borderRadius: '20px',
      border: `1px solid ${s.dot}35`,
    }}>
      <motion.span
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        style={{ width: '5px', height: '5px', borderRadius: '50%', background: s.dot, display: 'inline-block' }}
      />
      {label}
    </span>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function BuyerDashboard() {
  const navigate = useNavigate();
  const buyerId = localStorage.getItem('buyerId');
  const [buyer, setBuyer] = useState(null);
  const [loyalty, setLoyalty] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [shouldMountSpline, setShouldMountSpline] = useState(false);
  const ordersRef = useRef(null);
  const ordersInView = useInView(ordersRef, { once: true, margin: '-40px' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !buyerId) { navigate('/login'); return; }
    const t = setTimeout(() => setShouldMountSpline(true), 800);

    Promise.all([
      fetch(`${API_BASE}/buyers/${buyerId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (r.status === 401) { navigate('/login'); throw new Error(); } return r.json(); }),
      fetch(`${API_BASE}/buyers/${buyerId}/loyalty`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()),
      fetch(`${API_BASE}/orders`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : []),
    ]).then(([b, l, o]) => {
      setBuyer(b);
      setLoyalty(l);
      const myOrders = Array.isArray(o)
        ? o.filter(order => order.inputData && (String(order.inputData.buyerId) === String(buyerId) || String(order.inputData.buyer?.buyerId) === String(buyerId)))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];
      setOrders(myOrders);
    }).catch(() => {}).finally(() => setLoading(false));

    return () => clearTimeout(t);
  }, [buyerId, navigate]);

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a', fontFamily: "'Geist','DM Sans',sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            style={{ width: '36px', height: '36px', border: '2px solid rgba(255,255,255,0.06)', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 16px' }}
          />
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.28)', fontWeight: '500' }}>Loading dashboard…</div>
        </div>
      </div>
    </div>
  );

  const points = loyalty?.loyaltyPoints ?? 0;
  const tier = points >= 500 ? 'Gold' : points >= 200 ? 'Silver' : 'Bronze';
  const tc = TIERS[tier];
  const progressPct = tier === 'Gold' ? 100
    : tier === 'Bronze' ? Math.min((points / 200) * 100, 100)
    : Math.min(((points - 200) / 300) * 100, 100);
  const recentOrders = orders.slice(0, 6);
  const firstName = buyer?.name?.split(' ')[0] || '';

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
          {/* Grid texture */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }} />
          {/* Cyan glow — shifts based on tier */}
          <div style={{ position: 'absolute', top: '-15%', right: '5%', width: '700px', height: '600px', background: `radial-gradient(ellipse, ${tc.glow} 0%, transparent 60%)`, transition: 'background 1s ease', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-10%', left: '15%', width: '500px', height: '500px', background: 'radial-gradient(ellipse, rgba(37,99,235,0.10) 0%, transparent 60%)', pointerEvents: 'none' }} />

          {shouldMountSpline && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: splineLoaded ? 0.5 : 0 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              style={{ position: 'absolute', inset: '-10%', width: '120%', height: '120%' }}
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
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 10px rgba(59,130,246,0.7)' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.3px' }}>Dashboard</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>{buyer?.name ? `Welcome back, ${buyer.name}` : 'Buyer portal'}</div>
            </div>
          </div>

          {/* Tier badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              background: `${tc.color}14`,
              border: `1px solid ${tc.color}40`,
              borderRadius: '20px', padding: '6px 16px',
              fontSize: '12px', fontWeight: '700', color: tc.color,
            }}
          >
            <motion.span
              animate={{ opacity: [1, 0.35, 1] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              style={{ width: '6px', height: '6px', borderRadius: '50%', background: tc.color, display: 'inline-block', boxShadow: `0 0 8px ${tc.color}` }}
            />
            {tier} Member
          </motion.div>
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
                background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.28)',
                borderRadius: '20px', padding: '5px 14px', marginBottom: '24px',
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px rgba(59,130,246,0.8)' }} />
                <span style={{ fontSize: '12px', color: 'rgba(96,165,250,0.9)', fontWeight: '600', letterSpacing: '0.3px' }}>
                  Buyer Portal
                </span>
              </div>

              <h1 style={{
                fontSize: 'clamp(38px, 4vw, 58px)',
                fontWeight: '800', color: '#fff',
                fontFamily: "'Bricolage Grotesque', sans-serif",
                letterSpacing: '-2px', lineHeight: 1.05,
                margin: '0 0 16px',
              }}>
                {firstName ? `Hello, ${firstName}.` : 'Welcome back.'}<br />
                <span style={{
                  background: 'linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  {orders.length > 0 ? `${orders.length} order${orders.length !== 1 ? 's' : ''} placed.` : 'Start ordering today.'}
                </span>
              </h1>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.38)', maxWidth: '440px', lineHeight: '1.75', margin: 0 }}>
                Browse the wholesale catalog, manage your cart, and track your procurement activity in one place.
              </p>
            </motion.div>
          </div>

          {/* ── Stats ── */}
          <div style={{ padding: '0 40px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
            <StatCard
              delay={0.18} label="Loyalty Points"
              value={points.toLocaleString()}
              sub={tc.next ? `${(tc.next - points).toLocaleString()} pts to ${tier === 'Bronze' ? 'Silver' : 'Gold'}` : 'Maximum tier reached'}
              accent={tc.color} icon={<IcAward />}
            />
            <StatCard
              delay={0.25} label="Orders Placed"
              value={orders.length}
              sub={orders.length > 0 ? `Latest: ${orders[0]?.status || 'pending'}` : 'No orders yet'}
              accent="#60a5fa" icon={<IcDoc />}
            />
            <StatCard
              delay={0.32} label="Member Since"
              value={buyer?.createdAt ? new Date(buyer.createdAt).getFullYear() : '—'}
              sub="Account in good standing"
              accent="#4ade80" icon={<IcCal />}
            />
          </div>

          {/* ── Quick actions + profile ── */}
          <div style={{ padding: '0 40px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '14px', marginBottom: '20px' }}>

            <GlassCard delay={0.38} style={{ padding: '28px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '20px' }}>
                Quick actions
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Browse Products', desc: 'Explore the full supplier catalog', icon: <IcBox />, accent: '#3b82f6', action: () => navigate('/products'), primary: true },
                  { label: 'View Cart', desc: 'Review items and place an order', icon: <IcCart />, accent: '#8b5cf6', action: () => navigate('/cart') },
                ].map((a, i) => (
                  <motion.button
                    key={a.label}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.46 + i * 0.08 }}
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
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${a.accent}20`, border: `1px solid ${a.accent}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.accent }}>{a.icon}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '4px', fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.2px' }}>{a.label}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.5' }}>{a.desc}</div>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.2)', marginTop: 'auto' }}><IcArrow /></div>
                  </motion.button>
                ))}
              </div>
            </GlassCard>

            <GlassCard delay={0.44} style={{ padding: '28px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '22px' }}>
                Your profile
              </div>
              {buyer ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {[
                    { label: 'Name', value: buyer.name },
                    { label: 'Email', value: buyer.email },
                    { label: 'City', value: buyer.city || '—' },
                    { label: 'ABN', value: buyer.companyId || '—' },
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

          {/* ── Loyalty progress ── */}
          <div style={{ padding: '0 40px', marginBottom: '20px' }}>
            <GlassCard delay={0.50} style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '6px' }}>Loyalty progress</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Earn points on every order.</div>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  style={{ textAlign: 'right' }}
                >
                  <div style={{
                    fontSize: '34px', fontWeight: '800', color: tc.color,
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    letterSpacing: '-1.5px', lineHeight: 1,
                    textShadow: `0 0 28px ${tc.glow}`,
                  }}>
                    {points.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '3px' }}>points</div>
                </motion.div>
              </div>

              {/* Tier blocks */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
                {Object.entries(TIERS).map(([name, t]) => {
                  const isActive = tier === name;
                  return (
                    <motion.div
                      key={name}
                      animate={{ boxShadow: isActive ? `0 0 20px ${t.glow}` : 'none' }}
                      transition={{ duration: 0.6 }}
                      style={{
                        borderRadius: '12px', padding: '14px 16px',
                        background: isActive ? `${t.color}14` : 'rgba(255,255,255,0.025)',
                        border: `1px solid ${isActive ? `${t.color}45` : 'rgba(255,255,255,0.06)'}`,
                        transition: 'all 0.3s',
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: '700', color: isActive ? t.color : 'rgba(255,255,255,0.25)', marginBottom: '2px' }}>{name}</div>
                      <div style={{ fontSize: '11px', color: isActive ? `${t.color}80` : 'rgba(255,255,255,0.18)' }}>
                        {name === 'Bronze' ? '0–200' : name === 'Silver' ? '200–500' : '500+'} pts
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {tier !== 'Gold' && (
                <>
                  <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', marginBottom: '10px' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 1.2, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        height: '100%',
                        background: `linear-gradient(90deg, ${tc.color}bb, ${tc.color})`,
                        borderRadius: '999px',
                        boxShadow: `0 0 10px ${tc.glow}`,
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '600' }}>
                      {(tc.next - points).toLocaleString()} more points
                    </span>
                    {' '}to reach {tier === 'Bronze' ? 'Silver' : 'Gold'} tier.
                  </div>
                </>
              )}
            </GlassCard>
          </div>

          {/* ── Orders table ── */}
          <div ref={ordersRef} style={{ padding: '0 40px 52px' }}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={ordersInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <GlassCard delay={0} hover={false} style={{ overflow: 'hidden' }}>
                <div style={{
                  padding: '22px 28px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.3px', marginBottom: '3px' }}>Recent orders</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)' }}>Your latest purchase activity.</div>
                  </div>
                  {orders.length > 5 && (
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.28)', borderRadius: '8px', padding: '7px 16px', color: '#60a5fa', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >View all</motion.button>
                  )}
                </div>

                {recentOrders.length === 0 ? (
                  <div style={{ padding: '60px 28px', textAlign: 'center' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#3b82f6' }}>
                      <IcDoc />
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'rgba(255,255,255,0.65)', marginBottom: '6px', fontFamily: "'Bricolage Grotesque', sans-serif" }}>No orders yet</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.28)', marginBottom: '24px' }}>Start by browsing the product catalog.</div>
                    <motion.button
                      whileHover={{ scale: 1.04, boxShadow: '0 8px 24px rgba(37,99,235,0.4)' }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => navigate('/products')}
                      style={{
                        padding: '11px 28px',
                        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                        border: 'none', borderRadius: '10px',
                        fontSize: '13px', fontWeight: '700', color: '#fff', cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(37,99,235,0.35)',
                      }}
                    >Browse products</motion.button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 110px 130px', padding: '10px 28px', background: 'rgba(255,255,255,0.018)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {['Order ID', 'Date', 'Total', 'Status'].map(h => (
                        <div key={h} style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '1.1px' }}>{h}</div>
                      ))}
                    </div>
                    <AnimatePresence>
                      {recentOrders.map((order, i) => (
                        <motion.div
                          key={order.orderId || i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          style={{
                            display: 'grid', gridTemplateColumns: '1fr 130px 110px 130px',
                            padding: '15px 28px',
                            borderBottom: i < recentOrders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.82)', fontFamily: 'monospace' }}>
                            {order.orderId || `ORD-${String(i + 1).padStart(4, '0')}`}
                          </div>
                          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.32)' }}>
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.82)' }}>
                            ${Number(order.totalCost ?? order.inputData?.totalCost ?? 0).toFixed(2)}
                          </div>
                          <div><StatusBadge status={order.status || 'pending'} /></div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </>
                )}
              </GlassCard>
            </motion.div>
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