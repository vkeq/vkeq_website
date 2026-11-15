import * as THREE from 'three';
import './style.css';
import { buildGrid, findPath, SPAWN } from './map.js';
import { makeTextures } from './textures.js';
import { buildWorld } from './world.js';
import { buildProps } from './props.js';
import { createPlayer } from './player.js';
import { initAudio, sfx, ambient, toggleMusic, toggleSfx, audioPrefs } from './audio.js';
import * as UI from './ui.js';
import { labels } from './voxel.js';
import { t, onLangChange } from './i18n.js';
import { IS_DRAFT } from './config.js';
import { applyVision, updateVision, vision } from './vision.js';

const $ = (s) => document.querySelector(s);

const WALK_SPEED = 4.2;
const RUN_SPEED = 5.6;
const CAM_OFFSET = new THREE.Vector3(0, 12.5, 10.2);
const CAM_PITCH_SIN = CAM_OFFSET.y / CAM_OFFSET.length();
const PORTAL_POS = { x: 33.5, z: 15.5 };
// which sound a category of anecdotes makes when you ask for "another one"
const FACT_SOUND = { oil: 'barrel', futures: 'crate', gold: 'gold', books: 'shelf', trading: 'pc' };
const FLOOR_SOUND = { entrance: 'stone', bio: 'wood', treasury: 'gold', social: 'crystal' };

