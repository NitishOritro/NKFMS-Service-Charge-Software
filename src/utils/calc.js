// সার্ভিস চার্জ ও বকেয়ার গাণিতিক হিসাব
import * as U from './format';

// ---------------------------------------------------------------------------
//  "বসবাসরত অবস্থায়" — যে মালিকেরা ভবনে বসবাস করতেন, তাঁদের জন্য আগস্ট ও
//  সেপ্টেম্বর ২০২৪ মাসে ধার্য সার্ভিস চার্জ ছিল ১,৫০০ নয়, ৩,৫০০ টাকা।
//
//  A-4 (চিত্রলেখা বিশ্বাস) ও C-1 (দর্শনা সরকার) আগে এই তালিকায় ছিলেন না,
//  ফলে তাঁদের ধার্য চার্জ ৪,০০০ টাকা কম ধরা হচ্ছিল। সমিতির শিটের সাথে
//  মিলিয়ে যোগ করা হলো — এখন A-4 এর বকেয়া ৩,৫০০ ও C-1 এর ৫০০ টাকা
//  (ডিসেম্বর ২০২৪ পর্যন্ত), যা শিটের হুবহু সমান।
// ---------------------------------------------------------------------------
const SPECIAL_3500_FLATS = new Set([
  'fA-1', 'fA-4', 'fB-2', 'fB-5', 'fB-7', 'fC-1', 'fC-3', 'fC-8'
]);

/** "বসবাসরত অবস্থায়" প্রযোজ্য মাসিক হার */
export const RESIDENT_RATE = 3500;

/** কোড-নির্ভর ফলব্যাক — ডাটাবেজে custom_rates বসানোর আগ পর্যন্ত */
export const RESIDENT_MONTHS = ['2024-08', '2024-09'];

/**
 * এই ফ্ল্যাটে "বসবাসরত" হার কোন কোন মাসে খেটেছে।
 *
 * আগে উত্তরটা কেবল উপরের হার্ডকোড করা তালিকা থেকে আসত। এখন আগে
 * ডাটাবেজের custom_rates দেখা হয় — নতুন কোনো মালিক যোগ হলে বা হার
 * বদলালে কোডে হাত না দিয়ে কেবল ডাটাবেজ হালনাগাদ করলেই চলবে।
 * কলামটি এখনো বসানো না থাকলে পুরোনো তালিকাই কাজ করে, তাই SQL চালানোর
 * আগে-পরে হিসাব একই থাকে।
 */
export function residentMonths(flat) {
  if (!flat) return [];
  const custom = flat.customRates || {};
  const fromDb = Object.keys(custom)
    .filter((m) => Number(custom[m]) === RESIDENT_RATE)
    .sort();
  if (fromDb.length) return fromDb;
  return SPECIAL_3500_FLATS.has(flat.id) ? RESIDENT_MONTHS.slice() : [];
}

/** এই ফ্ল্যাটে কখনো "বসবাসরত" হার খেটেছে কি না */
export function isResidentFlat(flat) {
  return residentMonths(flat).length > 0;
}

/** নির্দিষ্ট মাসে এই ফ্ল্যাটে "বসবাসরত" হার খাটছে কি না */
export function isResidentMonth(flat, month) {
  return residentMonths(flat).includes(month);
}

/** টুলটিপে দেখানোর ব্যাখ্যা */
export function residentNote(flat) {
  const name = (flat && flat.ownerName) || 'এই';
  const months = residentMonths(flat).map(U.monthLabel).join(' ও ');
  return `${name} ফ্ল্যাট মালিক উক্ত সময়ে (${months}) ভবনে বসবাসরত ছিলেন — তাই ওই দুই মাসে ধার্য মাসিক সার্ভিস চার্জ ছিল ৩,৫০০/- টাকা।`;
}

/** নির্দিষ্ট ফ্ল্যাট ও মাসে প্রযোজ্য মাসিক ধার্য হার */
export function rateForMonth(settings, month, flat) {
  if (flat) {
    if (flat.customRates && flat.customRates[month] != null) {
      return Number(flat.customRates[month]) || 0;
    }
    if (SPECIAL_3500_FLATS.has(flat.id) && (month === '2024-08' || month === '2024-09')) {
      return 3500;
    }
  }
  const history = Array.isArray(settings.rateHistory) ? settings.rateHistory : [];
  let rate = Number(settings.monthlyRate) || 0;
  const idx = U.monthIndex(month);
  history
    .slice()
    .sort((a, b) => U.monthIndex(a.fromMonth) - U.monthIndex(b.fromMonth))
    .forEach((entry) => {
      if (U.monthIndex(entry.fromMonth) <= idx) rate = Number(entry.rate) || 0;
    });
  return rate;
}

