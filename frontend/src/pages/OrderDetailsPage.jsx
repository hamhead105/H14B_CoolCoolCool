import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../apiConfig.js';
import { AnimatePresence } from 'framer-motion';

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [devView, setDevView] = useState('xml');
  const [rating, setRating] = useState(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [forwardEmail, setForwardEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const role = localStorage.getItem('role');
  const currentSellerId = localStorage.getItem('sellerId');
  const isSeller = role === 'seller';

  const toast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

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

  useEffect(() => {
    if (order) {
      const token = localStorage.getItem('token');
      fetch(`${API_BASE}/orders/${orderId}/rating`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => setRating(data))
        .catch(() => setRating(null));
    }
  }, [orderId, order?.orderId]);

  const handleForwardXML = async () => {
    if (!forwardEmail || !forwardEmail.includes('@')) {
      toast('Invalid email destination.');
      return;
    }
    setSendingEmail(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/orders/${orderId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipientEmail: forwardEmail })
      });
      if (res.ok) {
        toast('UBL XML dispatched successfully!');
        setForwardEmail('');
      } else {
        const data = await res.json();
        toast(data.error || 'Failed to route document.');
      }
    } catch (e) {
      toast('Network error. Check your uplink.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, sellerId: currentSellerId })
      });
      if (response.ok) {
        const updatedOrder = await response.json();
        setOrder(prev => ({
          ...prev,
          status: updatedOrder.status,
          inputData: updatedOrder.inputData
        }));
      } else {
        alert('Failed to update status. Please try again.');
      }
    } catch (error) {
      console.error(error);
      alert('Error updating status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (generatingInvoice) return;
    setGeneratingInvoice(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/orders/${orderId}/invoice`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(prev => ({
          ...prev,
          externalInvoiceId: data.invoice.invoice_id,
          invoiceStatus: data.invoice.status,
          invoiceMetadata: data.invoice,
        }));
        toast('Invoice generated successfully!');
      } else {
        const data = await res.json();
        toast(data.error || 'Failed to generate invoice.');
      }
    } catch (e) {
      toast('Network error.');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const submitRating = async () => {
    if (submittingRating) return;
    setSubmittingRating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/orders/${orderId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score: ratingScore, comment: ratingComment.trim() || null })
      });
      if (response.ok) {
        const data = await response.json();
        setRating(data);
        setShowRatingForm(false);
      } else {
        alert('Failed to submit rating. Please try again.');
      }
    } catch (error) {
      alert('Error submitting rating. Please try again.');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) return null;
  if (!order) return <div style={{ color: 'white', padding: '50px' }}>Order not found.</div>;

  const input = order.inputData || {};
  const allItems = input.items || [];
  const myItems = allItems.filter(item => String(item.sellerId) === String(currentSellerId));
  const otherItems = allItems.filter(item => String(item.sellerId) !== String(currentSellerId));
  const mySubtotal = myItems.reduce((sum, i) => sum + (Number(i.priceAmount) * Number(i.quantity)), 0);
  const myItemStatus = myItems.length > 0 ? (myItems[0].itemStatus?.toLowerCase() || 'pending') : 'pending';

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a', fontFamily: "'Geist', sans-serif", overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0 }}>

        <header style={{ height: '60px', padding: '0 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(5,13,26,0.7)', borderBottom: '1px solid rgba(255,255,255,0.07)', zIndex: 10 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
          <div style={{ fontSize: '12px', color: '#60a5fa', fontWeight: '700', letterSpacing: '1px' }}>
            {isSeller ? "SELLER WORKSPACE" : "BUYER VIEW"}
          </div>
        </header>

        <main style={{ flex: 1, padding: '36px', overflowY: 'auto' }}>

          {/* ── Title ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', margin: '0 0 8px' }}>Order {order.orderId}</h1>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Placed on {new Date(order.createdAt).toLocaleString()}</div>
            </div>
            <div style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', padding: '8px 20px', borderRadius: '12px', fontSize: '12px', fontWeight: '800', border: '1px solid rgba(96,165,250,0.3)' }}>
              {order.status?.toUpperCase()}
            </div>
          </div>

          {/* ── SELLER FULFILLMENT ACTIONS ── */}
          {isSeller && myItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '16px', padding: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div>
                <h3 style={{ fontSize: '12px', color: '#60a5fa', marginBottom: '4px', letterSpacing: '1px', fontWeight: '800' }}>FULFILLMENT ACTIONS</h3>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Current status of your items: <strong style={{ color: '#fff' }}>{myItemStatus.toUpperCase()}</strong></div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {myItemStatus === 'pending' && (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => handleStatusChange('confirmed')} disabled={updatingStatus}
                    style={{ padding: '10px 24px', background: '#3b82f6', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '700', cursor: updatingStatus ? 'wait' : 'pointer', opacity: updatingStatus ? 0.6 : 1 }}
                  >
                    {updatingStatus ? 'Syncing...' : 'Confirm Items'}
                  </motion.button>
                )}
                {myItemStatus === 'confirmed' && (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => handleStatusChange('despatched')} disabled={updatingStatus}
                    style={{ padding: '10px 24px', background: '#10b981', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '700', cursor: updatingStatus ? 'wait' : 'pointer', opacity: updatingStatus ? 0.6 : 1 }}
                  >
                    {updatingStatus ? 'Syncing...' : 'Mark as Despatched'}
                  </motion.button>
                )}
                {myItemStatus === 'despatched' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#4ade80', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      Items Despatched
                    </span>
                    {order.externalInvoiceId ? (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/orders/${orderId}/invoice`)}
                        style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                      >
                        View Invoice →
                      </motion.button>
                    ) : (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleGenerateInvoice} disabled={generatingInvoice}
                        style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: generatingInvoice ? 'wait' : 'pointer', opacity: generatingInvoice ? 0.6 : 1 }}
                      >
                        {generatingInvoice ? 'Generating...' : 'Generate Invoice'}
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── BUYER INVOICE BANNER ── */}
          {!isSeller && order.externalInvoiceId && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '16px', padding: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div>
                <h3 style={{ fontSize: '12px', color: '#06b6d4', marginBottom: '4px', letterSpacing: '1px', fontWeight: '800' }}>INVOICE AVAILABLE</h3>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                  Invoice ID: <span style={{ color: '#fff', fontFamily: 'monospace' }}>{order.externalInvoiceId}</span>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/orders/${orderId}/invoice`)}
                style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
              >
                View Invoice →
              </motion.button>
            </motion.div>
          )}

          {/* ── FINANCIALS + BUYER INFO ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '16px', letterSpacing: '1px' }}>BUYER</h3>
              <div style={{ color: '#fff', fontWeight: '600', fontSize: '16px' }}>{input.buyer?.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>{input.buyer?.email}</div>
            </div>
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

          {/* ── RATING ── */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '16px', letterSpacing: '1px' }}>ORDER RATING</h3>
            {rating ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} style={{ color: star <= rating.score ? '#fbbf24' : 'rgba(255,255,255,0.2)', fontSize: '18px' }}>★</span>
                    ))}
                  </div>
                  <span style={{ color: '#fbbf24', fontWeight: '700', fontSize: '14px' }}>{rating.score}/5</span>
                </div>
                {rating.comment && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontStyle: 'italic' }}>"{rating.comment}"</div>}
              </div>
            ) : role === 'buyer' ? (
              <div>
                {!showRatingForm ? (
                  <button onClick={() => setShowRatingForm(true)}
                    style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                  >Rate This Order</button>
                ) : (
                  <div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Rating (1-5 stars)</label>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} onClick={() => setRatingScore(star)}
                            style={{ background: 'none', border: 'none', color: star <= ratingScore ? '#fbbf24' : 'rgba(255,255,255,0.2)', fontSize: '24px', cursor: 'pointer' }}
                          >★</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Comment (optional)</label>
                      <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)} placeholder="Share your experience..."
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', minHeight: '80px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={submitRating} disabled={submittingRating}
                        style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: submittingRating ? 'not-allowed' : 'pointer', opacity: submittingRating ? 0.6 : 1 }}
                      >{submittingRating ? 'Submitting...' : 'Submit Rating'}</button>
                      <button onClick={() => setShowRatingForm(false)}
                        style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                      >Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontStyle: 'italic' }}>Not rated yet.</div>
            )}
          </div>

          {/* ── ITEMS ── */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '16px', letterSpacing: '1px' }}>
              {isSeller ? "YOUR ITEMS TO FULFILL" : "ORDER ITEMS"}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '800' }}>
              <span>PRODUCT</span><span>QTY</span><span>UNIT PRICE</span><span>LINE TOTAL</span><span style={{ textAlign: 'right' }}>STATUS</span>
            </div>
            {(isSeller ? myItems : allItems).map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#fff', fontSize: '13px' }}>
                <div style={{ fontWeight: '600' }}>{item.product?.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)' }}>x{item.quantity}</div>
                <div>${Number(item.priceAmount).toFixed(2)}</div>
                <div style={{ fontWeight: '700', color: isSeller ? '#4ade80' : '#fff' }}>${(Number(item.priceAmount) * Number(item.quantity)).toFixed(2)}</div>
                <div style={{ textAlign: 'right', color: '#60a5fa', fontWeight: '800', fontSize: '11px' }}>{item.itemStatus?.toUpperCase() || 'PENDING'}</div>
              </div>
            ))}
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

          {/* ── DEVELOPER PAYLOAD ── */}
          <div style={{ background: '#0a0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.3)' }}>DEVELOPER PAYLOAD</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="email" placeholder="Forward to email..." value={forwardEmail} onChange={e => setForwardEmail(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '4px 10px', color: '#fff', fontSize: '11px', outline: 'none' }}
                />
                <button onClick={handleForwardXML} disabled={sendingEmail}
                  style={{ padding: '4px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: '700' }}
                >{sendingEmail ? 'SENDING...' : 'SEND XML'}</button>
              </div>
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '8px' }}>
                <button onClick={() => setDevView('xml')} style={{ padding: '4px 12px', background: devView === 'xml' ? 'rgba(255,255,255,0.1)' : 'transparent', color: devView === 'xml' ? '#fff' : '#555', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: '700' }}>UBL XML</button>
                <button onClick={() => setDevView('json')} style={{ padding: '4px 12px', background: devView === 'json' ? 'rgba(255,255,255,0.1)' : 'transparent', color: devView === 'json' ? '#fff' : '#555', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: '700' }}>RAW JSON</button>
              </div>
            </div>
            <div style={{ padding: '24px', maxHeight: '400px', overflowY: 'auto' }}>
              <pre style={{ margin: 0, color: devView === 'xml' ? '#a78bfa' : '#60a5fa', fontSize: '12px', fontFamily: 'monospace', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                <code>{devView === 'xml' ? (input.ublDocument || 'Generating UBL Document...') : JSON.stringify(order, null, 2)}</code>
              </pre>
            </div>
          </div>

        </main>
      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            style={{ position: 'fixed', bottom: '40px', right: '40px', zIndex: 1000, background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '16px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 10px #60a5fa' }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}