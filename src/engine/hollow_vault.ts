/**
 * Phase 65 — Hollow Vault Steps Blockout
 *
 * Adds a ruin-adjacent region west of the Tidemark Chapel: the Hollow Vault
 * Steps, a partially excavated descent into a pre-Veil underground structure.
 *
 * Zone summary
 * ─────────────
 *  Layout:
 *   Vault antechamber    x = −60 → −75, z = −7 → +7   (connects to chapel west wall)
 *   Upper vault steps    x = −75 → −88, z = −10 → +10  (stepped floor decoration)
 *   Lower vault floor    x = −88 → −98, z = −8 → +8
 *
 *  Descending terrain:
 *   The vault floor is expressed visually through progressively darker floor
 *   slab colours and lowered ambient lighting.  The player controller operates
 *   purely in XZ (no Y-based stepping), so all traversable surfaces are kept
 *   at Y = 0.  Raised-edge boundary walls and side walls remain fully collidable
 *   so the player cannot walk out of the zone.
 *
 *  Ruin doors:
 *   Two stone door frames — one at the chapel/antechamber threshold (x = −60)
 *   and one at the antechamber/steps threshold (x = −75).  Jambs are collidable.
 *   Lintels are visual-only (not in collidables) so the 6-unit opening remains
 *   fully passable regardless of the XZ-only collision system.
 *
 *  Progression gate:
 *   A heavy stone slab seals the vault entrance at x = −60 until the player
 *   carries an Ashwillow Ward in their inventory.  Interacting with the slab
 *   when warded removes the barrier; a notification explains the mechanism.
 *   Once lifted the slab is hidden and cannot reblock (session-persistent).
 *   The gate interactable is also returned so App.tsx can remove it from the
 *   shared interactables list after unsealing.
 *
 *  Creature population:
 *   Two creature types (defined in creature.ts) roam the vault:
 *     Vault Crawler  — fast, skittering arthropod; spawns in upper steps zone.
 *     Stone Wraith   — slow, spectral construct built from collapsed masonry;
 *                      spawns on the lower vault floor.
 *
 *  Hidden surveying content:
 *   Two additional survey caches (defined in surveying.ts) are buried here:
 *     Cache G — Vault Antechamber Cache  ( level 3, near entrance steps )
 *     Cache H — Lower Vault Cache        ( level 4, far west depths )
 *
 *  Access:
 *   The Tidemark Chapel west boundary wall (x = −60) gains a 6-unit central
 *   gap to allow passage.  The gap is identical in width to the chapel's east
 *   entry — symmetric so the player can orient themselves easily.
 *   A stone archway frames the opening for visual clarity.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { useGameStore } from '../store/useGameStore'
import { useNotifications } from '../store/useNotifications'

// ─── Zone bounds (exported for App.tsx region checks) ─────────────────────────

export const HV_MIN_X = -98
export const HV_MAX_X = -60
export const HV_MIN_Z = -10
export const HV_MAX_Z =  10

// ─── Progression gate constants ───────────────────────────────────────────────

/** Item the player must carry to unseal the vault gate. */
export const HV_GATE_WARD_ITEM = 'ashwillow_ward'

/** X position of the sealing slab (vault entrance, chapel west wall gap). */
const GATE_X = -62
const GATE_Z =  0

// ─── Step count (visual only — no Y-drop) ────────────────────────────────────

/** Number of visual step sections between antechamber and lower floor. */
const STEP_COUNT = 4

// ─── Shared materials ─────────────────────────────────────────────────────────

