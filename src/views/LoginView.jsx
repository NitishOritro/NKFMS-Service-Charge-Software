import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Mail, KeyRound, ShieldCheck, AlertCircle, Eye } from 'lucide-react';
import { LOGO_BASE64 } from '../assets/logoData';

export function LoginView() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const { data } = useData();

  const isViewer = username.trim().toLowerCase() === 'viewer';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await login(username, password);
      if (!res.ok) {
        setError(res.error || 'লগইন ব্যর্থ হয়েছে।');
      }
    } finally {
      setBusy(false);
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
                <Mail size={16} color="var(--primary)" /> ইমেইল
              </span>
            </label>
            <input
              id="login-username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="অ্যাডমিনের ইমেইল — শুধু দেখতে চাইলে viewer"
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
              placeholder={isViewer ? 'ভিউ মোডে পাসওয়ার্ড লাগে না' : 'পাসওয়ার্ড দিন'}
              autoComplete="current-password"
              disabled={isViewer}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
            <ShieldCheck size={20} />
            <span>{busy ? 'যাচাই করা হচ্ছে…' : 'সফটওয়্যারে প্রবেশ করুন'}</span>
          </button>
        </form>

        <div className="auth-divider">এক ক্লিকে ইউজার নির্বাচন</div>

        <div className="auth-role-grid">
          <button
            type="button"
            onClick={() => pickRole('viewer')}
            className={`auth-role-btn ${isViewer ? 'selected-viewer' : ''}`}
            style={{ gridColumn: '1 / -1' }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
              <Eye size={15} /> পাসওয়ার্ড ছাড়া দেখুন (View Only)
            </span>
          </button>
        </div>

        <div className="auth-foot">
          © {data.settings.societyName || 'নীলকণ্ঠ ফ্ল্যাট মালিক সমিতি'} — সংস্করণ ২.০
        </div>
      </div>
    </div>
  );
}
