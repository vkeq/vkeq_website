import { CONFIG, money, payoutsTotal, monthLabel, statValue } from './config.js';
import { W, H, ROOMS, FLOOR, WALL } from './map.js';
import { sfx } from './audio.js';
import { t, tr, getLang, setLang, onLangChange } from './i18n.js';
import { FACTS, randomFact } from './facts.js';
import { logoDataURL } from './logos.js';
import { loadKey, decryptToken, setSessionToken } from './adminkey.js';
import { device, onDeviceChange } from './device.js';
import { iconHTML } from './icons.js';

const logoHTML = (s, cls) => {
  const url = logoDataURL(s.icon || s.id);
  return url ? `<img class="${cls}" src="${url}" alt="" />` : cls === 'logo-big' ? '<div class="gem"></div>' : '<i></i>';
};

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// ---------------- Panels ----------------
let onCloseCb = null;
let lastFocus = null;
let rerender = null; // re-draws the open panel when the language changes

export function isPanelOpen() {
  return !$('#panel').hidden;
}

function openPanel(title, html, { onClose, wide = false, accent = '#f5c542', after } = {}) {
  const p = $('#panel');
  if (p.hidden) lastFocus = document.activeElement;
  $('#panel-title').textContent = title;
  $('#panel-body').innerHTML = html;
  p.querySelector('.panel-box').classList.toggle('wide', wide);
  p.style.setProperty('--accent', accent);
  if (p.hidden) resetSheet();
  $('#panel-close').setAttribute('aria-label', t('close'));
  if (p.hidden) {
    p.hidden = false;
    onCloseCb = onClose || null;
    requestAnimationFrame(() => p.querySelector('.panel-box').focus({ preventScroll: true })); // the dialog itself takes focus; Tab reaches its controls
  }
  after?.();
}

// Wrap a panel renderer so it re-renders itself on language change.
function panel(render) {
  return (...args) => {
    rerender = () => render(...args);
    render(...args);
  };
}

export function closePanel() {
  const p = $('#panel');
  if (p.hidden) return;
  p.hidden = true;
  rerender = null;
  sfx.close();
  const cb = onCloseCb;
  onCloseCb = null;
  cb?.();
  lastFocus?.focus?.();
}

export function initPanel() {
  $('#panel-close').addEventListener('click', closePanel);
  $('#panel').addEventListener('pointerdown', (e) => {
    if (e.target.id === 'panel') closePanel();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });
  onLangChange(() => rerender?.());
  // switching between touch and mouse redraws the open panel (controls help differs);
  // rotating the phone does not, so a half-typed password is never lost
  let input = device.input;
  onDeviceChange(() => {
    if (device.input === input) return;
    input = device.input;
    if (!$('#admin-login')) rerender?.();
  });
  initSheetSwipe();
}

