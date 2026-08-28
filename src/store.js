'use strict';

const fs = require('fs');
const path = require('path');
const { buildSeed } = require('./seed');

let dataFile = null;
let backupDir = null;

function init(userDataDir) {
  dataFile = path.join(userDataDir, 'nkfms-data.json');
  backupDir = path.join(userDataDir, 'backups');
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    writeJson(dataFile, buildSeed());
  }
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
  backup();
  writeJson(dataFile, parsed);
  return parsed;
}

function paths() {
  return { dataFile, backupDir };
}

module.exports = { init, load, save, exportTo, importFrom, paths };
