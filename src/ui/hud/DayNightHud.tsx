/**
 * Phase 92 — Day/Night HUD Widget
 *
 * Shows the current in-game time and named period in the top-right corner of
 * the game viewport.  Reads from useDayNightStore which is updated each frame
 * by App.tsx.
 */

import { useDayNightStore } from '../../store/useDayNightStore'
import { formatHour, getPeriodIcon } from '../../engine/daynight'

export function DayNightHud() {
  const timeOfDay  = useDayNightStore((s) => s.timeOfDay)
  const periodName = useDayNightStore((s) => s.periodName)

  const label = periodName.charAt(0).toUpperCase() + periodName.slice(1)
  const icon  = getPeriodIcon(periodName)
  const clock = formatHour(timeOfDay)

  return (
    <div
      className="hud-daynight"
      role="status"
      aria-label={`Time of day: ${clock}, ${label}`}
    >
      <span className="hud-daynight__icon" aria-hidden="true">{icon}</span>
      <span className="hud-daynight__clock">{clock}</span>
      <span className="hud-daynight__period">{label}</span>
    </div>
  )
}
