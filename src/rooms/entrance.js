import * as THREE from 'three';
import { box, label, voxelText } from '../voxel.js';
import { CONFIG } from '../config.js';
import { t as T } from '../i18n.js';
import { rug, barrel, crate } from './decor.js';

// Entrance hall: x 15..25, z 15..24. Spawn at (20, 21).
export function buildEntrance(ctx) {
  const { scene, world, actions, vb } = ctx;

  // Notice board on the north wall (opens automatically on start)
  {
    const g = new THREE.Group();
    g.position.set(16.5, 0, 14.55);
    box(g, 1.8, 1.2, 0.1, '#5a3a22', 0, 1.15, 0);
    box(g, 1.6, 1.0, 0.06, '#3b2616', 0, 1.15, 0.04);
    for (const x of [-0.85, 0.85]) box(g, 0.1, 1.3, 0.12, '#4a2e1a', x, 1.15, 0.02);
    for (const y of [0.57, 1.73]) box(g, 1.84, 0.1, 0.12, '#4a2e1a', 0, y, 0.02);
    // pinned notes
    [[-0.45, 1.3, 0.5, 0.36, '#e8dcb0', 0.05], [0.15, 1.08, 0.46, 0.52, '#f0e6c8', -0.06], [0.55, 1.38, 0.36, 0.26, '#d9c48a', 0.1], [-0.5, 0.86, 0.4, 0.3, '#cfe0b0', -0.04]].forEach(([x, y, w, h, c, r]) => {
      const n = box(g, w, h, 0.02, c, x, y, 0.08);
      n.rotation.z = r;
      for (let i = 0; i < 3; i++) box(g, w * 0.7, 0.025, 0.01, '#6a5a48', x, y + h * 0.25 - i * 0.08, 0.095).rotation.z = r;
      box(g, 0.05, 0.05, 0.03, '#d0302a', x, y + h / 2 - 0.05, 0.1);
    });
    const l = label({ key: 'labels.welcome' }, { color: '#ffe9a8' });
    l.position.set(0, 1.95, 0.1);
    g.add(l);
    scene.add(g);
    world.reserve(16, 14);
    world.reserve(17, 14);
    ctx.item({ id: 'welcome', x: 16.5, z: 15.2, radius: 1.6, prompt: () => T('prompts.welcome'), hit: g, sound: 'board', action: actions.welcome });
  }

  // Banner with a candlestick emblem
  {
    const g = new THREE.Group();
    g.position.set(23.5, 0, 14.56);
    box(g, 1.4, 0.08, 0.08, '#5a3a22', 0, 1.95, 0);
    for (const x of [-0.7, 0.7]) box(g, 0.1, 0.1, 0.1, '#c9a24a', x, 1.95, 0);
    box(g, 1.1, 1.3, 0.04, '#5b1e2e', 0, 1.25, 0.02);
    box(g, 1.1, 0.06, 0.05, '#c9a24a', 0, 1.88, 0.03);
    // swallow-tail bottom
    box(g, 0.5, 0.2, 0.04, '#5b1e2e', -0.3, 0.52, 0.02);
    box(g, 0.5, 0.2, 0.04, '#5b1e2e', 0.3, 0.52, 0.02);
    box(g, 1.1, 0.05, 0.05, '#c9a24a', 0, 0.62, 0.03);
    [[-0.28, 1.15, 0.36, '#3ddc84'], [0, 1.3, 0.5, '#3ddc84'], [0.28, 1.1, 0.3, '#ff5470']].forEach(([x, y, h, c]) => {
      box(g, 0.13, h, 0.03, c, x, y, 0.06, { emissive: c, emissiveIntensity: 0.4 });
      box(g, 0.03, h + 0.2, 0.02, c, x, y, 0.06);
    });
    scene.add(g);
    world.reserve(23, 14);
    world.reserve(24, 14);
  }

  // Stone pillars made of uneven blocks
  for (const [x, z] of [[17, 17], [23, 17], [17, 22], [23, 22]]) {
    const shade = ['#5c5578', '#544d6e', '#615a7e', '#4f4868'];
    vb.add(x, 0.06, z, 0.92, 0.12, 0.92, '#3e3854');
    vb.add(x, 0.19, z, 0.78, 0.14, 0.78, '#4a4460');
    for (let i = 0; i < 5; i++) {
      const w = 0.56 + ((i * 7 + x) % 3) * 0.03;
      vb.add(x + (((i * 13 + x) % 3) - 1) * 0.015, 0.43 + i * 0.35, z, w, 0.33, w, shade[(i + z) % 4], 0.08, ((i * 5) % 3) * 0.03);
      // chipped corners / small stones sticking out
      if ((i + x + z) % 2) vb.add(x + 0.3, 0.4 + i * 0.35, z + 0.2, 0.1, 0.1, 0.12, shade[(i + 1) % 4]);
    }
    vb.add(x + 0.12, 1.0, z + 0.3, 0.06, 0.5, 0.02, '#2e2940', 0.02);
    vb.add(x, 2.2, z, 0.78, 0.14, 0.78, '#4a4460');
    vb.add(x, 2.33, z, 0.92, 0.12, 0.92, '#3e3854');
    vb.add(x + 0.2, 2.42, z - 0.15, 0.3, 0.06, 0.3, '#3f6b45');
    ctx.solid(x, z, 0.46);
  }

  // Floating voxel title over the treasury corridor
  {
    const title = voxelText(CONFIG.name.toUpperCase(), { voxel: 0.11, depth: 0.14 });
    title.position.set(20, 1.15, 14.65);
    scene.add(title);
    ctx.updaters.push((time) => {
      title.position.y = 1.2 + Math.sin(time * 1.5) * 0.06;
    });
  }

  // Direction signs
  [
    [{ key: 'labels.toTreasury' }, 20, 2.05, 12.6, '#f5c542'],
    [{ key: 'labels.toLibrary' }, 13, 1.2, 19.5, '#e0a96d'],
    [{ key: 'labels.toPortals' }, 27, 1.2, 19.5, '#b48cff'],
  ].forEach(([text, x, y, z, color]) => {
    const s = label(text, { color });
    s.position.set(x, y, z);
    scene.add(s);
  });

  // Red carpet towards the treasury
  rug(ctx, 19, 15, 21, 23, '#b8902c', '#6a1824', '#8e2a36');

  // Oil barrels (south-west corner) → oil market anecdotes
  barrel(ctx, 15, 24, { tap: true, rot: -Math.PI / 2 });
  barrel(ctx, 16, 24);
  barrel(ctx, 15, 23);
  ctx.item({ id: 'oil', x: 15.4, z: 23.6, radius: 1.8, prompt: () => T('prompts.oil'), hitBox: [15.4, 0.45, 23.6, 1.6, 0.9, 1.6], sound: 'barrel', action: () => actions.fact('oil') });

  // Crates (south-east corner) → futures & options anecdotes
  crate(ctx, 25, 24, { rot: 0.1 });
  crate(ctx, 25, 24, { size: 0.48, y: 0.66, rot: -0.25, straw: true });
  crate(ctx, 24, 24, { rot: -0.15, straw: true });
  crate(ctx, 25, 23, { size: 0.56, rot: 0.3 });
  ctx.item({ id: 'crates', x: 24.6, z: 23.6, radius: 1.8, prompt: () => T('prompts.crates'), hitBox: [24.6, 0.5, 23.6, 1.6, 1.1, 1.6], sound: 'crate', action: () => actions.fact('futures') });
}
