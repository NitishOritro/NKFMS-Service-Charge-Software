import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import * as Calc from '../utils/calc';
import * as U from '../utils/format';
import {
  Layers,
  Save,
  Check,
  RotateCcw,
  Sparkles,
  Users,
  Printer,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';

export function SingleFlatEntryView({ onOpenLedger }) {
  const { data, setPayment, deletePayment, bulkSetPayments, addToast } = useData();
  const [selectedFlatId, setSelectedFlatId] = useState(() => {
    return data.flats.length ? data.flats[0].id : '';
  });
  const [monthFilter, setMonthFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [bulkCollectorModalOpen, setBulkCollectorModalOpen] = useState(false);
  const [selectedCollectorId, setSelectedCollectorId] = useState('');

  // Local draft inputs so users can type smoothly before committing
  const [localRows, setLocalRows] = useState({});

  const flats = useMemo(() => {
    return [...data.flats].sort((a, b) => (a.serial || 0) - (b.serial || 0));
  }, [data.flats]);

  const currentFlat = flats.find((f) => f.id === selectedFlatId) || flats[0];

  // 25 months: 2024-08 to 2026-08
  const allMonths = useMemo(() => {
    const list = [];
    for (let i = U.monthIndex('2024-08'); i <= U.monthIndex('2026-08'); i += 1) {
      list.push(U.indexToMonth(i));
    }
    return list;
  }, []);

  const displayMonths = useMemo(() => {
    if (monthFilter === 'all') return allMonths;
    if (monthFilter.startsWith('year-')) {
      const yr = monthFilter.replace('year-', '');
      return allMonths.filter((m) => m.startsWith(yr));
    }
    return allMonths.filter((m) => m === monthFilter);
  }, [allMonths, monthFilter]);

  const paginatedMonths = useMemo(() => {
    if (pageSize === 'all') return displayMonths;
    const start = (currentPage - 1) * pageSize;
    return displayMonths.slice(start, start + pageSize);
  }, [displayMonths, currentPage, pageSize]);

  if (!currentFlat) {
    return <div className="page-body">কোনো ফ্ল্যাট পাওয়া যায়নি।</div>;
  }

  // Financial Stats Calculation across ALL 25 months
  const opening = Number(currentFlat.openingDue) || 0;
  const chargedTotal = allMonths.reduce((sum, m) => sum + Calc.rateForMonth(data.settings, m, currentFlat), 0);
  
  const paymentsMap = useMemo(() => {
    const map = {};
    data.payments
      .filter((p) => p.flatId === currentFlat.id)
      .forEach((p) => {
        map[p.month] = p;
      });
    return map;
  }, [data.payments, currentFlat.id]);

  const paidTotal = allMonths.reduce((sum, m) => {
    const p = paymentsMap[m];
    return sum + (p && Number(p.amount) > 0 ? Number(p.amount) : 0);
  }, 0);

  const paidCount = allMonths.filter((m) => paymentsMap[m] && Number(paymentsMap[m].amount) > 0).length;
  const balance = opening + chargedTotal - paidTotal;
  const due = balance > 0 ? balance : 0;
  const advance = balance < 0 ? -balance : 0;

  // Handle single row change & instant auto-save
  const handleInputChange = (month, field, value) => {
    const existing = paymentsMap[month] || {};
    const updated = {
      amount: field === 'amount' ? value : (existing.amount ?? ''),
      collectorId: field === 'collectorId' ? value : (existing.collectorId || ''),
      receivedOn: field === 'receivedOn' ? value : (existing.receivedOn || U.monthEndIso(month)),
      note: field === 'note' ? value : (existing.note || '')
    };

    if (field === 'amount' && (value === '' || value == null)) {
      // If cleared
      deletePayment(currentFlat.id, month);
    } else {
      setPayment(currentFlat.id, month, updated);
    }
  };

  // Quick button: Fill standard rate
  const handleFillStandard = (month) => {
    const rate = Calc.rateForMonth(data.settings, month, currentFlat);
    const existing = paymentsMap[month] || {};
    setPayment(currentFlat.id, month, {
      amount: rate,
      collectorId: existing.collectorId || (data.settings.collectors[0]?.id || ''),
      receivedOn: existing.receivedOn || U.monthEndIso(month)
    });
    addToast(`${U.monthLabel(month)} এ ${U.bnNumber(rate)}/- টাকা বসানো হয়েছে।`);
  };

  // Bulk button: Fill all empty months with 1,500/- (or specific flat rate)
  const handleBulkFillUnpaid = () => {
    let count = 0;
    const toUpdate = [];
    allMonths.forEach((m) => {
      const p = paymentsMap[m];
      if (!p || !p.amount || Number(p.amount) <= 0) {
        const rate = Calc.rateForMonth(data.settings, m, currentFlat);
        toUpdate.push({
          flatId: currentFlat.id,
          month: m,
          amount: rate,
          collectorId: data.settings.collectors[0]?.id || '',
          receivedOn: U.monthEndIso(m)
        });
        count += 1;
      }
    });

    if (count > 0) {
      bulkSetPayments(toUpdate);
      addToast(`${U.bnDigits(count)} টি খালি মাসে জমা বসানো হয়েছে।`);
    } else {
      addToast('সব মাসের জমা ইতিমধ্যেই লেখা আছে।', 'warning');
    }
  };

  // Bulk assign collector
  const handleApplyBulkCollector = () => {
    if (!selectedCollectorId) {
      addToast('আদায়কারী নির্বাচন করুন।', 'error');
      return;
    }
    const toUpdate = [];
    allMonths.forEach((m) => {
      const p = paymentsMap[m];
      if (p && Number(p.amount) > 0) {
        toUpdate.push({
          ...p,
          collectorId: selectedCollectorId
        });
      }
    });
    bulkSetPayments(toUpdate);
    setBulkCollectorModalOpen(false);
    addToast('এই ফ্ল্যাটের সকল জমার আদায়কারী হালনাগাদ করা হয়েছে।');
  };

  return (
    <div className="page-body">
      {/* Top Filter Controls */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '18px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '280px' }}>
            <label style={{ fontSize: '14px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
              ফ্ল্যাট নির্বাচন:
            </label>
            <select
              className="form-select"
              style={{ width: '100%', fontWeight: 700, borderColor: 'var(--primary)', padding: '9px 14px', fontSize: '15.5px' }}
              value={selectedFlatId}
              onChange={(e) => setSelectedFlatId(e.target.value)}
            >
              {flats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.flatNo} — {f.ownerName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: '310px' }}>
            <label style={{ fontSize: '14px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
              মাস / সাল ফিল্টার:
            </label>
            <select
              className="form-select"
              style={{ width: '100%', padding: '9px 14px', fontSize: '15.5px' }}
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            >
              <option value="all">সব মাস (আগস্ট ২০২৪ — আগস্ট ২০২৬)</option>
              <option value="year-2024">২০২৪ সালের মাসসমূহ (আগস্ট-ডিসে)</option>
              <option value="year-2025">২০২৫ সালের সকল মাস</option>
              <option value="year-2026">২০২৬ সালের মাসসমূহ (জানু-আগস্ট)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleBulkFillUnpaid}
            className="btn btn-primary"
            title="যেসব মাস খালি আছে সেগুলোতে সার্ভিস চার্জ বসান"
            style={{ padding: '9px 16px', fontSize: '15px' }}
          >
            <Sparkles size={16} />
            <span>সব খালি ঘরে ১,৫০০/- বসান</span>
          </button>

          <button
            onClick={() => setBulkCollectorModalOpen(true)}
            className="btn btn-outline"
            style={{ padding: '9px 16px', fontSize: '15px' }}
          >
            <Users size={16} />
            <span>সবার জন্য একই আদায়কারী</span>
          </button>
        </div>
      </div>

      {/* Flat Financial Stats Cards */}
      <div className="metrics-grid" style={{ marginBottom: '20px' }}>
        <div className="metric-card">
          <div className="metric-label">প্রারম্ভিক বকেয়া</div>
          <div className="metric-value">{U.bnTaka(opening)}</div>
          <div className="metric-sub">জুলাই ২০২৪ পর্যন্ত বকেয়া</div>
        </div>

        <div className="metric-card primary">
          <div className="metric-label">মোট ধার্যকৃত চার্জ</div>
          <div className="metric-value" style={{ color: 'var(--primary)' }}>{U.bnTaka(chargedTotal)}</div>
          <div className="metric-sub">২৫ মাসের মোট চার্জ</div>
        </div>

        <div className="metric-card success">
          <div className="metric-label">মোট জমা হয়েছে</div>
          <div className="metric-value" style={{ color: 'var(--success)' }}>{U.bnTaka(paidTotal)}</div>
          <div className="metric-sub">{U.bnDigits(paidCount)} টি মাসে জমা রেকর্ড</div>
        </div>

        <div className={`metric-card ${due > 0 ? 'danger' : advance > 0 ? 'warning' : 'success'}`}>
          <div className="metric-label">বর্তমান স্থিতি / বকেয়া</div>
          <div
            className="metric-value"
            style={{ color: due > 0 ? 'var(--danger)' : advance > 0 ? 'var(--warning-dark)' : 'var(--success)' }}
          >
            {due > 0 ? `বকেয়া ${U.bnTaka(due)}` : advance > 0 ? `অগ্রীম ${U.bnTaka(advance)}` : 'পরিশোধিত (৳০)'}
          </div>
          <div className="metric-sub">
            {due > 0
              ? `${U.bnDigits(Math.round(due / (Calc.rateForMonth(data.settings, '2026-08', currentFlat) || 1500)))} মাসের সমতুল্য বাকি`
              : advance > 0
              ? 'অগ্রীম টাকা জমা আছে'
              : 'কোনো বকেয়া নেই'}
          </div>
        </div>
      </div>

      {/* Multi-Month Entry Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Layers size={18} color="var(--primary)" />
            <span>
              {currentFlat.flatNo} ({currentFlat.ownerName}) — মাসভিত্তিক সার্ভিস চার্জ এন্ট্রি
            </span>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            প্রদর্শিত: {U.bnDigits(displayMonths.length)} টি মাস &nbsp;|&nbsp; 
            <span style={{ color: '#059669', fontWeight: 600 }}>সবুজ = জমা</span> &nbsp;|&nbsp; 
            <span style={{ color: '#ca8a04', fontWeight: 600 }}>হলুদ = এন্ট্রি ফোকাস</span>
          </span>
        </div>

        <div className="card-body flush">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '46px', textAlign: 'center' }}>ক্রম</th>
                  <th style={{ width: '160px' }}>মাস ও সাল</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>ধার্য চার্জ</th>
                  <th style={{ width: '140px' }}>এ মাসের জমা</th>
                  <th style={{ width: '180px' }}>আদায়কারী</th>
                  <th style={{ width: '160px' }}>জমার তারিখ</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>অবস্থা</th>
                  <th style={{ width: '160px', textAlign: 'center' }}>কার্যক্রম</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMonths.map((m, idx) => {
                  const payment = paymentsMap[m];
                  const charge = Calc.rateForMonth(data.settings, m, currentFlat);
                  const isPaid = payment && Number(payment.amount) > 0;

                  return (
                    <tr
                      key={m}
                      className={isPaid ? 'paid-row' : 'due-row'}
                    >
                      <td style={{ textAlign: 'center', color: '#64748b' }}>
                        {U.bnDigits(allMonths.indexOf(m) + 1)}
                      </td>
                      <td>
                        <b>{U.monthLabel(m)}</b>
                      </td>
                      <td style={{ textAlign: 'right', color: '#64748b', fontWeight: 600 }}>
                        {U.bnNumber(charge)}/-
                      </td>
                      <td>
                        <input
                          type="number"
                          step="100"
                          min="0"
                          className="table-input"
                          value={payment ? payment.amount : ''}
                          placeholder={U.bnNumber(charge)}
                          onChange={(e) => handleInputChange(m, 'amount', e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className="table-input"
                          value={payment ? payment.collectorId : ''}
                          onChange={(e) => handleInputChange(m, 'collectorId', e.target.value)}
                        >
                          <option value="">-- আদায়কারী --</option>
                          {(data.settings.collectors || []).map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.bn || c.en}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="date"
                          className="table-input"
                          value={payment ? payment.receivedOn : ''}
                          onChange={(e) => handleInputChange(m, 'receivedOn', e.target.value)}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isPaid ? (
                          <span className="pill ok">
                            <Check size={12} /> জমা {U.bnNumber(payment.amount)}
                          </span>
                        ) : (
                          <span className="pill due">বকেয়া</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleFillStandard(m)}
                            className="btn btn-outline btn-sm"
                            title="ধার্যকৃত টাকা বসান"
                            style={{ padding: '2px 8px', fontSize: '11.5px' }}
                          >
                            {U.bnNumber(charge)}
                          </button>
                          {isPaid && (
                            <button
                              onClick={() => deletePayment(currentFlat.id, m)}
                              className="btn btn-icon"
                              title="রিসেট / মুছে ফেলুন"
                              style={{ color: '#ef4444', padding: '3px' }}
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={displayMonths.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            pageSizeOptions={[5, 10, 15, 25, 'all']}
          />
        </div>
      </div>

      {/* Bulk Collector Modal */}
      <Modal
        isOpen={bulkCollectorModalOpen}
        onClose={() => setBulkCollectorModalOpen(false)}
        title="এই ফ্ল্যাটের সবার আদায়কারী নির্ধারণ"
        footer={
          <>
            <button onClick={handleApplyBulkCollector} className="btn btn-primary">
              প্রয়োগ করুন
            </button>
            <button onClick={() => setBulkCollectorModalOpen(false)} className="btn btn-outline">
              বাতিল
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">আদায়কারী নির্বাচন করুন:</label>
          <select
            className="form-select"
            value={selectedCollectorId}
            onChange={(e) => setSelectedCollectorId(e.target.value)}
          >
            <option value="">-- আদায়কারী বেছে নিন --</option>
            {(data.settings.collectors || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.bn || c.en}
              </option>
            ))}
          </select>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
            এই ফ্ল্যাটের যেসব মাসে টাকা জমা লেখা আছে সেগুলোতে এই আদায়কারীর নাম সেট করা হবে।
          </p>
        </div>
      </Modal>
    </div>
  );
}
