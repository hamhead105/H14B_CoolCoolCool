import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';

const API_BASE = 'https://h14-b-cool-cool-cool.vercel.app';

const STATUS_STYLES = {
  pending: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', dot: '#f59e0b' },
  confirmed: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', dot: '#3b82f6' },
  despatched: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80', dot: '#22c55e' },
  cancelled: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', dot: '#ef4444' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status?.toLowerCase()] || STATUS_STYLES.pending;
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: s.bg, color: s.color, fontSize: '11px', fontWeight: '700',
      padding: '4px 10px', borderRadius: '20px', border: `1px solid ${s.dot}30`,
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot }} />
      {label}
    </span>
  );
}

export default function BuyerOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const buyerId = localStorage.getItem('buyerId');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !buyerId) { navigate('/login'); return; }

    fetch(`${API_BASE}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        // Bulletproof frontend filter (just in case backend doesn't filter)
        const myOrders = Array.isArray(data) ? data.filter(order => {
          if (!order.inputData) return false;
          const target = String(buyerId);
          return String(order.buyerId) === target || String(order.inputData.buyer?.buyerId) === target || String(order.inputData.buyerId) === target;
        }) : [];
        setOrders(myOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      })
      .finally(() => setLoading(false));
  }, [buyerId, navigate]);

  const getNormalizedStatus = (rawStatus) => {
    if (!rawStatus) return 'pending';
    const s = rawStatus.toLowerCase();
    if (s === 'order placed') return 'pending';
    return s;
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => getNormalizedStatus(o.status) === filter);
  const tabs = [
    { key: 'all', label: 'All Orders' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'despatched', label: 'Despatched' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a', fontFamily: "'Geist','DM Sans',sans-serif", overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        {/* Background Glows */}
        <div style={{ position: 'absolute', top: '-10%', left: '10%', width: '700px', height: '600px', background: 'radial-gradient(ellipse, rgba(37,99,235,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
        
        <header style={{ height: '60px', padding: '0 36px', display: 'flex', alignItems: 'center', background: 'rgba(5,13,26,0.7)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.07)', zIndex: 10 }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', fontFamily: "'Bricolage Grotesque', sans-serif" }}>Purchase History</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{orders.length} total orders</div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '36px', overflowY: 'auto', zIndex: 1 }}>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#fff', fontFamily: "'Bricolage Grotesque', sans-serif", margin: '0 0 8px', letterSpacing: '-1px' }}>Your Orders</h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Track and view details of your wholesale purchases.</p>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setFilter(t.key)}
                style={{
                  padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s',
                  background: filter === t.key ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.03)',
                  color: filter === t.key ? '#60a5fa' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${filter === t.key ? 'rgba(37,99,235,0.4)' : 'rgba(255,255,255,0.08)'}`
                }}
              >{t.label}</button>
            ))}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 120px', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
              {['Order ID', 'Date', 'Total', 'Status', 'Action'].map(h => <div key={h} style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</div>)}
            </div>
            
            <AnimatePresence>
              {filtered.map((order, i) => (
                <motion.div key={order.orderId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 120px', padding: '16px 24px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', fontFamily: 'monospace' }}>{order.orderId}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{new Date(order.createdAt).toLocaleDateString('en-AU')}</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>${Number(order.totalCost || 0).toFixed(2)}</div>
                  <div><StatusBadge status={getNormalizedStatus(order.status)} /></div>
                  <div>
                    <button onClick={() => navigate(`/orders/${order.orderId}`)}
                      style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    >View</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filtered.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>No orders found.</div>}
          </div>
        </main>
      </div>
    </div>
  );
}