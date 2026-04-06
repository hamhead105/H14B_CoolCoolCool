import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Spline from '@splinetool/react-spline';

const SPLINE_URL = 'https://prod.spline.design/jmUiqNu0B7WeVqtL/scene.splinecode';

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

function RevealSection({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} variants={fadeUp} initial="hidden"
      animate={inView ? 'show' : 'hidden'} transition={{ delay }} style={style}>
      {children}
    </motion.div>
  );
}

function CountUp({ target, suffix = '', prefix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

function FeatureCard({ icon, title, desc, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#fff' : '#fafaf9',
        border: `1px solid ${hovered ? '#d1d5db' : '#e5e7eb'}`,
        borderRadius: '16px', padding: '32px', cursor: 'default',
        transition: 'all 0.25s ease',
        boxShadow: hovered ? '0 20px 48px rgba(0,0,0,0.08)' : 'none',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: hovered ? '#0d1f3c' : '#f0f4ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '20px', transition: 'background 0.25s',
      }}>
        <span style={{ color: hovered ? '#fff' : '#2563eb', transition: 'color 0.25s' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '16px', fontWeight: '700', color: '#0d1117', marginBottom: '10px', fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.3px' }}>
        {title}
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.7', fontFamily: "'Geist', sans-serif" }}>
        {desc}
      </div>
    </motion.div>
  );
}

const IconBox = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
);
const IconDoc = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);
const IconBadge = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);
const IconScreen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
  </svg>
);
const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const [shouldMountSpline, setShouldMountSpline] = useState(false);
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [, setLoadProgress] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 100]);
  

