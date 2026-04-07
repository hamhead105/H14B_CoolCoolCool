import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../apiConfig.js';

function SpecialCard({ product, salePrice, saving, inCart, onNavigate, onAdd }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onNavigate}
      style={{
        background: hovered ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.08)'}`,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '16px', overflow: 'hidden', cursor: 'pointer',
        transition: 'all 0.22s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(245,158,11,0.1)' : '0 4px 24px rgba(0,0,0,0.25)',
      }}
    >
      <div style={{
        height: '120px',
        background: hovered ? 'linear-gradient(135deg,rgba(245,158,11,0.14),rgba(239,68,68,0.1))' : 'linear-gradient(135deg,rgba(245,158,11,0.07),rgba(239,68,68,0.05))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.25s', position: 'relative',
      }}>
        {hovered && (
          <motion.div initial={{ x: '-100%' }} animate={{ x: '200%' }} transition={{ duration: 0.55 }}
            style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)', pointerEvents: 'none' }} />
        )}
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px',
          background: hovered ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${hovered ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.1)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: hovered ? '#fbbf24' : 'rgba(255,255,255,0.3)', transition: 'all 0.22s',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
        </div>
        <div style={{
          position: 'absolute', bottom: '10px', right: '12px',
          background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: '10px', padding: '2px 8px',
          fontSize: '11px', fontWeight: '700', color: '#4ade80',
        }}>Save ${saving}</div>
      </div>

      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>
          {product.brand} · {product.family}
        </div>
        <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '6px', lineHeight: '1.3', fontFamily: "'Bricolage Grotesque',sans-serif", letterSpacing: '-0.2px' }}>
          {product.name}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '14px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.description || 'No description available.'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px' }}>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#fbbf24', fontFamily: "'Bricolage Grotesque',sans-serif", letterSpacing: '-0.5px' }}>${salePrice}</span>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>${Number(product.cost).toFixed(2)}</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={e => { e.stopPropagation(); onAdd(); }}
            style={{
              padding: '8px 16px',
              background: inCart ? 'rgba(74,222,128,0.15)' : 'linear-gradient(135deg,#2563eb,#7c3aed)',
              border: inCart ? '1px solid rgba(74,222,128,0.35)' : 'none',
              borderRadius: '9px', fontSize: '12px', fontWeight: '700',
              color: inCart ? '#4ade80' : '#fff', cursor: 'pointer',
              fontFamily: "'Geist',sans-serif",
              boxShadow: inCart ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
            }}
          >{inCart ? 'Added' : 'Add to cart'}</motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function SpecialsPage() {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('');
  const [sortBy, setSortBy] = useState('discount');
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetch(`${API_BASE}/products/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (r.status === 401) { navigate('/login'); throw new Error(); } return r.json(); })
      .then(data => { setAllProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [navigate]);

  const specials = allProducts.filter(p => p.onSpecial);
  const families = [...new Set(specials.map(p => p.family).filter(Boolean))];

  const filtered = specials
    .filter(p => {
      if (selectedFamily && p.family !== selectedFamily) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.brand?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'discount') return (b.discount || 0) - (a.discount || 0);
      if (sortBy === 'price-low') return a.cost - b.cost;
      if (sortBy === 'price-high') return b.cost - a.cost;
      return a.name.localeCompare(b.name);
    });

  const handleAdd = (product) => {
    const updated = [...cart];
    const idx = updated.findIndex(i => i.productId === product.productId);
    if (idx > -1) updated[idx].qty += 1;
    else updated.push({ ...product, qty: 1 });
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a', fontFamily: "'Geist',sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            style={{ width: '36px', height: '36px', border: '2px solid rgba(255,255,255,0.06)', borderTopColor: '#f59e0b', borderRadius: '50%', margin: '0 auto 14px' }} />
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Loading specials…</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#050d1a', fontFamily: "'Geist','DM Sans',sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        <header style={{
          height: '60px', padding: '0 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(5,13,26,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 10px rgba(245,158,11,0.8)' }} />
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff', fontFamily: "'Bricolage Grotesque',sans-serif", letterSpacing: '-0.3px' }}>Live Specials</span>
            <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: '700', color: '#fbbf24' }}>
              {specials.length} deals
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.28)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search specials…"
                style={{ padding: '8px 12px 8px 32px', width: '200px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '9px', fontSize: '12px', color: '#fff', outline: 'none', fontFamily: "'Geist',sans-serif" }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
              />
            </div>
            <select value={selectedFamily} onChange={e => setSelectedFamily(e.target.value)}
              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '9px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', outline: 'none', fontFamily: "'Geist',sans-serif", cursor: 'pointer' }}>
              <option value="" style={{ background: '#0a1628' }}>All categories</option>
              {families.map(f => <option key={f} value={f} style={{ background: '#0a1628' }}>{f}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '9px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', outline: 'none', fontFamily: "'Geist',sans-serif", cursor: 'pointer' }}>
              <option value="discount" style={{ background: '#0a1628' }}>Highest discount</option>
              <option value="price-low" style={{ background: '#0a1628' }}>Price: low to high</option>
              <option value="price-high" style={{ background: '#0a1628' }}>Price: high to low</option>
              <option value="name" style={{ background: '#0a1628' }}>Name</option>
            </select>
          </div>
        </header>

        <div style={{ padding: '28px 32px 20px', background: 'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(239,68,68,0.06))', borderBottom: '1px solid rgba(245,158,11,0.12)', flexShrink: 0 }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22,1,0.36,1] }}>
            <h1 style={{ fontSize: 'clamp(26px,3vw,38px)', fontWeight: '800', color: '#fff', fontFamily: "'Bricolage Grotesque',sans-serif", letterSpacing: '-1.5px', lineHeight: 1.1, margin: '0 0 6px' }}>
              Limited-time deals.{' '}
              <span style={{ background: 'linear-gradient(90deg,#fbbf24,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Act fast.</span>
            </h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.38)', margin: 0 }}>
              {filtered.length} of {specials.length} active specials from verified Australian suppliers.
            </p>
          </motion.div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 40px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <div style={{ width: '52px', height: '52px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#f59e0b' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              </div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'rgba(255,255,255,0.55)', marginBottom: '8px', fontFamily: "'Bricolage Grotesque',sans-serif" }}>No specials match</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.28)' }}>Try clearing your filters.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
              <AnimatePresence>
                {filtered.map((product, i) => {
                  const salePrice = (product.cost * (1 - product.discount)).toFixed(2);
                  const saving = (product.cost - parseFloat(salePrice)).toFixed(2);
                  const inCart = cart.some(c => c.productId === product.productId);
                  return (
                    <motion.div key={product.productId} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      transition={{ delay: (i % 12) * 0.04, duration: 0.45, ease: [0.22,1,0.36,1] }}
                      style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute', top: '-1px', left: '16px', zIndex: 2,
                        background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                        color: '#fff', fontSize: '11px', fontWeight: '800',
                        padding: '3px 10px', borderRadius: '0 0 9px 9px',
                        boxShadow: '0 4px 14px rgba(239,68,68,0.4)', letterSpacing: '0.3px',
                      }}>-{Math.round(product.discount * 100)}% OFF</div>
                      <SpecialCard product={product} salePrice={salePrice} saving={saving} inCart={inCart}
                        onNavigate={() => navigate(`/products/${product.productId}`)}
                        onAdd={() => handleAdd(product)} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Geist:wght@400;600;700&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:4px;}
        input::placeholder{color:rgba(255,255,255,0.22)!important;}
        select option{background:#0a1628;color:#fff;}
      `}</style>
    </div>
  );
}