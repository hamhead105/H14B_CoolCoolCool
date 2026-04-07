import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Spline from '@splinetool/react-spline';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../apiConfig';
import { AnimatePresence } from 'framer-motion';

const SPLINE_URL = 'https://prod.spline.design/uuHgNblqFyjBE7WO/scene.splinecode';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  
  const role = localStorage.getItem('role'); 
  const userId = role === 'buyer' ? localStorage.getItem('buyerId') : localStorage.getItem('sellerId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token || !userId) { navigate('/login'); return; }

    const endpoint = role === 'buyer' ? `/buyers/${userId}` : `/sellers/${userId}`;
    
    fetch(`${API_BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setFormData(data);
        setLoading(false);
      })
      .catch(err => console.error("Fetch error:", err));
  }, [userId, role, token, navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const endpoint = role === 'buyer' ? `/buyers/${userId}` : `/sellers/${userId}`;

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setToastMsg('Neural profile synchronized successfully.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000); // Auto-hide
      }
    } catch (err) {
      setToastMsg('Sync failed. Check uplink.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        style={{ width: '40px', height: '40px', border: '2px solid rgba(255,255,255,0.06)', borderTopColor: '#3b82f6', borderRadius: '50%' }} />
    </div>
  );

  const accentColor = role === 'buyer' ? '#3b82f6' : '#a78bfa';

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#050d1a', color: '#fff', fontFamily: "'Geist', sans-serif", overflow: 'hidden' }}>
      <Sidebar />
      
      {/* ── Fixed Background Infrastructure ── */}
      <div style={{ position: 'fixed', inset: 0, left: '260px', zIndex: 0, pointerEvents: 'none' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: splineLoaded ? 0.5 : 0 }}
          transition={{ duration: 2 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <Spline scene={SPLINE_URL} onLoad={() => setSplineLoaded(true)} />
        </motion.div>
        
        {/* Dark overlay for readability */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,13,26,0.65)' }} />
        
        {/* Grid Texture */}
        <div style={{ 
          position: 'absolute', inset: 0, 
          backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`, 
          backgroundSize: '56px 56px' 
        }} />
        
        {/* The accent glow */}
        <div style={{ 
          position: 'absolute', top: '0', right: '0', 
          width: '600px', height: '600px', 
          background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)` 
        }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, overflowY: 'auto' }}>
        <main style={{ padding: '60px 40px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
          <header style={{ marginBottom: '48px' }}>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px', fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Account Configuration
            </motion.h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '4px' }}>
              Manage your {role} node and operational parameters.
            </p>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '48px', alignItems: 'start' }}>
            
            {/* Left: Avatar Glass Card */}
            <motion.section
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            >
              <div style={{ 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid rgba(255,255,255,0.08)', 
                borderRadius: '28px', padding: '40px', 
                textAlign: 'center', backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
              }}>
                <div style={{ 
                  width: '90px', height: '90px', 
                  background: `linear-gradient(135deg, ${accentColor}, #7c3aed)`, 
                  borderRadius: '24px', margin: '0 auto 24px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: '36px', fontWeight: '800', 
                  boxShadow: `0 10px 40px ${accentColor}44`,
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  {formData.name?.charAt(0) || role?.charAt(0).toUpperCase()}
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: '700' }}>{formData.name || formData.businessName}</h3>
                <div style={{ 
                  display: 'inline-block', padding: '4px 12px', 
                  background: `${accentColor}15`, border: `1px solid ${accentColor}33`, 
                  borderRadius: '20px', color: accentColor, 
                  fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' 
                }}>
                  {role} authorized
                </div>
              </div>
            </motion.section>

            {/* Right: Form Glass Panel */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '28px', padding: '48px', 
                backdropFilter: 'blur(30px)',
                boxShadow: '0 30px 60px rgba(0,0,0,0.4)'
              }}
            >
              <form onSubmit={handleSave} style={{ display: 'grid', gap: '32px' }}>
                
                {/* Global Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <Input label="Identity Name" value={formData.name || ''} onChange={v => setFormData({...formData, name: v})} />
                  <Input label="Communication Email" value={formData.email || ''} onChange={v => setFormData({...formData, email: v})} />
                </div>

                <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)' }} />

                {/* Role Specific Fields */}
                {role === 'buyer' ? (
                  <>
                    <Input label="Street Address" value={formData.street || ''} onChange={v => setFormData({...formData, street: v})} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <Input label="City" value={formData.city || ''} onChange={v => setFormData({...formData, city: v})} />
                      <Input label="Postal Code" value={formData.postalCode || ''} onChange={v => setFormData({...formData, postalCode: v})} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <Input label="Country Code (AU)" value={formData.countryCode || ''} onChange={v => setFormData({...formData, countryCode: v})} />
                      {/* Use 'contactPhone' instead of 'phone' */}
                      <Input label="Contact Phone" value={formData.contactPhone || ''} onChange={v => setFormData({...formData, contactPhone: v})} />
                    </div>
                  </>
                ) : (
                  <>
                    <Input label="Street Address" value={formData.street || ''} onChange={v => setFormData({...formData, street: v})} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <Input label="ABN / Company ID" value={formData.companyId || ''} onChange={v => setFormData({...formData, companyId: v})} />
                      <Input label="Legal Entity ID" value={formData.legalEntityId || ''} onChange={v => setFormData({...formData, legalEntityId: v})} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <Input label="Contact Name" value={formData.contactName || ''} onChange={v => setFormData({...formData, contactName: v})} />
                      <Input label="Contact Phone" value={formData.contactPhone || ''} onChange={v => setFormData({...formData, contactPhone: v})} />
                    </div>
                    <Input label="Operational Support Email" value={formData.contactEmail || ''} onChange={v => setFormData({...formData, contactEmail: v})} />
                  </>
                )}

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: `0 0 30px ${accentColor}44` }}
                  whileTap={{ scale: 0.98 }}
                  disabled={saving}
                  style={{
                    marginTop: '12px', padding: '16px', borderRadius: '14px', border: 'none',
                    background: saving ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${accentColor}, #7c3aed)`,
                    color: '#fff', fontWeight: '800', fontSize: '14px', cursor: 'pointer',
                    letterSpacing: '1px', transition: 'all 0.3s'
                  }}
                >
                  {saving ? 'UPDATING NEURAL LINKS...' : 'SYNCHRONIZE DATA'}
                </motion.button>
              </form>
            </motion.section>
          </div>
        </main>
      </div>
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            style={{
              position: 'fixed',
              bottom: '40px',
              right: '40px',
              zIndex: 1000,
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${accentColor}44`,
              borderRadius: '16px',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: `0 20px 40px rgba(0,0,0,0.4), 0 0 20px ${accentColor}22`
            }}
          >
            <div style={{ 
              width: '8px', height: '8px', 
              borderRadius: '50%', background: accentColor,
              boxShadow: `0 0 10px ${accentColor}`
            }} />
            <span style={{ 
              fontSize: '14px', fontWeight: '600', color: '#fff', 
              letterSpacing: '0.2px' 
            }}>
              {toastMsg}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <label style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{label}</label>
      <input 
        type="text" 
        value={value} 
        onChange={e => onChange(e.target.value)}
        style={{ 
          background: 'rgba(255,255,255,0.04)', 
          border: '1px solid rgba(255,255,255,0.08)', 
          borderRadius: '12px', padding: '14px 18px', 
          color: '#fff', outline: 'none', fontSize: '14px',
          transition: 'all 0.2s'
        }}
        onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.3)'; e.target.style.background = 'rgba(255,255,255,0.07)'; }}
        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
      />
    </div>
  );
}