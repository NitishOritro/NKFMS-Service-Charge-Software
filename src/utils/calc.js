// সার্ভিস চার্জ ও বকেয়ার গাণিতিক হিসাব
import * as U from './format';

const SPECIAL_3500_FLATS = new Set(['fA-1', 'fB-2', 'fB-5', 'fB-7', 'fC-3', 'fC-8']);

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
