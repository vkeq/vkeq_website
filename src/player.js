import * as THREE from 'three';
import { box, mat } from './voxel.js';

const U = 0.07; // size of one character voxel

// Voxel trader: navy suit, white shirt, red tie, shades, gold watch.
export function createPlayer() {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const limb = (w, h, d, color, x, y, z) => {
    // pivot at the top of the limb so it swings naturally
    const pivot = new THREE.Group();
    pivot.position.set(x * U, y * U, z * U);
    box(pivot, w * U, h * U, d * U, color, 0, (-h / 2) * U, 0);
    body.add(pivot);
    return pivot;
  };

  const legL = limb(2.4, 5, 2.4, '#1b1d2b', -1.4, 5, 0);
  const legR = limb(2.4, 5, 2.4, '#1b1d2b', 1.4, 5, 0);
  box(legL, 2.6 * U, 1 * U, 3.2 * U, '#0c0c12', 0, -5 * U, 0.4 * U);
  box(legR, 2.6 * U, 1 * U, 3.2 * U, '#0c0c12', 0, -5 * U, 0.4 * U);

  // torso
  box(body, 6 * U, 6 * U, 3.2 * U, '#22305a', 0, 8 * U, 0);
  box(body, 2 * U, 4.2 * U, 0.2 * U, '#f2f2f2', 0, 8.9 * U, 1.65 * U); // shirt
  box(body, 0.8 * U, 3.6 * U, 0.3 * U, '#d0302a', 0, 8.6 * U, 1.75 * U); // tie
  box(body, 6.2 * U, 0.8 * U, 3.4 * U, '#151a30', 0, 5.4 * U, 0); // belt

  const armL = limb(2, 5.6, 2.2, '#22305a', -4, 10.8, 0);
  const armR = limb(2, 5.6, 2.2, '#22305a', 4, 10.8, 0);
  box(armL, 2 * U, 1 * U, 2.2 * U, '#e3b07a', 0, -6 * U, 0);
  box(armR, 2 * U, 1 * U, 2.2 * U, '#e3b07a', 0, -6 * U, 0);
  box(armR, 2.2 * U, 0.7 * U, 2.4 * U, '#f5c542', 0, -5.2 * U, 0, { emissive: '#5a4210' }); // gold watch

  // head
  const head = new THREE.Group();
  head.position.y = 11 * U;
  body.add(head);
  box(head, 5 * U, 5 * U, 5 * U, '#e3b07a', 0, 2.5 * U, 0);
  box(head, 5.3 * U, 1.6 * U, 5.3 * U, '#2a1a10', 0, 4.6 * U, -0.1 * U); // hair top
  box(head, 5.3 * U, 3 * U, 1.2 * U, '#2a1a10', 0, 3.2 * U, -2.3 * U); // hair back
  box(head, 5.2 * U, 1 * U, 0.4 * U, '#0a0a10', 0, 2.9 * U, 2.6 * U); // shades
  box(head, 1.4 * U, 0.5 * U, 0.2 * U, '#5ad1ff', -1.2 * U, 3.1 * U, 2.82 * U, { emissive: '#1a6080' });
  box(head, 1.4 * U, 0.5 * U, 0.2 * U, '#5ad1ff', 1.2 * U, 3.1 * U, 2.82 * U, { emissive: '#1a6080' });
  box(head, 1.6 * U, 0.4 * U, 0.2 * U, '#9a5a40', 0, 1.1 * U, 2.6 * U); // mouth

  // blob shadow
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 12),
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
    body.position.y = moving ? Math.abs(Math.cos(walkT)) * 0.04 : Math.sin(t * 2) * 0.012;
    head.rotation.z = moving ? 0 : Math.sin(t * 0.9) * 0.04;
  }

  return { root, animate };
}
