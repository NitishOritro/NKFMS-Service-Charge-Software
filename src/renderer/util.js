'use strict';

/* বাংলা সংখ্যা, তারিখ ও মাস সংক্রান্ত সহায়ক ফাংশন */

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const BN_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

function bnDigits(value) {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/** ভারতীয় রীতিতে অঙ্ক আলাদা করা: 183500 → ১,৮৩,৫০০ */
function bnNumber(value) {
  const n = Math.round(Number(value) || 0);
  const sign = n < 0 ? '−' : '';
  const s = String(Math.abs(n));
  let grouped;
  if (s.length <= 3) {
    grouped = s;
  } else {
    const last3 = s.slice(-3);
    const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    grouped = rest + ',' + last3;
  }
  return sign + bnDigits(grouped);
}

function bnTaka(value) {
  return '৳' + bnNumber(value);
}

/* ---------- মাস ---------- */

/** '2026-07' → 2026*12 + 6 */
function monthIndex(month) {
  const [y, m] = String(month).split('-').map(Number);
  return y * 12 + (m - 1);
}

function indexToMonth(index) {
  const y = Math.floor(index / 12);
  const m = (index % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

function addMonths(month, delta) {
  return indexToMonth(monthIndex(month) + delta);
}

/** দুই মাস (দুটোই ধরে) মিলিয়ে মোট মাস সংখ্যা; from > to হলে ০ */
function monthSpan(fromMonth, toMonth) {
  return Math.max(0, monthIndex(toMonth) - monthIndex(fromMonth) + 1);
}

/** '2026-07' → 'জুলাই ২০২৬' */
function monthLabel(month) {
  const [y, m] = String(month).split('-').map(Number);
  return `${BN_MONTHS[m - 1]} ${bnDigits(y)}`;
}

/** '2026-07' → 'জুলাই-২৬' (রিপোর্টের সংক্ষিপ্ত রূপ) */
function monthLabelShort(month) {
  const [y, m] = String(month).split('-').map(Number);
  return `${BN_MONTHS[m - 1]}-${bnDigits(String(y).slice(-2))}`;
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/* ---------- তারিখ ---------- */

function bnOrdinalSuffix(day) {
  if (day === 1) return 'লা';
  if (day === 2 || day === 3) return 'রা';
  if (day === 4) return 'ঠা';
  if (day >= 5 && day <= 18) return 'ই';
  return 'শে';
}

/** মাসের শেষ দিন → '৩১শে জুলাই, ২০২৬' */
function monthEndDateLabel(month) {
  const [y, m] = String(month).split('-').map(Number);
  const day = new Date(y, m, 0).getDate();
  return `${bnDigits(day)}${bnOrdinalSuffix(day)} ${BN_MONTHS[m - 1]}, ${bnDigits(y)}`;
}

/** '2026-07-31' → '৩১ জুলাই ২০২৬' */
function dateLabel(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${bnDigits(d)} ${BN_MONTHS[m - 1]} ${bnDigits(y)}`;
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** মাসের শেষ দিনের ISO তারিখ */
function monthEndIso(month) {
  const [y, m] = String(month).split('-').map(Number);
  const day = new Date(y, m, 0).getDate();
  return `${month}-${String(day).padStart(2, '0')}`;
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

window.U = {
  BN_MONTHS,
  bnDigits,
  bnNumber,
  bnTaka,
  monthIndex,
  indexToMonth,
  addMonths,
  monthSpan,
  monthLabel,
  monthLabelShort,
  currentMonth,
  monthEndDateLabel,
  dateLabel,
  todayIso,
  monthEndIso,
  escapeHtml
};
