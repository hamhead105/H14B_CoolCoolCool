import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import Spline from '@splinetool/react-spline';
import Sidebar from '../components/Sidebar';

const API_BASE = 'https://h14-b-cool-cool-cool.vercel.app';
const SPLINE_URL = 'https://prod.spline.design/uuHgNblqFyjBE7WO/scene.splinecode';

// ── Family icons ──────────────────────────────────────────────
const FamilyIcon = ({ family, size = 18 }) => {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.6' };
  if (family === 'Packaging') return <svg {...props}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>;
  if (family === 'Office') return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
  if (family === 'Hardware') return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>;
  return <svg {...props}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>;
};

// ── 3D tilt card ──────────────────────────────────────────────
function TiltCard({ children, style = {}, onClick }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-60, 60], [8, -8]);
  const rotateY = useTransform(x, [-60, 60], [-8, 8]);

  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0); y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', cursor: onClick ? 'pointer' : 'default', ...style }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  );
}

// ── Product card ──────────────────────────────────────────────
function ProductCard({ product, onAdd, onNavigate, inCart, index }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });

  const finalPrice = product.onSpecial
    ? (product.cost * (1 - product.discount)).toFixed(2)
    : Number(product.cost).toFixed(2);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.94 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.55, delay: (index % 12) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: '800px' }}
    >
      <TiltCard onClick={() => onNavigate(product)} style={{ height: '100%' }}>
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            background: hovered ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${hovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '18px',
            overflow: 'hidden',
            transition: 'all 0.25s ease',
            boxShadow: hovered
              ? '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.14), 0 0 0 1px rgba(255,255,255,0.04)'
              : '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07)',
            display: 'flex', flexDirection: 'column',
            height: '100%',
          }}
        >
          {/* Card top — icon area */}
          <div style={{
            height: '110px', position: 'relative',
            background: hovered
              ? 'linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(124,58,237,0.1) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.3s',
            overflow: 'hidden',
          }}>
            {/* Shimmer line on hover */}
            {hovered && (
              <motion.div
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: '200%', opacity: [0, 0.4, 0] }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                  pointerEvents: 'none',
                }}
              />
            )}

            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: hovered ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${hovered ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: hovered ? '#60a5fa' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.25s',
              transform: 'translateZ(20px)',
            }}>
              <FamilyIcon family={product.family} />
            </div>

            {product.onSpecial && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  position: 'absolute', top: '10px', right: '10px',
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  color: '#fff', fontSize: '10px', fontWeight: '800',
                  padding: '3px 8px', borderRadius: '20px',
                  letterSpacing: '0.3px',
                  boxShadow: '0 4px 12px rgba(245,158,11,0.4)',
                }}
              >
                -{Math.round(product.discount * 100)}%
              </motion.div>
            )}

            {inCart && (
              <div style={{
                position: 'absolute', top: '10px', left: '10px',
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#4ade80',
                boxShadow: '0 0 8px rgba(74,222,128,0.8)',
              }} />
            )}
          </div>

          {/* Card body */}
          <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>
              {product.brand}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '10px', lineHeight: '1.35', fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.2px' }}>
              {product.name}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#fff', fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.5px' }}>
                ${finalPrice}
              </span>
              {product.onSpecial && (
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', textDecoration: 'line-through' }}>
                  ${Number(product.cost).toFixed(2)}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button
                onClick={e => { e.stopPropagation(); onNavigate(product); }}
                style={{
                  flex: 1, padding: '9px 0',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px', fontSize: '12px', fontWeight: '600',
                  color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
                  transition: 'all 0.18s',
                  fontFamily: "'Geist', sans-serif",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.5)'; e.currentTarget.style.color = '#60a5fa'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
              >
                Details
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={e => { e.stopPropagation(); onAdd(product); }}
                style={{
                  flex: 1, padding: '9px 0',
                  background: inCart
                    ? 'rgba(74,222,128,0.15)'
                    : 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  border: inCart ? '1px solid rgba(74,222,128,0.35)' : 'none',
                  borderRadius: '10px', fontSize: '12px', fontWeight: '700',
                  color: inCart ? '#4ade80' : '#fff',
                  cursor: 'pointer',
                  boxShadow: inCart ? 'none' : '0 4px 16px rgba(37,99,235,0.4)',
                  fontFamily: "'Geist', sans-serif",
                }}
              >
                {inCart ? 'Added' : 'Add'}
              </motion.button>
            </div>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
}

// ── Tree view ─────────────────────────────────────────────────
function TreeView({ products, onNavigate, onAdd, cart }) {
  const families = products.reduce((acc, p) => {
    const fam = p.family || 'Other';
    if (!acc[fam]) acc[fam] = [];
    acc[fam].push(p);
    return acc;
  }, {});
  Object.keys(families).forEach(f => families[f].sort((a, b) => (a.productTier || 0) - (b.productTier || 0)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      {Object.entries(families).map(([familyName, items], fi) => (
        <motion.div
          key={familyName}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: fi * 0.1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '32px', height: '32px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
              <FamilyIcon family={familyName} size={15} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff', fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.3px' }}>{familyName}</span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)' }}>{items.length} products</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: '12px', gap: '0' }}>
            {items.map((product, idx) => {
              const finalPrice = product.onSpecial ? (product.cost * (1 - product.discount)).toFixed(2) : Number(product.cost).toFixed(2);
              const inCart = cart.some(c => c.productId === product.productId);
              return (
                <React.Fragment key={product.productId}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: fi * 0.1 + idx * 0.06 }}
                    onClick={() => onNavigate(product)}
                    style={{
                      background: inCart ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${inCart ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      borderRadius: '14px', padding: '16px',
                      minWidth: '160px', maxWidth: '180px',
                      cursor: 'pointer', position: 'relative',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                      overflow: 'visible', 
                      marginTop: '10px',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = inCart ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = inCart ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    {product.onSpecial && (
                      <div style={{ position: 'absolute', top: '-8px', right: '10px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '2px 7px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(245,158,11,0.4)' }}>
                        -{Math.round(product.discount * 100)}%
                      </div>
                    )}
                    <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Tier {product.productTier || 1}</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '8px', lineHeight: '1.3', fontFamily: "'Bricolage Grotesque', sans-serif" }}>{product.name}</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#60a5fa', marginBottom: '12px', fontFamily: "'Bricolage Grotesque', sans-serif" }}>${finalPrice}</div>
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={e => { e.stopPropagation(); onAdd(product); }}
                      style={{
                        width: '100%', padding: '7px 0',
                        background: inCart ? 'rgba(74,222,128,0.15)' : 'linear-gradient(135deg, #2563eb, #7c3aed)',
                        border: inCart ? '1px solid rgba(74,222,128,0.35)' : 'none',
                        borderRadius: '8px', fontSize: '11px', fontWeight: '700',
                        color: inCart ? '#4ade80' : '#fff',
                        cursor: 'pointer',
                        fontFamily: "'Geist', sans-serif",
                      }}
                    >{inCart ? 'Added' : '+ Add'}</motion.button>
                  </motion.div>
                  {idx < items.length - 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', minWidth: '40px', flexShrink: 0 }}>
                      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(59,130,246,0.4), rgba(124,58,237,0.4))' }} />
                      <div style={{ width: '5px', height: '5px', border: '1.5px solid rgba(124,58,237,0.6)', borderLeft: 'none', borderBottom: 'none', transform: 'rotate(45deg)', marginLeft: '-3px' }} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Specials marquee ──────────────────────────────────────────
function SpecialsMarquee({ items }) {
  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <div style={{ overflow: 'hidden', height: '40px', display: 'flex', alignItems: 'center', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(to right, #050d1a, transparent)', zIndex: 2 }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(to left, #050d1a, transparent)', zIndex: 2 }} />
      <motion.div
        animate={{ x: [0, -50 * items.length] }}
        transition={{ repeat: Infinity, duration: items.length * 3, ease: 'linear' }}
        style={{ display: 'flex', gap: '0', whiteSpace: 'nowrap' }}
      >
        {doubled.map((p, i) => (
          <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '0 32px', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block', boxShadow: '0 0 6px rgba(245,158,11,0.8)' }} />
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', fontFamily: "'Geist', sans-serif" }}>{p.name}</span>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#f59e0b', fontFamily: "'Bricolage Grotesque', sans-serif" }}>${(p.cost * (1 - p.discount)).toFixed(2)}</span>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '600', textDecoration: 'line-through' }}>${Number(p.cost).toFixed(2)}</span>
            <span style={{ fontSize: '10px', fontWeight: '800', color: '#ef4444', background: 'rgba(239,68,68,0.15)', padding: '1px 6px', borderRadius: '6px' }}>-{Math.round(p.discount * 100)}%</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [selectedFamilies, setSelectedFamilies] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [onSpecialOnly, setOnSpecialOnly] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const [filterOpen, setFilterOpen] = useState(true);
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [shouldMountSpline, setShouldMountSpline] = useState(false);
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    const t = setTimeout(() => setShouldMountSpline(true), 400);
    fetch(`${API_BASE}/products/`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.status === 401) { navigate('/login'); throw new Error('Unauthorized'); }
        if (!res.ok) throw new Error('Failed to load products');
        return res.json();
      })
      .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
    return () => clearTimeout(t);
  }, [navigate]);

  const families = [...new Set(products.map(p => p.family).filter(Boolean))];
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];

  const filteredProducts = products.filter(p => {
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase()) && !p.brand?.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedFamilies.length && !selectedFamilies.includes(p.family)) return false;
    if (selectedBrand && p.brand !== selectedBrand) return false;
    if (onSpecialOnly && !p.onSpecial) return false;
    return true;
  });

  const specialProducts = products.filter(p => p.onSpecial);

  const handleAddToCart = useCallback((product) => {
    const updatedCart = [...cart];
    const idx = updatedCart.findIndex(item => item.productId === product.productId);
    if (idx > -1) updatedCart[idx].qty += 1;
    else updatedCart.push({ ...product, qty: 1 });
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCartPulse(true);
    setTimeout(() => setCartPulse(false), 600);
  }, [cart]);

  const handleNavigate = useCallback((product) => {
    navigate(`/products/${product.productId}`);
  }, [navigate]);

  const toggleFamily = fam => setSelectedFamilies(prev => prev.includes(fam) ? prev.filter(f => f !== fam) : [...prev, fam]);
  const resetFilters = () => { setSelectedFamilies([]); setSelectedBrand(''); setOnSpecialOnly(false); setSearch(''); };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a', fontFamily: "'Geist', sans-serif", alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{ width: '40px', height: '40px', border: '2px solid rgba(255,255,255,0.06)', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 16px' }} />
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontWeight: '500' }}>Loading catalog…</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a', fontFamily: "'Geist', sans-serif", alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', background: '#2563eb', border: 'none', borderRadius: '9px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>Retry</button>
      </div>
    </div>
  );

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: '#050d1a',
      fontFamily: "'Geist','DM Sans','Segoe UI',sans-serif",
    }}>

      {/* ── Spline ripple — full screen fixed ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {shouldMountSpline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: splineLoaded ? 0.8 : 0 }}
            transition={{ duration: 0, ease: 'easeOut' }}
            style={{ position: 'absolute', inset: '-5%', width: '110%', height: '110%' }}
          >
            <Spline
              scene={SPLINE_URL}
              onLoad={() => setTimeout(() => setSplineLoaded(true), 200)}
              style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
            />
          </motion.div>
        )}
        {/* Dark overlay to keep the ripple as an atmosphere, not the hero */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,13,26,0.55)' }} />
      </div>

      <Sidebar />

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', zIndex: 1 }}>

        {/* ── Top bar ── */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            height: '60px', padding: '0 28px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(5,13,26,0.8)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            position: 'sticky', top: 0, zIndex: 50, flexShrink: 0,
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '440px' }}>
            <div style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products, suppliers…"
              style={{
                width: '100%', padding: '9px 14px 9px 36px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '10px', fontSize: '13px', color: '#fff',
                outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
                fontFamily: "'Geist', sans-serif",
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(96,165,250,0.45)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
            />
          </div>

          {/* View toggle + cart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '20px' }}>
            {/* View mode */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', padding: '3px' }}>
              {[
                { mode: 'grid', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
                { mode: 'tree', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
              ].map(({ mode, icon }) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  style={{
                    padding: '6px 10px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                    background: viewMode === mode ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: viewMode === mode ? '#fff' : 'rgba(255,255,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >{icon}</button>
              ))}
            </div>

            {/* Cart */}
            <motion.button
              onClick={() => navigate('/cart')}
              animate={{ scale: cartPulse ? [1, 1.12, 1] : 1 }}
              transition={{ duration: 0.4 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '8px 14px',
                background: cart.length ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${cart.length ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.09)'}`,
                borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                color: cart.length ? '#60a5fa' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                fontFamily: "'Geist', sans-serif",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              Cart
              {cart.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', borderRadius: '10px', fontSize: '11px', fontWeight: '700', padding: '1px 7px', boxShadow: '0 2px 8px rgba(37,99,235,0.5)' }}
                >
                  {cart.length}
                </motion.span>
              )}
            </motion.button>
          </div>
        </motion.header>

        {/* ── Specials marquee ticker ── */}
        <AnimatePresence>
          {specialProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 40 }}
              style={{
                background: 'rgba(245,158,11,0.07)',
                borderBottom: '1px solid rgba(245,158,11,0.2)',
                flexShrink: 0,
              }}
            >
              <SpecialsMarquee items={specialProducts} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Body: filter panel + catalog ── */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

          {/* ── Filter glass panel ── */}
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 220, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  flexShrink: 0, overflow: 'hidden',
                  background: 'rgba(5,13,26,0.75)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRight: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div style={{ width: 220, padding: '20px', overflowY: 'auto', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Filters</span>
                    <button onClick={resetFilters} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '11px', fontWeight: '600', cursor: 'pointer', padding: 0 }}>Reset</button>
                  </div>

                  {families.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.28)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Category</div>
                      {families.map(fam => (
                        <label key={fam} style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '10px', cursor: 'pointer' }}>
                          <div
                            onClick={() => toggleFamily(fam)}
                            style={{
                              width: '16px', height: '16px', borderRadius: '5px',
                              background: selectedFamilies.includes(fam) ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'rgba(255,255,255,0.06)',
                              border: `1px solid ${selectedFamilies.includes(fam) ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s',
                            }}
                          >
                            {selectedFamilies.includes(fam) && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                            )}
                          </div>
                          <span style={{ fontSize: '13px', color: selectedFamilies.includes(fam) ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: selectedFamilies.includes(fam) ? '600' : '400', transition: 'color 0.15s' }}>{fam}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {brands.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.28)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Supplier</div>
                      <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)}
                        style={{
                          width: '100%', padding: '9px 12px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.09)',
                          borderRadius: '9px', fontSize: '12px', color: 'rgba(255,255,255,0.7)',
                          outline: 'none', cursor: 'pointer',
                          fontFamily: "'Geist', sans-serif",
                        }}>
                        <option value="" style={{ background: '#0a1628' }}>All suppliers</option>
                        {brands.map(b => <option key={b} value={b} style={{ background: '#0a1628' }}>{b}</option>)}
                      </select>
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.28)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Specials</div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer' }}>
                      <div
                        onClick={() => setOnSpecialOnly(v => !v)}
                        style={{
                          width: '16px', height: '16px', borderRadius: '5px',
                          background: onSpecialOnly ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${onSpecialOnly ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {onSpecialOnly && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <span style={{ fontSize: '13px', color: onSpecialOnly ? '#fbbf24' : 'rgba(255,255,255,0.5)', fontWeight: onSpecialOnly ? '600' : '400', transition: 'color 0.15s' }}>On special only</span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Catalog ── */}
          <div style={{ flex: 1, overflowY: 'auto', minWidth: 0, position: 'relative' }}>

            {/* Filter toggle + heading strip */}
            <div style={{ padding: '20px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  onClick={() => setFilterOpen(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px',
                    background: filterOpen ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${filterOpen ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.09)'}`,
                    borderRadius: '9px', fontSize: '12px', fontWeight: '600',
                    color: filterOpen ? '#60a5fa' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', transition: 'all 0.15s',
                    fontFamily: "'Geist', sans-serif",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
                  {filterOpen ? 'Hide filters' : 'Filters'}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block', boxShadow: '0 0 6px rgba(59,130,246,0.8)' }} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: '500' }}>
                    {filteredProducts.length} of {products.length} products
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(selectedFamilies.length > 0 || selectedBrand || onSpecialOnly || search) && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={resetFilters}
                    style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#f87171', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Geist', sans-serif" }}
                  >Clear filters</motion.button>
                )}
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div style={{ padding: '16px 28px 40px' }}>

                {/* Specials section */}
                {specialProducts.length > 0 && !onSpecialOnly && (
                  <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                      <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, rgba(245,158,11,0.5), transparent)' }} />
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '2px' }}>Live Specials</span>
                      <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: '700', color: '#fbbf24' }}>
                        {specialProducts.length} deals
                      </span>
                      <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.5))' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '14px' }}>
                      {specialProducts.map((p, i) => (
                        <ProductCard key={p.productId} product={p} onAdd={handleAddToCart} onNavigate={handleNavigate} inCart={cart.some(c => c.productId === p.productId)} index={i} />
                      ))}
                    </div>
                  </div>
                )}

                {/* All products heading */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.07)' }} />
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                    {onSpecialOnly ? 'Specials' : 'All Products'}
                  </span>
                  <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.07)' }} />
                </div>

                {filteredProducts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      textAlign: 'center', padding: '80px 24px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '20px',
                      backdropFilter: 'blur(16px)',
                    }}
                  >
                    <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'rgba(255,255,255,0.2)' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', fontFamily: "'Bricolage Grotesque', sans-serif" }}>No products match</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.28)', marginBottom: '20px' }}>Try adjusting your filters or search term.</div>
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={resetFilters}
                      style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Geist', sans-serif" }}>
                      Reset filters
                    </motion.button>
                  </motion.div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '14px' }}>
                    {filteredProducts.map((p, i) => (
                      <ProductCard key={p.productId} product={p} onAdd={handleAddToCart} onNavigate={handleNavigate} inCart={cart.some(c => c.productId === p.productId)} index={i} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '16px 28px 40px' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '20px', padding: '28px',
                  backdropFilter: 'blur(16px)',
                }}>
                  <div style={{ marginBottom: '28px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: '0 0 6px', fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.5px' }}>Product Tree</h2>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>Products grouped by family, sorted by tier. Click any card to view details.</p>
                  </div>
                  <TreeView products={filteredProducts} onNavigate={handleNavigate} onAdd={handleAddToCart} cart={cart} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800&family=Geist:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        input::placeholder { color: rgba(255,255,255,0.22) !important; }
        select option { background: #0a1628; color: #fff; }
      `}</style>
    </div>
  );
}