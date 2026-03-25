/**
 * Phase 47 — Tidemark Chapel Zone
 *
 * Introduces the first mystic-hazard region: a half-flooded shrine complex
 * built around an old sealed shaft west of Hushwood.
 *
 * Zone summary
 * ─────────────
 *  Layout:
 *   Connecting corridor     x = −19 → −32, z = −3 → +3   (6-unit wide path)
 *   Chapel grounds          x = −32 → −60, z = −18 → +18  (28 × 36 area)
 *   Inner shrine / shaft    x = −46 → −60, z = −10 → +10  (mist hazard core)
 *
 *  Hazard — Mist Seep:
 *   The inner shrine is filled with pale mist rising from the sealed shaft.
 *   While inside the mist zone the player takes periodic damage (1 HP every
 *   MIST_TICK_INTERVAL seconds) unless they carry an Ashwillow Ward in their
 *   inventory — the ward's environmental protection neutralises the effect.
 *
 *  NPC — Nairn Dusk (Ward-Adept):
 *   Stands at the chapel grounds entrance, facing inward.  She warns of the
 *   mist and explains the value of warding marks.
 *
 *  Creature — Chapel Wisp (added in creature.ts, spawned in the inner shrine).
 *
 * Access:
 *   The Hushwood west boundary wall is split in hushwood.ts with a 6-unit gap
 *   at z = −3 → +3 so the player can walk west into this zone.
 *
 * Phase 65 modification:
 *   The chapel west boundary wall (x = −60) is now split into two sections that
 *   leave a 6-unit central gap (z = −3 → +3) so the player can continue west
 *   into the Hollow Vault Steps zone.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import type { Npc } from './npc'
import { useDialogueStore } from '../store/useDialogueStore'
import { useNotifications } from '../store/useNotifications'

// ─── Hazard constants (exported for App.tsx) ──────────────────────────────────

/** AABB defining the mist-seep hazard volume inside the inner shrine. */
export const MIST_ZONE_MIN_X = -60
export const MIST_ZONE_MAX_X = -46
export const MIST_ZONE_MIN_Z = -10
export const MIST_ZONE_MAX_Z =  10

/** Seconds between mist-damage ticks (when unprotected). */
export const MIST_TICK_INTERVAL = 3.0

/** Damage applied per mist tick. */
export const MIST_TICK_DAMAGE = 1

/** Item ID that provides environmental protection against the mist. */
export const MIST_WARD_ITEM_ID = 'ashwillow_ward'

// ─── Shared materials ─────────────────────────────────────────────────────────

const matChapelGround = new THREE.MeshLambertMaterial({ color: 0x4a4a50 })
const matCorridor     = new THREE.MeshLambertMaterial({ color: 0x5c5040 })
const matRuin         = new THREE.MeshLambertMaterial({ color: 0x6a6060 })
const matDarkStone    = new THREE.MeshLambertMaterial({ color: 0x3a3538 })
const matWater        = new THREE.MeshStandardMaterial({
  color: 0x2a4060,
  roughness: 0.05,
  transparent: true,
  opacity: 0.60,
})
const matMist         = new THREE.MeshStandardMaterial({
  color: 0xb8c8d8,
  transparent: true,
  opacity: 0.18,
  roughness: 1.0,
  depthWrite: false,
})
const matShaft        = new THREE.MeshLambertMaterial({ color: 0x1a1520 })
const matGlyph        = new THREE.MeshStandardMaterial({
  color: 0x7ab0d8,
  roughness: 0.4,
  emissive: new THREE.Color(0x203858),
  emissiveIntensity: 0.7,
})
const matBound        = new THREE.MeshLambertMaterial({ visible: false })

// ─── Public result type ───────────────────────────────────────────────────────

export interface TidemarkChapelResult {
  /** Collidable meshes appended to the shared array in App.tsx. */
  collidables: THREE.Mesh[]
  /** Live NPC (Nairn Dusk) for per-frame ambient sway. */
  npcs: Npc[]
}

// ─── Public builder ───────────────────────────────────────────────────────────

