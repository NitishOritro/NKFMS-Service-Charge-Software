'use strict';

/* মাসিক সারসংক্ষেপ রিপোর্টের HTML তৈরি — মূল PDF-এর ছক অনুসরণ করে */

(function () {
  const U = window.U;
  const Calc = window.Calc;

  const REPORT_CSS = `
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Nirmala UI', 'Shonar Bangla', 'Vrinda', 'Segoe UI', sans-serif;
      margin: 0; padding: 0; color: #000; background: #fff;
      font-size: 11px; line-height: 1.35;
    }
    .sheet { padding: 4mm; }
    .head { text-align: center; margin-bottom: 6px; }
    .head .society { font-size: 17px; font-weight: 700; letter-spacing: .2px; }
    .head .committee { font-size: 13px; font-weight: 600; margin-top: 1px; }
    .head .title { font-size: 12.5px; font-weight: 600; margin-top: 5px; text-decoration: underline; }
    .head .date { font-size: 11px; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #000; padding: 2.5px 4px; }
    th { text-align: center; font-weight: 700; font-size: 10.5px; background: #eef1f6; }
    td { font-size: 11px; }
    .c { text-align: center; }
    .r { text-align: right; }
    .name { text-align: left; white-space: nowrap; }
    .sig { text-align: center; font-family: 'Segoe UI', sans-serif; font-size: 9.5px; }
    .blank { background: #fff; }
    tfoot td { font-weight: 700; background: #f3f5f9; }
    .totals { margin-top: 8px; display: flex; gap: 10px; }
    .totals .box { flex: 1; border: 1px solid #000; padding: 4px 6px; font-size: 11px; }
    .totals .box b { display: block; font-size: 12.5px; margin-top: 2px; }
    .note { margin-top: 6px; font-size: 10.5px; font-style: italic; }
    .signs { margin-top: 22px; display: flex; flex-wrap: wrap; gap: 14px 0; }
    .signs .s { flex: 0 0 33.33%; text-align: center; font-size: 11px; }
    .signs .s .line { margin: 0 auto 3px; width: 70%; border-top: 1px solid #000; padding-top: 2px; }
    .signs .s .sd { font-size: 10px; }
    .signs .s .nm { font-weight: 700; }
    .signs .s .dg { font-size: 10.5px; }
    .foot { margin-top: 14px; font-size: 9.5px; text-align: center; color: #444; }
  `;

  function collectorName(settings, collectorId) {
    const c = (settings.collectors || []).find((x) => x.id === collectorId);
    if (!c) return '';
    return c.en || c.bn || '';
  }

  /**
   * @param {object} data       পূর্ণ ডেটা
   * @param {string} month      যে মাসের রিপোর্ট (যেমন '2026-07')
   * @param {object} [options]  { nextMonthColumn: boolean }
   */
  function buildReportHtml(data, month, options) {
    const opts = Object.assign({ nextMonthColumn: true }, options || {});
    const s = data.settings;
    const { rows, totals } = Calc.summary(data, month);
    const nextMonth = U.addMonths(month, 1);
    const nextRate = Calc.rateForMonth(s, nextMonth);
    const monthShort = U.monthLabelShort(month);
    const nextShort = U.monthLabelShort(nextMonth);

    const bodyRows = rows.map((r) => {
      const paidCell = r.monthPaid > 0 ? U.bnNumber(r.monthPaid) : '-';
      const dueCell = r.due > 0
        ? U.bnNumber(r.due)
        : (r.advance > 0 ? `অগ্রীম ${U.bnNumber(r.advance)}` : 'নেই');
      const sigNames = r.collectorIds
        .map((id) => collectorName(s, id))
        .filter(Boolean);
      const sigCell = sigNames.length ? sigNames.join(', ') : '-';
      const nextCell = opts.nextMonthColumn ? '<td class="blank">&nbsp;</td>' : '';
      return `<tr>
        <td class="c">${U.bnDigits(r.flat.serial)}</td>
        <td class="name">${U.escapeHtml(r.flat.ownerName)}</td>
        <td class="c">${U.escapeHtml(r.flat.flatNo)}</td>
        <td class="r">${paidCell}</td>
        <td class="r">${dueCell}</td>
        ${nextCell}
        <td class="sig">${U.escapeHtml(sigCell)}</td>
      </tr>`;
    }).join('\n');

    const signs = (s.signatories || []).map((sig) => `
      <div class="s">
        <div class="line"></div>
        <div class="sd">স্বাক্ষরিত/-</div>
        <div class="nm">${U.escapeHtml(sig.name)}</div>
        <div class="dg">${U.escapeHtml(sig.designation)}</div>
        <div class="dg">${U.escapeHtml(s.committeeName)}</div>
      </div>`).join('\n');

    const nextHeader = opts.nextMonthColumn
      ? `<th style="width:12%">${nextShort} জমা<br>${U.bnNumber(nextRate)}/-<br>(iii)</th>`
      : '';

    return `<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<title>${U.escapeHtml(s.societyName)} — ${monthShort}</title>
<style>${REPORT_CSS}</style>
</head>
<body>
<div class="sheet">
  <div class="head">
    <div class="society">${U.escapeHtml(s.societyName)}</div>
    <div class="committee">${U.escapeHtml(s.committeeName)}</div>
    <div class="title">সার্ভিস চার্জ জমা ও বকেয়া হিসাবায়ন সারসংক্ষেপ (${monthShort} পর্যন্ত)</div>
    <div class="date">তারিখ: ${U.monthEndDateLabel(month)}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:6%">ক্রমিক<br>নং</th>
        <th style="width:30%">ফ্ল্যাট মালিকের নাম<br>(ফ্ল্যাট নাম্বার ক্রম অনুযায়ী)</th>
        <th style="width:9%">ফ্ল্যাট নং</th>
        <th style="width:12%">${monthShort} জমা<br>(i)</th>
        <th style="width:15%">মোট বকেয়া পাওনা<br>${monthShort} পর্যন্ত (ii)</th>
        ${nextHeader}
        <th style="width:16%">${monthShort} জমার<br>স্বাক্ষর</th>
      </tr>
    </thead>
    <tbody>
${bodyRows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3" class="r">সর্বমোট</td>
        <td class="r">${U.bnNumber(totals.monthCollected)}</td>
        <td class="r">${U.bnNumber(totals.totalDue)}</td>
        ${opts.nextMonthColumn ? '<td class="blank">&nbsp;</td>' : ''}
        <td class="blank">&nbsp;</td>
      </tr>
    </tfoot>
  </table>

  <div class="totals">
    <div class="box">${monthShort} মাসে মোট প্রদানকৃত টাকার পরিমাণ <b>${U.bnNumber(totals.monthCollected)}/-</b></div>
    <div class="box">মোট বকেয়া সার্ভিস চার্জ <b>${U.bnNumber(totals.totalDue)}/-</b></div>
    <div class="box">মোট অগ্রীম প্রদান <b>${U.bnNumber(totals.totalAdvance)}/-</b></div>
  </div>

  <div class="note">' - ' চিহ্ন মানে ${monthShort} মাসের সার্ভিস চার্জ ${U.bnNumber(Calc.rateForMonth(s, month))}/- জমা হয়নি।</div>

  <div class="signs">
${signs}
  </div>

  <div class="foot">মোট ফ্ল্যাট: ${U.bnDigits(totals.flatCount)} &nbsp;|&nbsp; ${monthShort} মাসে জমা দিয়েছেন ${U.bnDigits(totals.paidThisMonth)} জন &nbsp;|&nbsp; সার্ভিস চার্জ ব্যবস্থাপনা সফটওয়্যার দ্বারা প্রস্তুত</div>
</div>
</body>
</html>`;
  }

  /** এক ফ্ল্যাটের লেজার রিপোর্ট */
  function buildLedgerHtml(data, flat, month) {
    const s = data.settings;
    const rows = Calc.ledger(data, flat, month);
    const status = Calc.flatStatus(data, flat, month);
    const body = rows.map((r) => `<tr>
      <td class="name">${U.escapeHtml(r.label)}</td>
      <td class="r">${r.charge ? U.bnNumber(r.charge) : '-'}</td>
      <td class="r">${r.paid ? U.bnNumber(r.paid) : '-'}</td>
      <td class="sig">${U.escapeHtml(r.collectorIds.map((id) => collectorName(s, id)).filter(Boolean).join(', ') || '-')}</td>
      <td class="r">${U.bnNumber(r.balance)}</td>
    </tr>`).join('\n');

    return `<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<title>${U.escapeHtml(flat.flatNo)} — লেজার</title>
<style>${REPORT_CSS}</style>
</head>
<body>
<div class="sheet">
  <div class="head">
    <div class="society">${U.escapeHtml(s.societyName)}</div>
    <div class="committee">${U.escapeHtml(s.committeeName)}</div>
    <div class="title">ফ্ল্যাটভিত্তিক সার্ভিস চার্জ লেজার (${U.monthLabel(month)} পর্যন্ত)</div>
    <div class="date">ফ্ল্যাট নং: ${U.escapeHtml(flat.flatNo)} &nbsp;|&nbsp; মালিক: ${U.escapeHtml(flat.ownerName)} &nbsp;|&nbsp; তারিখ: ${U.monthEndDateLabel(month)}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:34%">মাস</th>
        <th style="width:16%">ধার্য চার্জ</th>
        <th style="width:16%">জমা</th>
        <th style="width:18%">আদায়কারী</th>
        <th style="width:16%">জের</th>
      </tr>
    </thead>
    <tbody>
${body}
    </tbody>
    <tfoot>
      <tr>
        <td class="r">সর্বমোট</td>
        <td class="r">${U.bnNumber(status.opening + status.charged)}</td>
        <td class="r">${U.bnNumber(status.paid)}</td>
        <td></td>
        <td class="r">${U.bnNumber(status.balance)}</td>
      </tr>
    </tfoot>
  </table>
  <div class="totals">
    <div class="box">বর্তমান বকেয়া <b>${U.bnNumber(status.due)}/-</b></div>
    <div class="box">অগ্রীম জমা <b>${U.bnNumber(status.advance)}/-</b></div>
  </div>
</div>
</body>
</html>`;
  }

  /** টাকা আদায়ের রসিদ */
  function buildReceiptHtml(data, flat, payment) {
    const s = data.settings;
    const status = Calc.flatStatus(data, flat, payment.month);
    return `<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<title>রসিদ — ${U.escapeHtml(flat.flatNo)}</title>
<style>${REPORT_CSS}
  .rcpt { border: 2px solid #000; padding: 12px 16px; max-width: 165mm; margin: 0 auto; }
  .rcpt .line2 { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
  .amt { font-size: 20px; font-weight: 700; text-align: center; margin: 12px 0; border: 1px dashed #000; padding: 8px; }
  .rsign { display: flex; justify-content: space-between; margin-top: 40px; font-size: 11px; }
  .rsign div { text-align: center; border-top: 1px solid #000; padding-top: 3px; width: 40%; }
</style>
</head>
<body>
<div class="sheet">
  <div class="rcpt">
    <div class="head">
      <div class="society">${U.escapeHtml(s.societyName)}</div>
      <div class="committee">${U.escapeHtml(s.committeeName)}</div>
      <div class="title">সার্ভিস চার্জ আদায়ের রসিদ</div>
    </div>
    <div class="line2"><span>রসিদ নং: ${U.escapeHtml(payment.id)}</span><span>তারিখ: ${U.dateLabel(payment.receivedOn)}</span></div>
    <div class="line2"><span>ফ্ল্যাট নং: <b>${U.escapeHtml(flat.flatNo)}</b></span><span>মালিক: <b>${U.escapeHtml(flat.ownerName)}</b></span></div>
    <div class="line2"><span>মাস: <b>${U.monthLabel(payment.month)}</b></span><span>আদায়কারী: <b>${U.escapeHtml(collectorName(s, payment.collectorId) || '—')}</b></span></div>
    <div class="amt">জমাকৃত টাকা: ${U.bnNumber(payment.amount)}/- (${U.bnTaka(payment.amount)})</div>
    <div class="line2"><span>${U.monthLabel(payment.month)} পর্যন্ত মোট বকেয়া:</span><span><b>${U.bnNumber(status.due)}/-</b></span></div>
    ${payment.note ? `<div class="line2"><span>মন্তব্য: ${U.escapeHtml(payment.note)}</span></div>` : ''}
    <div class="rsign">
      <div>জমাদানকারীর স্বাক্ষর</div>
      <div>আদায়কারীর স্বাক্ষর</div>
    </div>
  </div>
</div>
</body>
</html>`;
  }

  window.Report = { buildReportHtml, buildLedgerHtml, buildReceiptHtml, collectorName };
}());
