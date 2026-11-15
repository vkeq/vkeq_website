import * as THREE from 'three';

// Deterministic RNG so the dungeon looks the same on every visit.
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function finish(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function pixelTexture(size, seed, fn) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  const r = rng(seed);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [R, G, B] = fn(x, y, r);
      const i = (y * size + x) * 4;
      img.data[i] = clamp(R);
      img.data[i + 1] = clamp(G);
      img.data[i + 2] = clamp(B);
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return finish(c);
}

const clamp = (v) => Math.max(0, Math.min(255, v | 0));
const jitter = (c, r, a) => {
  const n = (r() - 0.5) * a;
  return [c[0] + n, c[1] + n, c[2] + n];
};

export function makeTextures() {
  // Brick wall: 4px high bricks, staggered
  const brickTint = {};
  const wall = pixelTexture(16, 7, (x, y, r) => {
    const row = Math.floor(y / 4);
    const off = row % 2 ? 4 : 0;
    const col = Math.floor((x + off) / 8);
    const mortar = y % 4 === 3 || (x + off) % 8 === 7;
    if (mortar) return jitter([34, 28, 46], r, 10);
    const key = row + ':' + col;
    if (!(key in brickTint)) brickTint[key] = (r() - 0.5) * 26;
    const t = brickTint[key];
    let c = [78 + t, 70 + t, 98 + t];
    if (y % 4 === 0) c = [c[0] + 12, c[1] + 12, c[2] + 14]; // top highlight
    if (r() < 0.04) c = [52, 86, 58]; // moss
    return jitter(c, r, 14);
  });

  const wallTop = pixelTexture(16, 11, (x, y, r) => {
    const edge = x === 0 || y === 0 || x === 15 || y === 15;
    return jitter(edge ? [36, 31, 50] : [56, 50, 74], r, 12);
  });

  const floorStone = pixelTexture(16, 3, (x, y, r) => {
    const line = x % 8 === 0 || y % 8 === 0;
    if (line) return jitter([30, 27, 40], r, 8);
    const q = (Math.floor(x / 8) + Math.floor(y / 8) * 2) * 5;
    let c = [60 + q, 56 + q, 72 + q];
    if (r() < 0.03) c = [40, 36, 50];
    return jitter(c, r, 12);
  });

  const floorWood = pixelTexture(16, 5, (x, y, r) => {
    const row = Math.floor(y / 4);
    const seam = (x + row * 5) % 16 === 0;
    if (y % 4 === 3 || seam) return jitter([46, 28, 18], r, 8);
    const t = (row % 3) * 8;
    let c = [118 + t, 76 + t * 0.6, 44];
    if (r() < 0.12) c = [96, 60, 36]; // grain
    return jitter(c, r, 10);
  });

  const floorGold = pixelTexture(16, 9, (x, y, r) => {
    const line = x % 8 === 0 || y % 8 === 0;
    if (line) return jitter([44, 32, 22], r, 8);
    const chk = (Math.floor(x / 8) + Math.floor(y / 8)) % 2;
    let c = chk ? [92, 72, 48] : [74, 58, 40];
    if (r() < 0.025) c = [230, 190, 70]; // stray gold flake
    return jitter(c, r, 10);
  });

  const floorCrystal = pixelTexture(16, 13, (x, y, r) => {
    const line = x % 8 === 0 || y % 8 === 0;
    if (line) return jitter([24, 16, 42], r, 6);
    let c = [46, 34, 76];
    if ((x + y) % 8 === 4) c = [58, 42, 96];
    if (r() < 0.03) c = [170, 130, 255];
    return jitter(c, r, 10);
  });

  return { wall, wallTop, floorStone, floorWood, floorGold, floorCrystal };
}

// Small canvas texture with pixel text, for floating labels.
export function textTexture(text, { color = '#ffe9a8', bg = null, font = '"Press Start 2P", monospace', size = 8, pad = 3 } = {}) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = `${size}px ${font}`;
  const w = Math.ceil(g.measureText(text).width) + pad * 2;
  const h = size + pad * 2;
  c.width = w;
  c.height = h;
  g.font = `${size}px ${font}`;
  g.textBaseline = 'top';
  if (bg) {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
  }
  // 1px dark outline for readability
  g.fillStyle = '#120a1c';
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.fillText(text, pad + dx, pad + dy + 1);
  g.fillStyle = color;
  g.fillText(text, pad, pad + 1);
  const t = finish(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return { texture: t, w, h };
}

// Soft round glow used for additive sprites.
let glowTex = null;
export function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  // stepped (pixelated) radial gradient
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const d = Math.hypot(x - 15.5, y - 15.5) / 16;
      const a = Math.max(0, 1 - d);
      const q = Math.round(a * a * 5) / 5;
      g.fillStyle = `rgba(255,255,255,${q})`;
      g.fillRect(x, y, 1, 1);
    }
  }
  glowTex = finish(c);
  return glowTex;
}
