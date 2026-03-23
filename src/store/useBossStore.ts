/**
 * Phase 83 — Boss Store
 *
 * Holds the reactive boss-encounter display data consumed by BossHealthBar.
 * The game loop (App.tsx) writes to this store each frame when a boss fight is
 * active so the React overlay stays current without coupling Three.js state
 * directly to React components.
 *
 * Design mirrors useCombatStore (Phase 31) but is extended with a phase
 * counter so the UI can render a segmented bar with phase transition markers.
 */

import { create } from 'zustand'

export interface BossUIState {
  /** True while an active boss encounter is in progress. */
  isBossActive: boolean
  /** Display name of the boss, or null when no encounter is active. */
  bossName: string | null
  /** Current HP of the boss (0 when inactive). */
  bossHp: number
  /** Maximum HP of the boss (0 when inactive). */
  bossMaxHp: number
  /**
   * Current phase of the encounter (1-based).  Phase 1 = normal.  Increments
   * as HP falls through configured thresholds.  Used by BossHealthBar to shade
   * the segments and render a "PHASE X" badge.
   */
  bossPhase: number
  /**
   * Total number of phases defined for this encounter (≥ 1).  Equals
   * `phaseThresholds.length + 1` so the HUD knows how many segments to draw.
   */
  bossMaxPhase: number

  /** Update all boss display data.  Called every frame by the game loop. */
  setBossInfo: (
    name: string,
    hp: number,
    maxHp: number,
    phase: number,
    maxPhase: number,
  ) => void
  /** Clear the boss display.  Called when the encounter ends (victory or reset). */
  clearBoss: () => void
}

export const useBossStore = create<BossUIState>((set) => ({
  isBossActive: false,
  bossName: null,
  bossHp: 0,
  bossMaxHp: 0,
  bossPhase: 1,
  bossMaxPhase: 1,

  setBossInfo: (name, hp, maxHp, phase, maxPhase) =>
    set((state) => {
      if (
        state.isBossActive &&
        state.bossName === name &&
        state.bossHp === hp &&
        state.bossMaxHp === maxHp &&
        state.bossPhase === phase &&
        state.bossMaxPhase === maxPhase
      ) {
        return state
      }
      return { isBossActive: true, bossName: name, bossHp: hp, bossMaxHp: maxHp, bossPhase: phase, bossMaxPhase: maxPhase }
    }),

  clearBoss: () =>
    set({ isBossActive: false, bossName: null, bossHp: 0, bossMaxHp: 0, bossPhase: 1, bossMaxPhase: 1 }),
}))
