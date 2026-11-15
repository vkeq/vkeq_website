import * as THREE from 'three';
import { mat, label, glow, VoxelPart } from '../voxel.js';
import { t as T } from '../i18n.js';
import { rug, goldBars, coinPile, sparkles } from './decor.js';
import { chartScreen } from './screens.js';
import { visionMaterial } from '../vision.js';

// Treasure room: x 13..27, z 2..11.
export function buildTreasury(ctx) {
  const { scene, world, actions, vb } = ctx;

  // ---------- Wall screen with a live chart (decorative, not interactive) ----------
  {
    const scr = chartScreen(160, 72, { header: 'NQ 1m', seed: 5 });
    const g = new THREE.Group();
    g.position.set(20, 0, 1.55);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.05, 0.1), mat('#15151d'));
    frame.position.y = 1.12;
    g.add(frame);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 1.9), new THREE.MeshBasicMaterial({ map: scr.texture }));
    screen.position.set(0, 1.12, 0.06);
    g.add(screen);
    scene.add(g);
    vb.add(20, 0.08, 1.62, 4.6, 0.06, 0.06, '#2a2a34', 0.05);
    vb.add(21.9, 0.14, 1.62, 0.3, 0.06, 0.04, '#3ddc84', 0.05);
    for (let x = 18; x <= 22; x++) world.reserve(x, 1);
    const sl = new THREE.PointLight('#5ad1ff', 6, 6, 1.6);
    sl.position.set(20, 1.3, 2.6);
    scene.add(sl);
    ctx.updaters.push((t, dt) => scr.tick(dt));
  }

  // ---------- Treasure chest (performance) ----------
  {
    const cx = 20;
    const cz = 6.5;
    const g = new THREE.Group();
    g.position.set(cx, 0, cz);
    g.scale.setScalar(1.25);
    scene.add(g);
    const part = new VoxelPart(0.05, 9);
    const W = 11;
    const D = 7;
    const WOOD = ['#7a4724', '#6b3f1f', '#83502a'];
    // body: planks with seams
    for (let y = 0; y < 9; y++) {
      const plank = WOOD[Math.floor(y / 3) % 3];
      part.fill(-W, y, -D, W * 2, 1, D * 2, y % 3 === 2 ? '#4a2a14' : plank);
    }
    // iron bands + gold corners
    for (const bx of [-W + 2, W - 3]) part.fill(bx, 0, -D - 0.5 + 0.5, 1, 9, D * 2, '#2c2a30');
    for (const [bx, bz] of [[-W, -D], [W - 1, -D], [-W, D - 1], [W - 1, D - 1]]) part.fill(bx, 0, bz, 1, 9, 1, '#d8a830');
    part.fill(-W, 0, -D, W * 2, 1, D * 2, '#d8a830');
    part.fill(-W, 8, -D, W * 2, 1, D * 2, '#d8a830');
    // side handles
    part.fill(-W - 1, 4, -1, 1, 1, 2, '#2c2a30');
    part.fill(W, 4, -1, 1, 1, 2, '#2c2a30');
    const body = new THREE.Group();
    part.build(body);
    g.add(body);
    // gold heap inside
    const inside = new VoxelPart(0.05, 4);
    for (let x = -W + 1; x < W - 1; x++)
      for (let z = -D + 1; z < D - 1; z++) {
        const h = 1 + Math.round(1.5 + Math.sin(x * 0.7) * Math.cos(z * 0.9) * 1.5);
        inside.fill(x, 9, z, 1, h, 1, (x + z) % 3 ? '#ffd84a' : '#f0b830');
      }
    inside.fill(-2, 12, -1, 1, 1, 1, '#ff3b6b');
    inside.fill(3, 12, 1, 1, 1, 1, '#3ddcff');
    const gold = new THREE.Group();
    inside.build(gold, { basic: true });
    g.add(gold);
    // lid (rounded top made of steps), hinged at the back
    const lid = new THREE.Group();
    lid.position.set(0, 9 * 0.05, -D * 0.05);
    const lp = new VoxelPart(0.05, 10);
    const steps = [[0, 2, 0, D * 2], [2, 1, 1, D * 2 - 2], [3, 1, 2, D * 2 - 4]];
    for (const [y0, h, inset, d] of steps) {
      lp.fill(-W, y0, inset, W * 2, h, d, WOOD[y0 % 3]);
    }
    for (const bx of [-W + 2, W - 3]) for (const [y0, h, inset, d] of steps) lp.fill(bx, y0, inset, 1, h + 0.0, d, '#2c2a30');
    lp.fill(-W, 0, 0, W * 2, 1, 1, '#d8a830');
    lp.fill(-W, 0, D * 2 - 1, W * 2, 1, 1, '#d8a830');
    // lock plate with keyhole
    lp.fill(-1, -2, D * 2, 2, 3, 1, '#ffd84a');
    lp.fill(-0.5, -1, D * 2 + 1, 1, 1, 1, '#1a1018');
    lp.build(lid);
    g.add(lid);

    const halo = glow('#ffd24a', 2.6, 0);
    halo.position.y = 0.9;
    g.add(halo);
    const l = label({ key: 'labels.performance' }, { color: '#ffd84a' });
    l.position.set(0, 1.6, 0);
    g.add(l);
    const light = new THREE.PointLight('#ffcc55', 2, 5, 1.6);
    light.position.set(cx, 1.4, cz + 0.4);
    scene.add(light);
    sparkles(ctx, cx, 0.2, cz, { count: 30, radius: 1.0, height: 1.6 });
    for (const [x, z] of [[19, 6], [20, 6], [21, 6], [19, 7], [20, 7], [21, 7]]) ctx.solid(x, z);

    // coin burst particles on open
    const coins = [];
    const coinGeo = new THREE.BoxGeometry(0.09, 0.09, 0.02);
    const coinMat = visionMaterial(new THREE.MeshBasicMaterial({ color: '#ffd84a' }));
    let open = 0;
    let target = 0;
    ctx.updaters.push((t, dt) => {
      open += (target - open) * Math.min(1, dt * 6);
      lid.rotation.x = -open * 1.9;
      halo.material.opacity = 0.15 + open * 0.45 + Math.sin(t * 3) * 0.05;
      light.intensity = 2 + open * 6 + Math.sin(t * 3) * 0.5;
      gold.visible = open > 0.05;
      l.position.y = 1.6 + Math.sin(t * 2) * 0.04;
      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        c.v.y -= 9 * dt;
        c.m.position.addScaledVector(c.v, dt);
        c.m.rotation.y += dt * 12;
        if (c.m.position.y < 0.05) {
          c.m.position.y = 0.05;
          c.v.multiplyScalar(0.4);
          c.v.y = Math.abs(c.v.y) * 0.5;
          c.life -= dt * 3;
        }
        c.life -= dt;
        if (c.life <= 0) {
          scene.remove(c.m);
          coins.splice(i, 1);
        }
      }
    });
    const burst = () => {
      for (let i = 0; i < 28; i++) {
        const m = new THREE.Mesh(coinGeo, coinMat);
        m.position.set(cx, 0.8, cz);
        scene.add(m);
        const a = Math.random() * Math.PI * 2;
        const sp = 1 + Math.random() * 2;
        coins.push({ m, v: new THREE.Vector3(Math.cos(a) * sp, 3 + Math.random() * 2.5, Math.sin(a) * sp), life: 2 + Math.random() });
      }
    };
    ctx.item({
      id: 'chest',
      x: cx,
      z: cz,
      radius: 2.1,
      prompt: () => T('prompts.chest'),
      hit: g,
      sound: 'chest',
      action: () => {
        if (target === 0) burst();
        target = 1;
        actions.performance(() => (target = 0));
      },
    });
  }

  // ---------- Golden bull and bear statues ----------
  statue(ctx, 16.5, 6.5, 'bull');
  statue(ctx, 23.5, 6.5, 'bear');

  // ---------- Gold: coin piles + bars → gold market anecdotes ----------
  for (const [x, z] of [[15, 4], [25, 4], [15, 9], [25, 9]]) {
    coinPile(ctx, x, z);
    sparkles(ctx, x, 0.1, z, { count: 8, radius: 0.5, height: 0.8 });
    ctx.item({ id: `gold-${x}-${z}`, x, z, radius: 1.4, prompt: () => T('prompts.gold'), hitBox: [x, 0.2, z, 1, 0.5, 1], sound: 'gold', action: () => actions.fact('gold') });
  }
  for (const [x, z, r] of [[14, 2, 0.2], [26, 2, -0.2], [13, 11, 0.5], [27, 11, -0.4]]) {
    goldBars(ctx, x, z, r);
    ctx.item({ id: `bars-${x}-${z}`, x, z, radius: 1.4, prompt: () => T('prompts.gold'), hitBox: [x, 0.2, z, 0.9, 0.4, 0.9], sound: 'gold', action: () => actions.fact('gold') });
  }

  rug(ctx, 18, 4, 22, 9, '#c9a24a', '#4e1a28', '#9a7424');
}

