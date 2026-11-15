// Password login for the admin on a static site.
// The GitHub token that can publish the site is stored in the repo ONLY in encrypted form
// (public/admin-key.json, AES-GCM with a key derived from the admin password via PBKDF2).
// The right password decrypts the token in the browser; nothing secret is ever stored in clear.

const ITER = 600000;
const enc = new TextEncoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(password, salt, iter) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function encryptToken(token, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, ITER);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(token));
  return { v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), data: b64(data) };
}

// Throws if the password is wrong.
export async function decryptToken(blob, password) {
  const key = await deriveKey(password, unb64(blob.salt), blob.iter);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(blob.iv) }, key, unb64(blob.data));
  return new TextDecoder().decode(plain);
}

export const KEY_PATH = 'public/admin-key.json'; // path inside the repository
export const SESSION_TOKEN = 'vkeq-admin-token'; // sessionStorage key: token for this browser tab only

// The encrypted key as published with the site, or null if the admin has not set a password yet.
export async function loadKey() {
  try {
    const r = await fetch(import.meta.env.BASE_URL + 'admin-key.json', { cache: 'no-store' });
    if (!r.ok) return null;
    const j = await r.json();
    return j && j.data ? j : null;
  } catch {
    return null;
  }
}

export function setSessionToken(token) {
  try {
    if (token) sessionStorage.setItem(SESSION_TOKEN, token);
    else sessionStorage.removeItem(SESSION_TOKEN);
  } catch {}
}
export function getSessionToken() {
  try {
    return sessionStorage.getItem(SESSION_TOKEN) || '';
  } catch {
    return '';
  }
}
