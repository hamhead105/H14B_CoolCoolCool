import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'https://h14-b-cool-cool-cool.vercel.app';

const BUYER_FIELDS = [
  { label: 'Full Name', key: 'name', placeholder: 'John Citizen' },
  { label: 'Email Address', key: 'email', type: 'email', placeholder: 'john@example.com' },
  { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
  { label: 'Street', key: 'street', placeholder: '123 Main St' },
  { label: 'City', key: 'city', placeholder: 'Sydney' },
  { label: 'Postal Code', key: 'postalCode', placeholder: '2000' },
  { label: 'Country Code', key: 'countryCode', placeholder: 'AU' },
  { label: 'Company ID (ABN)', key: 'companyId', placeholder: '51 824 753 556' },
  { label: 'Legal Entity ID', key: 'legalEntityId', placeholder: 'Optional' },
  { label: 'Tax Scheme ID', key: 'taxSchemeId', placeholder: 'GST' },
  { label: 'Contact Phone', key: 'contactPhone', placeholder: '0400 000 000' },
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
  { label: 'Contact Email', key: 'contactEmail', placeholder: 'contact@wholesale.com' },
];


export default function RegisterPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('buyer');
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fields = tab === 'buyer' ? BUYER_FIELDS : SELLER_FIELDS;

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      let payload = { ...form };

      if (tab === 'seller') {
        payload = {
          ...payload,
          companyId: form.companyId || "ABN-TEMP",
          legalEntityId: form.legalEntityId || "LEI-TEMP",
          taxSchemeId: form.taxSchemeId || "GST",
          contactName: form.contactName || form.name,
          contactPhone: form.phone || "0400000000",
          contactEmail: form.contactEmail || form.email,
          name: form.name || form.name 
        };
      }

      const res = await fetch(`${API_BASE}/${tab}s/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      Object.keys(data).forEach(key => {
        if (typeof data[key] !== 'object') {
          localStorage.setItem(key, data[key]);
        }
      });

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
      minHeight: '100vh', background: '#f8fafc', display: 'flex',
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
    }}>
      {/* Left branding panel */}
      <div style={{
        width: '380px', flexShrink: 0, background: '#0f172a',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 40px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '56px' }}>
            <div style={{ width: '34px', height: '34px', background: '#2563eb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>CoolCoolCool</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#fff', lineHeight: '1.3', marginBottom: '16px' }}>
            Join Australia's<br />leading B2B network.
          </div>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.7' }}>
            Thousands of SME retailers and verified wholesale suppliers already trust CoolCoolCool.
          </p>
        </div>
        <div>
          <div style={{ background: 'rgba(37,99,235,0.15)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(37,99,235,0.3)' }}>
            <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '600', marginBottom: '8px' }}>
              {tab === 'buyer' ? '🛒 Signing up as a Buyer' : '🏭 Signing up as a Seller'}
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: '1.6' }}>
              {tab === 'buyer'
                ? 'Browse verified suppliers, manage carts, track orders and earn loyalty points.'
                : 'List your products, manage inventory, and despatch orders with automated invoicing.'}
            </p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>Create your account</h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px' }}>
            Already registered?{' '}
            <span onClick={() => navigate('/login')} style={{ color: '#2563eb', fontWeight: '600', cursor: 'pointer' }}>Sign in</span>
          </p>

          {/* Tabs */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px', marginBottom: '24px' }}>
            {['buyer', 'seller'].map(t => (
              <button key={t} onClick={() => { setTab(t); setForm({}); setError(''); }}
                style={{
                  flex: 1, padding: '9px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                  background: tab === t ? '#fff' : 'transparent',
                  color: tab === t ? '#0f172a' : '#64748b',
                  fontSize: '13px', fontWeight: '600',
                  boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}
              >{t === 'buyer' ? '🛒 Register as Buyer' : '🏭 Register as Seller'}</button>
            ))}
          </div>

          {fields.map(({ label, key, type = 'text', placeholder }) => (
            <div key={key} style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>{label}</label>
              <input
                type={type}
                value={form[key] || ''}
                placeholder={placeholder}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{
                  width: '100%', padding: '10px 13px', border: '1px solid #e2e8f0',
                  borderRadius: '9px', fontSize: '13px', color: '#0f172a',
                  background: '#fff', outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              />
            </div>
          ))}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#dc2626' }}>
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
              marginTop: '4px', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#1d4ed8'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#2563eb'; }}
          >{loading ? 'Creating account…' : `Create ${tab} account`}</button>

          <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '20px', lineHeight: '1.6' }}>
            By registering you agree to our{' '}
            <span style={{ color: '#64748b', textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span>.
          </p>
        </div>
      </div>
    </div>
  );
}