async function boot() {
  // Pixel font must be ready before we rasterise the voxel title and canvas text.
  try {
    await Promise.race([
      Promise.all([document.fonts.load('8px "Press Start 2P"'), document.fonts.load('600 16px "Pixelify Sans"')]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {}

  // ---------------- Renderer ----------------
  const canvas = $('#game');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b0814');

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  let zoom = 1;
  let userZoom = 1;
  let renderHeight = 1;

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pixelScale = w < 700 ? 2 : w > 1800 ? 4 : 3;
    renderHeight = Math.ceil(h / pixelScale);
    renderer.setSize(Math.ceil(w / pixelScale), renderHeight, false);
    camera.aspect = w / h;
    // portrait screens: wider lens + camera pulled back so the room still fits
    const portrait = camera.aspect < 1;
    camera.fov = portrait ? 50 : 38;
    zoom = portrait ? 0.75 / Math.max(0.5, camera.aspect) : 1;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  scene.add(new THREE.AmbientLight('#7a72b8', 1.4));
  scene.add(new THREE.HemisphereLight('#8a80c8', '#1a1020', 0.6));

  // ---------------- World ----------------
  const grid = buildGrid();
  const world = buildWorld(scene, grid, makeTextures());

  const player = createPlayer();
  player.root.scale.setScalar(1.12);
  scene.add(player.root);
  // warm lantern that follows the player so every corner stays readable
  const lantern = new THREE.PointLight('#ffd9a0', 7, 7, 1.4);
  lantern.position.set(0, 1.8, 0.4);
  player.root.add(lantern);
  const pos = new THREE.Vector3(SPAWN.x, 0, SPAWN.z);
  player.root.position.copy(pos);

  const actions = {
    welcome: UI.showWelcome,
    bio: UI.showBio,
    performance: UI.showPerformance,
    social: UI.showSocial,
    allSocials: UI.showAllSocials,
    fact: (cat) => UI.showFact(cat, undefined, () => sfx[FACT_SOUND[cat]]?.()),
  };
  const props = buildProps(scene, grid, world, actions);
  world.placeTorches();
  const items = props.items;

  // Click marker
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.3, 4),
    new THREE.MeshBasicMaterial({ color: '#ffe9a8', transparent: true, opacity: 0.9, depthWrite: false }),
  );
  marker.rotation.x = -Math.PI / 2;
  marker.rotation.z = Math.PI / 4;
  marker.visible = false;
  scene.add(marker);

  // Limited vision around the player (patches every material in the scene)
  applyVision(scene);

  UI.initPanel();
  UI.initHUD();
  UI.initLangSwitch();
  $('#draft-badge').hidden = !IS_DRAFT;
  const minimap = UI.createMinimap(grid, items);

  // ---------------- World labels (HTML, anchored to 3D objects) ----------------
  const labelLayer = document.createElement('div');
  labelLayer.id = 'labels';
  document.body.appendChild(labelLayer);
  const labelEls = labels.map((o) => {
    const d = document.createElement('div');
    d.className = 'wlabel';
    d.style.color = o.userData.label.color;
    labelLayer.appendChild(d);
    return d;
  });
  const labelTexts = () =>
    labels.forEach((o, i) => {
      const l = o.userData.label;
      labelEls[i].textContent = l.key ? t(l.key) : l.text;
    });
  labelTexts();
  onLangChange(labelTexts);
  const lv = new THREE.Vector3();
  function updateLabels() {
    labelLayer.hidden = !started;
    if (!started) return;
    const far = vision.far.value;
    labels.forEach((o, i) => {
      const el = labelEls[i];
      o.getWorldPosition(lv);
      const dist = Math.hypot(lv.x - pos.x, lv.z - pos.z);
      lv.project(camera);
      // labels follow the same light radius as the world
      let a = THREE.MathUtils.clamp((far - dist) / 1.5, 0, 1);
      // the "press E" prompt replaces the label of the object you are standing at
      if (nearest && !UI.isPanelOpen() && Math.hypot(lv.x - nearest.x, lv.z - nearest.z) < 1.3) a = 0;
      if (lv.z > 1 || a <= 0) {
        el.style.opacity = 0;
        return;
      }
      el.style.opacity = a;
      el.style.transform = `translate(${Math.round((lv.x * 0.5 + 0.5) * window.innerWidth)}px, ${Math.round((-lv.y * 0.5 + 0.5) * window.innerHeight)}px) translate(-50%, -50%)`;
    });
  }

  // ---------------- Movement helpers ----------------
  const R = 0.27;
  const collides = (x, z) =>
    grid.isBlocked(Math.round(x - R), Math.round(z - R)) ||
    grid.isBlocked(Math.round(x + R), Math.round(z - R)) ||
    grid.isBlocked(Math.round(x - R), Math.round(z + R)) ||
    grid.isBlocked(Math.round(x + R), Math.round(z + R));

  function lineClear(ax, az, bx, bz) {
    const n = Math.ceil(Math.hypot(bx - ax, bz - az) * 4);
    for (let i = 0; i <= n; i++) if (collides(ax + ((bx - ax) * i) / n, az + ((bz - az) * i) / n)) return false;
    return true;
  }
  // Line-of-sight smoothing of a grid path (string pulling)
  function smooth(route) {
    const out = [];
    let i = 0;
    let from = { x: pos.x, z: pos.z };
    while (i < route.length - 1) {
      let j = route.length - 1;
      while (j > i + 1 && !lineClear(from.x, from.z, route[j].x, route[j].z)) j--;
      out.push({ ...route[j] });
      from = route[j];
      i = j;
    }
    if (!out.length) out.push({ ...route[route.length - 1] });
    return out;
  }

  let path = null;
  let pendingItem = null;
  function showMarker(x, z) {
    marker.position.set(x, 0.03, z);
    marker.visible = true;
    marker.userData.t = 0;
  }
  function stopPath() {
    path = null;
    pendingItem = null;
    marker.visible = false;
  }
  function goToItem(it) {
    const route = findPath(grid, Math.round(pos.x), Math.round(pos.z), (x, z) => Math.hypot(x - it.x, z - it.z) < it.radius - 0.15);
    if (!route) return;
    path = smooth(route);
    pendingItem = it;
    const last = path[path.length - 1];
    showMarker(last.x, last.z);
    if (route.length <= 1) arrive();
  }
  function goTo(id) {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    if (Math.hypot(pos.x - it.x, pos.z - it.z) < it.radius) interact(it);
    else goToItem(it);
  }
  function playItemSound(it) {
    const s = typeof it.sound === 'function' ? it.sound() : [it.sound];
    if (s && s[0]) sfx[s[0]]?.(s[1]);
  }
  function interact(it) {
    initAudio();
    keys.clear();
    stopPath();
    playItemSound(it);
    it.action();
  }
  function arrive() {
    const it = pendingItem;
    stopPath();
    if (it) interact(it);
  }

  // ---------------- Input ----------------
  const keys = new Set();
  let started = false;
  const isTouch = matchMedia('(pointer: coarse)').matches;

  window.addEventListener('keydown', (e) => {
    if (!started) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        start();
      }
      return;
    }
    if (UI.isPanelOpen()) return;
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (k === 'e' || k === ' ' || k === 'enter') {
      if (nearest) interact(nearest);
      return;
    }
    if (k === 'm') {
      UI.showMenu(goTo);
      return;
    }
    keys.add(k);
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) stopPath();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  canvas.addEventListener('pointerdown', (e) => {
    if (!started) {
      start();
      return;
    }
    if (UI.isPanelOpen()) return;
    initAudio();
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    // clicked an interactable (only if it is inside the lit area)?
    const hits = raycaster.intersectObjects(items.map((i) => i.hit), true);
    for (const h of hits) {
      const it = items.find((i) => {
        for (let o = h.object; o; o = o.parent) if (o === i.hit) return true;
        return false;
      });
      if (it && Math.hypot(it.x - pos.x, it.z - pos.z) < vision.far.value + 1) {
        goToItem(it);
        return;
      }
    }
    const p = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(floorPlane, p)) return;
    const cx = Math.round(p.x);
    const cz = Math.round(p.z);
    if (grid.isBlocked(cx, cz)) return;
    const route = findPath(grid, Math.round(pos.x), Math.round(pos.z), (x, z) => x === cx && z === cz);
    if (route) {
      path = smooth(route);
      path[path.length - 1] = { x: p.x, z: p.z };
      pendingItem = null;
      showMarker(p.x, p.z);
    }
  });
  canvas.addEventListener('wheel', (e) => (userZoom = THREE.MathUtils.clamp(userZoom + Math.sign(e.deltaY) * 0.1, 0.7, 1.4)), { passive: true });

  // ---------------- HUD buttons ----------------
  const btnAction = $('#btn-action');
  btnAction.addEventListener('click', () => nearest && interact(nearest));
  $('#btn-menu').addEventListener('click', () => {
    sfx.ui();
    UI.showMenu(goTo);
  });
  const btnMusic = $('#btn-music');
  const btnSfx = $('#btn-sfx');
  btnMusic.classList.toggle('off', !audioPrefs().music);
  btnSfx.classList.toggle('off', !audioPrefs().sfx);
  btnMusic.addEventListener('click', () => {
    initAudio();
    btnMusic.classList.toggle('off', !toggleMusic());
  });
  btnSfx.addEventListener('click', () => {
    initAudio();
    btnSfx.classList.toggle('off', !toggleSfx());
    sfx.ui();
  });

  // ---------------- Intro ----------------
  const introText = () => {
    $('#intro-sub').textContent = t('introSub');
    $('#start-text').textContent = '▶ ' + t(isTouch ? 'introStartTouch' : 'introStart');
    $('#intro-hint').textContent = t(isTouch ? 'introHintTouch' : 'introHint');
  };
  introText();
  onLangChange(introText);

  function start() {
    if (started) return;
    started = true;
    initAudio();
    sfx.room('entrance');
    $('#intro').classList.add('gone');
    $('#hud').hidden = false;
    UI.roomToast('entrance');
    minimap.revealRoom('entrance');
    // open the notice board right away so visitors learn how to play
    setTimeout(() => {
      if (!UI.isPanelOpen()) {
        sfx.board();
        UI.showWelcome();
      }
    }, 700);
  }
  $('#start').addEventListener('click', (e) => {
    e.stopPropagation();
    start();
  });
  $('#intro').addEventListener('pointerdown', start);
  $('#start').focus();

  // ---------------- Loop ----------------
  let nearest = null;
  let currentRoom = 'entrance';
  const camTarget = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const timer = new THREE.Timer();
  let stepAcc = 0;
  let stuckFrames = 0;

  function surfaceAt(x, z) {
    const cx = Math.round(x);
    const cz = Math.round(z);
    if (props.rugCells.has(`${cx},${cz}`)) return 'rug';
    return FLOOR_SOUND[grid.roomAt(cx, cz)] || 'stone';
  }

  function frame() {
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05);
    const time = timer.getElapsed();

    // ---- movement (keyboard has priority over click-to-walk) ----
    let mx = 0;
    let mz = 0;
    if (started && !UI.isPanelOpen()) {
      if (keys.has('w') || keys.has('arrowup')) mz -= 1;
      if (keys.has('s') || keys.has('arrowdown')) mz += 1;
      if (keys.has('a') || keys.has('arrowleft')) mx -= 1;
      if (keys.has('d') || keys.has('arrowright')) mx += 1;
      if (!mx && !mz && path) {
        const wp = path[0];
        const dx = wp.x - pos.x;
        const dz = wp.z - pos.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.12) {
          path.shift();
          if (!path.length) arrive();
        } else {
          mx = dx / d;
          mz = dz / d;
        }
      }
    }
    let speed = 0;
    if (mx || mz) {
      const len = Math.hypot(mx, mz);
      mx /= len;
      mz /= len;
      speed = keys.has('shift') ? RUN_SPEED : WALK_SPEED;
      const ox = pos.x;
      const oz = pos.z;
      const nx = pos.x + mx * speed * dt;
      const nz = pos.z + mz * speed * dt;
      if (!collides(nx, pos.z)) pos.x = nx;
      if (!collides(pos.x, nz)) pos.z = nz;
      // stuck while following a path → give up
      if (path && dt > 0 && pos.x === ox && pos.z === oz) {
        if (++stuckFrames > 12) stopPath();
      } else stuckFrames = 0;
      stepAcc += dt * speed;
      if (stepAcc > 1.15) {
        stepAcc = 0;
        sfx.step(surfaceAt(pos.x, pos.z));
      }
    }
    player.root.position.copy(pos);
    player.animate(dt, speed, mx, mz, time);

    // ---- rooms ----
    const rid = grid.roomAt(Math.round(pos.x), Math.round(pos.z));
    if (rid && rid !== currentRoom) {
      currentRoom = rid;
      UI.roomToast(rid);
      minimap.revealRoom(rid);
      sfx.room(rid);
    }
    minimap.reveal(Math.round(pos.x), Math.round(pos.z), 4);

    // ---- nearest interactable + prompt ----
    let best = null;
    let bestD = Infinity;
    for (const it of items) {
      const d = Math.hypot(pos.x - it.x, pos.z - it.z);
      if (d < it.radius && d < bestD) {
        best = it;
        bestD = d;
      }
    }
    if (best !== nearest) {
      nearest = best;
      if (nearest && started) sfx.near();
    }
    if (started && nearest && !UI.isPanelOpen()) {
      tmp.set(nearest.x, 2.1, nearest.z).project(camera);
      const text = typeof nearest.prompt === 'function' ? nearest.prompt() : nearest.prompt;
      UI.setPrompt(text, { x: (tmp.x * 0.5 + 0.5) * window.innerWidth, y: (-tmp.y * 0.5 + 0.5) * window.innerHeight }, isTouch);
      btnAction.hidden = !isTouch;
    } else {
      UI.setPrompt(null);
      btnAction.hidden = true;
    }

    // ---- camera ----
    // Follows the player directly (no easing) and snaps to the size of one screen pixel,
    // so the low-res image never "swims" or keeps settling after the player stops.
    const dist = CAM_OFFSET.length() * zoom * userZoom;
    const px = (2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / renderHeight;
    if (started) {
      camTarget.set(Math.round(pos.x / px) * px, 0.6, Math.round((pos.z - 0.6) / (px / CAM_PITCH_SIN)) * (px / CAM_PITCH_SIN));
      camera.position.copy(camTarget).addScaledVector(CAM_OFFSET, zoom * userZoom);
    } else {
      // slow cinematic drift during the intro
      camTarget.set(SPAWN.x + Math.sin(time * 0.15) * 2, 0.6, SPAWN.z - 4 + Math.cos(time * 0.12) * 1.5);
      camera.position.copy(camTarget).add(tmp.set(Math.sin(time * 0.1) * 4, 12, 10));
    }
    camera.lookAt(camTarget);
    camera.updateMatrixWorld();
    updateVision(camera, started ? pos : camTarget);

    if (marker.visible) {
      marker.userData.t += dt;
      marker.scale.setScalar(1 + Math.sin(marker.userData.t * 10) * 0.15);
    }

    // ---- ambience: torch crackle + portal hum by distance ----
    if (started) {
      let td = Infinity;
      for (const tc of world.torches) td = Math.min(td, Math.hypot(tc.pos.x - pos.x, tc.pos.z - pos.z));
      ambient(dt, td, Math.hypot(PORTAL_POS.x - pos.x, PORTAL_POS.z - pos.z));
    }

    world.update(time, dt);
    props.update(time, dt);
    if (started) minimap.draw(pos.x, pos.z, time);
    updateLabels();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();

  // Debug / automated screenshot hooks
  window.__dungeon = {
    pos,
    goTo,
    start,
    items,
    teleport(x, z) {
      pos.set(x, 0, z);
      stopPath();
    },
  };
}

boot();
