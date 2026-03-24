/**
 * Phase 92 — Day/Night Cycle
 *
 * Drives a continuously advancing time-of-day that feeds colour and intensity
 * values into the scene's ambient and directional lights, sky (background)
 * colour, and atmospheric fog.
 *
 * Time model
 * ──────────
 * `timeOfDay` is a float in [0, 24) representing the current in-game hour.
 * One full cycle lasts CYCLE_SECONDS real-world seconds (default 480 s ≈ 8 min).
 *
 * Periods
 * ───────
 *   Night  00:00–05:00  (dark blue sky, greatly reduced light)
 *   Dawn   05:00–07:00  (amber-rose gradient, soft warm glow)
 *   Day    07:00–18:00  (bright sky-blue, full sun)
 *   Dusk   18:00–20:00  (deep amber-orange)
 *   Night  20:00–24:00  (returns to night)
 *
 * All colour and intensity values are looked up by hour using linear keyframe
 * interpolation so transitions are smooth.
 */

import * as THREE from 'three'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Named period of the day. */
export type DayPeriod = 'night' | 'dawn' | 'day' | 'dusk'

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Real-world seconds for one full in-game day cycle.
 * 480 s ≈ 8 real minutes.
 */
export const CYCLE_SECONDS = 480

/**
 * Starting time of day (hours).  The game begins mid-morning so the player's
 * first session is in bright daylight.
 */
export const START_HOUR = 9

// ─── Keyframes ────────────────────────────────────────────────────────────────

/** A single keyframe anchored at a specific hour. */
interface Keyframe {
  hour: number
  sky: number
  ambientColor: number
  ambientIntensity: number
  directionalColor: number
  directionalIntensity: number
  fogColor: number
  fogDensity: number
}

/**
 * Colour and intensity keyframes sampled at key hours.
 * Must be sorted ascending by `hour`.  Hours 0 and 24 are both supplied so
 * interpolation wraps cleanly across midnight.
 */
