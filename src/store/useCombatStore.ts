/**
 * Phase 31 — Combat Store
 *
 * Holds the reactive combat-target display data used by CombatTargetHud.
 * The game loop (App.tsx) writes to this store each frame so that the React
 * overlay always reflects the targeted creature's live HP without coupling
 * the Three.js state directly to React components.
 */

import { create } from 'zustand'

export interface CombatUIState {
  /** Display name of the current target, or null when idle. */
  targetName: string | null
  /** Live HP of the current target (0 when idle). */
  targetHp: number
  /** Maximum HP of the current target (0 when idle). */
  targetMaxHp: number

  /** Update target display data.  Called every frame by the game loop. */
  setTargetInfo: (name: string, hp: number, maxHp: number) => void
  /** Clear the target display (called when the target is deselected or killed). */
  clearTarget: () => void
}

export const useCombatStore = create<CombatUIState>((set) => ({
  targetName: null,
  targetHp: 0,
  targetMaxHp: 0,

  setTargetInfo: (name, hp, maxHp) =>
    set({ targetName: name, targetHp: hp, targetMaxHp: maxHp }),

  clearTarget: () =>
    set({ targetName: null, targetHp: 0, targetMaxHp: 0 }),
}))
