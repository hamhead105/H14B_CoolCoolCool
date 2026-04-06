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
  const [devView, setDevView] = useState('xml');
  const role = localStorage.getItem('role');
  const currentSellerId = localStorage.getItem('sellerId');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    fetch(`${API_BASE}/orders/${orderId}`, { 
      headers: { Authorization: `Bearer ${token}` } 
    })
      .then(r => r.json())
      .then(data => setOrder(data))
      .finally(() => setLoading(false));
  }, [orderId, navigate]);

  if (loading) return null;
  if (!order) return <div style={{ color: 'white', padding: '50px' }}>Order not found.</div>;

  const input = order.inputData || {};
  const allItems = input.items || [];
  
  // Logic for Seller View
  const myItems = allItems.filter(item => String(item.sellerId) === String(currentSellerId));
  const otherItems = allItems.filter(item => String(item.sellerId) !== String(currentSellerId));
  
  const mySubtotal = myItems.reduce((sum, i) => sum + (Number(i.priceAmount) * Number(i.quantity)), 0);
  const isSeller = role === 'seller';

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a', fontFamily: "'Geist', sans-serif", overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0 }}>
        
        {/* Header */}
        <header style={{ height: '60px', padding: '0 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(5,13,26,0.7)', borderBottom: '1px solid rgba(255,255,255,0.07)', zIndex: 10 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
          <div style={{ fontSize: '12px', color: '#60a5fa', fontWeight: '700', letterSpacing: '1px' }}>
            {isSeller ? "SELLER WORKSPACE" : "BUYER VIEW"}
          </div>
        </header>

        <main style={{ flex: 1, padding: '36px', overflowY: 'auto' }}>
          
          {/* Title & Global Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', margin: '0 0 8px' }}>Order {order.orderId}</h1>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Placed on {new Date(order.createdAt).toLocaleString()}</div>
            </div>
            {/* Status Badge Fix */}
            <div style={{ 
              background: 'rgba(96,165,250,0.1)', 
              color: '#60a5fa', 
              padding: '8px 20px', 
              borderRadius: '12px', 
              fontSize: '12px', 
              fontWeight: '800', 
              border: '1px solid rgba(96,165,250,0.3)',
              boxShadow: '0 0 20px rgba(59,130,246,0.1)'
            }}>
              {order.status?.toUpperCase()}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Buyer Details */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '16px', letterSpacing: '1px' }}>BUYER</h3>
              <div style={{ color: '#fff', fontWeight: '600', fontSize: '16px' }}>{input.buyer?.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>{input.buyer?.email}</div>
            </div>

            {/* Financial Summary with Split Totals */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '16px', letterSpacing: '1px' }}>FINANCIALS</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Total Order Cost</span>
                <span style={{ color: '#fff', fontWeight: '700' }}>${Number(order.totalCost).toFixed(2)}</span>
              </div>
              {isSeller && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: '600' }}>Your Items Subtotal</span>
                  <span style={{ color: '#4ade80', fontWeight: '800' }}>${mySubtotal.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Line Items - Split View for Sellers */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '16px', letterSpacing: '1px' }}>
              {isSeller ? "YOUR ITEMS TO FULFILL" : "ORDER ITEMS"}
            </h3>
            
            {/* Column Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '800' }}>
              <span>PRODUCT</span><span>QTY</span><span>UNIT PRICE</span><span>LINE TOTAL</span><span style={{ textAlign: 'right' }}>STATUS</span>
            </div>

            {/* My Items */}
            {(isSeller ? myItems : allItems).map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#fff', fontSize: '13px' }}>
                <div style={{ fontWeight: '600' }}>{item.product?.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)' }}>x{item.quantity}</div>
                <div>${Number(item.priceAmount).toFixed(2)}</div>
                <div style={{ fontWeight: '700', color: isSeller ? '#4ade80' : '#fff' }}>
                  ${(Number(item.priceAmount) * Number(item.quantity)).toFixed(2)}
                </div>
                <div style={{ textAlign: 'right', color: '#60a5fa', fontWeight: '800', fontSize: '11px' }}>
                  {item.itemStatus?.toUpperCase() || 'PENDING'}
                </div>
              </div>
            ))}

            {/* Other Items (Visible only to sellers) */}
            {isSeller && otherItems.length > 0 && (
              <>
                <h3 style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', margin: '32px 0 16px', letterSpacing: '1px' }}>OTHER ITEMS IN THIS ORDER (NOT YOURS)</h3>
                {otherItems.map((item, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '12px 0', opacity: 0.4, fontSize: '12px', color: '#fff' }}>
                    <div>{item.product?.name}</div>
                    <div>x{item.quantity}</div>
                    <div>${Number(item.priceAmount).toFixed(2)}</div>
                    <div>${(Number(item.priceAmount) * Number(item.quantity)).toFixed(2)}</div>
                    <div style={{ textAlign: 'right' }}>{item.itemStatus || 'Pending'}</div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Developer Payload - FIX: word-break and white-space */}
          <div style={{ background: '#0a0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.3)' }}>DEVELOPER PAYLOAD</span>
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '8px' }}>
                <button onClick={() => setDevView('xml')} style={{ padding: '4px 12px', background: devView === 'xml' ? 'rgba(255,255,255,0.1)' : 'transparent', color: devView === 'xml' ? '#fff' : '#555', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: '700' }}>UBL XML</button>
                <button onClick={() => setDevView('json')} style={{ padding: '4px 12px', background: devView === 'json' ? 'rgba(255,255,255,0.1)' : 'transparent', color: devView === 'json' ? '#fff' : '#555', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: '700' }}>RAW JSON</button>
              </div>
            </div>
            <div style={{ padding: '24px', maxHeight: '400px', overflowY: 'auto' }}>
              <pre style={{ 
                margin: 0, 
                color: devView === 'xml' ? '#a78bfa' : '#60a5fa', 
                fontSize: '12px', 
                fontFamily: 'monospace', 
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',       // 👈 CRITICAL FIX
                wordBreak: 'break-all',      // 👈 CRITICAL FIX
              }}>
                <code>
                  {devView === 'xml' 
                    ? (input.ublDocument || 'Generating UBL Document...') 
                    : JSON.stringify(order, null, 2)}
                </code>
              </pre>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}