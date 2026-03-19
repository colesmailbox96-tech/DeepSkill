/**
 * Phase 31 — Combat Loop Foundation
 *
 * Provides the player-side combat loop: target selection, per-frame attack
 * cooldown, auto-attack when in melee range, and the helpers needed to wire
 * creature kills and player-defeat recovery into App.tsx.
 *
 * Design:
 *   - The player targets one creature at a time (single-target melee).
 *   - Auto-attack fires whenever the player is within PLAYER_MELEE_RANGE of the
 *     target AND the attackTimer has expired.
 *   - damageCreature() (from creature.ts) is called with the computed damage so
 *     the creature's own HP accounting remains authoritative.
 *   - When a hit kills the target, onKill is called and the target is cleared.
 *   - Player defeat (HP ≤ 0) is detected by the caller via onPlayerDefeated;
 *     this module does not mutate player HP — that stays in useGameStore.
 */

import * as THREE from 'three'
import type { Creature } from './creature'
import { damageCreature } from './creature'

// ── Constants ─────────────────────────────────────────────────────────────────

/** Base player melee damage before equipment attack bonuses are applied. */
export const PLAYER_BASE_ATTACK = 5

/**
 * Distance (metres) within which the player can land a melee hit on a
 * targeted creature.  Intentionally slightly larger than the hostile
 * creature's own MELEE_RANGE (1.8 m) so the player can initiate a swing
 * just before the creature enters its own attack arc.
 */
export const PLAYER_MELEE_RANGE = 2.0

/** Base seconds between successive player attacks (unmodified by gear speed). */
export const PLAYER_ATTACK_COOLDOWN = 1.5

// ── State ─────────────────────────────────────────────────────────────────────

/** Mutable per-session combat state (held in a ref inside App.tsx). */
export interface CombatState {
  /** Currently targeted creature; null when idle. */
  target: Creature | null
  /** Seconds until the player can swing again; 0 = ready. */
  attackTimer: number
}

/** Construct a fresh, idle combat state. */
export function createCombatState(): CombatState {
  return { target: null, attackTimer: 0 }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Set (or clear) the current combat target.
 *
 * Passing `null` deselects without resetting attackTimer so an in-flight
 * swing does not reset when the target changes.
 */
export function setTarget(state: CombatState, creature: Creature | null): void {
  state.target = creature
}

/**
 * Advance the combat loop one frame.
 *
 * Ticks the attack cooldown; auto-attacks when the target is alive and within
 * PLAYER_MELEE_RANGE; clears the target on kill.
 *
 * @param state        Live CombatState (mutated in place).
 * @param delta        Frame time in seconds.
 * @param playerPos    Current player world-space position.
 * @param equipAttack  Total attack bonus from currently equipped gear.
 * @param onHit        Callback when the player lands a hit; receives the target
 *                     and the final damage value.
 * @param onKill       Callback when a hit kills the target.
 */
export function updateCombat(
  state: CombatState,
  delta: number,
  playerPos: THREE.Vector3,
  equipAttack: number,
  onHit: (target: Creature, damage: number) => void,
  onKill: (target: Creature) => void,
): void {
  // Tick attack cooldown every frame regardless of target.
  if (state.attackTimer > 0) {
    state.attackTimer = Math.max(0, state.attackTimer - delta)
  }

  const { target } = state
  if (!target) return

  // Auto-clear dead targets (killed by something else or respawn not yet done).
  if (target.state === 'dead') {
    state.target = null
    return
  }

  // Auto-attack when in range and the cooldown has expired.
  const dx = target.mesh.position.x - playerPos.x
  const dz = target.mesh.position.z - playerPos.z
  const dist = Math.sqrt(dx * dx + dz * dz)

  if (dist <= PLAYER_MELEE_RANGE && state.attackTimer <= 0) {
    const damage = Math.max(1, PLAYER_BASE_ATTACK + equipAttack)
    const killed = damageCreature(target, damage)
    onHit(target, damage)
    if (killed) {
      onKill(target)
      state.target = null
    }
    state.attackTimer = PLAYER_ATTACK_COOLDOWN
  }
}
