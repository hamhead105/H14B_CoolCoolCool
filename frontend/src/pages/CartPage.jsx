import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../apiConfig.js';

function getCart() {
  try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
}
function saveCart(cart) { localStorage.setItem('cart', JSON.stringify(cart)); }

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCartState] = useState(getCart());
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [ublXml, setUblXml] = useState('');
  const [showUbl, setShowUbl] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
    const cost = Number(item.cost || 0);
    const discount = Number(item.discount || 0);
    const qty = Number(item.qty || 1);
    const price = item.onSpecial ? cost * (1 - discount) : cost;
    return sum + price * qty;
  }, 0);

  const handleOrder = async () => {
    const token = localStorage.getItem('token');
    const buyerId = localStorage.getItem('buyerId');

    if (!token || !buyerId) {
      alert("Authentication missing. Please log in.");
      return;
    }
    
    setIsProcessing(true);
    try {
      const profileRes = await fetch(`${API_BASE}/buyers/${buyerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!profileRes.ok) throw new Error("Failed to retrieve buyer profile.");
      const dbBuyer = await profileRes.json();

      const buyerData = {
        buyerId: buyerId,
        name: dbBuyer.businessName || dbBuyer.name || "NOT-PROVIDED",
        email: dbBuyer.email || "NOT-PROVIDED",
        street: dbBuyer.address || dbBuyer.street || "NOT-PROVIDED",
        city: dbBuyer.city || "NOT-PROVIDED",
        postalCode: dbBuyer.postalCode || "0000",
        countryCode: dbBuyer.countryCode || "AU",
        companyId: dbBuyer.companyId || "NOT-PROVIDED",
        taxSchemeId: dbBuyer.taxSchemeId || "GST",
        legalEntityId: dbBuyer.legalEntityId || "NOT-PROVIDED",
        contactName: dbBuyer.contactName || dbBuyer.name || "NOT-PROVIDED",
        contactPhone: dbBuyer.phone || dbBuyer.contactPhone || "NOT-PROVIDED",
        contactEmail: dbBuyer.contactEmail || dbBuyer.email || "NOT-PROVIDED",
      };

      const orderPayload = {
        buyerId: buyerId,
        order: { 
          id: `ORD-${Date.now()}`,
          currencyID: "AUD",
          issueDate: new Date().toISOString().split('T')[0],
          note: "Standard B2B Order"
        },
        buyer: buyerData,
        seller: { name: "Multiple Sellers", street: "Multi", city: "Multi", postalCode: "0000", countryCode: "AU", companyId: "N/A", taxSchemeId: "GST", legalEntityId: "N/A", contactName: "N/A", contactPhone: "N/A", contactEmail: "N/A" },
        delivery: { street: buyerData.street, city: buyerData.city, postalCode: buyerData.postalCode, countryCode: buyerData.countryCode, requestedStartDate: new Date().toISOString().split('T')[0], requestedEndDate: new Date(Date.now() + 604800000).toISOString().split('T')[0] },
        tax: { taxPercent: 10, taxTypeCode: "GST" },
        items: cart.map((item, idx) => ({
          id: (idx + 1).toString(),
          quantity: Number(item.qty),
          unitCode: "EA",
          priceAmount: item.onSpecial ? Number(item.cost * (1 - item.discount)) : Number(item.cost),
          product: { name: item.name, description: item.description || "", sellersItemId: item.productId || item.id },
          sellerId: String(item.sellerId) 
        }))
      };

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order failed');

      const uniqueSellerIds = [...new Set(cart.map(item => item.sellerId))];

      uniqueSellerIds.forEach(async (sId) => {
        try {
          const sellerRes = await fetch(`${API_BASE}/sellers/${sId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const sellerData = await sellerRes.json();
          const targetEmail = sellerData.supportEmail || sellerData.email;

          if (targetEmail) {
            await fetch(`${API_BASE}/orders/${data.orderId}/email`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({ recipientEmail: targetEmail })
            });
            console.log(`Dispatched UBL to Seller ${sId} at ${targetEmail}`);
          }
        } catch (err) {
          console.error(`Failed to email seller ${sId}:`, err);
        }
      });

      setUblXml(data.ublDocument);
      setOrderPlaced(true);
      localStorage.removeItem('cart');
      setCartState([]);
    } catch (err) {
      alert(`Order Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadUBL = () => {
    const blob = new Blob([ublXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `order-${Date.now()}.xml`; a.click();
    URL.revokeObjectURL(url);
  };

  if (orderPlaced) return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a', fontFamily: "'Geist', sans-serif" }}>
      <Sidebar />
      {/* ADDED: overflowY: 'auto' so the main wrapper can scroll on tiny screens */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', overflowY: 'auto' }}>
        
        {/* ADDED: margin: 'auto' to work safely with overflow */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '48px', maxWidth: '640px', width: '100%', textAlign: 'center', backdropFilter: 'blur(20px)', margin: 'auto' }}>
          
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '12px', fontFamily: "'Bricolage Grotesque', sans-serif" }}>Order Placed!</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '32px', lineHeight: '1.6' }}>Your UBL-compliant purchase order has been generated and broadcasted to suppliers.</p>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={downloadUBL} style={{ padding: '12px 24px', background: '#3b82f6', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>Download UBL XML</button>
            <button onClick={() => setShowUbl(!showUbl)} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>{showUbl ? 'Hide' : 'View'} XML</button>
          </div>
          
          {showUbl && (
            <pre style={{ 
              marginTop: '24px', 
              background: '#000', 
              padding: '20px', 
              borderRadius: '12px', 
              fontSize: '11px', 
              color: '#a78bfa', 
              textAlign: 'left', 
              overflowX: 'auto', 
              overflowY: 'auto', 
              maxHeight: '350px', 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-all' 
            }}>
              {ublXml}
            </pre>
          )}
        </motion.div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a', fontFamily: "'Geist', sans-serif", overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0 }}>
        
        {/* Background Grid & Glow */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)`, backgroundSize: '64px 64px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-10%', right: '10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <header style={{ height: '64px', padding: '0 40px', display: 'flex', alignItems: 'center', background: 'rgba(5,13,26,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)', zIndex: 10 }}>
          <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif" }}>Shopping Cart</h1>
        </header>

        <main style={{ flex: 1, padding: '40px', overflowY: 'auto', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
          
          {/* Cart Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {cart.length === 0 ? (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '80px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '20px' }}>🛒</div>
                <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>Your cart is empty</h3>
                <button onClick={() => navigate('/products')} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', marginTop: '16px' }}>Browse Products</button>
              </div>
            ) : (
              <AnimatePresence>
                {cart.map((item, i) => {
                  const price = item.onSpecial ? item.cost * (1 - item.discount) : item.cost;
                  return (
                    <motion.div key={item.productId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', backdropFilter: 'blur(10px)' }}>
                      <div style={{ width: '50px', height: '50px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📦</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>{item.name}</div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>{item.brand} • Seller ID: {item.sellerId}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <button onClick={() => updateQty(item.productId, -1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>−</button>
                        <span style={{ color: '#fff', fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.productId, 1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>+</button>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '80px' }}>
                        <div style={{ color: '#fff', fontWeight: '800' }}>${(price * item.qty).toFixed(2)}</div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>${price.toFixed(2)} ea</div>
                      </div>
                      <button onClick={() => remove(item.productId)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: '18px', cursor: 'pointer' }}>×</button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Checkout Summary */}
          {cart.length > 0 && (
            <div style={{ position: 'sticky', top: '0' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px', backdropFilter: 'blur(20px)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '20px', fontFamily: "'Bricolage Grotesque', sans-serif" }}>Summary</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Subtotal</span>
                  <span style={{ color: '#fff', fontWeight: '600' }}>${total.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Est. Tax (10%)</span>
                  <span style={{ color: '#fff', fontWeight: '600' }}>${(total * 0.1).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                  <span style={{ color: '#fff', fontWeight: '700' }}>Total (AUD)</span>
                  <span style={{ color: '#3b82f6', fontWeight: '900', fontSize: '20px' }}>${(total * 1.1).toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleOrder} 
                  disabled={isProcessing}
                  style={{ width: '100%', padding: '14px', background: '#3b82f6', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '800', fontSize: '14px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(59,130,246,0.3)', opacity: isProcessing ? 0.6 : 1 }}
                >
                  {isProcessing ? 'Processing...' : 'Place UBL Order'}
                </button>
                <div style={{ marginTop: '20px', fontSize: '11px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: '1.6' }}>
                  By placing this order, you generate a PEPPOL-ready UBL 2.1 XML document for Australian B2B procurement.
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}