const matVaultFloor  = new THREE.MeshStandardMaterial({ color: 0x383030, roughness: 0.96 })
const matVaultStep0  = new THREE.MeshStandardMaterial({ color: 0x322a2a, roughness: 0.97 })
const matVaultStep1  = new THREE.MeshStandardMaterial({ color: 0x2c2424, roughness: 0.97 })
const matVaultStep2  = new THREE.MeshStandardMaterial({ color: 0x262020, roughness: 0.97 })
const matVaultStep3  = new THREE.MeshStandardMaterial({ color: 0x201c1c, roughness: 0.97 })
const STEP_MATS      = [matVaultStep0, matVaultStep1, matVaultStep2, matVaultStep3]
const matRuinStone   = new THREE.MeshStandardMaterial({ color: 0x585050, roughness: 0.90 })
const matRuinDark    = new THREE.MeshStandardMaterial({ color: 0x302828, roughness: 0.95 })
const matGlyphFaint  = new THREE.MeshStandardMaterial({
  color: 0x4a7090,
  roughness: 0.5,
  emissive: new THREE.Color(0x182838),
  emissiveIntensity: 0.5,
})
const matGateSeal    = new THREE.MeshStandardMaterial({ color: 0x201e1e, roughness: 0.98 })
const matBound       = new THREE.MeshStandardMaterial({ visible: false })

// ─── Public result type ───────────────────────────────────────────────────────

export interface HollowVaultResult {
  collidables: THREE.Mesh[]
  /** The gate slab mesh — hidden by App.tsx once the player lifts the seal. */
  gateMesh: THREE.Mesh
  /** The gate interactable — removed from the shared list by App.tsx on unseal. */
  gateInteractable: Interactable
}

// ─── Public builder ───────────────────────────────────────────────────────────

/**
 * Populate `scene` with all Hollow Vault Steps geometry and return collidables,
 * the gate mesh, and the gate interactable.  Other interactables are appended
 * directly to the shared `interactables` array.
 *
 * The caller (App.tsx) is responsible for:
 *  - hiding `gateMesh` and splicing `gateInteractable` once the player unseals
 *  - spawning vault creatures
 *  - registering vault survey caches
 *
 * @param scene          Three.js scene.
 * @param interactables  Shared interactable list (mutated in place).
 */
