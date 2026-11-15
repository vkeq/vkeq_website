import * as THREE from 'three';

// Small animated candlestick chart rendered to a canvas texture (pixel look).
export function chartScreen(w, h, { header = '', start = 21000, vol = 40, seed = 1 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;

  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const top = header ? 10 : 2;
  const cw = w > 80 ? 5 : 3;
  const maxC = Math.floor((w - 4) / cw);
  const candles = [];
  let price = start;
  const push = () => {
    const o = price;
    const c = o + (rnd() - 0.46) * vol;
    candles.push({ o, c, h: Math.max(o, c) + rnd() * vol * 0.4, l: Math.min(o, c) - rnd() * vol * 0.4 });
    price = c;
    if (candles.length > maxC) candles.shift();
  };
  for (let i = 0; i < maxC; i++) push();

  let n = 0;
  function draw() {
    g.fillStyle = '#060b10';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#0d1a22';
    for (let y = top + 4; y < h; y += 10) g.fillRect(0, y, w, 1);
    const hi = Math.max(...candles.map((c) => c.h));
    const lo = Math.min(...candles.map((c) => c.l));
    const Y = (v) => Math.round(top + 2 + (1 - (v - lo) / (hi - lo || 1)) * (h - top - 5));
    candles.forEach((c, i) => {
      const x = 2 + i * cw;
      g.fillStyle = c.c >= c.o ? '#3ddc84' : '#ff5470';
      const mid = x + Math.floor((cw - 2) / 2);
      g.fillRect(mid, Y(c.h), 1, Math.max(1, Y(c.l) - Y(c.h)));
      const t = Y(Math.max(c.o, c.c));
      g.fillRect(x, t, cw - 2, Math.max(1, Y(Math.min(c.o, c.c)) - t));
    });
    if (header) {
      g.fillStyle = '#0a1218';
      g.fillRect(0, 0, w, 10);
      g.font = '8px "Press Start 2P", monospace';
      g.textBaseline = 'top';
      g.fillStyle = '#9fb8c8';
      g.fillText(header, 2, 1);
      const last = candles[candles.length - 1];
      g.fillStyle = last.c >= last.o ? '#3ddc84' : '#ff5470';
      g.fillText(price.toFixed(0), 64, 1);
      if (n % 2 === 0) {
        g.fillStyle = '#ff5470';
        g.fillRect(w - 8, 2, 5, 5);
      }
    }
    tex.needsUpdate = true;
  }
  draw();

  let acc = 0;
  function tick(dt) {
    acc += dt;
    if (acc < 0.35) return;
    acc = 0;
    n++;
    const last = candles[candles.length - 1];
    last.c += (rnd() - 0.47) * vol * 0.3;
    last.h = Math.max(last.h, last.c);
    last.l = Math.min(last.l, last.c);
    price = last.c;
    if (n % 8 === 0) push();
    draw();
  }
  return { texture: tex, tick };
}
