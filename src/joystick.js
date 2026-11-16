// On-screen pixel joystick for touch devices (bottom left).
// read() returns { x, y, mag } in screen space: x right, y down, mag 0..1 (0 when idle or inside the dead zone).
const DEAD = 0.18;

export function createJoystick(el, { onStart } = {}) {
  const knob = el.querySelector('.stick-knob');
  let id = null;
  let cx = 0;
  let cy = 0;
  let radius = 1;
  const out = { x: 0, y: 0, mag: 0 };

  function place(e) {
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > radius) {
      dx = (dx / d) * radius;
      dy = (dy / d) * radius;
    }
    // knob moves in whole CSS pixels in steps of 2 so it stays crisp
    knob.style.transform = `translate(${Math.round(dx / 2) * 2}px, ${Math.round(dy / 2) * 2}px)`;
    const m = Math.min(1, d / radius);
    if (m < DEAD) {
      out.x = out.y = out.mag = 0;
    } else {
      out.x = dx / (Math.hypot(dx, dy) || 1);
      out.y = dy / (Math.hypot(dx, dy) || 1);
      out.mag = (m - DEAD) / (1 - DEAD);
    }
  }

  function release() {
    id = null;
    out.x = out.y = out.mag = 0;
    knob.style.transform = '';
    el.classList.remove('active');
  }

  el.addEventListener('pointerdown', (e) => {
    if (id !== null) return;
    e.preventDefault();
    e.stopPropagation();
    id = e.pointerId;
    el.setPointerCapture?.(id);
    const r = el.getBoundingClientRect();
    cx = r.left + r.width / 2;
    cy = r.top + r.height / 2;
    radius = r.width * 0.36;
    el.classList.add('active');
    onStart?.();
    place(e);
  });
  el.addEventListener('pointermove', (e) => {
    if (e.pointerId === id) place(e);
  });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    el.addEventListener(ev, (e) => {
      if (e.pointerId === id) release();
    });
  }
  window.addEventListener('blur', release);

  return {
    read: () => out,
    reset: release,
    get active() {
      return id !== null;
    },
  };
}
