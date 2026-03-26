/**
 * Phase 19 — Fishing Node System
 *
 * Creates the third gathering loop by placing three fishing-spot variants
 * along the Hushwood pond shoreline.  Each variant differs in level
 * requirement, cast duration, XP reward, and fish output:
 *
 *   Shallows Pool     — level 1, 2 s cast,   10 XP, minnow
 *   Reed-bank Pool    — level 1, 3.5 s cast, 18 XP, perch
 *   Deepwater Hole    — level 5, 5 s cast,   32 XP, gloomfin
 *
 * Baitless starter mode: a Reedline Rod is sufficient to fish any spot
 * with no bait required.  The rod's built-in bone hook acts as a lure.
 *
 * Node cycling: after a successful catch the spot "goes quiet" and
 * re-activates after FISH_RESPAWN_TIME seconds, mirroring the rock and
 * tree depletion cycles.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { useNotifications } from '../store/useNotifications'
import { useGameStore } from '../store/useGameStore'
import { getToolTierForSkill, hasToolForSkill } from '../data/items/itemRegistry'

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Seconds before a fished-out spot becomes active again.
 * Phase 85 — increased from 20 s to pace fish-gathering and prevent spot spam.
 */
export const FISH_RESPAWN_TIME = 45.0

// ── Variant system ────────────────────────────────────────────────────────────

/** The three beginner fishing-spot variants introduced in Phase 19. */
export type FishVariant = 'minnow' | 'perch' | 'gloomfin'

/** Per-variant configuration used for gameplay and visual construction. */
export interface FishSpotConfig {
  /** Display label shown in the interaction prompt. */
  label: string
  /** Item ID granted on a successful cast. */
  fishId: string
  /** Seconds the player must hold the cast to reel in a catch. */
  castDuration: number
  /** Fishing XP awarded per catch. */
  xp: number
  /** Minimum fishing level required to use this spot. */
  levelReq: number
  // ── Visual palette ────────────────────────────────────────────────────
  /** Colour of the bobber float sphere. */
  floatColor: number
}

/**
 * Immutable configuration table for all three beginner fishing-spot variants.
 * Consumed by buildOneFishSpot (visual construction) and by App.tsx (reward logic).
 */
export const FISH_SPOT_CONFIG: Readonly<Record<FishVariant, FishSpotConfig>> = {
  minnow: {
    label: 'Shallows Pool',
    fishId: 'minnow',
    castDuration: 2.0,
    xp: 10,
    levelReq: 1,
    floatColor: 0xf5c842,
  },
  perch: {
    label: 'Reed-bank Pool',
    fishId: 'perch',
    castDuration: 3.5,
    xp: 18,
    levelReq: 1,
    floatColor: 0xe07030,
  },
  gloomfin: {
    label: 'Deepwater Hole',
    fishId: 'gloomfin',
    castDuration: 5.0,
    xp: 32,
    levelReq: 5,
    floatColor: 0x6a3cc0,
  },
}

// ── Materials ─────────────────────────────────────────────────────────────────

const matPole    = new THREE.MeshLambertMaterial({ color: 0x8c6030 })
const matRipple  = new THREE.MeshStandardMaterial({
  color: 0x6ab0d8,
  roughness: 0.30,
  transparent: true,
  opacity: 0.55,
})

// ── Types ─────────────────────────────────────────────────────────────────────

/** Live state for a single fishing spot in the world. */
export interface FishingNode {
  /** Unique identifier (e.g. "fish_0"). */
  id: string
  /** Which variant this spot is. */
  variant: FishVariant
  /** Current lifecycle state. */
  state: 'ready' | 'quiet'
  /** Countdown until the spot becomes active again (only meaningful when quiet). */
  respawnTimer: number
  /** Bobber float sphere — hidden when the spot is quiet. */
  floatMesh: THREE.Mesh
  /** Thin reed pole standing at the shore. */
  poleMesh: THREE.Mesh
  /** Ripple ring shown when the spot is quiet. */
  rippleMesh: THREE.Mesh
  /** Interactable descriptor pushed into the scene interactables array. */
  interactable: Interactable
}

// ── Fishing spot placements ───────────────────────────────────────────────────

/**
 * World positions and variant assignments for the three fishing spots placed
 * along the Hushwood pond shoreline (Phase 19 layout).
 *
 * The pond is a 10 × 7 water plane centred at (12, 0, −11).
 *
 *   1 × Shallows Pool  (level 1) — west shore
 *   1 × Reed-bank Pool (level 1) — north shore
 *   1 × Deepwater Hole (level 5) — east shore
 */
const FISH_SPOT_PLACEMENTS: Array<{ pos: [number, number]; variant: FishVariant }> = [
  { pos: [  7, -11], variant: 'minnow'   }, // west shore
  { pos: [ 12, -15], variant: 'perch'    }, // north shore
  { pos: [ 17, -11], variant: 'gloomfin' }, // east shore
]

// ── Builder helpers ───────────────────────────────────────────────────────────

