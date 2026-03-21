/**
 * Phase 48 — Hazard Store
 *
 * Tracks the player's current environmental hazard state so that the warning
 * HUD can react without polling on every React render.
 */

import { create } from 'zustand'

interface HazardState {
  /** ID of the hazard zone the player is currently inside, or null. */
  activeHazardId: string | null
  /** True when the player carries a ward item that nullifies the active hazard. */
  isProtected: boolean
  /** Set both fields atomically. */
  setActiveHazard: (id: string, isProtected: boolean) => void
  /** Call when the player leaves all hazard volumes. */
  clearHazard: () => void
}

export const useHazardStore = create<HazardState>((set) => ({
  activeHazardId: null,
  isProtected: false,
  setActiveHazard: (id, isProtected) =>
    set({ activeHazardId: id, isProtected }),
  clearHazard: () => set({ activeHazardId: null, isProtected: false }),
}))