// Phones show panels as a bottom sheet: drag the header down to close it.
// The sheet follows the finger 1:1, the backdrop fades with it, and on release it either
// leaves (dragged past 30% of its height, at most 140px, or flicked down) or snaps back fast.
const SHEET_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'; // steep start, gentle settle (iOS sheet curve)
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function initSheetSwipe() {
  const p = $('#panel');
  const box = p.querySelector('.panel-box');
  const head = p.querySelector('.panel-head');
  let y0 = null;
  let dy = 0;
  let lastY = 0;
  let lastT = 0;
  let speed = 0; // px per ms, downwards positive
  const setDrag = (y) => {
    box.style.transform = y ? `translateY(${Math.round(y)}px)` : '';
    // backdrop fades as the sheet leaves
    const k = Math.max(0, 1 - y / (box.offsetHeight || 1));
    p.style.backgroundColor = y ? `rgba(5, 3, 10, ${(0.55 * k).toFixed(3)})` : '';
  };
  head.addEventListener('pointerdown', (e) => {
    if (!device.phone || device.orient !== 'portrait' || e.target.closest('button')) return;
    y0 = e.clientY;
    dy = 0;
    speed = 0;
    lastY = e.clientY;
    lastT = e.timeStamp;
    box.style.transition = 'none'; // catch the sheet even mid-animation
    head.setPointerCapture?.(e.pointerId);
  });
  head.addEventListener('pointermove', (e) => {
    if (y0 === null) return;
    const raw = e.clientY - y0;
    // past the top it resists instead of moving freely
    dy = raw >= 0 ? raw : raw * 0.15;
    const dt = e.timeStamp - lastT;
    if (dt > 0) speed = 0.7 * ((e.clientY - lastY) / dt) + 0.3 * speed;
    lastY = e.clientY;
    lastT = e.timeStamp;
    setDrag(dy);
  });
  const end = (e) => {
    if (y0 === null) return;
    y0 = null;
    // a finger that stopped before lifting is not a flick
    if (e.timeStamp - lastT > 100) speed = 0;
    const leave = dy > Math.min(box.offsetHeight * 0.3, 140) || (speed > 0.5 && dy > 16);
    if (reducedMotion()) {
      box.style.transition = '';
      setDrag(0);
      if (leave) closePanel();
      return;
    }
    if (leave) {
      box.style.transition = `transform 200ms ${SHEET_EASE}`;
      p.style.transition = 'background-color 200ms linear';
      box.style.transform = 'translateY(100%)';
      p.style.backgroundColor = 'rgba(5, 3, 10, 0)';
      setTimeout(() => {
        closePanel();
        resetSheet();
      }, 200);
    } else {
      box.style.transition = `transform 240ms ${SHEET_EASE}`;
      p.style.transition = 'background-color 240ms linear';
      setDrag(0);
    }
  };
  head.addEventListener('pointerup', end);
  head.addEventListener('pointercancel', end);
}
// clears whatever a swipe left on the panel (called when a panel opens or closes)
function resetSheet() {
  const p = $('#panel');
  const box = p.querySelector('.panel-box');
  box.style.transform = '';
  box.style.transition = '';
  p.style.transition = '';
  p.style.backgroundColor = '';
}

// ---------------- Content panels ----------------
export function controlsHTML() {
  if (device.touch) return `<div class="controls">${t('controlsTouch').map((l) => `<div>\u25B8 ${l}</div>`).join('')}</div>`;
  const c = t('controls');
  return `<div class="controls">
      <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> <kbd>←</kbd><kbd>→</kbd> ${c[0]}</div>
      <div><kbd>CLICK</kbd> ${c[1]}</div>
      <div><kbd>E</kbd> <kbd>SPACE</kbd> ${c[2]}</div>
      <div><kbd>SHIFT</kbd> ${c[3]} &nbsp; <kbd>M</kbd> ${c[4]}</div>
    </div>`;
}

export const showWelcome = panel(() => {
  openPanel(
    t('welcomeTitle'),
    `<p class="lead">${t('welcomeLead')(esc(CONFIG.name))}</p>
     <p>${t('welcomeBody')}</p>
     <ul class="rooms">${t('welcomeRooms')
       .map(([c, name, d]) => `<li><span style="color:${c}">${name}</span> ${d}</li>`)
       .join('')}</ul>
     ${controlsHTML()}`,
  );
});

export const showBio = panel(() => {
  const b = CONFIG.bio;
  openPanel(
    t('aboutTitle'),
    `<div class="bio-head">
       <div class="avatar">${esc(b.avatarInitial)}</div>
       <div><div class="big">${esc(CONFIG.name)}</div><div class="muted">${esc(tr(CONFIG.tagline))}</div></div>
     </div>
     ${(tr(b.paragraphs) || []).map((p) => `<p>${esc(p)}</p>`).join('')}
     <div class="facts">${b.facts.map((f) => `<div><span>${esc(tr(f.label))}</span><b>${esc(tr(f.value))}</b></div>`).join('')}</div>`,
    { accent: '#e0a96d' },
  );
});

