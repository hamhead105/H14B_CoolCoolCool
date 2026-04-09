import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../apiConfig.js';

export default function InvoicePage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('xml');
  const [downloading, setDownloading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const toast = (msg) => { setToastMsg(msg); setShowToast(true); setTimeout(() => setShowToast(false), 3000); };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetch(`${API_BASE}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [orderId, navigate]);

  const handleDownloadXML = async () => {
    const invoiceId = order?.externalInvoiceId;
    if (!invoiceId) { toast('No invoice ID found on this order.'); return; }
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/invoices/${invoiceId}/xml`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch XML');
      const xml = await res.text();
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.xml`;
      a.click();
      URL.revokeObjectURL(url);
      toast('XML downloaded.');
    } catch (e) {
      toast('Failed to download XML.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{ width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#06b6d4', borderRadius: '50%' }} />
      </div>
    </div>
  );

  if (!order) return <div style={{ color: 'white', padding: '50px' }}>Order not found.</div>;

  const invoice = order.invoiceMetadata || {};
  const hasInvoice = !!order.externalInvoiceId;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a', fontFamily: "'Geist', sans-serif", overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        <header style={{ height: '60px', padding: '0 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(5,13,26,0.7)', borderBottom: '1px solid rgba(255,255,255,0.07)', zIndex: 10 }}>
          <button onClick={() => navigate(`/orders/${orderId}`)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px' }}>← Back to Order</button>
          <div style={{ fontSize: '12px', color: '#06b6d4', fontWeight: '700', letterSpacing: '1px' }}>INVOICE WORKSPACE</div>
        </header>

        <main style={{ flex: 1, padding: '36px', overflowY: 'auto' }}>

          {/* Title */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', margin: '0 0 8px', letterSpacing: '-1px' }}>
              Invoice {order.externalInvoiceId || '—'}
            </h1>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Order {orderId} · Despatched</div>
          </div>

          {/* Invoice summary cards */}
          {hasInvoice && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
              {[
                { label: 'Invoice ID', value: invoice.invoice_id || '—' },
                { label: 'Status', value: (invoice.status || '—').toUpperCase() },
                { label: 'Payable Amount', value: invoice.payable_amount != null ? `$${Number(invoice.payable_amount).toFixed(2)}` : '—' },
                { label: 'Due Date', value: invoice.due_date || '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', letterSpacing: '1px', marginBottom: '8px' }}>{label.toUpperCase()}</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{value}</div>
                </div>
              ))}
            </div>
          )}

          {!hasInvoice && (
            <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', padding: '24px', marginBottom: '28px', color: '#f87171', fontSize: '13px' }}>
              No invoice was generated for this order. This may be due to an error during despatch.
            </div>
          )}

          {/* Download button */}
          {hasInvoice && (
            <div style={{ marginBottom: '28px' }}>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleDownloadXML} disabled={downloading}
                style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: downloading ? 'wait' : 'pointer', opacity: downloading ? 0.7 : 1 }}
              >
                {downloading ? 'Downloading...' : '⬇ Download UBL XML'}
              </motion.button>
            </div>
          )}

          {/* XML / JSON viewer */}
          <div style={{ background: '#0a0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.3)' }}>INVOICE PAYLOAD</span>
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '8px' }}>
                <button onClick={() => setView('xml')} style={{ padding: '4px 12px', background: view === 'xml' ? 'rgba(255,255,255,0.1)' : 'transparent', color: view === 'xml' ? '#fff' : '#555', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: '700' }}>UBL XML</button>
                <button onClick={() => setView('json')} style={{ padding: '4px 12px', background: view === 'json' ? 'rgba(255,255,255,0.1)' : 'transparent', color: view === 'json' ? '#fff' : '#555', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: '700' }}>RAW JSON</button>
              </div>
            </div>
            <div style={{ padding: '24px', maxHeight: '420px', overflowY: 'auto' }}>
              <pre style={{ margin: 0, color: view === 'xml' ? '#a78bfa' : '#06b6d4', fontSize: '12px', fontFamily: 'monospace', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                <code>
                  {view === 'xml'
                    ? (order.inputData?.ublDocument || 'No UBL document available.')
                    : JSON.stringify(invoice, null, 2)}
                </code>
              </pre>
            </div>
          </div>

        </main>
      </div>

      {/* Toast */}
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', bottom: '40px', right: '40px', zIndex: 1000, background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '16px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4' }} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{toastMsg}</span>
        </motion.div>
      )}
    </div>
  );
}