function buildOneFishSpot(
  scene: THREE.Scene,
  id: string,
  x: number,
  z: number,
  variant: FishVariant,
  onCastStart: (node: FishingNode) => void,
): FishingNode {
  const cfg = FISH_SPOT_CONFIG[variant]

  // A stable group anchors the interactable position for proximity checks
  // and emissive highlights regardless of which child mesh is visible.
  const group = new THREE.Group()
  group.position.set(x, 0, z)
  scene.add(group)

  // Thin reed pole at the shore edge.
  const poleMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.06, 1.4, 6),
    matPole.clone(),
  )
  poleMesh.position.set(0, 0.7, 0)
  group.add(poleMesh)

  // Bobber float — a small sphere perched at the tip of the pole,
  // coloured per variant so spots are visually distinct.
  const floatMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 8, 6),
    new THREE.MeshLambertMaterial({ color: cfg.floatColor }),
  )
  floatMesh.position.set(0, 1.5, 0)
  group.add(floatMesh)

  // Ripple ring — flat torus shown when the spot is quiet / recovering.
  // Initially hidden.
  const rippleMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.06, 6, 18),
    matRipple.clone(),
  )
  rippleMesh.rotation.x = -Math.PI / 2
  rippleMesh.position.set(0, 0.06, 0)
  rippleMesh.visible = false
  group.add(rippleMesh)

  const interactable: Interactable = {
    mesh: group,
    label: cfg.label,
    interactRadius: 2.5,
    onInteract: () => {
      if (node.state === 'quiet') {
        useNotifications.getState().push('The water is quiet here — wait for fish to return.', 'info')
        return
      }
      onCastStart(node)
    },
  }

  const node: FishingNode = {
    id,
    variant,
    state: 'ready',
    respawnTimer: 0,
    floatMesh,
    poleMesh,
    rippleMesh,
    interactable,
  }

  return node
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Spawn all fishing spots into `scene` and register their interactables.
 *
 * @param scene         Three.js scene to add meshes to.
 * @param interactables Mutable array; each spot's interactable is appended.
 * @param onCastStart   Callback invoked when the player presses E on a ready spot.
 *                      The caller (App.tsx) owns the cast-timer and reward logic.
 */
export function buildFishingNodes(
  scene: THREE.Scene,
  interactables: Interactable[],
  onCastStart: (node: FishingNode) => void,
): FishingNode[] {
  return FISH_SPOT_PLACEMENTS.map(({ pos: [x, z], variant }, idx) => {
    const node = buildOneFishSpot(scene, `fish_${idx}`, x, z, variant, onCastStart)
    interactables.push(node.interactable)
    return node
  })
}

/**
 * Spawn fishing spots at arbitrary world positions and register their interactables.
 * Used by secondary zones (e.g. Gloamwater Bank) that define their own placement data.
 *
 * @param scene         Three.js scene to add meshes to.
 * @param interactables Mutable array; each spot's interactable is appended.
 * @param placements    Custom (x, z) + variant pairs.
 * @param onCastStart   Callback invoked when the player presses E on a ready spot.
 * @param idPrefix      Prefix for node IDs so they don't collide with other sets.
 */
export function buildFishingNodesAt(
  scene: THREE.Scene,
  interactables: Interactable[],
  placements: ReadonlyArray<{ pos: [number, number]; variant: FishVariant }>,
  onCastStart: (node: FishingNode) => void,
  idPrefix: string,
): FishingNode[] {
  return placements.map(({ pos: [x, z], variant }, idx) => {
    const node = buildOneFishSpot(scene, `${idPrefix}_${idx}`, x, z, variant, onCastStart)
    interactables.push(node.interactable)
    return node
  })
}

/**
 * Per-frame update: tick respawn timers and restore spot visuals when ready.
 * Call once per animation frame.
 */
export function updateFishingNodes(nodes: FishingNode[], delta: number): void {
  for (const node of nodes) {
    if (node.state !== 'quiet') continue
    node.respawnTimer -= delta
    if (node.respawnTimer <= 0) {
      node.state = 'ready'
      node.floatMesh.visible = true
      node.rippleMesh.visible = false
      node.interactable.label = FISH_SPOT_CONFIG[node.variant].label
    }
  }
}

/**
 * Transition a fishing spot into the quiet state after a successful catch.
 * Called by App.tsx once the cast timer completes.
 */
export function depleteFishSpot(node: FishingNode): void {
  node.state = 'quiet'
  node.respawnTimer = FISH_RESPAWN_TIME
  node.floatMesh.visible = false
  node.rippleMesh.visible = true
  node.interactable.label = 'Still Water'
}

/**
 * Returns the tier of the best fishing rod currently in the player's inventory.
 * Returns 0 when no rod is held.
 *
 * Phase 73: delegates to the shared registry-backed helper so this and
 * `degradeTool` always agree on which tool counts as "best".
 */
export function getRodTier(): number {
  return getToolTierForSkill('fishing', useGameStore.getState().inventory.slots)
}

/**
 * Returns true if the player's inventory contains at least one item that
 * qualifies as a fishing rod (baitless starter mode — no bait required).
 */
export function hasRod(): boolean {
  return hasToolForSkill('fishing', useGameStore.getState().inventory.slots)
}

/**
 * Returns the player's current Fishing skill level from the game store.
 */
export function getFishingLevel(): number {
  const { skills } = useGameStore.getState()
  return skills.skills.find((s) => s.id === 'fishing')?.level ?? 1
}
