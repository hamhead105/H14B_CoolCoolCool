import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const API_BASE = 'https://h14-b-cool-cool-cool.vercel.app';

function StatCard({ label, value, sub, color = '#2563eb', icon }) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e8eaf0', padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>{label}</div>
        <div style={{ width: '34px', height: '34px', background: `${color}18`, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{icon}</div>
      </div>
      <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: '#94a3b8' }}>{sub}</div>}
    </div>
  );
}

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const buyerId = localStorage.getItem('buyerId');
  const [buyer, setBuyer] = useState(null);
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !buyerId) { navigate('/login'); return; }
    Promise.all([
      fetch(`${API_BASE}/buyers/${buyerId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => { if (r.status === 401) { navigate('/login'); throw new Error(); } return r.json(); }),
      fetch(`${API_BASE}/buyers/${buyerId}/loyalty`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([b, l]) => { setBuyer(b); setLoyalty(l); }).catch(() => {}).finally(() => setLoading(false));
  }, [buyerId, navigate]);

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Loading dashboard…</div>
        </div>
      </div>
    </div>
  );

  const points = loyalty?.loyaltyPoints ?? 0;
  const tier = points >= 500 ? 'Gold' : points >= 200 ? 'Silver' : 'Bronze';
  const tierColor = tier === 'Gold' ? '#f59e0b' : tier === 'Silver' ? '#94a3b8' : '#cd7c54';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header style={{ background: '#fff', borderBottom: '1px solid #e8eaf0', padding: '0 28px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>Dashboard</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Welcome back{buyer?.businessName ? `, ${buyer.businessName}` : ''}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: `${tierColor}18`, border: `1px solid ${tierColor}44`, borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '600', color: tierColor }}>
              {tier} Member
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '28px' }}>
            <StatCard label="Loyalty Points" value={points.toLocaleString()} sub={`${tier} tier · Next tier at ${tier === 'Bronze' ? 200 : tier === 'Silver' ? 500 : '∞'} pts`} color="#f59e0b" icon="🏆" />
            <StatCard label="Products Available" value="Browse" sub="Explore the full catalog" color="#2563eb" icon="📦" />
            <StatCard label="Member Since" value={buyer?.createdAt ? new Date(buyer.createdAt).getFullYear() : '—'} sub="Account in good standing" color="#10b981" icon="✅" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
            {/* Quick Actions */}
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8eaf0', padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 18px' }}>Quick actions</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { icon: '🔍', label: 'Browse Products', desc: 'Explore catalog & add to cart', action: () => navigate('/products'), primary: true },
                  { icon: '🛒', label: 'View Cart', desc: 'Review items and checkout', action: () => navigate('/cart') },
                ].map(a => (
                  <button key={a.label} onClick={a.action}
                    style={{
                      background: a.primary ? '#eff6ff' : '#f8fafc',
                      border: `1px solid ${a.primary ? '#bfdbfe' : '#e8eaf0'}`,
                      borderRadius: '12px', padding: '18px', textAlign: 'left', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>{a.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{a.label}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{a.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Profile summary */}
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8eaf0', padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px' }}>Your profile</h2>
              {buyer ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Business', value: buyer.businessName },
                    { label: 'Email', value: buyer.email },
                    { label: 'Phone', value: buyer.phone || '—' },
                    { label: 'Address', value: buyer.address || '—' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{row.label}</span>
                      <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '500' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>Unable to load profile.</div>
              )}
            </div>
          </div>

          {/* Loyalty progress */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8eaf0', padding: '24px', marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 3px' }}>Loyalty Progress</h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Earn points on every order.</p>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b' }}>{points} pts</div>
            </div>
            <div style={{ display: 'flex', gap: '0', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
              {[
                { tier: 'Bronze', min: 0, max: 200, color: '#cd7c54' },
                { tier: 'Silver', min: 200, max: 500, color: '#94a3b8' },
                { tier: 'Gold', min: 500, max: 1000, color: '#f59e0b' },
              ].map(({ tier: t, min, max, color }) => {
                const isActive = tier === t;
                return (
                  <div key={t} style={{ flex: 1, background: isActive ? color : `${color}33`, padding: '10px 14px', transition: 'all 0.2s' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: isActive ? '#fff' : color, marginBottom: '2px' }}>{t}</div>
                    <div style={{ fontSize: '10px', color: isActive ? 'rgba(255,255,255,0.8)' : '#94a3b8' }}>{min}–{max} pts</div>
                  </div>
                );
              })}
            </div>
            {tier !== 'Gold' && (
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                You need <strong style={{ color: '#0f172a' }}>{(tier === 'Bronze' ? 200 : 500) - points} more points</strong> to reach {tier === 'Bronze' ? 'Silver' : 'Gold'}.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}