// Captures the README images (banner + highlights) from the running dev server.
// Usage: npm run dev   (in another terminal)   then   node scripts/readme/shots.cjs [outDir] [only]
const { chromium } = require('playwright');
const path = require('path');
const OUT = process.argv[2] || path.join(__dirname, '../../docs/readme');
const ONLY = process.argv[3] || '';
const URL = process.env.SITE_URL || 'http://localhost:5173/';

const SHOTS = [
  // banner: no UI, no text — the portal room, wide and low
  { name: 'banner', w: 1920, h: 640, dsf: 2, px: 3, hideUI: true, player: [33.5, 18.4], facing: 0, vision: [8.5, 14], fov: 30, camera: { pos: [33.5, 4.3, 28.6], target: [33.5, 1.55, 18.2] } },
  // highlights: the real site with its UI, 1280x720 at 3x = 3840x2160 (4K)
  { name: 'shot-intro', w: 1280, h: 720, dsf: 3, intro: true },
  { name: 'shot-welcome', w: 1280, h: 720, dsf: 3, keepWelcome: true },
  { name: 'shot-portal', w: 1280, h: 720, dsf: 3, player: [33.2, 19.8] },
  { name: 'shot-treasury', w: 1280, h: 720, dsf: 3, player: [20, 8.4] },
  { name: 'shot-performance', w: 1280, h: 720, dsf: 3, player: [20, 8.6], act: 'chest' },
  { name: 'shot-library', w: 1280, h: 720, dsf: 3, player: [6.5, 20.4], act: 'bio' },
  { name: 'shot-oil', w: 1280, h: 720, dsf: 3, player: [16.6, 22.6], act: 'oil' },
];

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const s of SHOTS) {
    if (ONLY && !s.name.startsWith(ONLY)) continue;
    const p = await b.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: s.dsf || 2 });
    await p.goto(URL + (s.query || ''));
    await p.waitForTimeout(2500);
    if (s.intro) {
      await p.addStyleTag({ content: '.blink { animation: none !important; }' });
      await p.waitForTimeout(1500);
      await p.screenshot({ path: path.join(OUT, s.name + '.png') });
      console.log('saved', s.name);
      await p.close();
      continue;
    }
    await p.keyboard.press('Enter');
    await p.waitForTimeout(1500);
    if (!s.keepWelcome) await p.keyboard.press('Escape');
    await p.evaluate((s) => {
      const d = window.__dungeon;
      if (s.player) d.teleport(s.player[0], s.player[1]);
      if (s.px || s.hideUI || s.camera || s.vision || s.fov) d.photo({ pixelScale: s.px, hideUI: !!s.hideUI, camera: s.camera || null, vision: s.vision, fov: s.fov, facing: s.facing });
    }, s);
    if (s.act) {
      await p.waitForTimeout(1500);
      await p.evaluate((id) => {
        const it = window.__dungeon.items.find((i) => i.id === id);
        it.action();
      }, s.act);
    }
    await p.waitForTimeout(s.wait || 2500);
    await p.screenshot({ path: path.join(OUT, s.name + '.png') });
    console.log('saved', s.name);
    await p.close();
  }
  await b.close();
})();
