import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Lock, User, KeyRound, ShieldCheck } from 'lucide-react';
import { LOGO_BASE64 } from '../assets/logoData';

export function LoginView() {
  const [username, setUsername] = useState('nitish');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { data } = useData();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const res = login(username, password, data.users);
    if (!res.ok) {
      setError(res.error || 'লগইন ব্যর্থ হয়েছে।');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 20%, #1e293b 0%, #0f172a 60%, #020617 100%)',
        padding: '30px 20px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Ambient background glow accents */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(2, 132, 199, 0.15)',
          filter: 'blur(100px)',
          top: '-100px',
          left: '20%',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.1)',
          filter: 'blur(90px)',
          bottom: '-50px',
          right: '25%',
          pointerEvents: 'none'
        }}
      />

      {/* Main Spacious Login Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          width: '100%',
          maxWidth: '540px',
          padding: '46px 42px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <img
            src={LOGO_BASE64}
            alt="NKFMS Official Logo"
            style={{
              width: '124px',
              height: '124px',
              objectFit: 'contain',
              mixBlendMode: 'multiply'
            }}
          />
        </div>

        {/* Big Bold Bengali Typography */}
        <h2
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: '6px',
            letterSpacing: '0.2px',
            lineHeight: 1.3
          }}
        >
          {data.settings.societyName || 'নীলকণ্ঠ ফ্ল্যাট মালিক সমিতি'}
        </h2>
        <p
          style={{
            fontSize: '15.5px',
            color: '#64748b',
            fontWeight: 600,
            marginBottom: '30px'
          }}
        >
          {data.settings.committeeName || 'ভবন ব্যবস্থাপনা ও সার্ভিস চার্জ কমিটি'}
        </p>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '22px',
              textAlign: 'left'
            }}
          >
            {error}
          </div>
        )}

        {/* Login Form with Enlarged Inputs */}
        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label
              className="form-label"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '15px',
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: '8px'
              }}
            >
              <User size={18} color="#0284c7" /> ইউজারনেম
            </label>
            <input
              type="text"
              className="form-input"
              style={{
                fontSize: '16px',
                padding: '13px 18px',
                borderRadius: '12px',
                border: '1.5px solid #cbd5e1',
                fontWeight: 600
              }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ইউজারনেম দিন"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label
              className="form-label"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '15px',
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: '8px'
              }}
            >
              <KeyRound size={18} color="#0284c7" /> পাসওয়ার্ড
            </label>
            <input
              type="password"
              className="form-input"
              style={{
                fontSize: '16px',
                padding: '13px 18px',
                borderRadius: '12px',
                border: '1.5px solid #cbd5e1',
                fontWeight: 600
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="পাসওয়ার্ড দিন (ঐচ্ছিক)"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '15px 24px',
              fontSize: '17px',
              fontWeight: 800,
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.4)',
              letterSpacing: '0.3px',
              cursor: 'pointer'
            }}
          >
            <ShieldCheck size={22} />
            <span>সফটওয়্যারে প্রবেশ করুন</span>
          </button>
        </form>

        {/* Quick Role Selection Buttons */}
        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px', fontWeight: 600 }}>
            এক ক্লিকে ইউজার নির্বাচন করুন:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                setUsername('nitish');
                setPassword('');
              }}
              style={{
                padding: '10px 8px',
                borderRadius: '10px',
                border: username === 'nitish' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                background: username === 'nitish' ? '#f0f9ff' : '#fff',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>👑 অ্যাডমিন (Admin)</div>
              <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '2px' }}>ইউজার: nitish (সম্পূর্ণ নিয়ন্ত্রণ)</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setUsername('viewer');
                setPassword('');
              }}
              style={{
                padding: '10px 8px',
                borderRadius: '10px',
                border: username === 'viewer' ? '2px solid #10b981' : '1px solid #cbd5e1',
                background: username === 'viewer' ? '#ecfdf5' : '#fff',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>👁️ ভিউ মুড (View Only)</div>
              <div style={{ fontSize: '12px', color: '#059669', marginTop: '2px' }}>ইউজার: viewer (শুধু দেখার সুবিধা)</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
