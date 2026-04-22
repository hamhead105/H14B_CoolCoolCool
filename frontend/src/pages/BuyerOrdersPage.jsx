import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Spline from '@splinetool/react-spline';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../apiConfig.js';

const SPLINE_SCENE = "https://prod.spline.design/5TLD-UnzZT3azicG/scene.splinecode";

const STATUS_STYLES = {
  'order placed':       { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', dot: '#f59e0b',  label: 'Pending' },
  'pending':            { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', dot: '#f59e0b',  label: 'Pending' },
  'confirmed':          { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa', dot: '#3b82f6',  label: 'Confirmed' },
  'partially fulfilled':{ bg: 'rgba(139,92,246,0.15)', color: '#a78bfa', dot: '#7c3aed',  label: 'Partial' },
  'despatched':         { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80', dot: '#22c55e',  label: 'Despatched' },
  'invoiced':           { bg: 'rgba(6,182,212,0.12)',   color: '#06b6d4', dot: '#0891b2',  label: 'Invoiced' },
  'cancelled':          { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', dot: '#ef4444',  label: 'Cancelled' },
};

function StatusBadge({ status }) {
  const key = status?.toLowerCase() || 'pending';
  const s = STATUS_STYLES[key] || STATUS_STYLES['pending'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: s.bg, color: s.color, fontSize: '11px', fontWeight: '700',
      padding: '4px 10px', borderRadius: '20px', border: `1px solid ${s.dot}30`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

export default function BuyerOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const targetId = String(localStorage.getItem('buyerId'));

    if (!token || !targetId) { navigate('/login'); return; }

    setLoading(true);

    fetch(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        const myOrders = Array.isArray(data) ? data.filter(order => {
          const topLevelMatch = String(order.buyerId) === targetId;
          const nestedMatch = order.inputData && (
            String(order.inputData.buyerId) === targetId ||
            String(order.inputData.buyer?.buyerId) === targetId
          );
          return topLevelMatch || nestedMatch;
        }) : [];
        setOrders(myOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      })
      .catch(err => console.error('Network/Auth Error:', err))
      .finally(() => setTimeout(() => setLoading(false), 600));
  }, [navigate]);

  const filtered = filter === 'all'
    ? orders
    : orders.filter(o => {
        const s = o.status?.toLowerCase() || '';
        if (filter === 'pending') return s === 'order placed' || s === 'pending';
        return s === filter;
      });

  const tabs = [
    { key: 'all',                label: 'All' },
    { key: 'pending',            label: 'Pending' },
    { key: 'partially fulfilled',label: 'Partial' },
    { key: 'confirmed',          label: 'Confirmed' },
    { key: 'despatched',         label: 'Despatched' },
    { key: 'invoiced',           label: 'Invoiced' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a', fontFamily: "'Geist',sans-serif", overflow: 'hidden' }}>
      <Sidebar />

      {/* Spline background */}
      <div style={{
        position: 'fixed', inset: 0, left: '410px', zIndex: 0,
        pointerEvents: 'none', opacity: splineLoaded ? 0.6 : 0,
        transition: 'opacity 1.5s ease-in-out',
        transform: 'scale(1.2) translateY(50px)'
      }}>
        <Spline scene={SPLINE_SCENE} onLoad={() => setSplineLoaded(true)} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0, zIndex: 1 }}>

        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`, backgroundSize: '64px 64px', pointerEvents: 'none' }} />

        <header style={{ height: '64px', padding: '0 40px', display: 'flex', alignItems: 'center', background: 'rgba(5,13,26,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)', zIndex: 10 }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Purchase History</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{orders.length} total orders</div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '40px', overflowY: 'auto', position: 'relative' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#fff', margin: '0 0 8px', letterSpacing: '-1px' }}>Your Orders</h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Track and view details of your wholesale purchases.</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', overflow: 'hidden', backdropFilter: 'blur(24px)', minHeight: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '6px', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setFilter(t.key)}
                  style={{
                    padding: '5px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s',
                    background: filter === t.key ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: filter === t.key ? '#60a5fa' : 'rgba(255,255,255,0.3)',
                    border: `1px solid ${filter === t.key ? 'rgba(59,130,246,0.3)' : 'transparent'}`
                  }}
                >{t.label}</button>
              ))}
            </div>

            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.8fr 0.7fr 80px', padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
              {['Order ID', 'Date', 'Total', 'Status', 'Action'].map(h => (
                <div key={h} style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}
                >
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#3b82f6', borderRadius: '50%' }} />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontWeight: '600', letterSpacing: '1px' }}>SYNCING RECORDS...</span>
                </motion.div>
              ) : filtered.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ padding: '80px 0', textAlign: 'center' }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '16px', opacity: 0.5 }}>📂</div>
                  <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>No orders found.</div>
                </motion.div>
              ) : (
                <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {filtered.map((order, i) => (
                    <motion.div
                      key={order.orderId}
                      initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.8fr 0.7fr 80px', padding: '16px 24px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                      onClick={() => navigate(`/orders/${order.orderId}`)}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', fontFamily: 'monospace' }}>
                        #{order.orderId.split('-').pop()}
                      </div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-AU')}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>
                        ${Number(order.totalCost || 0).toFixed(2)}
                      </div>
                      {/* Fix: use order.status directly, not the undefined mySpecificStatus */}
                      <StatusBadge status={order.status} />
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/orders/${order.orderId}`); }}
                        style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '11px', fontWeight: '700', color: '#fff', cursor: 'pointer' }}
                      >View</button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}