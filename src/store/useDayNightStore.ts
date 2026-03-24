/**
 * Phase 92 — Day/Night Store
 *
 * Tracks the current in-game time and named period so React HUD components can
 * subscribe without polling the Three.js scene every render.
 */

import { create } from 'zustand'
import type { DayPeriod } from '../engine/daynight'
import { START_HOUR, getPeriodName } from '../engine/daynight'

interface DayNightState {
  /** Current in-game hour, float in [0, 24). */
  timeOfDay: number
  /** Coarse named period derived from timeOfDay. */
  periodName: DayPeriod
  /** Update both fields at once (called each frame from App.tsx). */
  setTime: (hour: number) => void
}

export const useDayNightStore = create<DayNightState>((set) => ({
  timeOfDay: START_HOUR,
  periodName: getPeriodName(START_HOUR),
  setTime: (hour: number) => {
    const wrapped = ((hour % 24) + 24) % 24
    set({ timeOfDay: wrapped, periodName: getPeriodName(wrapped) })
  },
}))
