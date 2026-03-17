/**
 * Phase 15 — Woodcutting Node System
 *
 * Implements the first real skilling loop in Veilmarch:
 *   - Ashwood tree interactables placed around Hushwood settlement
 *   - Gather timing: 3 s per chop (cancels on player movement)
 *   - Inventory reward: 1 × ashwood_log
 *   - XP reward: 25 woodcutting XP
 *   - Stump / respawn behaviour: tree becomes a stump for 30 s then regrows
 *   - Fail state: notification if player has no woodcutting hatchet
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { useNotifications } from '../store/useNotifications'
import { useGameStore } from '../store/useGameStore'

// ── Constants ─────────────────────────────────────────────────────────────────

/** Seconds the player must continuously chop to yield one log. */
export const CHOP_DURATION = 3.0

/** Woodcutting XP awarded per log cut. */
export const LOG_XP = 25

/** Seconds before a felled tree regrows into an interactable ashwood tree. */
export const RESPAWN_TIME = 30.0

/** Item IDs that count as a valid woodcutting hatchet. */
const HATCHET_IDS = new Set(['rough_ash_hatchet'])

// ── Materials ─────────────────────────────────────────────────────────────────

const matTrunk  = new THREE.MeshStandardMaterial({ color: 0x7a4f2a, roughness: 0.85 })
const matCanopy = new THREE.MeshStandardMaterial({ color: 0x2d5a2d, roughness: 0.80 })
const matStump  = new THREE.MeshStandardMaterial({ color: 0x8a6040, roughness: 0.90 })

// ── Types ─────────────────────────────────────────────────────────────────────

/** Live state for a single tree in the world. */
export interface TreeNode {
  /** Unique identifier (e.g. "tree_0"). */
  id: string
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

// ── Tree positions ────────────────────────────────────────────────────────────

/**
 * [x, z] world positions for the six ashwood trees placed around the
 * Hushwood settlement.  Chosen to sit outside roads and buildings but
 * within the ±19 boundary walls.
 */
const TREE_POSITIONS: [number, number][] = [
  [-15, -13],   // north-west
  [  2, -16],   // north (offset from village hall)
  [ 16,  -6],   // north-east
  [ 15,  12],   // south-east
  [-14,  12],   // south-west
  [-15,   0],   // west
]

// ── Builder helpers ───────────────────────────────────────────────────────────

function buildOneTree(
  scene: THREE.Scene,
  id: string,
  x: number,
  z: number,
  onChopStart: (node: TreeNode) => void,
): TreeNode {
  // Trunk: slightly tapered cylinder
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.3, 1.8, 8),
    matTrunk.clone(),
  )
  trunk.position.set(x, 0.9, z)
  scene.add(trunk)

  // Canopy: simple cone cap
  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(1.2, 2.4, 8),
    matCanopy.clone(),
  )
  canopy.position.set(x, 2.9, z)
  scene.add(canopy)

  // Stump: short wide cylinder, initially hidden
  const stumpMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.35, 0.4, 8),
    matStump.clone(),
  )
  stumpMesh.position.set(x, 0.2, z)
  stumpMesh.visible = false
  scene.add(stumpMesh)

  // Build node first so onInteract closure can reference it.
  const node: TreeNode = {
    id,
    state: 'ready',
    respawnTimer: 0,
    trunk,
    canopy,
    stumpMesh,
    interactable: null as unknown as Interactable, // filled immediately below
  }

  node.interactable = {
    mesh: trunk,
    label: 'Ashwood Tree',
    interactRadius: 2.5,
    onInteract: () => {
      if (node.state === 'stump') {
        useNotifications.getState().push('This tree has been cut — wait for it to regrow.', 'info')
        return
      }
      onChopStart(node)
    },
  }

  return node
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Spawn all ashwood trees into `scene` and register their interactables.
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
  return TREE_POSITIONS.map(([x, z], idx) => {
    const node = buildOneTree(scene, `tree_${idx}`, x, z, onChopStart)
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
      node.interactable.label = 'Ashwood Tree'
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
 * Returns true if the player's inventory contains at least one item that
 * qualifies as a woodcutting hatchet.
 */
export function hasHatchet(): boolean {
  const { slots } = useGameStore.getState().inventory
  return slots.some((s) => s != null && HATCHET_IDS.has(s.id))
}
