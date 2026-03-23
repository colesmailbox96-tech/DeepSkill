/**
 * Phase 68 — Lighting Store
 *
 * Tracks the player's current dark-zone state so the DarknessHud and
 * per-frame App.tsx logic can react without excessive polling.
 */

import { create } from 'zustand'

interface LightingState {
  /** ID of the dark zone the player is currently inside, or null. */
  activeDarkZoneId: string | null
  /**
   * True when the player carries a light source (hollow_lantern equipped)
   * that negates the darkness.
   */
  isLit: boolean
  /** Set both fields atomically. */
  setDarkZone: (id: string, isLit: boolean) => void
  /** Call when the player leaves all dark volumes. */
  clearDarkZone: () => void
}

export const useLightingStore = create<LightingState>((set) => ({
  activeDarkZoneId: null,
  isLit: false,
  setDarkZone: (id, isLit) => set({ activeDarkZoneId: id, isLit }),
  clearDarkZone: () => set({ activeDarkZoneId: null, isLit: false }),
}))
