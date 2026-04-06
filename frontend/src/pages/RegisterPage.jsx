import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Spline from '@splinetool/react-spline';

const API_BASE = 'https://h14-b-cool-cool-cool.vercel.app';
const SPLINE_URL = 'https://prod.spline.design/JEgENMw8qsjdXOd9/scene.splinecode';

const BUYER_FIELDS = [
  { label: 'Full Name', key: 'name', placeholder: 'John Citizen' },
  { label: 'Email Address', key: 'email', type: 'email', placeholder: 'john@example.com' },
  { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
  { label: 'Street', key: 'street', placeholder: '123 Main St' },
  { label: 'City', key: 'city', placeholder: 'Sydney' },
  { label: 'Postal Code', key: 'postalCode', placeholder: '2000' },
  { label: 'Country Code', key: 'countryCode', placeholder: 'AU' },
  { label: 'Company ID (ABN)', key: 'companyId', placeholder: '51 824 753 556', optional: true },
  { label: 'Tax Scheme ID', key: 'taxSchemeId', placeholder: 'GST', optional: true },
  { label: 'Contact Phone', key: 'contactPhone', placeholder: '0400 000 000', optional: true },
];

const SELLER_FIELDS = [
  { label: 'Business Name', key: 'name', placeholder: 'Wholesale Co Pty Ltd' },
  { label: 'Email', key: 'email', type: 'email', placeholder: 'sales@wholesale.com' },
  { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
  { label: 'Street Address', key: 'street', placeholder: '456 Trade St' },
  { label: 'City', key: 'city', placeholder: 'Melbourne' },
  { label: 'Postal Code', key: 'postalCode', placeholder: '3000' },
  { label: 'Country Code', key: 'countryCode', placeholder: 'AU' },
  { label: 'Company ID (ABN)', key: 'companyId', placeholder: '12 345 678 910' },
  { label: 'Legal Entity ID', key: 'legalEntityId', placeholder: 'ASIC-123' },
  { label: 'Tax Scheme ID', key: 'taxSchemeId', placeholder: 'GST' },
  { label: 'Contact Name', key: 'contactName', placeholder: 'Account Manager' },
  { label: 'Contact Phone', key: 'contactPhone', placeholder: '03 9000 0000' },
  { label: 'Contact Email', key: 'contactEmail', type: 'email', placeholder: 'contact@wholesale.com' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('buyer');
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [splineLoaded, setSplineLoaded] = useState(false);
  const formRef = useRef(null);

  const fields = tab === 'buyer' ? BUYER_FIELDS : SELLER_FIELDS;

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = { ...form };
      if (tab === 'seller') {
        payload.companyId = form.companyId || 'NOT-PROVIDED';
        payload.legalEntityId = form.legalEntityId || 'NOT-PROVIDED';
        payload.taxSchemeId = form.taxSchemeId || 'NOT-PROVIDED';
        payload.contactName = form.contactName || form.name;
        payload.contactPhone = form.contactPhone || 'NOT-PROVIDED';
        payload.contactEmail = form.contactEmail || form.email;
      }
      const res = await fetch(`${API_BASE}/${tab}s/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', tab);
      if (tab === 'buyer') {
        localStorage.setItem('buyerId', data.buyerId);
      } else {
        localStorage.setItem('sellerId', data.sellerId);
      }
      navigate(tab === 'buyer' ? '/buyer/dashboard' : '/seller/dashboard');
    } catch (e) {
      setError(e.message);
      formRef.current?.scrollTo({ top: formRef.current.scrollHeight, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh', display: 'flex',
      fontFamily: "'Geist', 'Segoe UI', sans-serif",
      background: '#050d1a', overflow: 'hidden',
      margin: 0, padding: 0, boxSizing: 'border-box',
    }}>

      {/* ── THE CURTAIN (Hides everything until Spline is ready) ── */}
      <AnimatePresence>
        {!splineLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: '#050d1a', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {/* Your brand spinner */}
            <div style={{
              width: '40px', height: '40px', 
              border: '3px solid rgba(255,255,255,0.1)', 
              borderTopColor: '#2563eb', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              marginBottom: '16px'
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        onClick={() => navigate('/')}
        style={{
          position: 'absolute', top: '24px', left: '32px', zIndex: 200,
          display: 'flex', alignItems: 'center', gap: '7px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '9px', padding: '8px 14px',
          color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: '500',
          cursor: 'pointer', fontFamily: "'Geist', sans-serif",
          backdropFilter: 'blur(8px)',
        }}
        whileHover={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
        whileTap={{ scale: 0.97 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
      </motion.button>

      {/* ── Left: Spline + branding ── */}
      <div style={{
        flex: 1, position: 'relative',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end',
        overflow: 'hidden',
        height: '100vh',
        scale: 1.5,
      }}>
        
        {/* Glows */}
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: '700px', height: '700px', background: 'radial-gradient(ellipse, rgba(37,99,235,0.10) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '5%', width: '400px', height: '400px', background: 'radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Spline */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, opacity: splineLoaded ? 1 : 0, transition: 'opacity 1.2s ease' }}>
          <Spline scene={SPLINE_URL} onLoad={() => setSplineLoaded(true)} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Bottom branding overlay */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={{ position: 'relative', zIndex: 10, padding: '0 56px 56px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '34px', height: '34px', background: '#2563eb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <span style={{ fontSize: '17px', fontWeight: '700', color: '#fff', fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.3px' }}>CoolCoolCool</span>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)',
            borderRadius: '20px', padding: '6px 14px',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>
              {tab === 'buyer' ? 'Registering as a Buyer' : 'Registering as a Seller'}
            </span>
          </div>
        </motion.div>

        {/* Right fade */}
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '120px', background: 'linear-gradient(to right, transparent, #050d1a)', zIndex: 5, pointerEvents: 'none' }} />
      </div>

      {/* ── Right: Registration form ── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '500px', flexShrink: 0,
          background: '#0a1628',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          position: 'relative', zIndex: 10,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Header — sticky */}
        <div style={{
          padding: '48px 52px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 style={{
              fontSize: '30px', fontWeight: '800', color: '#fff',
              margin: '0 0 8px', letterSpacing: '-1px',
              fontFamily: "'Bricolage Grotesque', sans-serif",
            }}>Create account.</h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
              Already registered?{' '}
              <span
                onClick={() => navigate('/login')}
                style={{ color: '#60a5fa', fontWeight: '600', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.color = '#93c5fd'}
                onMouseLeave={e => e.currentTarget.style.color = '#60a5fa'}
              >Sign in</span>
            </p>
          </motion.div>

          {/* Tab toggle */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{
              display: 'flex', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px', padding: '4px', marginTop: '24px',
            }}
          >
            {['buyer', 'seller'].map(t => (
              <button key={t}
                onClick={() => { setTab(t); setForm({}); setError(''); }}
                style={{
                  flex: 1, padding: '10px 0', border: 'none', borderRadius: '9px', cursor: 'pointer',
                  background: tab === t ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'transparent',
                  color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)',
                  fontSize: '13px', fontWeight: '600',
                  boxShadow: tab === t ? '0 4px 16px rgba(37,99,235,0.35)' : 'none',
                  transition: 'all 0.2s',
                }}
              >{t === 'buyer' ? 'SMEs' : 'Wholesale'}</button>
            ))}
          </motion.div>
        </div>

        {/* Scrollable form body */}
        <div
          ref={formRef}
          style={{ flex: 1, overflowY: 'auto', padding: '28px 52px 32px' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {/* 2-column grid for fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
                {fields.map(({ label, key, type = 'text', placeholder, optional }, idx) => (
                  <div
                    key={key}
                    style={{
                      gridColumn: ['name', 'email', 'password', 'street', 'contactEmail'].includes(key) ? 'span 2' : 'span 1',
                    }}
                  >
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      fontSize: '11px', fontWeight: '600',
                      color: 'rgba(255,255,255,0.4)', marginBottom: '6px',
                      letterSpacing: '0.6px', textTransform: 'uppercase',
                    }}>
                      {label}
                      {optional && <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: '400', textTransform: 'none', fontSize: '10px', letterSpacing: 0 }}>optional</span>}
                    </label>
                    <input
                      type={type}
                      value={form[key] || ''}
                      placeholder={placeholder}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      style={{
                        width: '100%', padding: '11px 14px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '9px', fontSize: '13px', color: '#fff',
                        outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(96,165,250,0.45)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  </div>
                ))}
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                      borderRadius: '8px', padding: '10px 14px',
                      marginTop: '16px', fontSize: '13px', color: '#f87171',
                    }}
                  >{error}</motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(37,99,235,0.5)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  width: '100%', padding: '14px', marginTop: '20px',
                  background: loading ? 'rgba(37,99,235,0.4)' : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  border: 'none', borderRadius: '11px',
                  fontSize: '14px', fontWeight: '700', color: '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(37,99,235,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Creating account…
                  </>
                ) : `Create ${tab} account`}
              </motion.button>

              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.18)', textAlign: 'center', marginTop: '16px', lineHeight: '1.6' }}>
                By registering you agree to our{' '}
                <span style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span>.
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input::placeholder { color: rgba(255,255,255,0.18) !important; }`}</style>
    </div>
  );
}