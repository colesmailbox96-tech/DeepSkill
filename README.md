# DeepSkill (Veilmarch Prototype)

Low-poly RPG prototype built with Vite + React + TypeScript + Three.js.

## Current Scope

**Phase 03 — Player Controller Base**

- Vite + React + TypeScript project baseline
- Three.js rendering skeleton
- Minimal world scene with:
  - perspective camera,
  - ambient + directional lighting,
  - flat terrain test plane,
  - continuous render loop
- Player capsule mesh (blue, stands on ground)
- WASD / arrow key movement
- Walk / idle state tracking
- Camera follows player with smooth lerp
- Movement clamped within the terrain boundary

## Development

```bash
npm install
npm run dev
```

## Validation

```bash
npm run lint
npm run build
```
