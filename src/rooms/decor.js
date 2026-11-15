import * as THREE from 'three';
import { glow } from '../voxel.js';

// Reusable voxel props. Every builder draws into the shared batches of `ctx`
// (ctx.vb = lit by the scene, ctx.lit = self-illuminated) and marks solid cells.

const TAU = Math.PI * 2;

// Ring of `n` boxes around (x, z): an octagonal "cylinder" made of staves.
export function ring(batch, x, y, z, r, h, n, colors, thick = 0.05, jitter = 0.1) {
  const w = 2 * r * Math.tan(Math.PI / n) + 0.01;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU;
    const col = Array.isArray(colors) ? colors[k % colors.length] : colors;
    batch.add(x + Math.cos(a) * r, y, z + Math.sin(a) * r, w, h, thick, col, jitter, -a - Math.PI / 2);
  }
}

// Octagon disc (two rotated squares)
export function disc(batch, x, y, z, r, h, color, jitter = 0.08) {
  const s = r * 1.53;
  batch.add(x, y, z, s, h, s, color, jitter);
  batch.add(x, y, z, s, h, s, color, jitter, Math.PI / 4);
}

export function rug(ctx, x0, z0, x1, z1, edge, fill, motif) {
  const { vb, rugCells } = ctx;
  for (let z = z0; z <= z1; z++)
    for (let x = x0; x <= x1; x++) {
      rugCells.add(`${x},${z}`);
      vb.add(x, 0.012, z, 1, 0.024, 1, fill, 0.06);
      const inner = x > x0 && x < x1 && z > z0 && z < z1;
      if (inner && motif && (x + z) % 2 === 0) vb.add(x, 0.026, z, 0.3, 0.01, 0.3, motif, 0.05, Math.PI / 4);
    }
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const wx = x1 - x0 + 1;
  const wz = z1 - z0 + 1;
  for (const inset of [0.12, 0.36]) {
    const t = 0.1;
    vb.add(cx, 0.03, z0 - 0.5 + inset, wx - inset * 2, 0.012, t, edge, 0.05);
    vb.add(cx, 0.03, z1 + 0.5 - inset, wx - inset * 2, 0.012, t, edge, 0.05);
    vb.add(x0 - 0.5 + inset, 0.03, cz, t, 0.012, wz - inset * 2, edge, 0.05);
    vb.add(x1 + 0.5 - inset, 0.03, cz, t, 0.012, wz - inset * 2, edge, 0.05);
  }
  for (let x = x0; x <= x1; x++)
    for (const z of [z0 - 0.55, z1 + 0.55]) for (let i = -2; i <= 2; i++) vb.add(x + i * 0.18, 0.01, z, 0.06, 0.02, 0.12, edge);
}

// Wooden barrel with staves, iron hoops and a lid
export function barrel(ctx, x, z, { tap = false, rot = 0 } = {}) {
  const { vb } = ctx;
  const wood = ['#7a4a28', '#6a3f22', '#845232', '#70452a'];
  ring(vb, x, 0.14, z, 0.23, 0.28, 10, wood, 0.06);
  ring(vb, x, 0.42, z, 0.27, 0.3, 10, wood, 0.06);
  ring(vb, x, 0.7, z, 0.23, 0.28, 10, wood, 0.06);
  for (const [y, r] of [[0.1, 0.235], [0.3, 0.265], [0.56, 0.265], [0.76, 0.235]]) ring(vb, x, y, z, r + 0.02, 0.05, 10, '#2c2a30', 0.03, 0.04);
  disc(vb, x, 0.82, z, 0.22, 0.03, '#5a3720');
  vb.add(x + 0.08, 0.84, z - 0.05, 0.08, 0.02, 0.08, '#2c2a30', 0.05); // bung
  if (tap) {
    const dx = Math.cos(rot) * 0.3;
    const dz = Math.sin(rot) * 0.3;
    vb.add(x + dx, 0.3, z + dz, 0.06, 0.06, 0.12, '#9a9aa6', 0.1, -rot);
    vb.add(x + dx * 1.3, 0.24, z + dz * 1.3, 0.05, 0.08, 0.05, '#9a9aa6', 0.1);
    vb.add(x + dx * 1.45, 0.006, z + dz * 1.45, 0.42, 0.012, 0.3, '#121016', 0.05, 0.4); // oil puddle
  }
  ctx.solid(x, z);
}

