import * as THREE from 'three';
import { VoxBatch } from './voxel.js';
import { buildEntrance } from './rooms/entrance.js';
import { buildLibrary } from './rooms/library.js';
import { buildTreasury } from './rooms/treasury.js';
import { buildPortals } from './rooms/portals.js';

// Builds every room's props and interactables.
// An interactable: { id, x, z, radius, prompt(), hit (Object3D for clicks), sound, action }.
export function buildProps(scene, grid, world, actions) {
  const items = [];
  const updaters = [];
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });

  const ctx = {
    scene,
    grid,
    world,
    actions,
    updaters,
    rugCells: new Set(),
    vb: new VoxBatch(5), // regular lit voxels
    lit: new VoxBatch(6, { glow: true }), // self-illuminated voxels (gold, crystals, screens)
    // Exact box footprint of a prop (half width / half depth) — the player collides with it.
    solid(x, z, hw = 0.35, hd = hw) {
      grid.addCollider(x, z, hw, hd);
    },
    // Register an interactable. `hitBox: [x, y, z, w, h, d]` creates an invisible click target.
    item(def) {
      if (def.hitBox) {
        const [x, y, z, w, h, d] = def.hitBox;
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hitMat);
        m.position.set(x, y, z);
        scene.add(m);
        def.hit = m;
      }
      items.push(def);
    },
  };

  buildEntrance(ctx);
  buildLibrary(ctx);
  buildTreasury(ctx);
  buildPortals(ctx);

  ctx.vb.build(scene);
  ctx.lit.build(scene);
  world.decorate(ctx.rugCells);

  return {
    items,
    rugCells: ctx.rugCells,
    update(t, dt) {
      for (const u of updaters) u(t, dt);
    },
  };
}
