/**
 * Phase 83 — Boss Encounter Framework
 *
 * Provides the infrastructure for rare, major fights without requiring a full
 * combat rewrite.  Four concerns are handled here:
 *
 *   1. Arena state rules
 *      An arena is an axis-aligned bounding box in world space.  The system
 *      tracks whether the player is inside and fires enter/exit callbacks so
 *      callers can lock doors, trigger music, or log encounters.
 *
 *   2. Boss health-bar style (data layer)
 *      `useBossStore` (see src/store/useBossStore.ts) holds the reactive data
 *      consumed by the BossHealthBar React component.  This module writes to
 *      that store via the callbacks passed to `updateBossArena`.
 *
 *   3. Special behaviour hooks
 *      Each arena may carry an array of `BossSpecialMove` descriptors.  A
 *      per-move cooldown timer is managed here; when a move's timer expires
 *      inside an active encounter its `execute` function is called with the
 *      current boss and player positions plus a `dealDamage` callback.  This
 *      keeps all the fight-specific logic in the caller (App.tsx / Phase 84)
 *      while the timing plumbing lives in this module.
 *
 *   4. Reset logic
 *      If the player escapes the arena while the boss is still alive a short
 *      grace delay runs.  On expiry `resetBossArena` restores the boss to full
 *      HP and teleports it back to its spawn.  Player defeat (handled by the
 *      existing respawn system in App.tsx) also triggers this path so the boss
 *      is never left in a half-dead state between attempts.
 */

import * as THREE from 'three'
import type { Creature } from './creature'

// ── Public types ───────────────────────────────────────────────────────────────

/**
 * Static definition for a boss arena.  One `BossArenaConfig` is authored per
 * boss encounter.  Multiple live `BossArenaState` instances can share the same
 * config (e.g. if the player can re-fight the boss).
 */
export interface BossArenaConfig {
  /** Unique identifier matching the creature def's `bossArenaId` field. */
  id: string
  /** Minimum world-space X of the arena footprint. */
  minX: number
  /** Maximum world-space X of the arena footprint. */
  maxX: number
  /** Minimum world-space Z of the arena footprint. */
  minZ: number
  /** Maximum world-space Z of the arena footprint. */
  maxZ: number
  /**
   * Seconds after the player leaves the arena before the boss resets.
   * A small grace window (e.g. 3 s) prevents resets from accidental nudges
   * against the boundary.
   */
  escapeResetDelay: number
}

/**
 * Defines a HP threshold at which the boss's behaviour intensifies.
 *
 * Thresholds are evaluated in descending order of `hpFraction`; once a
 * threshold is activated it will not fire again even if the boss is healed.
 */
export interface BossPhaseThreshold {
  /**
   * Fraction of maximum HP at which this phase activates (0–1).
   * A value of 0.5 triggers when current HP falls to ≤ 50 % of max.
   */
  hpFraction: number
  /**
   * Multiplier applied to the boss's attack cooldown while this phase is active.
   * Values < 1 speed the boss up (e.g. 0.7 = 30 % faster attacks).
   */
  attackCooldownMult: number
  /**
   * Short label shown in the notification feed when the phase activates
   * (e.g. "The Husk enters a frenzy!").
   */
  phaseLabel: string
}

/**
 * A special move the boss can execute during the encounter.
 *
 * The move framework only handles the cooldown; all targeting, range checks,
 * and damage are delegated to the `execute` callback so Phase 84+ can author
 * arbitrary effects without touching this module.
 */
export interface BossSpecialMove {
  /** Unique identifier for logging / debug purposes. */
  id: string
  /** Seconds between successive uses of this move. */
  cooldown: number
  /**
   * Called when the cooldown expires and the boss is alive.
   *
   * @param bossPos   Current world-space position of the boss.
   * @param playerPos Current world-space position of the player.
   * @param dealDamage Callback to deal the specified amount of damage to the
   *                   player (caller wires this to `useGameStore.takeDamage`).
   * @returns `true` when the move was actually used so the cooldown resets.
   *          Return `false` to leave the move on cooldown without consuming it
   *          (e.g. player out of range).
   */
  execute: (
    bossPos: THREE.Vector3,
    playerPos: THREE.Vector3,
    dealDamage: (amount: number) => void,
  ) => boolean
}

// ── Mutable per-encounter state ────────────────────────────────────────────────

/**
 * Live state for a single boss arena, held in a ref inside App.tsx.
 *
 * Created with `createBossArenaState(config)` and updated every frame by
 * `updateBossArena(...)`.
 */
