/**
 * Phase 16 — Beginner Tree Variants
 *
 * Extends the Phase 15 woodcutting node system with three distinct tree
 * variants that differ in level requirement, chop timing, XP reward, log
 * output, and visual appearance:
 *
 *   Ash Sapling        — level 1, 2 s chop, 15 XP, ash_sapling_log
 *   Ashwood Tree       — level 1, 3 s chop, 25 XP, ashwood_log
 *   Ironbark Youngling — level 5, 4 s chop, 40 XP, ironbark_log
 *
 * Phase 57 — Ashfen Copse Zone:
 *   Mineral Ashwood    — level 8, 5 s chop, 55 XP, mineralwood_log
 *     A rare tree whose heartwood is threaded with iron-trace deposits.
 *     The bark is dark, almost charcoal-grey, with faint metallic glints.
 *     Found only in the Ashfen Copse northeast of Redwake Quarry.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { useNotifications } from '../store/useNotifications'
import { useGameStore } from '../store/useGameStore'
import { getToolTierForSkill, hasToolForSkill } from '../data/items/itemRegistry'

// ── Constants ─────────────────────────────────────────────────────────────────

/** Seconds before a felled tree regrows into an interactable tree. */
export const RESPAWN_TIME = 30.0

// ── Variant system ────────────────────────────────────────────────────────────

/** The three beginner tree variants introduced in Phase 16, plus Mineral Ashwood (Phase 57). */
export type TreeVariant = 'sapling' | 'ashwood' | 'ironbark' | 'mineralwood'

/** Per-variant configuration used for gameplay and visual construction. */
export interface VariantConfig {
  /** Display label shown in the interaction prompt. */
  label: string
  /** Item ID granted on a successful chop. */
  logId: string
  /** Seconds the player must continuously chop to yield one log. */
  chopDuration: number
  /** Woodcutting XP awarded per log cut. */
  xp: number
  /** Minimum woodcutting level required to chop this tree. */
  levelReq: number
  // ── Visual geometry ──────────────────────────────────────────────────────
  trunkColor: number
  canopyColor: number
  /** Trunk CylinderGeometry: [topR, botR, height, segments] */
  trunkGeo: [number, number, number, number]
  /** Trunk mesh local y offset */
  trunkY: number
  /** Canopy ConeGeometry: [radius, height, segments] */
  canopyGeo: [number, number, number]
  /** Canopy mesh local y offset */
  canopyY: number
}

/**
 * Immutable configuration table for all three beginner tree variants.
 * Consumed by buildOneTree (visual construction) and by App.tsx (reward logic).
 */
export const VARIANT_CONFIG: Readonly<Record<TreeVariant, VariantConfig>> = {
  sapling: {
    label: 'Ash Sapling',
    logId: 'ash_sapling_log',
    chopDuration: 2.0,
    xp: 15,
    levelReq: 1,
    trunkColor: 0xb0a882,
    canopyColor: 0x5aaa5a,
    trunkGeo: [0.12, 0.15, 1.2, 8],
    trunkY: 0.6,
    canopyGeo: [0.8, 1.6, 8],
    canopyY: 1.9,
  },
  ashwood: {
    label: 'Ashwood Tree',
    logId: 'ashwood_log',
    chopDuration: 3.0,
    xp: 25,
    levelReq: 1,
    trunkColor: 0x7a4f2a,
    canopyColor: 0x2d5a2d,
    trunkGeo: [0.2, 0.3, 1.8, 8],
    trunkY: 0.9,
    canopyGeo: [1.2, 2.4, 8],
    canopyY: 2.9,
  },
  ironbark: {
    label: 'Ironbark Youngling',
    logId: 'ironbark_log',
    chopDuration: 4.0,
    xp: 40,
    levelReq: 5,
    trunkColor: 0x4a2812,
    canopyColor: 0x254520,
    trunkGeo: [0.22, 0.32, 2.2, 8],
    trunkY: 1.1,
    canopyGeo: [1.4, 2.8, 8],
    canopyY: 3.4,
  },
  // Phase 57 — Mineral Ashwood: dark, iron-laced bark with a slightly metallic
  // canopy tint.  Taller and sturdier than ironbark.
  mineralwood: {
    label: 'Mineral Ashwood',
    logId: 'mineralwood_log',
    chopDuration: 5.0,
    xp: 55,
    levelReq: 8,
    trunkColor: 0x2a2a30,
    canopyColor: 0x1e3a20,
    trunkGeo: [0.26, 0.36, 2.8, 8],
    trunkY: 1.4,
    canopyGeo: [1.6, 3.2, 8],
    canopyY: 4.2,
  },
}

