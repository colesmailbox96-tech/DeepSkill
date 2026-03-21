/**
 * Phase 44 — Surveying Store
 * Phase 45 — Hidden Cache System
 *
 * Minimal Zustand store for the SurveyingPanel open/close state and for
 * tracking whether survey mode is currently active.
 *
 * The panel is toggled via the E interaction key (near the survey stone) or
 * the Y key (while near the survey stone).
 *
 * Phase 45 adds cacheStatusList so the panel can display live cooldown state.
 */

import { create } from 'zustand'
import type { CacheStatusEntry } from '../engine/surveying'

interface SurveyingState {
  isOpen: boolean
  /** True while a survey sweep is actively running. */
  surveyActive: boolean
  /** Seconds remaining in the current sweep (counts down from SURVEY_MODE_DURATION). */
  surveyTimeRemaining: number
  /** Live status of every cache — updated periodically (≈1 Hz) from the App.tsx game loop. */
  cacheStatusList: CacheStatusEntry[]
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
  startSurvey: (duration: number) => void
  endSurvey: () => void
  tickSurvey: (delta: number) => void
  /** Replace the cache status snapshot (called from App.tsx game loop). */
  updateCacheStatus: (list: CacheStatusEntry[]) => void
}

export const useSurveyingStore = create<SurveyingState>((set) => ({
  isOpen: false,
  surveyActive: false,
  surveyTimeRemaining: 0,
  cacheStatusList: [],
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
  togglePanel: () => set((s) => ({ isOpen: !s.isOpen })),
  startSurvey: (duration) => set({ surveyActive: true, surveyTimeRemaining: duration }),
  endSurvey: () => set({ surveyActive: false, surveyTimeRemaining: 0 }),
  tickSurvey: (delta) =>
    set((s) => {
      if (!s.surveyActive) return s
      const next = s.surveyTimeRemaining - delta
      if (next <= 0) return { surveyActive: false, surveyTimeRemaining: 0 }
      return { surveyTimeRemaining: next }
    }),
  updateCacheStatus: (list) => set({ cacheStatusList: list }),
}))