export interface BossArenaState {
  /** The static definition this state belongs to. */
  config: BossArenaConfig
  /** True while the player is inside the arena AABB. */
  playerInside: boolean
  /**
   * 1-based index of the current boss-phase (starts at 1, increments when HP
   * crosses a `BossPhaseThreshold`).
   */
  currentPhase: number
  /**
   * Per-move remaining cooldown timers (seconds).
   * Indexed to match the `specialMoves` array passed to `updateBossArena`.
   */
  specialTimers: number[]
  /**
   * Countdown (seconds) after the player exits the arena.
   * While > 0 the boss has not yet reset; hits 0 → `resetBossArena` fires.
   * -1 when the player is inside (no pending reset).
   */
  escapeTimer: number
  /** True once the boss has been defeated this session (suppresses further updates). */
  bossDefeated: boolean
}

/** Construct a fresh arena state for the given config. */
export function createBossArenaState(config: BossArenaConfig): BossArenaState {
  return {
    config,
    playerInside: false,
    currentPhase: 1,
    specialTimers: [],
    escapeTimer: -1,
    bossDefeated: false,
  }
}

// ── Arena helpers ──────────────────────────────────────────────────────────────

/**
 * Returns `true` when `playerPos` lies within the arena's AABB footprint.
 * The Y axis is intentionally ignored so vertical movement (jumping, slopes)
 * does not accidentally trigger boundary events.
 */
export function isInsideBossArena(
  arenaState: BossArenaState,
  playerPos: THREE.Vector3,
): boolean {
  const { minX, maxX, minZ, maxZ } = arenaState.config
  return (
    playerPos.x >= minX && playerPos.x <= maxX &&
    playerPos.z >= minZ && playerPos.z <= maxZ
  )
}

// ── Per-frame update ───────────────────────────────────────────────────────────

/**
 * Advance one frame of boss-encounter logic.
 *
 * This function is the main integration point between the static arena/phase
 * data and the live Three.js world.  Call it once per arena every frame from
 * the App.tsx animation loop (before the combat sync block).
 *
 * @param arenaState    The mutable arena state to advance.
 * @param delta         Frame time in seconds.
 * @param boss          The live Creature instance for this boss.
 * @param playerPos     Current player world-space position.
 * @param phaseThresholds
 *    Sorted (descending hpFraction) list of phase transitions.  May be empty.
 * @param specialMoves  List of special moves the boss can use.  May be empty.
 * @param dealDamage    Forwards damage from special moves to the player.
 * @param onArenaEnter  Called the first frame the player enters the arena.
 * @param onArenaExit   Called the first frame the player exits the arena.
 * @param onPhaseChange Called when a phase threshold is crossed; receives the
 *                      new 1-based phase index and the threshold descriptor.
 * @param onBossDefeated Called once when the boss HP reaches 0 inside the arena.
 * @param onArenaReset  Called when the escape timer expires and the boss resets.
 */
