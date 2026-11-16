// Renders docs/readme/map.png (4K pixel-art map) from the running dev server.
// Usage: npm run dev   then   node scripts/readme/map.cjs [outFile]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2] || path.join(__dirname, '../../docs/readme/map.png');
const URL = process.env.SITE_URL || 'http://localhost:5173/';

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  p.on('pageerror', (e) => console.log('ERR', e.message));
  await p.goto(URL);
  await p.waitForFunction(() => window.__dungeon, null, { timeout: 60000 });
  await p.evaluate(() => document.fonts.load('8px "Press Start 2P"'));
  const data = await p.evaluate(async () => {
    const { drawMap } = await import('/scripts/readme/map-draw.js');
    const torches = window.__dungeon.world.torches.map((t) => ({ x: t.pos.x, z: t.pos.z }));
    return drawMap(torches);
  });
  fs.writeFileSync(OUT, Buffer.from(data.split(',')[1], 'base64'));
  console.log('saved', OUT);
  await b.close();
})();
