/**
 * পুরোনো ক্যাশ নিজে থেকেই পরিষ্কার করা
 * ---------------------------------------------------------------
 * সমস্যা: ডিপ্লয়ের পরেও ব্রাউজার পুরোনো index.html ধরে রাখতে পারে,
 * ফলে ব্যবহারকারী নতুন কোড পান না — Ctrl+Shift+R চাপতে হয়। সবাইকে
 * সেটি বলা বাস্তবসম্মত নয়।
 *
 * সমাধান: প্রতিটি বিল্ডে একটি আলাদা নম্বর (BUILD_ID) কোডের ভেতরে বসে
 * যায়, আর একই নম্বর /version.json ফাইলেও লেখা হয়। পাতা খোলার সময়
 * ফাইলটি ক্যাশ এড়িয়ে পড়া হয় — নম্বর দুটি না মিললে বোঝা যায় হাতের
 * কোডটি পুরোনো। তখন সব ক্যাশ মুছে পাতাটি একবার নতুন করে খোলা হয়।
 *
 * নিরাপত্তা: একই নম্বরের জন্য একবারের বেশি রিলোড হয় না (sessionStorage
 * এ চিহ্ন রাখা থাকে), তাই কোনো অবস্থাতেই রিলোডের চক্রে পড়বে না।
 * ইন্টারনেট না থাকলে বা ফাইলটি না পাওয়া গেলে চুপচাপ কিছুই হয় না।
 */

const FLAG = 'nkfms:reloaded-for';

/** ব্রাউজারের Cache Storage ও সার্ভিস ওয়ার্কার — দুটোই মুছে ফেলা */
async function clearBrowserCaches() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    /* উপেক্ষা — পুরোনো ব্রাউজারে এই API না-ও থাকতে পারে */
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* উপেক্ষা */
  }
}

export async function guardStaleCache(buildId) {
  if (typeof window === 'undefined') return;

  // ডেভেলপমেন্টে version.json থাকে না, আর সেখানে ক্যাশের সমস্যাও নেই
  if (!buildId || buildId === 'dev') return;

  let live;
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return;
    live = (await res.json()).buildId;
  } catch {
    return; // অফলাইন — পুরোনো কোড দিয়েই কাজ চলুক, ভাঙার চেয়ে ভালো
  }

  if (!live || live === buildId) return; // হাতের কোডই সর্বশেষ

  let already = null;
  try {
    already = sessionStorage.getItem(FLAG);
  } catch {
    /* প্রাইভেট মোডে sessionStorage বন্ধ থাকতে পারে */
  }
  if (already === live) return; // এই নম্বরের জন্য একবার চেষ্টা হয়ে গেছে

  try {
    sessionStorage.setItem(FLAG, live);
  } catch {
    return; // চিহ্ন রাখা না গেলে রিলোড করা বিপজ্জনক — চক্রে পড়ে যেতে পারে
  }

  await clearBrowserCaches();

  // ঠিকানায় নতুন একটি প্যারামিটার — এতে ব্রাউজার index.html নতুন করে
  // সার্ভার থেকে আনে, ক্যাশ থেকে নয়। হ্যাশ (#/reports) অক্ষত থাকে।
  const url = new URL(window.location.href);
  url.searchParams.set('v', live);
  window.location.replace(url.toString());
}
