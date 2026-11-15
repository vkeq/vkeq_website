// Tiny chiptune sound effects generated with WebAudio (no audio files).
let ctx = null;
let muted = false;
try {
  muted = localStorage.getItem('vkeq-muted') === '1';
} catch {}

export function initAudio() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    ctx = null;
  }
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  try {
    localStorage.setItem('vkeq-muted', muted ? '1' : '0');
  } catch {}
  return muted;
}

function tone(freq, start, dur, type = 'square', vol = 0.06) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + start;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export const sfx = {
  blip: () => tone(880, 0, 0.07),
  open: () => [523, 659, 784].forEach((f, i) => tone(f, i * 0.06, 0.12)),
  close: () => [659, 440].forEach((f, i) => tone(f, i * 0.05, 0.08)),
  room: () => [392, 523, 659, 784].forEach((f, i) => tone(f, i * 0.08, 0.18, 'triangle', 0.08)),
  coins: () => [988, 1319, 1568, 1976, 1568, 2093].forEach((f, i) => tone(f, i * 0.05, 0.1, 'square', 0.04)),
  portal: () => [220, 330, 440, 660, 880].forEach((f, i) => tone(f, i * 0.05, 0.25, 'sawtooth', 0.03)),
  step: () => tone(110 + Math.random() * 30, 0, 0.03, 'triangle', 0.025),
};
