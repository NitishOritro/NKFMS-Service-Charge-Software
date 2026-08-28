'use strict';

const fs = require('fs');
const path = require('path');
const { buildSeed } = require('./seed');
const auth = require('./auth');

let dataFile = null;
let backupDir = null;

/**
 * @param {string} dataDir      যে ফোল্ডারে ডেটা রাখা হবে
 * @param {string} [previousDir] আগের ফোল্ডার — নতুন জায়গায় ফাইল না থাকলে
 *                               সেখান থেকে তুলে আনা হয়, যাতে জায়গা বদলানোর
 *                               কারণে আগের এন্ট্রিগুলো হারিয়ে না যায়।
 */
function init(dataDir, previousDir) {
  dataFile = path.join(dataDir, 'nkfms-data.json');
  backupDir = path.join(dataDir, 'backups');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    const carriedOver = previousDir && path.join(previousDir, 'nkfms-data.json');
    if (carriedOver && fs.existsSync(carriedOver)) fs.copyFileSync(carriedOver, dataFile);
    else writeJson(dataFile, buildSeed());
  }
  // আগের সংস্করণে তৈরি ফাইলে ব্যবহারকারীর তালিকা নেই — এখানে যোগ করে দেওয়া হয়
  const data = load();
  if (auth.ensureUsers(data)) writeJson(dataFile, data);
  return dataFile;
}

function writeJson(file, obj) {
  // একই ফোল্ডারে অস্থায়ী ফাইলে লিখে rename করা হয়, যাতে লেখার মাঝপথে
  // বিদ্যুৎ চলে গেলেও মূল ডেটা ফাইল নষ্ট না হয়।
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

function load() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch (err) {
    const seed = buildSeed();
    writeJson(dataFile, seed);
    return seed;
  }
}

function save(data) {
  backupThrottled();
  writeJson(dataFile, data);
  return { ok: true, file: dataFile };
}

// এন্ট্রির সময় প্রতিটি ছোট পরিবর্তনে আলাদা ব্যাকআপ না রেখে ৫ মিনিট পর পর রাখা হয়।
const BACKUP_INTERVAL_MS = 5 * 60 * 1000;
let lastBackupAt = 0;

function backupThrottled() {
  const now = Date.now();
  if (now - lastBackupAt < BACKUP_INTERVAL_MS) return;
  lastBackupAt = now;
  backup();
}

function backup() {
  if (!fs.existsSync(dataFile)) return;
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  fs.copyFileSync(dataFile, path.join(backupDir, `nkfms-data-${stamp}.json`));
  pruneBackups();
}

function pruneBackups(keep = 60) {
  const files = fs.readdirSync(backupDir)
    .filter((f) => f.startsWith('nkfms-data-') && f.endsWith('.json'))
    .sort();
  while (files.length > keep) {
    fs.unlinkSync(path.join(backupDir, files.shift()));
  }
}

function exportTo(targetPath) {
  fs.copyFileSync(dataFile, targetPath);
  return { ok: true, file: targetPath };
}

function importFrom(sourcePath) {
  const raw = fs.readFileSync(sourcePath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!parsed || !Array.isArray(parsed.flats) || !Array.isArray(parsed.payments)) {
    throw new Error('ফাইলটি বৈধ NKFMS ডেটা ফাইল নয়।');
  }
  // পুরোনো ব্যাকআপে লগইনের তথ্য না-ও থাকতে পারে; থাকলে সেটিই, নইলে বর্তমানগুলো
  // রাখা হয় — নইলে ব্যাকআপ ফেরানোর পর আর লগইন করা যেত না।
  if (!Array.isArray(parsed.users) || !parsed.users.length) {
    const current = load();
    parsed.users = Array.isArray(current.users) ? current.users : [];
    auth.ensureUsers(parsed);
  }
  backup();
  writeJson(dataFile, parsed);
  return parsed;
}

function paths() {
  return { dataFile, backupDir };
}

module.exports = { init, load, save, exportTo, importFrom, paths };
