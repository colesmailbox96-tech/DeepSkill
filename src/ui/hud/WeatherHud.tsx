/**
 * Phase 95 — Weather HUD Widget
 *
 * Displays the current weather condition (icon + name) in the game viewport.
 * Positioned below the DayNightHud in the top-right corner.
 * Reads from useWeatherStore which is updated on each weather transition by
 * App.tsx.
 */

import { useWeatherStore } from '../../store/useWeatherStore'

export function WeatherHud() {
  const weatherIcon = useWeatherStore((s) => s.weatherIcon)
  const weatherName = useWeatherStore((s) => s.weatherName)

  return (
    <div
      className="hud-weather"
      aria-label={`Current weather: ${weatherName}`}
    >
      <span className="hud-weather__icon" aria-hidden="true">{weatherIcon}</span>
      <span className="hud-weather__name">{weatherName}</span>
    </div>
  )
}