// Small golden voxel statue on a stone plinth.
function statue(ctx, x, z, kind) {
  const { scene, vb } = ctx;
  vb.add(x, 0.15, z, 0.9, 0.3, 0.6, '#4a4460', 0.08);
  vb.add(x, 0.33, z, 0.8, 0.06, 0.5, '#5c5578', 0.08);
  vb.add(x, 0.08, z, 1.0, 0.16, 0.7, '#3e3854', 0.08);
  const p = new VoxelPart(0.05, kind === 'bull' ? 21 : 22);
  const G = '#e8b838';
  const D = '#b8862a';
  if (kind === 'bull') {
    p.fill(-6, 4, -3, 11, 6, 6, G); // body
    p.fill(-6, 8, -3, 6, 3, 6, G); // hump
    for (const lx of [-6, 2]) for (const lz of [-3, 1]) p.fill(lx, 0, lz, 2, 4, 2, D);
    p.fill(5, 6, -2, 4, 4, 4, G); // head
    p.fill(8, 6, -1, 2, 2, 2, D); // snout
    p.fill(5, 10, -4, 2, 1, 2, '#fff2b0'); // horns
    p.fill(5, 10, 2, 2, 1, 2, '#fff2b0');
    p.fill(6, 11, -5, 1, 2, 1, '#fff2b0');
    p.fill(6, 11, 4, 1, 2, 1, '#fff2b0');
    p.fill(-7, 6, 0, 1, 4, 1, D); // tail
  } else {
    p.fill(-5, 3, -3, 10, 7, 6, G);
    for (const lx of [-5, 2]) for (const lz of [-3, 1]) p.fill(lx, 0, lz, 3, 3, 2, D);
    p.fill(4, 6, -2, 4, 5, 4, G); // head
    p.fill(8, 6, -1, 1, 2, 2, D); // snout
    p.fill(9, 7, -1, 1, 1, 2, '#1a1018'); // nose
    p.fill(4, 11, -2, 2, 2, 1, D); // ears
    p.fill(4, 11, 1, 2, 2, 1, D);
  }
  const g = new THREE.Group();
  p.build(g);
  g.position.set(x, 0.36, z);
  g.rotation.y = kind === 'bull' ? -0.5 : Math.PI + 0.5; // facing each other / the chest
  scene.add(g);
  const s = glow('#ffe27a', 1.2, 0.25);
  s.position.set(x, 0.8, z);
  scene.add(s);
  ctx.solid(x, z);
}
