'use strict';

/*
 * প্রাথমিক ডেটা — "Service Charge_August 26.pdf" থেকে নেওয়া।
 *
 * openingDue = হিসাব শুরুর মাসের (জুলাই-২৬) ঠিক আগে পর্যন্ত বকেয়া।
 * সূত্র: openingDue = (PDF-এ জুলাই পর্যন্ত বকেয়া) + (জুলাই-এ জমা) − ১৫০০
 * এতে জুলাই-২৬ এর হিসাব কষলে PDF-এর বকেয়ার অঙ্ক হুবহু মিলে যায়।
 */

const START_MONTH = '2026-07';

const COLLECTORS = [
  { id: 'c1', bn: 'সীমা চন্দ', en: 'Sima Chanda' },
  { id: 'c2', bn: 'নীতিশ রঞ্জন ভৌমিক', en: 'Nitish Ranjan' },
  { id: 'c3', bn: 'শিশির কুমার দাস', en: 'Shishir Kumar' },
  { id: 'c4', bn: 'নির্মল কুমার মন্ডল', en: 'Nirmal Mondal' },
  { id: 'c5', bn: 'সুকুমার কুমার মন্ডল', en: 'Sukumar Mondal' },
  { id: 'c6', bn: 'অশোক কুমার শীল', en: 'Ashok Kumar Shil' }
];

const SIGNATORIES = [
  { id: 's1', name: 'শিশির কুমার দাস', designation: 'আহ্বায়ক' },
  { id: 's2', name: 'নীতিশ রঞ্জন ভৌমিক', designation: 'সদস্য সচিব' },
  { id: 's3', name: 'সুকুমার কুমার মন্ডল', designation: 'নির্বাহী সদস্য' },
  { id: 's4', name: 'সীমা চন্দ', designation: 'নির্বাহী সদস্য' },
  { id: 's5', name: 'নির্মল কুমার মন্ডল', designation: 'নির্বাহী সদস্য' },
  { id: 's6', name: 'অশোক কুমার শীল', designation: 'নির্বাহী সদস্য' }
];

// [ক্রমিক, ফ্ল্যাট নং, মালিকের নাম, প্রারম্ভিক বকেয়া, জুলাই-২৬ জমা, আদায়কারী]
const ROWS = [
  [1, 'A-1', 'সুখেন্দ্র নাথ চন্দ', 0, 1500, 'c1'],
  [2, 'B-1', 'হীরেন্দ্র চন্দ্র পাল', 3000, 4500, 'c2'],
  [3, 'C-1', 'দর্শনা সরকার', 0, 1500, 'c3'],
  [4, 'A-2', 'বিপ্লব ভূষণ বকসী', 0, 0, null],
  [5, 'B-2', 'গৌতম চন্দ্র মজুমদার', 0, 1500, 'c1'],
  [6, 'C-2', 'নবনীতা বিশ্বাস', 19500, 1500, 'c1'],
  [7, 'A-3', 'দিপুল কুমার বিশ্বাস', 18000, 1500, 'c1'],
  [8, 'B-3', 'শিউলী দত্ত', 0, 1500, 'c3'],
  [9, 'C-3', 'নমিতা রানী বাউল', 9500, 0, null],
  [10, 'A-4', 'চিত্রলেখা বিশ্বাস', 0, 1500, 'c3'],
  [11, 'B-4', 'লোকেশ রঞ্জন তালুকদার', 0, 1500, 'c3'],
  [12, 'C-4', 'শিবানী রানী দাস', 0, 1500, 'c3'],
  [13, 'A-5', 'জ্যোতি রানী বিশ্বাস', 14000, 1500, 'c2'],
  [14, 'B-5', 'অশোক কুমার শীল', 0, 1500, 'c2'],
  [15, 'C-5', 'দিলীপ কুমার বিশ্বাস', 29500, 0, null],
  [16, 'A-6', 'নন্দিতা বিশ্বাস', 15000, 1500, 'c4'],
  [17, 'B-6', 'বিকাশ সিংহ সূত্রধর (প্রয়াত)', 0, 0, null],
  [18, 'C-6', 'তপন কুমার দেবনাথ', 0, 1500, 'c3'],
  [19, 'A-7', 'শিপ্রা চক্রবর্তী', 0, 1500, 'c3'],
  [20, 'B-7', 'তপতী চক্রবর্তী', 0, 1500, 'c2'],
  [21, 'C-7', 'চিন্ময় দেবনাথ', 0, 1500, 'c3'],
  [22, 'A-8', 'পংকজ কুমার চক্রবর্তী', 6000, 1500, 'c3'],
  [23, 'B-8', 'মনিকা ভৌমিক', 0, 1500, 'c2'],
  [24, 'C-8', 'নিলিমা দে', 0, 1500, 'c2'],
  [25, 'A-9', 'দিপুল কুমার বিশ্বাস', 34500, 0, null],
  [26, 'B-9', 'রনজিৎ সরকার', 3000, 4500, 'c2'],
  [27, 'C-9', 'অশোক কুমার শীল', 30000, 1500, 'c2']
];

function buildSeed() {
  const flats = ROWS.map(([serial, flatNo, ownerName, openingDue]) => ({
    id: 'f' + flatNo,
    serial,
    flatNo,
    ownerName,
    openingDue,
    phone: '',
    note: '',
    active: true
  }));

  const payments = [];
  ROWS.forEach(([, flatNo, , , amount, collectorId]) => {
    if (amount > 0) {
      payments.push({
        id: 'p-' + START_MONTH + '-' + flatNo,
        flatId: 'f' + flatNo,
        month: START_MONTH,
        amount,
        collectorId,
        receivedOn: '2026-07-31',
        note: ''
      });
    }
  });

  return {
    version: 1,
    settings: {
      societyName: 'নীলকণ্ঠ ফ্ল্যাট মালিক সমিতি',
      committeeName: 'ভবন ব্যবস্থাপনা ও সার্ভিস চার্জ কমিটি',
      monthlyRate: 1500,
      startMonth: START_MONTH,
      rateHistory: [{ fromMonth: START_MONTH, rate: 1500 }],
      collectors: COLLECTORS,
      signatories: SIGNATORIES
    },
    flats,
    payments
  };
}

module.exports = { buildSeed, START_MONTH };
