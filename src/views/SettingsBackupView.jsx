import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import * as U from '../utils/format';
import { Settings, Download, Upload, AlertTriangle, Save, RefreshCw } from 'lucide-react';

export function SettingsBackupView() {
  const { data, updateSettings, exportBackupJson, importBackupJson, resetToDefault } = useData();

  const [settingsForm, setSettingsForm] = useState({
    societyName: data.settings.societyName || '',
    committeeName: data.settings.committeeName || '',
    monthlyRate: data.settings.monthlyRate || 1500,
    startMonth: data.settings.startMonth || '2024-08'
  });

  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateSettings({
      societyName: settingsForm.societyName,
      committeeName: settingsForm.committeeName,
      monthlyRate: Number(settingsForm.monthlyRate),
      startMonth: settingsForm.startMonth
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        importBackupJson(parsed);
      } catch (err) {
        alert('ভুল ফাইল ফরম্যাট! সঠিক JSON ফাইল আপলোড করুন।');
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  return (
    <div className="page-body">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        {/* General Settings */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Settings size={18} color="var(--primary)" />
              <span>সাধারণ সেটিংস ও তথ্যাবলী</span>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label className="form-label">সমিতির নাম:</label>
                <input
                  type="text"
                  className="form-input"
                  value={settingsForm.societyName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, societyName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">কমিটির নাম:</label>
                <input
                  type="text"
                  className="form-input"
                  value={settingsForm.committeeName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, committeeName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">ডিফল্ট মাসিক সার্ভিস চার্জ (টাকা):</label>
                <input
                  type="number"
                  className="form-input"
                  value={settingsForm.monthlyRate}
                  onChange={(e) => setSettingsForm({ ...settingsForm, monthlyRate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">সার্ভিস চার্জ শুরুর মাস:</label>
                <input
                  type="text"
                  className="form-input"
                  value={settingsForm.startMonth}
                  onChange={(e) => setSettingsForm({ ...settingsForm, startMonth: e.target.value })}
                  required
                />
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>ডিফল্ট ফরম্যাট: 2024-08 (আগস্ট ২০২৪)</span>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                <Save size={16} />
                <span>সেটিংস সংরক্ষণ করুন</span>
              </button>
            </form>
          </div>
        </div>

        {/* Backup and Restore */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Download size={18} color="var(--success)" />
              <span>ডেটা ব্যাকআপ ও পুনরুদ্ধার (Backup & Restore)</span>
            </div>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '18px' }}>
              ওয়েব ব্রাউজারে সংরক্ষিত আপনার সমস্ত ফ্ল্যাট, ২১৬টি জমার এন্ট্রি ও সেটিংস নিরাপদ রাখতে একটি ব্যাকআপ JSON ফাইল ডাউনলোড করে রাখতে পারেন।
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  padding: '16px',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0369a1', marginBottom: '6px' }}>
                  ১. ব্যাকআপ ডাউনলোড (Export)
                </h4>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                  সম্পূর্ণ ডেটাবেজের একটি `.json` কপি নিজের কম্পিউটার বা মোবাইলে সেভ করুন।
                </p>
                <button onClick={exportBackupJson} className="btn btn-primary btn-sm">
                  <Download size={15} />
                  <span>ব্যাকআপ JSON ডাউনলোড করুন</span>
                </button>
              </div>

              <div
                style={{
                  padding: '16px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  ২. ব্যাকআপ রিস্টোর (Import)
                </h4>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                  পূর্বে ডাউনলোড করা ব্যাকআপ JSON ফাইল আপলোড করে ডেটা ফিরিয়ে আনুন।
                </p>
                <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                  <Upload size={15} />
                  <span>ব্যাকআপ ফাইল আপলোড করুন</span>
                  <input
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              <div
                style={{
                  padding: '16px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '10px'
                }}
              >
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#991b1b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} /> ডেটা রিসেট (Reset to Initial Seed)
                </h4>
                <p style={{ fontSize: '12px', color: '#7f1d1d', marginBottom: '12px' }}>
                  সফটওয়্যারটিকে মূল ২১৬টি পেমেন্ট রেকর্ডযুক্ত আদি অবস্থায় ফিরিয়ে নিতে চান?
                </p>
                <button
                  onClick={() => {
                    if (window.confirm('আপনি কি নিশ্চিত যে ডেটাবেজ রিসেট করতে চান?')) {
                      resetToDefault();
                    }
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ borderColor: '#ef4444', color: '#ef4444' }}
                >
                  <RefreshCw size={14} />
                  <span>ডিফল্ট ডেটায় রিসেট করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
