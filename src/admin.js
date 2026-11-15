// Admin page: edit src/content.json with a form, preview it in the dungeon, then save
// (dev server) or publish (GitHub commit → automatic redeploy).
import './admin.css';
import original from './content.json';
import { drawEquity, flagCanvas } from './ui.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const DRAFT_KEY = 'vkeq-admin-draft';
const GH_KEY = 'vkeq-gh';
const MAX_SOCIALS = 6;

const load = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k) || 'null');
  } catch {
    return null;
  }
};
const store = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

let state = load(DRAFT_KEY) || structuredClone(original);
let dirty = JSON.stringify(state) !== JSON.stringify(original);

// ---------- path helpers ----------
const get = (path) => path.split('.').reduce((o, k) => o?.[k], state);
function set(path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const obj = keys.reduce((o, k) => (o[k] ??= {}), state);
  obj[last] = value;
}

// ---------- field builders ----------
const flag = (code) => `<span class="a-flag" data-flag="${code}"></span>`;
function field(label, path, { type = 'text', kind = '', rows = 0, ph = '', hint = '' } = {}) {
  let v = get(path);
  if (kind === 'paras') v = (v || []).join('\n\n');
  if (kind === 'numbers') v = (v || []).join(', ');
  const attrs = `data-path="${path}" data-kind="${kind}" data-type="${type}" placeholder="${esc(ph)}"`;
  const input = rows
    ? `<textarea rows="${rows}" ${attrs}>${esc(v)}</textarea>`
    : `<input type="${type}" value="${esc(v)}" ${attrs} ${type === 'number' ? 'step="any"' : ''}/>`;
  return `<label class="a-field"><span>${label}</span>${input}${hint ? `<small>${hint}</small>` : ''}</label>`;
}
function bi(label, path, opts = {}) {
  return `<div class="a-bi">
    ${field(`${flag('en')} ${label}`, path + '.en', opts)}
    ${field(`${flag('it')} ${label}`, path + '.it', opts)}
  </div>`;
}
function listTools(path, i, n) {
  return `<div class="a-tools">
    <button data-up="${path}" data-i="${i}" ${i === 0 ? 'disabled' : ''} title="Su">&#9650;</button>
    <button data-down="${path}" data-i="${i}" ${i === n - 1 ? 'disabled' : ''} title="Giù">&#9660;</button>
    <button data-del="${path}" data-i="${i}" class="del" title="Elimina">&#10005;</button>
  </div>`;
}
const section = (id, title, body, open = false) =>
  `<details class="a-sec" id="sec-${id}" ${open ? 'open' : ''}><summary>${title}</summary><div class="a-body">${body}</div></details>`;

const TEMPLATES = {
  'bio.facts': () => ({ label: { en: '', it: '' }, value: { en: '', it: '' } }),
  'performance.stats': () => ({ label: { en: '', it: '' }, value: '', tone: '' }),
  'performance.payouts': () => ({ firm: '', amount: 0, date: new Date().toISOString().slice(0, 7) }),
  socials: () => ({ id: 'link' + Date.now().toString(36), label: '', handle: '', url: 'https://', color: '#ffffff', desc: { en: '', it: '' } }),
};

