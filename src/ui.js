import { CONFIG } from './config.js';
import { W, H, ROOMS, FLOOR, WALL } from './map.js';
import { sfx } from './audio.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// ---------------- Panels ----------------
let onCloseCb = null;
let lastFocus = null;

export function isPanelOpen() {
  return !$('#panel').hidden;
}

export function openPanel(title, html, { onClose, wide = false, accent = '#f5c542' } = {}) {
  const p = $('#panel');
  lastFocus = document.activeElement;
  $('#panel-title').textContent = title;
  $('#panel-body').innerHTML = html;
  p.querySelector('.panel-box').classList.toggle('wide', wide);
  p.style.setProperty('--accent', accent);
  p.hidden = false;
  onCloseCb = onClose || null;
  sfx.open();
  requestAnimationFrame(() => $('#panel-close').focus());
}

export function closePanel() {
  const p = $('#panel');
  if (p.hidden) return;
  p.hidden = true;
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
}

// ---------------- Content panels ----------------
export function showWelcome() {
  openPanel(
    'Bacheca',
    `<p class="lead">Benvenuto nel dungeon di <b>${esc(CONFIG.name)}</b>, viandante.</p>
     <p>Ogni stanza custodisce un pezzo del mio mondo da trader. Esplora, avvicinati agli oggetti che brillano e interagisci.</p>
     <ul class="rooms">
       <li><span style="color:#e0a96d">◀ Biblioteca</span> chi sono e come opero</li>
       <li><span style="color:#f5c542">▲ Sala del Tesoro</span> performance e P&amp;L</li>
       <li><span style="color:#b48cff">▶ Sala dei Portali</span> social e contatti</li>
     </ul>
     ${controlsHTML()}`,
  );
}

export function controlsHTML() {
  return `<div class="controls">
      <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / frecce &nbsp;muoviti</div>
      <div><kbd>Click</kbd> / tap &nbsp;vai lì</div>
      <div><kbd>E</kbd> / <kbd>Spazio</kbd> &nbsp;interagisci</div>
      <div><kbd>Shift</kbd> &nbsp;corri &nbsp; <kbd>M</kbd> &nbsp;menu</div>
    </div>`;
}

export function showBio() {
  const b = CONFIG.bio;
  openPanel(
    b.title,
    `<div class="bio-head">
       <div class="avatar">${esc(b.avatarInitial)}</div>
       <div><div class="big">${esc(CONFIG.name)}</div><div class="muted">${esc(CONFIG.tagline)}</div></div>
     </div>
     ${b.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
     <div class="facts">${b.facts.map((f) => `<div><span>${esc(f.label)}</span><b>${esc(f.value)}</b></div>`).join('')}</div>`,
    { accent: '#e0a96d' },
  );
}

export function showPerformance(onClose) {
  const p = CONFIG.performance;
  openPanel(
    p.title,
    `<div class="muted period">${esc(p.period)}</div>
     <div class="stats">${p.stats
       .map((s) => `<div class="stat ${s.good ? 'good' : ''} ${s.bad ? 'bad' : ''}"><span>${esc(s.label)}</span><b>${esc(s.value)}</b></div>`)
       .join('')}</div>
     <canvas class="equity" width="300" height="110" aria-label="Curva di equity"></canvas>
     <h3>Payout</h3>
     <div class="payouts">${p.payouts
       .map((x) => `<div><span>${esc(x.date)}</span><span>${esc(x.firm)}</span><b>${esc(x.amount)}</b></div>`)
       .join('')}</div>
     <p class="disclaimer">${esc(p.disclaimer)}</p>`,
    { onClose, wide: true },
  );
  drawEquity($('#panel-body canvas.equity'), p.equity);
}

