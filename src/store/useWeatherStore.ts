/**
 * Phase 95 — Weather Store
 *
 * Tracks the current weather state, display name, and icon so React HUD
 * components can subscribe without polling the Three.js scene every render.
 * Updated on each weather transition from App.tsx.
 */

import { create } from 'zustand'
import type { WeatherState } from '../engine/weather'
import {
  getCurrentWeather,
  getWeatherName,
  getWeatherIcon,
} from '../engine/weather'

interface WeatherStoreState {
  /** Active weather condition. */
  weatherState: WeatherState
  /** Human-readable name (e.g. "Clear", "Stormy"). */
  weatherName: string
  /** Unicode icon representing the current weather. */
  weatherIcon: string
  /** Sync all three fields at once; called by App.tsx on each transition. */
  setWeather: (state: WeatherState) => void
}

const _initial = getCurrentWeather()

export const useWeatherStore = create<WeatherStoreState>((set) => ({
  weatherState: _initial,
  weatherName:  getWeatherName(_initial),
  weatherIcon:  getWeatherIcon(_initial),
  setWeather: (state: WeatherState) =>
    set({
      weatherState: state,
      weatherName:  getWeatherName(state),
      weatherIcon:  getWeatherIcon(state),
    }),
}))