// Wooden crate with planks, frame and a stencil
export function crate(ctx, x, z, { size = 0.66, y = 0, rot = 0, straw = false } = {}) {
  const { vb } = ctx;
  const s = size;
  const yc = y + s / 2;
  vb.add(x, yc, z, s, s, s, '#a0703e', 0.06, rot);
  // plank seams (front/back/sides)
  for (let i = 1; i < 3; i++) {
    const yy = y + (s * i) / 3;
    vb.add(x, yy, z, s + 0.01, 0.02, s + 0.01, '#6a4624', 0.05, rot);
  }
  // frame edges
  const h = s / 2;
  const cr = Math.cos(rot);
  const sr = Math.sin(rot);
  const P = (lx, lz) => [x + lx * cr + lz * sr, z - lx * sr + lz * cr];
  for (const [lx, lz] of [[h, h], [h, -h], [-h, h], [-h, -h]]) {
    const [px, pz] = P(lx, lz);
    vb.add(px, yc, pz, 0.09, s + 0.02, 0.09, '#5a3a1e', 0.05, rot);
  }
  for (const ly of [y + 0.04, y + s - 0.04]) {
    for (const [lx, lz, w, d] of [[0, h, s, 0.09], [0, -h, s, 0.09], [h, 0, 0.09, s], [-h, 0, 0.09, s]]) {
      const [px, pz] = P(lx, lz);
      vb.add(px, ly, pz, w, 0.08, d, '#5a3a1e', 0.05, rot);
    }
  }
  // stencil mark on the front
  const [fx, fz] = P(0, h + 0.005);
  vb.add(fx, yc, fz, s * 0.4, 0.05, 0.01, '#3a2614', 0.02, rot);
  vb.add(fx, yc, fz, 0.05, s * 0.4, 0.01, '#3a2614', 0.02, rot);
  if (straw) for (let i = 0; i < 9; i++) vb.add(x + (Math.random() - 0.5) * s * 0.7, y + s + 0.02, z + (Math.random() - 0.5) * s * 0.7, 0.02, 0.05, 0.22, '#e0c060', 0.2, Math.random() * TAU, 0, 0.6);
  if (y === 0) ctx.solid(x, z);
}

export function crystalCluster(ctx, x, z, color) {
  const { lit, scene } = ctx;
  const seed = Math.abs(Math.sin(x * 12.9 + z * 78.2) * 43758.5);
  for (let i = 0; i < 7; i++) {
    const a = i * 0.95 + seed;
    const h = 0.3 + ((i * 37) % 7) * 0.11;
    const tilt = 0.25 + (i % 3) * 0.12;
    lit.add(x + Math.cos(a) * 0.22, h / 2, z + Math.sin(a) * 0.22, 0.13, h, 0.13, color, 0.3, a, Math.cos(a) * tilt, Math.sin(a) * tilt);
    lit.add(x + Math.cos(a) * 0.22, h + 0.02, z + Math.sin(a) * 0.22, 0.07, 0.07, 0.07, '#ffffff', 0.1, a);
  }
  lit.add(x, 0.6, z, 0.2, 1.2, 0.2, color, 0.2, 0.4);
  lit.add(x, 1.25, z, 0.1, 0.12, 0.1, '#ffffff', 0.1, 0.4);
  ctx.vb.add(x, 0.04, z, 0.7, 0.08, 0.6, '#3a3452', 0.2, seed);
  const g = glow(color, 1.8, 0.35);
  g.position.set(x, 0.6, z);
  scene.add(g);
  ctx.solid(x, z);
}

