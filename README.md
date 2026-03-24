# Veilmarch

Low-poly over-the-shoulder RPG prototype built with **Vite + React 18 + TypeScript + Three.js + Zustand**.

> **Phase 100 — Release Candidate Stabilization** has been applied to this repository.  
> Build label: **RC-1**.  All 100 development phases are complete.

---

## Quick Start

```bash
npm install
npm run dev
```

Open <http://localhost:5173> in a browser. No environment variables are required; see `.env.example` for future extension points.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server with hot-reload |
| `npm run build` | Type-check (`tsc -b`) then produce a production bundle |
| `npm run preview` | Serve the production bundle locally |
| `npm run lint` | Run ESLint across the source tree |

---

## Mobile Testing

The game is designed to run in a mobile browser (PWA-ready). To test:

1. Run `npm run dev` and note the local network URL printed to the terminal (e.g. `http://192.168.x.x:5173`).
2. Open that URL on your phone (same Wi-Fi network).
3. Chrome DevTools → **Toggle device toolbar** (`Ctrl+Shift+M`) is a fast alternative for viewport simulation.

### Test matrix (minimum)
- Desktop browser (Chromium or Firefox)
- iPhone-sized portrait viewport (≈ 390 × 844)
- iPhone-sized landscape viewport (≈ 844 × 390)
- Android-like narrow viewport (≈ 360 × 800)
- Pause / resume (background the tab and return)
- Refresh mid-session (save data should restore)
- Touch controls near screen edges (joystick, interact button)

---

## Controls

### Desktop

| Input | Action |
|---|---|
| W / A / S / D or Arrow keys | Move |
| Right-mouse drag | Orbit camera |
| Scroll wheel | Zoom |
| E | Interact |
| I | Inventory |
| K | Skills |
| B | Shop |
| L | Ledger Hall / Storage |
| Q | Equipment |
| J | Journal |
| F | Smithing (Forging) |
| V | Carving |
| T | Tinkering |
| G | Tailoring |
| W2 | Warding |
| Y | Surveying |
| P | Save / Load panel |
| KeyB | Accessibility settings |
| Left-click creature | Target for combat |

### Mobile (touch)

| Gesture | Action |
|---|---|
| Left-thumb joystick | Move |
| Single-finger drag (right side) | Orbit camera |
| Two-finger pinch | Zoom |
| **E** button | Interact (pulses when a target is in range) |
| 🎒 button | Inventory |
| 📊 button | Skills |

---

## Architecture Notes

### Camera controller (`src/engine/followCamera.ts`)
A standalone orbit-camera module. All tunable constants (`PHI_MIN`, `PHI_MAX`, `RADIUS_MIN`, `RADIUS_MAX`, `TOUCH_ORBIT_SENSITIVITY`, …) are exported at the top of the file. `App.tsx` calls `updateOrbitCamera()` once per frame and `applyOrbitDrag()` / `applyZoom()` from pointer and touch event handlers. Touch orbit uses a separate, lower `TOUCH_ORBIT_SENSITIVITY` to avoid over-rotation on phones.

### Input abstraction
- **Desktop**: keyboard state tracked in a `Set<string>` via `keydown` / `keyup` listeners; mouse orbit via `pointerdown` / `pointermove`; zoom via `wheel`.
- **Mobile**: virtual joystick (`src/ui/hud/MobileControls.tsx`) writes into a shared `joystickRef`; touch orbit/pinch wired directly on the canvas in `App.tsx`.
- `isTouchDevice` (detected once at renderer-setup time) is used to choose interaction-prompt text and to disable antialias on mobile for performance.

### Responsive UI / mobile strategy
- `@media (pointer: coarse), (max-width: 640px)` in `App.css` switches the layout to a full-viewport canvas with a collapsed header.
- Safe-area insets (`env(safe-area-inset-*)`) keep HUD elements and touch controls clear of notches and home indicators.
- The `html` and `body` elements have `overflow: hidden; overscroll-behavior: none; touch-action: none` to block rubber-band scrolling on iOS.
- Pinch-zoom at the browser level is disabled via `user-scalable=no` in the viewport meta tag; pinch-zoom inside the game is handled by the camera's `applyZoom()`.

