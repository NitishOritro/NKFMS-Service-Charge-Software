import React from 'react';
import { useData } from '../context/DataContext';
import * as Calc from '../utils/calc';
import * as U from '../utils/format';
import { FileSpreadsheet, Printer } from 'lucide-react';

export function MonthlySummaryView({ onOpenPrint }) {
  const { data, selectedMonth } = useData();

  const { rows, totals } = Calc.summary(data, selectedMonth);

  const getCollectorName = (colId) => {
    const c = (data.settings.collectors || []).find((x) => x.id === colId);
    return c ? (c.bn || c.en) : '—';
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
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
            {U.monthLabel(selectedMonth)} — মাসিক হিসাবায়ন ও সারসংক্ষেপ
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
            সকল ২৭টি ফ্ল্যাটের মাসিক সার্ভিস চার্জ জমা ও সর্বমোট বকেয়া পাওনার বিবরণী।
          </p>
        </div>

        <button onClick={onOpenPrint} className="btn btn-primary btn-sm">
          <Printer size={15} />
          <span>প্রিন্ট ভিউ দেখুন</span>
        </button>
      </div>

      <div className="card">
        <div className="card-body flush">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '46px', textAlign: 'center' }}>ক্রমিক</th>
                  <th>ফ্ল্যাট মালিকের নাম</th>
                  <th style={{ width: '70px', textAlign: 'center' }}>ফ্ল্যাট</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>
                    {U.monthLabelShort(selectedMonth)} জমা (i)
                  </th>
                  <th style={{ width: '175px', textAlign: 'right' }}>
                    মোট বকেয়া {U.monthLabelShort(selectedMonth)} পর্যন্ত (ii)
                  </th>
                  <th style={{ width: '190px', textAlign: 'center' }}>জমার স্বাক্ষর</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const payment = data.payments.find((p) => p.flatId === r.flat.id && p.month === selectedMonth);
                  const isPaid = payment && Number(payment.amount) > 0;
                  const isAdvance = r.due <= 0 && r.advance > 0;
                  const sigNames = r.collectorIds.map(getCollectorName).filter(Boolean);

                  return (
                    <tr
                      key={r.flat.id}
                      className={[isPaid ? 'paid-row' : '', isAdvance ? 'advance-row' : '']
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <td style={{ textAlign: 'center', color: '#64748b' }}>{U.bnDigits(r.flat.serial)}</td>
                      <td><b>{r.flat.ownerName}</b></td>
                      <td style={{ textAlign: 'center' }}>{r.flat.flatNo}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: isPaid ? 'var(--success-dark)' : '#94a3b8' }}>
                        {isPaid ? U.bnNumber(payment.amount) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: r.due > 0 ? 'var(--danger)' : '#64748b' }}>
                        {r.due > 0
                          ? U.bnNumber(r.due)
                          : isAdvance
                            ? <span className="advance-tag">অগ্রীম {U.bnNumber(r.advance)}</span>
                            : 'নেই'}
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '12px' }}>
                        {sigNames.length ? sigNames.join(', ') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f1f5f9', fontWeight: 700, fontSize: '14px' }}>
                  <td colSpan="3" style={{ textAlign: 'right' }}>সর্বমোট:</td>
                  <td style={{ textAlign: 'right', color: 'var(--primary)' }}>{U.bnTaka(totals.monthCollected)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{U.bnTaka(totals.totalDue)}</td>
                  <td colSpan="1" style={{ textAlign: 'center', color: '#64748b' }}>
                    মোট ফ্ল্যাট: {U.bnDigits(totals.flatCount)} টি
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
