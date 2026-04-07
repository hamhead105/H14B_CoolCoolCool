import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Spline from '@splinetool/react-spline';
import Sidebar from '../components/Sidebar';

const API_BASE = 'https://h14-b-cool-cool-cool.vercel.app';
const SPLINE_SCENE = "https://prod.spline.design/5TLD-UnzZT3azicG/scene.splinecode";

// ── Icons ─────────────────────────────────────────────────────
const IcOrders = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

// ── Status Badge Component ────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending:    { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', dot: '#f59e0b', label: 'Pending' },
    confirmed:  { bg: 'rgba(37,99,235,0.12)',  color: '#60a5fa', dot: '#3b82f6', label: 'Confirmed' },
    despatched: { bg: 'rgba(16,185,129,0.12)', color: '#34d399', dot: '#10b981', label: 'Despatched' },
    cancelled:  { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', dot: '#ef4444', label: 'Cancelled' },
  };
  const s = map[status?.toLowerCase()] || map.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: s.bg, color: s.color,
      fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
      padding: '4px 12px', borderRadius: '20px',
      border: `1px solid ${s.dot}30`,
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot }} />
      {s.label}
    </span>
  );
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [splineLoaded, setSplineLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const currentSellerId = localStorage.getItem('sellerId');
    if (!token) { navigate('/login'); return; }

    fetch(`${API_BASE}/orders`, { 
      headers: { Authorization: `Bearer ${token}` } 
    })
      .then(r => r.json())
      .then(data => {
        const myOrders = data.reduce((acc, order) => {
          const allItems = order.inputData?.items || [];
          const myItems = allItems.filter(item => String(item.sellerId) === String(currentSellerId));
          
          if (myItems.length > 0) {
            const myTotal = myItems.reduce((sum, item) => sum + (Number(item.priceAmount) * Number(item.quantity)), 0);
            const buyerName = order.inputData?.buyer?.name || order.buyerId || 'Unknown Buyer';
            const myItemStatus = myItems[0]?.itemStatus || order.status || 'pending';

            acc.push({
              ...order,
              myItemsCount: myItems.length,
              myTotalCost: myTotal, 
              displayBuyerName: buyerName,
              mySpecificStatus: myItemStatus
            });
          }
          return acc;
        }, []);
        setOrders(myOrders);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [navigate]);

  const getNormalizedStatus = (statusStr) => {
    if (!statusStr) return 'pending';
    const s = statusStr.toLowerCase();
    return s === 'order placed' ? 'pending' : s;
  };

  const filtered = filter === 'all' 
    ? orders 
    : orders.filter(o => getNormalizedStatus(o.mySpecificStatus) === filter);

  const tabs = [
    { key: 'all', label: 'All Orders' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'despatched', label: 'Despatched' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#3b82f6', borderRadius: '50%' }} 
        />
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a', fontFamily: "'Geist', sans-serif", overflow: 'hidden' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        
        {/* ── Spline Background (Flipped Horizontally) ── */}
        <div style={{ 
            position: 'fixed', 
            inset: 0, 
            left: '410px', 
            zIndex: 0, 
            pointerEvents: 'none',
            opacity: splineLoaded ? 0.6 : 0,
            transition: 'opacity 1.5s ease-in-out',
            transform: 'scale(1.2) translateY(50px) scaleX(-1)'
        }}>
          <Spline 
            scene={SPLINE_SCENE} 
            onLoad={() => setSplineLoaded(true)}
          />
        </div>

        {/* ── Background Grid ── */}
        <div style={{ position: 'fixed', inset: 0, left: '254px', zIndex: 1, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
            <div style={{ position: 'absolute', top: '-10%', right: '10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />
        </div>

        {/* ── Header ── */}
        <header style={{ height: '70px', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(5,13,26,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', zIndex: 10 }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>Incoming Orders</h1>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>Fulfill your item allocations</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
             <div style={{ textAlign: 'right' }}>
               <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Volume</div>
               <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{orders.length}</div>
             </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '40px', overflowY: 'auto', position: 'relative', zIndex: 5 }}>
          
          {/* ── Tabs ── */}
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', width: 'fit-content', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setFilter(t.key)}
                style={{
                  padding: '8px 20px', border: 'none', borderRadius: '9px', cursor: 'pointer',
                  background: filter === t.key ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: filter === t.key ? '#fff' : 'rgba(255,255,255,0.4)',
                  fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
                }}
              >{t.label}</button>
            ))}
          </div>

          {/* ── Table Container ── */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden', backdropFilter: 'blur(24px)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  {['Order ID', 'Buyer', 'Your Items', 'Your Revenue', 'Date', 'Your Status', ''].map(h => (
                    <th key={h} style={{ padding: '18px 24px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode='popLayout'>
                  {filtered.map((order, i) => (
                    <motion.tr 
                      key={order.orderId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '20px 24px', color: '#fff', fontWeight: '700', fontSize: '14px', fontFamily: 'monospace' }}>#{order.orderId.split('-').pop()}</td>
                      <td style={{ padding: '20px 24px', color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>{order.displayBuyerName}</td>
                      <td style={{ padding: '20px 24px', color: 'rgba(255,255,255,0.5)' }}>{order.myItemsCount} SKU{order.myItemsCount !== 1 ? 's' : ''}</td>
                      <td style={{ padding: '20px 24px', color: '#fff', fontWeight: '800' }}>${Number(order.myTotalCost).toFixed(2)}</td>
                      <td style={{ padding: '20px 24px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>{new Date(order.createdAt).toLocaleDateString('en-AU')}</td>
                      <td style={{ padding: '20px 24px' }}>
                        <StatusBadge status={getNormalizedStatus(order.mySpecificStatus)} />
                      </td>
                      <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                        <motion.button 
                          whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigate(`/orders/${order.orderId}`)}
                          style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Details
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div style={{ padding: '80px 0', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
                <IcOrders />
                <div style={{ marginTop: '12px', fontSize: '14px' }}>No orders found in this category.</div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}