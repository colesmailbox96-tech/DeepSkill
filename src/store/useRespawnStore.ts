/**
 * Phase 34 — Respawn Store
 *
 * Tracks whether the player has just been defeated so the React overlay can
 * block play until the player explicitly dismisses the respawn screen.
 *
 * The game loop (App.tsx) calls `triggerDefeat` when player HP reaches 0.
 * The overlay component calls `acknowledge` when the player clicks "Wake Up".
 */

import { create } from 'zustand'

export interface RespawnUIState {
  /** True while the defeat overlay should be shown. */
  defeated: boolean
  /**
   * Short label shown in the overlay to communicate where the player wakes.
   * Populated by the game loop via `triggerDefeat`.
   */
  recoveryLocation: string

  /**
   * Called by the game loop immediately on player defeat.
   * Sets `defeated = true` and stores the recovery location label.
   */
  triggerDefeat: (recoveryLocation: string) => void

  /**
   * Called when the player dismisses the overlay.
   * Clears the `defeated` flag so gameplay can resume.
   */
  acknowledge: () => void
}

export const useRespawnStore = create<RespawnUIState>((set) => ({
  defeated: false,
  recoveryLocation: '',

  triggerDefeat: (recoveryLocation) =>
    set({ defeated: true, recoveryLocation }),

  acknowledge: () =>
    set({ defeated: false, recoveryLocation: '' }),
}))
