import * as THREE from 'three';
import { label, glow } from '../voxel.js';
import { CONFIG } from '../config.js';
import { t as T } from '../i18n.js';
import { crystalCluster, disc, ring } from './decor.js';
import { voxelLogo } from '../logos.js';
import { vision, visionGLSL } from '../vision.js';

// Portal room: x 29..38, z 15..24.
const PX = 33.5; // portal centre x
const PZ = 14.85; // portal plane z
const PY = 1.95; // portal centre height
const PR = 1.65; // portal radius

export function buildPortals(ctx) {
  const { scene, world, actions, vb, lit } = ctx;

  // ---------- Stone arch ----------
  const stone = ['#4b4466', '#554e72', '#433c5c', '#5c5578'];
  let k = 0;
  const S = () => stone[k++ % stone.length];
  // steps
  vb.add(PX, 0.07, 15.25, 4.4, 0.14, 0.7, '#3e3854', 0.08);
  vb.add(PX, 0.2, 15.1, 3.8, 0.12, 0.45, '#4a4460', 0.08);
  // pillars made of stacked blocks with glowing runes
  const runes = [];
  for (const side of [-1, 1]) {
    const x = PX + side * (PR + 0.45);
    for (let i = 0; i < 6; i++) {
      const w = 0.62 + ((i * 3) % 2) * 0.06;
      vb.add(x + (((i * 7) % 3) - 1) * 0.02, 0.3 + i * 0.32, PZ, w, 0.3, 0.62, S(), 0.08);
      if (i % 2 === 0) {
        const r = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.02), new THREE.MeshBasicMaterial({ color: '#b48cff' }));
        r.position.set(x, 0.3 + i * 0.32, PZ + 0.32);
        scene.add(r);
        runes.push(r);
      }
    }
    // capital + crystal on top
    vb.add(x, 2.2, PZ, 0.8, 0.16, 0.8, '#3e3854', 0.08);
    lit.add(x, 2.55, PZ, 0.16, 0.5, 0.16, '#b48cff', 0.15, 0.6);
    lit.add(x, 2.35, PZ, 0.24, 0.16, 0.24, '#8a5cff', 0.15, 0.2);
    const gl = glow('#b48cff', 1.2, 0.4);
    gl.position.set(x, 2.5, PZ + 0.1);
    scene.add(gl);
  }
  // arch: blocks along a half circle
  const AR = PR + 0.45;
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI;
    const key = i === 5;
    vb.add(PX + Math.cos(a) * AR, PY + 0.3 + Math.sin(a) * AR * 0.95, PZ, key ? 0.7 : 0.55, key ? 0.6 : 0.42, 0.62, key ? '#5c5578' : S(), 0.08, 0, a - Math.PI / 2);
  }
  lit.add(PX, PY + 0.3 + AR * 0.95, PZ + 0.33, 0.24, 0.24, 0.06, '#d9c4ff', 0.1, 0, Math.PI / 4); // keystone gem
  for (let x = 31; x <= 36; x++) world.reserve(x, 14);
  ctx.solid(PX, 15.25, 2.22, 0.38); // steps + pillars

  // ---------- Portal surface (pixel swirl shader) ----------
  const portalMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uTime: { value: 0 }, uVisCenter: vision.center, uVisNear: vision.near, uVisFar: vision.far, uVisColor: vision.color },
    vertexShader: 'varying vec2 vUv; varying vec3 vVisPos; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vVisPos = mv.xyz; gl_Position = projectionMatrix * mv; }',
    fragmentShader:
      visionGLSL.decl +
      `
      varying vec2 vUv; uniform float uTime;
      void main(){
        vec2 p = floor(vUv * 40.0) / 40.0 - 0.5;
        float r = length(p);
        if (r > 0.5) discard;
        float a = atan(p.y, p.x);
        float s = sin(a * 4.0 + r * 22.0 - uTime * 3.2) * 0.5 + 0.5;
        float s2 = sin(a * -2.0 + r * 9.0 + uTime * 1.7) * 0.5 + 0.5;
        float q = floor((s * 0.7 + s2 * 0.3) * (1.1 - r * 1.3) * 5.0 + 0.6) / 5.0;
        vec3 c = mix(vec3(0.10,0.03,0.25), vec3(0.70,0.45,1.0), q);
        c += vec3(0.9,0.8,1.0) * step(0.43, r) * (0.5 + 0.5 * sin(a * 12.0 + uTime * 4.0));
        c += vec3(1.0) * step(r, 0.06) * 0.6;
        gl_FragColor = vec4(c, 1.0);
      ` +
      visionGLSL.apply +
      '}',
  });
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(PR * 2, PR * 2), portalMat);
  portal.position.set(PX, PY, PZ + 0.02);
  scene.add(portal);

  // orbiting rune stones
  const orbit = [];
  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.06), new THREE.MeshBasicMaterial({ color: i % 2 ? '#d9c4ff' : '#8a5cff' }));
    scene.add(m);
    orbit.push(m);
  }

  // particles: swirl + rising sparks
  const pc = 110;
  const pp = new Float32Array(pc * 3);
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  scene.add(new THREE.Points(pgeo, new THREE.PointsMaterial({ color: '#d0b0ff', size: 0.07, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));

  // floor rune circle in front of the portal
  ring(lit, PX, 0.015, 17.1, 1.25, 0.012, 16, ['#8a5cff', '#5a3ab0'], 0.08, 0.1);
  ring(lit, PX, 0.016, 17.1, 0.8, 0.012, 12, '#b48cff', 0.05, 0.1);

  const l = label({ key: 'labels.social' }, { color: '#d9c4ff' });
  l.position.set(PX, PY + AR + 0.95, PZ + 0.3);
  scene.add(l);
  const pl = new THREE.PointLight('#9a6cff', 14, 9, 1.4);
  pl.position.set(PX, 1.6, 16.2);
  scene.add(pl);

  ctx.updaters.push((t) => {
    portalMat.uniforms.uTime.value = t;
    pl.intensity = 12 + Math.sin(t * 2) * 3;
    runes.forEach((r, i) => r.material.color.setHSL(0.74 + Math.sin(t * 2 + i) * 0.04, 0.9, 0.6 + Math.sin(t * 3 + i * 1.3) * 0.2));
    orbit.forEach((m, i) => {
      const a = t * 0.6 + (i / orbit.length) * Math.PI * 2;
      m.position.set(PX + Math.cos(a) * (PR + 0.15), PY + Math.sin(a) * (PR + 0.15), PZ + 0.18);
      m.rotation.z = a;
    });
    for (let i = 0; i < pc; i++) {
      if (i < 70) {
        const a = t * (0.7 + (i % 5) * 0.15) + i * 1.7;
        const r = (PR - 0.2) * (0.3 + ((i * 37) % 10) * 0.07);
        pp[i * 3] = PX + Math.cos(a) * r;
        pp[i * 3 + 1] = PY + Math.sin(a) * r;
        pp[i * 3 + 2] = PZ + 0.1 + ((t * 0.5 + i * 0.13) % 1) * 1.4;
      } else {
        const life = (t * 0.3 + i * 0.37) % 1;
        const a = i * 2.4;
        pp[i * 3] = PX + Math.cos(a) * (0.6 + (i % 7) * 0.3);
        pp[i * 3 + 1] = life * 3.2;
        pp[i * 3 + 2] = 16.2 + Math.sin(a) * 0.8;
      }
    }
    pgeo.attributes.position.needsUpdate = true;
  });
  ctx.item({ id: 'portal', x: PX, z: 16.6, radius: 2.2, prompt: () => T('prompts.portal'), hitBox: [PX, PY, PZ, PR * 2 + 1.2, PY * 2 + 0.6, 0.8], sound: 'portal', action: actions.allSocials });

  // ---------- One pedestal per social, with its voxel logo floating above ----------
  // irregular altar positions and heights, like an old dungeon shrine
  const spots = [[30.9, 19.5, 1], [34.2, 22.1, 0.78], [36.8, 18.9, 1.18], [30.5, 23.2, 0.9], [37.2, 22.7, 1.05], [33.0, 18.7, 0.85]];
  CONFIG.socials.slice(0, spots.length).forEach((s, i) => {
    const [x, z, hs] = spots[i];
    const colH = 0.62 * hs;
    const top = 0.2 + colH;
    disc(vb, x, 0.06, z, 0.42, 0.12, '#3a3452');
    disc(vb, x, 0.16, z, 0.34, 0.08, '#4b4466');
    ring(vb, x, 0.2 + colH / 2, z, 0.22, colH, 8, ['#4b4466', '#554e72'], 0.07);
    disc(vb, x, top + 0.02, z, 0.34, 0.08, '#4b4466');
    disc(vb, x, top + 0.08, z, 0.28, 0.05, '#3a3452');
    // a broken chunk at the foot of some altars
    if (i % 2 === 0) vb.add(x + 0.38, 0.06, z + 0.22, 0.16, 0.12, 0.13, '#4b4466', 0.15, i);
    ring(lit, x, 0.17, z, 0.43, 0.03, 12, s.color, 0.04, 0.1); // glowing ring in brand colour
    const logo = voxelLogo(s.icon || s.id, { u: 0.045, depth: 3 });
    const holder = new THREE.Group();
    const ly = top + 0.55;
    holder.position.set(x, ly, z);
    if (logo) holder.add(logo);
    else {
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), new THREE.MeshBasicMaterial({ color: s.color }));
      c.scale.y = 1.5;
      holder.add(c);
    }
    scene.add(holder);
    const gl = glow(s.color, 1.5, 0.4);
    gl.position.set(x, ly, z - 0.05);
    scene.add(gl);
    const l2 = label(s.label, { color: s.color === '#e8e8f0' ? '#ffffff' : s.color });
    l2.position.set(x, ly + 0.6, z);
    scene.add(l2);
    ctx.solid(x, z, 0.34);
    ctx.updaters.push((t) => {
      holder.rotation.y = Math.sin(t * 0.9 + i) * 0.7;
      holder.position.y = ly + Math.sin(t * 2 + i) * 0.07;
      gl.material.opacity = 0.32 + Math.sin(t * 2.5 + i) * 0.1;
    });
    ctx.item({ id: 'social-' + s.id, x, z, radius: 1.5, prompt: () => s.label, hitBox: [x, ly / 2 + 0.2, z, 0.9, ly + 0.5, 0.9], sound: () => ['crystal', i], action: () => actions.social(s) });
  });

  // ---------- Glowing crystal clusters in the corners ----------
  crystalCluster(ctx, 29, 15, '#8a5cff');
  crystalCluster(ctx, 38, 15, '#2ec4ff');
  crystalCluster(ctx, 29, 24, '#2ec4ff');
  crystalCluster(ctx, 38, 24, '#e1306c');
}