useEffect(() => {
  const onScroll = () => setNavScrolled(window.scrollY > 20);
  window.addEventListener('scroll', onScroll);

  const timer = setTimeout(() => {
    setShouldMountSpline(true);
  }, 1000);

  return () => {
    window.removeEventListener('scroll', onScroll);
    clearTimeout(timer);
  };
}, []);

  const features = [
    { icon: <IconBox />, title: 'Live Product Catalog', desc: 'Browse thousands of verified SKUs with real-time pricing, supplier specials, and tier-based ordering in grid or tree view.' },
    { icon: <IconDoc />, title: 'PEPPOL UBL Invoicing', desc: 'Every order generates a fully compliant UBL 2.1 purchase order document — audit-ready, automated, zero manual work.' },
    { icon: <IconBadge />, title: 'Loyalty Rewards', desc: 'Buyers earn points on every order across Bronze, Silver and Gold tiers. Consistent purchasing gets recognised and rewarded.' },
    { icon: <IconScreen />, title: 'Seller Dashboard', desc: 'List products, set specials, manage tiers and despatch orders with one click. Full inventory visibility at all times.' },
    { icon: <IconShield />, title: 'Secure by Default', desc: 'JWT authentication, role-based access, and end-to-end data encryption built for Australian business compliance requirements.' },
    { icon: <IconChart />, title: 'Real-time Analytics', desc: 'Track spend, monitor order velocity, and surface product performance trends across your entire supplier network.' },
  ];

  return (
    <div style={{ fontFamily: "'Geist', 'Segoe UI', sans-serif", background: '#fafaf9', overflowX: 'hidden' }}>

      {/* ── Navbar ── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 200,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 56px', 
          height: '64px',
          // Force the background color to override App.css
          backgroundColor: navScrolled ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
          backdropFilter: navScrolled ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: navScrolled ? 'blur(12px)' : 'none', // For Safari support
          borderBottom: navScrolled ? '1px solid rgba(0,0,0,0.08)' : '1px solid transparent',
          transition: 'background-color 0.4s ease, border-bottom 0.4s ease, backdrop-filter 0.4s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px', height: '30px', background: '#fff', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0d1f3c" strokeWidth="2.2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <span style={{
            fontSize: '15px', fontWeight: '700', color: '#fff',
            fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.3px',
            textShadow: navScrolled ? 'none' : '0 1px 4px rgba(0,0,0,0.3)',
            ...(navScrolled && { color: '#0d1117' }),
          }}>CoolCoolCool</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/login')}
            style={{
              padding: '8px 20px', border: `1px solid ${navScrolled ? '#e5e7eb' : 'rgba(255,255,255,0.25)'}`,
              borderRadius: '9px', fontSize: '13px', fontWeight: '500',
              color: navScrolled ? '#374151' : '#fff',
              background: 'transparent', cursor: 'pointer', fontFamily: "'Geist', sans-serif",
              transition: 'all 0.2s',
            }}>Sign in</motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/register')}
            style={{
              padding: '8px 20px', border: 'none', borderRadius: '9px',
              fontSize: '13px', fontWeight: '600', color: '#0d1117',
              background: '#fff', cursor: 'pointer', fontFamily: "'Geist', sans-serif",
              boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
            }}>Get started</motion.button>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section ref={heroRef} style={{
        position: 'relative', height: '100vh', minHeight: '700px',
        background: 'linear-gradient(135deg, #050d1a 0%, #0d1f3c 55%, #0a1628 100%)',
        display: 'flex', alignItems: 'center', overflow: 'hidden', contain: 'layout', 
        isolation: 'isolate'
      }}>
        {/* Grid texture */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }} />
        {/* Blue glow */}
        <div style={{
          position: 'absolute', top: '10%', left: '25%', width: '700px', height: '500px',
          background: 'radial-gradient(ellipse, rgba(37,99,235,0.18) 0%, transparent 65%)',
          pointerEvents: 'none', zIndex: 0,
        }} />
        {/* Purple glow */}
        <div style={{
          position: 'absolute', bottom: '10%', right: '20%', width: '500px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 65%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* ── Spline scene — right half ── */}
        <div 
          style={{
            position: 'absolute', right: '-25%', top: '50%', transform: 'translateY(-50%)', 
            width: '120%', height: '125%', zIndex: 1,
            transformOrigin: 'left center', pointerEvents: 'none',
            contain: 'strict', 
          }}
        >
          {/* 1. Loading Bar: Mounts immediately, fades out when Spline loads */}
          <AnimatePresence>
            {!splineLoaded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }} // Fades out smoothly!
                transition={{ duration: 0.6 }}
                style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '20px', zIndex: 5,
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

          {/* 2. Spline Canvas: Waits for the delay, then fades in */}
          {shouldMountSpline && (
            <motion.div
              initial={{ opacity: 0, scale: 0.55 }}
              animate={{ opacity: splineLoaded ? 1 : 0, scale: splineLoaded ? 0.6 : 0.55 }}
              transition={{ duration: 2, ease: "easeOut" }}
              style={{ width: '100%', height: '100%' }}
            >
              <Spline
                scene={SPLINE_URL}
                onLoad={() => setTimeout(() => setSplineLoaded(true), 200)}
                onProgress={(e) => setLoadProgress(Math.floor(e * 100))}
                style={{ width: '100%', height: '100%' }}
              />
            </motion.div>
          )}
        </div>

        {/* Hero copy — left */}
        <motion.div style={{
          position: 'relative', zIndex: 10,
          padding: '0 0 0 80px', maxWidth: '600px',
          y: heroY,
        }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)',
              borderRadius: '20px', padding: '5px 14px', marginBottom: '32px',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', fontWeight: '500', letterSpacing: '0.3px' }}>
                Built for Australian SMEs
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: 'clamp(44px, 5.5vw, 72px)', fontWeight: '800', color: '#fff',
              margin: '0 0 24px', lineHeight: '1.06', letterSpacing: '-2.5px',
              fontFamily: "'Bricolage Grotesque', sans-serif",
            }}
          >
            Wholesale<br />procurement,<br />
            <span style={{
              background: 'linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>finally simple.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.62 }}
            style={{
              fontSize: '17px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.75',
              margin: '0 0 40px', maxWidth: '420px', fontWeight: '400',
            }}
          >
            Connect with verified Australian suppliers. Manage orders end-to-end with automated PEPPOL invoicing and real-time pricing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.74 }}
            style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
          >
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 10px 40px rgba(96,165,250,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/register')}
              style={{
                padding: '14px 34px',
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                border: 'none', borderRadius: '11px', fontSize: '14px', fontWeight: '600',
                color: '#fff', cursor: 'pointer', fontFamily: "'Geist', sans-serif",
                boxShadow: '0 4px 24px rgba(37,99,235,0.45)',
                letterSpacing: '-0.2px',
              }}>Start for free</motion.button>
            <motion.button
              whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.5)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/login')}
              style={{
                padding: '14px 28px', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.16)', borderRadius: '11px',
                fontSize: '14px', fontWeight: '500', color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer', fontFamily: "'Geist', sans-serif",
                transition: 'border-color 0.2s',
              }}>Sign in</motion.button>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '18px' }}>
            No credit card required
          </motion.p>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          style={{ position: 'absolute', bottom: '36px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
        >
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '2px', textTransform: 'uppercase' }}>Scroll</span>
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            style={{ width: '1px', height: '36px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.35), transparent)' }}
          />
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <motion.div
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}
        >
          {[
            { target: 2400, suffix: '+', prefix: '', label: 'Products listed' },
            { target: 180, suffix: '+', prefix: '', label: 'Verified suppliers' },
            { target: 12, suffix: 'M+', prefix: '$', label: 'Dollars processed' },
            { target: 99, suffix: '.9%', prefix: '', label: 'Uptime SLA' },
          ].map((s, i) => (
            <motion.div key={s.label} variants={fadeUp}
              style={{
                padding: '44px 32px', textAlign: 'center',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}
            >
              <div style={{
                fontSize: '40px', fontWeight: '800', color: '#fff',
                fontFamily: "'Bricolage Grotesque', sans-serif",
                letterSpacing: '-2px', marginBottom: '6px',
              }}>
                <CountUp target={s.target} suffix={s.suffix} prefix={s.prefix} />
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontWeight: '400' }}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '120px 56px', background: '#fafaf9' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <RevealSection>
            <div style={{ textAlign: 'center', marginBottom: '72px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: '20px', padding: '5px 14px', marginBottom: '20px',
              }}>
                <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600' }}>Platform capabilities</span>
              </div>
              <h2 style={{
                fontSize: 'clamp(30px, 4vw, 50px)', fontWeight: '800', color: '#0d1117',
                margin: '0 0 16px', fontFamily: "'Bricolage Grotesque', sans-serif",
                letterSpacing: '-1.5px', lineHeight: '1.1',
              }}>
                Everything your business<br />needs to procure at scale
              </h2>
              <p style={{ fontSize: '17px', color: '#6b7280', maxWidth: '480px', margin: '0 auto', lineHeight: '1.7' }}>
                One platform connecting Australian wholesale buyers and suppliers with the tools to trade efficiently.
              </p>
            </div>
          </RevealSection>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {features.map((f, i) => <FeatureCard key={f.title} {...f} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: '120px 56px', background: '#fff', borderTop: '1px solid #f3f4f6' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <RevealSection>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <h2 style={{
                fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: '800', color: '#0d1117',
                margin: '0 0 16px', fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-1.5px',
              }}>Up and running in minutes</h2>
              <p style={{ fontSize: '16px', color: '#6b7280', maxWidth: '400px', margin: '0 auto', lineHeight: '1.7' }}>
                No lengthy onboarding. No integration complexity. Sign up and start trading.
              </p>
            </div>
          </RevealSection>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0', position: 'relative' }}>
            <div style={{
              position: 'absolute', top: '31px', left: 'calc(16.66% + 16px)', right: 'calc(16.66% + 16px)',
              height: '1px', background: 'linear-gradient(90deg, transparent, #2563eb, transparent)', zIndex: 0,
            }} />
            {[
              { step: '01', title: 'Create your account', desc: 'Register as a buyer or seller. Takes under two minutes with no documents required to get started.' },
              { step: '02', title: 'Browse or list products', desc: 'Buyers explore the full catalog with filters and live pricing. Sellers list SKUs and set specials instantly.' },
              { step: '03', title: 'Trade and get paid', desc: 'Place orders, generate UBL invoices automatically, and manage despatch — all from one dashboard.' },
            ].map((s, i) => (
              <RevealSection key={s.step} delay={i * 0.15} style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ padding: '0 40px', textAlign: 'center' }}>
                  <div style={{
                    width: '62px', height: '62px', borderRadius: '50%',
                    background: '#fff', border: '2px solid #e5e7eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 28px', fontFamily: "'Bricolage Grotesque', sans-serif",
                    fontSize: '12px', fontWeight: '700', color: '#2563eb',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  }}>{s.step}</div>
                  <h3 style={{
                    fontSize: '18px', fontWeight: '700', color: '#0d1117',
                    margin: '0 0 12px', fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.3px',
                  }}>{s.title}</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.7', margin: 0 }}>{s.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section style={{ padding: '72px 56px', background: '#fafaf9', borderTop: '1px solid #f3f4f6' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <RevealSection>
            <p style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '32px' }}>
              Trusted by Australian businesses
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '56px', flexWrap: 'wrap' }}>
              {['RETAIL CO.', 'PACIFIC TRADE', 'MERIDIAN GROUP', 'SOUTHGATE', 'APEX SUPPLY'].map(name => (
                <span key={name} style={{
                  fontSize: '14px', fontWeight: '800', color: '#9ca3af',
                  fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '1.5px',
                }}>{name}</span>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '0 56px 120px', background: '#fafaf9' }}>
        <RevealSection>
          <div style={{
            maxWidth: '1100px', margin: '0 auto',
            background: 'linear-gradient(135deg, #050d1a 0%, #0d1f3c 100%)',
            borderRadius: '24px', padding: '88px 72px', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '24px',
              backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
              backgroundSize: '44px 44px',
            }} />
            <div style={{
              position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)',
              width: '600px', height: '300px',
              background: 'radial-gradient(ellipse, rgba(37,99,235,0.22) 0%, transparent 65%)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{
                fontSize: 'clamp(32px, 4vw, 54px)', fontWeight: '800', color: '#fff',
                margin: '0 0 16px', letterSpacing: '-1.5px', lineHeight: '1.1',
                fontFamily: "'Bricolage Grotesque', sans-serif",
              }}>Ready to streamline<br />procurement?</h2>
              <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.45)', marginBottom: '48px', lineHeight: '1.7' }}>
                Join Australian businesses already trading on CoolCoolCool.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 10px 40px rgba(96,165,250,0.35)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/register')}
                  style={{
                    padding: '15px 40px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    border: 'none', borderRadius: '11px', fontSize: '15px', fontWeight: '600',
                    color: '#fff', cursor: 'pointer', fontFamily: "'Geist', sans-serif",
                    boxShadow: '0 4px 24px rgba(37,99,235,0.4)',
                  }}>Register as a Buyer</motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/register')}
                  style={{
                    padding: '15px 40px', background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.14)', borderRadius: '11px',
                    fontSize: '15px', fontWeight: '600', color: 'rgba(255,255,255,0.75)',
                    cursor: 'pointer', fontFamily: "'Geist', sans-serif",
                    transition: 'border-color 0.2s',
                  }}>Register as a Seller</motion.button>
              </div>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: '36px 56px', borderTop: '1px solid #f3f4f6', background: '#fafaf9' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '26px', height: '26px', background: '#0d1f3c', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0d1117', fontFamily: "'Bricolage Grotesque', sans-serif" }}>CoolCoolCool</span>
          </div>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>© 2025 CoolCoolCool Pty Ltd · Australia</p>
        </div>
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}