export const showPerformance = panel((onClose) => {
  const p = CONFIG.performance;
  const hasCurve = (p.equity || []).length > 1;
  const payouts = p.payouts || [];
  openPanel(
    t('performanceTitle'),
    `<div class="muted period">${esc(tr(p.period))}</div>
     <div class="stats" style="--cols:${p.stats.length % 3 === 0 || p.stats.length > 4 ? 3 : Math.min(p.stats.length, 2)}">${p.stats
       .map((s) => `<div class="stat ${esc(s.tone || '')}"><span>${esc(tr(s.label))}</span><b>${esc(statValue(s.value))}</b></div>`)
       .join('')}</div>
     ${hasCurve ? `<canvas class="equity" width="300" height="110" role="img" aria-label="${t('equityAria')}"></canvas>` : ''}
     <h3>${t('payoutsTitle')}</h3>
     ${
       payouts.length
         ? `<div class="payouts">${payouts
       .map(
         (x) =>
           `<div>${iconHTML('coin')}<span class="p-date">${esc(monthLabel(x.date))}</span><span class="p-firm">${esc(x.firm)}</span><b class="p-amt">${esc(money(x.amount))}</b></div>`,
       )
       .join('')}
       <div class="total">${iconHTML('chest')}<span class="p-date"></span><span class="p-firm">${t('payoutsTotal')}</span><b class="p-amt">${esc(money(payoutsTotal()))}</b></div>
     </div>`
         : `<p class="muted empty">${t('payoutsEmpty')}</p>`
     }
     <p class="disclaimer">${esc(tr(p.disclaimer))}</p>`,
    { onClose, wide: true, after: () => hasCurve && drawEquity($('#panel-body canvas.equity'), p.equity) },
  );
});

// Random market anecdote from an object in the world
export const showFact = panel((cat, fact = randomFact(cat), onAnother) => {
  const c = FACTS[cat];
  openPanel(
    tr(c.title),
    `<div class="fact">
       <div class="fact-ico">${iconHTML(c.icon)}</div>
       <p>${esc(tr(fact))}</p>
     </div>
     <button class="btn-row" id="fact-next">${t('another')} &raquo;</button>`,
    {
      accent: '#5ad1ff',
      after: () =>
        $('#fact-next').addEventListener('click', () => {
          onAnother?.();
          showFact(cat, randomFact(cat), onAnother);
        }),
    },
  );
});

export const showSocial = panel((s) => {
  openPanel(
    s.label,
    `<div class="social-one" style="--c:${esc(s.color)}">
       ${logoHTML(s, 'logo-big')}
       <div class="big">${esc(s.handle)}</div>
       <a class="btn" href="${esc(s.url)}" target="_blank" rel="noopener">${t('open')} ${esc(s.label)} ↗</a>
     </div>`,
    { accent: s.color },
  );
});

