import * as THREE from 'three';
import { label, glow, VoxelPart } from '../voxel.js';
import { t as T } from '../i18n.js';
import { rug, bookStack, candle, disc } from './decor.js';
import { chartScreen } from './screens.js';

// Library: x 2..11, z 15..24.
const BOOK_COLS = ['#8c2f39', '#2f5d8c', '#3f7d4a', '#c9a24a', '#6a3f8c', '#b5652b', '#2e6b6b', '#7a2a5a'];

export function buildLibrary(ctx) {
  const { scene, world, actions, vb, lit } = ctx;
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // ---------- Bookshelves full of books along the north wall ----------
  const shelf = (x) => {
    const zc = 14.78; // shelf centre (back panel sits against the wall face at 14.5)
    vb.add(x, 1.0, 14.56, 0.98, 2.0, 0.04, '#2e1c10', 0.05);
    for (const sx of [-0.47, 0.47]) vb.add(x + sx, 1.0, zc, 0.05, 2.0, 0.46, '#5a3a22', 0.06);
    vb.add(x, 2.02, zc, 1.0, 0.05, 0.48, '#5a3a22', 0.05);
    vb.add(x, 2.07, zc + 0.02, 1.04, 0.04, 0.52, '#6b4528', 0.05);
    for (const y of [0.06, 0.53, 1.01, 1.49]) {
      vb.add(x, y, zc, 0.9, 0.04, 0.44, '#4a2e1a', 0.06);
      // books on this shelf
      let bx = -0.42;
      while (bx < 0.4) {
        const r = rnd();
        if (r < 0.07) {
          // gap with a small object: potion, skull or candle
          const o = rnd();
          if (o < 0.4) {
            const c = ['#3ddc84', '#5ad1ff', '#ff5470'][Math.floor(rnd() * 3)];
            lit.add(x + bx + 0.06, y + 0.1, zc + 0.05, 0.09, 0.14, 0.09, c, 0.1);
            vb.add(x + bx + 0.06, y + 0.2, zc + 0.05, 0.04, 0.06, 0.04, '#d8d8e8', 0.05);
            vb.add(x + bx + 0.06, y + 0.24, zc + 0.05, 0.05, 0.03, 0.05, '#7a4a28', 0.05);
          } else if (o < 0.7) {
            vb.add(x + bx + 0.08, y + 0.1, zc + 0.04, 0.15, 0.14, 0.15, '#e8e0cc', 0.06);
            vb.add(x + bx + 0.04, y + 0.12, zc + 0.12, 0.04, 0.04, 0.01, '#1a1420', 0.02);
            vb.add(x + bx + 0.11, y + 0.12, zc + 0.12, 0.04, 0.04, 0.01, '#1a1420', 0.02);
          } else candle(ctx, x + bx + 0.07, zc + 0.05, y + 0.02, 0.14);
          bx += 0.18;
          continue;
        }
        const w = 0.05 + rnd() * 0.04;
        const h = 0.28 + rnd() * 0.13;
        const d = 0.28 + rnd() * 0.08;
        const col = BOOK_COLS[Math.floor(rnd() * BOOK_COLS.length)];
        const lean = rnd() < 0.08 && bx > -0.3 ? 0.28 : 0;
        const cx = x + bx + w / 2 + (lean ? 0.04 : 0);
        vb.add(cx, y + 0.02 + h / 2 - (lean ? 0.02 : 0), zc + 0.02, w, h, d, col, 0.1, 0, lean);
        // gold title band on the spine
        if (!lean) vb.add(cx, y + 0.02 + h * 0.7, zc + 0.02 + d / 2 + 0.003, w * 0.8, 0.025, 0.006, '#d8b04a', 0.05);
        bx += w + 0.008 + (lean ? 0.08 : 0);
      }
    }
    ctx.solid(x, 15);
    world.reserve(x, 14);
  };
  [2, 3, 4, 9, 10, 11].forEach(shelf);
  ctx.item({ id: 'shelf-l', x: 3, z: 15.8, radius: 1.6, prompt: () => T('prompts.books'), hitBox: [3, 1, 14.8, 2.9, 2, 0.5], sound: 'shelf', action: () => actions.fact('books') });
  ctx.item({ id: 'shelf-r', x: 10, z: 15.8, radius: 1.6, prompt: () => T('prompts.books'), hitBox: [10, 1, 14.8, 2.9, 2, 0.5], sound: 'shelf', action: () => actions.fact('books') });

  // ---------- Lectern with the open "About me" book ----------
  {
    const x = 6.5;
    const z = 18.5;
    disc(vb, x, 0.05, z, 0.4, 0.1, '#3b2414');
    disc(vb, x, 0.13, z, 0.3, 0.08, '#4a2e1a');
    vb.add(x, 0.55, z, 0.22, 0.8, 0.22, '#5a3a22', 0.06);
    vb.add(x, 0.55, z, 0.28, 0.12, 0.28, '#6b4528', 0.06);
    // slanted top + open book
    const tilt = 0.45;
    const top = (dx, dy, dz, w, h, d, c, j = 0.06) => vb.add(x + dx, 0.98 + dy + dz * Math.sin(tilt) * -1, z + dz * Math.cos(tilt), w, h, d, c, j, 0, 0, tilt);
    top(0, 0, 0, 0.82, 0.07, 0.58, '#6b4528');
    top(0, 0.02, -0.3, 0.86, 0.06, 0.06, '#4a2e1a');
    top(-0.19, 0.05, 0, 0.36, 0.04, 0.46, '#f3ead2', 0.03);
    top(0.19, 0.05, 0, 0.36, 0.04, 0.46, '#f3ead2', 0.03);
    for (let i = 0; i < 5; i++) {
      top(-0.19, 0.075, -0.15 + i * 0.07, 0.26, 0.01, 0.015, '#6a5a48', 0.05);
      top(0.19, 0.075, -0.15 + i * 0.07, 0.26, 0.01, 0.015, '#6a5a48', 0.05);
    }
    top(0, 0.07, 0, 0.03, 0.04, 0.48, '#8c2f39', 0.03);
    vb.add(x + 0.02, 0.86, z + 0.32, 0.03, 0.16, 0.01, '#8c2f39', 0.03); // ribbon hanging
    candle(ctx, x + 0.62, z - 0.1, 0, 0.5);
    const rune = glow('#ffd27a', 1.2, 0.55);
    rune.position.set(x, 1.25, z);
    scene.add(rune);
    const l = label({ key: 'labels.about' }, { color: '#ffd27a' });
    l.position.set(x, 1.75, z);
    scene.add(l);
    for (const [cx, cz] of [[6, 18], [7, 18], [6, 19], [7, 19]]) ctx.solid(cx, cz);
    const light = new THREE.PointLight('#ffd27a', 4, 4, 1.8);
    light.position.set(x, 1.6, z + 0.3);
    scene.add(light);
    ctx.updaters.push((t) => {
      rune.material.opacity = 0.45 + Math.sin(t * 2.2) * 0.12;
      l.position.y = 1.75 + Math.sin(t * 2) * 0.04;
    });
    ctx.item({ id: 'bio', x, z, radius: 1.9, prompt: () => T('prompts.bio'), hitBox: [x, 0.6, z, 0.9, 1.3, 0.8], sound: 'book', action: actions.bio });
  }

  // ---------- Trading desk with three live monitors → trading anecdotes ----------
  {
    const x = 4;
    const z = 22.6;
    vb.add(x, 0.76, z, 1.9, 0.06, 0.8, '#5a3a22', 0.05);
    vb.add(x, 0.72, z + 0.38, 1.9, 0.04, 0.04, '#4a2e1a', 0.05);
    for (const lx of [-0.88, 0.88]) for (const lz of [-0.34, 0.34]) vb.add(x + lx, 0.37, z + lz, 0.07, 0.74, 0.07, '#3b2414', 0.05);
    // drawer block
    vb.add(x + 0.62, 0.4, z, 0.5, 0.66, 0.72, '#4a2e1a', 0.05);
    for (const y of [0.22, 0.45, 0.66]) {
      vb.add(x + 0.62, y, z + 0.365, 0.44, 0.18, 0.01, '#5a3a22', 0.05);
      vb.add(x + 0.62, y, z + 0.375, 0.1, 0.025, 0.02, '#c9a24a', 0.05);
    }
    // monitors (screens are animated chart textures)
    [[-0.58, 0.32, 3], [0, 0, 7], [0.58, -0.32, 13]].forEach(([mx, rot, s]) => {
      const scr = chartScreen(40, 24, { seed: s, vol: 25 });
      const m = new THREE.Group();
      m.position.set(x + mx, 1.07, z - 0.15);
      m.rotation.y = rot;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.34, 0.04), new THREE.MeshLambertMaterial({ color: '#111118' }));
      m.add(frame);
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.28), new THREE.MeshBasicMaterial({ map: scr.texture }));
      sc.position.z = 0.022;
      m.add(sc);
      scene.add(m);
      vb.add(x + mx, 0.86, z - 0.17, 0.05, 0.18, 0.05, '#18181f', 0.05, rot);
      vb.add(x + mx, 0.8, z - 0.17, 0.2, 0.02, 0.14, '#18181f', 0.05, rot);
      ctx.updaters.push((t, dt) => scr.tick(dt));
    });
    // keyboard with keys, mouse, mug
    vb.add(x - 0.05, 0.8, z + 0.18, 0.5, 0.025, 0.16, '#22222c', 0.05);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 9; k++) vb.add(x - 0.25 + k * 0.05, 0.815, z + 0.13 + r * 0.045, 0.035, 0.012, 0.03, '#3a3a48', 0.2);
    vb.add(x + 0.32, 0.8, z + 0.2, 0.06, 0.03, 0.09, '#22222c', 0.05);
    vb.add(x - 0.62, 0.84, z + 0.18, 0.1, 0.12, 0.1, '#f0f0f0', 0.05);
    vb.add(x - 0.56, 0.85, z + 0.18, 0.03, 0.06, 0.03, '#f0f0f0', 0.05);
    vb.add(x - 0.62, 0.9, z + 0.18, 0.08, 0.01, 0.08, '#4a2a14', 0.05);
    // office chair (seen from behind)
    const cz = z + 0.75;
    vb.add(x, 0.48, cz, 0.5, 0.08, 0.48, '#1c1c26', 0.05);
    vb.add(x, 0.82, cz + 0.22, 0.5, 0.6, 0.08, '#1c1c26', 0.05);
    vb.add(x, 0.25, cz, 0.06, 0.4, 0.06, '#555566', 0.05);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      vb.add(x + Math.cos(a) * 0.17, 0.04, cz + Math.sin(a) * 0.17, 0.3, 0.04, 0.05, '#2a2a34', 0.05, -a);
    }
    // steam from the mug
    const steam = [];
    for (let i = 0; i < 6; i++) {
      const g = glow('#ffffff', 0.12, 0);
      scene.add(g);
      steam.push(g);
    }
    ctx.updaters.push((t) =>
      steam.forEach((g, i) => {
        const p = (t * 0.4 + i / steam.length) % 1;
        g.position.set(x - 0.62 + Math.sin(t * 2 + i) * 0.03, 0.95 + p * 0.4, z + 0.18);
        g.material.opacity = (1 - p) * 0.35;
      }),
    );
    for (const cx of [3, 4, 5]) for (const cz2 of [22, 23]) ctx.solid(cx, cz2);
    ctx.item({ id: 'pc', x, z: 22.4, radius: 1.9, prompt: () => T('prompts.pc'), hitBox: [x, 0.8, z, 1.9, 1.0, 1.2], sound: 'pc', action: () => actions.fact('trading') });
  }

  // ---------- Globe on a wooden stand ----------
  {
    const gx = 10;
    const gz = 21.5;
    const globe = new THREE.Group();
    globe.position.set(gx, 0.95, gz);
    const part = new VoxelPart(0.055, 5);
    const R = 4.5;
    for (let x = -5; x < 5; x++)
      for (let y = -5; y < 5; y++)
        for (let z = -5; z < 5; z++) {
          const cx = x + 0.5;
          const cy = y + 0.5;
          const cz = z + 0.5;
          if (cx * cx + cy * cy + cz * cz > R * R) continue;
          const land = Math.sin(cx * 0.9) + Math.cos(cz * 0.8 + cy * 0.5) > 0.6;
          part.fill(x, y, z, 1, 1, 1, land ? '#4a8a3a' : '#2f5d9c');
        }
    part.build(globe);
    globe.rotation.z = 0.4;
    scene.add(globe);
    vb.add(gx, 0.95, gz, 0.04, 0.62, 0.62, '#c9a24a', 0.05, 0, 0.4); // meridian ring
    vb.add(gx, 0.45, gz, 0.08, 0.6, 0.08, '#5a3a22', 0.05);
    disc(vb, gx, 0.06, gz, 0.25, 0.08, '#4a2e1a');
    ctx.solid(gx, gz);
    ctx.updaters.push((t) => (globe.rotation.y = t * 0.4));
  }

  // ---------- Rug, book stacks, candles ----------
  rug(ctx, 4, 17, 9, 21, '#b8902c', '#25305a', '#7a5c26');
  bookStack(ctx, 11, 24, 6);
  bookStack(ctx, 2, 18, 4);
  bookStack(ctx, 11, 17, 3);
  candle(ctx, 2.3, 23.7);
  candle(ctx, 2.6, 24.2, 0, 0.16);
  candle(ctx, 10.6, 23.2);
}
