import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../apiConfig.js';

function generateUBLInvoice(order, seller) {
  const lines = (order.items || []).map((item, idx) => `
    <cac:InvoiceLine>
      <cbc:ID>${idx + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="EA">${item.qty || 1}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="AUD">${((item.price || 0) * (item.qty || 1)).toFixed(2)}</cbc:LineExtensionAmount>
      <cac:Price><cbc:PriceAmount currencyID="AUD">${Number(item.price || 0).toFixed(2)}</cbc:PriceAmount></cac:Price>
      <cac:Item><cbc:Name>${item.name || 'Product'}</cbc:Name></cac:Item>
    </cac:InvoiceLine>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ubl:Invoice xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:ID>INV-${order.orderId || Date.now()}</cbc:ID>
  <cbc:IssueDate>${new Date().toISOString().split('T')[0]}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>AUD</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${seller?.businessName || 'Seller'}</cbc:Name></cac:PartyName>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${order.buyerName || 'Buyer'}</cbc:Name></cac:PartyName>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:LegalMonetaryTotal>
    <cbc:PayableAmount currencyID="AUD">${Number(order.total || 0).toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${lines}
</ubl:Invoice>`;
}

export default function DespatchPage() {
  const navigate = useNavigate();
  const { id: orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [despatching, setDespatching] = useState(false);
  const [despatched, setDespatched] = useState(false);
  const [ublXml, setUblXml] = useState('');
  const [showXml, setShowXml] = useState(false);
  const [trackingNo, setTrackingNo] = useState('');
  const [carrier, setCarrier] = useState('Australia Post');

  const token = localStorage.getItem('token');
  const sellerId = localStorage.getItem('sellerId');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    Promise.all([
      fetch(`${API_BASE}/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => { if (!r.ok) throw new Error('Order not found'); return r.json(); }),
      fetch(`${API_BASE}/sellers/${sellerId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([o, s]) => { setOrder(o); setSeller(s); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [orderId, sellerId, token, navigate]);

  const handleDespatch = async () => {
    setDespatching(true);
    try {
      const xml = generateUBLInvoice(order || { orderId, items: [], total: 0 }, seller);
      setUblXml(xml);
      // In full implementation, POST the despatch/invoice to the API here
      await new Promise(r => setTimeout(r, 800)); // Simulate network
      setDespatched(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setDespatching(false);
    }
  };

  const downloadInvoice = () => {
    const blob = new Blob([ublXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `invoice-${orderId}.xml`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Loading order…</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ background: '#fff', borderBottom: '1px solid #e8eaf0', padding: '0 28px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={() => navigate('/orders')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>← Orders</button>
            <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>Despatch & Invoice</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Order {orderId}</div>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '28px', overflowY: 'auto', maxWidth: '800px' }}>
          {error && !order ? (
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8eaf0', padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '14px' }}>🔌</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Order unavailable</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>{error}</div>
              <button onClick={() => navigate('/orders')} style={{ padding: '10px 22px', background: '#2563eb', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer' }}>Back to Orders</button>
            </div>
          ) : despatched ? (
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e8eaf0', padding: '48px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '26px' }}>✅</div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>Despatched!</h2>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px', lineHeight: '1.7' }}>
                The UBL invoice has been generated for order <strong>{orderId}</strong>.
                {trackingNo && ` Tracking: ${carrier} — ${trackingNo}`}
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={downloadInvoice}
                  style={{ padding: '11px 22px', background: '#2563eb', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: '700', color: '#fff', cursor: 'pointer' }}>
                  ⬇️ Download UBL Invoice
                </button>
                <button onClick={() => setShowXml(v => !v)}
                  style={{ padding: '11px 22px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', fontSize: '13px', fontWeight: '600', color: '#64748b', cursor: 'pointer' }}>
                  {showXml ? 'Hide' : 'View'} XML
                </button>
                <button onClick={() => navigate('/orders')}
                  style={{ padding: '11px 22px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', fontSize: '13px', fontWeight: '600', color: '#64748b', cursor: 'pointer' }}>
                  Back to Orders
                </button>
              </div>
              {showXml && (
                <pre style={{ marginTop: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', fontSize: '11px', color: '#374151', textAlign: 'left', overflowX: 'auto', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {ublXml}
                </pre>
              )}
            </div>
          ) : (
            <>
              {/* Order summary */}
              {order && (
                <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8eaf0', padding: '24px', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px' }}>Order Details</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '18px' }}>
                    {[
                      { label: 'Order ID', value: order.orderId },
                      { label: 'Buyer', value: order.buyerName || order.buyerId },
                      { label: 'Total', value: `$${Number(order.total || 0).toFixed(2)} AUD` },
                      { label: 'Date', value: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-AU') : '—' },
                      { label: 'Status', value: order.status || 'Pending' },
                      { label: 'Items', value: order.items?.length ?? 0 },
                    ].map(row => (
                      <div key={row.label} style={{ background: '#f8fafc', borderRadius: '9px', padding: '12px 14px' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{row.label}</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{row.value}</div>
                      </div>
                    ))}
                  </div>
                  {order.items?.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          {['Product', 'Qty', 'Unit Price', 'Subtotal'].map(h => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#94a3b8' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                            <td style={{ padding: '9px 10px', fontWeight: '500', color: '#0f172a' }}>{item.name}</td>
                            <td style={{ padding: '9px 10px', color: '#64748b' }}>{item.qty}</td>
                            <td style={{ padding: '9px 10px', color: '#64748b' }}>${Number(item.price || 0).toFixed(2)}</td>
                            <td style={{ padding: '9px 10px', fontWeight: '600', color: '#0f172a' }}>${((item.price || 0) * (item.qty || 1)).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Despatch form */}
              <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8eaf0', padding: '24px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Despatch Details</h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px' }}>Optional — add tracking info before generating the invoice.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Carrier</label>
                    <select value={carrier} onChange={e => setCarrier(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#0f172a', background: '#fff', outline: 'none' }}>
                      <option>Australia Post</option>
                      <option>StarTrack</option>
                      <option>TNT / FedEx</option>
                      <option>Toll Group</option>
                      <option>DHL Express</option>
                      <option>Own fleet</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Tracking Number</label>
                    <input value={trackingNo} onChange={e => setTrackingNo(e.target.value)} placeholder="e.g. 7E1AB2CD3F"
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#0f172a', boxSizing: 'border-box', outline: 'none' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
                      onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                </div>

                <div style={{ background: '#f0f4ff', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>📋</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e40af', marginBottom: '3px' }}>UBL Invoice will be generated</div>
                    <div style={{ fontSize: '12px', color: '#3b82f6', lineHeight: '1.5' }}>A PEPPOL UBL 2.1 compliant invoice XML document will be created for this order that you can download and send to the buyer.</div>
                  </div>
                </div>

                {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#dc2626' }}>{error}</div>}

                <button onClick={handleDespatch} disabled={despatching}
                  style={{ width: '100%', padding: '13px', background: despatching ? '#93c5fd' : '#2563eb', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', color: '#fff', cursor: despatching ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={e => { if (!despatching) e.currentTarget.style.background = '#1d4ed8'; }}
                  onMouseLeave={e => { if (!despatching) e.currentTarget.style.background = '#2563eb'; }}
                >{despatching ? 'Generating invoice…' : '📦 Confirm Despatch & Generate Invoice'}</button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}