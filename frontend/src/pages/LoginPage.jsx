import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'https://h14-b-cool-cool-cool.vercel.app';

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('buyer');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      if (!res.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', tab);
      localStorage.setItem(tab === 'buyer' ? 'buyerId' : 'sellerId', data[tab === 'buyer' ? 'buyerId' : 'sellerId']);
      navigate(tab === 'buyer' ? '/buyer/dashboard' : '/seller/dashboard');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const field = (label, key, type = 'text') => (
    <div style={{ marginBottom: '18px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', letterSpacing: '0.3px' }}>{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        style={{
          width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0',
          borderRadius: '10px', fontSize: '14px', color: '#0f172a',
          background: '#fff', outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
        onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
        placeholder={key === 'email' ? 'you@company.com' : '••••••••'}
      />
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', background: '#f8fafc', display: 'flex',
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
    }}>
      {/* Left panel */}
      <div style={{
        width: '420px', flexShrink: 0, background: '#0f172a',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 44px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '64px' }}>
            <div style={{ width: '34px', height: '34px', background: '#2563eb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>CoolCoolCool</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#fff', lineHeight: '1.25', marginBottom: '16px' }}>
            Australia's B2B<br />procurement platform.
          </div>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.7' }}>
            Connect with verified wholesale suppliers. Streamline your ordering, track deliveries, and manage everything in one place.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { icon: '⚡', text: 'Real-time pricing & specials' },
            { icon: '📦', text: 'Automated UBL invoicing' },
            { icon: '🏆', text: 'Loyalty rewards for buyers' },
          ].map(item => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(37,99,235,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{item.icon}</div>
              <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>Welcome back</h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px' }}>
            Don't have an account?{' '}
            <span onClick={() => navigate('/register')} style={{ color: '#2563eb', fontWeight: '600', cursor: 'pointer' }}>Sign up</span>
          </p>

          {/* Tabs */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px', marginBottom: '28px' }}>
            {['buyer', 'seller'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }}
                style={{
                  flex: 1, padding: '9px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                  background: tab === t ? '#fff' : 'transparent',
                  color: tab === t ? '#0f172a' : '#64748b',
                  fontSize: '13px', fontWeight: '600',
                  boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}
              >{t === 'buyer' ? '🛒 Buyer' : '🏭 Seller'}</button>
            ))}
          </div>

          {field('Email address', 'email')}
          {field('Password', 'password', 'password')}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', padding: '13px', background: loading ? '#93c5fd' : '#2563eb',
              border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700',
              color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#1d4ed8'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#2563eb'; }}
          >{loading ? 'Signing in…' : `Sign in as ${tab}`}</button>

          <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '24px', lineHeight: '1.6' }}>
            By signing in you agree to our{' '}
            <span style={{ color: '#64748b', textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span>
            {' '}and{' '}
            <span style={{ color: '#64748b', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}