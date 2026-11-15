import * as THREE from 'three';
import { W, H, ROOMS, FLOOR, WALL } from './map.js';
import { rng } from './textures.js';
import { box, mat, glow, VoxBatch } from './voxel.js';

const TALL = 2.0;
const LOW = 0.35;

function wallGeometry(height) {
  const g = new THREE.BoxGeometry(1, height, 1);
  g.translate(0, height / 2, 0);
  // Side faces: repeat texture vertically by wall height. Faces 2,3 = top/bottom.
  const uv = g.attributes.uv;
  for (let f = 0; f < 6; f++) {
    if (f === 2 || f === 3) continue;
    for (let i = f * 4; i < f * 4 + 4; i++) uv.setY(i, uv.getY(i) * height);
  }
  return g;
}

export function buildWorld(scene, grid, tex) {
  const r = rng(42);
  const m4 = new THREE.Matrix4();

  // ---------- Floors (one instanced mesh per floor style) ----------
  const floorGeo = new THREE.PlaneGeometry(1, 1);
  floorGeo.rotateX(-Math.PI / 2);
  const floorCells = {};
  for (let z = 0; z < H; z++)
    for (let x = 0; x < W; x++) {
      if (grid.cells[z][x] !== FLOOR) continue;
      const rid = grid.room[z][x];
      const style = rid ? ROOMS.find((q) => q.id === rid).floor : 'floorStone';
      (floorCells[style] ||= []).push([x, z]);
    }
  for (const [style, list] of Object.entries(floorCells)) {
    const inst = new THREE.InstancedMesh(floorGeo, new THREE.MeshLambertMaterial({ map: tex[style] }), list.length);
    const color = new THREE.Color();
    list.forEach(([x, z], i) => {
      // random 90° rotation + slight brightness variation for a hand-made look
      m4.makeRotationY(Math.floor(r() * 4) * (Math.PI / 2));
      m4.setPosition(x, 0, z);
      inst.setMatrixAt(i, m4);
      const v = 0.85 + r() * 0.2;
      inst.setColorAt(i, color.setRGB(v, v, v));
    });
    scene.add(inst);
  }

  // ---------- Walls ----------
  // Walls with floor directly north of them face away from the camera: keep them low
  // (cut-away view) so they never hide the player.
  const tall = [];
  const low = [];
  for (let z = 0; z < H; z++)
    for (let x = 0; x < W; x++) {
      if (grid.cells[z][x] !== WALL) continue;
      if (grid.cells[z - 1]?.[x] === FLOOR) low.push([x, z]);
      else tall.push([x, z]);
    }
  const wallMats = (h) => {
    const side = new THREE.MeshLambertMaterial({ map: tex.wall });
    const top = new THREE.MeshLambertMaterial({ map: tex.wallTop });
    return [side, side, top, top, side, side];
  };
  for (const [list, h] of [[tall, TALL], [low, LOW]]) {
    const inst = new THREE.InstancedMesh(wallGeometry(h), wallMats(h), list.length);
    const color = new THREE.Color();
    list.forEach(([x, z], i) => {
      m4.makeTranslation(x, 0, z);
      inst.setMatrixAt(i, m4);
      const v = 0.85 + r() * 0.25;
      inst.setColorAt(i, color.setRGB(v, v, v));
    });
    scene.add(inst);
  }

  // Dark void plane under everything
  const voidPlane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ color: 0x07050c }));
  voidPlane.rotation.x = -Math.PI / 2;
  voidPlane.position.set(W / 2, -0.02, H / 2);
  scene.add(voidPlane);

  // ---------- Torches ----------
  const torches = [];
  const reserved = new Set(); // wall cells used by mounted props
  const addTorch = (x, z, dir = 'south', lit = true) => {
    const g = new THREE.Group();
    const off = { south: [0, 0.56], east: [0.56, 0], west: [-0.56, 0] }[dir];
    g.position.set(x + off[0], 1.15, z + off[1]);
    box(g, 0.08, 0.32, 0.08, '#5a3a22', 0, 0, 0);
    box(g, 0.16, 0.06, 0.16, '#3b2a1e', 0, 0.16, 0);
    const flame = box(g, 0.12, 0.16, 0.12, '#ffb43a', 0, 0.27, 0, { emissive: '#ff8a1e', emissiveIntensity: 1 });
    const core = box(g, 0.06, 0.08, 0.06, '#fff2a8', 0, 0.3, 0, { emissive: '#fff2a8', emissiveIntensity: 1 });
    const halo = glow('#ff9a3a', 1.6, 0.5);
    halo.position.y = 0.28;
    g.add(halo);
    scene.add(g);
    let light = null;
    if (lit) {
      light = new THREE.PointLight('#ff9a45', 9, 9, 1.6);
      light.position.set(x + off[0] * 1.8, 1.5, z + off[1] * 1.8);
      scene.add(light);
    }
    torches.push({ g, flame, core, halo, light, phase: r() * 10, base: 9, pos: new THREE.Vector3(g.position.x, 1.45, g.position.z) });
  };

  // ---------- Dust motes ----------
  const dustCount = 260;
  const dustPos = new Float32Array(dustCount * 3);
  const dustSeed = new Float32Array(dustCount);
  const floorList = [];
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) if (grid.cells[z][x] === FLOOR) floorList.push([x, z]);
  for (let i = 0; i < dustCount; i++) {
    const [x, z] = floorList[Math.floor(r() * floorList.length)];
    dustPos[i * 3] = x + r() - 0.5;
    dustPos[i * 3 + 1] = 0.2 + r() * 2.2;
    dustPos[i * 3 + 2] = z + r() - 0.5;
    dustSeed[i] = r() * 100;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: '#c8b8ff', size: 0.05, transparent: true, opacity: 0.55, depthWrite: false }));
  scene.add(dust);

  // ---------- Torch embers ----------
  const emberCount = 120;
  const emberPos = new Float32Array(emberCount * 3);
  const embers = [];
  const emberGeo = new THREE.BufferGeometry();
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
  const emberPts = new THREE.Points(
    emberGeo,
    new THREE.PointsMaterial({ color: '#ffb347', size: 0.06, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  scene.add(emberPts);

  function update(t, dt) {
    for (const tc of torches) {
      const f = Math.sin(t * 11 + tc.phase) * 0.5 + Math.sin(t * 23 + tc.phase * 2) * 0.3 + Math.sin(t * 5.3 + tc.phase) * 0.2;
      if (tc.light) tc.light.intensity = tc.base * (0.85 + f * 0.15);
      tc.flame.scale.y = 1 + f * 0.25;
      tc.core.position.y = 0.3 + f * 0.02;
      tc.halo.material.opacity = 0.42 + f * 0.08;
    }
    const p = dustGeo.attributes.position.array;
    for (let i = 0; i < dustCount; i++) {
      const s = dustSeed[i];
      p[i * 3] += Math.sin(t * 0.3 + s) * 0.002;
      p[i * 3 + 1] += Math.sin(t * 0.5 + s * 2) * 0.0015;
      p[i * 3 + 2] += Math.cos(t * 0.27 + s) * 0.002;
    }
    dustGeo.attributes.position.needsUpdate = true;

    if (torches.length) {
      while (embers.length < emberCount) {
        const tc = torches[Math.floor(Math.random() * torches.length)];
        embers.push({ x: tc.pos.x, y: tc.pos.y, z: tc.pos.z, vx: (Math.random() - 0.5) * 0.3, vy: 0.4 + Math.random() * 0.6, vz: (Math.random() - 0.5) * 0.3 + 0.1, life: Math.random() * 1.5 });
      }
      const ep = emberGeo.attributes.position.array;
      embers.forEach((e, i) => {
        e.life -= dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.z += e.vz * dt;
        if (e.life <= 0) {
          const tc = torches[Math.floor(Math.random() * torches.length)];
          Object.assign(e, { x: tc.pos.x, y: tc.pos.y, z: tc.pos.z, life: 0.6 + Math.random() * 1.2 });
        }
        ep[i * 3] = e.x;
        ep[i * 3 + 1] = e.y;
        ep[i * 3 + 2] = e.z;
      });
      emberGeo.attributes.position.needsUpdate = true;
    }
  }

  // Auto-place torches on north walls (facing camera) and side walls of rooms.
  function placeTorches() {
    for (const room of ROOMS) {
      const zN = room.z0 - 1;
      for (let x = room.x0 + 1; x <= room.x1 - 1; x += 3) {
        if (grid.cells[zN][x] === WALL && !reserved.has(`${x},${zN}`) && grid.cells[zN + 1][x] === FLOOR) addTorch(x, zN, 'south');
      }
      const zm = Math.round((room.z0 + room.z1) / 2) - 2;
      if (grid.cells[zm][room.x0 - 1] === WALL && !reserved.has(`${room.x0 - 1},${zm}`)) addTorch(room.x0 - 1, zm, 'east', false);
      if (grid.cells[zm][room.x1 + 1] === WALL && !reserved.has(`${room.x1 + 1},${zm}`)) addTorch(room.x1 + 1, zm, 'west', false);
    }
  }

  // Extra voxel detail: bricks sticking out of walls, uneven wall tops, rubble, moss, cracks.
  function decorate(rugCells = new Set()) {
    const vb = new VoxBatch(77);
    const rr = rng(99);
    const wallCol = ['#4e4664', '#57506f', '#433c58'];
    const pick = (a) => a[Math.floor(rr() * a.length)];
    for (let z = 0; z < H; z++)
      for (let x = 0; x < W; x++) {
        if (grid.cells[z][x] !== WALL) continue;
        const low = grid.cells[z - 1]?.[x] === FLOOR;
        const hgt = low ? LOW : TALL;
        // faces that look into a room
        const faces = [];
        if (grid.cells[z + 1]?.[x] === FLOOR) faces.push([0, 1]);
        if (grid.cells[z]?.[x + 1] === FLOOR) faces.push([1, 0]);
        if (grid.cells[z]?.[x - 1] === FLOOR) faces.push([-1, 0]);
        if (!low) {
          for (const [fx, fz] of faces) {
            const n = 2 + Math.floor(rr() * 3);
            for (let i = 0; i < n; i++) {
              const along = (rr() - 0.5) * 0.7;
              const y = 0.15 + Math.floor(rr() * 7) * 0.25;
              const w = 0.22 + rr() * 0.22;
              const px = x + fx * 0.52 + (fz ? along : 0);
              const pz = z + fz * 0.52 + (fx ? along : 0);
              vb.add(px, y, pz, fz ? w : 0.06, 0.12, fx ? w : 0.06, pick(wallCol));
            }
            // skirting stones along the bottom
            vb.add(x + fx * 0.53, 0.07, z + fz * 0.53, fz ? 1 : 0.1, 0.14, fx ? 1 : 0.1, '#3a3450', 0.2);
          }
          // uneven, crenellated top
          if (rr() < 0.55) {
            const w = 0.3 + rr() * 0.3;
            vb.add(x + (rr() - 0.5) * 0.4, hgt + 0.08, z + (rr() - 0.5) * 0.4, w, 0.16, w, '#47405e');
          }
          if (rr() < 0.25) vb.add(x + (rr() - 0.5) * 0.5, hgt + 0.05, z + (rr() - 0.5) * 0.5, 0.2, 0.1, 0.2, '#3f6b45');
        } else if (rr() < 0.5) {
          vb.add(x + (rr() - 0.5) * 0.4, hgt + 0.06, z + (rr() - 0.5) * 0.3, 0.3, 0.12, 0.3, '#47405e');
        }
      }
    // floor rubble, raised stones and moss
    for (let z = 0; z < H; z++)
      for (let x = 0; x < W; x++) {
        if (grid.cells[z][x] !== FLOOR || grid.isBlocked(x, z) || rugCells.has(`${x},${z}`)) continue;
        const rid = grid.room[z][x];
        const style = rid ? ROOMS.find((q) => q.id === rid).floor : 'floorStone';
        const tone = { floorStone: '#4a4560', floorGold: '#6a5236', floorWood: '#7a4c2c', floorCrystal: '#3a2a62' }[style];
        if (rr() < 0.18) {
          const w = 0.25 + rr() * 0.25;
          vb.add(x + (rr() - 0.5) * 0.5, 0.02, z + (rr() - 0.5) * 0.5, w, 0.04, w * (0.6 + rr() * 0.5), tone, 0.25);
        }
        if (rr() < 0.12) for (let i = 0; i < 3; i++) vb.add(x + (rr() - 0.5) * 0.8, 0.04, z + (rr() - 0.5) * 0.8, 0.08, 0.08, 0.08, '#5a5470', 0.3);
        if (style !== 'floorWood' && style !== 'floorCrystal' && rr() < 0.06) vb.add(x + (rr() - 0.5) * 0.5, 0.012, z + (rr() - 0.5) * 0.5, 0.35, 0.02, 0.25, '#2f5a36', 0.3);
      }
    vb.build(scene);
  }

  return { torches, update, reserve: (x, z) => reserved.add(`${x},${z}`), placeTorches, decorate, TALL };
}