export function updateBossArena(
  arenaState: BossArenaState,
  delta: number,
  boss: Creature,
  playerPos: THREE.Vector3,
  phaseThresholds: BossPhaseThreshold[],
  specialMoves: BossSpecialMove[],
  dealDamage: (amount: number) => void,
  onArenaEnter: () => void,
  onArenaExit: () => void,
  onPhaseChange: (newPhase: number, threshold: BossPhaseThreshold) => void,
  onBossDefeated: () => void,
  onArenaReset: () => void,
): void {
  // Once defeated, this arena no longer drives updates.
  if (arenaState.bossDefeated) return

  // ── Initialise special-move timers on first call ──────────────────────────
  if (arenaState.specialTimers.length !== specialMoves.length) {
    arenaState.specialTimers = specialMoves.map((m) => m.cooldown * 0.5)
  }

  // ── Boss defeated check ───────────────────────────────────────────────────
  if (boss.state === 'dead') {
    if (arenaState.playerInside) {
      arenaState.bossDefeated = true
      onBossDefeated()
    }
    return
  }

  // ── Player-inside AABB check ──────────────────────────────────────────────
  const nowInside = isInsideBossArena(arenaState, playerPos)

  if (nowInside && !arenaState.playerInside) {
    arenaState.playerInside = true
    arenaState.escapeTimer = -1
    onArenaEnter()
  } else if (!nowInside && arenaState.playerInside) {
    arenaState.playerInside = false
    arenaState.escapeTimer = arenaState.config.escapeResetDelay
    onArenaExit()
  }

  // ── Escape timer / reset ──────────────────────────────────────────────────
  if (!arenaState.playerInside && arenaState.escapeTimer > 0) {
    arenaState.escapeTimer = Math.max(0, arenaState.escapeTimer - delta)
    if (arenaState.escapeTimer === 0) {
      resetBossArena(arenaState, boss)
      onArenaReset()
      return
    }
  }

  // Only drive active-encounter logic while the player is inside.
  if (!arenaState.playerInside) return

  // ── Phase threshold transitions ───────────────────────────────────────────
  const maxHp = boss.def.maxHp ?? boss.hp
  // Walk thresholds from highest hpFraction down; activate the first one whose
  // hpFraction maps to a phase index > currentPhase.
  for (let ti = 0; ti < phaseThresholds.length; ti++) {
    const threshold = phaseThresholds[ti]
    const thresholdPhase = ti + 2  // phase 1 is default; threshold 0 = phase 2, etc.
    if (
      thresholdPhase > arenaState.currentPhase &&
      boss.hp <= threshold.hpFraction * maxHp
    ) {
      arenaState.currentPhase = thresholdPhase
      onPhaseChange(thresholdPhase, threshold)
      break // only one phase transition per frame
    }
  }

  // ── Special move cooldowns ────────────────────────────────────────────────
  const bossPos = new THREE.Vector3()
  boss.mesh.getWorldPosition(bossPos)

  for (let si = 0; si < specialMoves.length; si++) {
    arenaState.specialTimers[si] = Math.max(
      0,
      arenaState.specialTimers[si] - delta,
    )
    if (arenaState.specialTimers[si] === 0) {
      const used = specialMoves[si].execute(bossPos, playerPos, dealDamage)
      if (used) {
        arenaState.specialTimers[si] = specialMoves[si].cooldown
      } else {
        // Move wasn't used (e.g. out of range); retry after a short interval.
        arenaState.specialTimers[si] = 1.0
      }
    }
  }
}

// ── Reset ──────────────────────────────────────────────────────────────────────

/**
 * Restore a boss to its initial state after the player escapes the arena.
 *
 * - HP is restored to `def.maxHp`.
 * - The creature FSM is forced to 'idle'.
 * - The mesh is teleported back to the creature's spawn origin.
 * - The mesh is made visible again (it may have been hidden by the dead state).
 * - Special-move timers are cleared to zero.
 * - The current phase reverts to 1.
 * - `escapeTimer` is cleared.
 *
 * The respawn animation is intentionally skipped so the boss is immediately
 * usable on re-entry without waiting for the normal respawn delay.
 */
export function resetBossArena(
  arenaState: BossArenaState,
  boss: Creature,
): void {
  // Restore HP and FSM.
  boss.hp = boss.def.maxHp ?? boss.hp
  boss.state = 'idle'
  boss.attackTimer = 0
  boss.respawnTimer = 0

  // Teleport to spawn origin.
  boss.mesh.position.set(boss.spawnPos.x, boss.spawnPos.y, boss.spawnPos.z)
  boss.mesh.visible = true

  // Reset encounter state.
  arenaState.currentPhase = 1
  arenaState.playerInside = false
  arenaState.escapeTimer = -1
  arenaState.bossDefeated = false
  // Zero out all special-move timers so moves can fire shortly after re-entry.
  arenaState.specialTimers = arenaState.specialTimers.map(() => 0)
}

// ── Registry ───────────────────────────────────────────────────────────────────

/**
 * Convenience bundle grouping all data needed to run a single boss encounter.
 * App.tsx builds one `BossArenaEntry` per boss creature that has `isBoss: true`
 * and a matching `bossArenaId`.
 */
export interface BossArenaEntry {
  /** Live mutable state for this arena encounter. */
  arenaState: BossArenaState
  /** The Creature instance that is the boss. */
  boss: Creature
  /**
   * Ordered list of phase transitions for this boss.
   * Should be sorted in descending `hpFraction` order (highest first).
   * Phase 84+ will populate these.
   */
  phaseThresholds: BossPhaseThreshold[]
  /**
   * Special moves the boss can execute during the encounter.
   * Phase 84+ will populate these.
   */
  specialMoves: BossSpecialMove[]
}

/**
 * Global registry of boss arena configurations.
 *
 * Phase 83 ships an empty array — no boss is placed yet.
 * Phase 84 appends its arena config object here before buildCreatures() runs.
 */
export const BOSS_ARENA_CONFIGS: BossArenaConfig[] = []
