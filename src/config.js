// Site content lives in src/content.json and is edited through the admin page (/admin.html).
// When the admin clicks "Preview", the draft is stored in localStorage and the site is opened
// with ?draft=1 so the changes can be checked before publishing.
import content from './content.json';
import { locale } from './i18n.js';

function loadDraft() {
  try {
    if (new URLSearchParams(location.search).has('draft')) {
      const raw = JSON.parse(localStorage.getItem('vkeq-admin-draft') || 'null');
      const d = raw?.data || raw;
      if (d && d.performance) return d;
    }
  } catch {}
  return null;
}

export const CONFIG = loadDraft() || content;
export const IS_DRAFT = CONFIG !== content;

export function money(n, { sign = false } = {}) {
  const v = Number(n) || 0;
  const s = Math.abs(v).toLocaleString(locale(), { style: 'currency', currency: CONFIG.currency || 'USD', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 });
  return (sign ? (v >= 0 ? '+' : '-') : v < 0 ? '-' : '') + s;
}

export function payoutsTotal() {
  return CONFIG.performance.payouts.reduce((a, p) => a + (Number(p.amount) || 0), 0);
}

// "2025-03" → "Mar 2025" in the current language
export function monthLabel(ym) {
  const [y, m] = String(ym).split('-').map(Number);
  if (!y || !m) return String(ym);
  return new Date(y, m - 1, 1).toLocaleDateString(locale(), { month: 'short', year: 'numeric' });
}

// Stat values: "auto:payouts" / "auto:payoutsTotal" are computed from the payout list.
export function statValue(v) {
  if (v === 'auto:payouts') return String(CONFIG.performance.payouts.length);
  if (v === 'auto:payoutsTotal') return money(payoutsTotal());
  return v;
}
