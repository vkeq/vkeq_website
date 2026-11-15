// All sound is synthesised with WebAudio: no audio files to load.
// - Generative ambient music (soft piano + pads, original composition)
// - Sound effects per room, per object and per floor surface
// - Ambient emitters: torch crackle and portal hum, by distance

let ctx = null;
let master, musicBus, sfxBus, reverb, noiseBuf;
const prefs = { music: true, sfx: true };
try {
  const saved = JSON.parse(localStorage.getItem('vkeq-audio') || 'null');
  if (saved) Object.assign(prefs, saved);
} catch {}

const savePrefs = () => {
  try {
    localStorage.setItem('vkeq-audio', JSON.stringify(prefs));
  } catch {}
};

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    ctx = null;
    return;
  }
  master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);
  musicBus = ctx.createGain();
  musicBus.gain.value = prefs.music ? 0.55 : 0;
  sfxBus = ctx.createGain();
  sfxBus.gain.value = prefs.sfx ? 1 : 0;
  musicBus.connect(master);
  sfxBus.connect(master);

  // Shared reverb (generated impulse response)
  reverb = ctx.createConvolver();
  const len = ctx.sampleRate * 4;
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  reverb.buffer = ir;
  const wet = ctx.createGain();
  wet.gain.value = 0.6;
  const darken = ctx.createBiquadFilter(); // stone absorbs the highs
  darken.type = 'lowpass';
  darken.frequency.value = 3200;
  reverb.connect(darken).connect(wet).connect(master);

  // Stone dungeon acoustics for every sound effect: reverb send + short echo (slapback)
  const sfxWet = ctx.createGain();
  sfxWet.gain.value = 0.45;
  sfxBus.connect(sfxWet).connect(reverb);
  const echo = ctx.createDelay(1);
  echo.delayTime.value = 0.13;
  const fb = ctx.createGain();
  fb.gain.value = 0.28;
  const echoLp = ctx.createBiquadFilter();
  echoLp.type = 'lowpass';
  echoLp.frequency.value = 1800;
  const echoOut = ctx.createGain();
  echoOut.gain.value = 0.35;
  sfxBus.connect(echo);
  echo.connect(echoLp).connect(fb).connect(echo);
  echoLp.connect(echoOut).connect(master);

  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  startMusic();
}

export const audioPrefs = () => ({ ...prefs });
export function toggleMusic() {
  prefs.music = !prefs.music;
  savePrefs();
  if (ctx) musicBus.gain.setTargetAtTime(prefs.music ? 0.55 : 0, ctx.currentTime, 0.4);
  return prefs.music;
}
export function toggleSfx() {
  prefs.sfx = !prefs.sfx;
  savePrefs();
  if (ctx) sfxBus.gain.setTargetAtTime(prefs.sfx ? 1 : 0, ctx.currentTime, 0.05);
  return prefs.sfx;
}

// ---------------- building blocks ----------------
const now = () => ctx.currentTime;

function tone(freq, start, dur, { type = 'sine', vol = 0.1, attack = 0.005, slide, bus = sfxBus, wet = 0, lp } = {}) {
  if (!ctx || freq > ctx.sampleRate / 2.2) return;
  const t0 = now() + start;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let node = o;
  if (lp) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = lp;
    o.connect(f);
    node = f;
  }
  node.connect(g);
  g.connect(bus);
  if (wet) {
    const s = ctx.createGain();
    s.gain.value = wet;
    g.connect(s).connect(reverb);
  }
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function noise(start, dur, { vol = 0.1, type = 'bandpass', freq = 1000, q = 1, slide, attack = 0.002, bus = sfxBus, wet = 0 } = {}) {
  if (!ctx) return;
  const t0 = now() + start;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t0);
  if (slide) f.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(bus);
  if (wet) {
    const s = ctx.createGain();
    s.gain.value = wet;
    g.connect(s).connect(reverb);
  }
  src.start(t0, Math.random() * 1.5);
  src.stop(t0 + dur + 0.05);
}

// Metallic "clink": inharmonic partials with fast decay
function clink(start, f = 3200, vol = 0.05) {
  tone(f, start, 0.25, { vol, wet: 0.2 });
  tone(f * 2.76, start, 0.15, { vol: vol * 0.5 });
  tone(f * 5.4, start, 0.08, { vol: vol * 0.3 });
}