// ---------- render ----------
const openSecs = new Set(['payouts']);
function render() {
  document.querySelectorAll('details.a-sec').forEach((d) => (d.open ? openSecs.add(d.id.slice(4)) : openSecs.delete(d.id.slice(4))));
  const p = state.performance;
  const total = p.payouts.reduce((a, x) => a + (Number(x.amount) || 0), 0);
  const cur = state.currency || 'USD';
  const fmt = money;

  const payouts = p.payouts
    .map(
      (x, i) => `<div class="a-item a-payout">
        ${field('Mese', `performance.payouts.${i}.date`, { type: 'month' })}
        ${field('Prop firm / broker', `performance.payouts.${i}.firm`, { ph: 'es. Prop Firm' })}
        ${field(`Importo (${cur})`, `performance.payouts.${i}.amount`, { type: 'number' })}
        ${listTools('performance.payouts', i, p.payouts.length)}
      </div>`,
    )
    .join('');

  const stats = p.stats
    .map(
      (s, i) => `<div class="a-item">
        ${bi('Etichetta', `performance.stats.${i}.label`)}
        <div class="a-bi">
          ${field('Valore', `performance.stats.${i}.value`, { ph: '+$48,250', hint: '<code>auto:payouts</code> = numero payout · <code>auto:payoutsTotal</code> = totale payout' })}
          <label class="a-field"><span>Colore</span>
            <select data-path="performance.stats.${i}.tone">
              ${[['', 'Normale'], ['good', 'Verde (positivo)'], ['bad', 'Rosso (negativo)']]
                .map(([v, l]) => `<option value="${v}" ${s.tone === v ? 'selected' : ''}>${l}</option>`)
                .join('')}
            </select></label>
        </div>
        ${listTools('performance.stats', i, p.stats.length)}
      </div>`,
    )
    .join('');

  const facts = state.bio.facts
    .map(
      (f, i) => `<div class="a-item">
        ${bi('Etichetta', `bio.facts.${i}.label`)}
        ${bi('Valore', `bio.facts.${i}.value`)}
        ${listTools('bio.facts', i, state.bio.facts.length)}
      </div>`,
    )
    .join('');

  const socials = state.socials
    .map(
      (s, i) => `<div class="a-item">
        <div class="a-bi three">
          ${field('Nome', `socials.${i}.label`, { ph: 'YouTube' })}
          ${field('Handle', `socials.${i}.handle`, { ph: '@vkeq' })}
          ${field('Colore cristallo', `socials.${i}.color`, { type: 'color' })}
        </div>
        ${field('Link', `socials.${i}.url`, { type: 'url', ph: 'https://' })}
        ${bi('Descrizione', `socials.${i}.desc`)}
        ${listTools('socials', i, state.socials.length)}
      </div>`,
    )
    .join('');

  $('#a-main').innerHTML = [
    section(
      'payouts',
      `Payout <em>${p.payouts.length} · ${fmt(total)}</em>`,
      `${payouts}<button class="a-add" data-add="performance.payouts">+ Aggiungi payout</button>`,
    ),
    section(
      'stats',
      'Statistiche',
      `${bi('Periodo', 'performance.period', { ph: 'Jan 2025 – Oct 2025' })}${stats}<button class="a-add" data-add="performance.stats">+ Aggiungi statistica</button>`,
    ),
    section(
      'equity',
      'Equity curve',
      `${field('Saldo cumulativo, un valore per giorno (separati da virgola o a capo)', 'performance.equity', { kind: 'numbers', rows: 5 })}
       <canvas id="a-eq" width="300" height="90"></canvas>
       <p class="muted">Puoi incollare direttamente una colonna da Excel / Google Sheets.</p>`,
    ),
    section('bio', 'Chi sono', `${field('Iniziale avatar', 'bio.avatarInitial')}${bi('Paragrafi (riga vuota = nuovo paragrafo)', 'bio.paragraphs', { kind: 'paras', rows: 7 })}<h3>Info rapide</h3>${facts}<button class="a-add" data-add="bio.facts">+ Aggiungi info</button>`),
    section(
      'socials',
      `Social <em>${state.socials.length}/${MAX_SOCIALS}</em>`,
      `${socials}${state.socials.length < MAX_SOCIALS ? '<button class="a-add" data-add="socials">+ Aggiungi social</button>' : '<p class="muted">Massimo 6 social (uno per piedistallo).</p>'}`,
    ),
    section(
      'general',
      'Generale',
      `<div class="a-bi">${field('Nome', 'name')}${field('Email contatti', 'contactEmail', { type: 'email' })}</div>
       ${bi('Sottotitolo', 'tagline')}
       <label class="a-field"><span>Valuta</span><select data-path="currency">${['USD', 'EUR', 'GBP']
         .map((c) => `<option ${cur === c ? 'selected' : ''}>${c}</option>`)
         .join('')}</select></label>
       ${bi('Disclaimer', 'performance.disclaimer', { rows: 3 })}`,
    ),
  ].join('');

  document.querySelectorAll('details.a-sec').forEach((d) => {
    if (openSecs.has(d.id.slice(4))) d.open = true;
  });
  document.querySelectorAll('.a-flag').forEach((el) => el.appendChild(flagCanvas(el.dataset.flag)));
  drawEquity($('#a-eq'), (state.performance.equity || []).map(Number).filter((n) => !Number.isNaN(n)));
  updateStatus();
}

