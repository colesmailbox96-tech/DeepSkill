/**
 * Phase 31 — Combat Target HUD
 *
 * Displays the currently targeted hostile creature's name and a live HP bar
 * just below the player strip.  Hidden when no target is selected.
 */

import { useCombatStore } from '../../store/useCombatStore'

export function CombatTargetHud() {
  const targetName = useCombatStore((s) => s.targetName)
  const targetHp = useCombatStore((s) => s.targetHp)
  const targetMaxHp = useCombatStore((s) => s.targetMaxHp)

  if (!targetName) return null

  const hpPct = targetMaxHp > 0 ? Math.min(100, Math.max(0, (targetHp / targetMaxHp) * 100)) : 0

  return (
    <div className="combat-target-hud" aria-label="Combat target">
      <div className="combat-target-hud__name">{targetName}</div>
      <div
        className="combat-target-hud__bar"
        role="meter"
        aria-label={`${targetName} health`}
        aria-valuenow={targetHp}
        aria-valuemin={0}
        aria-valuemax={targetMaxHp}
      >
        <div
          className="combat-target-hud__fill"
          style={{ width: `${hpPct}%` }}
        />
        <span className="combat-target-hud__label">
          {targetHp} / {targetMaxHp}
        </span>
      </div>
    </div>
  )
}
