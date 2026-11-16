// Hand-drawn 12x12 pixel icons for the HTML panels (menu, anecdotes, payouts).
// They replace emoji, which render differently on every OS and never match the pixel world.
// '.' is transparent; every other letter is a colour from the icon's palette.
const K = '#120c1c'; // outline shared by every icon

const ICONS = {
  // open book: About me
  book: {
    pal: { k: K, W: '#efe6d2', l: '#9a8a6a', b: '#8a4a2a' },
    rows: [
      '............',
      '.kkkk..kkkk.',
      'kWWWWkkWWWWk',
      'kWllWkkWllWk',
      'kWWWWkkWWWWk',
      'kWllWkkWllWk',
      'kWWWWkkWWWWk',
      'kWllWkkWllWk',
      'kWWWWkkWWWWk',
      'kbbbbkkbbbbk',
      '.kkkkkkkkkk.',
      '............',
    ],
  },
  // treasure chest: Performance
  chest: {
    pal: { k: K, b: '#8a5a2b', g: '#f5c542', y: '#ffe9a8' },
    rows: [
      '............',
      '..kkkkkkkk..',
      '.kbbbbbbbbk.',
      'kbbbbbbbbbbk',
      'kggggggggggk',
      'kbbbbyybbbbk',
      'kbbbbykbbbbk',
      'kbbbbbbbbbbk',
      'kggggggggggk',
      'kbbbbbbbbbbk',
      'kkkkkkkkkkkk',
      '............',
    ],
  },
  // portal ring: Socials
  portal: {
    pal: { k: K, p: '#6b3fc4', P: '#b48cff', c: '#5ad1ff', w: '#f2ecff' },
    rows: [
      '....kkkk....',
      '..kkppppkk..',
      '.kppPPPPppk.',
      '.kpPPccPPpk.',
      'kpPPcwwcPPpk',
      'kpPcwwwwcPpk',
      'kpPcwwwwcPpk',
      'kpPPcwwcPPpk',
      '.kpPPccPPpk.',
      '.kppPPPPppk.',
      '..kkppppkk..',
      '....kkkk....',
    ],
  },
  // parchment: Notice board
  scroll: {
    pal: { k: K, s: '#c9a46a', p: '#efe0bc', l: '#8a7350' },
    rows: [
      '............',
      '.kkkkkkkkkk.',
      'kssssssssssk',
      '.kppppppppk.',
      '.kpllllllpk.',
      '.kppppppppk.',
      '.kpllllpppk.',
      '.kppppppppk.',
      '.kplllllppk.',
      'kssssssssssk',
      '.kkkkkkkkkk.',
      '............',
    ],
  },
  // trading PC with candles
  pc: {
    pal: { k: K, d: '#0b0f14', g: '#3ddc84', r: '#ff5470', m: '#6a6488' },
    rows: [
      '............',
      'kkkkkkkkkkkk',
      'kddddddddgdk',
      'kdddddgddgdk',
      'kddrddgddgdk',
      'kdgrddgddddk',
      'kdgddddddddk',
      'kddddddddddk',
      'kkkkkkkkkkkk',
      '....kmmk....',
      '..kmmmmmmk..',
      '............',
    ],
  },
  // gold coin
  coin: {
    pal: { k: K, o: '#a8761c', y: '#f5c542', Y: '#ffe9a8' },
    rows: [
      '............',
      '....kkkk....',
      '..kkooookk..',
      '.koyyyyyyok.',
      '.koyYYyyyok.',
      'koyYyyoyyyok',
      'koyYyoooyyok',
      'koyyyyoyyyok',
      '.koyyyyyyok.',
      '..kkooookk..',
      '....kkkk....',
      '............',
    ],
  },
  // oil barrel
  barrel: {
    pal: { k: K, b: '#8c3b2e', i: '#4a4560', n: '#0a0a10' },
    rows: [
      '............',
      '...kkkkkk...',
      '..kbbbbbbk..',
      '.kbbbbbbbbk.',
      '.kiiiiiiiik.',
      '.kbbbbbbbbk.',
      '.kbbbnnbbbk.',
      '.kbbbnnbbbk.',
      '.kiiiiiiiik.',
      '.kbbbbbbbbk.',
      '..kkkkkkkk..',
      '............',
    ],
  },
  // supply crate (futures)
  crate: {
    pal: { k: K, w: '#c08a4a', d: '#8a5a2b' },
    rows: [
      'kkkkkkkkkkkk',
      'kwwwwwwwwwwk',
      'kwddddddddwk',
      'kwdwddddwdwk',
      'kwddwddwddwk',
      'kwdddwwdddwk',
      'kwdddwwdddwk',
      'kwddwddwddwk',
      'kwdwddddwdwk',
      'kwddddddddwk',
      'kwwwwwwwwwwk',
      'kkkkkkkkkkkk',
    ],
  },
  // stack of books
  books: {
    pal: { k: K, R: '#c0392b', G: '#2e8b57', B: '#3a6fd8', P: '#8e5bd8', W: '#efe6d2' },
    rows: [
      '.kkkkkkkkkk.',
      '.kRRRRRRRWk.',
      '.kkkkkkkkkk.',
      'kkkkkkkkkk..',
      'kGGGGGGGWk..',
      'kkkkkkkkkk..',
      '..kkkkkkkkkk',
      '..kBBBBBBBWk',
      '..kkkkkkkkkk',
      '.kkkkkkkkkk.',
      '.kPPPPPPPWk.',
      '.kkkkkkkkkk.',
    ],
  },
};

export const ICON_NAMES = Object.keys(ICONS);

const cache = new Map();

// PNG data URL of an icon (drawn once, then cached).
export function iconURL(name) {
  if (cache.has(name)) return cache.get(name);
  const icon = ICONS[name];
  if (!icon) return '';
  const c = document.createElement('canvas');
  c.width = 12;
  c.height = 12;
  const g = c.getContext('2d');
  icon.rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      g.fillStyle = icon.pal[ch];
      g.fillRect(x, y, 1, 1);
    }),
  );
  const url = c.toDataURL();
  cache.set(name, url);
  return url;
}

// <img> markup for an icon; decorative (the text next to it carries the meaning).
export function iconHTML(name, cls = 'px-ico') {
  const url = iconURL(name);
  return url ? `<img class="${cls}" src="${url}" alt="" width="12" height="12" />` : '';
}

// Development check: every row must be 12 pixels and use only palette letters.
if (import.meta.env?.DEV) {
  for (const [name, icon] of Object.entries(ICONS)) {
    if (icon.rows.length !== 12) console.warn(`icon ${name}: ${icon.rows.length} rows`);
    icon.rows.forEach((row, y) => {
      if (row.length !== 12) console.warn(`icon ${name} row ${y}: ${row.length} px`);
      for (const ch of row) if (ch !== '.' && !icon.pal[ch]) console.warn(`icon ${name} row ${y}: no colour for "${ch}"`);
    });
  }
}