/** কোন মাস থেকে এই ফ্ল্যাটে চার্জ ধরা শুরু হবে */
export function flatStartMonth(flat, settings) {
  const start = settings.startMonth || '2024-08';
  const minStart = U.monthIndex(start) < U.monthIndex('2024-08') ? start : '2024-08';
  if (flat.joinMonth && U.monthIndex(flat.joinMonth) > U.monthIndex(minStart)) return flat.joinMonth;
  return minStart;
}

/** কোন মাস পর্যন্ত চার্জ ধরা হবে */
export function flatEndMonth(flat, asOfMonth) {
  if (flat.closedFrom && U.monthIndex(flat.closedFrom) <= U.monthIndex(asOfMonth)) {
    return U.addMonths(flat.closedFrom, -1);
  }
  return asOfMonth;
}

/** শুরু থেকে asOfMonth পর্যন্ত মোট ধার্যকৃত চার্জ */
export function chargeUpTo(flat, settings, asOfMonth) {
  const start = flatStartMonth(flat, settings);
  const end = flatEndMonth(flat, asOfMonth);
  const from = U.monthIndex(start);
  const to = U.monthIndex(end);
  let total = 0;
  for (let i = from; i <= to; i += 1) {
    total += rateForMonth(settings, U.indexToMonth(i), flat);
  }
  return total;
}

export function paidUpTo(payments, flatId, asOfMonth) {
  const limit = U.monthIndex(asOfMonth);
  return payments.reduce((sum, p) => (
    p.flatId === flatId && U.monthIndex(p.month) <= limit ? sum + (Number(p.amount) || 0) : sum
  ), 0);
}

export function paymentsInMonth(payments, flatId, month) {
  return payments.filter((p) => p.flatId === flatId && p.month === month);
}

export function paidInMonth(payments, flatId, month) {
  return paymentsInMonth(payments, flatId, month).reduce((s, p) => s + (Number(p.amount) || 0), 0);
}

/**
 * একটি ফ্ল্যাটের নির্দিষ্ট মাস পর্যন্ত পূর্ণ হিসাব।
 * due > 0 হলে বকেয়া, due < 0 হলে অগ্রীম জমা।
 */
export function flatStatus(data, flat, asOfMonth) {
  const opening = Number(flat.openingDue) || 0;
  const charged = chargeUpTo(flat, data.settings, asOfMonth);
  const paid = paidUpTo(data.payments, flat.id, asOfMonth);
  const balance = opening + charged - paid;
  const monthPayments = paymentsInMonth(data.payments, flat.id, asOfMonth);
  const monthPaid = monthPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const monthRate = rateForMonth(data.settings, asOfMonth, flat);
  return {
    flat,
    opening,
    charged,
    paid,
    balance,
    due: balance > 0 ? balance : 0,
    advance: balance < 0 ? -balance : 0,
    monthPaid,
    monthPayments,
    monthRate,
    collectorIds: monthPayments.map((p) => p.collectorId).filter(Boolean),
    monthUnpaid: monthPaid <= 0
  };
}

/** সব সক্রিয় ফ্ল্যাটের অবস্থা */
export function allStatuses(data, asOfMonth) {
  return data.flats
    .slice()
    .sort((a, b) => (a.serial || 0) - (b.serial || 0))
    .map((flat) => flatStatus(data, flat, asOfMonth));
}

export function summary(data, asOfMonth) {
  const rows = allStatuses(data, asOfMonth);
  const totals = rows.reduce((acc, r) => {
    acc.monthCollected += r.monthPaid;
    acc.totalDue += r.due;
    acc.totalAdvance += r.advance;
    if (r.due > 0) acc.defaulters += 1;
    if (r.monthPaid > 0) acc.paidThisMonth += 1;
    return acc;
  }, {
    monthCollected: 0,
    totalDue: 0,
    totalAdvance: 0,
    defaulters: 0,
    paidThisMonth: 0,
    flatCount: rows.length
  });
  return { rows, totals };
}

