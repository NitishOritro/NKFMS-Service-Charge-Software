import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import * as Calc from '../utils/calc';
import * as U from '../utils/format';
import { CalendarCheck, Receipt, Sparkles, Check, RotateCcw, Printer } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';

export function MonthlyCollectionView() {
  const { data, selectedMonth, setPayment, deletePayment, bulkSetPayments, addToast } = useData();
  const [receiptModal, setReceiptModal] = useState({ isOpen: false, flat: null, payment: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState('all');

  const flats = [...data.flats].sort((a, b) => (a.serial || 0) - (b.serial || 0));
  const { rows, totals } = Calc.summary(data, selectedMonth);

  const paginatedRows = pageSize === 'all' ? rows : rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleInputChange = (flatId, field, value) => {
    const existing = data.payments.find((p) => p.flatId === flatId && p.month === selectedMonth) || {};
    const updated = {
      amount: field === 'amount' ? value : (existing.amount ?? ''),
      collectorId: field === 'collectorId' ? value : (existing.collectorId || ''),
      receivedOn: field === 'receivedOn' ? value : (existing.receivedOn || U.monthEndIso(selectedMonth)),
      note: field === 'note' ? value : (existing.note || '')
    };

    if (field === 'amount' && (value === '' || value == null)) {
      deletePayment(flatId, selectedMonth);
    } else {
      setPayment(flatId, selectedMonth, updated);
    }
  };

  const handleQuickFill = (flat) => {
    const rate = Calc.rateForMonth(data.settings, selectedMonth, flat);
    const existing = data.payments.find((p) => p.flatId === flat.id && p.month === selectedMonth) || {};
    setPayment(flat.id, selectedMonth, {
      amount: rate,
      collectorId: existing.collectorId || (data.settings.collectors[0]?.id || ''),
      receivedOn: existing.receivedOn || U.monthEndIso(selectedMonth)
    });
    addToast(`${flat.flatNo} তে ${U.bnNumber(rate)}/- টাকা জমা লেখা হয়েছে।`);
  };

  const handleBulkFillThisMonth = () => {
    const toUpdate = [];
    let count = 0;
    flats.forEach((f) => {
      const existing = data.payments.find((p) => p.flatId === f.id && p.month === selectedMonth);
      if (!existing || !existing.amount || Number(existing.amount) <= 0) {
        const rate = Calc.rateForMonth(data.settings, selectedMonth, f);
        toUpdate.push({
          flatId: f.id,
          month: selectedMonth,
          amount: rate,
          collectorId: data.settings.collectors[0]?.id || '',
          receivedOn: U.monthEndIso(selectedMonth)
        });
        count += 1;
      }
    });

    if (count > 0) {
      bulkSetPayments(toUpdate);
      addToast(`${U.bnDigits(count)} টি ফ্ল্যাটের সার্ভিস চার্জ পূরণ করা হয়েছে।`);
    } else {
      addToast('এই মাসের সকল ফ্ল্যাটের জমা ইতিমধ্যেই লেখা আছে।', 'warning');
    }
  };

  const handlePrintReceipt = (flat, payment) => {
    setReceiptModal({ isOpen: true, flat, payment });
  };

  return (
    <div className="page-body">
      {/* Top Action Header */}
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
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
            {U.monthLabel(selectedMonth)} — মাসিক আদায় এন্ট্রি
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
            নিচে প্রতিটি ফ্ল্যাটের এ মাসের জমা, আদায়কারী ও তারিখ পূরণ করুন (ইনপুট দেওয়ার সাথে সাথে অটো-সেভ হবে)।
          </p>
        </div>

        <button onClick={handleBulkFillThisMonth} className="btn btn-primary btn-sm">
          <Sparkles size={15} />
          <span>সবার জন্য ১,৫০০/- বসান</span>
        </button>
      </div>

      {/* Main Collection Table */}
      <div className="card">
        <div className="card-body flush">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '46px', textAlign: 'center' }}>ক্রম</th>
                  <th style={{ width: '70px' }}>ফ্ল্যাট</th>
                  <th style={{ minWidth: '160px' }}>মালিকের নাম</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>পূর্বের বকেয়া</th>
                  <th style={{ width: '130px' }}>এ মাসে জমা</th>
                  <th style={{ width: '170px' }}>আদায়কারী</th>
                  <th style={{ width: '150px' }}>জমার তারিখ</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>নতুন বকেয়া</th>
                  <th style={{ width: '150px', textAlign: 'center' }}>কার্যক্রম</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((r, idx) => {
                  const flat = r.flat;
                  const payment = data.payments.find((p) => p.flatId === flat.id && p.month === selectedMonth);
                  const isPaid = payment && Number(payment.amount) > 0;
                  const prevDue = r.balance - (payment ? Number(payment.amount) : 0);

                  return (
                    <tr key={flat.id} className={isPaid ? 'paid-row' : ''}>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>{U.bnDigits(flat.serial)}</td>
                      <td><b>{flat.flatNo}</b></td>
                      <td>{flat.ownerName}</td>
                      <td style={{ textAlign: 'right', color: prevDue > 0 ? 'var(--danger)' : '#64748b', fontWeight: 600 }}>
                        {prevDue > 0 ? U.bnNumber(prevDue) : '০'}
                      </td>
                      <td>
                        <input
                          type="number"
                          step="100"
                          min="0"
                          className="table-input"
                          value={payment ? payment.amount : ''}
                          placeholder={U.bnNumber(r.monthRate)}
                          onChange={(e) => handleInputChange(flat.id, 'amount', e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className="table-input"
                          value={payment ? payment.collectorId : ''}
                          onChange={(e) => handleInputChange(flat.id, 'collectorId', e.target.value)}
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
                          onChange={(e) => handleInputChange(flat.id, 'receivedOn', e.target.value)}
                        />
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: r.due > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {r.due > 0 ? U.bnNumber(r.due) : '০'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleQuickFill(flat)}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '2px 6px', fontSize: '11px' }}
                            title="১,৫০০/- বসান"
                          >
                            {U.bnNumber(r.monthRate)}
                          </button>
                          {isPaid && (
                            <>
                              <button
                                onClick={() => handlePrintReceipt(flat, payment)}
                                className="btn btn-icon"
                                title="রসিদ দেখুন / প্রিন্ট"
                                style={{ color: 'var(--primary)', padding: '4px' }}
                              >
                                <Receipt size={15} />
                              </button>
                              <button
                                onClick={() => deletePayment(flat.id, selectedMonth)}
                                className="btn btn-icon"
                                title="মুছে ফেলুন"
                                style={{ color: '#ef4444', padding: '4px' }}
                              >
                                <RotateCcw size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td colSpan="4" style={{ textAlign: 'right' }}>এ মাসে সর্বমোট আদায়:</td>
                  <td style={{ color: 'var(--primary)', fontSize: '15px' }}>{U.bnTaka(totals.monthCollected)}</td>
                  <td colSpan="2" style={{ color: '#64748b' }}>
                    {U.bnDigits(totals.paidThisMonth)} টি ফ্ল্যাট পরিশোধ করেছে
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--danger)', fontSize: '15px' }}>
                    {U.bnTaka(totals.totalDue)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={rows.length}
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

      {/* Money Receipt Modal */}
      {receiptModal.isOpen && receiptModal.flat && receiptModal.payment && (
        <Modal
          isOpen={receiptModal.isOpen}
          onClose={() => setReceiptModal({ isOpen: false, flat: null, payment: null })}
          title="সার্ভিস চার্জ আদায়ের মানি রসিদ"
          footer={
            <>
              <button onClick={() => window.print()} className="btn btn-primary">
                <Printer size={15} />
                <span>রসিদ প্রিন্ট করুন</span>
              </button>
              <button onClick={() => setReceiptModal({ isOpen: false, flat: null, payment: null })} className="btn btn-outline">
                বন্ধ করুন
              </button>
            </>
          }
        >
          <div
            style={{
              border: '2px solid #0f172a',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              background: '#fafafa'
            }}
          >
            <div style={{ textAlign: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800 }}>{data.settings.societyName}</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>{data.settings.committeeName}</p>
              <span style={{ display: 'inline-block', marginTop: '6px', background: '#0284c7', color: '#fff', padding: '2px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                সার্ভিস চার্জ আদায় রসিদ
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', marginBottom: '12px' }}>
              <div>রসিদ নং: <b>{receiptModal.payment.id}</b></div>
              <div style={{ textAlign: 'right' }}>তারিখ: <b>{U.dateLabel(receiptModal.payment.receivedOn)}</b></div>
              <div>ফ্ল্যাট নং: <b>{receiptModal.flat.flatNo}</b></div>
              <div style={{ textAlign: 'right' }}>মালিকের নাম: <b>{receiptModal.flat.ownerName}</b></div>
              <div>হিসাব মাস: <b>{U.monthLabel(receiptModal.payment.month)}</b></div>
              <div style={{ textAlign: 'right' }}>
                আদায়কারী: <b>{(data.settings.collectors.find((c) => c.id === receiptModal.payment.collectorId)?.bn) || '—'}</b>
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
                fontWeight: 800,
                color: '#065f46',
                margin: '14px 0'
              }}
            >
              জমাকৃত টাকা: {U.bnTaka(receiptModal.payment.amount)}/-
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
        </Modal>
      )}
    </div>
  );
}
