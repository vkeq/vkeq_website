import * as THREE from 'three';
import { glowTexture } from './textures.js';

const matCache = new Map();
const geoCache = new Map();

export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshLambertMaterial({ color, ...opts }));
  return matCache.get(key);
}

function geo(w, h, d) {
  const key = `${w}|${h}|${d}`;
  if (!geoCache.has(key)) geoCache.set(key, new THREE.BoxGeometry(w, h, d));
  return geoCache.get(key);
}

// Box with its centre at (x, y, z) inside parent.
export function box(parent, w, h, d, color, x = 0, y = 0, z = 0, opts) {
  const m = new THREE.Mesh(geo(w, h, d), typeof color === 'object' ? color : mat(color, opts));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

// Floating label rendered as crisp HTML text, anchored to this Object3D.
export const labels = [];
// `text` is a literal string or { key } for a translated UI string.
export function label(text, { color = '#ffe9a8', size = 'sm' } = {}) {
  const o = new THREE.Object3D();
  o.userData.label = { text: typeof text === 'string' ? text : null, key: text?.key ?? null, color, size };
  labels.push(o);
  return o;
}

export function glow(color, size = 1, opacity = 0.6) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture(),
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  s.scale.set(size, size, 1);
  return s;
}

// Build voxel letters from a pixel font rendered to a tiny canvas.
export function voxelText(text, { voxel = 0.12, depth = 0.12, color = '#f5c542', side = '#a8761c' } = {}) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = '8px "Press Start 2P", monospace';
  const w = Math.ceil(g.measureText(text).width) + 2;
  c.width = w;
  c.height = 10;
  g.font = '8px "Press Start 2P", monospace';
  g.textBaseline = 'top';
  g.fillStyle = '#fff';
  g.fillText(text, 1, 1);
  const data = g.getImageData(0, 0, w, 10).data;
  const pts = [];
  for (let y = 0; y < 10; y++)
    for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 200) pts.push([x, y]);

  const group = new THREE.Group();
  const geom = new THREE.BoxGeometry(voxel, voxel, depth);
  const mats = [mat(side), mat(side), mat(color, { emissive: color, emissiveIntensity: 0.25 }), mat(side), mat(color, { emissive: color, emissiveIntensity: 0.35 }), mat(side)];
  const inst = new THREE.InstancedMesh(geom, mats, Math.max(1, pts.length));
  const m4 = new THREE.Matrix4();
  pts.forEach(([x, y], i) => {
    m4.makeTranslation((x - w / 2) * voxel, (10 - y) * voxel, 0);
    inst.setMatrixAt(i, m4);
  });
  inst.count = pts.length;
  group.add(inst);
  return group;
}
