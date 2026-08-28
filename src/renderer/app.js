'use strict';

(function () {
  const U = window.U;
  const Calc = window.Calc;
  const Report = window.Report;
  const api = window.api;

  const state = {
    data: null,
    paths: null,
    month: null,
    tab: 'dashboard',
    duesOnlyUnpaid: false,
    duesSort: 'serial',
    monthlyOnlyUnpaid: false,
    reportNextColumn: true
  };

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------- সহায়ক ---------- */

  let toastTimer = null;
  function toast(message, isError) {
    const node = $('#toast');
    node.textContent = message;
    node.classList.toggle('err', !!isError);
    node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('show'), 2600);
  }

  async function persist(message) {
    try {
      await api.save(state.data);
      if (message) toast(message);
    } catch (err) {
      toast('সংরক্ষণ ব্যর্থ: ' + err.message, true);
    }
  }

  function uid(prefix) {
    return prefix + '-' + Math.random().toString(36).slice(2, 9);
  }

  function collectorOptions(selectedId) {
    const list = state.data.settings.collectors || [];
    return ['<option value="">— নির্বাচন করুন —</option>']
      .concat(list.map((c) => `<option value="${c.id}"${c.id === selectedId ? ' selected' : ''}>${U.escapeHtml(c.bn)}</option>`))
      .join('');
  }

  function collectorLabel(id) {
    const c = (state.data.settings.collectors || []).find((x) => x.id === id);
    return c ? c.bn : '';
  }

  function sortedFlats() {
    return state.data.flats.slice().sort((a, b) => (a.serial || 0) - (b.serial || 0));
  }

  function flatById(id) {
    return state.data.flats.find((f) => f.id === id);
  }

  /* ---------- পেমেন্ট মিউটেশন ---------- */

  function getPayment(flatId, month) {
    return state.data.payments.find((p) => p.flatId === flatId && p.month === month) || null;
  }

  function setPayment(flatId, month, patch) {
    const existing = getPayment(flatId, month);
    const amount = patch.amount != null ? Number(patch.amount) || 0 : (existing ? existing.amount : 0);

    if (amount <= 0) {
      if (existing) {
        state.data.payments = state.data.payments.filter((p) => p !== existing);
      }
      return null;
    }

    if (existing) {
      Object.assign(existing, patch, { amount });
      return existing;
    }

    const created = {
      id: uid('p'),
      flatId,
      month,
      amount,
      collectorId: patch.collectorId || '',
      receivedOn: patch.receivedOn || U.monthEndIso(month),
      note: patch.note || ''
    };
    state.data.payments.push(created);
    return created;
  }

  /** ঠিক এই মাসে এই ফ্ল্যাটের উপর কত চার্জ ধরা হয়েছে (যোগদান/বন্ধ ও হার-পরিবর্তন হিসাবে ধরে) */
  function chargeInMonth(flat, month) {
    const s = state.data.settings;
    return Calc.chargeUpTo(flat, s, month) - Calc.chargeUpTo(flat, s, U.addMonths(month, -1));
  }

  /* ---------- মাস তালিকা ---------- */

  function availableMonths() {
    const start = state.data.settings.startMonth;
    const paymentMonths = state.data.payments.map((p) => U.monthIndex(p.month));
    const maxSeen = Math.max(
      U.monthIndex(start),
      U.monthIndex(U.currentMonth()),
      paymentMonths.length ? Math.max.apply(null, paymentMonths) : 0
    );
    const months = [];
    for (let i = U.monthIndex(start); i <= maxSeen + 12; i += 1) {
      months.push(U.indexToMonth(i));
    }
    return months;
  }

  function defaultMonth() {
    const months = availableMonths();
    const now = U.currentMonth();
    return months.includes(now) ? now : months[months.length - 1];
  }

  /* ---------- শেল রেন্ডার ---------- */

  const TAB_META = {
    dashboard: { title: 'ড্যাশবোর্ড', sub: 'সমিতির সার্বিক আর্থিক চিত্র' },
    monthly: { title: 'মাসিক হিসাব', sub: 'মাস ও সাল বেছে নিয়ে ঐ মাসের সব জমা ও বকেয়ার তালিকা' },
    collection: { title: 'মাসিক আদায় এন্ট্রি', sub: 'প্রতি ফ্ল্যাটের জমা ও আদায়কারীর তথ্য লিখুন' },
    dues: { title: 'বকেয়া তালিকা', sub: 'ফ্ল্যাটভিত্তিক বকেয়ার পূর্ণ হিসাব' },
    flats: { title: 'ফ্ল্যাট ও মালিক', sub: 'মালিকের নাম, ফ্ল্যাট নম্বর ও প্রারম্ভিক বকেয়া' },
    report: { title: 'রিপোর্ট', sub: 'মাসিক সারসংক্ষেপ প্রিন্ট বা PDF হিসেবে সংরক্ষণ' },
    settings: { title: 'সেটিংস', sub: 'হার, আদায়কারী, স্বাক্ষরকারী ও ডেটা ব্যাকআপ' }
  };

  function renderShell() {
    $('#brandTitle').textContent = state.data.settings.societyName;
    $('#rateChip').textContent = U.bnNumber(Calc.rateForMonth(state.data.settings, state.month)) + '/-';

    const meta = TAB_META[state.tab];
    $('#pageTitle').textContent = meta.title;
    $('#pageSub').textContent = meta.sub;

    $$('#nav .nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === state.tab);
    });

    renderMonthPicker();
    $('#monthPicker').style.visibility =
      state.tab === 'settings' || state.tab === 'flats' ? 'hidden' : 'visible';
  }

  /** উপরের ডানদিকের "মাসের নাম" ও "সাল" — দুটি আলাদা ঘর */
  function renderMonthPicker() {
    const months = availableMonths();
    const [curYear, curMonthNo] = state.month.split('-').map(Number);

    const years = Array.from(new Set(months.map((m) => Number(m.split('-')[0])))).sort((a, b) => a - b);
    $('#monthYear').innerHTML = years
      .map((y) => `<option value="${y}"${y === curYear ? ' selected' : ''}>${U.bnDigits(y)}</option>`)
      .join('');

    $('#monthName').innerHTML = monthsInYear(curYear)
      .map((m) => {
        const no = Number(m.split('-')[1]);
        return `<option value="${m}"${no === curMonthNo ? ' selected' : ''}>${U.BN_MONTHS[no - 1]}</option>`;
      })
      .join('');
  }

  function monthsInYear(year) {
    return availableMonths().filter((m) => Number(m.split('-')[0]) === year);
  }

  /** সাল বদলালে একই মাস ধরে রাখা হয়; ঐ সালে মাসটি না থাকলে কাছের মাসে যাওয়া হয় */
  function monthInYear(year, monthNo) {
    const list = monthsInYear(year);
    if (!list.length) return state.month;
    const want = `${year}-${String(monthNo).padStart(2, '0')}`;
    if (list.includes(want)) return want;
    return U.monthIndex(want) < U.monthIndex(list[0]) ? list[0] : list[list.length - 1];
  }

  function render() {
    renderShell();
    const content = $('#content');
    switch (state.tab) {
      case 'dashboard': content.innerHTML = viewDashboard(); break;
      case 'monthly': content.innerHTML = viewMonthly(); break;
      case 'collection': content.innerHTML = viewCollection(); break;
      case 'dues': content.innerHTML = viewDues(); break;
      case 'flats': content.innerHTML = viewFlats(); break;
      case 'report': content.innerHTML = viewReport(); break;
      case 'settings': content.innerHTML = viewSettings(); break;
    }
    if (state.tab === 'report') refreshPreview();
  }

  /* ---------- ১. ড্যাশবোর্ড ---------- */

  function viewDashboard() {
    const { rows, totals } = Calc.summary(state.data, state.month);
    const rate = Calc.rateForMonth(state.data.settings, state.month);
    const expectedThisMonth = rows.length * rate;
    const collectRate = expectedThisMonth ? Math.round((totals.monthCollected / expectedThisMonth) * 100) : 0;

    const breakdown = Calc.collectorBreakdown(state.data, state.month);
    const topDue = rows.filter((r) => r.due > 0).sort((a, b) => b.due - a.due).slice(0, 8);

    const trend = [];
    for (let i = 5; i >= 0; i -= 1) {
      const m = U.addMonths(state.month, -i);
      if (U.monthIndex(m) < U.monthIndex(state.data.settings.startMonth)) continue;
      const amount = state.data.payments
        .filter((p) => p.month === m)
        .reduce((s, p) => s + (Number(p.amount) || 0), 0);
      trend.push({ month: m, amount });
    }
    const trendMax = Math.max(1, ...trend.map((t) => t.amount));

    return `
      <div class="stats">
        <div class="stat ok">
          <div class="label">${U.monthLabel(state.month)} মাসে আদায়</div>
          <div class="value">${U.bnTaka(totals.monthCollected)}</div>
          <div class="sub">${U.bnDigits(totals.paidThisMonth)}/${U.bnDigits(totals.flatCount)} ফ্ল্যাট জমা দিয়েছে (${U.bnDigits(collectRate)}%)</div>
        </div>
        <div class="stat due">
          <div class="label">মোট বকেয়া (${U.monthLabel(state.month)} পর্যন্ত)</div>
          <div class="value">${U.bnTaka(totals.totalDue)}</div>
          <div class="sub">${U.bnDigits(totals.defaulters)} টি ফ্ল্যাটে বকেয়া রয়েছে</div>
        </div>
        <div class="stat accent">
          <div class="label">মোট অগ্রীম জমা</div>
          <div class="value">${U.bnTaka(totals.totalAdvance)}</div>
          <div class="sub">অগ্রীম প্রদানকারীর সংখ্যা ${U.bnDigits(rows.filter((r) => r.advance > 0).length)}</div>
        </div>
        <div class="stat">
          <div class="label">এ মাসে প্রাপ্য</div>
          <div class="value">${U.bnTaka(expectedThisMonth)}</div>
          <div class="sub">${U.bnDigits(rows.length)} ফ্ল্যাট × ${U.bnNumber(rate)}/-</div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <h2>আদায়কারী অনুযায়ী ${U.monthLabel(state.month)} মাসের আদায়</h2>
            <p class="hint">কার মাধ্যমে কত টাকা জমা হয়েছে</p>
          </div>
        </div>
        <div class="card-body flush">
          ${breakdown.length ? `
          <table class="grid">
            <thead>
              <tr><th>আদায়কারী</th><th class="num">ফ্ল্যাট সংখ্যা</th><th class="num">আদায়কৃত টাকা</th><th style="width:32%">অংশ</th></tr>
            </thead>
            <tbody>
              ${breakdown.map((b) => `
                <tr>
                  <td>${U.escapeHtml(collectorLabel(b.collectorId) || 'আদায়কারী উল্লেখ নেই')}</td>
                  <td class="num">${U.bnDigits(b.count)}</td>
                  <td class="num strong">${U.bnTaka(b.amount)}</td>
                  <td><div class="bar"><span style="width:${totals.monthCollected ? (b.amount / totals.monthCollected) * 100 : 0}%"></span></div></td>
                </tr>`).join('')}
            </tbody>
            <tfoot>
              <tr><td>সর্বমোট</td><td class="num">${U.bnDigits(breakdown.reduce((s, b) => s + b.count, 0))}</td><td class="num">${U.bnTaka(totals.monthCollected)}</td><td></td></tr>
            </tfoot>
          </table>` : '<div class="empty">এ মাসে এখনো কোনো জমা লেখা হয়নি।</div>'}
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div><h2>সর্বোচ্চ বকেয়া</h2><p class="hint">যাদের কাছে সবচেয়ে বেশি পাওনা</p></div>
          <button class="btn sm" data-goto="dues">সম্পূর্ণ তালিকা</button>
        </div>
        <div class="card-body flush">
          ${topDue.length ? `
          <table class="grid">
            <thead><tr><th>ফ্ল্যাট</th><th>মালিকের নাম</th><th class="num">বকেয়া</th><th class="num">সমতুল্য মাস</th></tr></thead>
            <tbody>
              ${topDue.map((r) => `
                <tr class="due-row">
                  <td><span class="pill flat">${U.escapeHtml(r.flat.flatNo)}</span></td>
                  <td>${U.escapeHtml(r.flat.ownerName)}</td>
                  <td class="num strong">${U.bnTaka(r.due)}</td>
                  <td class="num muted">${U.bnDigits(Math.round(r.due / (r.monthRate || 1)))} মাস</td>
                </tr>`).join('')}
            </tbody>
          </table>` : '<div class="empty">কোনো বকেয়া নেই — সবাই পরিশোধ করেছেন।</div>'}
        </div>
      </div>

      <div class="card">
        <div class="card-head"><div><h2>সাম্প্রতিক মাসগুলোর আদায়</h2></div></div>
        <div class="card-body flush">
          <table class="grid">
            <thead><tr><th>মাস</th><th class="num">আদায়</th><th style="width:45%">তুলনা</th></tr></thead>
            <tbody>
              ${trend.map((t) => `
                <tr>
                  <td>${U.monthLabel(t.month)}</td>
                  <td class="num strong">${U.bnTaka(t.amount)}</td>
                  <td><div class="bar"><span style="width:${(t.amount / trendMax) * 100}%"></span></div></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  /* ---------- ২. মাসিক হিসাব ---------- */

  function viewMonthly() {
    const rows = Calc.allStatuses(state.data, state.month);
    const rate = Calc.rateForMonth(state.data.settings, state.month);

    const paidRows = rows.filter((r) => r.monthPaid > 0);
    const collected = paidRows.reduce((sum, r) => sum + r.monthPaid, 0);
    const expected = rows.reduce((sum, r) => sum + chargeInMonth(r.flat, state.month), 0);
    const skipped = rows.filter((r) => r.monthPaid <= 0).length;

    let dueRows = rows.filter((r) => r.due > 0);
    if (state.monthlyOnlyUnpaid) dueRows = dueRows.filter((r) => r.monthPaid <= 0);
    const totalDue = dueRows.reduce((sum, r) => sum + r.due, 0);

    const months = availableMonths();
    const at = months.indexOf(state.month);
    const hasPrev = at > 0;
    const hasNext = at >= 0 && at < months.length - 1;

    return `
      <div class="card month-head">
        <div class="card-body">
          <div class="month-bar">
            <button class="btn sm" data-month-step="-1"${hasPrev ? '' : ' disabled'}>‹ আগের মাস</button>
            <div class="month-now">
              <div class="month-now-title">${U.monthLabel(state.month)}</div>
              <div class="hint">মাসিক চার্জ ${U.bnNumber(rate)}/- · ${U.bnDigits(rows.length)} টি ফ্ল্যাট</div>
            </div>
            <button class="btn sm" data-month-step="1"${hasNext ? '' : ' disabled'}>পরের মাস ›</button>
            <div class="grow"></div>
            <button class="btn sm" data-goto="collection">এ মাসের এন্ট্রি করুন</button>
            <button class="btn sm" data-goto="report">রিপোর্ট / প্রিন্ট</button>
          </div>
        </div>
      </div>

      <div class="stats">
        <div class="stat ok">
          <div class="label">এ মাসে আদায়</div>
          <div class="value">${U.bnTaka(collected)}</div>
          <div class="sub">${U.bnDigits(paidRows.length)} টি ফ্ল্যাট জমা দিয়েছে</div>
        </div>
        <div class="stat due">
          <div class="label">এ মাসে জমা দেননি</div>
          <div class="value">${U.bnDigits(skipped)} টি ফ্ল্যাট</div>
          <div class="sub">অনাদায়ী ${U.bnTaka(Math.max(0, expected - collected))}</div>
        </div>
        <div class="stat">
          <div class="label">এ মাসে প্রাপ্য</div>
          <div class="value">${U.bnTaka(expected)}</div>
          <div class="sub">এ মাসে ধার্যকৃত মোট চার্জ</div>
        </div>
        <div class="stat accent">
          <div class="label">মোট বকেয়া (${U.monthLabel(state.month)} পর্যন্ত)</div>
          <div class="value">${U.bnTaka(rows.reduce((sum, r) => sum + r.due, 0))}</div>
          <div class="sub">${U.bnDigits(rows.filter((r) => r.due > 0).length)} টি ফ্ল্যাটে বকেয়া রয়েছে</div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <h2>${U.monthLabel(state.month)} মাসের জমার তালিকা</h2>
            <p class="hint">এ মাসে যাঁরা টাকা জমা দিয়েছেন</p>
          </div>
        </div>
        <div class="card-body flush">
          ${paidRows.length ? `
          <div class="table-wrap">
            <table class="grid">
              <thead>
                <tr>
                  <th style="width:52px">ক্রম</th>
                  <th style="width:78px">ফ্ল্যাট</th>
                  <th>মালিকের নাম</th>
                  <th class="num" style="width:130px">এ মাসে জমা</th>
                  <th style="width:200px">আদায়কারী</th>
                  <th style="width:150px">জমার তারিখ</th>
                </tr>
              </thead>
              <tbody>
                ${paidRows.map((r) => `
                  <tr class="paid-row">
                    <td class="c muted">${U.bnDigits(r.flat.serial)}</td>
                    <td><span class="pill flat">${U.escapeHtml(r.flat.flatNo)}</span></td>
                    <td>${U.escapeHtml(r.flat.ownerName)}</td>
                    <td class="num strong">${U.bnTaka(r.monthPaid)}</td>
                    <td>${U.escapeHtml(r.monthPayments.map((p) => collectorLabel(p.collectorId)).filter(Boolean).join(', ') || '—')}</td>
                    <td class="muted">${U.dateLabel(r.monthPayments[0] && r.monthPayments[0].receivedOn) || '—'}</td>
                  </tr>`).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="num">এ মাসে মোট আদায়</td>
                  <td class="num">${U.bnTaka(collected)}</td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>` : '<div class="empty">এ মাসে এখনো কোনো জমা লেখা হয়নি।</div>'}
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <h2>${U.monthLabel(state.month)} পর্যন্ত বকেয়ার তালিকা</h2>
            <p class="hint">এ মাস শেষে যাঁদের কাছে টাকা পাওনা রয়েছে</p>
          </div>
          <label class="row" style="gap:5px;font-size:12.5px">
            <input type="checkbox" id="monthlyOnlyUnpaid" ${state.monthlyOnlyUnpaid ? 'checked' : ''}>
            শুধু এ মাসে যাঁরা দেননি
          </label>
        </div>
        <div class="card-body flush">
          ${dueRows.length ? `
          <div class="table-wrap">
            <table class="grid">
              <thead>
                <tr>
                  <th style="width:52px">ক্রম</th>
                  <th style="width:78px">ফ্ল্যাট</th>
                  <th>মালিকের নাম</th>
                  <th class="num" style="width:120px">এ মাসের চার্জ</th>
                  <th class="num" style="width:130px">এ মাসে জমা</th>
                  <th class="num" style="width:130px">মোট বকেয়া</th>
                  <th class="num" style="width:110px">সমতুল্য মাস</th>
                  <th class="c" style="width:130px">বিস্তারিত</th>
                </tr>
              </thead>
              <tbody>
                ${dueRows.map((r) => `
                  <tr class="due-row">
                    <td class="c muted">${U.bnDigits(r.flat.serial)}</td>
                    <td><span class="pill flat">${U.escapeHtml(r.flat.flatNo)}</span></td>
                    <td>${U.escapeHtml(r.flat.ownerName)}</td>
                    <td class="num muted">${U.bnNumber(chargeInMonth(r.flat, state.month))}</td>
                    <td class="num">${r.monthPaid > 0 ? U.bnNumber(r.monthPaid) : '<span class="pill due">দেননি</span>'}</td>
                    <td class="num strong">${U.bnTaka(r.due)}</td>
                    <td class="num muted">${U.bnDigits(Math.round(r.due / (r.monthRate || 1)))} মাস</td>
                    <td class="c"><button class="btn sm" data-ledger="${r.flat.id}">লেজার দেখুন</button></td>
                  </tr>`).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="5" class="num">সর্বমোট বকেয়া</td>
                  <td class="num">${U.bnTaka(totalDue)}</td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>` : `<div class="empty">${state.monthlyOnlyUnpaid ? 'এ মাসে সবাই জমা দিয়েছেন — বকেয়া নেই।' : 'কোনো বকেয়া নেই — সবাই পরিশোধ করেছেন।'}</div>`}
        </div>
      </div>`;
  }

  /* ---------- ২. মাসিক আদায় এন্ট্রি ---------- */

  function viewCollection() {
    const rate = Calc.rateForMonth(state.data.settings, state.month);
    const rows = Calc.allStatuses(state.data, state.month);
    const collected = rows.reduce((s, r) => s + r.monthPaid, 0);
    const entered = rows.filter((r) => r.monthPaid > 0).length;

    const body = rows.map((r) => {
      const payment = getPayment(r.flat.id, state.month);
      // এ মাসের জমা বাদ দিয়ে আগের বকেয়া
      const previousDue = r.opening + r.charged - r.monthRate - (r.paid - r.monthPaid);
      return `
        <tr data-flat="${r.flat.id}" class="${payment ? 'entered' : ''}">
          <td class="c muted">${U.bnDigits(r.flat.serial)}</td>
          <td><span class="pill flat">${U.escapeHtml(r.flat.flatNo)}</span></td>
          <td>${U.escapeHtml(r.flat.ownerName)}</td>
          <td class="num ${previousDue > 0 ? 'strong' : 'muted'}">${previousDue > 0 ? U.bnNumber(previousDue) : (previousDue < 0 ? 'অগ্রীম ' + U.bnNumber(-previousDue) : '—')}</td>
          <td class="entry">
            <input type="number" min="0" step="100" data-field="amount" value="${payment ? payment.amount : ''}" placeholder="${U.bnNumber(rate)}">
          </td>
          <td class="entry"><select data-field="collectorId">${collectorOptions(payment ? payment.collectorId : '')}</select></td>
          <td class="entry"><input type="date" data-field="receivedOn" value="${payment ? payment.receivedOn : ''}"></td>
          <td class="num">${r.due > 0 ? `<span class="pill due">${U.bnNumber(r.due)}</span>` : (r.advance > 0 ? `<span class="pill warn">অগ্রীম ${U.bnNumber(r.advance)}</span>` : '<span class="pill ok">নেই</span>')}</td>
          <td class="c">
            <div class="quick">
              <button data-quick="${rate}">${U.bnNumber(rate)}</button>
              <button data-quick="${rate * 2}">×২</button>
              <button data-quick="${rate * 3}">×৩</button>
              <button data-quick="0" title="জমা মুছে ফেলুন">✕</button>
              ${payment ? '<button data-receipt="1" title="রসিদ ছাপুন">🧾</button>' : ''}
            </div>
          </td>
        </tr>`;
    }).join('');

    return `
      <div class="card">
        <div class="card-head">
          <div>
            <h2>${U.monthLabel(state.month)} মাসের জমা</h2>
            <p class="hint">প্রতি ফ্ল্যাটের মাসিক চার্জ ${U.bnNumber(rate)}/- । টাকার ঘর খালি রাখলে ঐ মাসের জমা হয়নি ধরা হবে এবং তা বকেয়ায় যোগ হবে।</p>
          </div>
          <div class="row">
            <button class="btn sm" id="bulkFill">খালি ঘরে ${U.bnNumber(rate)}/- বসান</button>
            <button class="btn sm" id="bulkCollector">সবার আদায়কারী নির্ধারণ</button>
          </div>
        </div>
        <div class="card-body flush">
          <div class="table-wrap">
            <table class="grid" id="collectionTable">
              <thead>
                <tr>
                  <th style="width:52px">ক্রম</th>
                  <th style="width:78px">ফ্ল্যাট</th>
                  <th>মালিকের নাম</th>
                  <th class="num" style="width:120px">পূর্বের বকেয়া</th>
                  <th style="width:130px">এ মাসে জমা</th>
                  <th style="width:190px">আদায়কারী</th>
                  <th style="width:150px">জমার তারিখ</th>
                  <th class="num" style="width:130px">হালনাগাদ বকেয়া</th>
                  <th class="c" style="width:190px">দ্রুত</th>
                </tr>
              </thead>
              <tbody>${body}</tbody>
              <tfoot>
                <tr>
                  <td colspan="4" class="num">এ মাসে মোট আদায়</td>
                  <td class="num strong">${U.bnTaka(collected)}</td>
                  <td colspan="2" class="muted">${U.bnDigits(entered)} টি ফ্ল্যাট জমা দিয়েছে</td>
                  <td class="num">${U.bnTaka(rows.reduce((s, r) => s + r.due, 0))}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>`;
  }

  /* ---------- ৩. বকেয়া তালিকা ---------- */

  function viewDues() {
    let rows = Calc.allStatuses(state.data, state.month);
    if (state.duesOnlyUnpaid) rows = rows.filter((r) => r.due > 0);
    if (state.duesSort === 'due') rows = rows.slice().sort((a, b) => b.due - a.due);

    const totalDue = rows.reduce((s, r) => s + r.due, 0);

    return `
      <div class="card">
        <div class="card-head">
          <div>
            <h2>${U.monthLabel(state.month)} পর্যন্ত বকেয়ার হিসাব</h2>
            <p class="hint">প্রারম্ভিক বকেয়া + ধার্যকৃত মাসিক চার্জ − মোট জমা = বকেয়া</p>
          </div>
          <div class="row">
            <label class="row" style="gap:5px;font-size:12.5px">
              <input type="checkbox" id="onlyUnpaid" ${state.duesOnlyUnpaid ? 'checked' : ''}> শুধু বকেয়াদার
            </label>
            <select id="duesSort">
              <option value="serial"${state.duesSort === 'serial' ? ' selected' : ''}>ফ্ল্যাট ক্রম</option>
              <option value="due"${state.duesSort === 'due' ? ' selected' : ''}>বকেয়া (বেশি আগে)</option>
            </select>
          </div>
        </div>
        <div class="card-body flush">
          <div class="table-wrap">
            <table class="grid">
              <thead>
                <tr>
                  <th style="width:52px">ক্রম</th>
                  <th style="width:78px">ফ্ল্যাট</th>
                  <th>মালিকের নাম</th>
                  <th class="num">প্রারম্ভিক বকেয়া</th>
                  <th class="num">ধার্যকৃত চার্জ</th>
                  <th class="num">মোট জমা</th>
                  <th class="num" style="width:130px">এ মাসের জমা</th>
                  <th class="num">বর্তমান অবস্থা</th>
                  <th class="c" style="width:150px">বিস্তারিত</th>
                </tr>
              </thead>
              <tbody>
                ${rows.length ? rows.map((r) => `
                  <tr class="${r.due > 0 ? 'due-row' : 'paid-row'}">
                    <td class="c muted">${U.bnDigits(r.flat.serial)}</td>
                    <td><span class="pill flat">${U.escapeHtml(r.flat.flatNo)}</span></td>
                    <td>${U.escapeHtml(r.flat.ownerName)}</td>
                    <td class="num muted">${U.bnNumber(r.opening)}</td>
                    <td class="num muted">${U.bnNumber(r.charged)}</td>
                    <td class="num">${U.bnNumber(r.paid)}</td>
                    <td class="num">${r.monthPaid > 0 ? U.bnNumber(r.monthPaid) : '<span class="pill due">দেননি</span>'}</td>
                    <td class="num">${r.due > 0 ? `<span class="pill due">বকেয়া ${U.bnNumber(r.due)}</span>` : (r.advance > 0 ? `<span class="pill warn">অগ্রীম ${U.bnNumber(r.advance)}</span>` : '<span class="pill ok">পরিশোধিত</span>')}</td>
                    <td class="c"><button class="btn sm" data-ledger="${r.flat.id}">লেজার দেখুন</button></td>
                  </tr>`).join('') : '<tr><td colspan="9"><div class="empty">কোনো তথ্য নেই।</div></td></tr>'}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="7" class="num">সর্বমোট বকেয়া</td>
                  <td class="num">${U.bnTaka(totalDue)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>`;
  }

  /* ---------- ৪. ফ্ল্যাট ও মালিক ---------- */

  function viewFlats() {
    const flats = sortedFlats();
    return `
      <div class="card">
        <div class="card-head">
          <div>
            <h2>ফ্ল্যাট ও মালিকের তালিকা</h2>
            <p class="hint">মোট ${U.bnDigits(flats.length)} টি ফ্ল্যাট। প্রারম্ভিক বকেয়া বলতে ${U.monthLabel(state.data.settings.startMonth)}-এর আগ পর্যন্ত জমে থাকা বকেয়া বোঝায়।</p>
          </div>
          <button class="btn primary sm" id="addFlat">+ নতুন ফ্ল্যাট</button>
        </div>
        <div class="card-body flush">
          <div class="table-wrap">
            <table class="grid">
              <thead>
                <tr>
                  <th style="width:52px">ক্রম</th>
                  <th style="width:80px">ফ্ল্যাট</th>
                  <th>মালিকের নাম</th>
                  <th style="width:130px">মোবাইল</th>
                  <th class="num" style="width:120px">প্রারম্ভিক বকেয়া</th>
                  <th style="width:100px">অবস্থা</th>
                  <th class="c" style="width:150px">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody>
                ${flats.map((f) => `
                  <tr>
                    <td class="c muted">${U.bnDigits(f.serial)}</td>
                    <td><span class="pill flat">${U.escapeHtml(f.flatNo)}</span></td>
                    <td>${U.escapeHtml(f.ownerName)}${f.note ? ` <span class="muted">(${U.escapeHtml(f.note)})</span>` : ''}</td>
                    <td class="muted">${U.escapeHtml(f.phone || '—')}</td>
                    <td class="num">${U.bnNumber(f.openingDue || 0)}</td>
                    <td>${f.active === false ? '<span class="pill warn">নিষ্ক্রিয়</span>' : '<span class="pill ok">সক্রিয়</span>'}</td>
                    <td class="c">
                      <button class="btn sm" data-edit-flat="${f.id}">সম্পাদনা</button>
                      <button class="btn sm danger" data-del-flat="${f.id}">মুছুন</button>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  }

  /* ---------- ৫. রিপোর্ট ---------- */

  function viewReport() {
    return `
      <div class="card">
        <div class="card-head">
          <div>
            <h2>${U.monthLabel(state.month)} মাসের সারসংক্ষেপ</h2>
            <p class="hint">মূল কাগজের ছক অনুযায়ী তৈরি। পরের মাসের জন্য একটি খালি ঘর রাখা যায়, যাতে হাতে লিখে আদায় করা যায়।</p>
          </div>
          <div class="row">
            <label class="row" style="gap:5px;font-size:12.5px">
              <input type="checkbox" id="nextCol" ${state.reportNextColumn ? 'checked' : ''}>
              পরের মাসের খালি ঘর রাখুন
            </label>
            <button class="btn" id="printReport">🖨 প্রিন্ট</button>
            <button class="btn primary" id="pdfReport">PDF সংরক্ষণ</button>
          </div>
        </div>
        <div class="card-body">
          <iframe id="preview" style="width:100%;height:calc(100vh - 260px);border:1px solid var(--line);border-radius:8px;background:#fff"></iframe>
        </div>
      </div>`;
  }

  function refreshPreview() {
    const frame = $('#preview');
    if (!frame) return;
    frame.srcdoc = Report.buildReportHtml(state.data, state.month, { nextMonthColumn: state.reportNextColumn });
  }

  /* ---------- ৬. সেটিংস ---------- */

  function viewSettings() {
    const s = state.data.settings;
    const history = (s.rateHistory || []).slice().sort((a, b) => U.monthIndex(a.fromMonth) - U.monthIndex(b.fromMonth));

    return `
      <div class="card">
        <div class="card-head"><div><h2>সমিতির তথ্য</h2></div><button class="btn primary sm" id="saveOrg">সংরক্ষণ</button></div>
        <div class="card-body">
          <div class="form-grid">
            <div class="field">
              <label>সমিতির নাম</label>
              <input type="text" id="societyName" value="${U.escapeHtml(s.societyName)}">
            </div>
            <div class="field">
              <label>কমিটির নাম</label>
              <input type="text" id="committeeName" value="${U.escapeHtml(s.committeeName)}">
            </div>
            <div class="field">
              <label>হিসাব শুরুর মাস</label>
              <input type="month" id="startMonth" value="${s.startMonth}">
              <span class="help">এই মাস থেকে সফটওয়্যার মাসিক চার্জ ধরা শুরু করবে। এর আগের বকেয়া প্রতিটি ফ্ল্যাটের "প্রারম্ভিক বকেয়া" ঘরে থাকে।</span>
            </div>
            <div class="field">
              <label>বর্তমান মাসিক হার (টাকা)</label>
              <input type="number" id="monthlyRate" min="0" step="50" value="${s.monthlyRate}">
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div><h2>হার পরিবর্তনের ইতিহাস</h2><p class="hint">ভবিষ্যতে হার বাড়লে এখানে যোগ করুন — পুরোনো মাসের হিসাব অপরিবর্তিত থাকবে।</p></div>
          <button class="btn sm" id="addRate">+ নতুন হার</button>
        </div>
        <div class="card-body flush">
          <table class="grid">
            <thead><tr><th>কার্যকর মাস</th><th class="num">মাসিক হার</th><th class="c" style="width:110px">কার্যক্রম</th></tr></thead>
            <tbody>
              ${history.length ? history.map((h, i) => `
                <tr>
                  <td>${U.monthLabel(h.fromMonth)} থেকে</td>
                  <td class="num strong">${U.bnNumber(h.rate)}/-</td>
                  <td class="c"><button class="btn sm danger" data-del-rate="${i}">মুছুন</button></td>
                </tr>`).join('') : `<tr><td colspan="3" class="muted">কোনো পরিবর্তন নেই — সব মাসে ${U.bnNumber(s.monthlyRate)}/- হার প্রযোজ্য।</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div><h2>আদায়কারী</h2><p class="hint">যাদের মাধ্যমে সার্ভিস চার্জ আদায় হয়। রিপোর্টে স্বাক্ষরের ঘরে ইংরেজি নামটি ছাপা হবে।</p></div>
          <button class="btn sm" id="addCollector">+ নতুন আদায়কারী</button>
        </div>
        <div class="card-body flush">
          <table class="grid">
            <thead><tr><th>বাংলা নাম</th><th>রিপোর্টে স্বাক্ষরের নাম</th><th class="c" style="width:110px">কার্যক্রম</th></tr></thead>
            <tbody>
              ${(s.collectors || []).map((c) => `
                <tr>
                  <td><input type="text" data-collector="${c.id}" data-field="bn" value="${U.escapeHtml(c.bn)}" style="width:100%"></td>
                  <td><input type="text" data-collector="${c.id}" data-field="en" value="${U.escapeHtml(c.en || '')}" style="width:100%"></td>
                  <td class="c"><button class="btn sm danger" data-del-collector="${c.id}">মুছুন</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div><h2>স্বাক্ষরকারী</h2><p class="hint">রিপোর্টের নিচে যাদের নাম ও পদবি ছাপা হবে।</p></div>
          <button class="btn sm" id="addSignatory">+ নতুন স্বাক্ষরকারী</button>
        </div>
        <div class="card-body flush">
          <table class="grid">
            <thead><tr><th>নাম</th><th>পদবি</th><th class="c" style="width:110px">কার্যক্রম</th></tr></thead>
            <tbody>
              ${(s.signatories || []).map((g) => `
                <tr>
                  <td><input type="text" data-signatory="${g.id}" data-field="name" value="${U.escapeHtml(g.name)}" style="width:100%"></td>
                  <td><input type="text" data-signatory="${g.id}" data-field="designation" value="${U.escapeHtml(g.designation)}" style="width:100%"></td>
                  <td class="c"><button class="btn sm danger" data-del-signatory="${g.id}">মুছুন</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><div><h2>ডেটা ও ব্যাকআপ</h2><p class="hint">সব তথ্য আপনার এই কম্পিউটারেই সংরক্ষিত থাকে।</p></div></div>
        <div class="card-body">
          <div class="row">
            <button class="btn" id="exportData">ব্যাকআপ ফাইল সংরক্ষণ</button>
            <button class="btn" id="importData">ব্যাকআপ থেকে ফেরত আনুন</button>
            <button class="btn ghost" id="revealData">ডেটা ফোল্ডার খুলুন</button>
          </div>
          <p class="help muted" style="margin-top:10px;font-size:12px">ডেটা ফাইল: ${U.escapeHtml(state.paths ? state.paths.dataFile : '—')}</p>
          <p class="help muted" style="margin-top:2px;font-size:12px">স্বয়ংক্রিয় ব্যাকআপ: ${U.escapeHtml(state.paths ? state.paths.backupDir : '—')}</p>
        </div>
      </div>`;
  }

  /* ---------- মোডাল ---------- */

  function openModal(title, bodyHtml, footHtml) {
    $('#modal').innerHTML = `
      <div class="modal-head"><h3>${title}</h3><button class="btn ghost sm" data-close="1">✕</button></div>
      <div class="modal-body">${bodyHtml}</div>
      <div class="modal-foot">${footHtml || '<button class="btn" data-close="1">বন্ধ করুন</button>'}</div>`;
    $('#modalBackdrop').hidden = false;
  }

  function closeModal() {
    $('#modalBackdrop').hidden = true;
    $('#modal').innerHTML = '';
  }

  function openFlatEditor(flatId) {
    const isNew = !flatId;
    const f = isNew
      ? { id: uid('f'), serial: state.data.flats.length + 1, flatNo: '', ownerName: '', phone: '', openingDue: 0, note: '', active: true, joinMonth: '' }
      : Object.assign({}, flatById(flatId));

    openModal(isNew ? 'নতুন ফ্ল্যাট যোগ করুন' : `ফ্ল্যাট সম্পাদনা — ${U.escapeHtml(f.flatNo)}`, `
      <div class="form-grid">
        <div class="field"><label>ক্রমিক নং</label><input type="number" id="fSerial" value="${f.serial || ''}"></div>
        <div class="field"><label>ফ্ল্যাট নং</label><input type="text" id="fFlatNo" value="${U.escapeHtml(f.flatNo)}" placeholder="যেমন A-1"></div>
        <div class="field full"><label>মালিকের নাম</label><input type="text" id="fOwner" value="${U.escapeHtml(f.ownerName)}"></div>
        <div class="field"><label>মোবাইল নম্বর</label><input type="text" id="fPhone" value="${U.escapeHtml(f.phone || '')}"></div>
        <div class="field">
          <label>প্রারম্ভিক বকেয়া (টাকা)</label>
          <input type="number" id="fOpening" step="100" value="${f.openingDue || 0}">
          <span class="help">${U.monthLabel(state.data.settings.startMonth)}-এর আগ পর্যন্ত বকেয়া</span>
        </div>
        <div class="field">
          <label>যোগদানের মাস (ঐচ্ছিক)</label>
          <input type="month" id="fJoin" value="${f.joinMonth || ''}">
          <span class="help">পরে যোগ দিলে সেই মাস থেকে চার্জ ধরা হবে</span>
        </div>
        <div class="field">
          <label>নিষ্ক্রিয় হওয়ার মাস (ঐচ্ছিক)</label>
          <input type="month" id="fClosed" value="${f.closedFrom || ''}">
          <span class="help">এই মাস থেকে আর চার্জ ধরা হবে না</span>
        </div>
        <div class="field full"><label>মন্তব্য</label><input type="text" id="fNote" value="${U.escapeHtml(f.note || '')}" placeholder="যেমন: প্রয়াত"></div>
        <div class="field full"><label class="row" style="gap:6px"><input type="checkbox" id="fActive" ${f.active === false ? '' : 'checked'}> সক্রিয় ফ্ল্যাট</label></div>
      </div>`,
      `<button class="btn primary" id="saveFlat">সংরক্ষণ করুন</button>
       <button class="btn" data-close="1">বাতিল</button>`);

    $('#saveFlat').addEventListener('click', async () => {
      const flatNo = $('#fFlatNo').value.trim();
      const ownerName = $('#fOwner').value.trim();
      if (!flatNo || !ownerName) {
        toast('ফ্ল্যাট নং ও মালিকের নাম দুটোই লিখতে হবে।', true);
        return;
      }
      const updated = {
        id: f.id,
        serial: Number($('#fSerial').value) || 0,
        flatNo,
        ownerName,
        phone: $('#fPhone').value.trim(),
        openingDue: Number($('#fOpening').value) || 0,
        joinMonth: $('#fJoin').value || '',
        closedFrom: $('#fClosed').value || '',
        note: $('#fNote').value.trim(),
        active: $('#fActive').checked
      };
      if (isNew) {
        state.data.flats.push(updated);
      } else {
        const idx = state.data.flats.findIndex((x) => x.id === f.id);
        state.data.flats[idx] = updated;
      }
      await persist('ফ্ল্যাটের তথ্য সংরক্ষিত হয়েছে।');
      closeModal();
      render();
    });
  }

  function openLedger(flatId) {
    const flat = flatById(flatId);
    const rows = Calc.ledger(state.data, flat, state.month);
    const status = Calc.flatStatus(state.data, flat, state.month);

    openModal(`লেজার — ${U.escapeHtml(flat.flatNo)} (${U.escapeHtml(flat.ownerName)})`, `
      <div class="stats" style="grid-template-columns:repeat(3,1fr);margin-bottom:12px">
        <div class="stat"><div class="label">মোট ধার্য</div><div class="value" style="font-size:19px">${U.bnTaka(status.opening + status.charged)}</div></div>
        <div class="stat ok"><div class="label">মোট জমা</div><div class="value" style="font-size:19px">${U.bnTaka(status.paid)}</div></div>
        <div class="stat due"><div class="label">বকেয়া</div><div class="value" style="font-size:19px">${U.bnTaka(status.due)}</div></div>
      </div>
      <table class="grid">
        <thead><tr><th>মাস</th><th class="num">ধার্য চার্জ</th><th class="num">জমা</th><th>আদায়কারী</th><th class="num">জের</th></tr></thead>
        <tbody>
          ${rows.map((r) => `
            <tr>
              <td>${U.escapeHtml(r.label)}</td>
              <td class="num muted">${r.charge ? U.bnNumber(r.charge) : '—'}</td>
              <td class="num ${r.paid ? 'strong' : 'muted'}">${r.paid ? U.bnNumber(r.paid) : '—'}</td>
              <td class="muted">${U.escapeHtml(r.collectorIds.map(collectorLabel).filter(Boolean).join(', ') || '—')}</td>
              <td class="num">${U.bnNumber(r.balance)}</td>
            </tr>`).join('')}
        </tbody>
      </table>`,
      `<button class="btn primary" id="ledgerPdf">PDF সংরক্ষণ</button>
       <button class="btn" id="ledgerPrint">প্রিন্ট</button>
       <button class="btn" data-close="1">বন্ধ করুন</button>`);

    const html = () => Report.buildLedgerHtml(state.data, flat, state.month);
    $('#ledgerPdf').addEventListener('click', () => doSavePdf(html(), `ledger-${flat.flatNo}-${state.month}.pdf`));
    $('#ledgerPrint').addEventListener('click', () => doPrint(html()));
  }

  /* ---------- প্রিন্ট / PDF ---------- */

  async function doSavePdf(html, defaultName) {
    toast('PDF তৈরি হচ্ছে…');
    const res = await api.savePdf({ html, defaultName });
    if (res.ok) {
      toast('সংরক্ষিত হয়েছে: ' + res.file);
      api.openFile(res.file);
    } else if (!res.canceled) {
      toast('PDF তৈরি ব্যর্থ: ' + (res.error || ''), true);
    }
  }

  async function doPrint(html) {
    const res = await api.printReport({ html });
    if (!res.ok && res.error) toast('প্রিন্ট ব্যর্থ: ' + res.error, true);
  }

  /* ---------- ইভেন্ট ---------- */

  function wireGlobal() {
    $('#nav').addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-item');
      if (!btn) return;
      state.tab = btn.dataset.tab;
      render();
    });

    $('#monthName').addEventListener('change', (e) => {
      state.month = e.target.value;
      render();
    });

    $('#monthYear').addEventListener('change', (e) => {
      state.month = monthInYear(Number(e.target.value), Number(state.month.split('-')[1]));
      render();
    });

    $('#modalBackdrop').addEventListener('click', (e) => {
      if (e.target.id === 'modalBackdrop' || e.target.closest('[data-close]')) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('#modalBackdrop').hidden) closeModal();
    });

    const content = $('#content');
    content.addEventListener('click', onContentClick);
    content.addEventListener('change', onContentChange);
  }

  async function onContentClick(e) {
    const target = e.target;

    const goto = target.closest('[data-goto]');
    if (goto) { state.tab = goto.dataset.goto; render(); return; }

    const step = target.closest('[data-month-step]');
    if (step) {
      const months = availableMonths();
      const next = months.indexOf(state.month) + Number(step.dataset.monthStep);
      if (next >= 0 && next < months.length) { state.month = months[next]; render(); }
      return;
    }

    const ledgerBtn = target.closest('[data-ledger]');
    if (ledgerBtn) { openLedger(ledgerBtn.dataset.ledger); return; }

    const quick = target.closest('[data-quick]');
    if (quick) {
      const tr = quick.closest('tr');
      const flatId = tr.dataset.flat;
      const amount = Number(quick.dataset.quick);
      const collectorId = $('select[data-field="collectorId"]', tr).value;
      setPayment(flatId, state.month, {
        amount,
        collectorId,
        receivedOn: $('input[data-field="receivedOn"]', tr).value || U.todayIso()
      });
      await persist(amount ? 'জমা লেখা হয়েছে।' : 'জমা মুছে ফেলা হয়েছে।');
      render();
      return;
    }

    const receipt = target.closest('[data-receipt]');
    if (receipt) {
      const tr = receipt.closest('tr');
      const flat = flatById(tr.dataset.flat);
      const payment = getPayment(flat.id, state.month);
      if (payment) doSavePdf(Report.buildReceiptHtml(state.data, flat, payment), `receipt-${flat.flatNo}-${state.month}.pdf`);
      return;
    }

    if (target.closest('#addFlat')) { openFlatEditor(null); return; }

    const editFlat = target.closest('[data-edit-flat]');
    if (editFlat) { openFlatEditor(editFlat.dataset.editFlat); return; }

    const delFlat = target.closest('[data-del-flat]');
    if (delFlat) {
      const flat = flatById(delFlat.dataset.delFlat);
      const count = state.data.payments.filter((p) => p.flatId === flat.id).length;
      const ok = window.confirm(`"${flat.flatNo} — ${flat.ownerName}" মুছে ফেলা হবে।\nএর ${count} টি জমার রেকর্ডও মুছে যাবে। আপনি কি নিশ্চিত?`);
      if (!ok) return;
      state.data.flats = state.data.flats.filter((f) => f.id !== flat.id);
      state.data.payments = state.data.payments.filter((p) => p.flatId !== flat.id);
      await persist('ফ্ল্যাটটি মুছে ফেলা হয়েছে।');
      render();
      return;
    }

    if (target.closest('#bulkFill')) { await bulkFill(); return; }
    if (target.closest('#bulkCollector')) { openBulkCollector(); return; }

    if (target.closest('#printReport')) {
      doPrint(Report.buildReportHtml(state.data, state.month, { nextMonthColumn: state.reportNextColumn }));
      return;
    }
    if (target.closest('#pdfReport')) {
      doSavePdf(
        Report.buildReportHtml(state.data, state.month, { nextMonthColumn: state.reportNextColumn }),
        `service-charge-${state.month}.pdf`
      );
      return;
    }

    if (target.closest('#saveOrg')) { await saveOrgSettings(); return; }
    if (target.closest('#addRate')) { openRateEditor(); return; }

    const delRate = target.closest('[data-del-rate]');
    if (delRate) {
      const sorted = (state.data.settings.rateHistory || []).slice()
        .sort((a, b) => U.monthIndex(a.fromMonth) - U.monthIndex(b.fromMonth));
      const entry = sorted[Number(delRate.dataset.delRate)];
      state.data.settings.rateHistory = state.data.settings.rateHistory.filter((x) => x !== entry);
      await persist('হার পরিবর্তনটি মুছে ফেলা হয়েছে।');
      render();
      return;
    }

    if (target.closest('#addCollector')) {
      state.data.settings.collectors = state.data.settings.collectors || [];
      state.data.settings.collectors.push({ id: uid('c'), bn: 'নতুন আদায়কারী', en: '' });
      await persist('আদায়কারী যোগ হয়েছে।');
      render();
      return;
    }

    const delCollector = target.closest('[data-del-collector]');
    if (delCollector) {
      const id = delCollector.dataset.delCollector;
      const used = state.data.payments.filter((p) => p.collectorId === id).length;
      if (used && !window.confirm(`এই আদায়কারীর নামে ${used} টি জমার রেকর্ড আছে। মুছে ফেললে ঐ রেকর্ডগুলোতে আদায়কারীর নাম খালি হয়ে যাবে। নিশ্চিত?`)) return;
      state.data.payments.forEach((p) => { if (p.collectorId === id) p.collectorId = ''; });
      state.data.settings.collectors = state.data.settings.collectors.filter((c) => c.id !== id);
      await persist('আদায়কারী মুছে ফেলা হয়েছে।');
      render();
      return;
    }

    if (target.closest('#addSignatory')) {
      state.data.settings.signatories = state.data.settings.signatories || [];
      state.data.settings.signatories.push({ id: uid('s'), name: 'নতুন সদস্য', designation: 'নির্বাহী সদস্য' });
      await persist('স্বাক্ষরকারী যোগ হয়েছে।');
      render();
      return;
    }

    const delSig = target.closest('[data-del-signatory]');
    if (delSig) {
      state.data.settings.signatories = state.data.settings.signatories.filter((g) => g.id !== delSig.dataset.delSignatory);
      await persist('স্বাক্ষরকারী মুছে ফেলা হয়েছে।');
      render();
      return;
    }

    if (target.closest('#exportData')) {
      const res = await api.exportData();
      if (res.ok) toast('ব্যাকআপ সংরক্ষিত: ' + res.file);
      return;
    }

    if (target.closest('#importData')) {
      if (!window.confirm('ব্যাকআপ ফাইল থেকে ডেটা ফেরত আনলে বর্তমান সব তথ্য প্রতিস্থাপিত হবে। (বর্তমান তথ্যের একটি ব্যাকআপ স্বয়ংক্রিয়ভাবে রাখা হবে।) নিশ্চিত?')) return;
      const res = await api.importData();
      if (res.ok) {
        state.data = res.data;
        state.month = defaultMonth();
        toast('ডেটা ফেরত আনা হয়েছে।');
        render();
      } else if (!res.canceled) {
        toast('ব্যর্থ: ' + res.error, true);
      }
      return;
    }

    if (target.closest('#revealData')) { api.reveal(); }
  }

  async function onContentChange(e) {
    const target = e.target;

    // মাসিক আদায় এন্ট্রি
    const field = target.dataset.field;
    const tr = target.closest('tr[data-flat]');
    if (field && tr) {
      const flatId = tr.dataset.flat;
      const amountInput = $('input[data-field="amount"]', tr);
      const amount = Number(amountInput.value) || 0;
      const collectorId = $('select[data-field="collectorId"]', tr).value;
      const dateInput = $('input[data-field="receivedOn"]', tr);
      let receivedOn = dateInput.value;
      if (amount > 0 && !receivedOn) {
        receivedOn = U.todayIso();
        dateInput.value = receivedOn;
      }
      setPayment(flatId, state.month, { amount, collectorId, receivedOn });
      await persist();
      render();
      return;
    }

    // আদায়কারীর নাম সম্পাদনা
    const collectorId = target.dataset.collector;
    if (collectorId) {
      const c = state.data.settings.collectors.find((x) => x.id === collectorId);
      if (c) { c[target.dataset.field] = target.value.trim(); await persist('সংরক্ষিত হয়েছে।'); }
      return;
    }

    // স্বাক্ষরকারীর তথ্য সম্পাদনা
    const sigId = target.dataset.signatory;
    if (sigId) {
      const g = state.data.settings.signatories.find((x) => x.id === sigId);
      if (g) { g[target.dataset.field] = target.value.trim(); await persist('সংরক্ষিত হয়েছে।'); }
      return;
    }

    if (target.id === 'monthlyOnlyUnpaid') { state.monthlyOnlyUnpaid = target.checked; render(); return; }
    if (target.id === 'onlyUnpaid') { state.duesOnlyUnpaid = target.checked; render(); return; }
    if (target.id === 'duesSort') { state.duesSort = target.value; render(); return; }
    if (target.id === 'nextCol') { state.reportNextColumn = target.checked; refreshPreview(); }
  }

  async function bulkFill() {
    const rate = Calc.rateForMonth(state.data.settings, state.month);
    const empties = sortedFlats().filter((f) => !getPayment(f.id, state.month) && f.active !== false);
    if (!empties.length) { toast('সব ফ্ল্যাটের জমা ইতিমধ্যেই লেখা আছে।'); return; }
    if (!window.confirm(`${U.bnDigits(empties.length)} টি খালি ঘরে ${U.bnNumber(rate)}/- করে বসানো হবে। নিশ্চিত?`)) return;
    empties.forEach((f) => setPayment(f.id, state.month, { amount: rate, collectorId: '', receivedOn: U.monthEndIso(state.month) }));
    await persist(`${U.bnDigits(empties.length)} টি জমা লেখা হয়েছে।`);
    render();
  }

  function openBulkCollector() {
    openModal('সবার আদায়কারী নির্ধারণ', `
      <div class="field">
        <label>আদায়কারী</label>
        <select id="bulkCollectorSelect">${collectorOptions('')}</select>
        <span class="help">${U.monthLabel(state.month)} মাসে যেসব ফ্ল্যাটের জমা লেখা আছে অথচ আদায়কারী নির্বাচন করা হয়নি, শুধু সেগুলোতে এই নাম বসানো হবে।</span>
      </div>`,
      `<button class="btn primary" id="applyBulkCollector">প্রয়োগ করুন</button>
       <button class="btn" data-close="1">বাতিল</button>`);

    $('#applyBulkCollector').addEventListener('click', async () => {
      const id = $('#bulkCollectorSelect').value;
      if (!id) { toast('একজন আদায়কারী নির্বাচন করুন।', true); return; }
      let count = 0;
      state.data.payments.forEach((p) => {
        if (p.month === state.month && !p.collectorId) { p.collectorId = id; count += 1; }
      });
      await persist(`${U.bnDigits(count)} টি রেকর্ডে আদায়কারী বসানো হয়েছে।`);
      closeModal();
      render();
    });
  }

  function openRateEditor() {
    openModal('নতুন মাসিক হার যোগ করুন', `
      <div class="form-grid">
        <div class="field"><label>কার্যকর মাস</label><input type="month" id="rateMonth" value="${U.currentMonth()}"></div>
        <div class="field"><label>মাসিক হার (টাকা)</label><input type="number" id="rateAmount" step="50" value="${state.data.settings.monthlyRate}"></div>
      </div>
      <p class="help muted" style="margin-top:10px">এই মাস ও তার পরের সব মাসে নতুন হার প্রযোজ্য হবে (পরবর্তী কোনো পরিবর্তন না থাকা পর্যন্ত)।</p>`,
      `<button class="btn primary" id="saveRate">যোগ করুন</button>
       <button class="btn" data-close="1">বাতিল</button>`);

    $('#saveRate').addEventListener('click', async () => {
      const fromMonth = $('#rateMonth').value;
      const rate = Number($('#rateAmount').value) || 0;
      if (!fromMonth || rate <= 0) { toast('মাস ও হার সঠিকভাবে দিন।', true); return; }
      state.data.settings.rateHistory = (state.data.settings.rateHistory || []).filter((h) => h.fromMonth !== fromMonth);
      state.data.settings.rateHistory.push({ fromMonth, rate });
      await persist('নতুন হার যোগ হয়েছে।');
      closeModal();
      render();
    });
  }

  async function saveOrgSettings() {
    const s = state.data.settings;
    s.societyName = $('#societyName').value.trim() || s.societyName;
    s.committeeName = $('#committeeName').value.trim() || s.committeeName;
    s.monthlyRate = Number($('#monthlyRate').value) || s.monthlyRate;

    const newStart = $('#startMonth').value;
    if (newStart && newStart !== s.startMonth) {
      const ok = window.confirm('হিসাব শুরুর মাস বদলালে সব ফ্ল্যাটের ধার্যকৃত চার্জ ও বকেয়ার অঙ্ক বদলে যাবে। আপনি কি নিশ্চিত?');
      if (ok) s.startMonth = newStart;
    }

    await persist('সেটিংস সংরক্ষিত হয়েছে।');
    state.month = availableMonths().includes(state.month) ? state.month : defaultMonth();
    render();
  }

  /* ---------- চালু ---------- */

  async function boot() {
    state.data = await api.load();
    if (!state.data.settings.rateHistory) {
      state.data.settings.rateHistory = [{
        fromMonth: state.data.settings.startMonth,
        rate: state.data.settings.monthlyRate
      }];
    }
    state.month = defaultMonth();
    state.paths = await api.paths();
    wireGlobal();
    render();
  }

  boot().catch((err) => {
    document.body.innerHTML = `<div style="padding:40px;font-family:sans-serif">
      <h2>সফটওয়্যার চালু হতে সমস্যা হয়েছে</h2><pre>${err.stack || err.message}</pre></div>`;
  });
}());
