import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// CartPage receives cart state from parent (App or context).
// Since this app uses localStorage/props for cart, we read from localStorage key 'cart' if available,
// or expose a default empty state. Integrate with your cart state management as needed.

// For a complete integration, pass cart and setCart as props or use Context.
// This standalone version reads/writes a 'cart' key in localStorage as JSON.

const API_BASE = 'https://h14-b-cool-cool-cool.vercel.app';

function getCart() {
  try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
}
function saveCart(cart) { localStorage.setItem('cart', JSON.stringify(cart)); }

function generateUBL(cart, buyer) {
  const total = cart.reduce((sum, item) => {
    const price = item.onSpecial ? item.cost * (1 - item.discount) : item.cost;
    return sum + price * item.qty;
  }, 0);
  const lines = cart.map((item, idx) => {
    const price = item.onSpecial ? (item.cost * (1 - item.discount)).toFixed(2) : Number(item.cost).toFixed(2);
    return `
    <cac:OrderLine>
      <cbc:LineStatusCode>NoStatus</cbc:LineStatusCode>
      <cac:LineItem>
        <cbc:ID>${idx + 1}</cbc:ID>
        <cbc:Quantity unitCode="EA">${item.qty}</cbc:Quantity>
        <cbc:LineExtensionAmount currencyID="AUD">${(price * item.qty).toFixed(2)}</cbc:LineExtensionAmount>
        <cac:Price>
          <cbc:PriceAmount currencyID="AUD">${price}</cbc:PriceAmount>
        </cac:Price>
        <cac:Item>
          <cbc:Name>${item.name}</cbc:Name>
          <cac:SellersItemIdentification>
            <cbc:ID>${item.productId}</cbc:ID>
          </cac:SellersItemIdentification>
        </cac:Item>
      </cac:LineItem>
    </cac:OrderLine>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ubl:Order xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Order-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:ID>ORD-${Date.now()}</cbc:ID>
  <cbc:IssueDate>${new Date().toISOString().split('T')[0]}</cbc:IssueDate>
  <cbc:DocumentCurrencyCode>AUD</cbc:DocumentCurrencyCode>
  <cac:BuyerCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${buyer?.businessName || 'Buyer'}</cbc:Name></cac:PartyName>
    </cac:Party>
  </cac:BuyerCustomerParty>
  <cac:AnticipatedMonetaryTotal>
    <cbc:PayableAmount currencyID="AUD">${total.toFixed(2)}</cbc:PayableAmount>
  </cac:AnticipatedMonetaryTotal>${lines}
</ubl:Order>`;
}

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCartState] = useState(getCart());
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [ublXml, setUblXml] = useState('');
  const [showUbl, setShowUbl] = useState(false);

  const updateQty = (productId, delta) => {
    const updated = cart.map(item =>
      item.productId === productId ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    );
    setCartState(updated); saveCart(updated);
  };

  const remove = (productId) => {
    const updated = cart.filter(item => item.productId !== productId);
    setCartState(updated); saveCart(updated);
  };

  const total = cart.reduce((sum, item) => {
    const price = item.onSpecial ? item.cost * (1 - item.discount) : item.cost;
    return sum + price * item.qty;
  }, 0);

  const handleOrder = () => {
    const buyer = { businessName: 'Buyer Co' }; // In full app, load from API
    const xml = generateUBL(cart, buyer);
    setUblXml(xml);
    setOrderPlaced(true);
    saveCart([]);
    setCartState([]);
  };

  const downloadUBL = () => {
    const blob = new Blob([ublXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `order-${Date.now()}.xml`; a.click();
    URL.revokeObjectURL(url);
  };

  if (orderPlaced) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e8eaf0', padding: '48px', maxWidth: '540px', width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
        <div style={{ width: '56px', height: '56px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '26px' }}>✅</div>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>Order placed!</h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px', lineHeight: '1.7' }}>Your UBL-compliant purchase order has been generated. Download it or return to browse more products.</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={downloadUBL}
            style={{ padding: '11px 22px', background: '#2563eb', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: '700', color: '#fff', cursor: 'pointer' }}>
            ⬇️ Download UBL XML
          </button>
          <button onClick={() => setShowUbl(v => !v)}
            style={{ padding: '11px 22px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', fontSize: '13px', fontWeight: '600', color: '#64748b', cursor: 'pointer' }}>
            {showUbl ? 'Hide' : 'View'} XML
          </button>
          <button onClick={() => navigate('/products')}
            style={{ padding: '11px 22px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', fontSize: '13px', fontWeight: '600', color: '#64748b', cursor: 'pointer' }}>
            Continue shopping
          </button>
        </div>
        {showUbl && (
          <pre style={{ marginTop: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', fontSize: '11px', color: '#374151', textAlign: 'left', overflowX: 'auto', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {ublXml}
          </pre>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      {/* Top bar */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e8eaf0', padding: '0 28px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => navigate('/products')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
          ← Back to products
        </button>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>Cart</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{cart.length} item{cart.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ width: '120px' }} />
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
        {/* Cart items */}
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>Your Cart</h1>
          {cart.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8eaf0', padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '14px' }}>🛒</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Your cart is empty</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Browse the catalog to find products.</div>
              <button onClick={() => navigate('/products')}
                style={{ padding: '10px 22px', background: '#2563eb', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer' }}>
                Browse Products
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cart.map(item => {
                const price = item.onSpecial ? item.cost * (1 - item.discount) : item.cost;
                return (
                  <div key={item.productId} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e8eaf0', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '44px', height: '44px', background: '#f0f4ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>📦</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '2px' }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.brand} · {item.family}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', borderRadius: '8px', padding: '4px 8px', border: '1px solid #e2e8f0' }}>
                        <button onClick={() => updateQty(item.productId, -1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontWeight: '700', fontSize: '14px', lineHeight: 1, padding: '0 2px' }}>−</button>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.productId, 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontWeight: '700', fontSize: '14px', lineHeight: 1, padding: '0 2px' }}>+</button>
                      </div>
                      <div style={{ minWidth: '70px', textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>${(price * item.qty).toFixed(2)}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>${price.toFixed(2)} ea</div>
                      </div>
                      <button onClick={() => remove(item.productId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px', padding: '4px' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                      >×</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order summary */}
        {cart.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8eaf0', padding: '24px', position: 'sticky', top: '80px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 18px' }}>Order Summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {cart.map(item => {
                const price = item.onSpecial ? item.cost * (1 - item.discount) : item.cost;
                return (
                  <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                    <span>{item.name} ×{item.qty}</span>
                    <span style={{ fontWeight: '600', color: '#0f172a' }}>${(price * item.qty).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Total (AUD)</span>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#2563eb' }}>${total.toFixed(2)}</span>
            </div>
            <button onClick={handleOrder}
              style={{ width: '100%', padding: '13px', background: '#2563eb', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', color: '#fff', cursor: 'pointer', marginBottom: '10px' }}
              onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
              onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
            >📋 Place Order (UBL)</button>
            <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', margin: 0, lineHeight: '1.5' }}>
              Generates a PEPPOL UBL 2.1 compliant purchase order document.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}