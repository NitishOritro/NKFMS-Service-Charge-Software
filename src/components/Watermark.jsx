import React from 'react';
import logoImg from '../assets/logo.jpg';

export function Watermark({ logoSrc = logoImg, opacity = 0.12 }) {
  return (
    <div className="watermark-container" style={{ opacity }}>
      <img className="watermark-img" src={logoSrc} alt="NKFMS Watermark" />
    </div>
  );
}