// ---------- events ----------
$('#a-main').addEventListener('input', (e) => {
  const el = e.target.closest('[data-path]');
  if (!el) return;
  let v = el.value;
  const kind = el.dataset.kind;
  if (kind === 'paras') v = v.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  else if (kind === 'numbers')
    v = v
      .split(/[\s,;]+/)
      .map((s) => s.replace(/[^0-9.\-]/g, ''))
      .filter((s) => s !== '' && s !== '-')
      .map(Number);
  else if (el.dataset.type === 'number') v = v === '' ? 0 : Number(v);
  set(el.dataset.path, v);
  changed();
  if (el.dataset.path === 'currency') render();
  if (kind === 'numbers') drawEquity($('#a-eq'), v);
});
$('#a-main').addEventListener('change', (e) => {
  if (e.target.closest('[data-path]')) summaries();
});

// Update section headers (payout count / total) without rebuilding the form.
function summaries() {
  const p = state.performance;
  const total = p.payouts.reduce((a, x) => a + (Number(x.amount) || 0), 0);
  const em = document.querySelector('#sec-payouts summary em');
  if (em) em.textContent = `${p.payouts.length} · ${money(total)}`;
}
const money = (n) =>
  (Number(n) || 0).toLocaleString('it-IT', { style: 'currency', currency: state.currency || 'USD', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 });
$('#a-main').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const i = Number(b.dataset.i);
  if (b.dataset.add) {
    const path = b.dataset.add;
    get(path).push(TEMPLATES[path]());
    openSecs.add(b.closest('details').id.slice(4));
  } else if (b.dataset.del) {
    if (!confirm('Eliminare questa voce?')) return;
    get(b.dataset.del).splice(i, 1);
  } else if (b.dataset.up || b.dataset.down) {
    const list = get(b.dataset.up || b.dataset.down);
    const j = b.dataset.up ? i - 1 : i + 1;
    [list[i], list[j]] = [list[j], list[i]];
  } else return;
  changed();
  render();
});

function changed() {
  dirty = JSON.stringify(state) !== JSON.stringify(original);
  store(DRAFT_KEY, state);
  updateStatus();
}

let statusMsg = '';
function updateStatus(msg) {
  if (msg !== undefined) statusMsg = msg;
  const el = $('#a-status');
  el.innerHTML = statusMsg || (dirty ? 'Modifiche non pubblicate (salvate come bozza in questo browser).' : 'Nessuna modifica. I contenuti sono quelli online.');
  el.className = dirty ? 'dirty' : '';
}
const flash = (msg, ms = 6000) => {
  updateStatus(msg);
  setTimeout(() => updateStatus(''), ms);
};

function validate() {
  const errs = [];
  state.performance.payouts.forEach((p, i) => {
    if (!/^\d{4}-\d{2}$/.test(p.date)) errs.push(`Payout ${i + 1}: mese mancante`);
    if (!(Number(p.amount) >= 0)) errs.push(`Payout ${i + 1}: importo non valido`);
  });
  state.socials.forEach((s, i) => {
    if (!/^(https?:\/\/|mailto:)/.test(s.url)) errs.push(`Social ${i + 1}: il link deve iniziare con https://`);
  });
  if (!(state.performance.equity || []).length) errs.push('Equity curve vuota');
  if (errs.length) alert('Da sistemare prima di continuare:\n\n' + errs.join('\n'));
  return !errs.length;
}

// Preview: open the dungeon with the draft
$('#a-preview').addEventListener('click', () => {
  store(DRAFT_KEY, state);
  window.open('/?draft=1', 'vkeq-preview');
});

