/**
 * Phase 51 — Main Menu Store
 *
 * Tracks whether the main-menu / title screen is currently visible.
 * The menu is shown on boot and hidden as soon as the player chooses
 * "Continue" or "New Game".  It can be re-opened later if needed (e.g.
 * from a future in-game pause screen).
 */
import { create } from 'zustand'

interface MainMenuState {
  /** True while the title / main-menu overlay is rendered. */
  isVisible: boolean

  show: () => void
  hide: () => void
}

export const useMainMenuStore = create<MainMenuState>((set) => ({
  isVisible: true,

  show: () => set({ isVisible: true }),
  hide: () => set({ isVisible: false }),
}))
