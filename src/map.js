// Dungeon layout on a tile grid. x = column (west→east), z = row (north→south).
// Cell (x, z) is centred at world position (x, 0, z).

export const W = 41;
export const H = 27;

export const ROOMS = [
  { id: 'entrance', name: "Sala d'Ingresso", x0: 15, z0: 15, x1: 25, z1: 24, floor: 'floorStone', color: '#6b6688' },
  { id: 'treasury', name: 'Sala del Tesoro', x0: 13, z0: 2, x1: 27, z1: 11, floor: 'floorGold', color: '#c9a24a' },
  { id: 'bio', name: 'Biblioteca', x0: 2, z0: 15, x1: 11, z1: 24, floor: 'floorWood', color: '#a8703f' },
  { id: 'social', name: 'Sala dei Portali', x0: 29, z0: 15, x1: 38, z1: 24, floor: 'floorCrystal', color: '#8a5cff' },
];

export const CORRIDORS = [
  { x0: 19, z0: 12, x1: 21, z1: 14 }, // ingresso ↔ tesoro
  { x0: 12, z0: 19, x1: 14, z1: 20 }, // ingresso ↔ biblioteca
  { x0: 26, z0: 19, x1: 28, z1: 20 }, // ingresso ↔ portali
];

export const SPAWN = { x: 20, z: 21 };

export const EMPTY = 0;
export const FLOOR = 1;
export const WALL = 2;

export function buildGrid() {
  const cells = Array.from({ length: H }, () => new Array(W).fill(EMPTY));
  const room = Array.from({ length: H }, () => new Array(W).fill(null));
  const fill = (r, id) => {
    for (let z = r.z0; z <= r.z1; z++)
      for (let x = r.x0; x <= r.x1; x++) {
        cells[z][x] = FLOOR;
        room[z][x] = id;
      }
  };
  ROOMS.forEach((r) => fill(r, r.id));
  CORRIDORS.forEach((c) => fill(c, null));

  for (let z = 0; z < H; z++)
    for (let x = 0; x < W; x++) {
      if (cells[z][x] !== EMPTY) continue;
      let near = false;
      for (let dz = -1; dz <= 1 && !near; dz++)
        for (let dx = -1; dx <= 1; dx++) {
          const v = cells[z + dz]?.[x + dx];
          if (v === FLOOR) {
            near = true;
            break;
          }
        }
      if (near) cells[z][x] = WALL;
    }

  // `blocked` is the coarse grid used by path finding: walls + cells taken by props.
  // Props also register exact box colliders, so the player can walk right next to them.
  const blocked = cells.map((row) => row.map((v) => v !== FLOOR));
  const colliders = [];

  return {
    cells,
    room,
    blocked,
    colliders,
    isFloor: (x, z) => cells[z]?.[x] === FLOOR,
    isWall: (x, z) => (cells[z]?.[x] ?? WALL) !== FLOOR,
    isBlocked: (x, z) => blocked[z]?.[x] ?? true,
    block: (x, z) => {
      if (blocked[z]) blocked[z][x] = true;
    },
    // Box collider centred on (x, z) with half sizes hw, hd. Cells whose centre the player
    // could not stand on (box grown by `pad`) are blocked for path finding.
    addCollider(x, z, hw, hd = hw, pad = 0.27) {
      colliders.push({ x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd });
      for (let cz = Math.floor(z - hd - pad); cz <= Math.ceil(z + hd + pad); cz++)
        for (let cx = Math.floor(x - hw - pad); cx <= Math.ceil(x + hw + pad); cx++)
          if (Math.abs(cx - x) < hw + pad && Math.abs(cz - z) < hd + pad && blocked[cz]) blocked[cz][cx] = true;
    },
    // Does a circle of radius r at (x, z) touch any prop collider?
    hitsProp(x, z, r) {
      for (const c of colliders) {
        const dx = x - Math.max(c.x0, Math.min(x, c.x1));
        const dz = z - Math.max(c.z0, Math.min(z, c.z1));
        if (dx * dx + dz * dz < r * r) return true;
      }
      return false;
    },
    roomAt: (x, z) => room[z]?.[x] ?? null,
  };
}

// 8-directional BFS with no corner cutting. goal(x, z) → boolean.
export function findPath(grid, sx, sz, goal) {
  const key = (x, z) => z * W + x;
  const prev = new Map();
  const q = [[sx, sz]];
  prev.set(key(sx, sz), null);
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  let found = null;
  while (q.length) {
    const [x, z] = q.shift();
    if (goal(x, z)) {
      found = [x, z];
      break;
    }
    for (const [dx, dz] of dirs) {
      const nx = x + dx;
      const nz = z + dz;
      if (grid.isBlocked(nx, nz) || prev.has(key(nx, nz))) continue;
      if (dx && dz && (grid.isBlocked(x + dx, z) || grid.isBlocked(x, z + dz))) continue;
      prev.set(key(nx, nz), [x, z]);
      q.push([nx, nz]);
    }
  }
  if (!found) return null;
  const path = [];
  let cur = found;
  while (cur) {
    path.unshift({ x: cur[0], z: cur[1] });
    cur = prev.get(key(cur[0], cur[1]));
  }
  return path;
}
