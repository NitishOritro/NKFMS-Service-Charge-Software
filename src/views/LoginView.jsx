import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Mail, KeyRound, ShieldCheck, AlertCircle, Eye, ShieldUser, Users } from 'lucide-react';
import { LOGO_BASE64 } from '../assets/logoData';

export function LoginView() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const { data } = useData();

  // 'admin' = ইমেইল ও পাসওয়ার্ড দিয়ে প্রবেশ, 'viewer' = পাসওয়ার্ড ছাড়া
  // শুধু রিপোর্ট দেখা। দুটি ট্যাব — কে কোন পথে ঢুকবেন তা শুরুতেই স্পষ্ট।
  const [mode, setMode] = useState('admin');
  const isViewer = mode === 'viewer';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = isViewer ? await login('viewer', '') : await login(username, password);
      if (!res.ok) {
        setError(res.error || 'লগইন ব্যর্থ হয়েছে।');
      }
    } finally {
      setBusy(false);
    }
  };

  const pickMode = (next) => {
    setMode(next);
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

        <div className="auth-mode-tabs" role="tablist" aria-label="প্রবেশের ধরন">
          <button
            type="button"
            role="tab"
            aria-selected={!isViewer}
            className={`auth-mode-tab${!isViewer ? ' active' : ''}`}
            onClick={() => pickMode('admin')}
          >
            <ShieldUser size={22} color={!isViewer ? 'var(--primary)' : 'var(--text-muted)'} />
            <span className="tab-label">অ্যাডমিন মুড</span>
            <span className="tab-hint">এন্ট্রি ও হিসাব সংশোধন</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isViewer}
            className={`auth-mode-tab viewer${isViewer ? ' active' : ''}`}
            onClick={() => pickMode('viewer')}
          >
            <Users size={22} color={isViewer ? 'var(--success)' : 'var(--text-muted)'} />
            <span className="tab-label">ফ্ল্যাট Owners মুড</span>
            <span className="tab-hint">শুধু রিপোর্ট দেখা</span>
          </button>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          {!isViewer && (
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
              placeholder="অ্যাডমিনের ইমেইল"
              autoComplete="username"
              required
            />
          </div>
          )}

          {!isViewer && (
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
              placeholder="পাসওয়ার্ড দিন"
              autoComplete="current-password"
            />
          </div>
          )}

          {isViewer && (
            <p className="auth-subtitle" style={{ marginBottom: '20px', fontSize: '11.5px' }}>
              ফ্ল্যাট মালিকদের জন্য — পাসওয়ার্ড লাগে না। প্রবেশ করে মাসিক হিসাব,
              বকেয়া তালিকা ও অফিসিয়াল রিপোর্ট দেখতে পারবেন।
            </p>
          )}

          <button
            type="submit"
            className={`btn btn-lg btn-block ${isViewer ? 'btn-success' : 'btn-primary'}`}
            disabled={busy}
          >
            {isViewer ? <Eye size={20} /> : <ShieldCheck size={20} />}
            <span>
              {busy
                ? 'যাচাই করা হচ্ছে…'
                : isViewer ? 'রিপোর্ট দেখতে প্রবেশ করুন' : 'সফটওয়্যারে প্রবেশ করুন'}
            </span>
          </button>
        </form>

        <div className="auth-foot">
          © <span className="society-name">
            {data.settings.societyName || 'নীলকণ্ঠ ফ্ল্যাট মালিক সমিতি'}
          </span> — সংস্করণ ২.০
        </div>
      </div>
    </div>
  );
}
