import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { User, KeyRound, ShieldCheck, AlertCircle } from 'lucide-react';
import { LOGO_BASE64 } from '../assets/logoData';

export function LoginView() {
  const [username, setUsername] = useState('nitish');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { data } = useData();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(username, password, data.users);
    if (!res.ok) {
      setError(res.error || 'লগইন ব্যর্থ হয়েছে।');
    }
  };

  const pickRole = (name) => {
    setUsername(name);
    setPassword('');
    setError('');
  };

  return (
    <div className="auth-screen">
      {/* পটভূমির নরম আলোকচ্ছটা */}
      <div
        className="auth-glow"
        style={{
          width: '520px',
          height: '520px',
          background: 'rgba(2, 132, 199, 0.16)',
          top: '-120px',
          left: '18%'
        }}
      />
      <div
        className="auth-glow"
        style={{
          width: '420px',
          height: '420px',
          background: 'rgba(16, 185, 129, 0.1)',
          bottom: '-60px',
          right: '22%'
        }}
      />

      <div className="auth-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
          <img src={LOGO_BASE64} alt="NKFMS Official Logo" className="auth-logo" />
        </div>

        <h2 className="auth-title">
          {data.settings.societyName || 'নীলকণ্ঠ ফ্ল্যাট মালিক সমিতি'}
        </h2>
        <p className="auth-subtitle">
          {data.settings.committeeName || 'ভবন ব্যবস্থাপনা ও সার্ভিস চার্জ কমিটি'}
        </p>

        <div className="auth-divider">সার্ভিস চার্জ ব্যবস্থাপনা সফটওয়্যার</div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="login-username">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                <User size={16} color="var(--primary)" /> ইউজারনেম
              </span>
            </label>
            <input
              id="login-username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ইউজারনেম দিন"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="login-password">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                <KeyRound size={16} color="var(--primary)" /> পাসওয়ার্ড
              </span>
            </label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={username === 'nitish' ? 'পাসওয়ার্ড দিন' : 'পাসওয়ার্ড (ঐচ্ছিক)'}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block">
            <ShieldCheck size={20} />
            <span>সফটওয়্যারে প্রবেশ করুন</span>
          </button>
        </form>

        <div className="auth-divider">এক ক্লিকে ইউজার নির্বাচন</div>

        <div className="auth-role-grid">
          <button
            type="button"
            onClick={() => pickRole('nitish')}
            className={`auth-role-btn ${username === 'nitish' ? 'selected-admin' : ''}`}
          >
            অ্যাডমিন (Admin)
          </button>

          <button
            type="button"
            onClick={() => pickRole('viewer')}
            className={`auth-role-btn ${username === 'viewer' ? 'selected-viewer' : ''}`}
          >
            ভিউ মুড (View Only)
          </button>
        </div>

        <div className="auth-foot">
          © {data.settings.societyName || 'নীলকণ্ঠ ফ্ল্যাট মালিক সমিতি'} — সংস্করণ ২.০
        </div>
      </div>
    </div>
  );
}
