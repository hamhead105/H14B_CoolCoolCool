import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  const Btn = ({ children, primary, onClick, style = {} }) => (
    <button
      onClick={onClick}
      style={{
        padding: '12px 24px', border: primary ? 'none' : '1px solid #e2e8f0',
        borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
        background: primary ? '#2563eb' : '#fff',
        color: primary ? '#fff' : '#0f172a',
        transition: 'all 0.15s',
        ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = primary ? '#1d4ed8' : '#f8fafc'; }}
      onMouseLeave={e => { e.currentTarget.style.background = primary ? '#2563eb' : '#fff'; }}
    >{children}</button>
  );

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: '#fff', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: '64px', borderBottom: '1px solid #f1f5f9',
        position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: '#2563eb', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>CoolCoolCool</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Btn onClick={() => navigate('/login')}>Sign in</Btn>
          <Btn primary onClick={() => navigate('/register')}>Get started →</Btn>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        textAlign: 'center', padding: '100px 48px 80px',
        background: 'linear-gradient(180deg,#f0f4ff 0%,#fff 100%)',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '20px', padding: '5px 14px', marginBottom: '28px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
          <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600' }}>Built for Australian SMEs</span>
        </div>
        <h1 style={{ fontSize: '56px', fontWeight: '900', color: '#0f172a', margin: '0 auto 20px', maxWidth: '720px', lineHeight: '1.1', letterSpacing: '-1.5px' }}>
          Wholesale procurement,<br />
          <span style={{ color: '#2563eb' }}>finally simple.</span>
        </h1>
        <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '520px', margin: '0 auto 40px', lineHeight: '1.7' }}>
          Connect with verified Australian suppliers, manage orders end-to-end, and grow your business with real-time pricing and automated invoicing.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Btn primary onClick={() => navigate('/register')} style={{ padding: '14px 32px', fontSize: '15px' }}>Start for free →</Btn>
          <Btn onClick={() => navigate('/login')} style={{ padding: '14px 32px', fontSize: '15px' }}>Sign in</Btn>
        </div>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '18px' }}>No credit card required · Free to get started</p>
      </section>

      {/* Stats */}
      <section style={{ display: 'flex', justifyContent: 'center', gap: '0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        {[
          { value: '2,400+', label: 'Products listed' },
          { value: '180+', label: 'Verified suppliers' },
          { value: '$12M+', label: 'Orders processed' },
          { value: '99.9%', label: 'Uptime SLA' },
        ].map((s, i) => (
          <div key={s.label} style={{
            flex: 1, textAlign: 'center', padding: '36px 24px',
            borderRight: i < 3 ? '1px solid #f1f5f9' : 'none',
          }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section style={{ padding: '80px 48px', maxWidth: '1080px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.5px' }}>Everything you need</h2>
          <p style={{ fontSize: '16px', color: '#64748b' }}>One platform for buyers and sellers in the Australian wholesale market.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px' }}>
          {[
            { icon: '🔍', title: 'Smart Product Catalog', desc: 'Browse thousands of SKUs with real-time pricing, special deals, and tier-based ordering. Grid and tree views for every workflow.' },
            { icon: '📋', title: 'UBL-Compliant Orders', desc: 'Generate and exchange purchase orders in the PEPPOL UBL format — audit-ready, automated, and standards-compliant.' },
            { icon: '🏆', title: 'Loyalty Rewards', desc: 'Buyers earn points on every order. Redeem for discounts and perks. Keep your best suppliers happy too.' },
            { icon: '📦', title: 'Despatch & Invoicing', desc: 'Sellers confirm, pack, and despatch with one click. Buyers get automated invoice notifications instantly.' },
            { icon: '📊', title: 'Dashboards & Analytics', desc: 'Real-time dashboards for buyers and sellers. Track spending, product performance, and order history at a glance.' },
            { icon: '🔒', title: 'Secure & Compliant', desc: 'JWT authentication, role-based access control, and data encryption. Built for Australian business requirements.' },
          ].map(f => (
            <div key={f.title} style={{ background: '#f8fafc', borderRadius: '14px', padding: '28px', border: '1px solid #e8eaf0' }}>
              <div style={{ fontSize: '28px', marginBottom: '14px' }}>{f.icon}</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>{f.title}</div>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.65', margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#0f172a', margin: '0 48px 80px', borderRadius: '20px', padding: '64px 48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#fff', marginBottom: '14px', letterSpacing: '-0.5px' }}>Ready to streamline procurement?</h2>
        <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '36px' }}>Join thousands of Australian businesses already on CoolCoolCool.</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/register')}
            style={{ padding: '14px 32px', background: '#2563eb', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', color: '#fff', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
            onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
          >Register as a Buyer →</button>
          <button onClick={() => navigate('/register')}
            style={{ padding: '14px 32px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', fontSize: '15px', fontWeight: '700', color: '#fff', cursor: 'pointer' }}
          >Register as a Seller</button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '24px 48px 48px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ width: '24px', height: '24px', background: '#2563eb', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>CoolCoolCool</span>
        </div>
        <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>© 2025 CoolCoolCool Pty Ltd · Australia · ABN 00 000 000 000</p>
      </footer>
    </div>
  );
}