// Bell / glass chime
function chime(f, start = 0, vol = 0.06, dur = 1.6) {
  tone(f, start, dur, { vol, wet: 0.5 });
  tone(f * 2, start, dur * 0.6, { vol: vol * 0.35, wet: 0.5 });
  tone(f * 3.01, start, dur * 0.35, { vol: vol * 0.15, wet: 0.5 });
}

// ---------------- sound effects ----------------
const ROOM_SOUNDS = {
  // deep stone bell
  entrance: () => {
    tone(98, 0, 3, { vol: 0.12, wet: 0.6 });
    tone(98 * 2.76, 0, 1.8, { vol: 0.04, wet: 0.6 });
    tone(98 * 5.4, 0, 0.9, { vol: 0.02, wet: 0.6 });
  },
  // warm wooden marimba run
  bio: () => [440, 523, 659, 784, 880].forEach((f, i) => tone(f, i * 0.11, 0.6, { type: 'triangle', vol: 0.05, wet: 0.4, lp: 2400 })),
  // glittering treasure arpeggio
  treasury: () => {
    [1047, 1319, 1568, 2093, 2637].forEach((f, i) => chime(f, i * 0.07, 0.025, 0.9));
    for (let i = 0; i < 6; i++) clink(0.4 + i * 0.06, 2600 + Math.random() * 1800, 0.02);
  },
  // magic whoosh + shimmer
  social: () => {
    noise(0, 1.2, { vol: 0.08, freq: 300, slide: 3500, q: 2, attack: 0.4, wet: 0.5 });
    [523, 784, 1047, 1568].forEach((f, i) => chime(f, 0.5 + i * 0.09, 0.025, 1.4));
  },
};

export const sfx = {
  room: (id) => ctx && ROOM_SOUNDS[id]?.(),
  ui: () => ctx && tone(1200, 0, 0.05, { type: 'square', vol: 0.02, lp: 3000 }),
  near: () => ctx && tone(1568, 0, 0.12, { vol: 0.025, wet: 0.2 }),
  close: () => {
    if (!ctx) return;
    tone(520, 0, 0.09, { type: 'triangle', vol: 0.05, slide: 300 });
  },
  // notice board: paper rustle
  board: () => {
    if (!ctx) return;
    for (let i = 0; i < 4; i++) noise(i * 0.07, 0.09, { vol: 0.05, freq: 3500 + Math.random() * 2000, q: 0.8 });
  },
  // book: two page flips
  book: () => {
    if (!ctx) return;
    noise(0, 0.22, { vol: 0.06, type: 'highpass', freq: 1500, slide: 5000, attack: 0.05 });
    noise(0.25, 0.2, { vol: 0.05, type: 'highpass', freq: 1800, slide: 6000, attack: 0.04 });
  },
  // wooden bookshelf: knock + page
  shelf: () => {
    if (!ctx) return;
    tone(180, 0, 0.15, { vol: 0.08, slide: 120 });
    noise(0.12, 0.25, { vol: 0.05, type: 'highpass', freq: 1600, slide: 5000, attack: 0.05 });
  },
  // chest: creaky hinge + coins
  chest: () => {
    if (!ctx) return;
    tone(85, 0, 0.6, { type: 'sawtooth', vol: 0.04, slide: 150, lp: 700, attack: 0.08 });
    noise(0, 0.5, { vol: 0.03, freq: 600, q: 6, slide: 900 });
    for (let i = 0; i < 12; i++) clink(0.45 + i * 0.045 + Math.random() * 0.03, 2400 + Math.random() * 2200, 0.03);
  },
  // gold: heavy clinks
  gold: () => {
    if (!ctx) return;
    clink(0, 1500, 0.06);
    clink(0.12, 1900, 0.04);
    clink(0.2, 2700, 0.03);
  },
  // PC: power-on chirp + keyboard
  pc: () => {
    if (!ctx) return;
    [880, 1320, 1760].forEach((f, i) => tone(f, i * 0.07, 0.07, { type: 'square', vol: 0.025, lp: 4000 }));
    for (let i = 0; i < 7; i++) noise(0.3 + i * 0.06 + Math.random() * 0.03, 0.025, { vol: 0.05, freq: 4000, q: 2 });
  },
  // barrel: hollow knock + liquid slosh
  barrel: () => {
    if (!ctx) return;
    tone(150, 0, 0.3, { vol: 0.12, slide: 95 });
    tone(150, 0.16, 0.3, { vol: 0.08, slide: 95 });
    noise(0.3, 0.8, { vol: 0.05, type: 'lowpass', freq: 500, slide: 250, attack: 0.15 });
  },
  // crate: wood creak + thud
  crate: () => {
    if (!ctx) return;
    tone(110, 0, 0.35, { type: 'sawtooth', vol: 0.03, slide: 170, lp: 800, attack: 0.05 });
    tone(90, 0.3, 0.2, { vol: 0.12, slide: 60 });
    noise(0.3, 0.12, { vol: 0.05, type: 'lowpass', freq: 400 });
  },
  // crystal: glass chime, pitch per crystal
  crystal: (i = 0) => {
    if (!ctx) return;
    const scale = [784, 880, 1047, 1175, 1319, 1568];
    const f = scale[i % scale.length];
    chime(f, 0, 0.05, 2);
    chime(f * 1.5, 0.12, 0.03, 1.6);
  },
  // portal: deep swell + whoosh
  portal: () => {
    if (!ctx) return;
    tone(55, 0, 1.6, { type: 'sawtooth', vol: 0.06, slide: 110, lp: 500, attack: 0.5, wet: 0.4 });
    noise(0, 1.4, { vol: 0.08, freq: 200, slide: 4000, q: 1.5, attack: 0.6, wet: 0.6 });
    [392, 523, 659, 1047].forEach((f, i) => chime(f, 0.7 + i * 0.1, 0.02, 1.5));
  },
  // footsteps by surface
  step: (surface) => {
    if (!ctx) return;
    const r = Math.random();
    switch (surface) {
      case 'wood':
        tone(170 + r * 40, 0, 0.08, { vol: 0.05, slide: 110 });
        noise(0, 0.03, { vol: 0.02, freq: 1200, q: 1 });
        break;
      case 'rug':
        noise(0, 0.07, { vol: 0.025, type: 'lowpass', freq: 500 });
        break;
      case 'crystal':
        noise(0, 0.03, { vol: 0.025, freq: 2500, q: 2 });
        tone(2400 + r * 600, 0, 0.12, { vol: 0.008 });
        break;
      case 'gold':
        noise(0, 0.04, { vol: 0.035, freq: 1800, q: 1.2 });
        if (r < 0.3) clink(0.02, 3500 + r * 2000, 0.008);
        break;
      default: // stone
        noise(0, 0.045, { vol: 0.04, freq: 1400 + r * 400, q: 1.2 });
        tone(90, 0, 0.06, { vol: 0.04, slide: 60 });
    }
  },
};