export const showAllSocials = panel(() => {
  openPanel(
    t('portalTitle'),
    `<p>${t(CONFIG.socials.length ? 'portalBody' : 'portalEmpty')}</p>
     <div class="social-list">${CONFIG.socials
       .map(
         (s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener" style="--c:${esc(s.color)}">
            ${logoHTML(s, 'logo-small')}<span><b>${esc(s.label)}</b><small>${esc(s.handle)}</small></span><em>↗</em></a>`,
       )
       .join('')}</div>
     ${CONFIG.contactEmail ? `<p class="muted">${t('contact')}: <a href="mailto:${esc(CONFIG.contactEmail)}">${esc(CONFIG.contactEmail)}</a></p>` : ''}`,
    { accent: '#b48cff' },
  );
});

export const showMenu = panel((go) => {
  const m = t('menuItems');
  const icons = { bio: 'book', chest: 'chest', portal: 'portal', welcome: 'scroll' };
  openPanel(
    t('menuTitle'),
    `<p>${t('menuBody')}</p>
     <div class="menu">${Object.keys(icons)
       .map((k) => `<button data-go="${k}">${iconHTML(icons[k])}${m[k]}</button>`)
       .join('')}</div>
     <p class="muted">${t('menuHint')}</p>`,
    {
      after: () =>
        $('#panel-body')
          .querySelectorAll('button[data-go]')
          .forEach((b) =>
            b.addEventListener('click', () => {
              closePanel();
              go(b.dataset.go);
            }),
          ),
    },
  );
});

// Admin login: the password decrypts the publishing token, then the admin page opens.
export const showAdminLogin = panel(() => {
  const adminUrl = import.meta.env.BASE_URL + 'admin.html';
  openPanel(
    t('adminTitle'),
    `<form class="admin-login" id="admin-login">
       <p>${t('adminBody')}</p>
       <label for="admin-pass">${t('adminPassword')}</label>
       <input id="admin-pass" type="password" autocomplete="current-password" required />
       <p class="admin-msg" id="admin-msg" role="status"></p>
       <button class="btn-row" type="submit">${t('adminEnter')} &raquo;</button>
     </form>`,
    {
      accent: '#f5c542',
      after: () => {
        const input = $('#admin-pass');
        setTimeout(() => input.focus(), 50);
        $('#admin-login').addEventListener('submit', async (e) => {
          e.preventDefault();
          const msg = $('#admin-msg');
          msg.textContent = t('adminChecking');
          const key = await loadKey();
          if (!key) {
            msg.innerHTML = `${t('adminNotSetup')} <a href="${adminUrl}">${t('adminOpen')}</a>`;
            return;
          }
          try {
            setSessionToken(await decryptToken(key, input.value));
            location.href = adminUrl;
          } catch {
            msg.textContent = t('adminWrong');
            input.select();
          }
        });
      },
    },
  );
});

// Pixel-art equity chart
export function drawEquity(canvas, data) {
  if (!canvas || !data?.length) return;
  const g = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  g.fillStyle = '#0b0f14';
  g.fillRect(0, 0, w, h);
  const pad = 8;
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const Y = (v) => Math.round(h - pad - ((v - lo) / (hi - lo || 1)) * (h - pad * 2));
  g.fillStyle = '#16202a';
  for (let y = pad; y < h; y += 16) g.fillRect(0, y, w, 1);
  for (let x = 0; x < w; x += 25) g.fillRect(x, 0, 1, h);
  let prev = null;
  for (let x = 0; x < w; x++) {
    const f = (x / (w - 1)) * (data.length - 1);
    const i = Math.floor(f);
    const v = data[i] + (data[Math.min(i + 1, data.length - 1)] - data[i]) * (f - i);
    const y = Y(v);
    g.fillStyle = 'rgba(61,220,132,0.18)';
    for (let yy = y + 2; yy < h; yy++) if ((x + yy) % 3 === 0) g.fillRect(x, yy, 1, 1);
    g.fillStyle = '#3ddc84';
    const a = prev === null ? y : Math.min(prev, y);
    const b = prev === null ? y : Math.max(prev, y);
    g.fillRect(x, a, 1, b - a + 2);
    prev = y;
  }
  g.fillStyle = '#ffe9a8';
  g.fillRect(w - 4, Y(data[data.length - 1]) - 1, 4, 4);
}

// ---------------- Pixel flags ----------------
// 12x8 pixel art, drawn into a canvas and scaled with image-rendering: pixelated.
const FLAGS = {
  it: (x) => (x < 4 ? '#009246' : x < 8 ? '#f1f2f1' : '#ce2b37'),
  en: (x, y) => {
    // simplified Union Jack
    const r = '#cf142b';
    const w = '#ffffff';
    const b = '#00247d';
    if (y === 3 || y === 4 || x === 5 || x === 6) return r;
    if (y === 2 || y === 5 || x === 4 || x === 7) return w;
    const d1 = Math.abs(x * (8 / 12) - y);
    const d2 = Math.abs((11 - x) * (8 / 12) - y);
    if (d1 < 0.5 || d2 < 0.5) return r;
    if (d1 < 1.1 || d2 < 1.1) return w;
    return b;
  },
};

export function flagCanvas(code) {
  const c = document.createElement('canvas');
  c.width = 12;
  c.height = 8;
  const g = c.getContext('2d');
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 12; x++) {
      g.fillStyle = FLAGS[code](x, y);
      g.fillRect(x, y, 1, 1);
    }
  c.className = 'flag';
  return c;
}

export function initLangSwitch() {
  const box = $('#lang');
  box.innerHTML = '';
  for (const code of ['en', 'it']) {
    const b = document.createElement('button');
    b.dataset.lang = code;
    b.title = code === 'en' ? 'English' : 'Italiano';
    b.setAttribute('aria-label', b.title);
    b.appendChild(flagCanvas(code));
    const s = document.createElement('span');
    s.textContent = code.toUpperCase();
    b.appendChild(s);
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      setLang(code);
      sfx.ui();
    });
    box.appendChild(b);
  }
  const sync = () => box.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.lang === getLang()));
  sync();
  onLangChange(sync);
}

// ---------------- HUD ----------------
let currentRoomId = 'entrance';
export function initHUD() {
  const render = () => {
    $('#hud-name').textContent = CONFIG.name;
    $('#hud-tag').textContent = tr(CONFIG.tagline);
    $('#hud-room').textContent = t('rooms.' + currentRoomId);
    $('#btn-menu').textContent = t('menu');
    $('#btn-music').title = t('music');
    $('#btn-sfx').title = t('effects');
  };
  render();
  onLangChange(render);
}

let toastTimer = 0;
export function roomToast(id) {
  currentRoomId = id;
  const name = t('rooms.' + id);
  const el = $('#room-toast');
  el.textContent = `~ ${name} ~`;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  $('#hud-room').textContent = name;
}

export function setPrompt(text, screen, touch) {
  const p = $('#prompt');
  if (!text) {
    p.hidden = true;
    return;
  }
  p.hidden = false;
  const kbd = p.querySelector('kbd');
  const key = touch ? 'A' : 'E';
  if (kbd.textContent !== key) kbd.textContent = key;
  const span = p.querySelector('span');
  if (span.textContent !== text) span.textContent = text;
  const tr = `translate(${Math.round(screen.x)}px, ${Math.round(screen.y)}px) translate(-50%, -100%)`;
  if (p.style.transform !== tr) p.style.transform = tr;
}

// ---------------- Minimap (fog of war) ----------------
const FACE = ['HHHHHHHH', 'HHHHHHHH', 'HSSSSSSH', 'SGLGGLGS', 'SSSDDSSS', 'SSSSSSSS', 'SSMMMMSS', 'DDDDDDDD'];
const FACE_COLORS = { H: '#2a1a10', S: '#e7b183', D: '#c98f62', G: '#0a0a10', L: '#6fe0ff', M: '#8a4a3a' };
export function createMinimap(grid, items) {
  const c = $('#minimap');
  const S = 4;
  c.width = W * S;
  c.height = H * S;
  const g = c.getContext('2d');
  // explored map is drawn once into an offscreen layer and only redrawn when it changes
  const base = document.createElement('canvas');
  base.width = c.width;
  base.height = c.height;
  const bg = base.getContext('2d');
  const roomColor = Object.fromEntries(ROOMS.map((r) => [r.id, r.color]));
  const seen = Array.from({ length: H }, () => new Array(W).fill(false));
  let dirty = true;

  const see = (x, z) => {
    if (seen[z] && x >= 0 && x < W && !seen[z][x]) {
      seen[z][x] = true;
      dirty = true;
    }
  };
  function reveal(px, pz, rad = 5) {
    for (let z = pz - rad; z <= pz + rad; z++) for (let x = px - rad; x <= px + rad; x++) if ((x - px) ** 2 + (z - pz) ** 2 <= rad * rad) see(x, z);
  }
  function revealRoom(id) {
    const r = ROOMS.find((q) => q.id === id);
    if (!r) return;
    for (let z = r.z0 - 1; z <= r.z1 + 1; z++) for (let x = r.x0 - 1; x <= r.x1 + 1; x++) see(x, z);
  }
  function redrawBase() {
    bg.clearRect(0, 0, base.width, base.height);
    for (let z = 0; z < H; z++)
      for (let x = 0; x < W; x++) {
        if (!seen[z][x]) continue;
        const v = grid.cells[z][x];
        if (v === FLOOR) {
          const rid = grid.room[z][x];
          bg.fillStyle = rid ? roomColor[rid] : '#55506e';
          bg.globalAlpha = 0.55;
          bg.fillRect(x * S, z * S, S, S);
          bg.globalAlpha = 1;
        } else if (v === WALL) {
          bg.fillStyle = '#211c30';
          bg.fillRect(x * S, z * S, S, S);
        }
      }
    bg.fillStyle = '#ffe9a8';
    for (const it of items) if (seen[Math.round(it.z)]?.[Math.round(it.x)]) bg.fillRect(Math.round(it.x * S + 1), Math.round(it.z * S + 1), 2, 2);
    dirty = false;
  }
  function draw(px, pz, t) {
    if (dirty) redrawBase();
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(base, 0, 0);
    // player marker: the character's pixel face, like a block-game skin seen from the front
    const P = 2; // canvas pixels per face pixel
    const fx = Math.round(px * S + S / 2 - 4 * P);
    const fy = Math.round(pz * S + S / 2 - 4 * P) + (Math.floor(t * 2) % 2 ? 0 : -1);
    g.fillStyle = '#000';
    g.fillRect(fx - 1, fy - 1, 8 * P + 2, 8 * P + 2);
    FACE.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        g.fillStyle = FACE_COLORS[ch];
        g.fillRect(fx + x * P, fy + y * P, P, P);
      }),
    );
  }
  return { reveal, revealRoom, draw };
}
