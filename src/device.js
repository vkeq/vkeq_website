// Device detection: phone, tablet or desktop, plus the input in use (touch or mouse/keyboard).
// The result is written on <html> as data-device / data-input / data-orient so CSS can adapt the whole UI,
// and modules can read `device` or subscribe with onDeviceChange().
//
// - type:   'phone' | 'tablet' | 'desktop'   (hardware class, stable for the session)
// - input:  'touch' | 'mouse'                (switches live on hybrid devices: touch the screen or use the mouse/keys)
// - orient: 'portrait' | 'landscape'
// Testing override: ?device=phone|tablet|desktop

const html = document.documentElement;
const mq = (q) => window.matchMedia?.(q).matches ?? false;

function hardware() {
  const ua = navigator.userAgent || '';
  const touchPoints = navigator.maxTouchPoints || 0;
  const coarse = mq('(pointer: coarse)');
  const noHover = mq('(hover: none)');
  const uaMobile = navigator.userAgentData?.mobile ?? /Mobi|iPhone|iPod|Android.+Mobile|Windows Phone/i.test(ua);
  // iPadOS reports itself as a Mac; the touch points give it away
  const uaTablet = /iPad|Tablet|PlayBook|Silk|Android(?!.+Mobile)/i.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1);
  const touchFirst = coarse || (noHover && touchPoints > 0);
  // short side of the physical screen in CSS pixels (does not change when a desktop window is resized)
  const shortSide = Math.min(screen.width || innerWidth, screen.height || innerHeight);

  let type = 'desktop';
  if (uaMobile && !uaTablet) type = 'phone';
  else if (uaTablet) type = 'tablet';
  else if (touchFirst) type = shortSide < 600 ? 'phone' : 'tablet';

  const forced = new URLSearchParams(location.search).get('device');
  if (['phone', 'tablet', 'desktop'].includes(forced)) type = forced;
  return { type, touchFirst: type !== 'desktop' || touchFirst };
}

const hw = hardware();

export const device = {
  type: hw.type,
  input: hw.touchFirst ? 'touch' : 'mouse',
  orient: 'landscape',
  get touch() {
    return this.input === 'touch';
  },
  get phone() {
    return this.type === 'phone';
  },
  get tablet() {
    return this.type === 'tablet';
  },
  get desktop() {
    return this.type === 'desktop';
  },
};

const listeners = new Set();
export function onDeviceChange(fn) {
  listeners.add(fn);
}

function apply(notify) {
  const orient = innerWidth >= innerHeight ? 'landscape' : 'portrait';
  const changed = html.dataset.device !== device.type || html.dataset.input !== device.input || html.dataset.orient !== orient;
  device.orient = orient;
  html.dataset.device = device.type;
  html.dataset.input = device.input;
  html.dataset.orient = orient;
  if (changed && notify) listeners.forEach((fn) => fn(device));
}
apply(false);

function setInput(input) {
  if (device.input === input) return;
  device.input = input;
  apply(true);
}

// Hybrid devices (touch laptops, tablets with a keyboard): follow what the visitor actually uses.
window.addEventListener('pointerdown', (e) => setInput(e.pointerType === 'mouse' ? 'mouse' : 'touch'), { capture: true, passive: true });
window.addEventListener(
  'keydown',
  (e) => {
    if (device.type === 'desktop' && /^(arrow|[wasd]$)/i.test(e.key)) setInput('mouse');
  },
  { capture: true, passive: true },
);
window.addEventListener('resize', () => apply(true));
window.addEventListener('orientationchange', () => apply(true));

// Short vibration on phones that support it (Android); ignored elsewhere.
export function haptic(ms = 8) {
  if (device.touch) {
    try {
      navigator.vibrate?.(ms);
    } catch {}
  }
}