// ---------------- ambient emitters ----------------
let hum = null;
let crackleAcc = 0;
// torchDist / portalDist in world units; dt in seconds
export function ambient(dt, torchDist, portalDist) {
  if (!ctx || !prefs.sfx) return;
  // torch crackle: random pops, denser when close
  const near = Math.max(0, 1 - torchDist / 4);
  crackleAcc += dt * near * 9;
  while (crackleAcc > 1) {
    crackleAcc -= Math.random() * 2;
    noise(Math.random() * 0.1, 0.02 + Math.random() * 0.03, { vol: 0.015 + near * 0.03, freq: 1500 + Math.random() * 3000, q: 3 });
  }
  // portal hum: continuous drone
  if (!hum) {
    const g = ctx.createGain();
    g.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 400;
    const a = ctx.createOscillator();
    const b = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    a.type = 'sawtooth';
    b.type = 'sine';
    a.frequency.value = 55;
    b.frequency.value = 82.6;
    lfo.frequency.value = 0.3;
    lfoG.gain.value = 120;
    lfo.connect(lfoG).connect(lp.frequency);
    a.connect(lp);
    b.connect(lp);
    lp.connect(g).connect(sfxBus);
    a.start();
    b.start();
    lfo.start();
    hum = g;
  }
  const v = Math.max(0, 1 - portalDist / 7) ** 2 * 0.07;
  hum.gain.setTargetAtTime(v, now(), 0.3);
}

// ---------------- generative dungeon ambience ----------------
// Dark modal pads (D minor / Dorian), a low drone, a sparse echoing piano, water
// drops falling in the distance and a slow cave wind. Original composition.
const CHORDS = [
  [50, 57, 62, 65], // Dm
  [46, 53, 58, 62], // Bb
  [48, 55, 60, 64], // C
  [45, 52, 57, 60], // Am
  [50, 57, 62, 69], // Dm(add9)
  [43, 50, 55, 58], // Gm
  [46, 53, 57, 62], // Bbmaj7
  [45, 52, 55, 61], // A(7) - leading back
];
const SCALE = [62, 64, 65, 67, 69, 71, 72, 74]; // D dorian
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const BAR = 9;

