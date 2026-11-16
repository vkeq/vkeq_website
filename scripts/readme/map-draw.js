// Draws the pixel-art map of the dungeon used in the README.
// Runs inside the game page (so it can read the real grid and torch positions):
//   const { drawMap } = await import('/scripts/readme/map-draw.js'); drawMap(torches) → data URL
import { buildGrid, ROOMS, W, H, FLOOR, WALL } from '/src/map.js';

const T = 14; // pixels per tile (before upscaling)
const M = { l: 40, r: 40, t: 46, b: 46 }; // margins
const SCALE = 6; // final upscale (nearest neighbour) → ~4K

export function drawMap(torches = []) {
  const grid = buildGrid();
  const BW = W * T + M.l + M.r;
  const BH = H * T + M.t + M.b;
  const c = document.createElement('canvas');
  c.width = BW;
  c.height = BH;
  const g = c.getContext('2d');
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const px = (x, y, w, h, col) => {
    g.fillStyle = col;
    g.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const X = (tx) => M.l + tx * T; // tile → pixel (left edge)
  const Y = (tz) => M.t + tz * T;
  const shade = (hex, f) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * f)));
    const gg = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * f)));
    const b = Math.max(0, Math.min(255, Math.round((n & 255) * f)));
    return `rgb(${r},${gg},${b})`;
  };

  // ---------- background: dark rock with specks ----------
  px(0, 0, BW, BH, '#0d0915');
  for (let i = 0; i < 2600; i++) px(rnd() * BW, rnd() * BH, 1, 1, rnd() < 0.5 ? '#171026' : '#1d1530');
  for (let i = 0; i < 90; i++) {
    const x = rnd() * BW;
    const y = rnd() * BH;
    px(x, y, 3, 2, '#1f1832');
    px(x + 1, y - 1, 1, 1, '#2a2140');
  }

  // ---------- floors ----------
  const FLOOR_STYLE = Object.fromEntries(ROOMS.map((r) => [r.id, r.floor]));
  function floorTile(tx, tz, style) {
    const x = X(tx);
    const y = Y(tz);
    for (let j = 0; j < T; j++)
      for (let i = 0; i < T; i++) {
        let col;
        const r = rnd();
        if (style === 'floorWood') {
          const plank = Math.floor((j + (tx % 2) * 3) / 4);
          col = j % 4 === 3 ? '#4a2a16' : ['#7d4c2a', '#8a5532', '#734626'][plank % 3];
          if ((i + plank * 5) % 13 === 0) col = '#4a2a16';
          if (r < 0.06) col = '#6a3f22';
        } else if (style === 'floorGold') {
          const chk = (Math.floor(i / 7) + Math.floor(j / 7)) % 2;
          col = i % 7 === 0 || j % 7 === 0 ? '#3a2a1c' : chk ? '#6a5236' : '#5a4430';
          if (r < 0.004) col = '#e8b838';
        } else if (style === 'floorCrystal') {
          col = i % 7 === 0 || j % 7 === 0 ? '#1c1430' : (i + j) % 7 === 3 ? '#3a2a64' : '#2e2252';
          if (r < 0.008) col = '#a888ff';
        } else {
          const chk = (Math.floor(i / 7) + Math.floor(j / 7)) % 2;
          col = i % 7 === 0 || j % 7 === 0 ? '#272233' : chk ? '#4a4560' : '#423d56';
          if (r < 0.03) col = '#36314a';
        }
        px(x + i, y + j, 1, 1, col);
      }
  }
  for (let z = 0; z < H; z++)
    for (let x = 0; x < W; x++) {
      if (grid.cells[z][x] !== FLOOR) continue;
      const rid = grid.room[z][x];
      floorTile(x, z, rid ? FLOOR_STYLE[rid] : 'floorStone');
    }

  // ---------- rugs ----------
  function rug(x0, z0, x1, z1, edge, fill, motif) {
    const x = X(x0 - 0.5) + T / 2;
    const y = Y(z0 - 0.5) + T / 2;
    const w = (x1 - x0 + 1) * T;
    const h = (z1 - z0 + 1) * T;
    px(x, y, w, h, fill);
    for (let i = 0; i < w; i += 2) px(x + i, y + h, 1, 2, edge);
    for (let i = 0; i < w; i += 2) px(x + i, y - 2, 1, 2, edge);
    g.strokeStyle = edge;
    g.lineWidth = 1;
    g.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
    g.strokeRect(x + 5.5, y + 5.5, w - 11, h - 11);
    for (let tz = z0 + 1; tz < z1; tz++)
      for (let tx = x0 + 1; tx < x1; tx++)
        if ((tx + tz) % 2 === 0) {
          const cx = X(tx) + T / 2;
          const cy = Y(tz) + T / 2;
          px(cx - 1, cy - 2, 2, 4, motif);
          px(cx - 2, cy - 1, 4, 2, motif);
        }
  }
  rug(19, 15, 21, 23, '#c9a24a', '#6a1824', '#8e2a36');
  rug(4, 17, 9, 21, '#c9a24a', '#25305a', '#7a5c26');
  rug(18, 4, 22, 9, '#d8b04a', '#4e1a28', '#9a7424');

  // ---------- walls (drawn as raised blocks with brick tops) ----------
  for (let z = 0; z < H; z++)
    for (let x = 0; x < W; x++) {
      if (grid.cells[z][x] !== WALL) continue;
      const x0 = X(x);
      const y0 = Y(z);
      for (let j = 0; j < T; j++)
        for (let i = 0; i < T; i++) {
          const row = Math.floor(j / 4);
          const off = row % 2 ? 4 : 0;
          const mortar = j % 4 === 3 || (i + off + x * 2) % 7 === 6;
          let col = mortar ? '#2a2438' : ['#4e4664', '#57506f', '#4a4260'][(row + x + z) % 3];
          if (!mortar && j % 4 === 0) col = '#665e84';
          if (!mortar && rnd() < 0.04) col = '#3f6b45';
          px(x0 + i, y0 + j, 1, 1, col);
        }
      // drop shadow on the floor south of a wall
      if (grid.cells[z + 1]?.[x] === FLOOR) {
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.fillRect(x0, y0 + T, T, 3);
      }
      // dark outline against the void
      const edgeCol = '#120c1c';
      if (!grid.cells[z - 1]?.[x]) px(x0, y0, T, 1, edgeCol);
      if (!grid.cells[z + 1]?.[x]) px(x0, y0 + T - 1, T, 1, edgeCol);
      if (!grid.cells[z]?.[x - 1]) px(x0, y0, 1, T, edgeCol);
      if (!grid.cells[z]?.[x + 1]) px(x0 + T - 1, y0, 1, T, edgeCol);
    }

  // ---------- sprites ----------
  // pixel sprite from rows of chars; centre at tile coords (tx, tz)
  function sprite(tx, tz, rows, pal, s = 1) {
    const h = rows.length;
    const w = rows[0].length;
    const x0 = Math.round(X(tx) + T / 2 - (w * s) / 2);
    const y0 = Math.round(Y(tz) + T / 2 - (h * s) / 2);
    rows.forEach((row, j) =>
      [...row].forEach((ch, i) => {
        if (ch !== '.') px(x0 + i * s, y0 + j * s, s, s, pal[ch]);
      }),
    );
  }
  const glowAt = (tx, tz, r, col) => {
    const cx = X(tx) + T / 2;
    const cy = Y(tz) + T / 2;
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++) {
        const d = Math.hypot(x, y) / r;
        if (d > 1) continue;
        g.fillStyle = col.replace('A', String(Math.round((1 - d) * 4) * 0.06));
        g.fillRect(cx + x, cy + y, 1, 1);
      }
  };

  const S = {
    pillar: { r: ['.KKKKKK.', 'KLLLLLLK', 'KLMMMMLK', 'KLMLLMLK', 'KLMLLMLK', 'KLMMMMLK', 'KLLLLLLK', '.KKKKKK.'], p: { K: '#1a1426', L: '#6a6288', M: '#4f4868' } },
    barrel: { r: ['..KKKK..', '.KbBBbK.', 'KbBkkBbK', 'KBkBBkBK', 'KBkBBkBK', 'KbBkkBbK', '.KbBBbK.', '..KKKK..'], p: { K: '#1a1018', B: '#8a5532', b: '#6a3f22', k: '#2c2a30' } },
    crate: { r: ['KKKKKKKK', 'KdddddDK', 'KdLddLdK', 'KddLLddK', 'KddLLddK', 'KdLddLdK', 'KDddddDK', 'KKKKKKKK'], p: { K: '#2a1a0e', d: '#a0703e', D: '#5a3a1e', L: '#6a4624' } },
    chest: { r: ['.KKKKKKKKKK.', 'KwwwwwwwwwwK', 'KgwwwwwwwwgK', 'KGGGGYYGGGGK', 'KwwwwYYwwwwK', 'KgwwwwwwwwgK', 'KwwwwwwwwwwK', '.KKKKKKKKKK.'], p: { K: '#1a1018', w: '#7a4724', g: '#d8a830', G: '#2c2a30', Y: '#ffd84a' } },
    coins: { r: ['...YY...', '..YyYY..', '.YYyYyY.', 'YyYYyYYy', 'YYyYYyYY', '.yYYyYY.'], p: { Y: '#ffd84a', y: '#d8a830' } },
    bars: { r: ['..YYYY..', '.YyyyyY.', 'YYYYYYYY', 'yyyyyyyy'], p: { Y: '#ffe27a', y: '#c99a2a' } },
    bull: { r: ['W......W', 'YW....WY', '.YYYYYY.', 'YYYKYYYY', 'YYYYYYYY', '.YY..YY.'], p: { Y: '#e8b838', W: '#fff2b0', K: '#1a1018' } },
    bear: { r: ['.Y....Y.', 'YYY..YYY', 'YYYYYYYY', 'YKYYYYKY', 'YYYKKYYY', '.YYYYYY.'], p: { Y: '#d8a830', K: '#1a1018' } },
    lectern: { r: ['.WWWWWW.', 'WWWrWWWW', 'WllrllWW', '.KbbbbK.', '..KbbK..', '..KbbK..', '.KbbbbK.'], p: { W: '#f3ead2', l: '#9a8a70', r: '#8c2f39', K: '#2a1a0e', b: '#6b4528' } },
    globe: { r: ['.KKKK.', 'KbGbbK', 'KGGbbK', 'KbbGGK', 'KbbbGK', '.KKKK.'], p: { K: '#c9a24a', b: '#2f5d9c', G: '#4a8a3a' } },
    books: { r: ['.rrr..', '.bbbb.', 'gggg..', '.yyyy.'], p: { r: '#8c2f39', b: '#2f5d8c', g: '#3f7d4a', y: '#c9a24a' } },
    altar: { r: ['.KKKKKK.', 'KMMMMMMK', 'KMLLLLMK', 'KMLLLLMK', 'KMMMMMMK', '.KKKKKK.'], p: { K: '#1a1426', M: '#4b4466', L: '#5c5578' } },
    crystal: { r: ['..C...', '.CwC.C', '.CCC.C', 'CCCCCC', '.CCCC.'], p: { C: '#8a5cff', w: '#ffffff' } },
    torch: { r: ['.Y.', 'YOY', '.O.', '.b.'], p: { Y: '#fff2a8', O: '#ff9a3a', b: '#5a3a22' } },
  };

  // Entrance hall
  for (const [x, z] of [[17, 17], [23, 17], [17, 22], [23, 22]]) sprite(x, z, S.pillar.r, S.pillar.p, 1.5);
  sprite(15, 24, S.barrel.r, S.barrel.p);
  sprite(16, 24, S.barrel.r, S.barrel.p);
  sprite(15, 23, S.barrel.r, S.barrel.p);
  px(X(14.1), Y(24.2), 6, 3, '#121016'); // oil puddle
  sprite(25, 24, S.crate.r, S.crate.p, 1.4);
  sprite(24, 24, S.crate.r, S.crate.p, 1.2);
  sprite(25, 23, S.crate.r, S.crate.p);
  // notice board + banner on the north wall
  px(X(16) + 2, Y(14) + 6, T * 2 - 4, 8, '#5a3a22');
  px(X(16) + 5, Y(14) + 8, 6, 4, '#e8dcb0');
  px(X(16) + 14, Y(14) + 8, 7, 5, '#f0e6c8');
  px(X(23) + 4, Y(14) + 4, T * 2 - 8, 10, '#5b1e2e');
  px(X(23) + 9, Y(14) + 7, 2, 5, '#3ddc84');
  px(X(23) + 13, Y(14) + 6, 2, 6, '#3ddc84');
  px(X(23) + 17, Y(14) + 8, 2, 4, '#ff5470');

  // Library
  // big shelf (x 1.55..5.45) and small shelf (9.65..11.15) against the north wall
  const shelf = (xa, xb) => {
    const x0 = Math.round(X(xa - 0.5) + T / 2);
    const x1 = Math.round(X(xb - 0.5) + T / 2);
    const y0 = Y(14) + 8;
    px(x0, y0, x1 - x0, 12, '#3b2414');
    const cols = ['#8c2f39', '#2f5d8c', '#3f7d4a', '#c9a24a', '#6a3f8c', '#b5652b'];
    for (let x = x0 + 1; x < x1 - 1; x++) px(x, y0 + 2, 1, 4, cols[(x * 7) % cols.length]);
    for (let x = x0 + 1; x < x1 - 1; x++) px(x, y0 + 7, 1, 4, cols[(x * 5 + 2) % cols.length]);
    px(x0, y0 + 6, x1 - x0, 1, '#5a3a22');
    px(x0, y0 + 11, x1 - x0, 1, '#5a3a22');
  };
  shelf(1.6, 5.4);
  shelf(9.7, 11.1);
  sprite(6.5, 18.5, S.lectern.r, S.lectern.p, 1.5);
  glowAt(6.5, 18.5, 14, 'rgba(255,210,122,A)');
  // trading desk with three screens + chair
  px(X(3) - 1, Y(22) + 4, T * 3 - 12, 10, '#5a3a22');
  for (const k of [0, 1, 2]) {
    px(X(3) + 2 + k * 11, Y(22) + 3, 9, 5, '#111118');
    px(X(3) + 3 + k * 11, Y(22) + 4, 7, 3, '#0e3a2a');
    px(X(3) + 4 + k * 11, Y(22) + 5, 1, 1, '#3ddc84');
    px(X(3) + 6 + k * 11, Y(22) + 4, 1, 2, '#ff5470');
    px(X(3) + 8 + k * 11, Y(22) + 5, 1, 1, '#3ddc84');
  }
  px(X(4) + 3, Y(23) + 4, 8, 7, '#1c1c26');
  sprite(10, 21.5, S.globe.r, S.globe.p, 1.5);
  sprite(11, 24, S.books.r, S.books.p, 1.5);
  sprite(2.3, 19.4, S.books.r, S.books.p, 1.3);
  sprite(8.6, 16.1, S.books.r, S.books.p, 1.2);

  // Treasure room
  px(X(18) + 3, Y(1) + 6, T * 5 - 6, 9, '#15151d'); // wall screen
  px(X(18) + 5, Y(1) + 7, T * 5 - 10, 7, '#060b10');
  for (let i = 0; i < 26; i++) px(X(18) + 7 + i * 2.4, Y(1) + 9 + ((i * 7) % 4), 1, 3, i % 3 ? '#3ddc84' : '#ff5470');
  glowAt(20, 6.5, 26, 'rgba(255,210,74,A)');
  sprite(20, 6.5, S.chest.r, S.chest.p, 2);
  sprite(16.2, 6.1, S.bull.r, S.bull.p, 1.6);
  sprite(24.1, 7.7, S.bear.r, S.bear.p, 1.6);
  sprite(15.2, 3.6, S.coins.r, S.coins.p, 1.5);
  sprite(17.4, 10.1, S.coins.r, S.coins.p, 1.5);
  sprite(25.7, 4.9, S.bars.r, S.bars.p, 1.6);
  for (const [x, z] of [[15.2, 3.6], [17.4, 10.1], [25.7, 4.9]]) glowAt(x, z, 10, 'rgba(255,226,122,A)');

  // Portal room
  {
    const cx = X(33.5) + T / 2;
    const cy = Y(15) + 2;
    for (let y = -16; y <= 4; y++)
      for (let x = -30; x <= 30; x++) {
        const d = Math.hypot(x, y * 1.6);
        if (y > 2 || d > 30) continue;
        const ring = d > 24;
        const a = Math.atan2(y, x);
        const swirl = Math.sin(a * 3 + d * 0.35);
        g.fillStyle = ring ? ((x + y) % 3 ? '#4b4466' : '#5c5578') : swirl > 0.3 ? '#b48cff' : swirl > -0.3 ? '#6a3fd0' : '#24104a';
        g.fillRect(cx + x, cy + y, 1, 1);
      }
    // rune circle on the floor
    const rx = X(33.5) + T / 2;
    const ry = Y(17.1) + T / 2;
    for (let a = 0; a < Math.PI * 2; a += 0.04) {
      px(rx + Math.cos(a) * 17, ry + Math.sin(a) * 17, 1, 1, '#8a5cff');
      px(rx + Math.cos(a) * 11, ry + Math.sin(a) * 11, 1, 1, '#b48cff');
    }
    glowAt(33.5, 16, 34, 'rgba(154,108,255,A)');
  }
  const altarLogo = (x, z, col, ring) => {
    glowAt(x, z, 12, ring);
    sprite(x, z, S.altar.r, S.altar.p, 1.5);
    px(X(x) + T / 2 - 3, Y(z) + T / 2 - 3, 6, 6, col);
    px(X(x) + T / 2 - 2, Y(z) + T / 2 - 4, 4, 1, col);
    px(X(x) + T / 2 - 2, Y(z) + T / 2 + 3, 4, 1, col);
  };
  altarLogo(30.9, 19.5, '#1db954', 'rgba(29,185,84,A)');
  altarLogo(34.2, 22.1, '#e1306c', 'rgba(225,48,108,A)');
  altarLogo(36.8, 18.9, '#5865f2', 'rgba(88,101,242,A)');
  for (const [x, z, col] of [[29, 15, '#8a5cff'], [38, 15, '#2ec4ff'], [29, 24, '#2ec4ff'], [38, 24, '#e1306c']]) {
    glowAt(x, z, 9, 'rgba(180,140,255,A)');
    sprite(x, z, S.crystal.r, { ...S.crystal.p, C: col }, 1.6);
  }

  // ---------- torches with warm glow ----------
  for (const tc of torches) {
    glowAt(tc.x, tc.z, 12, 'rgba(255,154,58,A)');
    sprite(tc.x, tc.z, S.torch.r, S.torch.p, 1.4);
  }

  // ---------- spawn: the player's pixel face ----------
  {
    const FACE = ['HHHHHHHH', 'HHHHHHHH', 'HSSSSSSH', 'SGLGGLGS', 'SSSDDSSS', 'SSSSSSSS', 'SSMMMMSS', 'DDDDDDDD'];
    const P = { H: '#2a1a10', S: '#e7b183', D: '#c98f62', G: '#0a0a10', L: '#6fe0ff', M: '#8a4a3a' };
    px(X(20) + T / 2 - 9, Y(21) + T / 2 - 9, 18, 18, '#000');
    FACE.forEach((row, j) => [...row].forEach((ch, i) => px(X(20) + T / 2 - 8 + i * 2, Y(21) + T / 2 - 8 + j * 2, 2, 2, P[ch])));
  }

  // ---------- room labels on little ribbons ----------
  g.font = '8px "Press Start 2P"';
  g.textBaseline = 'top';
  const ribbon = (text, tx, tz, col) => {
    const w = Math.ceil(g.measureText(text).width) + 10;
    const x = Math.round(X(tx) + T / 2 - w / 2);
    const y = Math.round(Y(tz));
    px(x - 3, y + 2, 3, 8, shade(col, 0.55));
    px(x + w, y + 2, 3, 8, shade(col, 0.55));
    px(x, y, w, 12, '#120c1c');
    px(x + 1, y + 1, w - 2, 10, col);
    g.fillStyle = '#120c1c';
    g.fillText(text, x + 5, y + 3);
  };
  ribbon('ENTRANCE HALL', 20, 25.6, '#c9c0e8');
  ribbon('LIBRARY', 6.5, 25.6, '#e0a96d');
  ribbon('TREASURE ROOM', 20, -0.7, '#f5c542');
  ribbon('PORTAL ROOM', 33.5, 25.6, '#b48cff');

  // ---------- compass rose (top right) ----------
  {
    const cx = BW - 30;
    const cy = BH - 30;
    for (let i = -10; i <= 10; i++) {
      const w = Math.max(0, 3 - Math.abs(i) / 4);
      px(cx - w, cy + i, w * 2 + 1, 1, i < 0 ? '#f5c542' : '#8a7a5a');
      px(cx + i, cy - w / 2, 1, w + 1, '#6a6288');
    }
    g.fillStyle = '#f5c542';
    g.fillText('N', cx - 3, cy - 22);
  }

  // ---------- frame ----------
  g.strokeStyle = '#3a2f55';
  g.lineWidth = 3;
  g.strokeRect(6.5, 6.5, BW - 13, BH - 13);
  g.strokeStyle = '#000';
  g.lineWidth = 1;
  g.strokeRect(4.5, 4.5, BW - 9, BH - 9);
  for (const [x, y] of [[4, 4], [BW - 12, 4], [4, BH - 12], [BW - 12, BH - 12]]) {
    px(x, y, 8, 8, '#c9a24a');
    px(x + 2, y + 2, 4, 4, '#5b1e2e');
  }

  // ---------- upscale without smoothing ----------
  const out = document.createElement('canvas');
  out.width = BW * SCALE;
  out.height = BH * SCALE;
  const o = out.getContext('2d');
  o.imageSmoothingEnabled = false;
  o.drawImage(c, 0, 0, out.width, out.height);
  return out.toDataURL('image/png');
}
