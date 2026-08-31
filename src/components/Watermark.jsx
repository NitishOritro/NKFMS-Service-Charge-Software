import React from 'react';
import { LOGO_BASE64 } from '../assets/logoData';

export function Watermark({ logoSrc = LOGO_BASE64, opacity = 0.12 }) {
  return (
    <div className="watermark-container" style={{ opacity }}>
      <img className="watermark-img" src={logoSrc} alt="NKFMS Watermark" />
    </div>
  );
}
