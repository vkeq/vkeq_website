import { CONFIG, money, payoutsTotal, monthLabel, statValue } from './config.js';
import { W, H, ROOMS, FLOOR, WALL } from './map.js';
import { sfx } from './audio.js';
import { t, tr, getLang, setLang, onLangChange } from './i18n.js';
import { FACTS, randomFact } from './facts.js';
import { logoDataURL } from './logos.js';

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
  $('#panel-close').setAttribute('aria-label', t('close'));
  if (p.hidden) {
    p.hidden = false;
    onCloseCb = onClose || null;
    requestAnimationFrame(() => $('#panel-close').focus());
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
}

// ---------------- Content panels ----------------
export function controlsHTML() {
  if (matchMedia('(pointer: coarse)').matches) return `<div class="controls">${t('controlsTouch').map((l) => `<div>\u25B8 ${l}</div>`).join('')}</div>`;
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
  openPanel(
    t('performanceTitle'),
    `<div class="muted period">${esc(tr(p.period))}</div>
     <div class="stats" style="--cols:${p.stats.length % 3 === 0 || p.stats.length > 4 ? 3 : Math.min(p.stats.length, 2)}">${p.stats
       .map((s) => `<div class="stat ${esc(s.tone || '')}"><span>${esc(tr(s.label))}</span><b>${esc(statValue(s.value))}</b></div>`)
       .join('')}</div>
     <canvas class="equity" width="300" height="110" aria-label="${t('equityAria')}"></canvas>
     <h3>${t('payoutsTitle')}</h3>
     <div class="payouts">${p.payouts
       .map((x) => `<div><span>${esc(monthLabel(x.date))}</span><span>${esc(x.firm)}</span><b>${esc(money(x.amount))}</b></div>`)
       .join('')}
       <div class="total"><span></span><span>${t('payoutsTotal')}</span><b>${esc(money(payoutsTotal()))}</b></div>
     </div>
     <p class="disclaimer">${esc(tr(p.disclaimer))}</p>`,
    { onClose, wide: true, after: () => drawEquity($('#panel-body canvas.equity'), p.equity) },
  );
});

// Random market anecdote from an object in the world
export const showFact = panel((cat, fact = randomFact(cat), onAnother) => {
  const c = FACTS[cat];
  openPanel(
    tr(c.title),
    `<div class="fact">
       <div class="fact-ico">${c.icon}</div>
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
       <p>${esc(tr(s.desc))}</p>
       <a class="btn" href="${esc(s.url)}" target="_blank" rel="noopener">${t('open')} ${esc(s.label)} ↗</a>
     </div>`,
    { accent: s.color },
  );
});

export const showAllSocials = panel(() => {
  openPanel(
    t('portalTitle'),
    `<p>${t('portalBody')}</p>
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
  const icons = { bio: '📖', chest: '💰', portal: '🌀', welcome: '📜' };
  openPanel(
    t('menuTitle'),
    `<p>${t('menuBody')}</p>
     <div class="menu">${Object.keys(icons)
       .map((k) => `<button data-go="${k}"><span class="ico">${icons[k]}</span>${m[k]}</button>`)
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
  p.querySelector('kbd').hidden = touch;
  p.querySelector('span').textContent = text;
  p.style.transform = `translate(${Math.round(screen.x)}px, ${Math.round(screen.y)}px) translate(-50%, -100%)`;
}

// ---------------- Minimap (fog of war) ----------------
export function createMinimap(grid, items) {
  const c = $('#minimap');
  const S = 4;
  c.width = W * S;
  c.height = H * S;
  const g = c.getContext('2d');
  const seen = Array.from({ length: H }, () => new Array(W).fill(false));

  function reveal(px, pz, rad = 5) {
    for (let z = pz - rad; z <= pz + rad; z++)
      for (let x = px - rad; x <= px + rad; x++) if (seen[z] && x >= 0 && x < W && (x - px) ** 2 + (z - pz) ** 2 <= rad * rad) seen[z][x] = true;
  }
  function revealRoom(id) {
    const r = ROOMS.find((q) => q.id === id);
    if (!r) return;
    for (let z = r.z0 - 1; z <= r.z1 + 1; z++) for (let x = r.x0 - 1; x <= r.x1 + 1; x++) seen[z][x] = true;
  }
  function draw(px, pz, t) {
    g.clearRect(0, 0, c.width, c.height);
    for (let z = 0; z < H; z++)
      for (let x = 0; x < W; x++) {
        if (!seen[z][x]) continue;
        const v = grid.cells[z][x];
        if (v === FLOOR) {
          const rid = grid.room[z][x];
          g.fillStyle = rid ? ROOMS.find((q) => q.id === rid).color : '#55506e';
          g.globalAlpha = 0.55;
          g.fillRect(x * S, z * S, S, S);
          g.globalAlpha = 1;
        } else if (v === WALL) {
          g.fillStyle = '#211c30';
          g.fillRect(x * S, z * S, S, S);
        }
      }
    for (const it of items) {
      if (!seen[Math.round(it.z)]?.[Math.round(it.x)]) continue;
      g.fillStyle = '#ffe9a8';
      g.fillRect(Math.round(it.x * S + 1), Math.round(it.z * S + 1), 2, 2);
    }
    g.fillStyle = Math.floor(t * 4) % 2 ? '#ffffff' : '#3ddc84';
    g.fillRect(Math.round(px * S), Math.round(pz * S), S, S);
  }
  return { reveal, revealRoom, draw };
}
