import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import * as Calc from '../utils/calc';
import * as U from '../utils/format';
import { Printer, FileText, ChevronLeft, Layers } from 'lucide-react';
import { Watermark } from '../components/Watermark';
import { LOGO_BASE64 } from '../assets/logoData';

export function ReportView({ defaultReport = 'monthly', selectiveFlatIds = null }) {
  const { data, selectedMonth } = useData();
  const [reportType, setReportType] = useState(defaultReport);
  const [selectedLedgerFlatId, setSelectedLedgerFlatId] = useState(data.flats[0]?.id || '');

  const s = data.settings;
  const monthShort = U.monthLabelShort(selectedMonth);
  const nextMonth = U.addMonths(selectedMonth, 1);
  const nextRate = Calc.rateForMonth(s, nextMonth);
  const nextShort = U.monthLabelShort(nextMonth);

  const { rows, totals } = Calc.summary(data, selectedMonth);

  const getCollectorName = (colId) => {
    const c = (s.collectors || []).find((x) => x.id === colId);
    return c ? (c.bn || c.en) : '';
  };

  // Selective Dues Data
  const targetFlats = selectiveFlatIds && selectiveFlatIds.length
    ? data.flats.filter((f) => selectiveFlatIds.includes(f.id))
    : data.flats;
  const selectiveStatuses = targetFlats.map((f) => Calc.flatStatus(data, f, selectedMonth));

  // Ledger Data
  const ledgerFlat = data.flats.find((f) => f.id === selectedLedgerFlatId) || data.flats[0];
  const ledgerRows = ledgerFlat ? Calc.ledger(data, ledgerFlat, selectedMonth) : [];
  const ledgerStatus = ledgerFlat ? Calc.flatStatus(data, ledgerFlat, selectedMonth) : null;

  return (
    <div className="page-body">
      {/* Top Toolbar (Hidden on Print) */}
      <div
        className="card no-print"
        style={{
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setReportType('monthly')}
            className={`btn btn-sm ${reportType === 'monthly' ? 'btn-primary' : 'btn-outline'}`}
          >
            মাসিক সারসংক্ষেপ রিপোর্ট
          </button>
          <button
            onClick={() => setReportType('selective')}
            className={`btn btn-sm ${reportType === 'selective' ? 'btn-primary' : 'btn-outline'}`}
          >
            বকেয়া বিবরণী রিপোর্ট
          </button>
          <button
            onClick={() => setReportType('ledger')}
            className={`btn btn-sm ${reportType === 'ledger' ? 'btn-primary' : 'btn-outline'}`}
          >
            ফ্ল্যাটভিত্তিক লেজার স্টেটমেন্ট
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {reportType === 'ledger' && (
            <select
              className="form-select"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '13px' }}
              value={selectedLedgerFlatId}
              onChange={(e) => setSelectedLedgerFlatId(e.target.value)}
            >
              {data.flats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.flatNo} — {f.ownerName}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => window.print()}
            className="btn btn-success"
            style={{ padding: '8px 18px', fontWeight: 700 }}
          >
            <Printer size={16} />
            <span>প্রিন্ট / PDF ডাউনলোড (Ctrl + P)</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Container */}
      <div
        className="card print-sheet"
        style={{
          background: '#ffffff',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: 'var(--radius-md)',
          padding: '24px 28px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Centered Watermark */}
        <Watermark logoSrc={LOGO_BASE64} opacity={0.12} />

        {/* 3-Column Header */}
        <div className="print-head">
          <div className="head-logo">
            <img src={LOGO_BASE64} alt="Logo" />
            <div className="logo-label">NKFMS</div>
          </div>
          <div className="head-center">
            <div className="society">{s.societyName}</div>
            <div className="committee">{s.committeeName}</div>
            <div className="title">
              {reportType === 'monthly' && `সার্ভিস চার্জ জমা ও বকেয়া হিসাবায়ন সারসংক্ষেপ (${monthShort} পর্যন্ত)`}
              {reportType === 'selective' && `ফ্ল্যাট মালিকদের বকেয়া সার্ভিস চার্জ বিবরণী (${U.monthLabel(selectedMonth)} পর্যন্ত)`}
              {reportType === 'ledger' && 'ফ্ল্যাটভিত্তিক সার্ভিস চার্জ লেজার ও বকেয়া বিবরণী'}
            </div>
          </div>
          <div className="head-date">
            তারিখ: {U.monthEndDateLabel(selectedMonth)}
            {reportType === 'ledger' && ledgerFlat && (
              <div style={{ fontSize: '10.5px', marginTop: '2px' }}>
                ফ্ল্যাট: <b>{ledgerFlat.flatNo}</b>
              </div>
            )}
          </div>
        </div>

        {/* REPORT 1: Monthly Summary */}
        {reportType === 'monthly' && (
          <>
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>ক্রমিক<br />নং</th>
                  <th style={{ width: '28%', textAlign: 'left' }}>ফ্ল্যাট মালিকের নাম<br />(ফ্ল্যাট নম্বর ক্রম অনুযায়ী)</th>
                  <th style={{ width: '8%' }}>ফ্ল্যাট<br />নং</th>
                  <th style={{ width: '12%', textAlign: 'right' }}>{monthShort} জমা<br />(i)</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>মোট বকেয়া পাওনা<br />{monthShort} পর্যন্ত (ii)</th>
                  <th style={{ width: '14%' }}>{nextShort} জমা<br />{U.bnNumber(nextRate)}/-<br />(iii)</th>
                  <th style={{ width: '18%' }}>{monthShort} জমার<br />স্বাক্ষর</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const paidCell = r.monthPaid > 0 ? U.bnNumber(r.monthPaid) : '-';
                  const dueCell = r.due > 0 ? U.bnNumber(r.due) : (r.advance > 0 ? `অগ্রীম ${U.bnNumber(r.advance)}` : 'নেই');
                  const sigNames = r.collectorIds.map(getCollectorName).filter(Boolean);
                  const sigCell = sigNames.length ? sigNames.join(', ') : '-';

                  return (
                    <tr key={r.flat.id}>
                      <td style={{ textAlign: 'center' }}>{U.bnDigits(r.flat.serial)}</td>
                      <td style={{ textAlign: 'left' }}><b>{r.flat.ownerName}</b></td>
                      <td style={{ textAlign: 'center' }}>{r.flat.flatNo}</td>
                      <td style={{ textAlign: 'right' }}>{paidCell}</td>
                      <td style={{ textAlign: 'right', fontWeight: r.due > 0 ? 700 : 400 }}>{dueCell}</td>
                      <td style={{ textAlign: 'center' }}>&nbsp;</td>
                      <td style={{ textAlign: 'center', fontSize: '9.5px' }}>{sigCell}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" style={{ textAlign: 'right' }}>সর্বমোট</td>
                  <td style={{ textAlign: 'right' }}>{U.bnNumber(totals.monthCollected)}</td>
                  <td style={{ textAlign: 'right' }}>{U.bnNumber(totals.totalDue)}</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              </tfoot>
            </table>

            <div className="print-totals">
              <div className="box">
                {monthShort} মাসে মোট প্রদানকৃত টাকার পরিমাণ: <b>{U.bnNumber(totals.monthCollected)}/-</b>
              </div>
              <div className="box">
                মোট বকেয়া সার্ভিস চার্জ: <b>{U.bnNumber(totals.totalDue)}/-</b>
              </div>
              <div className="box">
                মোট অগ্রীম প্রদান: <b>{U.bnNumber(totals.totalAdvance)}/-</b>
              </div>
            </div>

            <div style={{ fontSize: '10.5px', fontStyle: 'italic', marginTop: '6px' }}>
              ' - ' চিহ্ন মানে {monthShort} মাসের সার্ভিস চার্জ {U.bnNumber(Calc.rateForMonth(s, selectedMonth))}/- জমা হয়নি।
            </div>

            <div className="print-signs">
              {(s.signatories || []).map((sig) => (
                <div key={sig.id} className="s">
                  <div className="line"></div>
                  <div className="sd">স্বাক্ষরিত/-</div>
                  <div className="nm">{sig.name}</div>
                  <div className="dg">{sig.designation}</div>
                  <div className="dg">{s.committeeName}</div>
                </div>
              ))}
            </div>

            <div className="print-foot">
              মোট ফ্ল্যাট: {U.bnDigits(totals.flatCount)} &nbsp;|&nbsp; {monthShort} মাসে জমা দিয়েছেন {U.bnDigits(totals.paidThisMonth)} জন &nbsp;|&nbsp; নীলকণ্ঠ ফ্ল্যাট মালিক সমিতি সার্ভিস চার্জ সফটওয়্যার দ্বারা প্রস্তুত
            </div>
          </>
        )}

        {/* REPORT 2: Selective Defaulters */}
        {reportType === 'selective' && (
          <>
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>ক্রম</th>
                  <th style={{ width: '8%' }}>ফ্ল্যাট</th>
                  <th style={{ width: '20%', textAlign: 'left' }}>মালিকের নাম</th>
                  <th style={{ width: '12%' }}>মোবাইল</th>
                  <th style={{ width: '11%', textAlign: 'right' }}>ধার্যকৃত<br />চার্জ</th>
                  <th style={{ width: '11%', textAlign: 'right' }}>মোট<br />জমা</th>
                  <th style={{ width: '11%', textAlign: 'right' }}>বর্তমান<br />বকেয়া</th>
                  <th style={{ width: '11%' }}>সমতুল্য</th>
                </tr>
              </thead>
              <tbody>
                {selectiveStatuses.map((st, idx) => {
                  const eqMonths = st.monthRate > 0 ? Math.round(st.due / st.monthRate) : 0;
                  return (
                    <tr key={st.flat.id}>
                      <td style={{ textAlign: 'center' }}>{U.bnDigits(idx + 1)}</td>
                      <td style={{ textAlign: 'center' }}><b>{st.flat.flatNo}</b></td>
                      <td style={{ textAlign: 'left' }}><b>{st.flat.ownerName}</b></td>
                      <td style={{ textAlign: 'center', fontSize: '10px' }}>{st.flat.phone || '—'}</td>
                      <td style={{ textAlign: 'right' }}>{U.bnNumber(st.charged)}</td>
                      <td style={{ textAlign: 'right' }}>{U.bnNumber(st.paid)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{st.due ? U.bnNumber(st.due) : '০'}</td>
                      <td style={{ textAlign: 'center' }}>{st.due > 0 ? `${U.bnDigits(eqMonths)} মাস` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" style={{ textAlign: 'right' }}>সর্বমোট</td>
                  <td style={{ textAlign: 'right' }}>{U.bnNumber(selectiveStatuses.reduce((a, b) => a + b.charged, 0))}</td>
                  <td style={{ textAlign: 'right' }}>{U.bnNumber(selectiveStatuses.reduce((a, b) => a + b.paid, 0))}</td>
                  <td style={{ textAlign: 'right' }}>{U.bnNumber(selectiveStatuses.reduce((a, b) => a + b.due, 0))}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>

            <div className="print-signs" style={{ marginTop: '30px' }}>
              {(s.signatories || []).map((sig) => (
                <div key={sig.id} className="s">
                  <div className="line"></div>
                  <div className="sd">স্বাক্ষরিত/-</div>
                  <div className="nm">{sig.name}</div>
                  <div className="dg">{sig.designation}</div>
                  <div className="dg">{s.committeeName}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* REPORT 3: Ledger Statement */}
        {reportType === 'ledger' && ledgerFlat && ledgerStatus && (
          <>
            <div style={{ marginBottom: '10px', fontSize: '12px' }}>
              ফ্ল্যাট নং: <b>{ledgerFlat.flatNo}</b> &nbsp;|&nbsp; 
              মালিকের নাম: <b>{ledgerFlat.ownerName}</b> &nbsp;|&nbsp; 
              মোবাইল: <b>{ledgerFlat.phone || '—'}</b>
            </div>

            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: '32%', textAlign: 'left' }}>মাস / বিবরণ</th>
                  <th style={{ width: '16%', textAlign: 'right' }}>ধার্য চার্জ</th>
                  <th style={{ width: '16%', textAlign: 'right' }}>জমা</th>
                  <th style={{ width: '18%', textAlign: 'center' }}>আদায়কারী</th>
                  <th style={{ width: '18%', textAlign: 'right' }}>জের (টাকা)</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((lr, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'left' }}><b>{lr.label}</b></td>
                    <td style={{ textAlign: 'right' }}>{lr.charge ? U.bnNumber(lr.charge) : '-'}</td>
                    <td style={{ textAlign: 'right' }}>{lr.paid ? U.bnNumber(lr.paid) : '-'}</td>
                    <td style={{ textAlign: 'center', fontSize: '9.5px' }}>
                      {lr.collectorIds.map(getCollectorName).filter(Boolean).join(', ') || '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{U.bnNumber(lr.balance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ textAlign: 'right' }}>সর্বমোট</td>
                  <td style={{ textAlign: 'right' }}>{U.bnNumber(ledgerStatus.opening + ledgerStatus.charged)}</td>
                  <td style={{ textAlign: 'right' }}>{U.bnNumber(ledgerStatus.paid)}</td>
                  <td></td>
                  <td style={{ textAlign: 'right' }}>{U.bnNumber(ledgerStatus.balance)}</td>
                </tr>
              </tfoot>
            </table>

            <div className="print-totals" style={{ marginTop: '12px' }}>
              <div className="box">মোট পরিশোধিত: <b>{U.bnNumber(ledgerStatus.paid)}/-</b></div>
              <div className="box" style={{ border: '2px solid #000' }}>
                বর্তমান বকেয়া পাওনা: <b style={{ color: '#b91c1c' }}>{U.bnNumber(ledgerStatus.due)}/-</b>
              </div>
            </div>

            <div className="print-signs" style={{ marginTop: '30px' }}>
              {(s.signatories || []).slice(0, 3).map((sig) => (
                <div key={sig.id} className="s">
                  <div className="line"></div>
                  <div className="sd">স্বাক্ষরিত/-</div>
                  <div className="nm">{sig.name}</div>
                  <div className="dg">{sig.designation}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
