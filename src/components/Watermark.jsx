import React from 'react';

export function Watermark({ logoSrc = '/logo.jpg', opacity = 0.12 }) {
  return (
    <div className="watermark-container" style={{ opacity }}>
      <img className="watermark-img" src={logoSrc} alt="NKFMS Watermark" />
    </div>
  );
}