// Save to disk (only when running the local dev server)
fetch('/__admin/save', { method: 'GET' })
  .then((r) => {
    if (r.status === 204) $('#a-save').hidden = false;
  })
  .catch(() => {});
$('#a-save').addEventListener('click', async () => {
  if (!validate()) return;
  const r = await fetch('/__admin/save', { method: 'POST', body: JSON.stringify(state) });
  if (r.ok) {
    Object.assign(original, structuredClone(state));
    changed();
    flash('Salvato in <code>src/content.json</code>. Il sito in locale si è aggiornato.');
  } else flash('Errore nel salvataggio: ' + esc(await r.text()));
});

// Publish to GitHub (commit content.json)
const ghSettings = () => ({ repo: 'vkeq/vkeq_website', branch: 'main', path: 'src/content.json', token: '', ...(load(GH_KEY) || {}) });
function openGh() {
  const d = $('#a-gh');
  const s = ghSettings();
  for (const k of ['repo', 'branch', 'path', 'token']) d.querySelector(`[name=${k}]`).value = s[k] || '';
  d.showModal();
  return new Promise((res) =>
    d.addEventListener(
      'close',
      () => {
        if (d.returnValue === 'ok') {
          const v = {};
          for (const k of ['repo', 'branch', 'path', 'token']) v[k] = d.querySelector(`[name=${k}]`).value.trim();
          store(GH_KEY, v);
          res(true);
        } else res(false);
      },
      { once: true },
    ),
  );
}
const b64 = (str) => {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
};
$('#a-publish').addEventListener('click', async () => {
  if (!validate()) return;
  let s = ghSettings();
  if (!s.token && !(await openGh())) return;
  s = ghSettings();
  if (!s.token) return;
  if (!confirm(`Pubblicare le modifiche su ${s.repo} (${s.branch})?`)) return;
  updateStatus('Pubblicazione in corso…');
  const api = `https://api.github.com/repos/${s.repo}/contents/${s.path}`;
  const headers = { Authorization: `Bearer ${s.token}`, Accept: 'application/vnd.github+json' };
  try {
    const cur = await fetch(`${api}?ref=${encodeURIComponent(s.branch)}`, { headers });
    if (!cur.ok && cur.status !== 404) throw new Error(`lettura file: ${cur.status}`);
    const sha = cur.ok ? (await cur.json()).sha : undefined;
    const put = await fetch(api, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ message: 'Update site content from admin', content: b64(JSON.stringify(state, null, 2) + '\n'), branch: s.branch, sha }),
    });
    if (!put.ok) throw new Error(`${put.status} ${(await put.json().catch(() => ({}))).message || ''}`);
    Object.assign(original, structuredClone(state));
    changed();
    flash('Pubblicato! Il sito online si aggiornerà al prossimo deploy (di solito 1-2 minuti).', 10000);
  } catch (e) {
    flash('Pubblicazione non riuscita: ' + esc(e.message) + '. Controlla token e impostazioni GitHub.', 10000);
  }
});

// More menu
$('#a-more').addEventListener('click', (e) => {
  e.stopPropagation();
  $('#a-menu').hidden = !$('#a-menu').hidden;
});
document.addEventListener('click', () => ($('#a-menu').hidden = true));
$('#a-menu').addEventListener('click', async (e) => {
  const act = e.target.dataset.act;
  if (act === 'download') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
    a.download = 'content.json';
    a.click();
  } else if (act === 'import') $('#a-file').click();
  else if (act === 'reset') {
    if (!confirm('Annullare tutte le modifiche non pubblicate?')) return;
    state = structuredClone(original);
    changed();
    render();
  } else if (act === 'github') openGh();
});
$('#a-file').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (!data.performance || !data.bio) throw new Error('file non valido');
    state = data;
    changed();
    render();
    flash('JSON importato.');
  } catch (err) {
    alert('Impossibile importare: ' + err.message);
  }
  e.target.value = '';
});
window.addEventListener('beforeunload', (e) => {
  if (dirty) e.preventDefault();
});

render();
