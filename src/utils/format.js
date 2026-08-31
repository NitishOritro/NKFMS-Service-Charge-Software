// বাংলা ফরম্যাটিং এবং ক্যালেন্ডার ইউটিলিটি

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const MONTH_NAMES_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];
const MONTH_NAMES_SHORT_BN = [
  'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'
];

export function bnDigits(input) {
  if (input == null) return '';
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export function bnNumber(input) {
  const num = Number(input);
  if (isNaN(num)) return '০';
  const parts = Math.abs(num).toString().split('.');
  let intPart = parts[0];
  const decPart = parts[1];

  let lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  const result = (num < 0 ? '-' : '') + formatted + (decPart ? '.' + decPart : '');
  return bnDigits(result);
}

export function bnTaka(input) {
  return `৳${bnNumber(input)}`;
}

export function monthIndex(mStr) {
  if (!mStr || typeof mStr !== 'string') return 0;
  const [y, m] = mStr.split('-').map(Number);
  return (y || 0) * 12 + (m ? m - 1 : 0);
}

export function indexToMonth(idx) {
  const y = Math.floor(idx / 12);
  const m = (idx % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function addMonths(mStr, count) {
  return indexToMonth(monthIndex(mStr) + count);
}

export function monthLabel(mStr) {
  if (!mStr) return '';
  const [y, m] = mStr.split('-').map(Number);
  if (!y || !m) return mStr;
  return `${MONTH_NAMES_BN[m - 1]} ${bnDigits(y)}`;
}

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function monthLabelEn(mStr) {
  if (!mStr) return '';
  const [y, m] = mStr.split('-').map(Number);
  if (!y || !m) return mStr;
  return `${MONTH_NAMES_EN[m - 1]} ${y}`;
}

export function monthLabelShort(mStr) {
  if (!mStr) return '';
  const [y, m] = mStr.split('-').map(Number);
  if (!y || !m) return mStr;
  const shortYear = bnDigits(String(y).slice(-2));
  return `${MONTH_NAMES_BN[m - 1]}-${shortYear}`;
}

export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthEndIso(mStr) {
  if (!mStr) return '';
  const [y, m] = mStr.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

export function monthEndDateLabel(mStr) {
  if (!mStr) return '';
  const [y, m] = mStr.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return `${bnDigits(lastDay)} শে ${MONTH_NAMES_BN[m - 1]}, ${bnDigits(y)}`;
}

export function dateLabel(dStr) {
  if (!dStr) return '';
  const parts = dStr.split('-');
  if (parts.length !== 3) return bnDigits(dStr);
  const [y, m, d] = parts.map(Number);
  return `${bnDigits(d)} ${MONTH_NAMES_SHORT_BN[m - 1]} ${bnDigits(y)}`;
}
