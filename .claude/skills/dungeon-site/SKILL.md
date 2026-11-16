---
name: dungeon-site
description: How the vkeq 3D pixel dungeon website is built and how to change it safely - adding rooms, props, interactables, content, and taking verification screenshots. Use before editing anything under src/ in this repo.
---

# vkeq dungeon site

Vite + Three.js, no framework. Low-res render (canvas at 1/2-1/4 size, `image-rendering: pixelated`) gives the pixel look.

## Files
- `src/content.json` – ALL user content (bio, stats, equity array, payouts, socials). Text fields are `{ "en": ..., "it": ... }`.
  Edited by the owner through `/admin.html` (`src/admin.js`): Preview stores a draft in localStorage and opens `/?draft=1`;
  Save (dev only) POSTs to the `/__admin/save` middleware in `vite.config.js`; Publish commits the file through the GitHub contents API.
- Admin login on the static site: `src/adminkey.js`. The GitHub token is committed only encrypted with the admin password
  (`public/admin-key.json`, PBKDF2 600k + AES-GCM). The lock button (bottom right, `showAdminLogin` in ui.js) decrypts it,
  puts it in sessionStorage and opens admin.html. Never commit a key file made with a test password.
- Hosting: GitHub Pages via `.github/workflows/deploy.yml` on every push to `main`; domain `vkeq.trade` from `public/CNAME`
  (base path `/`; without CNAME the build uses `/<repo>/`). Pushes to `main` are authorised by the owner.
- `src/config.js` – loads content (or the draft), money/month formatting, `auto:payouts` / `auto:payoutsTotal` stat values.
- `src/i18n.js` – UI strings (`t('key')`), content picker `tr(field)`, `setLang`/`onLangChange`. English default, Italian alternative.
  Every visible string must exist in BOTH `en` and `it`; panels re-render on language change via `panel()` in ui.js.
- `src/map.js` – tile grid. `ROOMS` / `CORRIDORS` rectangles (x = column, z = row, cell (x,z) centred at world (x,0,z)). Walls are generated around floor. `findPath` = 8-dir BFS.
- `src/world.js` – floors/walls (InstancedMesh), torches (auto-placed on north walls, skips `world.reserve(x,z)` cells), dust + embers.
  Walls with floor directly north are drawn LOW (cut-away) so they never hide the player – keep that rule.
- `src/props.js` – builds the shared `ctx` and calls one module per room in `src/rooms/` (entrance, library, treasury, portals).
  `src/rooms/decor.js` has reusable voxel props (barrel, crate, rug, coin pile, gold bars, crystal cluster, candles, sparkles).
  Register interactables with `ctx.item({ id, x, z, radius, prompt: () => T('prompts.x'), hitBox: [x,y,z,w,h,d], sound: 'sfxName', action })`.
  Call `ctx.solid(x,z)` for cells a prop occupies (half coordinates block both neighbours); `world.reserve(x,z)` for wall cells it covers.
- `src/facts.js` – market anecdotes (EN/IT) by category; objects open them with `actions.fact('gold' | 'oil' | 'futures' | 'books' | 'trading')`.
- `src/logos.js` – pixel maps of social logos → floating voxel logos and panel icons (`icon` field of a social).
- `src/vision.js` – limited view radius around the player: patches the fog chunk of every material (`applyVision(scene)` after building,
  `visionMaterial(m)` for materials created later, `visionGLSL` for custom ShaderMaterials). Radius: `vision.near/far`.
- `src/audio.js` – everything synthesised: cave ambience (pads, drone, drips, wind), per-room / per-object sfx with stone reverb + echo,
  footsteps by surface, torch crackle and portal hum by distance. Add a sound by adding a function to `sfx`.
  `radius` must be reachable: some free cell centre must be closer than `radius - 0.15`, or click-to-walk fails.
- `src/ui.js` – HTML panels (`openPanel`), HUD, minimap, pixel equity chart. `src/voxel.js` – `box()`, `glow()`, `voxelText()`, `label()` (HTML labels anchored to 3D objects).
- `src/device.js` – device detection: sets `<html data-device="phone|tablet|desktop" data-input="touch|mouse" data-orient>`
  (UA + pointer/hover media + screen short side; `?device=phone` forces one). Input switches live on hybrids.
  All device layouts are CSS rules on those attributes at the end of `style.css`; JS reads `device.touch/phone/tablet`.
  Never use `matchMedia('(pointer: coarse)')` directly in game code — use `device`.
- `src/joystick.js` – on-screen joystick (`#stick`, touch input only), read in the main loop; full push = run.
  The floating `#prompt` is clickable (interacts with the nearest object); it shows `A` on touch, `E` with a keyboard.
  Phone portrait panels are bottom sheets (drag the header down to close, `initSheetSwipe` in ui.js).
- Camera: follows the player directly and snaps to one render pixel (no easing) so the low-res image never swims.
- `src/player.js` – voxel trader built with `VoxelPart` (per-voxel shading) + walk animation.
- Decor: `VoxBatch` (voxel.js) merges many boxes into one InstancedMesh; rugs/barrels/crystals in props.js, wall/floor detail in `world.decorate()`. `src/audio.js` – WebAudio chiptune sfx.

## Adding a room
1. Add a rect to `ROOMS` (with `floor` texture key from `textures.js` and minimap `color`) and a `CORRIDORS` rect joining it; enlarge `W`/`H` if needed.
2. Add props + interactables in `props.js`, a panel function in `ui.js`, wire it through `actions` in `main.js`, optionally a `showMenu` button.

## Lighting budget
Each PointLight costs every fragment. Keep total lit lights around 15 (side torches are unlit on purpose).

## Verify visually
Start `npm run dev -- --port 5173`, then use Playwright (pre-installed) with
`chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] })`.
Press Enter to leave the intro; `window.__dungeon.teleport(x, z)` jumps the player, `window.__dungeon.goTo(id)` walks to an interactable.
Check desktop 1280x800, a phone in portrait AND landscape, and a tablet: use Playwright `devices['iPhone 13']`,
`devices['iPhone 13 landscape']`, `devices['iPad (gen 7)']` so `isMobile`/`hasTouch`/UA are emulated and device.js
picks the right layout (portrait uses a different camera). Touch drags on the joystick need CDP `Input.dispatchTouchEvent`.

## Typography
Press Start 2P only at 8/16/24/32/64 px (otherwise it blurs). Body text uses Pixelify Sans.

## Live preview on claude.ai
`npm run build:single` writes `dist-single/vkeq-dungeon.html` (one self-contained page: inlined JS/CSS, only Google Fonts external).
Publish that file with the Artifact tool to show the owner the site inside Claude; republish the same path to update it.
The admin page is not part of that build (it needs the dev server or GitHub).

## README images
`README.md` shows `docs/readme/*.png` (banner 3840x1280, map ~3900x2800, highlights 3840x2160).
Regenerate with the dev server running: `npm run readme:images` (or `node scripts/readme/map.cjs`, `node scripts/readme/shots.cjs docs/readme <prefix>`).
The map is drawn by `scripts/readme/map-draw.js` from the real grid + torch positions; prop positions there are copied
from `src/rooms/*.js`, so update both when moving props. Shots use `window.__dungeon.photo({...})` (fixed camera, no UI).
Development / admin / hosting notes moved to `docs/DEVELOPMENT.md`. README text must not assume vkeq's pronouns.
