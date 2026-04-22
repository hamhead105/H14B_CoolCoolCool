import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../apiConfig.js';

export default function DespatchAdvicePage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [despatchAdvice, setDespatchAdvice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [devView, setDevView] = useState('xml');
  const [xmlContent, setXmlContent] = useState('Loading XML...');

  function formatXML(xml) {
    const PADDING = '  ';
    let formatted = '';
    let pad = 0;
    // eslint-disable-next-line
    xml = xml.replace(/(>)(<)(\/*)/g, '$1\r\n$2$3');

    xml.split('\r\n').forEach((node) => {
      let indent = 0;
      if (node.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (node.match(/^<\/\w/)) {
        if (pad !== 0) pad -= 1;
      // eslint-disable-next-line
      } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }

      formatted += PADDING.repeat(pad) + node + '\n';
      pad += indent;
    });

    return formatted.trim();
  }


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    fetch(`${API_BASE}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(async (orderData) => {
        setOrder(orderData);
        
        if (orderData.externalDespatchAdviceId) {
          
          try {
            setDespatchAdvice(orderData.despatchAdviceMetadata || {});
          } catch {
            setDespatchAdvice(orderData.despatchAdviceMetadata || {});
          }

          try {
            const xmlRes = await fetch(
              `${API_BASE}/despatch-advices/${orderData.externalDespatchAdviceId}/xml`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (xmlRes.ok) {
              const rawXml = await xmlRes.text();
              setXmlContent(await formatXML(rawXml));
            } else {
              setXmlContent('');
            }
          } catch {
            setXmlContent('');
          }

        }
      })
      .finally(() => setLoading(false));
  }, [orderId, navigate]);


  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{ width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#10b981', borderRadius: '50%' }} />
      </div>
    </div>
  );

  if (!order) return <div style={{ color: 'white', padding: '50px' }}>Order not found.</div>;

  const da = despatchAdvice || {};
  const hasDespatchAdvice = !!order.externalDespatchAdviceId;
  const lines = da.despatchLines || [];

  

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a', fontFamily: "'Geist', sans-serif", overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        <header style={{ height: '60px', padding: '0 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(5,13,26,0.7)', borderBottom: '1px solid rgba(255,255,255,0.07)', zIndex: 10 }}>
          <button onClick={() => navigate(`/orders/${orderId}`)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px' }}>← Back to Order</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '700', letterSpacing: '1px' }}>DESPATCH ADVICE WORKSPACE</div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '36px', overflowY: 'auto' }}>

          {/* ── Title ── */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', margin: '0 0 8px', letterSpacing: '-1px' }}>
              Despatch Advice {order.externalDespatchAdviceId || '—'}
            </h1>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Order {orderId} · Despatched</div>
          </div>

          {!hasDespatchAdvice && (
            <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', padding: '24px', marginBottom: '28px', color: '#f87171', fontSize: '13px' }}>
              No despatch advice was generated for this order. This may be due to an error during despatch.
            </div>
          )}

          {/* ── Summary cards ── */}
          {hasDespatchAdvice && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
              {[
                { label: 'Despatch ID',   value: da.despatchAdviceId || order.externalDespatchAdviceId || '—' },
                { label: 'Status',        value: (da.documentStatusCode || da.status || 'Active').toUpperCase() },
                { label: 'Issue Date',    value: da.issueDate || new Date().toISOString().split('T')[0] },
                { label: 'Type',          value: da.despatchAdviceTypeCode || 'delivery' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', letterSpacing: '1px', marginBottom: '8px' }}>{label.toUpperCase()}</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Supplier + Delivery info ── */}
          {hasDespatchAdvice && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', letterSpacing: '1px', marginBottom: '12px' }}>SUPPLIER</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
                  {da.despatchSupplierParty?.party?.name || order.inputData?.seller?.name || '—'}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                  {da.despatchSupplierParty?.party?.postalAddress?.streetName || order.inputData?.seller?.street || ''}
                  {(da.despatchSupplierParty?.party?.postalAddress?.cityName || order.inputData?.seller?.city)
                    ? `, ${da.despatchSupplierParty?.party?.postalAddress?.cityName || order.inputData?.seller?.city}`
                    : ''}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', letterSpacing: '1px', marginBottom: '12px' }}>DELIVERY TO</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
                  {da.deliveryCustomerParty?.party?.name || order.inputData?.buyer?.name || '—'}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                  {da.shipment?.delivery?.deliveryAddress?.streetName || order.inputData?.delivery?.street || ''}
                  {(da.shipment?.delivery?.deliveryAddress?.cityName || order.inputData?.delivery?.city)
                    ? `, ${da.shipment?.delivery?.deliveryAddress?.cityName || order.inputData?.delivery?.city}`
                    : ''}
                </div>
                {(da.shipment?.delivery?.requestedDeliveryPeriod?.startDate || order.inputData?.delivery?.requestedStartDate) && (
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
                    Delivery window: {da.shipment?.delivery?.requestedDeliveryPeriod?.startDate || order.inputData?.delivery?.requestedStartDate}
                    {' → '}
                    {da.shipment?.delivery?.requestedDeliveryPeriod?.endDate || order.inputData?.delivery?.requestedEndDate}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Despatch Lines ── */}
          {hasDespatchAdvice && lines.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', marginBottom: '28px' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', letterSpacing: '1px', marginBottom: '16px' }}>DESPATCH LINES</div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '800' }}>
                <span>ITEM</span><span>QTY DELIVERED</span><span>UNIT</span>
              </div>
              {lines.map((line, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#fff', fontSize: '13px' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>{line.item?.name || `Line ${line.id}`}</div>
                    {line.item?.description && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{line.item.description}</div>}
                  </div>
                  <div style={{ color: '#4ade80', fontWeight: '700' }}>{line.deliveredQuantity}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)' }}>{line.deliveredQuantityUnitCode || 'EA'}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Developer Payload (XML + JSON) ── */}
          <div style={{ background: '#0a0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.3)' }}>DESPATCH ADVICE PAYLOAD</span>
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '8px' }}>
                <button onClick={() => setDevView('xml')}
                  style={{ padding: '4px 12px', background: devView === 'xml' ? 'rgba(255,255,255,0.1)' : 'transparent', color: devView === 'xml' ? '#fff' : '#555', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: '700' }}>
                  UBL XML
                </button>
                <button onClick={() => setDevView('json')}
                  style={{ padding: '4px 12px', background: devView === 'json' ? 'rgba(255,255,255,0.1)' : 'transparent', color: devView === 'json' ? '#fff' : '#555', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: '700' }}>
                  RAW JSON
                </button>
              </div>
            </div>
            <div style={{ padding: '24px', maxHeight: '420px', overflowY: 'auto' }}>
              <pre style={{ margin: 0, color: devView === 'xml' ? '#34d399' : '#60a5fa', fontSize: '12px', fontFamily: 'monospace', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                <code>{devView === 'xml' ? xmlContent : JSON.stringify(da, null, 2)}</code>
              </pre>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}