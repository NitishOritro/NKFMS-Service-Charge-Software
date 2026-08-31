import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Users, UserCheck, Plus, Trash2, Edit2 } from 'lucide-react';
import { Modal } from '../components/Modal';

export function CollectorSignatoryView() {
  const { data, updateCollectors, updateSignatories, addToast } = useData();

  const [collectors, setCollectors] = useState(data.settings.collectors || []);
  const [signatories, setSignatories] = useState(data.settings.signatories || []);

  const [newCollector, setNewCollector] = useState({ bn: '', en: '' });
  const [newSignatory, setNewSignatory] = useState({ name: '', designation: '' });

  const handleSaveCollectors = () => {
    updateCollectors(collectors);
  };

  const handleAddCollector = (e) => {
    e.preventDefault();
    if (!newCollector.bn) return;
    const updated = [
      ...collectors,
      { id: `c-${Date.now().toString(36)}`, bn: newCollector.bn, en: newCollector.en }
    ];
    setCollectors(updated);
    updateCollectors(updated);
    setNewCollector({ bn: '', en: '' });
  };

  const handleDeleteCollector = (id) => {
    const updated = collectors.filter((c) => c.id !== id);
    setCollectors(updated);
    updateCollectors(updated);
  };

  const handleAddSignatory = (e) => {
    e.preventDefault();
    if (!newSignatory.name) return;
    const updated = [
      ...signatories,
      { id: `s-${Date.now().toString(36)}`, name: newSignatory.name, designation: newSignatory.designation }
    ];
    setSignatories(updated);
    updateSignatories(updated);
    setNewSignatory({ name: '', designation: '' });
  };

  const handleDeleteSignatory = (id) => {
    const updated = signatories.filter((s) => s.id !== id);
    setSignatories(updated);
    updateSignatories(updated);
  };

  return (
    <div className="page-body">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Collectors Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Users size={18} color="var(--primary)" />
              <span>টাকা আদায়কারীদের তালিকা (Collectors)</span>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleAddCollector} style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="বাংলা নাম (যেমন: সীমা চন্দ)"
                value={newCollector.bn}
                onChange={(e) => setNewCollector({ ...newCollector, bn: e.target.value })}
                required
              />
              <input
                type="text"
                className="form-input"
                placeholder="ইংরেজি নাম (Sima Chanda)"
                value={newCollector.en}
                onChange={(e) => setNewCollector({ ...newCollector, en: e.target.value })}
              />
              <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
                <Plus size={16} />
                <span>যোগ করুন</span>
              </button>
            </form>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>বাংলা নাম</th>
                    <th>ইংরেজি নাম</th>
                    <th style={{ width: '60px', textAlign: 'center' }}>মুছুন</th>
                  </tr>
                </thead>
                <tbody>
                  {collectors.map((c) => (
                    <tr key={c.id}>
                      <td><b>{c.bn}</b></td>
                      <td style={{ color: '#64748b' }}>{c.en || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => handleDeleteCollector(c.id)}
                          className="btn btn-icon"
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Signatories Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <UserCheck size={18} color="var(--success)" />
              <span>রিপোর্টের স্বাক্ষরকারী কমিটি সদস্য (Signatories)</span>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleAddSignatory} style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="সদস্যের নাম"
                value={newSignatory.name}
                onChange={(e) => setNewSignatory({ ...newSignatory, name: e.target.value })}
                required
              />
              <input
                type="text"
                className="form-input"
                placeholder="পদবী (যেমন: সদস্য সচিব)"
                value={newSignatory.designation}
                onChange={(e) => setNewSignatory({ ...newSignatory, designation: e.target.value })}
                required
              />
              <button type="submit" className="btn btn-success" style={{ flexShrink: 0 }}>
                <Plus size={16} />
                <span>যোগ করুন</span>
              </button>
            </form>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>নাম</th>
                    <th>পদবী</th>
                    <th style={{ width: '60px', textAlign: 'center' }}>মুছুন</th>
                  </tr>
                </thead>
                <tbody>
                  {signatories.map((s) => (
                    <tr key={s.id}>
                      <td><b>{s.name}</b></td>
                      <td><span className="pill ok">{s.designation}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => handleDeleteSignatory(s.id)}
                          className="btn btn-icon"
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
