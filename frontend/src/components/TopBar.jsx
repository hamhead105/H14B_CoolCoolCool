// components/TopBar.jsx
// Reusable sticky top header used across dashboard/protected pages.
// Props:
//   title       - string, bold heading
//   subtitle    - string, small muted subheading
//   children    - right-side slot (buttons, badges, etc.)

import React from 'react';

export default function TopBar({ title, subtitle, children }) {
  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid #e8eaf0',
      padding: '0 28px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexShrink: 0,
    }}>
      <div>
        {title && (
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{title}</div>
        )}
        {subtitle && (
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{subtitle}</div>
        )}
      </div>
      {children && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {children}
        </div>
      )}
    </header>
  );
}