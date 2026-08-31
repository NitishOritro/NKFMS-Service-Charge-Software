import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import * as Calc from '../utils/calc';
import * as U from '../utils/format';
import {
  Layers,
  Save,
  Check,
  Receipt,
  Eraser,
  Sparkles,
  Users,
  Printer,
  FileText
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../context/AuthContext';

// নিচের সারসংক্ষেপ সারির ঘরগুলো স্ক্রল বাক্সের তলায় আটকে থাকে
const FOOT_CELL = {
  position: 'sticky',
  bottom: 0,
  zIndex: 9,
  background: 'var(--bg-muted)',
  fontSize: '14px'
};

// একটি রসিদের মার্কআপ — পর্দার মডাল ও কাগজের প্রিন্ট দুই জায়গাতেই এটাই ব্যবহৃত হয়।
function ReceiptSheet({ payment, flat, settings }) {
  return (
    <div
      className="receipt-sheet"
      style={{
        border: '2px solid #0f172a',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        background: '#fafafa'
      }}
    >
      <div style={{ textAlign: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{settings.societyName}</h3>
        <p style={{ fontSize: '12px', color: '#64748b' }}>{settings.committeeName}</p>
        <span style={{ display: 'inline-block', marginTop: '6px', background: '#0284c7', color: '#fff', padding: '2px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>
          সার্ভিস চার্জ আদায় রসিদ
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', marginBottom: '12px' }}>
        <div>রসিদ নং: <b>{flat.flatNo}-{U.monthLabelEn(payment.month)}</b></div>
        <div style={{ textAlign: 'right' }}>তারিখ: <b>{U.dateLabel(payment.receivedOn)}</b></div>
        <div>ফ্ল্যাট নং: <b>{flat.flatNo}</b></div>
        <div style={{ textAlign: 'right' }}>মালিকের নাম: <b>{flat.ownerName}</b></div>
        <div>হিসাব মাস: <b>{U.monthLabel(payment.month)}</b></div>
        <div style={{ textAlign: 'right' }}>
          আদায়কারী: <b>{(settings.collectors.find((c) => c.id === payment.collectorId)?.bn) || '—'}</b>
        </div>
      </div>

      <div
        style={{
          background: '#ecfdf5',
          border: '1px dashed #10b981',
          borderRadius: 'var(--radius-md)',
          padding: '12px',
          textAlign: 'center',
          fontSize: '18px',
          fontWeight: 700,
          color: '#065f46',
          margin: '14px 0'
        }}
      >
        জমাকৃত টাকা: {U.bnTaka(payment.amount)}/-
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', fontSize: '12px', color: '#475569' }}>
        <div style={{ borderTop: '1px solid #64748b', width: '130px', textAlign: 'center', paddingTop: '4px' }}>
          জমাদানকারীর স্বাক্ষর
        </div>
        <div style={{ borderTop: '1px solid #64748b', width: '130px', textAlign: 'center', paddingTop: '4px' }}>
          আদায়কারীর স্বাক্ষর
        </div>
      </div>
    </div>
  );
}

export function SingleFlatEntryView({ onOpenLedger }) {
  const { data, setPayment, deletePayment, bulkSetPayments, addToast } = useData();
  const { isReadOnly } = useAuth();
  const [selectedFlatId, setSelectedFlatId] = useState(() => {
    return data.flats.length ? data.flats[0].id : '';
  });
  const [monthFilter, setMonthFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState('all');
  const [bulkCollectorModalOpen, setBulkCollectorModalOpen] = useState(false);
  const [receiptModal, setReceiptModal] = useState({ isOpen: false, payment: null });
  const [allReceiptsOpen, setAllReceiptsOpen] = useState(false);
  const [printList, setPrintList] = useState([]);
  const [selectedCollectorId, setSelectedCollectorId] = useState('');
  const tableContainerRef = useRef(null);

  // Reset page and scroll to top when filter or flat changes
  useEffect(() => {
    setCurrentPage(1);
    setLocalRows({}); // Clear local drafts on filter/flat change
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [selectedFlatId, monthFilter]);

  // টেবিলের উচ্চতা মেপে বসানো হয় — নইলে শেষ মাসগুলো, নিচের সারসংক্ষেপ ও
  // পেজিনেশন কেটে যায়।
  //  • window নয়, .page-body-ই আসল স্ক্রল বাক্স (.main-content এ overflow:hidden)
  //  • কার্ডটি flex আইটেম, জায়গা না পেলে চেপে যায় — তাই কার্ডের মাপ ধরা যাবে না;
  //    পেজিনেশনের নিজের offsetHeight নেওয়া হয়, যা চাপে বদলায় না।
  useEffect(() => {
    const fit = () => {
      const el = tableContainerRef.current;
      if (!el) return;
      const scrollBox = el.closest('.page-body');
      if (!scrollBox) return;

      const pager = el.parentElement?.querySelector('.pagination-container');
      const pagerH = pager ? pager.offsetHeight : 0;

      const boxRect = scrollBox.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      // স্ক্রল যেখানেই থাকুক, বাক্সের ভেতরে টেবিলের প্রকৃত অবস্থান
      const topWithin = elRect.top - boxRect.top + scrollBox.scrollTop;
      const bottomGap = 30; // .page-body এর নিচের প্যাডিং ও কার্ডের বর্ডার

      const avail = scrollBox.clientHeight - topWithin - pagerH - bottomGap;
      el.style.maxHeight = `${Math.max(200, Math.floor(avail))}px`;
    };

    fit();
    // প্রথম মাপের পর লেআউট থিতু হলে আরেকবার — নইলে ফন্ট/কার্ড বসার আগের মাপ থেকে যেত
    const raf = requestAnimationFrame(fit);
    window.addEventListener('resize', fit);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', fit);
    };
  });

  // রসিদ প্রিন্ট — মডাল কাগজে ছাপা হয় না, তাই আলাদা প্রিন্ট-এরিয়া দেখিয়ে ছাপা হয়।
  useEffect(() => {
    if (!printList.length) return undefined;
    document.body.classList.add('printing-receipts');
    const t = setTimeout(() => {
      window.print();
      document.body.classList.remove('printing-receipts');
      setPrintList([]);
    }, 80);
    return () => {
      clearTimeout(t);
      document.body.classList.remove('printing-receipts');
    };
  }, [printList]);

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
    const numPageSize = Number(pageSize) || 10;
    const maxPages = Math.ceil(displayMonths.length / numPageSize) || 1;
    const safePage = Math.min(Math.max(1, currentPage), maxPages);
    const start = (safePage - 1) * numPageSize;
    return displayMonths.slice(start, start + numPageSize);
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

  // Handle single row change (local draft)
  const handleInputChange = (month, field, value) => {
    setLocalRows((prev) => {
      const existing = paymentsMap[month] || {};
      const currentDraft = prev[month] || {
        amount: existing.amount ?? '',
        collectorId: existing.collectorId || '',
        receivedOn: existing.receivedOn || U.monthEndIso(month),
        note: existing.note || ''
      };
      
      return {
        ...prev,
        [month]: {
          ...currentDraft,
          [field]: value
        }
      };
    });
  };

  // প্রদর্শিত মাসগুলোর সারসংক্ষেপ (মাস ফিল্টার মানে)
  const shownCharged = displayMonths.reduce(
    (sum, m) => sum + Calc.rateForMonth(data.settings, m, currentFlat), 0
  );
  const shownPaid = displayMonths.reduce((sum, m) => {
    const p = paymentsMap[m];
    return sum + (p && Number(p.amount) > 0 ? Number(p.amount) : 0);
  }, 0);
  const shownPaidCount = displayMonths.filter(
    (m) => paymentsMap[m] && Number(paymentsMap[m].amount) > 0
  ).length;
  const shownDueCount = displayMonths.length - shownPaidCount;
  const shownDue = shownCharged - shownPaid;

  // জমা আছে এমন সব মাসের রসিদ (ক্রম অনুযায়ী)
  const paidReceipts = allMonths
    .map((m) => paymentsMap[m])
    .filter((p) => p && Number(p.amount) > 0);

  // এন্ট্রি সেভ করুন
  const handleSaveEntry = (month) => {
    const rate = Calc.rateForMonth(data.settings, month, currentFlat);
    const existing = paymentsMap[month] || {};
    const draft = localRows[month];
    
    if (draft && (draft.amount === '' || draft.amount == null || Number(draft.amount) <= 0)) {
      deletePayment(currentFlat.id, month);
      addToast(`${U.monthLabel(month)} — এন্ট্রি মুছে ফেলা হয়েছে।`, 'warning');
    } else {
      const amountToSave = draft ? draft.amount : (Number(existing.amount) > 0 ? existing.amount : rate);
      setPayment(currentFlat.id, month, {
        amount: amountToSave,
        collectorId: draft ? draft.collectorId : (existing.collectorId || data.settings.collectors[0]?.id || ''),
        receivedOn: draft ? draft.receivedOn : (existing.receivedOn || U.monthEndIso(month)),
        note: draft ? (draft.note || '') : (existing.note || '')
      });
      addToast(`${U.monthLabel(month)} — ${U.bnNumber(amountToSave)}/- টাকার এন্ট্রি সেভ হয়েছে।`);
    }

    setLocalRows((prev) => {
      const next = { ...prev };
      delete next[month];
      return next;
    });
  };

  // রিসিট দেখুন
  const handlePrintReceipt = (month) => {
    const payment = paymentsMap[month];
    if (!payment || !(Number(payment.amount) > 0)) return;
    setReceiptModal({ isOpen: true, payment });
  };

  // ডাটা ক্লীয়ার করুন
  const handleClearEntry = (month) => {
    deletePayment(currentFlat.id, month);
    setLocalRows((prev) => {
      const next = { ...prev };
      delete next[month];
      return next;
    });
    addToast(`${U.monthLabel(month)} — এন্ট্রি ক্লীয়ার করা হয়েছে।`, 'warning');
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
          marginBottom: '20px',
          overflow: 'visible'
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
          {!isReadOnly && (
            <>
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
            </>
          )}

          <button
            onClick={() => setAllReceiptsOpen(true)}
            disabled={paidReceipts.length === 0}
            className="btn btn-outline"
            title={
              paidReceipts.length
                ? 'এই ফ্ল্যাটের সব মাসের রসিদ একসাথে দেখুন ও প্রিন্ট করুন'
                : 'এই ফ্ল্যাটের কোনো মাসে জমা লেখা নেই'
            }
            style={{ padding: '9px 16px', fontSize: '15px' }}
          >
            <FileText size={16} />
            <span>সব রিসিট একসাথে ({U.bnDigits(paidReceipts.length)})</span>
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
      {/* flexShrink: 0 — .card এ overflow:hidden থাকায় flex চাপে পড়লে কার্ডটি
          নিজের পেজিনেশন কেটে ফেলত, আর স্ক্রল করেও সেখানে পৌঁছানো যেত না */}
      <div className="card" style={{ flexShrink: 0 }}>
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
          <div className="table-container" ref={tableContainerRef}>
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
                  <th style={{ width: '230px', textAlign: 'center' }}>কার্যক্রম</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMonths.map((m, idx) => {
                  const payment = paymentsMap[m];
                  const charge = Calc.rateForMonth(data.settings, m, currentFlat);
                  
                  const draft = localRows[m];
                  const isDrafting = draft !== undefined;
                  const currentVal = draft !== undefined ? draft : (payment || {});
                  
                  const isPaid = payment && Number(payment.amount) > 0;
                  const hasDraftAmount = currentVal.amount && Number(currentVal.amount) > 0;

                  return (
                    <tr
                      key={m}
                      className={isPaid || (isDrafting && hasDraftAmount) ? 'paid-row' : 'due-row'}
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
                          disabled={isReadOnly}
                          className="table-input"
                          style={{ background: isReadOnly ? '#f8fafc' : '#fff', cursor: isReadOnly ? 'default' : 'auto' }}
                          value={currentVal.amount !== undefined ? currentVal.amount : ''}
                          placeholder={isReadOnly ? '—' : U.bnNumber(charge)}
                          onChange={(e) => handleInputChange(m, 'amount', e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className="table-input"
                          disabled={isReadOnly}
                          style={{ background: isReadOnly ? '#f8fafc' : '#fff', cursor: isReadOnly ? 'default' : 'pointer' }}
                          value={currentVal.collectorId || ''}
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
                          disabled={isReadOnly}
                          className="table-input"
                          style={{ background: isReadOnly ? '#f8fafc' : '#fff', cursor: isReadOnly ? 'default' : 'auto' }}
                          value={currentVal.receivedOn || ''}
                          onChange={(e) => handleInputChange(m, 'receivedOn', e.target.value)}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isDrafting ? (
                          hasDraftAmount ? (
                            <span className="pill warning">জমা হচ্ছে...</span>
                          ) : (
                            <span className="pill due">বকেয়া</span>
                          )
                        ) : isPaid ? (
                          <span className="pill ok">
                            <Check size={12} /> জমা {U.bnNumber(payment.amount)}
                          </span>
                        ) : (
                          <span className="pill due">বকেয়া</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', flexWrap: 'nowrap' }}>
                          <button
                            onClick={() => handleSaveEntry(m)}
                            disabled={isReadOnly}
                            className="btn btn-outline btn-sm"
                            title={`এন্ট্রি সেভ করুন (ধার্য ${U.bnNumber(charge)}/-)`}
                            style={{ padding: '3px 7px', fontSize: '12px', color: isReadOnly ? undefined : 'var(--success)' }}
                          >
                            <Save size={13} />
                            <span>সেভ</span>
                          </button>
                          <button
                            onClick={() => handlePrintReceipt(m)}
                            disabled={!isPaid}
                            className="btn btn-outline btn-sm"
                            title={isPaid ? 'রিসিট দেখুন' : 'জমা না থাকলে রিসিট দেখা যাবে না'}
                            style={{ padding: '3px 7px', fontSize: '12px', color: isPaid ? 'var(--primary)' : undefined }}
                          >
                            <Receipt size={13} />
                            <span>রিসিট</span>
                          </button>
                          <button
                            onClick={() => handleClearEntry(m)}
                            disabled={isReadOnly || (!isPaid && !isDrafting)}
                            className="btn btn-outline btn-sm"
                            title={(isPaid || isDrafting) ? 'ডাটা ক্লীয়ার করুন' : 'ক্লীয়ার করার মতো কোনো এন্ট্রি নেই'}
                            style={{ padding: '3px 7px', fontSize: '12px', color: !isReadOnly && (isPaid || isDrafting) ? '#ef4444' : undefined }}
                          >
                            <Eraser size={13} />
                            <span>ক্লীয়ার</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* নিচের সারসংক্ষেপ — স্ক্রল করলেও নিচে আটকে থাকে */}
              <tfoot>
                <tr>
                  <td colSpan={2} style={FOOT_CELL}>
                    প্রদর্শিত {U.bnDigits(displayMonths.length)} মাসের সারসংক্ষেপ
                  </td>
                  <td style={{ ...FOOT_CELL, textAlign: 'right' }}>{U.bnTaka(shownCharged)}</td>
                  <td style={{ ...FOOT_CELL, color: 'var(--primary)' }}>{U.bnTaka(shownPaid)}</td>
                  <td colSpan={2} style={{ ...FOOT_CELL, color: '#64748b', fontWeight: 600 }}>
                    {U.bnDigits(shownPaidCount)} মাস জমা &nbsp;•&nbsp; {U.bnDigits(shownDueCount)} মাস বাকি
                  </td>
                  <td style={{ ...FOOT_CELL, textAlign: 'center', color: shownDue > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {shownDue > 0 ? `বকেয়া ${U.bnTaka(shownDue)}` : 'পরিশোধিত'}
                  </td>
                  <td style={FOOT_CELL}></td>
                </tr>
              </tfoot>
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

      {/* সব রসিদ একসাথে */}
      <Modal
        isOpen={allReceiptsOpen}
        onClose={() => setAllReceiptsOpen(false)}
        maxWidth="760px"
        title={`${currentFlat.flatNo} — সব মাসের রসিদ (${U.bnDigits(paidReceipts.length)} টি)`}
        footer={
          <>
            <button onClick={() => setPrintList(paidReceipts)} className="btn btn-primary">
              <Printer size={15} />
              <span>সব রসিদ প্রিন্ট করুন</span>
            </button>
            <button onClick={() => setAllReceiptsOpen(false)} className="btn btn-outline">
              বন্ধ করুন
            </button>
          </>
        }
      >
        <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '12px' }}>
          যেসব মাসে টাকা জমা লেখা আছে কেবল সেগুলোর রসিদ এখানে দেখানো হচ্ছে। প্রিন্ট করলে
          প্রতিটি রসিদ আলাদা পাতায় ছাপা হবে।
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {paidReceipts.map((p) => (
            <ReceiptSheet key={p.month} payment={p} flat={currentFlat} settings={data.settings} />
          ))}
        </div>
      </Modal>

      {/* কাগজে ছাপার জন্য — পর্দায় কখনো দেখা যায় না */}
      {printList.length > 0 && (
        <div className="receipt-print-area">
          {printList.map((p) => (
            <ReceiptSheet key={p.month} payment={p} flat={currentFlat} settings={data.settings} />
          ))}
        </div>
      )}

      {/* Money Receipt Modal */}
      {receiptModal.isOpen && receiptModal.payment && (
        <Modal
          isOpen={receiptModal.isOpen}
          onClose={() => setReceiptModal({ isOpen: false, payment: null })}
          title="সার্ভিস চার্জ আদায়ের মানি রসিদ"
          footer={
            <>
              <button onClick={() => setPrintList([receiptModal.payment])} className="btn btn-primary">
                <Printer size={15} />
                <span>রসিদ প্রিন্ট করুন</span>
              </button>
              <button onClick={() => setReceiptModal({ isOpen: false, payment: null })} className="btn btn-outline">
                বন্ধ করুন
              </button>
            </>
          }
        >
          <ReceiptSheet payment={receiptModal.payment} flat={currentFlat} settings={data.settings} />
        </Modal>
      )}
    </div>
  );
}