/** কালেক্টর অনুযায়ী কোন মাসে কত আদায় হলো */
export function collectorBreakdown(data, month) {
  const map = new Map();
  data.payments
    .filter((p) => p.month === month)
    .forEach((p) => {
      const key = p.collectorId || '__none__';
      const entry = map.get(key) || { collectorId: p.collectorId || null, amount: 0, count: 0 };
      entry.amount += Number(p.amount) || 0;
      entry.count += 1;
      map.set(key, entry);
    });
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

/** একটি ফ্ল্যাটের মাসভিত্তিক লেজার */
export function ledger(data, flat, asOfMonth) {
  const start = flatStartMonth(flat, data.settings);
  const rows = [];
  let running = Number(flat.openingDue) || 0;
  if (running !== 0) {
    rows.push({
      month: null,
      label: 'প্রারম্ভিক বকেয়া',
      charge: running,
      paid: 0,
      collectorIds: [],
      balance: running
    });
  }
  const from = U.monthIndex(start);
  const to = U.monthIndex(asOfMonth);
  for (let i = from; i <= to; i += 1) {
    const month = U.indexToMonth(i);
    const endMonth = flatEndMonth(flat, month);
    const charge = U.monthIndex(endMonth) >= i ? rateForMonth(data.settings, month, flat) : 0;
    const monthPayments = paymentsInMonth(data.payments, flat.id, month);
    const paid = monthPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    running += charge - paid;
    rows.push({
      month,
      label: U.monthLabel(month),
      charge,
      paid,
      collectorIds: monthPayments.map((p) => p.collectorId).filter(Boolean),
      balance: running
    });
  }
  return rows;
}

/**
 * ড্রপডাউনে দেখানোর শেষ মাস।
 *
 * আগে সব জায়গায় '2026-08' হার্ডকোড করা ছিল, ফলে সেপ্টেম্বর ২০২৬ এলেও
 * তালিকা আগস্টেই আটকে থাকত — চলতি মাসের এন্ট্রিই দেওয়া যেত না। এখন
 * চলতি মাস নিজে থেকেই যুক্ত হয়, তাই সময় এগোলে সফটওয়্যারও এগোয়।
 *
 * ডাটাবেজে যদি চলতি মাসেরও পরের কোনো এন্ট্রি থাকে (যেমন অগ্রীম জমা),
 * সেটিও যেন হারিয়ে না যায় — তাই দুইয়ের মধ্যে যেটি পরে সেটিই শেষ মাস।
 */
export function lastSelectableMonth(data) {
  let idx = U.monthIndex(U.currentMonth());
  (data.payments || []).forEach((p) => {
    const i = U.monthIndex(p.month);
    if (i > idx) idx = i;
  });
  return U.indexToMonth(idx);
}

/** সেটিংসের শুরুর মাস থেকে lastSelectableMonth পর্যন্ত সব মাসের তালিকা */
export function monthOptions(data) {
  const startIdx = U.monthIndex(data.settings.startMonth || '2024-08');
  const endIdx = U.monthIndex(lastSelectableMonth(data));
  const list = [];
  for (let i = startIdx; i <= Math.max(startIdx, endIdx); i += 1) {
    list.push(U.indexToMonth(i));
  }
  return list;
}

/* ==========================================================================
   মাসিক আয়-ব্যয় হিসাবায়ন
   ========================================================================== */

/** একটি সারির অঙ্ক — উপ-লাইন থাকলে তাদের যোগফল, নইলে সরাসরি বসানো অঙ্ক */
export function ledgerRowAmount(entry) {
  const lines = entry.lines || [];
  return lines.length
    ? lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0)
    : Number(entry.amount) || 0;
}

/**
 * এক মাসের আয়-ব্যয়ের যোগফল ও ক্যাশ ঘাটতি/উদ্বৃত্ত।
 * balance ঋণাত্মক মানে ঘাটতি, ধনাত্মক মানে উদ্বৃত্ত।
 */
