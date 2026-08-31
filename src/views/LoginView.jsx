import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Lock, User, KeyRound, ShieldCheck } from 'lucide-react';
import logoImg from '../assets/logo.jpg';

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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '20px'
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          width: '100%',
          maxWidth: '420px',
          padding: '32px 28px',
          textAlign: 'center'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <img
            src={logoImg}
            alt="NKFMS Logo"
            style={{
              width: '96px',
              height: '96px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.12))'
            }}
          />
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
          {data.settings.societyName || 'নীলকণ্ঠ ফ্ল্যাট মালিক সমিতি'}
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
          {data.settings.committeeName || 'ভবন ব্যবস্থাপনা ও সার্ভিস চার্জ কমিটি'}
        </p>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              marginBottom: '18px',
              textAlign: 'left'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={15} color="#0284c7" /> ইউজারনেম
            </label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ইউজারনেম দিন"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '22px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={15} color="#0284c7" /> পাসওয়ার্ড
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="পাসওয়ার্ড দিন"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 700 }}
          >
            <ShieldCheck size={18} />
            <span>সফটওয়্যারে প্রবেশ করুন</span>
          </button>
        </form>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#94a3b8' }}>
          ডিফল্ট ইউজারনেম: <b style={{ color: '#0f172a' }}>nitish</b> &nbsp;|&nbsp; ডেমো এক্সেস সচল
        </div>
      </div>
    </div>
  );
}