// ── Materials ─────────────────────────────────────────────────────────────────

const matStump = new THREE.MeshStandardMaterial({ color: 0x8a6040, roughness: 0.90 })

// ── Types ─────────────────────────────────────────────────────────────────────

/** Live state for a single tree in the world. */
export interface TreeNode {
  /** Unique identifier (e.g. "tree_0"). */
  id: string
  /** Which variant this tree is. */
  variant: TreeVariant
  /** Current lifecycle state. */
  state: 'ready' | 'stump'
  /** Countdown until the tree regrows (only meaningful when state === 'stump'). */
  respawnTimer: number
  /** Full-height trunk mesh — hidden when tree is a stump. */
  trunk: THREE.Mesh
  /** Leaf canopy mesh — hidden when tree is a stump. */
  canopy: THREE.Mesh
  /** Short stump mesh — visible only when tree is in stump state. */
  stumpMesh: THREE.Mesh
  /** Interactable descriptor pushed into the scene interactables array. */
  interactable: Interactable
}

// ── Tree placements ───────────────────────────────────────────────────────────

/**
 * World positions and variant assignments for the six beginner trees placed
 * around Hushwood settlement (Phase 16 layout).
 *
 *   2 × Ash Sapling        (level 1)
 *   2 × Ashwood Tree       (level 1)
 *   2 × Ironbark Youngling (level 5)
 */
const TREE_PLACEMENTS: Array<{ pos: [number, number]; variant: TreeVariant }> = [
  { pos: [-15, -13], variant: 'sapling'  },  // north-west sapling
  { pos: [  2, -16], variant: 'ashwood'  },  // north ashwood
  { pos: [ 16,  -6], variant: 'ironbark' },  // north-east ironbark
  { pos: [ 15,  12], variant: 'ironbark' },  // south-east ironbark
  { pos: [-14,  12], variant: 'ashwood'  },  // south-west ashwood
  { pos: [-15,   0], variant: 'sapling'  },  // west sapling
]

// ── Builder helpers ───────────────────────────────────────────────────────────

function buildOneTree(
  scene: THREE.Scene,
  id: string,
  x: number,
  z: number,
  variant: TreeVariant,
  onChopStart: (node: TreeNode) => void,
): TreeNode {
  const cfg = VARIANT_CONFIG[variant]

  // A stable group anchors the interactable so proximity checks and
  // emissive highlights always target the correct world position
  // regardless of which child mesh is currently visible.
  const group = new THREE.Group()
  group.position.set(x, 0, z)
  scene.add(group)

  // Trunk
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(...cfg.trunkGeo),
    new THREE.MeshStandardMaterial({ color: cfg.trunkColor, roughness: 0.85 }),
  )
  trunk.position.set(0, cfg.trunkY, 0)
  group.add(trunk)

  // Canopy
  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(...cfg.canopyGeo),
    new THREE.MeshStandardMaterial({ color: cfg.canopyColor, roughness: 0.80 }),
  )
  canopy.position.set(0, cfg.canopyY, 0)
  group.add(canopy)

  // Stump: short wide cylinder, initially hidden
  const stumpMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.35, 0.4, 8),
    matStump.clone(),
  )
  stumpMesh.position.set(0, 0.2, 0)
  stumpMesh.visible = false
  group.add(stumpMesh)

  const interactable: Interactable = {
    mesh: group,
    label: cfg.label,
    interactRadius: 2.5,
    onInteract: () => {
      if (node.state === 'stump') {
        useNotifications.getState().push('This tree has been cut — wait for it to regrow.', 'info')
        return
      }
      onChopStart(node)
    },
  }

  const node: TreeNode = {
    id,
    variant,
    state: 'ready',
    respawnTimer: 0,
    trunk,
    canopy,
    stumpMesh,
    interactable,
  }

  return node
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Spawn all beginner trees into `scene` and register their interactables.
 *
 * @param scene         Three.js scene to add meshes to.
 * @param interactables Mutable array; each tree's interactable is appended.
 * @param onChopStart   Callback invoked when the player presses E on a ready tree.
 *                      The caller (App.tsx) owns the gather-timer and reward logic.
 */
