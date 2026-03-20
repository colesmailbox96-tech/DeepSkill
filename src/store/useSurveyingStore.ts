/**
 * Phase 44 — Surveying Store
 *
 * Minimal Zustand store for the SurveyingPanel open/close state and for
 * tracking whether survey mode is currently active.
 *
 * The panel is toggled via the E interaction key (near the survey stone) or
 * the Y key (while near the survey stone).
 */

import { create } from 'zustand'

interface SurveyingState {
  isOpen: boolean
  /** True while a survey sweep is actively running. */
  surveyActive: boolean
  /** Seconds remaining in the current sweep (counts down from SURVEY_MODE_DURATION). */
  surveyTimeRemaining: number
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
  startSurvey: (duration: number) => void
  endSurvey: () => void
  tickSurvey: (delta: number) => void
}

export const useSurveyingStore = create<SurveyingState>((set) => ({
  isOpen: false,
  surveyActive: false,
  surveyTimeRemaining: 0,
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
}))