/**
 * Populate `scene` with all Tidemark Chapel geometry and return collidables
 * and NPCs.  Interactables are appended to the shared `interactables` array.
 *
 * @param scene         Three.js scene.
 * @param interactables Shared interactable list (mutated in place).
 */
export function buildTidemarkChapel(
  scene: THREE.Scene,
  interactables: Interactable[],
): TidemarkChapelResult {
  const collidables: THREE.Mesh[] = []
  const npcs: Npc[] = []

  // ── Connecting corridor (x = −19 → −32, z = −3 → +3) ────────────────────
  // Floor plane only — not collidable (player AABB must pass through).
  _addBox(scene, 13, 0.04, 6, -25.5, 0.01, 0, matCorridor)

  // Corridor side walls (prevent walking off the path)
  collidables.push(_addWall(scene, 13, 4, 0.4, -25.5, 2, -3,  matBound))
  collidables.push(_addWall(scene, 13, 4, 0.4, -25.5, 2,  3,  matBound))

  // ── Phase 91 — Corridor landmarks ────────────────────────────────────────

  // Crumbled waystone at x = −23, z = 0.6 — a mossy stone with faint carved
  // marks; provides narrative flavour and breaks the 13-unit dead corridor.
  const waystoneGroup = new THREE.Group()
  waystoneGroup.position.set(-23, 0, 0.6)
  const waystoneBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.45), matDarkStone)
  waystoneBase.position.y = 0.4
  waystoneGroup.add(waystoneBase)
  const waystoneTop = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), matDarkStone)
  waystoneTop.position.set(0.04, 0.99, 0)
  waystoneTop.rotation.y = 0.3
  waystoneGroup.add(waystoneTop)
  // Glyph inset — a subtle emissive face on the stone
  const waystoneGlyph = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.28), matGlyph)
  waystoneGlyph.position.set(0, 0.4, 0.23)
  waystoneGroup.add(waystoneGlyph)
  scene.add(waystoneGroup)

  const waystoneInteractable: Interactable = {
    mesh: waystoneGroup,
    label: 'Crumbled Waystone',
    interactRadius: 1.8,
    onInteract: () => {
      useNotifications
        .getState()
        .push(
          'A weathered waystone. A carved arrow points west, toward the sound of slow water.',
          'info',
        )
    },
  }
  interactables.push(waystoneInteractable)

  // Corridor entrance stone pillars at x = −33, z = ±2.5 — low crumbled posts
  // marking the threshold just inside the chapel grounds (east boundary at x = −32).
  const pillarMat = matRuin
  for (const pz of [-2.5, 2.5]) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 1.4, 7), pillarMat)
    pillar.position.set(-33, 0.7, pz)
    scene.add(pillar)
    collidables.push(pillar)
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.18, 0.52), matDarkStone)
    cap.position.set(-33, 1.49, pz)
    scene.add(cap)
  }

  // ── Chapel grounds floor (x = −32 → −60, z = −18 → +18) ─────────────────
  // Floor plane only — not collidable.
  _addBox(scene, 28, 0.04, 36, -46, 0.01, 0, matChapelGround)

  // ── Boundary walls (chapel perimeter) ────────────────────────────────────
  // North wall (z = −18)
  collidables.push(_addWall(scene, 28, 5, 0.4, -46, 2.5, -18, matBound))
  // South wall (z = +18)
  collidables.push(_addWall(scene, 28, 5, 0.4, -46, 2.5,  18, matBound))
  // West wall (x = −60) — Phase 65: split into two sections to leave a 6-unit
  // central gap (z = −3 → +3) that aligns with the Hollow Vault Steps entrance.
  // West-north partial (z = −18 → −3)
  collidables.push(_addWall(scene, 0.4, 5, 15, -60, 2.5, -10.5, matBound))
  // West-south partial (z = +3 → +18)
  collidables.push(_addWall(scene, 0.4, 5, 15, -60, 2.5,  10.5, matBound))
  // East wall opening: two partial walls leaving a 6-unit gap at the corridor entry
  // East-north partial (z = −18 → −3)
  collidables.push(_addWall(scene, 0.4, 5, 15, -32, 2.5, -10.5, matBound))
  // East-south partial (z = +3 → +18)
  collidables.push(_addWall(scene, 0.4, 5, 15, -32, 2.5,  10.5, matBound))

  // ── Ruined outer chapel walls (visual set-pieces) ─────────────────────────
  // North ruined section — broken wall fragment
  const northWallA = _addBox(scene, 6, 2.8, 0.5, -36,   1.4, -17, matRuin)
  const northWallB = _addBox(scene, 4, 1.6, 0.5, -50,   0.8, -17, matRuin)
  const northWallC = _addBox(scene, 3, 2.2, 0.5, -56,   1.1, -17, matRuin)
  collidables.push(northWallA, northWallB, northWallC)

  // South ruined section
  const southWallA = _addBox(scene, 5, 2.4, 0.5, -38,   1.2,  17, matRuin)
  const southWallB = _addBox(scene, 4, 1.8, 0.5, -53,   0.9,  17, matRuin)
  collidables.push(southWallA, southWallB)

  // West back wall — large crumbling section
  const westWallA = _addBox(scene, 0.5, 3.2, 10, -59.5, 1.6,  -5, matRuin)
  const westWallB = _addBox(scene, 0.5, 2.0, 10, -59.5, 1.0,   7, matRuin)
  collidables.push(westWallA, westWallB)

  // ── Broken columns ────────────────────────────────────────────────────────
  const columnPositions: [number, number][] = [
    [-36, -12], [-36,  12],
    [-43,  -9], [-43,   9],
    [-50,  -8], [-50,   8],
  ]
  for (const [cx, cz] of columnPositions) {
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.32, 2.6 + Math.random() * 0.8, 8),
      matDarkStone,
    )
    col.position.set(cx, 1.3, cz)
    scene.add(col)
    collidables.push(col)
    // Rubble at base
    const rubble = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.22, 0.6),
      matRuin,
    )
    rubble.position.set(cx + (Math.random() - 0.5) * 0.4, 0.11, cz + (Math.random() - 0.5) * 0.4)
    scene.add(rubble)
  }

  // ── Flood water (shallow pool across the inner chapel floor) ─────────────
  // x = −38 → −58, z = −14 → +14 (low level — the chapel is half-flooded)
  const waterPool = new THREE.Mesh(new THREE.PlaneGeometry(20, 28), matWater)
  waterPool.rotation.x = -Math.PI / 2
  waterPool.position.set(-48, 0.04, 0)
  scene.add(waterPool)

  // ── Sealed shaft (the source of the mist) ────────────────────────────────
  // A dark circular depression at the far end of the inner shrine.
  const shaftRim = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 2.0, 0.3, 16),
    matDarkStone,
  )
  shaftRim.position.set(-56, 0.15, 0)
  scene.add(shaftRim)
  collidables.push(shaftRim)

  const shaftFloor = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.6, 0.1, 16),
    matShaft,
  )
  shaftFloor.position.set(-56, 0.05, 0)
  scene.add(shaftFloor)

  // Glyph ring carved around the shaft rim
  const glyphRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.0, 0.06, 6, 24),
    matGlyph,
  )
  glyphRing.rotation.x = -Math.PI / 2
  glyphRing.position.set(-56, 0.32, 0)
  scene.add(glyphRing)

  // Cold blue light from the shaft
  const shaftLight = new THREE.PointLight(0x5090c8, 1.4, 18)
  shaftLight.position.set(-56, 1.2, 0)
  scene.add(shaftLight)

  // ── Mist volume (visual only — damage is ticked in App.tsx) ───────────────
  // Three overlapping disc planes to suggest rising mist.
  const mistPositions: [number, number, number][] = [
    [-52, 0.3,  0],
    [-56, 0.5,  3],
    [-56, 0.4, -3],
    [-50, 0.25, 4],
    [-50, 0.25,-4],
  ]
  for (const [mx, my, mz] of mistPositions) {
    const mistDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5 + Math.random() * 1.5, 2.5, 0.08, 12),
      matMist,
    )
    mistDisc.position.set(mx, my, mz)
    scene.add(mistDisc)
  }

  // ── Stone altar slab in the middle of the grounds (ward-relevant) ─────────
  const altarSlab = _addBox(scene, 1.6, 0.2, 0.9, -40, 0.1, 0, matDarkStone)
  collidables.push(altarSlab)

  // Etched glyph on the slab surface
  const slabGlyph = new THREE.Mesh(
    new THREE.PlaneGeometry(1.0, 0.5),
    matGlyph,
  )
  slabGlyph.rotation.x = -Math.PI / 2
  slabGlyph.position.set(-40, 0.21, 0)
  scene.add(slabGlyph)

  // ── Ground rubble and debris ──────────────────────────────────────────────
  const debrisPos: [number, number, number, number, number, number][] = [
    [-34, 0.08, -8,  0.5, 0.18, 0.5],
    [-38, 0.08,  7,  0.8, 0.14, 0.4],
    [-42, 0.08, -5,  0.4, 0.10, 0.6],
    [-44, 0.08,  5,  0.6, 0.12, 0.5],
    [-48, 0.06, -6,  0.5, 0.08, 0.7],
  ]
  for (const [dx, dy, dz, dw, dh, dd] of debrisPos) {
    const debris = new THREE.Mesh(new THREE.BoxGeometry(dw, dh, dd), matRuin)
    debris.position.set(dx, dy, dz)
    debris.rotation.y = Math.random() * Math.PI
    scene.add(debris)
  }

  // ── Ambient lanterns near the chapel entrance ─────────────────────────────
  const matLantern = new THREE.MeshStandardMaterial({
    color: 0x8090b0,
    emissive: new THREE.Color(0x3050a0),
    emissiveIntensity: 0.9,
    roughness: 0.5,
  })
  const lanternPositions: [number, number][] = [[-32.5, -5], [-32.5, 5]]
  for (const [lx, lz] of lanternPositions) {
    _addBox(scene, 0.1, 1.6, 0.1, lx, 0.8, lz, matDarkStone)
    const lanternBox = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.28, 0.25), matLantern)
    lanternBox.position.set(lx, 1.8, lz)
    scene.add(lanternBox)
    const lanternLight = new THREE.PointLight(0x5070c0, 0.8, 8)
    lanternLight.position.set(lx, 2.2, lz)
    scene.add(lanternLight)
  }

  // ── NPC — Nairn Dusk (Ward-Adept) ────────────────────────────────────────
  // Stands at x = −34, z = −4, facing east (toward the player's entry).
  const nairnGroup = new THREE.Group()
  nairnGroup.position.set(-34, 0, -4)
  nairnGroup.rotation.y = Math.PI / 2 // facing east (+X)

  const nairnBodyMat = new THREE.MeshStandardMaterial({ color: 0x2d3a50, roughness: 0.7 })
  const nairnBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.9, 4, 8), nairnBodyMat)
  nairnBody.position.y = 0.7
  nairnGroup.add(nairnBody)

  const nairnDiscMat = new THREE.MeshStandardMaterial({
    color: 0x80b0e0,
    emissive: new THREE.Color(0x3060a0),
    emissiveIntensity: 0.5,
    roughness: 0.5,
  })
  const nairnDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.06, 8),
    nairnDiscMat,
  )
  nairnDisc.position.y = 1.85
  nairnGroup.add(nairnDisc)

  scene.add(nairnGroup)

  const nairnInteractable: Interactable = {
    mesh: nairnGroup,
    label: 'Nairn Dusk (Ward-Adept)',
    interactRadius: 2.2,
    onInteract: () => useDialogueStore.getState().openDialogue('Nairn Dusk (Ward-Adept)'),
  }
  interactables.push(nairnInteractable)

  npcs.push({
    mesh: nairnGroup,
    idleAngle: Math.PI / 2,
    ambientPhase: 1.3,
    ambientTime: 0,
  })

  return { collidables, npcs }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _addBox(
  scene: THREE.Scene,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  mesh.position.set(x, y, z)
  scene.add(mesh)
  return mesh
}

function _addWall(
  scene: THREE.Scene,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
): THREE.Mesh {
  return _addBox(scene, w, h, d, x, y, z, mat)
}
