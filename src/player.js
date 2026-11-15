import * as THREE from 'three';
import { VoxelPart } from './voxel.js';

const U = 0.047; // one character voxel

const C = {
  skin: '#e7b183',
  skinDark: '#c98f62',
  hair: '#2a1a10',
  hairHi: '#4a3020',
  jacket: '#24325e',
  jacketHi: '#33467e',
  lapel: '#18213f',
  shirt: '#f2f2f2',
  tie: '#d0302a',
  tieDark: '#9a1f1b',
  pants: '#1b1e2e',
  shoe: '#0d0d12',
  sole: '#3a3a46',
  gold: '#f5c542',
  lens: '#0a0a10',
  glint: '#6fe0ff',
};

// Voxel trader: navy suit, white shirt, red tie, shades, gold watch.
export function createPlayer() {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const pivot = (x, y, z) => {
    const g = new THREE.Group();
    g.position.set(x * U, y * U, z * U);
    body.add(g);
    return g;
  };

  // ---- legs (pivot at hip) ----
  const leg = (side) => {
    const p = new VoxelPart(U, side > 0 ? 11 : 12);
    p.fill(-1.5, -9, -1.5, 3, 9, 3, C.pants);
    p.fill(-1.5, -9, -1.5, 3, 2, 4, C.shoe);
    p.fill(-1.5, -9, -1.5, 3, 1, 4, C.sole);
    p.fill(-1.5, -3, 0.5, 3, 1, 1, '#14172a'); // knee crease
    const g = pivot(side * 2, 9, 0);
    p.build(g);
    return g;
  };
  const legL = leg(-1);
  const legR = leg(1);

  // ---- torso ----
  const torso = new VoxelPart(U, 21);
  torso.fill(-3.5, 9, -2, 7, 8, 4, C.jacket);
  torso.fill(-3.5, 16, -2, 7, 1, 4, C.jacketHi); // shoulders
  torso.fill(-1.5, 12, 1, 3, 5, 1, C.shirt);
  torso.fill(-2.5, 12, 1, 1, 5, 1, C.lapel);
  torso.fill(1.5, 12, 1, 1, 5, 1, C.lapel);
  torso.fill(-0.5, 10, 1, 1, 6, 1, C.tie);
  torso.fill(-0.5, 16, 1, 1, 1, 1, C.tieDark);
  torso.fill(-0.5, 10, 1.5, 1, 1, 1, C.tieDark); // tie tip sticks out a bit
  torso.fill(2.5, 14, 1, 1, 1, 1, C.gold); // pocket square
  torso.fill(-3.5, 9, -2, 7, 1, 4, '#121524'); // belt
  torso.fill(-0.5, 9, 1, 1, 1, 1, C.gold); // buckle
  torso.fill(-1.5, 17, -1.5, 3, 1, 3, C.skin); // neck
  torso.fill(-1.5, 17, 0.5, 3, 1, 1, C.shirt); // collar
  torso.build(body);

  // ---- arms (pivot at shoulder) ----
  const arm = (side) => {
    const p = new VoxelPart(U, side > 0 ? 31 : 32);
    p.fill(-1, -7, -1.5, 2, 7, 3, C.jacket);
    p.fill(-1, 0 - 1, -1.5, 2, 1, 3, C.jacketHi);
    p.fill(-1, -7, -1.5, 2, 1, 3, side < 0 ? C.gold : C.shirt); // gold watch on the left wrist
    p.fill(-1, -9, -1.5, 2, 2, 3, C.skin);
    p.fill(-1, -9, -1.5, 2, 1, 3, C.skinDark);
    const g = pivot(side * 4.5, 16.5, 0);
    p.build(g);
    return g;
  };
  const armL = arm(-1);
  const armR = arm(1);

  // ---- head (pivot at neck) ----
  const head = pivot(0, 18, 0);
  const h = new VoxelPart(U, 41);
  h.fill(-3.5, 0, -3.5, 7, 7, 7, C.skin);
  h.fill(-3.5, 5, -3.5, 7, 2, 7, C.hair);
  h.fill(-3.5, 7, -3.5, 7, 1, 6, C.hair);
  h.fill(-2.5, 7, -2.5, 4, 1, 3, C.hairHi);
  h.fill(-2.5, 6, 3.5, 5, 2, 1, C.hair); // quiff
  h.fill(-1.5, 7, 3.5, 3, 1, 1, C.hairHi);
  h.fill(-3.5, 1, -3.5, 7, 5, 1, C.hair); // back
  h.fill(-3.5, 2, -3.5, 1, 4, 4, C.hair); // sides
  h.fill(2.5, 2, -3.5, 1, 4, 4, C.hair);
  h.fill(-3.5, 3, 3.5, 7, 2, 1, C.lens); // sunglasses
  h.fill(-3.5, 3, -0.5, 1, 1, 4, C.lens); // arms of the shades
  h.fill(2.5, 3, -0.5, 1, 1, 4, C.lens);
  h.fill(-2.5, 4, 3.5, 1, 1, 1, C.glint);
  h.fill(1.5, 4, 3.5, 1, 1, 1, C.glint);
  h.fill(-0.5, 2, 3.5, 1, 1, 1, C.skinDark); // nose
  h.fill(-1.5, 1, 2.5, 3, 1, 1, '#8a4a3a'); // mouth
  h.fill(-4.5, 2, -0.5, 1, 2, 1, C.skin); // ears
  h.fill(3.5, 2, -0.5, 1, 2, 1, C.skin);
  h.fill(-3.5, 0, -2.5, 7, 1, 5, C.skinDark); // jaw shade
  h.build(head);

  // blob shadow
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.34, 12),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  root.add(shadow);

  let walkT = 0;
  let facing = Math.PI; // facing north (towards -z) at start
  root.rotation.y = facing;

  function animate(dt, speed, dirX, dirZ, t) {
    const moving = speed > 0.01;
    if (moving) {
      walkT += dt * 11 * Math.min(1.6, speed / 4);
      const target = Math.atan2(dirX, dirZ);
      let d = target - facing;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      facing += d * Math.min(1, dt * 14);
      root.rotation.y = facing;
    } else {
      walkT *= 0.8;
    }
    const s = Math.sin(walkT);
    legL.rotation.x = s * 0.7;
    legR.rotation.x = -s * 0.7;
    armL.rotation.x = -s * 0.6;
    armR.rotation.x = s * 0.6;
    armL.rotation.z = moving ? 0 : -0.04;
    armR.rotation.z = moving ? 0 : 0.04;
    body.position.y = moving ? Math.abs(Math.cos(walkT)) * 0.045 : Math.sin(t * 2) * 0.012;
    head.rotation.y = moving ? 0 : Math.sin(t * 0.7) * 0.25;
    head.rotation.z = moving ? Math.sin(walkT) * 0.04 : 0;
  }

  return { root, animate };
}
