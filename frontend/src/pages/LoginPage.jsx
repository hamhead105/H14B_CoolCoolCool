import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Spline from '@splinetool/react-spline';
import { API_BASE } from '../apiConfig.js';

const SPLINE_URL = 'https://prod.spline.design/JEgENMw8qsjdXOd9/scene.splinecode';

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('buyer');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${tab}s/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Login failed');

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Geist', 'Segoe UI', sans-serif",
      background: '#050d1a',
      overflow: 'hidden',
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
      
      {/* ── Left: Spline particle canvas ── */}
      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>

        {/* Blue glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '20%',
          width: '600px', height: '600px',
          background: 'radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, transparent 65%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Spline scene */}
        <div style={{
          position: 'absolute',
          top: -100,
          left: 150,
          width: '100%',
          height: '100%', zIndex: 1,
          opacity: splineLoaded ? 1 : 0,
          transition: 'opacity 1.2s ease',
          scale: '1.2'
        }}>
          <Spline
            scene={SPLINE_URL}
            onLoad={() => setSplineLoaded(true)}
            style={{ width: '100%', height: '100%', }}
          />
        </div>

        {/* Overlay text on particle side */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          style={{ 
            position: 'absolute', // Swapped from relative so it ignores the flexbox centering
            bottom: '-5px',       // Pins it to the bottom
            left: '-15px',         // Pins it to the left edge
            zIndex: 10, 
            
            /* ── The Glassmorphism Effect ── */
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)', // Keeps it working smoothly on Safari
            
            /* ── Card Styling ── */
            borderRadius: '16px', 
            padding: '24px 32px', // Nice, even spacing inside the glass card
            display: 'inline-block', // Prevents the glass from stretching all the way across the page
            
            /* ── Positioning ── */
            // Since we removed '0 56px 56px' padding, we use margin to push it away from the edges
            marginLeft: '56px',
            marginBottom: '56px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: '34px', height: '34px', background: '#2563eb',
              borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <span style={{
              fontSize: '17px', fontWeight: '700', color: '#fff',
              fontFamily: "'Bricolage Grotesque', sans-serif",
              letterSpacing: '-0.3px',
            }}>CoolCoolCool</span>
          </div>
          <p style={{
            fontSize: '13px', color: 'rgba(255,255,255,0.35)',
            margin: 0, letterSpacing: '0.2px', lineHeight: '1.6',
          }}>
            Australia's B2B procurement platform.<br />
            Wholesale, simplified.
          </p>
        </motion.div>

        {/* Right fade edge */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: '120px',
          background: 'linear-gradient(to right, transparent, #050d1a)',
          zIndex: 5, pointerEvents: 'none',
        }} />
      </div>

      {/* ── Right: Login form ── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '480px',
          flexShrink: 0,
          background: '#0a1628',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '64px 52px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 style={{
            fontSize: '32px', fontWeight: '800', color: '#fff',
            margin: '0 0 8px', letterSpacing: '-1px', lineHeight: '1.15',
            fontFamily: "'Bricolage Grotesque', sans-serif",
          }}>
            Welcome back.
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', marginBottom: '40px' }}>
            New here?{' '}
            <span
              onClick={() => navigate('/register')}
              style={{ color: '#60a5fa', fontWeight: '600', cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#93c5fd'}
              onMouseLeave={e => e.currentTarget.style.color = '#60a5fa'}
            >Create an account</span>
          </p>
        </motion.div>

        {/* Tab toggle */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px', padding: '4px', marginBottom: '36px',
          }}
        >
          {['buyer', 'seller'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setForm({ email: '', password: '' }); }}
              style={{
                flex: 1, padding: '10px 0',
                border: 'none', borderRadius: '9px', cursor: 'pointer',
                background: tab === t
                  ? 'linear-gradient(135deg, #2563eb, #7c3aed)'
                  : 'transparent',
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)',
                fontSize: '13px', fontWeight: '600',
                boxShadow: tab === t ? '0 4px 16px rgba(37,99,235,0.35)' : 'none',
                transition: 'all 0.2s',
                letterSpacing: '0.2px',
              }}
            >
              {t === 'buyer' ? 'SMEs' : 'Wholesale'}
            </button>
          ))}
        </motion.div>

        {/* Form fields */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block', fontSize: '11px', fontWeight: '600',
              color: 'rgba(255,255,255,0.4)', marginBottom: '7px', letterSpacing: '0.6px', textTransform: 'uppercase',
            }}>Email address</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="you@company.com"
              style={{
                width: '100%', padding: '12px 16px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '10px', fontSize: '14px', color: '#fff',
                outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(96,165,250,0.5)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block', fontSize: '11px', fontWeight: '600',
              color: 'rgba(255,255,255,0.4)', marginBottom: '7px', letterSpacing: '0.6px', textTransform: 'uppercase',
            }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '12px 48px 12px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: '10px', fontSize: '14px', color: '#fff',
                  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(96,165,250,0.5)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
              />
              <button
                onClick={() => setShowPassword(p => !p)}
                style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)', padding: 0, lineHeight: 1,
                }}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '8px', padding: '10px 14px',
                  marginBottom: '16px', fontSize: '13px', color: '#f87171',
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
              width: '100%', padding: '14px',
              background: loading
                ? 'rgba(37,99,235,0.4)'
                : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              border: 'none', borderRadius: '11px',
              fontSize: '14px', fontWeight: '700', color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(37,99,235,0.4)',
              letterSpacing: '-0.2px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {loading ? (
              <>
                <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Signing in…
              </>
            ) : `Sign in as ${tab}`}
          </motion.button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ fontSize: '12px', color: 'rgba(255,255,255,0.18)', textAlign: 'center', marginTop: '28px', lineHeight: '1.6' }}
        >
          By signing in you agree to our{' '}
          <span style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'underline', cursor: 'pointer' }}>Terms</span>
          {' '}and{' '}
          <span style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
        </motion.p>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input::placeholder { color: rgba(255,255,255,0.2); }`}</style>
    </div>
  );
}