'use strict';

/* মাসিক সারসংক্ষেপ, ফ্ল্যাট লেজার ও সিলেক্টিভ বকেয়া রিপোর্টের HTML তৈরি */

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
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet { position: relative; z-index: 1; padding: 2mm 3mm; min-height: 270mm; }
    .watermark-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 500px;
      height: 500px;
      opacity: 0.12;
      z-index: 0;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .watermark-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
      position: relative;
      z-index: 2;
    }
    .head .head-logo {
      width: 65px;
      text-align: center;
      flex-shrink: 0;
    }
    .head .head-logo img {
      width: 52px;
      height: 52px;
      object-fit: contain;
    }
    .head .head-logo .logo-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-top: 1px;
    }
    .head .head-center {
      text-align: center;
      flex-grow: 1;
      padding: 0 8px;
    }
    .head .head-date {
      width: 145px;
      text-align: right;
      font-size: 11px;
      font-weight: 600;
      flex-shrink: 0;
    }
    .head .society { font-size: 16.5px; font-weight: 700; letter-spacing: .2px; }
    .head .committee { font-size: 12.5px; font-weight: 600; margin-top: 1px; }
    .head .title { font-size: 12px; font-weight: 600; margin-top: 4px; text-decoration: underline; }
    .head .date { font-size: 11px; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; position: relative; z-index: 1; background: transparent; }
    th, td { border: 1px solid #000; padding: 2.5px 4px; }
    th { text-align: center; font-weight: 700; font-size: 10.5px; background: rgba(238, 241, 246, 0.85); }
    td { font-size: 11px; }
    .c { text-align: center; }
    .r { text-align: right; }
    .name { text-align: left; white-space: nowrap; }
    .sig { text-align: center; font-family: 'Segoe UI', sans-serif; font-size: 9.5px; }
    .blank { background: transparent; }
    .unpaid-tag { display: inline-block; padding: 1px 4px; border-radius: 3px; font-size: 9.5px; font-weight: 600; background: rgba(254, 226, 226, 0.85); color: #991b1b; }
    .paid-tag { display: inline-block; padding: 1px 4px; border-radius: 3px; font-size: 9.5px; font-weight: 600; background: rgba(220, 252, 231, 0.85); color: #166534; }
    tfoot td { font-weight: 700; background: rgba(243, 245, 249, 0.85); }
    .totals { margin-top: 8px; display: flex; gap: 10px; position: relative; z-index: 1; }
    .totals .box { flex: 1; border: 1px solid #000; padding: 4px 6px; font-size: 11px; background: rgba(255, 255, 255, 0.7); }
    .totals .box b { display: block; font-size: 12.5px; margin-top: 2px; }
    .note { margin-top: 6px; font-size: 10.5px; font-style: italic; }
    .signs { margin-top: 20px; display: flex; flex-wrap: wrap; gap: 14px 0; position: relative; z-index: 1; }
    .signs .s { flex: 0 0 33.33%; text-align: center; font-size: 11px; }
    .signs .s .line { margin: 0 auto 3px; width: 70%; border-top: 1px solid #000; padding-top: 2px; }
    .signs .s .sd { font-size: 10px; }
    .signs .s .nm { font-weight: 700; }
    .signs .s .dg { font-size: 10.5px; }
    .foot { margin-top: 14px; font-size: 9.5px; text-align: center; color: #444; }
  `;

  function getWatermarkHtml() {
    const logoSrc = window.LOGO_DATA_URL || 'assets/logo.png';
    return `<div class="watermark-container"><img class="watermark-img" src="${logoSrc}" alt=""></div>`;
  }

  function collectorName(settings, collectorId) {
    const c = (settings.collectors || []).find((x) => x.id === collectorId);
    if (!c) return '';
    return c.en || c.bn || '';
  }

  /**
   * মাসিক সারসংক্ষেপ রিপোর্ট
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
  ${getWatermarkHtml()}
  <div class="head">
    <div class="head-logo">
      <img src="${window.LOGO_DATA_URL || 'assets/logo.png'}" alt="Logo">
      <div class="logo-label">NKFMS</div>
    </div>
    <div class="head-center">
      <div class="society">${U.escapeHtml(s.societyName)}</div>
      <div class="committee">${U.escapeHtml(s.committeeName)}</div>
      <div class="title">সার্ভিস চার্জ জমা ও বকেয়া হিসাবায়ন সারসংক্ষেপ (${monthShort} পর্যন্ত)</div>
    </div>
    <div class="head-date">
      তারিখ: ${U.monthEndDateLabel(month)}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:6%">ক্রমিক<br>নং</th>
        <th style="width:30%">ফ্ল্যাট মালিকের নাম<br>(ফ্ল্যাট নম্বর ক্রম অনুযায়ী)</th>
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

  /**
   * নির্বাচিত ফ্ল্যাট মালিকদের বকেয়া বিবরণী রিপোর্ট
   * @param {object} data
   * @param {Array<string>} selectedFlatIds
   * @param {string} month
   */
  function buildSelectiveDuesReportHtml(data, selectedFlatIds, month) {
    const s = data.settings;
    const allStatuses = Calc.allStatuses(data, month);
    const selectedSet = new Set(selectedFlatIds);
    const rows = allStatuses.filter((r) => selectedSet.has(r.flat.id));

    let totalOpening = 0;
    let totalCharged = 0;
    let totalPaid = 0;
    let totalDue = 0;

    const bodyRows = rows.map((r, idx) => {
      totalOpening += r.opening;
      totalCharged += r.charged;
      totalPaid += r.paid;
      totalDue += r.due;

      // কোন কোন মাসে বকেয়া রয়েছে তা বের করা
      const ledgerRows = Calc.ledger(data, r.flat, month);
      const unpaidMonths = ledgerRows
        .filter((lr) => lr.month && lr.charge > 0 && lr.paid < lr.charge)
        .map((lr) => lr.label);

      let dueDetails = '—';
      if (r.opening > 0 && unpaidMonths.length) {
        dueDetails = `প্রারম্ভিক বকেয়া + ${unpaidMonths.join(', ')}`;
      } else if (r.opening > 0) {
        dueDetails = 'প্রারম্ভিক বকেয়া';
      } else if (unpaidMonths.length) {
        dueDetails = unpaidMonths.join(', ');
      } else if (r.due === 0 && r.advance > 0) {
        dueDetails = `অগ্রীম জমা (${U.bnNumber(r.advance)}/-)`;
      } else if (r.due === 0) {
        dueDetails = 'পরিশোধিত';
      }

      const eqMonths = r.monthRate > 0 ? Math.round(r.due / r.monthRate) : 0;

      return `<tr>
        <td class="c">${U.bnDigits(idx + 1)}</td>
        <td class="c"><b>${U.escapeHtml(r.flat.flatNo)}</b></td>
        <td class="name">${U.escapeHtml(r.flat.ownerName)}</td>
        <td class="c">${U.escapeHtml(r.flat.phone || '—')}</td>
        <td class="r">${r.opening ? U.bnNumber(r.opening) : '০'}</td>
        <td class="r">${U.bnNumber(r.charged)}</td>
        <td class="r">${U.bnNumber(r.paid)}</td>
        <td class="r"><b>${r.due ? U.bnNumber(r.due) : '০'}</b></td>
        <td class="c">${r.due > 0 ? `${U.bnDigits(eqMonths)} মাস` : '—'}</td>
        <td style="font-size:10px;line-height:1.25">${U.escapeHtml(dueDetails)}</td>
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

    return `<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<title>বকেয়া বিবরণী — ${U.monthLabel(month)}</title>
<style>${REPORT_CSS}</style>
</head>
<body>
<div class="sheet">
  ${getWatermarkHtml()}
  <div class="head">
    <div class="head-logo">
      <img src="${window.LOGO_DATA_URL || 'assets/logo.png'}" alt="Logo">
      <div class="logo-label">NKFMS</div>
    </div>
    <div class="head-center">
      <div class="society">${U.escapeHtml(s.societyName)}</div>
      <div class="committee">${U.escapeHtml(s.committeeName)}</div>
      <div class="title">ফ্ল্যাট মালিকদের বকেয়া সার্ভিস চার্জ বিবরণী (${U.monthLabel(month)} পর্যন্ত)</div>
    </div>
    <div class="head-date">
      তারিখ: ${U.monthEndDateLabel(month)}<br>
      <span style="font-size:9.5px;font-weight:normal">নির্বাচিত: ${U.bnDigits(rows.length)} টি</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:5%">ক্রম</th>
        <th style="width:8%">ফ্ল্যাট</th>
        <th style="width:19%">মালিকের নাম</th>
        <th style="width:11%">মোবাইল</th>
        <th style="width:10%">প্রারম্ভিক<br>বকেয়া</th>
        <th style="width:10%">ধার্যকৃত<br>চার্জ</th>
        <th style="width:10%">মোট<br>জমা</th>
        <th style="width:11%">বর্তমান<br>বকেয়া</th>
        <th style="width:6%">সমতুল্য</th>
        <th style="width:10%">বকেয়া মাসসমূহ / স্থিতি</th>
      </tr>
    </thead>
    <tbody>
${bodyRows.length ? bodyRows : '<tr><td colspan="10" class="c">কোনো ফ্ল্যাট নির্বাচন করা হয়নি।</td></tr>'}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4" class="r">সর্বমোট</td>
        <td class="r">${U.bnNumber(totalOpening)}</td>
        <td class="r">${U.bnNumber(totalCharged)}</td>
        <td class="r">${U.bnNumber(totalPaid)}</td>
        <td class="r">${U.bnNumber(totalDue)}</td>
        <td colspan="2"></td>
      </tr>
    </tfoot>
  </table>

  <div class="totals">
    <div class="box">নির্বাচিত ফ্ল্যাট সংখ্যা <b>${U.bnDigits(rows.length)} টি</b></div>
    <div class="box">মোট প্রারম্ভিক বকেয়া <b>${U.bnNumber(totalOpening)}/-</b></div>
    <div class="box">মোট আদায়কৃত টাকা <b>${U.bnNumber(totalPaid)}/-</b></div>
    <div class="box" style="border: 2px solid #000">সর্বমোট বকেয়া পাওনা <b style="color:#b91c1c">${U.bnNumber(totalDue)}/-</b></div>
  </div>

  <div class="note">বিশেষ দ্রষ্টব্য: কোনো এন্ট্রিতে অসঙ্গতি পরিলক্ষিত হলে অনতিবিলম্বে সার্ভিস চার্জ ব্যবস্থাপনা কমিটির সাথে যোগাযোগের জন্য অনুরোধ করা হলো।</div>

  <div class="signs">
${signs}
  </div>

  <div class="foot">নীলকণ্ঠ ফ্ল্যাট মালিক সমিতি — সার্ভিস চার্জ ব্যবস্থাপনা সফটওয়্যার দ্বারা প্রস্তুত</div>
</div>
</body>
</html>`;
  }

  /**
   * একক ফ্ল্যাটের মাসভিত্তিক লেজার / বকেয়া স্টেটমেন্ট
   */
  function buildLedgerHtml(data, flat, month) {
    const s = data.settings;
    const rows = Calc.ledger(data, flat, month);
    const status = Calc.flatStatus(data, flat, month);

    const unpaidMonths = rows
      .filter((r) => r.month && r.charge > 0 && r.paid < r.charge)
      .map((r) => r.label);

    const body = rows.map((r) => {
      const isUnpaid = r.month && r.charge > 0 && r.paid < r.charge;
      const statusBadge = isUnpaid ? '<span class="unpaid-tag">বকেয়া</span>' : (r.paid >= r.charge && r.charge > 0 ? '<span class="paid-tag">জমা</span>' : '');

      return `<tr>
        <td class="name">${U.escapeHtml(r.label)} ${statusBadge}</td>
        <td class="r">${r.charge ? U.bnNumber(r.charge) : '-'}</td>
        <td class="r">${r.paid ? U.bnNumber(r.paid) : '-'}</td>
        <td class="sig">${U.escapeHtml(r.collectorIds.map((id) => collectorName(s, id)).filter(Boolean).join(', ') || '-')}</td>
        <td class="r"><b>${U.bnNumber(r.balance)}</b></td>
      </tr>`;
    }).join('\n');

    return `<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<title>${U.escapeHtml(flat.flatNo)} — লেজার স্টেটমেন্ট</title>
<style>${REPORT_CSS}</style>
</head>
<body>
<div class="sheet">
  ${getWatermarkHtml()}
  <div class="head">
    <div class="head-logo">
      <img src="${window.LOGO_DATA_URL || 'assets/logo.png'}" alt="Logo">
      <div class="logo-label">NKFMS</div>
    </div>
    <div class="head-center">
      <div class="society">${U.escapeHtml(s.societyName)}</div>
      <div class="committee">${U.escapeHtml(s.committeeName)}</div>
      <div class="title">ফ্ল্যাটভিত্তিক সার্ভিস চার্জ লেজার ও বকেয়া বিবরণী</div>
    </div>
    <div class="head-date">
      তারিখ: ${U.monthEndDateLabel(month)}<br>
      <span style="font-size:10.5px">ফ্ল্যাট: <b>${U.escapeHtml(flat.flatNo)}</b></span>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:34%">মাস / বিবরণ</th>
        <th style="width:16%">ধার্য চার্জ</th>
        <th style="width:16%">জমা</th>
        <th style="width:18%">আদায়কারী</th>
        <th style="width:16%">জের (টাকা)</th>
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
    <div class="box">মোট প্রারম্ভিক বকেয়া <b>${U.bnNumber(status.opening)}/-</b></div>
    <div class="box">মোট পরিশোধিত <b>${U.bnNumber(status.paid)}/-</b></div>
    <div class="box" style="border: 1.5px solid #000">বর্তমান বকেয়া পাওনা <b style="color:#b91c1c">${U.bnNumber(status.due)}/-</b></div>
    ${status.advance > 0 ? `<div class="box">অগ্রীম জমা <b>${U.bnNumber(status.advance)}/-</b></div>` : ''}
  </div>

  ${unpaidMonths.length ? `
  <div style="margin-top:10px;padding:6px 10px;border:1px solid #e5e7eb;background:rgba(254,242,242,0.6);border-radius:4px;font-size:11px">
    <b>বকেয়াকৃত মাসসমূহ:</b> ${unpaidMonths.join(', ')}
  </div>` : ''}

  <div class="signs">
    ${(s.signatories || []).slice(0, 3).map((sig) => `
      <div class="s">
        <div class="line"></div>
        <div class="sd">স্বাক্ষরিত/-</div>
        <div class="nm">${U.escapeHtml(sig.name)}</div>
        <div class="dg">${U.escapeHtml(sig.designation)}</div>
      </div>`).join('\n')}
  </div>
</div>
</body>
</html>`;
  }

  /**
   * টাকা আদায়ের রসিদ
   */
  function buildReceiptHtml(data, flat, payment) {
    const s = data.settings;
    const status = Calc.flatStatus(data, flat, payment.month);
    return `<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<title>রসিদ — ${U.escapeHtml(flat.flatNo)}</title>
<style>${REPORT_CSS}
  .rcpt { border: 2px solid #000; padding: 12px 16px; max-width: 165mm; margin: 0 auto; background: rgba(255,255,255,0.9); }
  .rcpt .line2 { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
  .amt { font-size: 20px; font-weight: 700; text-align: center; margin: 12px 0; border: 1px dashed #000; padding: 8px; }
  .rsign { display: flex; justify-content: space-between; margin-top: 40px; font-size: 11px; }
  .rsign div { text-align: center; border-top: 1px solid #000; padding-top: 3px; width: 40%; }
</style>
</head>
<body>
${getWatermarkHtml()}
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

  window.Report = {
    buildReportHtml,
    buildSelectiveDuesReportHtml,
    buildLedgerHtml,
    buildReceiptHtml,
    collectorName
  };
}());
