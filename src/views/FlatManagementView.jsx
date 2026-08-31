import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import * as U from '../utils/format';
import { Building2, Edit2, Plus, Check, X } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../context/AuthContext';

export function FlatManagementView() {
  const { data, updateFlat, addFlat } = useData();
  const { isReadOnly } = useAuth();
  const [editModal, setEditModal] = useState({ isOpen: false, flat: null });
  const [addModal, setAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState('all');

  const [formData, setFormData] = useState({
    serial: '',
    flatNo: '',
    ownerName: '',
    openingDue: 0,
    phone: '',
    note: ''
  });

  const flats = [...data.flats].sort((a, b) => (a.serial || 0) - (b.serial || 0));
  const paginatedFlats = pageSize === 'all' ? flats : flats.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openEdit = (flat) => {
    setFormData({
      serial: flat.serial || '',
      flatNo: flat.flatNo || '',
      ownerName: flat.ownerName || '',
      openingDue: flat.openingDue || 0,
      phone: flat.phone || '',
      note: flat.note || ''
    });
    setEditModal({ isOpen: true, flat });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (editModal.flat) {
      updateFlat(editModal.flat.id, {
        serial: Number(formData.serial),
        flatNo: formData.flatNo,
        ownerName: formData.ownerName,
        openingDue: Number(formData.openingDue),
        phone: formData.phone,
        note: formData.note
      });
      setEditModal({ isOpen: false, flat: null });
    }
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    addFlat(formData);
    setAddModal(false);
  };

  return (
    <div className="page-body">
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>ফ্ল্যাট ও মালিকদের তালিকা ব্যবস্থাপনা</h2>
          <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
            মোট সক্রিয় ফ্ল্যাট: <b>{U.bnDigits(flats.length)} টি</b>
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={() => {
              setFormData({ serial: flats.length + 1, flatNo: '', ownerName: '', openingDue: 0, phone: '', note: '' });
              setAddModal(true);
            }}
            className="btn btn-primary btn-sm"
          >
            <Plus size={15} />
            <span>নতুন ফ্ল্যাট যুক্ত করুন</span>
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-body flush">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>ক্রম</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>ফ্ল্যাট নং</th>
                  <th>মালিকের নাম</th>
                  <th style={{ width: '130px' }}>মোবাইল নং</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>প্রারম্ভিক বকেয়া</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>অবস্থা</th>
                  {!isReadOnly && <th style={{ width: '90px', textAlign: 'center' }}>কার্যক্রম</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedFlats.map((f) => (
                  <tr key={f.id}>
                    <td style={{ textAlign: 'center', color: '#64748b' }}>{U.bnDigits(f.serial)}</td>
                    <td style={{ textAlign: 'center' }}><b>{f.flatNo}</b></td>
                    <td><b>{f.ownerName}</b></td>
                    <td style={{ color: '#64748b' }}>{f.phone || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: f.openingDue > 0 ? 'var(--danger)' : '#64748b' }}>
                      {f.openingDue ? U.bnTaka(f.openingDue) : '০'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="pill ok">সক্রিয়</span>
                    </td>
                    {!isReadOnly && (
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => openEdit(f)}
                          className="btn btn-icon"
                          title="সম্পাদনা করুন"
                        >
                          <Edit2 size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={flats.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 15, 25, 'all']}
          />
        </div>
      </div>

      {/* Edit Modal */}
      {editModal.isOpen && (
        <Modal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, flat: null })}
          title={`${editModal.flat?.flatNo} ফ্ল্যাটের তথ্য সম্পাদনা`}
        >
          <form onSubmit={handleSaveEdit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">ক্রমিক নং:</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.serial}
                  onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">ফ্ল্যাট নং:</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.flatNo}
                  onChange={(e) => setFormData({ ...formData, flatNo: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">মালিকের নাম:</label>
              <input
                type="text"
                className="form-input"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">মোবাইল নম্বর:</label>
              <input
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">প্রারম্ভিক বকেয়া (টাকা):</label>
              <input
                type="number"
                className="form-input"
                value={formData.openingDue}
                onChange={(e) => setFormData({ ...formData, openingDue: e.target.value })}
              />
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>জুলাই ২০২৪ পর্যন্ত যা বাকি ছিল</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => setEditModal({ isOpen: false, flat: null })} className="btn btn-outline">
                বাতিল
              </button>
              <button type="submit" className="btn btn-primary">
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Modal */}
      {addModal && (
        <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="নতুন ফ্ল্যাট যুক্ত করুন">
          <form onSubmit={handleSaveAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">ক্রমিক নং:</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.serial}
                  onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">ফ্ল্যাট নং:</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.flatNo}
                  onChange={(e) => setFormData({ ...formData, flatNo: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">মালিকের নাম:</label>
              <input
                type="text"
                className="form-input"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">মোবাইল নম্বর:</label>
              <input
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">প্রারম্ভিক বকেয়া (টাকা):</label>
              <input
                type="number"
                className="form-input"
                value={formData.openingDue}
                onChange={(e) => setFormData({ ...formData, openingDue: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => setAddModal(false)} className="btn btn-outline">
                বাতিল
              </button>
              <button type="submit" className="btn btn-primary">
                যুক্ত করুন
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
