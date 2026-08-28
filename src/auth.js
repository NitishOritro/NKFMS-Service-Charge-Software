'use strict';

/*
 * লগইন ব্যবস্থাপনা।
 *
 * পাসওয়ার্ড কখনোই হুবহু সংরক্ষণ করা হয় না। প্রতিটি ব্যবহারকারীর জন্য একটি
 * এলোমেলো "সল্ট" তৈরি করে scrypt দিয়ে পাসওয়ার্ডটিকে অপরিবর্তনীয় সংকেতে
 * (hash) রূপান্তর করে রাখা হয় — ডেটা ফাইল কেউ খুলে দেখলেও পাসওয়ার্ড পড়া যায় না।
 * মিলিয়ে দেখার সময় একই সল্ট দিয়ে আবার হিসাব করে দুটি সংকেত মেলানো হয়।
 */

const crypto = require('crypto');

const KEY_LENGTH = 64;
const DEFAULT_USER = 'nitish';
const DEFAULT_PASSWORD = 'nitish';

function normalize(username) {
  return String(username || '').trim().toLowerCase();
}

function hashPassword(password, salt) {
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), useSalt, KEY_LENGTH).toString('hex');
  return { salt: useSalt, hash };
}

/** সময়-নিরপেক্ষ তুলনা, যাতে উত্তর দিতে কত সময় লাগল তা থেকে কিছু আঁচ করা না যায় */
function matches(password, salt, hash) {
  let known;
  try {
    known = Buffer.from(String(hash), 'hex');
  } catch (err) {
    return false;
  }
  if (known.length !== KEY_LENGTH) return false;
  const test = crypto.scryptSync(String(password), String(salt), KEY_LENGTH);
  return crypto.timingSafeEqual(known, test);
}

function makeUser(username, password, name) {
  const { salt, hash } = hashPassword(password);
  return {
    id: 'u-' + crypto.randomBytes(6).toString('hex'),
    username: normalize(username),
    name: name || username,
    salt,
    hash,
    createdAt: new Date().toISOString()
  };
}

/**
 * ডেটায় ব্যবহারকারীর তালিকা আছে কিনা নিশ্চিত করে। না থাকলে প্রথম ব্যবহারকারী
 * তৈরি করে দেয়। কিছু বদলালে true ফেরত দেয়, যাতে ডাকা জায়গা থেকে সংরক্ষণ করা যায়।
 */
function ensureUsers(data) {
  if (!data || typeof data !== 'object') return false;
  if (Array.isArray(data.users) && data.users.length) return false;
  data.users = [makeUser(DEFAULT_USER, DEFAULT_PASSWORD, 'নীতিশ রঞ্জন ভৌমিক')];
  return true;
}

function findUser(data, username) {
  const key = normalize(username);
  return (data.users || []).find((u) => normalize(u.username) === key) || null;
}

/** @returns {{ok: true, user: {id, username, name}} | {ok: false, error: string}} */
function verify(data, username, password) {
  const user = findUser(data, username);
  if (!user || !matches(password, user.salt, user.hash)) {
    // কোন তথ্যটি ভুল তা না জানানোই নিরাপদ
    return { ok: false, error: 'ইউজার আইডি বা পাসওয়ার্ড মেলেনি।' };
  }
  return { ok: true, user: { id: user.id, username: user.username, name: user.name } };
}

/** পাসওয়ার্ড বদল — পুরোনো পাসওয়ার্ড মিললে তবেই */
function changePassword(data, username, currentPassword, newPassword) {
  const user = findUser(data, username);
  if (!user || !matches(currentPassword, user.salt, user.hash)) {
    return { ok: false, error: 'বর্তমান পাসওয়ার্ড মেলেনি।' };
  }
  const next = String(newPassword || '');
  if (next.length < 4) {
    return { ok: false, error: 'নতুন পাসওয়ার্ড অন্তত ৪ অক্ষরের হতে হবে।' };
  }
  const { salt, hash } = hashPassword(next);
  user.salt = salt;
  user.hash = hash;
  user.passwordChangedAt = new Date().toISOString();
  return { ok: true };
}

module.exports = { ensureUsers, verify, changePassword, DEFAULT_USER };