export function bookStack(ctx, x, z, n = 5) {
  const cols = ['#8c2f39', '#2f5d8c', '#3f7d4a', '#c9a24a', '#6a3f8c', '#b5652b'];
  for (let i = 0; i < n; i++) {
    const w = 0.42 - i * 0.025;
    const rot = Math.sin(i * 3.7 + x) * 0.35;
    ctx.vb.add(x, 0.045 + i * 0.09, z, w, 0.08, 0.3, cols[(i + Math.round(x)) % cols.length], 0.1, rot);
    ctx.vb.add(x, 0.045 + i * 0.09, z, w - 0.04, 0.084, 0.27, '#efe3c0', 0.05, rot); // pages
  }
  ctx.solid(x, z);
}

export function candle(ctx, x, z, y = 0, h = 0.24) {
  ctx.vb.add(x, y + h / 2, z, 0.08, h, 0.08, '#efe3c0', 0.08);
  ctx.vb.add(x, y + 0.01, z, 0.14, 0.02, 0.14, '#8a6a3a', 0.05);
  ctx.lit.add(x, y + h + 0.04, z, 0.05, 0.08, 0.05, '#ffcc55', 0.05);
  ctx.lit.add(x, y + h + 0.09, z, 0.025, 0.04, 0.025, '#fff2b0', 0.05);
}

export function goldBars(ctx, x, z, rot = 0) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  for (let l = 0; l < 3; l++)
    for (let i = 0; i < 3 - l; i++) {
      const lx = -0.28 + i * 0.28 + l * 0.14;
      const px = x + lx * c;
      const pz = z - lx * s;
      ctx.lit.add(px, 0.06 + l * 0.12, pz, 0.24, 0.1, 0.48, '#d8a830', 0.1, rot);
      ctx.lit.add(px, 0.115 + l * 0.12, pz, 0.18, 0.012, 0.4, '#ffe27a', 0.08, rot); // bevelled top
    }
  ctx.solid(x, z);
}

export function coinPile(ctx, x, z) {
  const { lit } = ctx;
  let seed = Math.round(x * 31 + z * 17);
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  // heap of flat coins
  for (let i = 0; i < 46; i++) {
    const r = Math.sqrt(rnd()) * 0.42;
    const a = rnd() * TAU;
    const hgt = Math.max(0, 0.3 - r * 0.65) * (0.7 + rnd() * 0.3);
    lit.add(x + Math.cos(a) * r, 0.02 + hgt, z + Math.sin(a) * r, 0.11, 0.025, 0.11, rnd() < 0.3 ? '#ffe27a' : '#e0b030', 0.15, rnd() * TAU, (rnd() - 0.5) * 0.6);
  }
  // a few coin stacks and a gem
  for (const [dx, dz, n] of [[0.32, 0.25, 5], [-0.3, 0.3, 3]]) for (let i = 0; i < n; i++) lit.add(x + dx, 0.02 + i * 0.03, z + dz, 0.11, 0.025, 0.11, '#e8b838', 0.1, i);
  lit.add(x - 0.05, 0.3, z + 0.02, 0.08, 0.08, 0.08, '#ff3b6b', 0.1, 0.7, 0.6);
  ctx.solid(x, z);
}

// Floating sparkles around a point (golden twinkles), returns an updater.
export function sparkles(ctx, x, y, z, { count = 24, radius = 0.8, height = 1.2, color = '#ffe27a', size = 0.06 } = {}) {
  const pos = new Float32Array(count * 3);
  const seeds = Array.from({ length: count }, () => [Math.random() * TAU, Math.random(), Math.random() * 10]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  ctx.scene.add(pts);
  ctx.updaters.push((t) => {
    seeds.forEach(([a, r, s], i) => {
      const life = (t * 0.35 + s) % 1;
      const rr = radius * (0.4 + r * 0.6);
      pos[i * 3] = x + Math.cos(a + t * 0.4) * rr;
      pos[i * 3 + 1] = y + life * height;
      pos[i * 3 + 2] = z + Math.sin(a + t * 0.4) * rr;
    });
    geo.attributes.position.needsUpdate = true;
    pts.material.opacity = 0.65 + Math.sin(t * 6) * 0.25;
  });
  return pts;
}
