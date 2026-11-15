import * as THREE from 'three';
import { VoxelPart } from './voxel.js';

// Pixel-art versions of social logos, extruded into floating voxel "crystals".
// Each map is a list of rows; every character is a colour key from `colors`
// ('.' = empty). `grad` colours are computed per pixel.

const LOGOS = {
  spotify: {
    colors: { G: '#1db954', K: '#0b0b0b' },
    rows: [
      '....GGGGGG....',
      '..GGGGGGGGGG..',
      '.GGGGGGGGGGGG.',
      '.GGKKKKKKKGGG.',
      'GGKGGGGGGGKKGG',
      'GGGGGGGGGGGGKG',
      'GGGKKKKKKKGGGG',
      'GGKGGGGGGGKKGG',
      'GGGGGGGGGGGGGG',
      '.GGGKKKKKKGGG.',
      '.GGKGGGGGGKGG.',
      '..GGGGGGGGGG..',
      '....GGGGGG....',
    ],
  },
  instagram: {
    grad: ['#feda75', '#fa7e1e', '#d62976', '#962fbf', '#4f5bd5'],
    rows: [
      '.OOOOOOOOOOOO.',
      'OOOOOOOOOOOOOO',
      'OO........OOOO',
      'OO.........OOO',
      'OO...OOOO...OO',
      'OO..OO..OO..OO',
      'OO..O....O..OO',
      'OO..O....O..OO',
      'OO..OO..OO..OO',
      'OO...OOOO...OO',
      'OO..........OO',
      'OOOOOOOOOOOOOO',
      '.OOOOOOOOOOOO.',
    ],
  },
  discord: {
    colors: { B: '#5865f2', W: '#ffffff' },
    rows: [
      '..BBB....BBB..',
      '.BBBBBBBBBBBB.',
      '.BBBBBBBBBBBB.',
      'BBBBBBBBBBBBBB',
      'BBBBBBBBBBBBBB',
      'BBBWWBBBBWWBBB',
      'BBWWWWBBWWWWBB',
      'BBBWWBBBBWWBBB',
      'BBBBBBBBBBBBBB',
      '.BBBBBBBBBBBB.',
      '.BBB.BBBB.BBB.',
      '..B........B..',
    ],
  },
  youtube: {
    colors: { R: '#ff0000', W: '#ffffff' },
    rows: [
      '.RRRRRRRRRRRR.',
      'RRRRRRRRRRRRRR',
      'RRRRRWRRRRRRRR',
      'RRRRRWWRRRRRRR',
      'RRRRRWWWRRRRRR',
      'RRRRRWWWWRRRRR',
      'RRRRRWWWRRRRRR',
      'RRRRRWWRRRRRRR',
      'RRRRRWRRRRRRRR',
      'RRRRRRRRRRRRRR',
      '.RRRRRRRRRRRR.',
    ],
  },
  x: {
    colors: { K: '#111111', W: '#ffffff' },
    rows: [
      'KKKKKKKKKKKK',
      'KWWKKKKKKWKK',
      'KKWWKKKKWKKK',
      'KKKWWKKWKKKK',
      'KKKKWWWKKKKK',
      'KKKKWWWKKKKK',
      'KKKKWKWWKKKK',
      'KKKWKKKWWKKK',
      'KKWKKKKKWWKK',
      'KWKKKKKKKWWK',
      'KKKKKKKKKKKK',
    ],
  },
  tiktok: {
    colors: { K: '#111111', W: '#ffffff', C: '#25f4ee', P: '#fe2c55' },
    rows: [
      '.......CW...',
      '.......CWW..',
      '.......CWPW.',
      '.......CW.PW',
      '....CCCCW...',
      '...CWWWPW...',
      '..CW..PCW...',
      '..CW..PCW...',
      '..CW..PW....',
      '...WWWWP....',
      '....PPP.....',
    ],
  },
};

export const LOGO_IDS = Object.keys(LOGOS);

function lerpHex(stops, t) {
  const c = new THREE.Color();
  const s = Math.max(0, Math.min(0.9999, t)) * (stops.length - 1);
  const i = Math.floor(s);
  return c.set(stops[i]).lerp(new THREE.Color(stops[i + 1]), s - i).getHexString();
}

// Returns a Group containing the voxel logo centred on its origin, or null if unknown.
export function voxelLogo(id, { u = 0.05, depth = 3 } = {}) {
  const L = LOGOS[id];
  if (!L) return null;
  const h = L.rows.length;
  const w = Math.max(...L.rows.map((r) => r.length));
  const part = new VoxelPart(u, 7);
  L.rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      const color = L.grad ? '#' + lerpHex(L.grad, (x + (h - 1 - y)) / (w + h - 2)) : L.colors[ch];
      // the outline colour gets full depth, inner details sit slightly forward
      part.fill(x - w / 2, h - 1 - y - h / 2, -depth / 2, 1, 1, depth, color);
    });
  });
  const g = new THREE.Group();
  part.build(g, { basic: true });
  return g;
}

// Flat pixel version of a logo as a data URL (for HTML panels), or null if unknown.
const urlCache = {};
export function logoDataURL(id) {
  const L = LOGOS[id];
  if (!L) return null;
  if (urlCache[id]) return urlCache[id];
  const h = L.rows.length;
  const w = Math.max(...L.rows.map((r) => r.length));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  L.rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      g.fillStyle = L.grad ? '#' + lerpHex(L.grad, (x + (h - 1 - y)) / (w + h - 2)) : L.colors[ch];
      g.fillRect(x, y, 1, 1);
    }),
  );
  return (urlCache[id] = c.toDataURL());
}
