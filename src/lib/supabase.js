import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // এই দুটি না থাকলে অ্যাপ ডাটাবেজে পৌঁছাতেই পারবে না — তাই আগেভাগে জানানো
  console.error(
    'VITE_SUPABASE_URL অথবা VITE_SUPABASE_ANON_KEY পাওয়া যায়নি। ' +
      '.env ফাইলটি দেখুন (নমুনা: .env.example)।'
  );
}

// createClient-কে খালি স্ট্রিং দিলে সে সাথে সাথেই "supabaseUrl is required"
// ছুড়ে দেয় — মডিউল লোডেই অ্যাপ ভেঙে সাদা স্ক্রিন আসে, আর নিচের
// hasSupabaseConfig গার্ডগুলো কখনো চলার সুযোগই পায় না। তাই .env না থাকলে
// একটি নিরীহ প্লেসহোল্ডার দেওয়া হয়; এতে অ্যাপ চালু হয় এবং DataContext
// ব্যবহারকারীকে ".env পাওয়া যায়নি" বার্তাটি পরিষ্কারভাবে দেখাতে পারে।
export const supabase = createClient(
  url || 'https://placeholder.invalid',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);

export const hasSupabaseConfig = Boolean(url && anonKey);

// ---------------------------------------------------------------------------
//  ডাটাবেজের কলাম (snake_case) ↔ অ্যাপের ক্ষেত্র (camelCase) রূপান্তর
// ---------------------------------------------------------------------------

export const flatFromRow = (r) => ({
  id: r.id,
  serial: r.serial,
  flatNo: r.flat_no,
  ownerName: r.owner_name || '',
  openingDue: Number(r.opening_due) || 0,
  phone: r.phone || '',
  note: r.note || '',
  active: r.active !== false,
  joinMonth: r.join_month || '',
  closedFrom: r.closed_from || '',
  // মাসভিত্তিক বিশেষ ধার্য হার, যেমন {"2024-08": 3500, "2024-09": 3500}
  // (ভবনে বসবাসরত মালিকদের জন্য)। কলামটি না থাকলে বা খালি হলে {}।
  customRates: r.custom_rates || {}
});

export const flatToRow = (f) => ({
  id: f.id,
  serial: f.serial ?? null,
  flat_no: f.flatNo,
  owner_name: f.ownerName || '',
  opening_due: Number(f.openingDue) || 0,
  phone: f.phone || '',
  note: f.note || '',
  active: f.active !== false,
  join_month: f.joinMonth || null,
  closed_from: f.closedFrom || null,
  // ফ্ল্যাট সম্পাদনা করলে যেন বিশেষ হারগুলো মুছে না যায়
  custom_rates: f.customRates && Object.keys(f.customRates).length ? f.customRates : null
});

export const paymentFromRow = (r) => ({
  id: r.id,
  flatId: r.flat_id,
  month: r.month,
  amount: Number(r.amount) || 0,
  collectorId: r.collector_id || '',
  receivedOn: r.received_on || '',
  note: r.note || ''
});

export const paymentToRow = (p) => ({
  id: p.id,
  flat_id: p.flatId,
  month: p.month,
  amount: Number(p.amount) || 0,
  collector_id: p.collectorId || '',
  received_on: p.receivedOn || '',
  note: p.note || ''
});
