/**
 * Phase 67 — Locked Gate / Requirement Framework
 *
 * Provides a reusable data model and helpers for progression gating.
 * Any interactable in the world — door, node, passage, or cache — can declare
 * a GateRequirement array; the engine checks them and surfaces consistent
 * feedback to the player.
 *
 * Requirement kinds
 * ─────────────────
 *  'skill'   — player's level in skillId must reach minLevel.
 *  'task'    — task taskId must be in the completed list.
 *  'item'    — player's inventory must contain at least one itemId.
 *  'faction' — player's trust tier with factionId must reach minTier.
 *
 * Physical helpers
 * ────────────────
 *  buildGatedDoor() — places a collidable door mesh with requirement-checking
 *                     interaction.  When all requirements are met the door
 *                     signals the caller via pollOpened(), which App.tsx calls
 *                     once per frame and acts on to remove the collidable.
 *
 * Feedback
 * ────────
 *  checkRequirement / checkRequirements return a human-readable message and a
 *  met flag.  buildGatedDoor pushes the message as a notification and stores
 *  the blocking requirement in useGatingStore so the GateBlockedHud can
 *  render a persistent explanation panel.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { useGameStore } from '../store/useGameStore'
import { useTaskStore } from '../store/useTaskStore'
import { useNotifications } from '../store/useNotifications'
import { useGatingStore } from '../store/useGatingStore'
import { useFactionStore } from '../store/useFactionStore'
import type { FactionTier } from '../store/useFactionStore'
import { TIER_REP } from '../store/useFactionStore'

// ─── Requirement types ────────────────────────────────────────────────────────

/** A single condition the player must satisfy to pass a gate. */
export type GateRequirement =
  | { kind: 'skill';   skillId: string;   skillName: string;   minLevel: number }
  | { kind: 'task';    taskId: string;     taskTitle: string }
  | { kind: 'item';    itemId: string;     itemName: string }
  | { kind: 'faction'; factionId: string; factionName: string; minTier: FactionTier }

// Re-export for convenience.
export type { FactionTier }

// ─── Evaluation ───────────────────────────────────────────────────────────────

export interface GateCheckResult {
  /** Whether the requirement is currently satisfied. */
  met: boolean
  /** Human-readable explanation; empty string when met. */
  message: string
}

/**
 * Evaluate a single GateRequirement against live game state.
 */
export function checkRequirement(req: GateRequirement): GateCheckResult {
  switch (req.kind) {
    case 'skill': {
      const { skills } = useGameStore.getState()
      const level = skills.skills.find((s) => s.id === req.skillId)?.level ?? 1
      if (level >= req.minLevel) return { met: true, message: '' }
      return {
        met: false,
        message: `Requires ${req.skillName} level ${req.minLevel} (you are level ${level}).`,
      }
    }
    case 'task': {
      const met = useTaskStore.getState().isCompleted(req.taskId)
      if (met) return { met: true, message: '' }
      return {
        met: false,
        message: `Complete the task "${req.taskTitle}" first.`,
      }
    }
    case 'item': {
      const { inventory } = useGameStore.getState()
      const has = inventory.slots.some((s) => s.id === req.itemId && s.quantity > 0)
      if (has) return { met: true, message: '' }
      return {
        met: false,
        message: `You need ${req.itemName} to pass.`,
      }
    }
    case 'faction': {
      const tier = useFactionStore.getState().getTrustTier(req.factionId)
      const tierOrder: FactionTier[] = ['neutral', 'acquainted', 'trusted', 'honored']
      const playerIdx = tierOrder.indexOf(tier)
      const requiredIdx = tierOrder.indexOf(req.minTier)
      if (playerIdx >= requiredIdx) return { met: true, message: '' }
      const needed = TIER_REP[req.minTier]
      const current = useFactionStore.getState().getRepForFaction(req.factionId)
      return {
        met: false,
        message: `Requires ${req.factionName} standing: ${req.minTier} (${needed} rep). You have ${current}.`,
      }
    }
  }
}

/**
 * Evaluate an ordered list of requirements.
 * Returns the first unmet result, or a met result if all pass.
 */
export function checkRequirements(
  reqs: GateRequirement[],
): GateCheckResult & { firstFailed: GateRequirement | null } {
  for (const req of reqs) {
    const result = checkRequirement(req)
    if (!result.met) return { ...result, firstFailed: req }
  }
  return { met: true, message: '', firstFailed: null }
}

// ─── Physical door builder ────────────────────────────────────────────────────

/** Configuration for a world-space gated door. */
export interface GatedDoorConfig {
  /** World-space position of the door centre. */
  x: number
  y: number
  z: number
  /** Door bounding box dimensions. */
  width: number
  height: number
  depth: number
  /** Interaction label shown in the prompt when the player is in range. */
  label: string
  /** Ordered list of requirements; evaluated in array order. */
  requirements: GateRequirement[]
  /** Door mesh base colour (default: 0x282020). */
  color?: number
  /** Emissive hint colour (default: 0x100808). */
  emissive?: number
  /** Message shown when the door successfully opens (default generic). */
  openMessage?: string
}

export interface GatedDoorResult {
  /** The door mesh.  Hide and remove from collidables when opened. */
  mesh: THREE.Mesh
  /** The door interactable.  Splice from interactables when opened. */
  interactable: Interactable
  /**
   * Returns true once — the frame after the player successfully opens the
   * door.  Clears the flag on read.  Call from App.tsx every frame.
   */
  pollOpened(): boolean
}

/**
 * Build a collidable door mesh at the specified position.
 *
 * The door's interactable checks all requirements on each interaction attempt.
 * If any requirement is unmet the first failure message is shown as a
 * notification and stored in useGatingStore for the persistent HUD.
 * When all requirements are met pollOpened() returns true on the next call.
 *
 * The caller (App.tsx) must:
 *  - push the returned mesh into collidables
 *  - call pollOpened() each frame
 *  - on true: hide the mesh, splice it from collidables (and collidableBoxes),
 *    and splice the interactable from interactables
 */
export function buildGatedDoor(
  scene: THREE.Scene,
  interactables: Interactable[],
  config: GatedDoorConfig,
): GatedDoorResult {
  const mat = new THREE.MeshStandardMaterial({
    color: config.color ?? 0x282020,
    roughness: 0.95,
    emissive: new THREE.Color(config.emissive ?? 0x100808),
    emissiveIntensity: 0.45,
  })
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(config.width, config.height, config.depth),
    mat,
  )
  mesh.position.set(config.x, config.y, config.z)
  scene.add(mesh)

  let _opened = false

  const interactable: Interactable = {
    mesh,
    label: config.label,
    interactRadius: 2.5,
    onInteract: () => {
      const result = checkRequirements(config.requirements)
      if (!result.met) {
        useNotifications.getState().push(result.message, 'info')
        if (result.firstFailed) {
          useGatingStore.getState().setBlockedRequirement(result.firstFailed)
        }
        return
      }
      _opened = true
      useGatingStore.getState().setBlockedRequirement(null)
      useNotifications.getState().push(
        config.openMessage ?? 'The way opens before you.',
        'success',
      )
    },
  }
  interactables.push(interactable)

  return {
    mesh,
    interactable,
    pollOpened() {
      if (_opened) {
        _opened = false
        return true
      }
      return false
    },
  }
}
