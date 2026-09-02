import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import * as Calc from '../utils/calc';
import * as U from '../utils/format';
import { Printer, FileText, ChevronLeft, Layers } from 'lucide-react';
import { Watermark } from '../components/Watermark';
import { ResidentBadge } from '../components/ResidentBadge';
import { LOGO_BASE64 } from '../assets/logoData';

// জমা পড়েনি বোঝাতে লাল '-'; ছাপার সময়ও রঙটি যেন থেকে যায় (styles/print.css)
const DASH = <span className="dash">-</span>;

/**
 * আয়-ব্যয় খতিয়ানের এক পাশ (আদায় বা খরচ) ছাপার সারিতে ভাঙা।
 *
 * উপ-লাইনহীন সারি → একটি সারি: [ক্রমিক] [বিবরণ] [পরিমাণ]
 * উপ-লাইনসহ সারি  → শিরোনামের একটি সারি, তারপর প্রতিটি লাইনের সারি;
 *                    ক্রমিকের ঘরটি সবগুলো জুড়ে থাকে (rowSpan) — কাগজে
 *                    যেভাবে মার্জ করা থাকে ঠিক সেভাবেই।
 */
function cashbookCells(entries) {
  const cell = { padding: '4px 7px', verticalAlign: 'middle' };
  const out = [];

  entries.forEach((e, idx) => {
    const lines = e.lines || [];
    const serial = U.bnDigits(idx + 1);

    if (!lines.length) {
      out.push([
        <td key="s" style={{ ...cell, textAlign: 'center' }}>{serial}</td>,
        <td key="t" style={{ ...cell, textAlign: 'left' }}>{e.title}</td>,
        <td key="a" style={{ ...cell, textAlign: 'right' }}>
          {U.bnNumber(Calc.ledgerRowAmount(e))}
        </td>
      ]);
      return;
    }

    out.push([
      <td key="s" rowSpan={lines.length + 1} style={{ ...cell, textAlign: 'center' }}>
        {serial}
      </td>,
      <td key="t" colSpan={2} style={{ ...cell, textAlign: 'left', fontWeight: 600 }}>
        {e.title}
      </td>
    ]);

    lines.forEach((l, li) => {
      out.push([
        <td key={`t${li}`} style={{ ...cell, textAlign: 'left', paddingLeft: '16px' }}>
          {l.text}
        </td>,
        <td
          key={`a${li}`}
          style={
            l.due
              ? { ...cell, textAlign: 'center', color: '#b91c1c',
                  fontWeight: 700, background: '#fee2e2' }
              : { ...cell, textAlign: 'right' }
          }
        >
          {l.due ? 'বকেয়া' : U.bnNumber(l.amount)}
        </td>
      ]);
    });
  });

  return out;
}

const CASHBOOK_BLANK = [
  <td key="b1">&nbsp;</td>,
  <td key="b2">&nbsp;</td>,
  <td key="b3">&nbsp;</td>
];