### Save / load (`src/store/useSaveLoad.ts`)
`useSaveGame()` / `useLoadGame()` persist a versioned JSON snapshot (`veilmarch_save_v1`) to `localStorage`.
- **Schema version:** 2 (incremented in Phase 90; migration runner supports step-by-step upgrades).
- **Storage key:** `veilmarch_save_v1` (name preserved from Phase 50 for backward compatibility with existing player saves; the key name is intentionally decoupled from the schema version number).
- **Saved fields:** `playerStats`, `inventory`, `skills`, `equipment`, `settings`, `vendorStocks`, `factionRep`, `taskState`.
- **Backup key:** every save also writes a backup (`veilmarch_save_backup`) so corruption of the primary can be recovered.
- **Corruption recovery:** if the primary save fails migration, the load path falls back to the backup and notifies the player via a toast.
- Transient state (NPC positions, active gather sessions, combat, opened gated doors) is not saved and rebuilds from defaults on each load.

### LOD / streaming (`src/engine/lod.ts`)
Eight region chunks are managed with a hysteresis-band show/hide (20-unit gap) to avoid thrashing. `updateRegionLOD()` is called once per frame from `App.tsx`.

### Telemetry (`src/engine/telemetry.ts`)
Local-only, in-memory ring-buffer (max 500 events). No data is transmitted externally. `exportTelemetry()` returns a JSON string safe to copy-paste into a feedback form. Recorded events: `session_start`, `new_game`, `area_entered`, `skill_level_up`, `quest_complete`, `player_defeated`, `demo_overlay_dismissed`.

### Demo slice (`src/engine/demoSlice.ts`)
The public demo exposes 4 regions (Hushwood, Quarry, Shoreline, Ashfen Copse), 6 skills (Woodcutting, Mining, Fishing, Foraging, Hearthcraft/Cooking, Forging/Smithing), and 3 questlines. All expansion content is locked behind `DEMO_CONTENT_LOCK`.

---

## Current Implementation State (Phase 100 — RC-1)

All 100 development phases complete. Full phase log available in `src/engine/releaseCandidate.ts`.

### World
- 9 traversable regions: Hushwood Settlement, Redwake Quarry, Gloamwater Shoreline, Ashfen Copse, Marrowfen, Tidemark Chapel, Belowglass Vaults, Hollow Vault, Brackroot Trail
- LOD-managed region chunks with hysteresis-band loading
- Day/night cycle (10 keyframes, period notifications)
- Dynamic weather system (clear / overcast / rain / storm / fog)
- Environmental hazard zones with persistent warning HUD

### Skills (11 total)
| Skill | Station | Category |
|---|---|---|
| Woodcutting | Ash trees | Gathering |
| Mining | Ore nodes | Gathering |
| Fishing | Shore/seep nodes | Gathering |
| Foraging | Herb/berry nodes | Gathering |
| Hearthcraft (Cooking) | Campfire | Processing |
| Forging (Smithing) | Forge | Processing |
| Carving | Carving bench | Craft |
| Tinkering | Tinkerer's bench | Craft |
| Tailoring | Loom | Craft |
| Warding | Warding basin | Specialist |
| Surveying | Survey chalk | Specialist |

### Economy & Progression
- Marks currency, vendor shops with finite stock, session-reset consumables
- Ledger Hall off-player storage
- Faction reputation system (neutral → acquainted → trusted → honored)
- Multi-step questlines with gather / deliver / talk objectives

### Combat
- Hostile creatures: Cinderhare, Mossback Toad, Thornling, Slatebeak, Mireling
- Melee and ranged combat, creature aggro, respawn overlay
- Boss encounter: Vault Heart

### Systems
- Save/load: versioned schema v2, backup/recovery, per-field validation
- Gated progression doors (skill / task / item / faction requirements)
- Hidden surveying caches across all regions
- Accessibility: reduced-motion toggle, font-scale (sm / md / lg)
- Audio: background music, region stinger, gather/craft/combat SFX
- Telemetry: local-only session event ring-buffer
- PWA manifest for installable mobile deployment

---

## Known Limitations (RC-1)

| Severity | Issue |
|---|---|
| Medium | Opened gated doors are not persisted — they re-evaluate requirements on load and reappear until re-interacted with. |
| Medium | Draw-call count approaches mobile GPU limits with 10+ simultaneous creature spawns; InstancedMesh migration is in the expansion backlog. |
| Low | AudioContext node limits on Safari/iOS may cause SFX drops during dense combat. |
| Low | LOD hysteresis band (20 units) may need re-tuning once mid-game expansion regions load at higher prop density. |

---

## Expansion Backlog

Post-demo expansion work is tracked in `src/engine/expansionBacklog.ts`, organized by priority (P0–P3), feature bucket, cut/keep decisions, and risk notes.

## Next Step

Monitor telemetry from demo players, address P0 items from `EXPANSION_BACKLOG`, and increment to post-RC expansion phases.
