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

export const supabase = createClient(url || '', anonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

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
  closedFrom: r.closed_from || ''
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
  closed_from: f.closedFrom || null
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