export function buildTreeNodes(
  scene: THREE.Scene,
  interactables: Interactable[],
  onChopStart: (node: TreeNode) => void,
): TreeNode[] {
  return TREE_PLACEMENTS.map(({ pos: [x, z], variant }, idx) => {
    const node = buildOneTree(scene, `tree_${idx}`, x, z, variant, onChopStart)
    interactables.push(node.interactable)
    return node
  })
}

/**
 * Spawn tree nodes at arbitrary world positions and register their interactables.
 * Used by secondary zones (e.g. Brackroot Trail) that define their own placement data.
 *
 * @param scene         Three.js scene to add meshes to.
 * @param interactables Mutable array; each tree's interactable is appended.
 * @param placements    Custom (x, z) + variant pairs.
 * @param onChopStart   Callback invoked when the player presses E on a ready tree.
 * @param idPrefix      Prefix for node IDs so they don't collide with other sets.
 */
export function buildTreeNodesAt(
  scene: THREE.Scene,
  interactables: Interactable[],
  placements: ReadonlyArray<{ pos: [number, number]; variant: TreeVariant }>,
  onChopStart: (node: TreeNode) => void,
  idPrefix: string,
): TreeNode[] {
  return placements.map(({ pos: [x, z], variant }, idx) => {
    const node = buildOneTree(scene, `${idPrefix}_${idx}`, x, z, variant, onChopStart)
    interactables.push(node.interactable)
    return node
  })
}

/**
 * Per-frame update: tick respawn timers and restore tree visuals when ready.
 * Call once per animation frame after `updatePlayer`.
 */
export function updateTreeNodes(nodes: TreeNode[], delta: number): void {
  for (const node of nodes) {
    if (node.state !== 'stump') continue
    node.respawnTimer -= delta
    if (node.respawnTimer <= 0) {
      node.state = 'ready'
      node.trunk.visible = true
      node.canopy.visible = true
      node.stumpMesh.visible = false
      // Restore the correct label for this variant
      node.interactable.label = VARIANT_CONFIG[node.variant].label
    }
  }
}

/**
 * Transition a tree into the stump state.
 * Called by App.tsx after a successful chop completes.
 */
export function fellTree(node: TreeNode): void {
  node.state = 'stump'
  node.respawnTimer = RESPAWN_TIME
  node.trunk.visible = false
  node.canopy.visible = false
  node.stumpMesh.visible = true
  node.interactable.label = 'Tree Stump'
}

/**
 * Returns the tier of the best hatchet currently in the player's inventory.
 * Returns 0 when no hatchet is held.
 *
 * Phase 73: delegates to the shared registry-backed helper so this and
 * `degradeTool` always agree on which tool counts as "best".
 */
export function getHatchetTier(): number {
  return getToolTierForSkill('woodcutting', useGameStore.getState().inventory.slots)
}

/**
 * Returns true if the player's inventory contains at least one item that
 * qualifies as a woodcutting hatchet.
 */
export function hasHatchet(): boolean {
  return hasToolForSkill('woodcutting', useGameStore.getState().inventory.slots)
}

/**
 * Returns the player's current Woodcutting skill level from the game store.
 */
export function getWoodcuttingLevel(): number {
  const { skills } = useGameStore.getState()
  return skills.skills.find((s) => s.id === 'woodcutting')?.level ?? 1
}
