import * as THREE from 'three';
import { box, mat, label, glow, voxelText, VoxBatch } from './voxel.js';
import { CONFIG } from './config.js';
import { t as T } from './i18n.js';

// Each builder adds meshes to the scene, marks solid cells on the grid and
// returns interactables: { id, x, z, radius, prompt, hit, action, update }.

export function buildProps(scene, grid, world, actions) {
  const items = [];
  const updaters = [];
  const solid = (x, z) => grid.block(x, z);

  // ======================= INGRESSO =======================
  {
    // Notice board mounted on the north wall (west of the corridor)
    const g = new THREE.Group();
    g.position.set(16.5, 0, 14.55);
    box(g, 1.7, 1.1, 0.08, '#5a3a22', 0, 1.15, 0);
    box(g, 1.5, 0.9, 0.06, '#2b1b10', 0, 1.15, 0.04);
    box(g, 0.5, 0.36, 0.02, '#e8dcb0', -0.38, 1.28, 0.08);
    box(g, 0.46, 0.5, 0.02, '#f0e6c8', 0.2, 1.1, 0.08);
    box(g, 0.36, 0.26, 0.02, '#d9c48a', 0.5, 1.38, 0.08);
    box(g, 0.05, 0.05, 0.03, '#d0302a', -0.38, 1.44, 0.1);
    box(g, 0.05, 0.05, 0.03, '#d0302a', 0.2, 1.33, 0.1);
    const t = label({ key: 'labels.welcome' }, { color: '#ffe9a8' });
    t.position.set(0, 1.85, 0.1);
    g.add(t);
    scene.add(g);
    world.reserve(16, 14);
    world.reserve(17, 14);
    items.push({ id: 'welcome', x: 16.5, z: 15.2, radius: 1.6, prompt: () => T('prompts.welcome'), hit: g, action: actions.welcome });
  }
  {
    // Banner with emblem (east of corridor)
    const g = new THREE.Group();
    g.position.set(23.5, 0, 14.56);
    box(g, 1.3, 0.08, 0.08, '#5a3a22', 0, 1.9, 0);
    box(g, 1.1, 1.3, 0.04, '#5b1e2e', 0, 1.2, 0.02);
    box(g, 1.1, 0.1, 0.05, '#f5c542', 0, 0.58, 0.03);
    // candlestick emblem
    [[-0.25, 1.15, 0.36, '#3ddc84'], [0, 1.3, 0.5, '#3ddc84'], [0.25, 1.1, 0.3, '#ff5470']].forEach(([x, y, h, c]) => {
      box(g, 0.12, h, 0.03, c, x, y, 0.06, { emissive: c, emissiveIntensity: 0.4 });
      box(g, 0.03, h + 0.18, 0.02, c, x, y, 0.06);
    });
    scene.add(g);
    world.reserve(23, 14);
    world.reserve(24, 14);
  }
  // Pillars
  for (const [x, z] of [[17, 17], [23, 17], [17, 22], [23, 22]]) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const shade = ['#5c5578', '#544d6e', '#615a7e', '#4f4868'];
    box(g, 0.9, 0.12, 0.9, '#3e3854', 0, 0.06, 0);
    box(g, 0.76, 0.14, 0.76, '#4a4460', 0, 0.19, 0);
    for (let i = 0; i < 5; i++) {
      const w = 0.56 + ((i * 7 + x) % 3) * 0.03;
      box(g, w, 0.34, w, shade[(i + z) % 4], (((i * 13 + x) % 3) - 1) * 0.015, 0.43 + i * 0.35, 0);
    }
    box(g, 0.08, 0.5, 0.02, '#2e2940', 0.12, 1.0, 0.3); // crack
    box(g, 0.76, 0.14, 0.76, '#4a4460', 0, 2.2, 0);
    box(g, 0.9, 0.12, 0.9, '#3e3854', 0, 2.33, 0);
    box(g, 0.3, 0.12, 0.3, '#3f6b45', 0.2, 2.42, -0.15); // moss
    scene.add(g);
    solid(x, z);
  }
  // Voxel title over the treasury corridor
  {
    const t = voxelText(CONFIG.name.toUpperCase(), { voxel: 0.11, depth: 0.14 });
    t.position.set(20, 1.15, 14.65);
    scene.add(t);
    updaters.push((time) => {
      t.position.y = 1.2 + Math.sin(time * 1.5) * 0.06;
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

  // ======================= BIBLIOTECA =======================
  {
    // Bookshelves along the north wall
    const bookColors = ['#8c2f39', '#2f5d8c', '#3f7d4a', '#c9a24a', '#6a3f8c', '#b5652b'];
    let bi = 0;
    for (const x of [2, 3, 4, 9, 10, 11]) {
      const g = new THREE.Group();
      g.position.set(x, 0, 15);
      box(g, 0.96, 1.9, 0.6, '#4a2e1a', 0, 0.95, -0.15);
      for (let shelf = 0; shelf < 3; shelf++) {
        const y = 0.35 + shelf * 0.55;
        box(g, 0.86, 0.04, 0.5, '#2e1c10', 0, y - 0.03, -0.1);
        let bx = -0.38;
        while (bx < 0.36) {
          const w = 0.07 + ((bi * 7) % 5) * 0.015;
          const h = 0.32 + ((bi * 13) % 4) * 0.04;
          box(g, w, h, 0.36, bookColors[bi % bookColors.length], bx + w / 2, y + h / 2, -0.05);
          bx += w + 0.012;
          bi++;
        }
      }
      scene.add(g);
      solid(x, 15);
      world.reserve(x, 14);
    }
    // Lectern with open book (bio)
    const g = new THREE.Group();
    g.position.set(6.5, 0, 18.5);
    box(g, 0.7, 0.12, 0.5, '#3b2414', 0, 0.06, 0);
    box(g, 0.24, 0.85, 0.24, '#5a3a22', 0, 0.5, 0);
    const top = new THREE.Group();
    top.position.set(0, 0.95, 0);
    top.rotation.x = 0.45;
    box(top, 0.8, 0.07, 0.55, '#6b4528', 0, 0, 0);
    box(top, 0.34, 0.04, 0.44, '#f3ead2', -0.18, 0.05, 0);
    box(top, 0.34, 0.04, 0.44, '#f3ead2', 0.18, 0.05, 0);
    box(top, 0.03, 0.05, 0.46, '#8c2f39', 0, 0.06, 0);
    g.add(top);
    const rune = glow('#ffd27a', 1.1, 0.55);
    rune.position.set(0, 1.25, 0);
    g.add(rune);
    const l = label({ key: 'labels.about' }, { color: '#ffd27a' });
    l.position.set(0, 1.7, 0);
    g.add(l);
    scene.add(g);
    for (const [x, z] of [[6, 18], [7, 18], [6, 19], [7, 19]]) solid(x, z);
    const light = new THREE.PointLight('#ffd27a', 4, 4, 1.8);
    light.position.set(6.5, 1.6, 18.8);
    scene.add(light);
    updaters.push((t) => {
      rune.material.opacity = 0.45 + Math.sin(t * 2.2) * 0.12;
      l.position.y = 1.7 + Math.sin(t * 2) * 0.04;
    });
    items.push({ id: 'bio', x: 6.5, z: 18.5, radius: 1.9, prompt: () => T('prompts.bio'), hit: g, action: actions.bio });

    // Trading desk with monitors (decor)
    const d = new THREE.Group();
    d.position.set(4, 0, 22.5);
    box(d, 1.8, 0.08, 0.8, '#4a2e1a', 0, 0.75, 0);
    for (const x of [-0.8, 0.8]) for (const z of [-0.32, 0.32]) box(d, 0.08, 0.75, 0.08, '#2e1c10', x, 0.37, z);
    [[-0.55, 0.25], [0, 0], [0.55, -0.25]].forEach(([x, rot]) => {
      const m = new THREE.Group();
      m.position.set(x, 1.05, -0.15);
      m.rotation.y = rot;
      box(m, 0.5, 0.32, 0.04, '#111118', 0, 0, 0);
      box(m, 0.44, 0.26, 0.01, '#0e2a22', 0, 0, 0.025, { emissive: '#0e3a2a' });
      box(m, 0.06, 0.18, 0.04, '#111118', 0, -0.22, -0.02);
      d.add(m);
    });
    box(d, 0.5, 0.03, 0.18, '#22222c', 0, 0.8, 0.2);
    scene.add(d);
    for (const x of [3, 4, 5]) solid(x, 22);
    solid(3, 23); solid(4, 23); solid(5, 23);
  }

  // ======================= SALA DEL TESORO =======================
  {
    // Big wall-mounted trading screen with an animated candlestick chart
    const cw = 160;
    const ch = 72;
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    const candles = [];
    let price = 21000;
    const pushCandle = () => {
      const o = price;
      const c = o + (Math.random() - 0.46) * 40;
      const h = Math.max(o, c) + Math.random() * 15;
      const l = Math.min(o, c) - Math.random() * 15;
      price = c;
      candles.push({ o, c, h, l });
      if (candles.length > 30) candles.shift();
    };
    for (let i = 0; i < 30; i++) pushCandle();
    const drawChart = (blink) => {
      ctx.fillStyle = '#060b10';
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = '#0d1a22';
      for (let y = 14; y < ch; y += 12) ctx.fillRect(0, y, cw, 1);
      for (let x = 0; x < cw; x += 20) ctx.fillRect(x, 10, 1, ch);
      const hi = Math.max(...candles.map((c) => c.h));
      const lo = Math.min(...candles.map((c) => c.l));
      const Y = (v) => Math.round(12 + (1 - (v - lo) / (hi - lo || 1)) * (ch - 18));
      candles.forEach((c, i) => {
        const x = 4 + i * 5;
        const up = c.c >= c.o;
        ctx.fillStyle = up ? '#3ddc84' : '#ff5470';
        ctx.fillRect(x + 1, Y(c.h), 1, Math.max(1, Y(c.l) - Y(c.h)));
        const top = Y(Math.max(c.o, c.c));
        ctx.fillRect(x, top, 3, Math.max(1, Y(Math.min(c.o, c.c)) - top));
      });
      ctx.fillStyle = '#0a1218';
      ctx.fillRect(0, 0, cw, 10);
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#9fb8c8';
      ctx.fillText('NQ 1m', 2, 1);
      const last = candles[candles.length - 1];
      ctx.fillStyle = last.c >= last.o ? '#3ddc84' : '#ff5470';
      ctx.fillText(price.toFixed(0), 64, 1);
      if (blink) {
        ctx.fillStyle = '#ff5470';
        ctx.fillRect(cw - 8, 2, 5, 5);
      }
      tex.needsUpdate = true;
    };
    drawChart(true);

    const g = new THREE.Group();
    g.position.set(20, 0, 1.55);
    box(g, 4.5, 2.05, 0.1, '#15151d', 0, 1.12, 0);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 1.9), new THREE.MeshBasicMaterial({ map: tex }));
    screen.position.set(0, 1.12, 0.06);
    g.add(screen);
    box(g, 0.3, 0.06, 0.04, '#3ddc84', 1.9, 0.14, 0.06, { emissive: '#3ddc84' });
    scene.add(g);
    for (let x = 18; x <= 22; x++) world.reserve(x, 1);
    const sl = new THREE.PointLight('#5ad1ff', 6, 6, 1.6);
    sl.position.set(20, 1.3, 2.6);
    scene.add(sl);
    let acc = 0;
    let n = 0;
    updaters.push((t, dt) => {
      acc += dt;
      if (acc > 0.35) {
        acc = 0;
        n++;
        const last = candles[candles.length - 1];
        const move = (Math.random() - 0.47) * 12;
        last.c += move;
        last.h = Math.max(last.h, last.c);
        last.l = Math.min(last.l, last.c);
        price = last.c;
        if (n % 8 === 0) pushCandle();
        drawChart(n % 2 === 0);
      }
    });
    items.push({ id: 'equity', x: 20, z: 2.4, radius: 2.3, prompt: () => T('prompts.equity'), hit: screen, action: actions.equity });
  }
  {
    // Treasure chest (performance stats)
    const g = new THREE.Group();
    g.position.set(20, 0, 6.5);
    box(g, 1.1, 0.55, 0.75, '#6b3f1f', 0, 0.3, 0);
    box(g, 1.14, 0.08, 0.79, '#f5c542', 0, 0.08, 0);
    box(g, 1.14, 0.06, 0.79, '#f5c542', 0, 0.55, 0);
    for (const x of [-0.42, 0.42]) box(g, 0.08, 0.56, 0.8, '#c9962c', x, 0.3, 0);
    const lid = new THREE.Group();
    lid.position.set(0, 0.58, -0.38);
    box(lid, 1.1, 0.28, 0.76, '#7a4724', 0, 0.14, 0.38);
    box(lid, 1.14, 0.06, 0.8, '#f5c542', 0, 0.28, 0.38);
    for (const x of [-0.42, 0.42]) box(lid, 0.08, 0.3, 0.8, '#c9962c', x, 0.14, 0.38);
    box(lid, 0.16, 0.2, 0.06, '#f5c542', 0, 0.02, 0.78, { emissive: '#6a4a10' });
    g.add(lid);
    // gold inside
    const gold = box(g, 0.94, 0.08, 0.6, '#ffd84a', 0, 0.56, 0, { emissive: '#a07010', emissiveIntensity: 0.8 });
    const halo = glow('#ffd24a', 2.2, 0);
    halo.position.y = 0.9;
    g.add(halo);
    const l = label({ key: 'labels.performance' }, { color: '#ffd84a' });
    l.position.set(0, 1.55, 0);
    g.add(l);
    scene.add(g);
    for (const [x, z] of [[20, 6], [20, 7]]) solid(x, z);
    const light = new THREE.PointLight('#ffcc55', 0, 5, 1.6);
    light.position.set(20, 1.4, 6.8);
    scene.add(light);

    // coin burst particles
    const coins = [];
    const coinGeo = new THREE.BoxGeometry(0.09, 0.09, 0.02);
    const coinMat = mat('#ffd84a', { emissive: '#a07010' });
    let open = 0;
    let target = 0;
    updaters.push((t, dt) => {
      open += (target - open) * Math.min(1, dt * 6);
      lid.rotation.x = -open * 1.9;
      halo.material.opacity = open * 0.55;
      light.intensity = open * 7;
      gold.visible = open > 0.05;
      l.position.y = 1.55 + Math.sin(t * 2) * 0.04;
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
      for (let i = 0; i < 24; i++) {
        const m = new THREE.Mesh(coinGeo, coinMat);
        m.position.set(20, 0.7, 6.5);
        scene.add(m);
        const a = Math.random() * Math.PI * 2;
        const sp = 1 + Math.random() * 2;
        coins.push({ m, v: new THREE.Vector3(Math.cos(a) * sp, 3 + Math.random() * 2.5, Math.sin(a) * sp), life: 2 + Math.random() });
      }
    };
    items.push({
      id: 'chest',
      x: 20,
      z: 6.5,
      radius: 1.9,
      prompt: () => T('prompts.chest'),
      hit: g,
      action: () => {
        if (target === 0) burst();
        target = 1;
        actions.performance(() => (target = 0));
      },
    });
  }
  // Coin piles + payout scroll stands (decor)
  for (const [x, z] of [[15, 4], [25, 4], [15, 9], [25, 9]]) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    for (let i = 0; i < 18; i++) {
      const lvl = i < 9 ? 0 : i < 15 ? 1 : 2;
      const a = i * 2.4;
      const rad = [0.32, 0.2, 0.06][lvl];
      box(g, 0.16, 0.08, 0.16, i % 3 ? '#ffd84a' : '#e0b030', Math.cos(a) * rad, 0.05 + lvl * 0.09, Math.sin(a) * rad, { emissive: '#4a3408' });
    }
    const sp = glow('#ffe27a', 0.5, 0.5);
    sp.position.y = 0.4;
    g.add(sp);
    updaters.push((t) => {
      sp.material.opacity = Math.max(0, Math.sin(t * 3 + x * 7 + z)) * 0.7;
      sp.position.set(Math.sin(t + x) * 0.2, 0.3 + Math.cos(t * 1.3 + z) * 0.08, Math.cos(t * 0.8 + x) * 0.2);
    });
    scene.add(g);
    solid(x, z);
  }

  // ======================= SALA DEI PORTALI =======================
  {
    // Portal arch on the north wall
    const g = new THREE.Group();
    g.position.set(33.5, 0, 14.6);
    const stone = '#4b4466';
    for (const x of [-1.3, 1.3]) box(g, 0.45, 2.4, 0.5, stone, x, 1.2, 0);
    box(g, 3.05, 0.45, 0.5, stone, 0, 2.6, 0);
    box(g, 0.5, 0.3, 0.55, '#8a5cff', 0, 2.6, 0.02, { emissive: '#8a5cff', emissiveIntensity: 0.6 });
    const portalMat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: { uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `
        varying vec2 vUv; uniform float uTime;
        void main(){
          vec2 p = floor(vUv * vec2(28.0, 26.0)) / vec2(28.0, 26.0) - 0.5;
          p.x *= 1.08;
          float r = length(p);
          if (r > 0.5) discard;
          float a = atan(p.y, p.x);
          float s = sin(a * 3.0 + r * 18.0 - uTime * 3.0) * 0.5 + 0.5;
          float q = floor((s * (1.0 - r * 1.2) + 0.15) * 4.0) / 4.0;
          vec3 c = mix(vec3(0.12,0.04,0.3), vec3(0.62,0.38,1.0), q);
          c = mix(c, vec3(0.9,0.85,1.0), step(0.45, r) * 0.6);
          gl_FragColor = vec4(c, 0.95);
        }`,
    });
    const portal = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 2.25), portalMat);
    portal.position.set(0, 1.25, 0.05);
    g.add(portal);
    const l = label({ key: 'labels.social' }, { color: '#d9c4ff' });
    l.position.set(0, 3.15, 0.2);
    g.add(l);
    scene.add(g);
    for (let x = 32; x <= 35; x++) {
      world.reserve(x, 14);
      solid(x, 15);
    }
    const pl = new THREE.PointLight('#9a6cff', 10, 8, 1.5);
    pl.position.set(33.5, 1.4, 16);
    scene.add(pl);
    // swirling particles
    const pc = 60;
    const pp = new Float32Array(pc * 3);
    const pgeo = new THREE.BufferGeometry();
    pgeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    const pts = new THREE.Points(pgeo, new THREE.PointsMaterial({ color: '#c8a8ff', size: 0.07, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(pts);
    updaters.push((t) => {
      portalMat.uniforms.uTime.value = t;
      pl.intensity = 9 + Math.sin(t * 2) * 2;
      for (let i = 0; i < pc; i++) {
        const a = t * (0.6 + (i % 5) * 0.15) + i * 1.7;
        const r = 1.0 + ((i * 37) % 10) * 0.05 + Math.sin(t + i) * 0.05;
        pp[i * 3] = 33.5 + Math.cos(a) * r;
        pp[i * 3 + 1] = 1.25 + Math.sin(a) * r;
        pp[i * 3 + 2] = 14.9 + ((t * 0.5 + i * 0.13) % 1) * 1.2;
      }
      pgeo.attributes.position.needsUpdate = true;
    });
    items.push({ id: 'portal', x: 33.5, z: 16, radius: 1.9, prompt: () => T('prompts.portal'), hit: g, action: actions.allSocials });
  }
  {
    // One crystal pedestal per social link
    const spots = [[31, 18], [32, 21], [34.5, 22.3], [37, 21], [37, 18], [34.5, 19]];
    CONFIG.socials.forEach((s, i) => {
      let [x, z] = spots[i] || [30 + (i % 4) * 2.5, 23];
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      box(g, 0.7, 0.15, 0.7, '#3a3452', 0, 0.075, 0);
      box(g, 0.45, 0.6, 0.45, '#4b4466', 0, 0.45, 0);
      box(g, 0.6, 0.1, 0.6, '#3a3452', 0, 0.8, 0);
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.24, 0),
        new THREE.MeshLambertMaterial({ color: s.color, emissive: s.color, emissiveIntensity: 0.55, flatShading: true }),
      );
      crystal.scale.y = 1.5;
      crystal.position.y = 1.3;
      g.add(crystal);
      const gl = glow(s.color, 1.2, 0.45);
      gl.position.y = 1.3;
      g.add(gl);
      const l = label(s.label, { color: s.color === '#e8e8f0' ? '#ffffff' : s.color });
      l.position.y = 1.95;
      g.add(l);
      scene.add(g);
      solid(Math.round(x), Math.round(z));
      updaters.push((t) => {
        crystal.rotation.y = t * 1.2 + i;
        crystal.position.y = 1.3 + Math.sin(t * 2 + i) * 0.08;
        gl.material.opacity = 0.35 + Math.sin(t * 2.5 + i) * 0.1;
      });
      items.push({ id: 'social-' + s.id, x, z, radius: 1.5, prompt: s.label, hit: g, action: () => actions.social(s) });
    });
  }

  // ======================= DECOR (voxel batches) =======================
  const vb = new VoxBatch(5);
  const lit = new VoxBatch(6, { glow: true });
  const rugCells = new Set();
  const rug = (x0, z0, x1, z1, edge, fill, motif) => {
    for (let z = z0; z <= z1; z++)
      for (let x = x0; x <= x1; x++) {
        rugCells.add(`${x},${z}`);
        vb.add(x, 0.012, z, 1, 0.024, 1, fill, 0.06);
        const inner = x > x0 && x < x1 && z > z0 && z < z1;
        if (inner && motif && (x + z) % 2 === 0) vb.add(x, 0.026, z, 0.3, 0.01, 0.3, motif, 0.05, Math.PI / 4);
      }
    // thin double border
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
    // fringe
    for (let x = x0; x <= x1; x++)
      for (const z of [z0 - 0.55, z1 + 0.55]) for (let i = -2; i <= 2; i++) vb.add(x + i * 0.18, 0.01, z, 0.06, 0.02, 0.12, edge);
  };
  const barrel = (x, z) => {
    vb.add(x, 0.36, z, 0.5, 0.72, 0.5, '#6b4226');
    vb.add(x, 0.36, z, 0.58, 0.4, 0.58, '#7a4c2c');
    for (const y of [0.12, 0.6]) vb.add(x, y, z, 0.54, 0.05, 0.54, '#2e2a30', 0.05);
    vb.add(x, 0.73, z, 0.42, 0.02, 0.42, '#4a2e1a');
    solid(Math.round(x), Math.round(z));
  };
  const crate = (x, z, sz = 0.62, y0 = 0) => {
    vb.add(x, y0 + sz / 2, z, sz, sz, sz, '#9a6a3a');
    for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) vb.add(x + (dx * sz) / 2, y0 + sz / 2, z + (dz * sz) / 2, 0.08, sz + 0.02, 0.08, '#5a3a1e', 0.05);
    vb.add(x, y0 + sz / 2, z + sz / 2 + 0.01, sz * 0.9, 0.07, 0.02, '#5a3a1e', 0.05, 0);
    solid(Math.round(x), Math.round(z));
  };
  const crystals = (x, z, color) => {
    const r = Math.sin(x * 12.9 + z * 78.2) * 43758.5;
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05 + r;
      const h = 0.35 + ((i * 37) % 7) * 0.12;
      lit.add(x + Math.cos(a) * 0.22, h / 2, z + Math.sin(a) * 0.22, 0.14, h, 0.14, color, 0.3, a);
    }
    lit.add(x, 0.55, z, 0.2, 1.1, 0.2, color, 0.2, 0.4);
    const g = glow(color, 1.6, 0.35);
    g.position.set(x, 0.6, z);
    scene.add(g);
    solid(Math.round(x), Math.round(z));
  };
  const books = (x, z) => {
    const cols = ['#8c2f39', '#2f5d8c', '#3f7d4a', '#c9a24a', '#6a3f8c'];
    for (let i = 0; i < 5; i++) vb.add(x + Math.sin(i * 3) * 0.05, 0.05 + i * 0.1, z, 0.42 - i * 0.03, 0.09, 0.3, cols[i % 5], 0.1, i * 0.3);
    solid(Math.round(x), Math.round(z));
  };
  const candle = (x, z) => {
    vb.add(x, 0.12, z, 0.08, 0.24, 0.08, '#efe3c0');
    lit.add(x, 0.28, z, 0.05, 0.08, 0.05, '#ffcc55');
  };
  const goldBars = (x, z) => {
    for (let l = 0; l < 3; l++)
      for (let i = 0; i < 3 - l; i++) lit.add(x - 0.28 + i * 0.28 + l * 0.14, 0.07 + l * 0.13, z, 0.24, 0.12, 0.5, '#f0c040', 0.15);
    solid(Math.round(x), Math.round(z));
  };

  // Entrance: red carpet towards the treasury, barrels and crates in the corners
  rug(19, 15, 21, 23, '#b8902c', '#6a1824', '#8e2a36');
  barrel(15, 24);
  barrel(15.1, 23.1);
  crate(25, 24);
  crate(25, 24, 0.42, 0.62);
  crate(24, 24);
  // Library: patterned rug, books on the floor, candles
  rug(4, 17, 9, 21, '#b8902c', '#25305a', '#7a5c26');
  books(11, 24);
  books(2, 17);
  books(10, 16);
  for (const [x, z] of [[2.3, 23.7], [2.6, 24.2], [10.6, 22.6]]) candle(x, z);
  // Treasury: royal rug under the chest, stacks of gold bars
  rug(18, 4, 22, 9, '#c9a24a', '#4e1a28', '#9a7424');
  goldBars(14, 2);
  goldBars(26, 2);
  goldBars(13, 11);
  goldBars(27, 11);
  // Portal room: glowing crystal clusters
  crystals(29, 15, '#8a5cff');
  crystals(38, 15, '#2ec4ff');
  crystals(29, 24, '#2ec4ff');
  crystals(38, 24, '#e1306c');
  vb.build(scene);
  lit.build(scene);
  world.decorate(rugCells);

  function update(t, dt) {
    for (const u of updaters) u(t, dt);
  }
  return { items, update };
}
