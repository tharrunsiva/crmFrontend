import React, { useState } from 'react';
import { BACKEND_URL } from '../../config.js';

const CompanyLogo = ({ height = 32, theme = 'dark' }) => {
  const [hasError, setHasError] = useState(false);
  const logoUrl = `${BACKEND_URL}/uploads/logo.png`;
  
  if (hasError) {
    const textColor = theme === 'light' ? '#0F172A' : '#FFFFFF';
    return (
      <svg height={height} viewBox="0 0 180 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
        {/* Icon Mark */}
        <path d="M18 4L4 13L18 22L32 13L18 4Z" fill="url(#logoGrad)" />
        <path d="M4 21L18 29L32 21" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" />
        
        {/* Logo Text */}
        <text
          x="42"
          y="23"
          fill={textColor}
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: '15px',
            letterSpacing: '1px'
          }}
        >
          VINSUP
        </text>
        <text
          x="108"
          y="23"
          fill="url(#logoGrad)"
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: '15px',
            letterSpacing: '1px'
          }}
        >
          CRM
        </text>
        
        <defs>
          <linearGradient id="logoGrad" x1="4" y1="4" x2="32" y2="29" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563EB" />
            <stop offset="1" stopColor="#4F46E5" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  return (
    <img 
      src={logoUrl} 
      alt="Vinsup CRM Logo" 
      style={{ height: `${height}px`, objectFit: 'contain', display: 'block' }}
      onError={() => setHasError(true)}
    />
  );
};

export default CompanyLogo;
