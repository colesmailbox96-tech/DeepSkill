/**
 * Phase 96 — Demo Store
 *
 * Tracks whether the player has dismissed the demo welcome overlay.
 * Resets to false whenever a New Game is started so the overlay
 * appears once per fresh playthrough.
 */
import { create } from 'zustand'

interface DemoState {
  /** True after the player has dismissed the demo welcome overlay. */
  welcomeSeen: boolean

  setWelcomeSeen: (seen: boolean) => void
}

export const useDemoStore = create<DemoState>((set) => ({
  welcomeSeen: false,

  setWelcomeSeen: (seen) => set({ welcomeSeen: seen }),
}))
