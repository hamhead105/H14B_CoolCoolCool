import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

// NOTE: Orders API endpoint not documented in spec — this page is built ready to
// integrate when available. Currently shows placeholder state with expected data shape.
// Replace ORDERS_ENDPOINT and response shape once the API is available.

const API_BASE = 'https://h14-b-cool-cool-cool.vercel.app';

const STATUS_STYLES = {
  pending: { bg: '#fef9ec', color: '#d97706', label: 'Pending' },
  confirmed: { bg: '#eff6ff', color: '#2563eb', label: 'Confirmed' },
  despatched: { bg: '#f0fdf4', color: '#16a34a', label: 'Despatched' },
  cancelled: { bg: '#fef2f2', color: '#dc2626', label: 'Cancelled' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: '11px', fontWeight: '700', padding: '3px 9px', borderRadius: '10px' }}>
      {s.label}
    </span>
  );
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const sellerId = localStorage.getItem('sellerId');
    if (!token) { navigate('/login'); return; }

    // Attempt to fetch orders — endpoint may not exist yet
    fetch(`${API_BASE}/orders?sellerId=${sellerId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.status === 401) { navigate('/login'); throw new Error('Unauthorized'); }
        if (!r.ok) throw new Error('Orders endpoint not available yet');
        return r.json();
      })
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const tabs = [
    { key: 'all', label: 'All orders' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'despatched', label: 'Despatched' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Loading orders…</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ background: '#fff', borderBottom: '1px solid #e8eaf0', padding: '0 28px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>Orders</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{orders.length} total order{orders.length !== 1 ? 's' : ''}</div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '6px', letterSpacing: '-0.3px' }}>Incoming Orders</h1>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Manage, confirm, and despatch buyer orders.</p>
          </div>

          {/* Tab filter */}
          <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '10px', width: 'fit-content', marginBottom: '24px' }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setFilter(t.key)}
                style={{
                  padding: '7px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                  background: filter === t.key ? '#fff' : 'transparent',
                  color: filter === t.key ? '#0f172a' : '#64748b',
                  fontSize: '12px', fontWeight: '600',
                  boxShadow: filter === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}
              >{t.label}</button>
            ))}
          </div>

          {error ? (
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8eaf0', padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '14px' }}>🔌</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Orders not available</div>
              <div style={{ fontSize: '13px', color: '#64748b', maxWidth: '360px', margin: '0 auto', lineHeight: '1.6' }}>
                {error === 'Orders endpoint not available yet'
                  ? 'The orders API endpoint is not yet implemented on the backend. This page is ready to display orders once the endpoint is available.'
                  : error
                }
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8eaf0', padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '14px' }}>📋</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>No orders yet</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>When buyers place orders for your products, they'll appear here.</div>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8eaf0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', background: '#f8fafc' }}>
                    {['Order ID', 'Buyer', 'Items', 'Total', 'Date', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(order => (
                    <tr key={order.orderId} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '13px 16px', fontWeight: '600', color: '#0f172a' }}>{order.orderId}</td>
                      <td style={{ padding: '13px 16px', color: '#64748b' }}>{order.buyerName || order.buyerId}</td>
                      <td style={{ padding: '13px 16px', color: '#64748b' }}>{order.items?.length ?? 0}</td>
                      <td style={{ padding: '13px 16px', fontWeight: '700', color: '#0f172a' }}>${Number(order.total || 0).toFixed(2)}</td>
                      <td style={{ padding: '13px 16px', color: '#64748b' }}>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-AU') : '—'}</td>
                      <td style={{ padding: '13px 16px' }}><StatusBadge status={order.status || 'pending'} /></td>
                      <td style={{ padding: '13px 16px' }}>
                        <button onClick={() => navigate(`/orders/${order.orderId}/despatch`)}
                          style={{ padding: '5px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#2563eb', cursor: 'pointer' }}>
                          Despatch →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}