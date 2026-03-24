/**
 * Phase 95 — Weather System Pass
 *
 * Drives a probabilistic weather state machine that transitions between named
 * weather conditions and exposes per-state multipliers consumed by the
 * scene-update loop in App.tsx.
 *
 * Weather states
 * ──────────────
 *   clear    — bright, no fog modification
 *   overcast — grey skies, slightly thicker fog, reduced ambient
 *   rain     — heavier fog, noticeably darker ambient and directional light
 *   storm    — very dark, thick fog, strong ambient/directional reduction
 *   fog      — thick atmospheric fog, moderate light reduction
 *
 * Integration model
 * ─────────────────
 * App.tsx calls `tickWeather(delta)` every frame.  When a transition occurs
 * the function returns the new WeatherState so the caller can push a
 * notification and sync the Zustand store.  Between transitions it returns
 * `null`.
 *
 * Light and fog multipliers are additive atop the day/night baseline: the
 * caller multiplies the day/night ambient intensity by
 * `WEATHER_AMBIENT_MULTIPLIER[state]` before applying it to the Three.js
 * AmbientLight, and similarly for directional intensity and fog density.
 * The sky tint is blended into the scene background colour.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Named weather condition. */
export type WeatherState = 'clear' | 'overcast' | 'rain' | 'storm' | 'fog'

// ─── Duration ranges ──────────────────────────────────────────────────────────

/**
 * How long each weather state lasts before a new one is drawn.
 * Values are real-world seconds; [min, max].
 */
const DURATION_RANGE: Record<WeatherState, [number, number]> = {
  clear:    [120, 360],
  overcast: [ 60, 200],
  rain:     [ 60, 180],
  storm:    [ 30, 100],
  fog:      [ 60, 200],
}

// ─── Transition weights ───────────────────────────────────────────────────────

/**
 * Weighted transition table.  Each entry lists how likely the weather is to
 * transition to each state (including staying the same) when the current
 * state's duration expires.  Weights are normalised internally by
 * `pickNextWeather()`.
 *
 * Design intent:
 *   - clear   is stable; seldom transitions directly to storm.
 *   - storm   always resolves to rain or overcast, never back to clear.
 *   - fog     favours resolving to overcast or clear.
 */
const TRANSITION_WEIGHTS: Record<WeatherState, Record<WeatherState, number>> = {
  clear:    { clear: 4, overcast: 3, rain: 1, storm: 0, fog: 2 },
  overcast: { clear: 2, overcast: 2, rain: 4, storm: 1, fog: 1 },
  rain:     { clear: 1, overcast: 3, rain: 1, storm: 3, fog: 1 },
  storm:    { clear: 0, overcast: 3, rain: 4, storm: 0, fog: 3 },
  fog:      { clear: 3, overcast: 3, rain: 1, storm: 0, fog: 3 },
}

// ─── Scene multipliers ────────────────────────────────────────────────────────

/**
 * Fog density multiplier applied on top of the day/night baseline.
 * `1.0` leaves the day/night value unchanged.
 */
export const WEATHER_FOG_MULTIPLIER: Record<WeatherState, number> = {
  clear:    1.0,
  overcast: 1.4,
  rain:     2.0,
  storm:    3.0,
  fog:      4.0,
}

/**
 * Ambient light intensity multiplier applied on top of the day/night baseline.
 */
export const WEATHER_AMBIENT_MULTIPLIER: Record<WeatherState, number> = {
  clear:    1.0,
  overcast: 0.75,
  rain:     0.60,
  storm:    0.40,
  fog:      0.70,
}

/**
 * Directional (sun/moon) light intensity multiplier applied on top of the
 * day/night baseline.
 */
export const WEATHER_DIRECTIONAL_MULTIPLIER: Record<WeatherState, number> = {
  clear:    1.0,
  overcast: 0.55,
  rain:     0.35,
  storm:    0.15,
  fog:      0.40,
}

// ─── Display helpers ──────────────────────────────────────────────────────────

/** Return the Unicode icon that represents the given weather state. */
export function getWeatherIcon(state: WeatherState): string {
  switch (state) {
    case 'clear':    return '☀'
    case 'overcast': return '☁'
    case 'rain':     return '🌧'
    case 'storm':    return '⛈'
    case 'fog':      return '🌫'
  }
}

/** Return the display name for the given weather state. */
export function getWeatherName(state: WeatherState): string {
  switch (state) {
    case 'clear':    return 'Clear'
    case 'overcast': return 'Overcast'
    case 'rain':     return 'Rainy'
    case 'storm':    return 'Stormy'
    case 'fog':      return 'Foggy'
  }
}

/** Return a one-sentence ambient notification message for a weather transition. */
export function getWeatherTransitionMessage(state: WeatherState): string {
  switch (state) {
    case 'clear':
      return 'The clouds thin and clear skies return to Cinderglen Reach.'
    case 'overcast':
      return 'Heavy grey clouds roll across the valley, dimming the light.'
    case 'rain':
      return 'Rain begins to fall across Cinderglen Reach.'
    case 'storm':
      return 'A fierce storm sweeps in, darkening the sky and thickening the fog.'
    case 'fog':
      return 'A dense fog settles over the Reach, muffling sound and sight.'
  }
}

// ─── State machine ────────────────────────────────────────────────────────────

/** Current active weather condition. */
let _current: WeatherState = 'clear'

/** Seconds remaining before the next weather transition is evaluated. */
let _timeRemaining: number = 180

/** Return the current weather state (does not advance the simulation). */
export function getCurrentWeather(): WeatherState {
  return _current
}

/**
 * Pick the next weather state from the transition table for `from`.
 * Uses a weighted random draw; the sampled state may be the same as `from`.
 */
function pickNextWeather(from: WeatherState): WeatherState {
  const weights = TRANSITION_WEIGHTS[from]
  const total = (Object.values(weights) as number[]).reduce((s, w) => s + w, 0)
  let roll = Math.random() * total
  for (const [state, weight] of Object.entries(weights) as [WeatherState, number][]) {
    roll -= weight
    if (roll < 0) return state
  }
  return from
}

/** Sample a random duration (seconds) for the given weather state. */
function randomDuration(state: WeatherState): number {
  const [min, max] = DURATION_RANGE[state]
  return min + Math.random() * (max - min)
}

/**
 * Advance the weather simulation by `delta` real-world seconds.
 *
 * @returns The new `WeatherState` when a transition occurred this tick,
 *          or `null` if the weather is unchanged.
 */
export function tickWeather(delta: number): WeatherState | null {
  _timeRemaining -= delta
  if (_timeRemaining <= 0) {
    const next = pickNextWeather(_current)
    _current = next
    _timeRemaining = randomDuration(next)
    return next
  }
  return null
}
