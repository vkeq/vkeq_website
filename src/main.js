import * as THREE from 'three';
import './style.css';
import { buildGrid, findPath, SPAWN, roomById } from './map.js';
import { makeTextures } from './textures.js';
import { buildWorld } from './world.js';
import { buildProps } from './props.js';
import { createPlayer } from './player.js';
import { initAudio, sfx, toggleMute, isMuted } from './audio.js';
import * as UI from './ui.js';
import { labels } from './voxel.js';

const $ = (s) => document.querySelector(s);

async function boot() {
  // Pixel font must be ready before we rasterise labels and voxel text.
  try {
    await Promise.race([
      Promise.all([document.fonts.load('8px "Press Start 2P"'), document.fonts.load('20px "VT323"')]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {}

  // ---------------- Renderer ----------------
  const canvas = $('#game');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b0814');
  scene.fog = new THREE.Fog('#0b0814', 14, 30);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  const CAM_OFFSET = new THREE.Vector3(0, 12.5, 10.2);
  let zoom = 1;

  let pixelScale = 3;
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    pixelScale = w < 700 ? 2 : w > 1800 ? 4 : 3;
    renderer.setSize(Math.ceil(w / pixelScale), Math.ceil(h / pixelScale), false);
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
  const tex = makeTextures();
  const world = buildWorld(scene, grid, tex);

  const player = createPlayer();
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
    equity: UI.showEquity,
    social: UI.showSocial,
    allSocials: () => {
      sfx.portal();
      UI.showAllSocials();
    },
  };
  const props = buildProps(scene, grid, world, actions);
  world.placeTorches();
  const items = props.items;

  UI.initPanel();
  UI.initHUD();
  const minimap = UI.createMinimap(grid, items);

  // HTML labels anchored to 3D objects (crisp text instead of blurry sprites)
  const labelLayer = document.createElement('div');
  labelLayer.id = 'labels';
  document.body.appendChild(labelLayer);
  const labelEls = labels.map((o) => {
    const d = document.createElement('div');
    d.className = 'wlabel';
    d.textContent = o.userData.label.text;
    d.style.color = o.userData.label.color;
    labelLayer.appendChild(d);
    return d;
  });
  const lv = new THREE.Vector3();
  function updateLabels() {
    labelLayer.hidden = !started;
    if (!started) return;
    labels.forEach((o, i) => {
      const el = labelEls[i];
      o.getWorldPosition(lv);
      const dist = Math.hypot(lv.x - pos.x, lv.z - pos.z);
      lv.project(camera);
      const a = THREE.MathUtils.clamp((11 - dist) / 3, 0, 1);
      if (lv.z > 1 || a <= 0) {
        el.style.opacity = 0;
        return;
      }
      el.style.opacity = a;
      el.style.transform = `translate(${Math.round((lv.x * 0.5 + 0.5) * window.innerWidth)}px, ${Math.round((-lv.y * 0.5 + 0.5) * window.innerHeight)}px) translate(-50%, -50%)`;
    });
  }

  // Click marker
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.3, 4),
    new THREE.MeshBasicMaterial({ color: '#ffe9a8', transparent: true, opacity: 0.9, depthWrite: false }),
  );
  marker.rotation.x = -Math.PI / 2;
  marker.rotation.z = Math.PI / 4;
  marker.visible = false;
  scene.add(marker);

  // ---------------- Input ----------------
  const keys = new Set();
  let started = false;
  let path = null;
  let pendingItem = null;

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
    path = null;
    pendingItem = null;
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
    // clicked an interactable?
    const hits = raycaster.intersectObjects(items.map((i) => i.hit), true);
    if (hits.length) {
      const it = items.find((i) => {
        let o = hits[0].object;
        while (o) {
          if (o === i.hit) return true;
          o = o.parent;
        }
        return false;
      });
      if (it) {
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

  canvas.addEventListener('wheel', (e) => {
    userZoom = THREE.MathUtils.clamp(userZoom + Math.sign(e.deltaY) * 0.1, 0.7, 1.5);
  }, { passive: true });
  let userZoom = 1;

  function showMarker(x, z) {
    marker.position.set(x, 0.03, z);
    marker.visible = true;
    marker.userData.t = 0;
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

  // Line-of-sight path smoothing (string pulling on the grid)
  function clear(ax, az, bx, bz) {
    const d = Math.hypot(bx - ax, bz - az);
    const n = Math.ceil(d * 4);
    for (let i = 0; i <= n; i++) {
      const x = ax + ((bx - ax) * i) / n;
      const z = az + ((bz - az) * i) / n;
      if (collides(x, z)) return false;
    }
    return true;
  }
  function smooth(route) {
    const out = [];
    let i = 0;
    let from = { x: pos.x, z: pos.z };
    while (i < route.length - 1) {
      let j = route.length - 1;
      while (j > i + 1 && !clear(from.x, from.z, route[j].x, route[j].z)) j--;
      out.push(route[j]);
      from = route[j];
      i = j;
    }
    if (!out.length) out.push(route[route.length - 1]);
    return out.map((p) => ({ ...p }));
  }

  const R = 0.27;
  function collides(x, z) {
    return (
      grid.isBlocked(Math.round(x - R), Math.round(z - R)) ||
      grid.isBlocked(Math.round(x + R), Math.round(z - R)) ||
      grid.isBlocked(Math.round(x - R), Math.round(z + R)) ||
      grid.isBlocked(Math.round(x + R), Math.round(z + R))
    );
  }

  // ---------------- Mobile action button ----------------
  const isTouch = matchMedia('(pointer: coarse)').matches;
  const btnAction = $('#btn-action');
  if (isTouch) {
    $('#start').innerHTML = '&#9654; TOCCA PER ENTRARE';
    $('.intro-hint').textContent = 'Tocca il pavimento per muoverti · tocca gli oggetti per interagire';
  }
  btnAction.addEventListener('click', () => nearest && interact(nearest));

  $('#btn-menu').addEventListener('click', () => UI.showMenu(goTo));
  const btnMute = $('#btn-mute');
  btnMute.classList.toggle('off', isMuted());
  btnMute.addEventListener('click', () => {
    btnMute.classList.toggle('off', toggleMute());
    sfx.blip();
  });

  function interact(it) {
    initAudio();
    keys.clear();
    path = null;
    pendingItem = null;
    it.action();
  }
  function arrive() {
    const it = pendingItem;
    pendingItem = null;
    path = null;
    if (it) interact(it);
  }

  // ---------------- Intro ----------------
  function start() {
    if (started) return;
    started = true;
    initAudio();
    sfx.room();
    $('#intro').classList.add('gone');
    $('#hud').hidden = false;
    UI.roomToast(roomById('entrance').name);
    minimap.revealRoom('entrance');
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
  const camPos = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const timer = new THREE.Timer();
  let stepAcc = 0;
  let stuckFrames = 0;

  camTarget.copy(pos);
  camPos.copy(pos).add(CAM_OFFSET);

  function frame() {
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05);
    const t = timer.getElapsed();

    // movement
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
          if (!path.length) {
            path = null;
            marker.visible = false;
            arrive();
          }
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
      speed = keys.has('shift') ? 6.5 : 4.2;
      const nx = pos.x + mx * speed * dt;
      const nz = pos.z + mz * speed * dt;
      const ox = pos.x;
      const oz = pos.z;
      if (!collides(nx, pos.z)) pos.x = nx;
      if (!collides(pos.x, nz)) pos.z = nz;
      // stuck while following a path → give up
      if (path && dt > 0 && pos.x === ox && pos.z === oz) {
        if (++stuckFrames > 12) {
          path = null;
          marker.visible = false;
        }
      } else stuckFrames = 0;
      stepAcc += dt * speed;
      if (stepAcc > 1.1) {
        stepAcc = 0;
        sfx.step();
      }
    }
    player.root.position.copy(pos);
    player.animate(dt, speed, mx, mz, t);

    // room detection
    const rid = grid.roomAt(Math.round(pos.x), Math.round(pos.z));
    if (rid && rid !== currentRoom) {
      currentRoom = rid;
      UI.roomToast(roomById(rid).name);
      minimap.revealRoom(rid);
      sfx.room();
    }
    minimap.reveal(Math.round(pos.x), Math.round(pos.z), 4);

    // nearest interactable
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
      if (nearest && started) sfx.blip();
    }
    if (started && nearest && !UI.isPanelOpen()) {
      tmp.set(nearest.x, 2.1, nearest.z).project(camera);
      UI.setPrompt(nearest.prompt, { x: (tmp.x * 0.5 + 0.5) * window.innerWidth, y: (-tmp.y * 0.5 + 0.5) * window.innerHeight });
      btnAction.hidden = !isTouch;
    } else {
      UI.setPrompt(null);
      btnAction.hidden = true;
    }

    // camera
    if (started) {
      camTarget.lerp(tmp.set(pos.x, 0.6, pos.z - 0.6), Math.min(1, dt * 5));
      camPos.copy(camTarget).addScaledVector(CAM_OFFSET, zoom * userZoom);
    } else {
      // slow cinematic drift during the intro
      camTarget.set(SPAWN.x + Math.sin(t * 0.15) * 2, 0.6, SPAWN.z - 4 + Math.cos(t * 0.12) * 1.5);
      camPos.copy(camTarget).add(tmp.set(Math.sin(t * 0.1) * 4, 12, 10));
    }
    camera.position.copy(camPos);
    scene.fog.near = 14 * zoom * userZoom;
    scene.fog.far = 30 * zoom * userZoom;
    camera.lookAt(camTarget);

    if (marker.visible) {
      marker.userData.t += dt;
      const s = 1 + Math.sin(marker.userData.t * 10) * 0.15;
      marker.scale.set(s, s, s);
    }

    world.update(t, dt);
    props.update(t, dt);
    if (started) minimap.draw(pos.x, pos.z, t);
    updateLabels();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();

  // expose for debugging / automated screenshots
  window.__dungeon = {
    pos,
    goTo,
    start,
    items,
    teleport(x, z) {
      pos.set(x, 0, z);
      path = null;
      pendingItem = null;
      marker.visible = false;
    },
  };
}

boot();