const KEYFRAMES: Keyframe[] = [
  // ── Midnight / deep night ──────────────────────────────────────────────────
  {
    hour: 0,
    sky: 0x060b18,
    ambientColor: 0x1a2535,
    ambientIntensity: 0.12,
    directionalColor: 0x0d1f40,
    directionalIntensity: 0.10,
    fogColor: 0x06090f,
    fogDensity: 0.018,
  },
  // ── Pre-dawn ───────────────────────────────────────────────────────────────
  {
    hour: 4.5,
    sky: 0x0d1525,
    ambientColor: 0x1e2d45,
    ambientIntensity: 0.14,
    directionalColor: 0x0d1f40,
    directionalIntensity: 0.12,
    fogColor: 0x0a0f1a,
    fogDensity: 0.020,
  },
  // ── Dawn break ────────────────────────────────────────────────────────────
  {
    hour: 5.5,
    sky: 0xa84820,
    ambientColor: 0xe07040,
    ambientIntensity: 0.30,
    directionalColor: 0xff9050,
    directionalIntensity: 0.55,
    fogColor: 0x7a3015,
    fogDensity: 0.015,
  },
  // ── Sunrise / golden hour ─────────────────────────────────────────────────
  {
    hour: 6.5,
    sky: 0xd07840,
    ambientColor: 0xf0b060,
    ambientIntensity: 0.38,
    directionalColor: 0xffd090,
    directionalIntensity: 0.90,
    fogColor: 0x905030,
    fogDensity: 0.010,
  },
  // ── Full day ──────────────────────────────────────────────────────────────
  {
    hour: 9,
    sky: 0x6a9fd8,
    ambientColor: 0xffffff,
    ambientIntensity: 0.45,
    directionalColor: 0xffe2c2,
    directionalIntensity: 1.25,
    fogColor: 0x9ac0e8,
    fogDensity: 0.005,
  },
  // ── Afternoon ─────────────────────────────────────────────────────────────
  {
    hour: 15,
    sky: 0x6a9fd8,
    ambientColor: 0xffffff,
    ambientIntensity: 0.45,
    directionalColor: 0xffe2c2,
    directionalIntensity: 1.20,
    fogColor: 0x9ac0e8,
    fogDensity: 0.005,
  },
  // ── Late afternoon ────────────────────────────────────────────────────────
  {
    hour: 17,
    sky: 0xc07040,
    ambientColor: 0xe09050,
    ambientIntensity: 0.35,
    directionalColor: 0xff9040,
    directionalIntensity: 0.80,
    fogColor: 0x803020,
    fogDensity: 0.008,
  },
  // ── Dusk ─────────────────────────────────────────────────────────────────
  {
    hour: 18.5,
    sky: 0x7a2810,
    ambientColor: 0xb05030,
    ambientIntensity: 0.25,
    directionalColor: 0xd06020,
    directionalIntensity: 0.40,
    fogColor: 0x501808,
    fogDensity: 0.014,
  },
  // ── Twilight ──────────────────────────────────────────────────────────────
  {
    hour: 20,
    sky: 0x0e1830,
    ambientColor: 0x202d50,
    ambientIntensity: 0.15,
    directionalColor: 0x0d1f40,
    directionalIntensity: 0.12,
    fogColor: 0x080c18,
    fogDensity: 0.017,
  },
  // ── Night (end of cycle = same as hour 0) ─────────────────────────────────
  {
    hour: 24,
    sky: 0x060b18,
    ambientColor: 0x1a2535,
    ambientIntensity: 0.12,
    directionalColor: 0x0d1f40,
    directionalIntensity: 0.10,
    fogColor: 0x06090f,
    fogDensity: 0.018,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Linear interpolation of two packed hex colours, returning a THREE.Color. */
function lerpColor(hexA: number, hexB: number, t: number): THREE.Color {
  const r1 = (hexA >> 16) & 0xff
  const g1 = (hexA >> 8) & 0xff
  const b1 = hexA & 0xff
  const r2 = (hexB >> 16) & 0xff
  const g2 = (hexB >> 8) & 0xff
  const b2 = hexB & 0xff
  return new THREE.Color(
    ((r1 + (r2 - r1) * t) / 255),
    ((g1 + (g2 - g1) * t) / 255),
    ((b1 + (b2 - b1) * t) / 255),
  )
}

/**
 * Find the two keyframes that bracket `hour` and return the blend factor `t`
 * (0 = fully A, 1 = fully B).
 */
function findBracket(hour: number): { a: Keyframe; b: Keyframe; t: number } {
  // hour is always in [0, 24)
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const a = KEYFRAMES[i]
    const b = KEYFRAMES[i + 1]
    if (hour >= a.hour && hour < b.hour) {
      const t = (hour - a.hour) / (b.hour - a.hour)
      return { a, b, t }
    }
  }
  // Fallback — should not be reached if hour ∈ [0, 24)
  const a = KEYFRAMES[KEYFRAMES.length - 2]
  const b = KEYFRAMES[KEYFRAMES.length - 1]
  return { a, b, t: 1 }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Advance `timeOfDay` by `delta` seconds.
 * Returns the new time in [0, 24).
 */
export function tickDayNight(timeOfDay: number, delta: number): number {
  const hoursPerSecond = 24 / CYCLE_SECONDS
  return (timeOfDay + delta * hoursPerSecond) % 24
}

/**
 * Return the named period for the given hour.
 */
export function getPeriodName(hour: number): DayPeriod {
  const h = ((hour % 24) + 24) % 24
  if (h < 5) return 'night'
  if (h < 7) return 'dawn'
  if (h < 18) return 'day'
  if (h < 20) return 'dusk'
  return 'night'
}

/** Interpolated sky (scene background) colour for `hour`. */
export function getSkyColor(hour: number): THREE.Color {
  const { a, b, t } = findBracket(hour)
  return lerpColor(a.sky, b.sky, t)
}

/** Interpolated ambient light colour for `hour`. */
export function getAmbientColor(hour: number): THREE.Color {
  const { a, b, t } = findBracket(hour)
  return lerpColor(a.ambientColor, b.ambientColor, t)
}

/** Interpolated ambient light intensity for `hour`. */
export function getAmbientIntensity(hour: number): number {
  const { a, b, t } = findBracket(hour)
  return a.ambientIntensity + (b.ambientIntensity - a.ambientIntensity) * t
}

/** Interpolated directional (sun) light colour for `hour`. */
export function getDirectionalColor(hour: number): THREE.Color {
  const { a, b, t } = findBracket(hour)
  return lerpColor(a.directionalColor, b.directionalColor, t)
}

/** Interpolated directional (sun) light intensity for `hour`. */
export function getDirectionalIntensity(hour: number): number {
  const { a, b, t } = findBracket(hour)
  return a.directionalIntensity + (b.directionalIntensity - a.directionalIntensity) * t
}

/** Interpolated exponential fog colour for `hour`. */
export function getFogColor(hour: number): THREE.Color {
  const { a, b, t } = findBracket(hour)
  return lerpColor(a.fogColor, b.fogColor, t)
}

/** Interpolated exponential fog density for `hour`. */
export function getFogDensity(hour: number): number {
  const { a, b, t } = findBracket(hour)
  return a.fogDensity + (b.fogDensity - a.fogDensity) * t
}

/**
 * Format `hour` (float, 0–24) as a 12-hour clock string, e.g. "6:30 AM".
 */
export function formatHour(hour: number): string {
  const totalMinutes = Math.floor(((hour % 24) + 24) % 24 * 60)
  const h24 = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  const ampm = h24 < 12 ? 'AM' : 'PM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

/** Unicode icon for the named period. */
export function getPeriodIcon(period: DayPeriod): string {
  switch (period) {
    case 'dawn':  return '🌅'
    case 'day':   return '☀️'
    case 'dusk':  return '🌇'
    case 'night': return '🌙'
  }
}
