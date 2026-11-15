---
name: dungeon-site
description: How the vkeq 3D pixel dungeon website is built and how to change it safely - adding rooms, props, interactables, content, and taking verification screenshots. Use before editing anything under src/ in this repo.
---

# vkeq dungeon site

Vite + Three.js, no framework. Low-res render (canvas at 1/2-1/4 size, `image-rendering: pixelated`) gives the pixel look.

## Files
- `src/config.js` – ALL user content (bio, stats, equity array, payouts, socials). Change content here only.
- `src/map.js` – tile grid. `ROOMS` / `CORRIDORS` rectangles (x = column, z = row, cell (x,z) centred at world (x,0,z)). Walls are generated around floor. `findPath` = 8-dir BFS.
- `src/world.js` – floors/walls (InstancedMesh), torches (auto-placed on north walls, skips `world.reserve(x,z)` cells), dust + embers.
  Walls with floor directly north are drawn LOW (cut-away) so they never hide the player – keep that rule.
- `src/props.js` – every prop and interactable, grouped by room. An interactable is `{ id, x, z, radius, prompt, hit, action }`.
  Call `grid.block(x,z)` (via `solid`) for cells a prop occupies; `world.reserve(x,z)` for wall cells it covers.
  `radius` must be reachable: some free cell centre must be closer than `radius - 0.15`, or click-to-walk fails.
- `src/ui.js` – HTML panels (`openPanel`), HUD, minimap, pixel equity chart. `src/voxel.js` – `box()`, `glow()`, `voxelText()`, `label()` (HTML labels anchored to 3D objects).
- `src/player.js` – voxel trader model + walk animation. `src/audio.js` – WebAudio chiptune sfx.

## Adding a room
1. Add a rect to `ROOMS` (with `floor` texture key from `textures.js` and minimap `color`) and a `CORRIDORS` rect joining it; enlarge `W`/`H` if needed.
2. Add props + interactables in `props.js`, a panel function in `ui.js`, wire it through `actions` in `main.js`, optionally a `showMenu` button.

## Lighting budget
Each PointLight costs every fragment. Keep total lit lights around 15 (side torches are unlit on purpose).

## Verify visually
Start `npm run dev -- --port 5173`, then use Playwright (pre-installed) with
`chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] })`.
Press Enter to leave the intro; `window.__dungeon.teleport(x, z)` jumps the player, `window.__dungeon.goTo(id)` walks to an interactable.
Check both 1280x800 and 390x844 (portrait uses a different camera).