export function showEquity() {
  const p = CONFIG.performance;
  const first = p.equity[0];
  const last = p.equity[p.equity.length - 1];
  const peak = Math.max(...p.equity);
  openPanel(
    'Equity curve',
    `<div class="muted period">${esc(p.period)}</div>
     <canvas class="equity big" width="300" height="140" aria-label="Curva di equity"></canvas>
     <div class="stats three">
       <div class="stat good"><span>Saldo finale</span><b>${fmt(last - first)}</b></div>
       <div class="stat"><span>Picco</span><b>${fmt(peak)}</b></div>
       <div class="stat"><span>Giorni</span><b>${p.equity.length}</b></div>
     </div>
     <p class="disclaimer">${esc(p.disclaimer)}</p>`,
    { wide: true, accent: '#5ad1ff' },
  );
  drawEquity($('#panel-body canvas.equity'), p.equity);
}

const fmt = (v) => (v >= 0 ? '+$' : '-$') + Math.abs(Math.round(v)).toLocaleString('it-IT');

export function showSocial(s) {
  openPanel(
    s.label,
    `<div class="social-one" style="--c:${esc(s.color)}">
       <div class="gem"></div>
       <div class="big">${esc(s.handle)}</div>
       <p>${esc(s.desc || '')}</p>
       <a class="btn" href="${esc(s.url)}" target="_blank" rel="noopener">Apri ${esc(s.label)} ↗</a>
     </div>`,
    { accent: s.color },
  );
}

export function showAllSocials() {
  openPanel(
    'Portale dei social',
    `<p>Il portale si apre su tutti i miei mondi. Scegli dove andare:</p>
     <div class="social-list">${CONFIG.socials
       .map(
         (s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener" style="--c:${esc(s.color)}">
            <i></i><span><b>${esc(s.label)}</b><small>${esc(s.handle)}</small></span><em>↗</em></a>`,
       )
       .join('')}</div>
     ${CONFIG.contactEmail ? `<p class="muted">Contatti: <a href="mailto:${esc(CONFIG.contactEmail)}">${esc(CONFIG.contactEmail)}</a></p>` : ''}`,
    { accent: '#b48cff' },
  );
}

export function showMenu(go) {
  openPanel(
    'Menu',
    `<p>Non hai voglia di esplorare? Vai dritto al punto:</p>
     <div class="menu">
       <button data-go="bio">📖 Chi sono</button>
       <button data-go="chest">💰 Performance</button>
       <button data-go="equity">📈 Equity curve</button>
       <button data-go="portal">🌀 Social</button>
       <button data-go="welcome">📜 Comandi</button>
     </div>
     <p class="muted">Suggerimento: clicca un pulsante e il tuo personaggio ti ci porta.</p>`,
  );
  $('#panel-body').querySelectorAll('button[data-go]').forEach((b) =>
    b.addEventListener('click', () => {
      closePanel();
      go(b.dataset.go);
    }),
  );
}

// Pixel-art equity chart
export function drawEquity(canvas, data) {
  if (!canvas || !data?.length) return;
  const g = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  g.imageSmoothingEnabled = false;
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
    const v = data[i] + ((data[Math.min(i + 1, data.length - 1)] - data[i]) * (f - i));
    const y = Y(v);
    // dithered fill under the curve
    for (let yy = y + 2; yy < h; yy++) if ((x + yy) % 3 === 0) {
      g.fillStyle = 'rgba(61,220,132,0.18)';
      g.fillRect(x, yy, 1, 1);
    }
    g.fillStyle = '#3ddc84';
    const a = prev === null ? y : Math.min(prev, y);
    const b = prev === null ? y : Math.max(prev, y);
    g.fillRect(x, a, 1, b - a + 2);
    prev = y;
  }
  g.fillStyle = '#ffe9a8';
  g.fillRect(w - 4, Y(data[data.length - 1]) - 1, 4, 4);
}

// ---------------- HUD ----------------
export function initHUD() {
  $('#hud-name').textContent = CONFIG.name;
  $('#hud-tag').textContent = CONFIG.tagline;
}

let toastTimer = 0;
export function roomToast(name) {
  const t = $('#room-toast');
  t.textContent = `~ ${name} ~`;
  t.classList.remove('show');
  void t.offsetWidth;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  $('#hud-room').textContent = name;
}

export function setPrompt(text, screen) {
  const p = $('#prompt');
  if (!text) {
    p.hidden = true;
    return;
  }
  p.hidden = false;
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
