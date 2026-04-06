import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import Spline from '@splinetool/react-spline';
import Sidebar from '../components/Sidebar';

const API_BASE = 'https://h14-b-cool-cool-cool.vercel.app';
const SPLINE_URL = 'https://prod.spline.design/uuHgNblqFyjBE7WO/scene.splinecode';

// ── Holographic Stage Component ──────────────────────────────
const HologramStage = ({ family, color = "#60a5fa" }) => {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '350px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      perspective: '1000px',
      background: 'radial-gradient(circle, rgba(96,165,250,0.05) 0%, transparent 70%)',
    }}>
      {/* Floating Icon */}
      <motion.div
        animate={{ y: [0, -20, 0], rotateY: [0, 360] }}
        transition={{ 
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          rotateY: { duration: 15, repeat: Infinity, ease: "linear" }
        }}
        style={{ zIndex: 10, color: color, filter: `drop-shadow(0 0 15px ${color}88)` }}
      >
        <FamilyIcon family={family} size={100} />
      </motion.div>

      {/* Spinner Rings */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        style={{ position: 'absolute', width: '280px', height: '280px', border: `1px dashed ${color}33`, borderRadius: '50%' }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        style={{ position: 'absolute', width: '220px', height: '220px', border: `2px solid ${color}11`, borderRadius: '50%', borderTopColor: color }}
      />

      {/* Ground Glow */}
      <div style={{
        position: 'absolute', bottom: '40px', width: '120px', height: '24px',
        background: `radial-gradient(ellipse, ${color}44 0%, transparent 70%)`,
        filter: 'blur(8px)', transform: 'rotateX(75deg)'
      }} />
    </div>
  );
};

const FamilyIcon = ({ family, size = 24 }) => {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5" };
  if (family === 'Packaging') return <svg {...props}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>;
  if (family === 'Office') return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
  if (family === 'Hardware') return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>;
  return <svg {...props}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>;
};

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [splineLoaded, setSplineLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    Promise.all([
      fetch(`${API_BASE}/products/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_BASE}/products/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([p, all]) => {
      setProduct(p);
      setRelated(all.filter(x => x.productId !== p.productId && x.family === p.family).slice(0, 4));
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setAdded(cart.some(c => c.productId === p.productId));
    }).finally(() => setLoading(false));
  }, [id, navigate]);

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const idx = cart.findIndex(c => c.productId === product.productId);
    if (idx > -1) cart[idx].qty += qty;
    else cart.push({ ...product, qty });
    localStorage.setItem('cart', JSON.stringify(cart));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <div style={{ background: '#050d1a', height: '100vh' }} />;

  const finalPrice = product.onSpecial ? (product.cost * (1 - product.discount)) : Number(product.cost);
  const accentColor = product.onSpecial ? "#fbbf24" : "#60a5fa";

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a', color: '#fff', fontFamily: "'Geist', sans-serif", overflow: 'hidden' }}>
      <Sidebar />

      {/* Spline Atmosphere */}
      <div style={{ position: 'fixed', inset: 0, left: '220px', zIndex: 0, opacity: splineLoaded ? 0.4 : 0, transition: 'opacity 2s' }}>
        <Spline scene={SPLINE_URL} onLoad={() => setSplineLoaded(true)} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #050d1a 0%, transparent 20%, transparent 80%, #050d1a 100%)' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        <header style={{ height: '64px', padding: '0 40px', display: 'flex', alignItems: 'center', background: 'rgba(5,13,26,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={() => navigate('/products')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ← Back to Catalog
          </button>
        </header>

        <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px' }}>
            
            {/* Left Column: Hologram & Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', backdropFilter: 'blur(20px)' }}
              >
                <HologramStage family={product.family} color={accentColor} />
              </motion.div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px' }}>
                <h2 style={{ fontSize: '12px', fontWeight: '800', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px' }}>Technical Description</h2>
                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.8' }}>{product.description}</p>
              </div>
            </div>

            {/* Right Column: Checkout Glass Card */}
            <div style={{ position: 'sticky', top: '0' }}>
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px', backdropFilter: 'blur(40px)', boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }}
              >
                <div style={{ fontSize: '12px', fontWeight: '700', color: accentColor, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{product.brand}</div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '24px', fontFamily: "'Bricolage Grotesque', sans-serif" }}>{product.name}</h1>
                
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '32px' }}>
                  <span style={{ fontSize: '36px', fontWeight: '800', color: '#fff' }}>${finalPrice.toFixed(2)}</span>
                  {product.onSpecial && <span style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>${Number(product.cost).toFixed(2)}</span>}
                </div>

                {/* Technical Specs List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                  {[
                    { label: 'Classification', value: `Tier ${product.productTier || 1}` },
                    { label: 'Asset ID', value: product.productId },
                    { label: 'Network Category', value: product.family },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>{s.value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <button onClick={() => setQty(Math.max(1, qty-1))} style={{ padding: '12px 18px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>-</button>
                      <span style={{ width: '30px', textAlign: 'center', fontWeight: '700' }}>{qty}</span>
                      <button onClick={() => setQty(qty+1)} style={{ padding: '12px 18px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>+</button>
                   </div>
                   <motion.button
                    whileHover={{ scale: 1.02, boxShadow: `0 0 20px ${accentColor}44` }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCart}
                    style={{ flex: 1, background: added ? '#10b981' : `linear-gradient(135deg, ${accentColor}, #7c3aed)`, border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '800', cursor: 'pointer', transition: 'background 0.3s' }}
                   >
                    {added ? 'ADDED TO DATASET' : 'ADD TO PROCUREMENT'}
                   </motion.button>
                </div>
                
                <div style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.5px' }}>
                  LINE TOTAL: ${(finalPrice * qty).toFixed(2)} AUD
                </div>
              </motion.div>
            </div>
          </div>

          {/* Related Products Grid */}
          {related.length > 0 && (
            <div style={{ marginTop: '80px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '24px', fontFamily: "'Bricolage Grotesque', sans-serif" }}>Synchronized Assets</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                {related.map(p => (
                  <motion.div 
                    key={p.productId} whileHover={{ y: -8 }} onClick={() => navigate(`/products/${p.productId}`)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
                  >
                    <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor, marginBottom: '16px' }}>
                      <FamilyIcon family={p.family} size={32} />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{p.name}</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: accentColor, marginTop: '8px' }}>${Number(p.cost).toFixed(2)}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}