export function ledgerSummary(data, month) {
  const all = (data.ledgerEntries || []).filter((e) => e.month === month);
  const stored = all.filter((e) => e.side === 'income');
  const expense = all.filter((e) => e.side === 'expense');

  // ঐ মাসে যাঁদের মাধ্যমে সার্ভিস চার্জ আদায় হয়েছে, তাঁদের সারি জমার খাতায়
  // নিজে থেকেই বসে। ডাটাবেজে কিছু লেখা হয় না — প্রতিবার আদায়ের হিসাব থেকে
  // গুনে নেওয়া হয়, ফলে পরে কোনো আদায় সংশোধন করলে এখানেও সাথে সাথে মেলে।
  //
  // কেউ সারিটি সম্পাদনা করলে সেটি ডাটাবেজে স্থায়ীভাবে বসে যায়, আর তখন এই
  // স্বয়ংক্রিয় সারিটি আর তৈরি হয় না — হাতে লেখা সবসময় অগ্রাধিকার পায়।
  const claimed = new Set(
    all.filter((e) => e.source === 'collector').map((e) => e.refId || '')
  );

  const auto = collectorLedgerRows(data, month)
    .filter((r) => !claimed.has(r.refId || ''))
    .map((r) => ({
      id: `auto-collector-${r.refId || 'none'}`,
      month,
      side: 'income',
      serial: null,
      title: r.title,
      lines: [],
      amount: r.amount,
      source: 'collector',
      refId: r.refId,
      note: `${U.bnDigits(r.flats)} টি ফ্ল্যাট`,
      auto: true
    }));

  // কাগজে আদায়কারীদের সারিগুলো সবার উপরে থাকে, তাই আগে সেগুলোই
  const income = [
    ...auto,
    ...stored.sort((a, b) => (a.serial ?? 999) - (b.serial ?? 999))
  ];
  const expenseSorted = expense.sort((a, b) => (a.serial ?? 999) - (b.serial ?? 999));

  const sum = (list) => list.reduce((t, e) => t + ledgerRowAmount(e), 0);
  const totalIncome = sum(income);
  const totalExpense = sum(expenseSorted);

  return {
    income,
    expense: expenseSorted,
    autoCount: auto.length,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    lineCount: [...income, ...expenseSorted].reduce(
      (n, e) => n + Math.max(1, (e.lines || []).length),
      0
    )
  };
}

/**
 * আদায়ের হিসাব থেকে আদায়কারীভিত্তিক সারি বানানো।
 * ledgerSummary এগুলো নিজে থেকেই জমার খাতায় বসিয়ে দেয়।
 */
export function collectorLedgerRows(data, month) {
  // কাগজে সম্বোধনসহ লেখা হয় — "জনাব নীতিশ রঞ্জন", "মিসেস সীমা চন্দ"।
  // সেটিংসে সম্বোধন না দেওয়া থাকলে শুধু নামই বসে, ভুল সম্বোধন বসে না।
  const people = new Map(
    (data.settings.collectors || []).map((c) => [
      c.id,
      { name: c.bn || c.en, honorific: (c.honorific || '').trim() }
    ])
  );
  const totals = new Map();

  data.payments
    .filter((p) => p.month === month && Number(p.amount) > 0)
    .forEach((p) => {
      const key = p.collectorId || '';
      const cur = totals.get(key) || { amount: 0, flats: 0 };
      cur.amount += Number(p.amount) || 0;
      cur.flats += 1;
      totals.set(key, cur);
    });

  return Array.from(totals.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([collectorId, t]) => {
      const p = people.get(collectorId);
      const who = p ? [p.honorific, p.name].filter(Boolean).join(' ') : '';
      return {
        refId: collectorId,
        collectorName: p ? p.name : '',
        flats: t.flats,
        amount: t.amount,
        title: who
          ? `${who} কর্তৃক আদায় (${U.monthLabelShort(month)} এর সার্ভিস চার্জ বাবদ)`
          : `আদায়কারী উল্লেখ নেই (${U.monthLabelShort(month)} এর সার্ভিস চার্জ বাবদ)`
      };
    });
}

/**
 * আগের মাসের ফলাফল — ঘাটতি থাকলে চলতি মাসের খরচে, উদ্বৃত্ত থাকলে আয়ে বসে।
 * আগের মাসের কোনো হিসাবই না থাকলে null (তখন সারিটি বসানো হয় না)।
 */
export function carryoverRow(data, month) {
  const prev = U.addMonths(month, -1);
  const hasPrev = (data.ledgerEntries || []).some((e) => e.month === prev);
  if (!hasPrev) return null;

  const { balance } = ledgerSummary(data, prev);
  if (balance === 0) return null;

  return balance < 0
    ? {
        side: 'expense',
        amount: -balance,
        title: `পূর্বের হিসাবের ক্যাশ (${U.monthLabelShort(prev)}) ঘাটতি পূরণ`
      }
    : {
        side: 'income',
        amount: balance,
        title: `পূর্বের হিসাবের ক্যাশ (${U.monthLabelShort(prev)}) উদ্বৃত্ত`
      };
}
