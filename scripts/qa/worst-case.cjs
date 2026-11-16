// Worst-case content test (break-ui): loads the site with extreme content through the admin draft
// (very long names, handles, links and firm names, 40 payouts, 4 stats) and with empty content
// (no payouts, no equity curve, no socials), opens every panel on desktop, phone and a 320px screen,
// and reports anything that overflows. Needs the dev server (npm run dev).
// Usage: node scripts/qa/worst-case.cjs [outDir]
const { chromium, devices } = require('playwright');
const base = require('../../src/content.json');
const fs = require('fs');
const clone = (o) => JSON.parse(JSON.stringify(o));
const worst = clone(base);
worst.name = 'vkeq_the_extremely_long_trader_name';
worst.tagline = { en: 'Full-time Futures, Options, Crypto & Forex Trader — NQ ES CL GC — since 2019', it: 'Trader a tempo pieno di Futures, Opzioni, Cripto e Forex — NQ ES CL GC — dal 2019' };
worst.performance.stats = [
  { label: { en: 'Net P&L (all accounts, after fees)', it: 'P&L netto (tutti i conti, dopo le commissioni)' }, value: '+$1,234,567.89', tone: 'good' },
  { label: { en: 'Win rate', it: 'Win rate' }, value: '100%', tone: '' },
  { label: { en: 'Payouts', it: 'Payout' }, value: 'auto:payouts', tone: 'good' },
  { label: { en: 'Max drawdown', it: 'Drawdown massimo' }, value: '-$98,765', tone: 'bad' },
];
worst.performance.payouts = Array.from({ length: 40 }, (_, i) => ({ firm: i % 3 ? 'TakeProfitTrader + FundedNext + Apex Trader Funding (evaluation)' : 'X', amount: i % 5 ? 1234567 : 1, date: `20${20 + (i % 7)}-${String((i % 12) + 1).padStart(2, '0')}` }));
worst.bio.facts.push({ label: { en: 'Website', it: 'Sito' }, value: { en: 'https://averyveryverylongdomainnamewithoutanybreaks.trade/path', it: 'https://averyveryverylongdomainnamewithoutanybreaks.trade/path' } });
worst.socials[0].handle = '@an_unbelievably_long_spotify_handle_without_spaces_2026';
worst.socials[0].label = 'Spotify Premium Family Playlist';
worst.contactEmail = 'a.very.long.contact.address.for.business.enquiries@vkeq-trading-dungeon.example';
const empty = clone(base);
empty.performance.payouts = [];
empty.performance.equity = [];
empty.socials = [];
empty.contactEmail = '';
const OUT = (process.argv[2] || 'qa-shots') + '/';
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [dname, dev] of [['desk', { viewport: { width: 1280, height: 800 } }], ['phone', devices['iPhone 13']], ['narrow', { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true }]]) {
    for (const [fname, data] of [['worst', worst], ['empty', empty]]) {
      const ctx = await b.newContext({ ...dev, deviceScaleFactor: 1 });
      await ctx.addInitScript((d) => localStorage.setItem('vkeq-admin-draft', JSON.stringify({ data: d })), data);
      const p = await ctx.newPage();
      const errs = [];
      p.on('pageerror', (e) => errs.push(e.message));
      await p.goto('http://localhost:5173/?draft=1');
      await p.waitForTimeout(2500);
      await p.evaluate(() => window.__dungeon.start());
      await p.waitForTimeout(1500);
      await p.keyboard.press('Escape');
      await p.waitForTimeout(500);
      await p.screenshot({ path: `${OUT}${dname}-${fname}-hud.png` });
      const over = {};
      for (const id of ['chest', 'bio', 'portal']) {
        await p.evaluate((id) => { const it = window.__dungeon.items.find((i) => i.id === id); window.__dungeon.teleport(it.x, it.z + 0.6); }, id);
        await p.waitForTimeout(900);
        await p.evaluate((id) => window.__dungeon.goTo(id), id);
        await p.waitForTimeout(1200);
        await p.screenshot({ path: `${OUT}${dname}-${fname}-${id}.png` });
        over[id] = await p.evaluate(() => {
          const body = document.querySelector('#panel-body');
          const bad = [...body.querySelectorAll('*')].filter((e) => { const r = e.getBoundingClientRect(); const pr = body.getBoundingClientRect(); return r.width && (r.right > pr.right + 1 || r.left < pr.left - 1); }).map((e) => e.className || e.tagName).slice(0, 4);
          return { title: document.querySelector('#panel-title').textContent, bad, hscroll: body.scrollWidth > body.clientWidth };
        });
        await p.keyboard.press('Escape');
        await p.waitForTimeout(300);
      }
      const hud = await p.evaluate(() => { const a = document.querySelector('.hud-id').getBoundingClientRect(); const l = document.querySelector('#lang').getBoundingClientRect(); return { hudRight: Math.round(a.right), langLeft: Math.round(l.left), overlap: a.right > l.left && a.top < l.bottom }; });
      console.log(dname, fname, JSON.stringify(hud), JSON.stringify(over), errs.join(' | ') || 'no errors');
      await ctx.close();
    }
  }
  await b.close();
})();