export function buildHollowVault(
  scene: THREE.Scene,
  interactables: Interactable[],
): HollowVaultResult {
  const collidables: THREE.Mesh[] = []

  // ── Antechamber floor (x = −60 → −75, z = −7 → +7) ───────────────────────
  _addBox(scene, 15, 0.06, 14, -67.5, 0.01, 0, matVaultFloor)

  // ── Antechamber boundary walls ─────────────────────────────────────────────
  // North wall (z = −7)
  collidables.push(_addWall(scene, 15, 4, 0.4, -67.5, 2, -7, matBound))
  // South wall (z = +7)
  collidables.push(_addWall(scene, 15, 4, 0.4, -67.5, 2,  7, matBound))
  // Visible ruin-stone version (thin decorative face just inside the bound wall)
  _addBox(scene, 15, 3.5, 0.3, -67.5, 1.75, -6.85, matRuinStone)
  _addBox(scene, 15, 3.5, 0.3, -67.5, 1.75,  6.85, matRuinStone)

  // ── Outer archway at x = −60 (chapel/antechamber threshold) ──────────────
  // Jambs are collidable; lintel is visual-only so the 6-unit opening stays passable.
  // Left jamb (z = −7 to −3)
  const archJambNorth = _addBox(scene, 0.5, 4, 4, -60, 2, -5, matRuinStone)
  collidables.push(archJambNorth)
  // Right jamb (z = +3 to +7)
  const archJambSouth = _addBox(scene, 0.5, 4, 4, -60, 2,  5, matRuinStone)
  collidables.push(archJambSouth)
  // Lintel over the 6-unit gap (visual only — not in collidables)
  _addBox(scene, 0.5, 0.6, 6, -60, 4.3, 0, matRuinStone)

  // ── Inner archway at x = −75 (antechamber/steps threshold) ───────────────
  // Jambs are collidable; lintel is visual-only.
  // Left jamb
  const innerJambN = _addBox(scene, 0.5, 4, 3.5, -75, 2, -4.25, matRuinStone)
  collidables.push(innerJambN)
  // Right jamb
  const innerJambS = _addBox(scene, 0.5, 4, 3.5, -75, 2,  4.25, matRuinStone)
  collidables.push(innerJambS)
  // Lintel (visual only — not in collidables)
  _addBox(scene, 0.5, 0.6, 8, -75, 4.3, 0, matRuinStone)

  // Glyph panels beside the inner archway (marking the old warding boundary)
  const glyphN = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.2, 1.2), matGlyphFaint)
  glyphN.position.set(-74.8, 1.6, -4.25)
  scene.add(glyphN)
  const glyphS = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.2, 1.2), matGlyphFaint)
  glyphS.position.set(-74.8, 1.6,  4.25)
  scene.add(glyphS)

  // ── Visual step sections (x = −75 → −88) ─────────────────────────────────
  // The player controller is XZ-only (no Y stepping) so all step floors sit at
  // Y = 0.  The "descent" is expressed by progressively darker slab materials,
  // dimming point-lights, and atmospheric rubble — not by actual height change.
  // Risers are omitted because they would block XZ movement.
  // Side walls keep the player inside the step corridor; they widen slightly
  // from the inner archway opening (z = ±5) to match the lower vault (z = ±8).
  for (let i = 0; i < STEP_COUNT; i++) {
    const stepCentreX = -76 - i * 3.25 - 1.625   // centre X of this step section
    const stepWidth   = 3.25
    const stepDepth   = 10

    // Darker floor slab — each section uses a progressively darker material.
    _addBox(scene, stepWidth, 0.06, stepDepth, stepCentreX, 0.01, 0, STEP_MATS[i])

    // Decorative rubble at the leading edge of each section
    for (let j = 0; j < 3; j++) {
      const rx = stepCentreX - stepWidth / 2 + Math.random() * 0.4
      const rz = (Math.random() - 0.5) * (stepDepth - 2)
      const rubble = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.3 + Math.random() * 0.3,
          0.15 + Math.random() * 0.1,
          0.3 + Math.random() * 0.3,
        ),
        matRuinDark,
      )
      rubble.position.set(rx, 0.08, rz)
      rubble.rotation.y = Math.random() * Math.PI
      scene.add(rubble)
    }

    // Side walls along the step sections (north and south)
    collidables.push(_addWall(scene, stepWidth, 4, 0.4, stepCentreX, 2, -5, matBound))
    collidables.push(_addWall(scene, stepWidth, 4, 0.4, stepCentreX, 2,  5, matBound))
    _addBox(scene, stepWidth, 3.0, 0.3, stepCentreX, 1.5, -4.85, matRuinStone)
    _addBox(scene, stepWidth, 3.0, 0.3, stepCentreX, 1.5,  4.85, matRuinStone)

    // Dim point-lights to reinforce deepening atmosphere
    const depthLight = new THREE.PointLight(0x182030, 0.3 + i * 0.15, 6)
    depthLight.position.set(stepCentreX, 1.2, 0)
    scene.add(depthLight)
  }

  // ── Lower vault floor (x = −88 → −98) ────────────────────────────────────
  const lowerFloorCentreX = -93
  _addBox(scene, 10, 0.06, 16, lowerFloorCentreX, 0.01, 0, matVaultFloor)

  // Lower vault boundary walls
  collidables.push(_addWall(scene, 10, 4, 0.4, lowerFloorCentreX, 2, -8, matBound))
  collidables.push(_addWall(scene, 10, 4, 0.4, lowerFloorCentreX, 2,  8, matBound))
  collidables.push(_addWall(scene, 0.4, 4, 16, -98, 2, 0, matBound))
  _addBox(scene, 10, 3.0, 0.3, lowerFloorCentreX, 1.5, -7.85, matRuinDark)
  _addBox(scene, 10, 3.0, 0.3, lowerFloorCentreX, 1.5,  7.85, matRuinDark)
  _addBox(scene, 0.3, 3.0, 16, -97.9, 1.5, 0, matRuinDark)

  // Low overhead ceiling fragments (visual atmosphere — low clearance feel)
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0x1a1818, roughness: 0.98 })
  _addBox(scene, 8, 0.3, 12, lowerFloorCentreX, 3.5, 0, ceilMat)

  // Ceiling stalactites (visual detail)
  const stalactitePositions: [number, number, number][] = [
    [-90, 3.5, -2],
    [-93, 3.5,  3],
    [-96, 3.5, -4],
    [-91, 3.5,  5],
  ]
  for (const [sx, sy, sz] of stalactitePositions) {
    const stala = new THREE.Mesh(
      new THREE.ConeGeometry(0.08 + Math.random() * 0.06, 0.4 + Math.random() * 0.3, 6),
      matRuinDark,
    )
    stala.position.set(sx, sy, sz)
    stala.rotation.z = Math.PI  // point downward
    scene.add(stala)
  }

  // ── Collapsed masonry piles on lower floor ────────────────────────────────
  const masonryPiles: [number, number, number][] = [
    [-89.5, 0, -5],
    [-94,   0,  6],
    [-97,   0, -3],
    [-91,   0,  2],
  ]
  for (const [px, py, pz] of masonryPiles) {
    const pile = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.9 + Math.random() * 0.8,
        0.35 + Math.random() * 0.25,
        0.7 + Math.random() * 0.6,
      ),
      matRuinDark,
    )
    pile.position.set(px, py + 0.2, pz)
    pile.rotation.y = Math.random() * Math.PI
    scene.add(pile)
    collidables.push(pile)
  }

  // Ambient deep-vault light (faint teal glow — occult residue)
  const vaultLight = new THREE.PointLight(0x204840, 1.0, 22)
  vaultLight.position.set(-93, 1.5, 0)
  scene.add(vaultLight)

  // Faint glyph ring etched into the lower vault floor
  const lowerGlyph = new THREE.Mesh(
    new THREE.TorusGeometry(2.5, 0.05, 6, 24),
    matGlyphFaint,
  )
  lowerGlyph.rotation.x = -Math.PI / 2
  lowerGlyph.position.set(-93, 0.12, 0)
  scene.add(lowerGlyph)

  // ── Progression gate — sealing slab at vault entrance ─────────────────────
  // A heavy stone slab sits in the 6-unit gap between the outer archway jambs.
  // It is removed (hidden) when the player carries an Ashwillow Ward and
  // interacts with it.  The collidable is removed from the physics list and the
  // interactable is removed from the shared list by App.tsx on unseal.
  const gateSlab = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4, 6), matGateSeal)
  gateSlab.position.set(GATE_X, 2, GATE_Z)
  scene.add(gateSlab)
  collidables.push(gateSlab)

  // Glyph markings on the gate slab
  const gateGlyph = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.6), matGlyphFaint)
  gateGlyph.rotation.y = Math.PI / 2
  gateGlyph.position.set(GATE_X + 0.22, 2, 0)
  scene.add(gateGlyph)

  // A cold point-light emanates from the sealed gate
  const gateLight = new THREE.PointLight(0x3060a0, 0.9, 10)
  gateLight.position.set(GATE_X + 1, 2.5, 0)
  scene.add(gateLight)

  // Register the gate as an interactable; also return it so App.tsx can splice
  // it from the shared list when the gate is unsealed.
  const gateInteractable: Interactable = {
    mesh: gateSlab,
    label: 'Sealed Vault Gate',
    interactRadius: 2.5,
    onInteract: () => {
      const { inventory } = useGameStore.getState()
      const hasWard = inventory.slots.some(
        (s) => s.id === HV_GATE_WARD_ITEM && s.quantity > 0,
      )
      if (!hasWard) {
        useNotifications.getState().push(
          'The gate hums with warding resonance. You sense you need a ward to unseal it.',
          'info',
        )
        return
      }
      // Signal to App.tsx to unseal (App.tsx removes the collidable and interactable).
      _gateUnsealed = true
      useNotifications.getState().push(
        'Your Ashwillow Ward resonates with the gate. The stone slab grinds aside.',
        'info',
      )
    },
  }
  interactables.push(gateInteractable)

  return { collidables, gateMesh: gateSlab, gateInteractable }
}

// ─── Gate unseal flag (read once per frame by App.tsx) ────────────────────────

let _gateUnsealed = false

/**
 * Returns true if the player has triggered the vault gate unseal this session.
 * Call once per frame; the flag is cleared after reading.
 */
export function pollGateUnsealed(): boolean {
  if (_gateUnsealed) {
    _gateUnsealed = false
    return true
  }
  return false
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
  mat: THREE.MeshStandardMaterial,
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
  mat: THREE.MeshStandardMaterial,
): THREE.Mesh {
  return _addBox(scene, w, h, d, x, y, z, mat)
}

