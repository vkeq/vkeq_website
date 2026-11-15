// Build a single-file version of the game page for publishing as a claude.ai artifact.
import { build } from 'vite';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const root = process.cwd(), out = process.argv[2] || root + '/dist-single';
const outDir = out + '/single-dist';
await build({ root, configFile: false, logLevel: 'error', build: { outDir, emptyOutDir: true, modulePreload: false, assetsInlineLimit: 100000000, rollupOptions: { input: root + '/index.html' } } });
const html = readFileSync(outDir + '/index.html', 'utf8');
const assets = readdirSync(outDir + '/assets');
const js = assets.filter((f) => f.endsWith('.js')).map((f) => readFileSync(outDir + '/assets/' + f, 'utf8'));
const css = assets.filter((f) => f.endsWith('.css')).map((f) => readFileSync(outDir + '/assets/' + f, 'utf8')).join('\n');
if (js.length !== 1) throw new Error('expected one js chunk, got ' + js.length);
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>')).replace(/<script[^>]*src=[^>]*><\/script>/g, '');
const fonts = html.match(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/)[0];
const page = `<title>vkeq's Dungeon</title>
<meta name="description" content="vkeq, day trader. A 3D pixel dungeon to explore." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
${fonts}
<style>
:root { color-scheme: dark; }
${css}
</style>
${body}
<script type="module">
${js[0].replace(/<\/script/g, '<\\/script')}
</script>
`;
writeFileSync(out + '/vkeq-dungeon.html', page);
console.log('written', (page.length / 1024).toFixed(0) + ' KB');