let musicTimer = null;
let nextBar = 0;
let barIndex = 0;

function piano(n, t, vol = 0.05) {
  const f = midi(n);
  const t0 = t - now();
  tone(f, t0, 4, { vol, bus: musicBus, wet: 1.2, lp: 1600 });
  tone(f * 2, t0, 1.6, { vol: vol * 0.2, bus: musicBus, wet: 1.2, lp: 2400 });
}

function pad(notes, t, dur) {
  for (const n of notes) {
    const o = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    o.type = 'triangle';
    o2.type = 'sawtooth';
    o.frequency.value = midi(n - 12);
    o2.frequency.value = midi(n - 12) * 1.004;
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(380, t);
    lp.frequency.linearRampToValueAtTime(620, t + dur / 2);
    lp.frequency.linearRampToValueAtTime(380, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.016, t + 3);
    g.gain.setValueAtTime(0.016, t + dur - 1);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 3);
    o.connect(lp);
    o2.connect(lp);
    lp.connect(g);
    g.connect(musicBus);
    const s = ctx.createGain();
    s.gain.value = 0.9;
    g.connect(s).connect(reverb);
    o.start(t);
    o2.start(t);
    o.stop(t + dur + 3.2);
    o2.stop(t + dur + 3.2);
  }
}

// A water drop in a far corner of the cave: short falling blip, mostly reverb.
function drip(t) {
  const f = 900 + Math.random() * 900;
  const t0 = t - now();
  tone(f, t0, 0.12, { vol: 0.03, slide: f * 0.55, bus: musicBus, wet: 2.2 });
}

let wind = null;
function startWind() {
  // low filtered noise that breathes slowly, plus a deep drone on D
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 260;
  bp.Q.value = 0.7;
  const g = ctx.createGain();
  g.gain.value = 0.02;
  const lfo = ctx.createOscillator();
  const lfoG = ctx.createGain();
  lfo.frequency.value = 0.07;
  lfoG.gain.value = 0.016;
  lfo.connect(lfoG).connect(g.gain);
  const lfo2 = ctx.createOscillator();
  const lfo2G = ctx.createGain();
  lfo2.frequency.value = 0.05;
  lfo2G.gain.value = 120;
  lfo2.connect(lfo2G).connect(bp.frequency);
  src.connect(bp).connect(g).connect(musicBus);
  const drone = ctx.createOscillator();
  const droneG = ctx.createGain();
  const droneLp = ctx.createBiquadFilter();
  drone.type = 'sawtooth';
  drone.frequency.value = midi(38);
  droneLp.type = 'lowpass';
  droneLp.frequency.value = 160;
  droneG.gain.value = 0.03;
  drone.connect(droneLp).connect(droneG).connect(musicBus);
  src.start();
  lfo.start();
  lfo2.start();
  drone.start();
  wind = g;
}

function scheduleBar(t) {
  const chord = CHORDS[barIndex % CHORDS.length];
  pad(chord, t, BAR);
  if (barIndex % 2 === 0) piano(chord[0], t + 0.2, 0.035);
  // sparse, echoing melody: often silent
  const count = Math.random() < 0.35 ? 0 : 1 + Math.floor(Math.random() * 3);
  let tt = t + 1 + Math.random() * 1.5;
  for (let i = 0; i < count; i++) {
    const pool = Math.random() < 0.6 ? chord.map((n) => n + 12) : SCALE;
    piano(pool[Math.floor(Math.random() * pool.length)], tt, 0.026 + Math.random() * 0.016);
    tt += 1.4 + Math.random() * 2.2;
    if (tt > t + BAR - 1) break;
  }
  // a few water drops per bar
  const drops = Math.floor(Math.random() * 3);
  for (let i = 0; i < drops; i++) drip(t + Math.random() * BAR);
  barIndex++;
}

function startMusic() {
  if (musicTimer) return;
  startWind();
  nextBar = now() + 0.5;
  musicTimer = setInterval(() => {
    if (!ctx || ctx.state !== 'running') return;
    while (nextBar < now() + 2) {
      if (prefs.music) scheduleBar(nextBar);
      nextBar += BAR;
    }
  }, 500);
}
