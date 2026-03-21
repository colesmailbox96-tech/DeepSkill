# Veilmarch

Low-poly over-the-shoulder RPG prototype built with **Vite + React 18 + TypeScript + Three.js + Zustand**.

> **Stabilization Pass A — Mobile + Execution Hardening** has been applied to this repository.
> The next planned content phase is **Phase 46 (Warding Skill Foundation)**.

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
| F | Smithing |
| V | Carving |
| T | Tinkering |
| Y | Surveying |
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
`useSaveGame()` / `useLoadGame()` persist a versioned JSON snapshot (`veilmarch_save_v1`) to `localStorage`. Saved fields: `playerStats`, `inventory`, `skills`, `equipment`, `settings`. Transient state (NPC positions, active gather sessions, combat) is not saved and rebuilds from defaults on each load. The load path is intentionally defensive — a missing or malformed save simply starts the game fresh.

---

## Current Implementation State (after Stabilization Pass A)

Phases 01–45 complete. Last content phase: **Phase 45 — Hidden Cache System**.

Key systems present:
- 3-D world: Hushwood settlement, Redwake Quarry, Gloamwater Bank shoreline, Brackroot Trail
- Skills: Woodcutting, Mining, Fishing, Foraging, Cooking, Smithing, Carving, Tinkering, Surveying
- Crafting: Smithing (smelt + forge), Carving workbench, Tinkerer's bench
- Economy: Marks currency, Shop, Ledger Hall storage
- Combat: Hostile creatures, targeting, respawn
- NPCs: Dialogue trees, task system with gather/deliver/talk objectives
- HUD: Player strip (HP/stamina), notification feed, inventory, skills, equipment, journal, task tracker, surveying panel
- Mobile: Virtual joystick, touch orbit/pinch, safe-area-aware layout

---

## Known Limitations

| Severity | Issue |
|---|---|
| Medium | Save/load does not persist task progress, surveying cache state, or ledger storage — these reset on refresh. |
| Medium | Some secondary panels (Ledger Hall, Equipment) may overlap on very narrow screens (< 320 px). |
| Low | No visual FPS counter on mobile (desktop `showFps` setting is wired but not rendered). |
| Low | Web Audio is not implemented; volume settings exist in state but are not connected to any audio. |

---

## Next Step

Resume the normal game roadmap at **Phase 46 — Warding Skill Foundation**.
