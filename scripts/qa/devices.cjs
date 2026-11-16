// Device matrix: desktop, iPhone (portrait + landscape), Android, iPad (portrait + landscape).
// For each: intro, welcome panel, joystick drag (STICK=1), the floating prompt, the Performance panel,
// and a check that nothing sticks out of the screen. Needs the dev server (npm run dev).
// Usage: node scripts/qa/devices.cjs <outDir> [desktop,phone,...]
const { chromium, devices } = require('playwright');
const path = require('path');
const OUT = process.argv[2] || 'qa-shots';
require('fs').mkdirSync(OUT, { recursive: true });
const ONLY = process.argv[3] || '';
const URL = process.env.SITE_URL || 'http://localhost:5173/';
const D = {
  desktop: { viewport: { width: 1280, height: 800 } },
  phone: devices['iPhone 13'],
  phoneL: devices['iPhone 13 landscape'],
  android: devices['Pixel 7'],
  tablet: devices['iPad (gen 7)'],
  tabletL: devices['iPad (gen 7) landscape'],
};
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [name, dev] of Object.entries(D)) {
    if (ONLY && !ONLY.split(',').includes(name)) continue;
    const ctx = await b.newContext({ ...dev, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push('pageerror ' + e.message));
    p.on('console', (m) => m.type() === 'error' && errs.push('console ' + m.text()));
    await p.goto(URL);
    await p.waitForTimeout(2500);
    await p.screenshot({ path: path.join(OUT, name + '-1intro.png') });
    const touch = !!dev.hasTouch;
    if (touch) await p.tap('#start'); else await p.keyboard.press('Enter');
    await p.waitForTimeout(2500);
    await p.screenshot({ path: path.join(OUT, name + '-2welcome.png') });
    const welcomeOpen = await p.isVisible('#panel');
    if (touch && welcomeOpen) await p.tap('#panel-close'); else await p.keyboard.press('Escape');
    await p.waitForTimeout(800);
    let stickInfo = '';
    if (touch && process.env.STICK) {
      // drag the joystick up for ~1.5 s and see the player move north
      const z0 = await p.evaluate(() => window.__dungeon.pos.z);
      const box = await p.locator('#stick').boundingBox();
      const cdp = await ctx.newCDPSession(p);
      const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx, y: cy - box.height * 0.3 }] });
      await p.waitForTimeout(400);
      await p.screenshot({ path: path.join(OUT, name + '-2b-stick.png') });
      await p.waitForTimeout(1100);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      const z1 = await p.evaluate(() => window.__dungeon.pos.z);
      await p.waitForTimeout(500);
      const z2 = await p.evaluate(() => window.__dungeon.pos.z);
      stickInfo = ` stick dz=${(z1 - z0).toFixed(2)} after-release dz=${(z2 - z1).toFixed(2)}`;
    }
    await p.evaluate(() => window.__dungeon.teleport(20, 9.2));
    await p.waitForTimeout(1500);
    await p.screenshot({ path: path.join(OUT, name + '-3game.png') });
    // walk next to the chest, then use the floating prompt (tap on touch, click on desktop)
    await p.evaluate(() => window.__dungeon.teleport(20, 8.4));
    await p.waitForTimeout(1500);
    const promptVisible = await p.isVisible('#prompt');
    const kbd = promptVisible ? await p.textContent('#prompt kbd') : '-';
    const actionBtn = await p.isVisible('#btn-action');
    if (promptVisible) { if (touch) await p.tap('#prompt'); else await p.click('#prompt'); }
    else await p.evaluate(() => window.__dungeon.goTo('chest'));
    await p.waitForTimeout(2500);
    await p.screenshot({ path: path.join(OUT, name + '-4panel.png') });
    const info = await p.evaluate(() => ({ dev: document.documentElement.dataset.device, input: document.documentElement.dataset.input, w: innerWidth, h: innerHeight }));
    info.panel = await p.textContent('#panel-title').catch(() => '');
    info.prompt = promptVisible + '/' + kbd + ' A-btn=' + actionBtn;
    // horizontal overflow check: nothing should stick out of the viewport
    info.overflow = await p.evaluate(() => [...document.querySelectorAll('#hud *, #lang *, #panel .panel-box')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1 || r.bottom > innerHeight + 1); }).map((e) => e.id || e.className).slice(0, 5));
    console.log(name, JSON.stringify(info) + stickInfo, errs.join(' | ') || 'no errors');
    await ctx.close();
  }
  await b.close();
})();
