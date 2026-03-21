/**
 * Phase 50 — Save / Load Store
 *
 * Zustand store for Save / Load panel UI state.
 * Tracks open/close state, last-saved timestamp, and whether a save exists
 * so the panel can render appropriate feedback without touching localStorage
 * directly.
 */
import { create } from 'zustand'
import { hasSaveData } from './useSaveLoad'

interface SaveLoadState {
  /** Whether the save/load panel is currently visible. */
  isOpen: boolean
  /** Unix ms timestamp of the last successful save, or null before first save. */
  lastSavedAt: number | null
  /** Cached result of hasSaveData() — updated whenever a save or clear occurs. */
  hasSave: boolean

  openPanel:   () => void
  closePanel:  () => void
  togglePanel: () => void
  /** Call after a successful save to record the timestamp and refresh hasSave. */
  notifySaved: () => void
  /** Call after clearing save data to update hasSave. */
  notifyCleared: () => void
}

export const useSaveLoadStore = create<SaveLoadState>((set) => ({
  isOpen:      false,
  lastSavedAt: null,
  hasSave:     hasSaveData(),

  openPanel:    () => set({ isOpen: true }),
  closePanel:   () => set({ isOpen: false }),
  togglePanel:  () => set((s) => ({ isOpen: !s.isOpen })),
  notifySaved:  () => set({ lastSavedAt: Date.now(), hasSave: true }),
  notifyCleared: () => set({ lastSavedAt: null, hasSave: false }),
}))
