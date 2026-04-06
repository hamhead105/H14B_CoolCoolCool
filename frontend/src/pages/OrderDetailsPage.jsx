import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';

const API_BASE = 'https://h14-b-cool-cool-cool.vercel.app';

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const role = localStorage.getItem('role'); // 'buyer' or 'seller'

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    // Fetch all and find the specific one (safest if no GET /orders/:id route exists)
    fetch(`${API_BASE}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const found = data.find(o => o.orderId === orderId);
        setOrder(found);
      })
      .finally(() => setLoading(false));
  }, [orderId, navigate]);

  const handleDespatch = async () => {
    setConfirming(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'despatched' })
      });
      if (!res.ok) throw new Error('Failed to despatch');
      
      setOrder({ ...order, status: 'despatched' });
    } catch (err) {
      alert("Error despatching order.");
    } finally {
      setConfirming(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'confirmed' })
      });
      if (!res.ok) throw new Error('Failed to confirm');
      
      // Update local state to show confirmation instantly
      setOrder({ ...order, status: 'confirmed' });
    } catch (err) {
      alert("Error confirming order. Make sure backend PUT route is setup!");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return null; // Add your standard spinner here
  if (!order) return <div style={{ color: 'white', padding: '50px' }}>Order not found.</div>;

  const items = order.inputData?.items || [];
  const buyerInfo = order.inputData?.buyer || {};
  const isSeller = role === 'seller';
  const isPending = order.status === 'order placed' || order.status === 'pending';

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a', fontFamily: "'Geist','DM Sans',sans-serif", overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        <header style={{ height: '60px', padding: '0 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(5,13,26,0.7)', borderBottom: '1px solid rgba(255,255,255,0.07)', zIndex: 10 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← Back
          </button>
          {/* Action Buttons for Seller */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {isSeller && isPending && (
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleConfirm} disabled={confirming}
                style={{ background: '#2563eb', border: 'none', borderRadius: '8px', padding: '8px 16px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer', opacity: confirming ? 0.5 : 1 }}
              >
                {confirming ? 'Processing...' : 'Confirm Order'}
              </motion.button>
            )}

            {/* 👇 NEW: Show Despatch button if order is already confirmed! */}
            {isSeller && order.status === 'confirmed' && (
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleDespatch} disabled={confirming}
                style={{ background: '#16a34a', border: 'none', borderRadius: '8px', padding: '8px 16px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer', opacity: confirming ? 0.5 : 1 }}
              >
                {confirming ? 'Processing...' : 'Despatch Order'}
              </motion.button>
            )}
          </div>
        </header>

        <main style={{ flex: 1, padding: '36px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', fontFamily: "'Bricolage Grotesque', sans-serif", margin: '0 0 8px' }}>Order {order.orderId}</h1>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Placed on {new Date(order.createdAt).toLocaleString()}</div>
            </div>
            <div style={{ background: isPending ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)', color: isPending ? '#fbbf24' : '#60a5fa', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: `1px solid ${isPending ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.3)'}` }}>
              {order.status.toUpperCase()}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Buyer Details */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '0 0 16px' }}>Buyer Information</h3>
              <div style={{ fontSize: '13px', color: '#fff', marginBottom: '4px', fontWeight: '600' }}>{buyerInfo.name || 'Unknown'}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{buyerInfo.email}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>ABN: {buyerInfo.companyId}</div>
            </div>
            
            {/* Financial Summary */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '0 0 16px' }}>Order Summary</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                <span>Subtotal</span><span>${Number(order.totalCost - (order.taxAmount||0)).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
                <span>Tax (GST)</span><span>${Number(order.taxAmount||0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', color: '#fff', fontWeight: '700', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                <span>Total</span><span>${Number(order.totalCost).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '0 0 16px' }}>Line Items</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <div>Product</div><div>Qty</div><div style={{ textAlign: 'right' }}>Price</div>
            </div>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '13px', color: '#fff' }}>
                <div style={{ fontWeight: '500' }}>{item.product?.name || `Item ${i+1}`}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)' }}>x{item.quantity}</div>
                <div style={{ textAlign: 'right', fontWeight: '600' }}>${Number(item.priceAmount).toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* UBL Document Preview */}
          {order.inputData?.ublDocument && (
            <div style={{ background: '#0a0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>
                UBL 2.1 XML PAYLOAD
              </div>
              <div style={{ padding: '24px', overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                <pre style={{ margin: 0, color: '#a78bfa', fontSize: '12px', fontFamily: 'monospace', lineHeight: '1.6' }}>
                  <code>{order.inputData.ublDocument}</code>
                </pre>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}