export function ReportView({
  defaultReport = 'monthly',
  selectiveFlatIds = null,
  autoPrint = false,
  onAutoPrintDone
}) {
  const { data, selectedMonth } = useData();
  const [reportType, setReportType] = useState(defaultReport);
  const [selectedLedgerFlatId, setSelectedLedgerFlatId] = useState(data.flats[0]?.id || '');

  const s = data.settings;
  const monthShort = U.monthLabelShort(selectedMonth);
  const nextMonth = U.addMonths(selectedMonth, 1);
  const nextRate = Calc.rateForMonth(s, nextMonth);
  const nextShort = U.monthLabelShort(nextMonth);

  const { rows, totals } = Calc.summary(data, selectedMonth);

  // অন্য পাতা থেকে "প্রিন্ট ও PDF" চেপে এলে ছাপার ঘরটি নিজে থেকেই আসে।
  // সামান্য দেরি — নইলে ফন্ট ও বিন্যাস বসার আগেই ব্রাউজার ছবি নিয়ে নেয়।
  useEffect(() => {
    if (!autoPrint) return;
    const t = setTimeout(() => {
      window.print();
      if (onAutoPrintDone) onAutoPrintDone();
    }, 600);
    return () => clearTimeout(t);
  }, [autoPrint, onAutoPrintDone]);

  // আয়-ব্যয় হিসাবায়ন — আদায়কারীদের সারি ledgerSummary নিজেই বসিয়ে দেয়
  const cash = Calc.ledgerSummary(data, selectedMonth);
  const cashDeficit = cash.balance < 0;
  // মাসটি এখনো চলছে — এর হিসাব মাস শেষ হওয়ার আগে তৈরি হওয়ার কথা নয়
  const cashRunning = selectedMonth === U.currentMonth();
  const cashIn = cashbookCells(cash.income);
  const cashOut = cashbookCells(cash.expense);

  const getCollectorName = (colId) => {
    const c = (s.collectors || []).find((x) => x.id === colId);
    return c ? (c.bn || c.en) : '';
  };

  // ---- বকেয়া বিবরণী ----
  // এই রিপোর্টটি হিসাব করে আগের মাস পর্যন্ত, চলতি মাস বাদ দিয়ে।
  // কারণ চলতি মাসের চার্জ সবে ধার্য হয়েছে, আদায়ের সময় এখনো পার হয়নি —
  // সেটিকে বকেয়া দেখালে প্রায় সব মালিকই অন্যায়ভাবে বকেয়াদার হয়ে যান।
  // অর্থাৎ সেপ্টেম্বর ২০২৬ চললে বিবরণী দেখাবে আগস্ট ২০২৬ পর্যন্ত।
  const duesUpToMonth = U.addMonths(selectedMonth, -1);
  const targetFlats = selectiveFlatIds && selectiveFlatIds.length
    ? data.flats.filter((f) => selectiveFlatIds.includes(f.id))
    : data.flats;
  const selectiveStatuses = targetFlats.map((f) => Calc.flatStatus(data, f, duesUpToMonth));

  // Ledger Data
  // হেডারের তারিখ রিপোর্ট যতটুকু সময় ঢেকেছে সেই সময়ের শেষ দিন দেখাবে।
  // বকেয়া বিবরণী চলতি মাস বাদ দিয়ে হিসাব করে, তাই সেখানে আগের মাসের
  // শেষ তারিখ — নইলে "আগস্ট পর্যন্ত" লেখা থাকলেও তারিখ সেপ্টেম্বরের
  // দেখাত, যা পরস্পরবিরোধী।
  const headDateMonth = reportType === 'selective' ? duesUpToMonth : selectedMonth;

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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
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
            onClick={() => setReportType('cashbook')}
            className={`btn btn-sm ${reportType === 'cashbook' ? 'btn-primary' : 'btn-outline'}`}
          >
            আয়-ব্যয় হিসাবায়ন
          </button>
          <button
            onClick={() => setReportType('ledger')}
            className={`btn btn-sm ${reportType === 'ledger' ? 'btn-primary' : 'btn-outline'}`}
          >
            ফ্ল্যাটভিত্তিক লেজার স্টেটমেন্ট
          </button>

          {/* ফ্ল্যাট বাছাইয়ের ঘরটি আগে ডান কোণে প্রিন্ট বোতামের পাশে ছিল,
              চোখে পড়ত না। লেজার বোতামের ঠিক পাশে আনা হলো — যে বোতামটি
              চেপে এখানে আসা হয়, তার গায়েই বাছাইয়ের ঘর।              */}
          {reportType === 'ledger' && (
            <div className="ledger-flat-picker">
              <label htmlFor="ledger-flat">ফ্ল্যাট বাছুন:</label>
              <select
                id="ledger-flat"
                className="form-select"
                value={selectedLedgerFlatId}
                onChange={(e) => setSelectedLedgerFlatId(e.target.value)}
              >
                {data.flats.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.flatNo} — {f.ownerName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              {reportType === 'selective' && `ফ্ল্যাট মালিকদের বকেয়া সার্ভিস চার্জ বিবরণী (${U.monthLabel(duesUpToMonth)} পর্যন্ত)`}
              {reportType === 'cashbook' && `সার্ভিস হিসাবায়ন সারসংক্ষেপ (${monthShort})`}
              {reportType === 'ledger' && 'ফ্ল্যাটভিত্তিক সার্ভিস চার্জ লেজার ও বকেয়া বিবরণী'}
            </div>
          </div>
          <div className="head-date">
            তারিখ: {U.monthEndDateLabel(headDateMonth)}
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
                  const paidCell = r.monthPaid > 0 ? U.bnNumber(r.monthPaid) : DASH;
                  const dueCell = r.due > 0 ? U.bnNumber(r.due) : (r.advance > 0 ? `অগ্রীম ${U.bnNumber(r.advance)}` : 'নেই');
                  const sigNames = r.collectorIds.map(getCollectorName).filter(Boolean);
                  const sigCell = sigNames.length ? sigNames.join(', ') : DASH;

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
              {DASH} চিহ্ন মানে {monthShort} মাসের সার্ভিস চার্জ {U.bnNumber(Calc.rateForMonth(s, selectedMonth))}/- জমা হয়নি।
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

        {/* REPORT 4: আয়-ব্যয় হিসাবায়ন — কাগজের মতো পাশাপাশি দুটি খতিয়ান */}
        {reportType === 'cashbook' && (
          <>
            <table className="print-table cashbook-table">
              <thead>
                <tr>
                  <th style={{ width: '6%' }}>ক্রমিক<br />নং</th>
                  <th style={{ width: '33%' }}>আদায়ের বিবরণ (+)</th>
                  <th style={{ width: '11%' }}>আদায়ের<br />পরিমান</th>
                  <th style={{ width: '6%' }}>ক্রমিক<br />নং</th>
                  <th style={{ width: '33%' }}>খরচের বিবরণ (−)</th>
                  <th style={{ width: '11%' }}>খরচের<br />পরিমান</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.max(cashIn.length, cashOut.length) }).map((_, i) => (
                  <tr key={i}>
                    {cashIn[i] || CASHBOOK_BLANK}
                    {cashOut[i] || CASHBOOK_BLANK}
                  </tr>
                ))}
                {cashIn.length === 0 && cashOut.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '18px' }}>
                      {monthShort} মাসের কোনো আদায় বা খরচ এখনো লেখা হয়নি।
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center', background: '#dcfce7' }}>
                    মোট আদায়ের পরিমান
                  </td>
                  <td style={{ textAlign: 'right', background: '#dcfce7' }}>
                    {U.bnNumber(cash.totalIncome)}
                  </td>
                  <td colSpan="2" style={{ textAlign: 'center', background: '#fee2e2' }}>
                    মোট খরচের পরিমান
                  </td>
                  <td style={{ textAlign: 'right', background: '#fee2e2' }}>
                    {U.bnNumber(cash.totalExpense)}
                  </td>
                </tr>
                <tr>
                  {/* ঘাটতি চোখে পড়া দরকার — তাই লাল, উদ্বৃত্ত হলে সবুজ */}
                  <td
                    colSpan="6"
                    className={cashDeficit ? 'cash-short' : undefined}
                    style={{
                      textAlign: 'center',
                      background: cashDeficit ? '#fee2e2' : '#fef9c3',
                      color: cashDeficit ? '#b91c1c' : cash.balance === 0 ? '#334155' : '#15803d'
                    }}
                  >
                    {cash.balance === 0
                      ? 'আয় ও ব্যয় সমান'
                      : cashDeficit
                        ? 'ক্যাশ ঘাটতি রয়েছে'
                        : 'ক্যাশ উদ্বৃত্ত রয়েছে'}{' '}
                    = &nbsp;
                    <b style={{ fontSize: '13.5px' }}>
                      {cashDeficit ? '−' : ''}
                      {U.bnNumber(Math.abs(cash.balance))}
                    </b>
                    &nbsp; টাকা
                  </td>
                </tr>

                {/* বিশেষ নোট — কাগজের মতো যোগফলের নিচে, পুরো পাতা জুড়ে।
                    টাকার অঙ্ক নয়, তাই কোনো যোগফলে ধরা হয় না।          */}
                {cash.notes.map((n, i) => (
                  <tr key={n.id} className="cashbook-note">
                    <td style={{ textAlign: 'center' }}>
                      {U.bnDigits(cash.expense.length + i + 1)}
                    </td>
                    <td colSpan="5" style={{ textAlign: 'left', fontWeight: 400 }}>
                      {n.title}
                      {(n.lines || []).map((l, li) => (
                        <div key={li} style={{ marginTop: '2px' }}>{l.text}</div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tfoot>
            </table>

            {cashRunning ? (
              <div className="cashbook-warning">
                <b>{monthShort} মাস এখনো চলছে।</b> মাসের হিসাব মাস শেষ হওয়ার পর তৈরি হয় —
                এখানে যা দেখাচ্ছে তা কেবল আজ পর্যন্ত লেখা এন্ট্রি, সম্পূর্ণ হিসাব নয়।
                এটি ছাপিয়ে সমিতিতে দেবেন না।
              </div>
            ) : cash.incomplete ? (
              <div className="cashbook-warning">
                <b>এই হিসাবটি এখনো সম্পূর্ণ নয়।</b> {monthShort} মাসের কোনো খরচ লেখা হয়নি,
                তাই উপরের যোগফলকে উদ্বৃত্ত হিসেবে ধরা যাবে না। খরচের খাতগুলো
                বসানোর পর হিসাবটি ছাপাবেন।
              </div>
            ) : null}

            <div className="print-signs" style={{ marginTop: '26px' }}>
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
              {monthShort} মাসের আদায় ও খরচের হিসাব &nbsp;|&nbsp; আদায়ের সারি{' '}
              {U.bnDigits(cash.income.length)}টি, খরচের সারি {U.bnDigits(cash.expense.length)}টি
              &nbsp;|&nbsp; নীলকণ্ঠ ফ্ল্যাট মালিক সমিতি সার্ভিস চার্জ সফটওয়্যার দ্বারা প্রস্তুত
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
                  {/* নাম ২০% → ২৫%, মোবাইল ১২% → ৭%।
                      "বসবাসরত অবস্থায়" ব্যাজটি নামের পাশে বসতে ২১৪px
                      জায়গা লাগত, ছিল মাত্র ২০৭px — তাই প্রতিবার নিচের
                      লাইনে নেমে সারিটি ৪৩px থেকে ৭০px হয়ে যেত।
                      মোবাইলের ঘরে ১১ অঙ্কের নম্বরই যথেষ্ট, বাড়তি
                      জায়গাটুকু নামের কলামে দেওয়া হলো।              */}
                  <th style={{ width: '25%', textAlign: 'left' }}>মালিকের নাম</th>
                  <th style={{ width: '7%' }}>মোবাইল</th>
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
                      <td style={{ textAlign: 'left' }}>
                        <b>{st.flat.ownerName}</b>
                        <ResidentBadge flat={st.flat} className="is-compact" />
                      </td>
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
                  <th style={{ width: '18%', textAlign: 'right' }}>বকেয়া টাকা</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((lr, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'left' }}>
                      <b>{lr.label}</b>
                      {Calc.isResidentMonth(ledgerFlat, lr.month) && (
                        <ResidentBadge flat={ledgerFlat} />
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>{lr.charge ? U.bnNumber(lr.charge) : DASH}</td>
                    <td style={{ textAlign: 'right' }}>{lr.paid ? U.bnNumber(lr.paid) : DASH}</td>
                    <td style={{ textAlign: 'center', fontSize: '9.5px' }}>
                      {lr.collectorIds.map(getCollectorName).filter(Boolean).join(', ') || DASH}
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
              <div className="box">
                মোট পরিশোধিত ({monthShort} পর্যন্ত):{' '}
                <b>{U.bnNumber(ledgerStatus.paid)}/-</b>
              </div>
              <div className="box" style={{ border: '2px solid #000' }}>
                বকেয়া পাওনা ({monthShort} পর্যন্ত):{' '}
                <b style={{ color: '#b91c1c' }}>{U.bnNumber(ledgerStatus.due)}/-</b>
              </div>
            </div>

            <div className="print-signs" style={{ marginTop: '30px' }}>
              {(s.signatories || []).map((sig) => (
                <div key={sig.id} className="s">
                  <div className="line"></div>
                  <div className="sd">স্বাক্ষরিত/-</div>
                  <div className="nm">{sig.name}</div>
                  <div className="dg">{sig.designation}</div>
                  {/* কমিটির নাম — অন্য দুই রিপোর্টে ছিল, লেজারে বাদ পড়েছিল */}
                  <div className="dg">{s.committeeName}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
