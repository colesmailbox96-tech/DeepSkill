/**
 * Phase 83 — Boss Health Bar
 *
 * A full-width health bar displayed at the bottom-centre of the screen during
 * active boss encounters.  Visually distinct from the normal CombatTargetHud
 * nameplate (top-centre, small) to emphasise the gravity of a boss fight.
 *
 * Features:
 *   - Boss name rendered large with a decorative skull prefix.
 *   - Segmented HP bar divided into phase zones; the current-phase fill uses a
 *     brighter gradient.
 *   - "PHASE X" badge that updates as the boss enters new phases.
 *   - Hidden completely when no boss encounter is active.
 */

import { useBossStore } from '../../store/useBossStore'

export function BossHealthBar() {
  const isBossActive = useBossStore((s) => s.isBossActive)
  const bossName     = useBossStore((s) => s.bossName)
  const bossHp       = useBossStore((s) => s.bossHp)
  const bossMaxHp    = useBossStore((s) => s.bossMaxHp)
  const bossPhase    = useBossStore((s) => s.bossPhase)
  const bossMaxPhase = useBossStore((s) => s.bossMaxPhase)

  if (!isBossActive || !bossName) return null

  const hpPct = bossMaxHp > 0
    ? Math.min(100, Math.max(0, (bossHp / bossMaxHp) * 100))
    : 0

  // Build segment divider positions (percentage from left) separating phase zones.
  // HP drains left-to-right (fill shrinks from right), so phase boundaries are
  // placed at (maxPhase - p) / maxPhase fractions from the left.
  // For bossMaxPhase = 3: dividers at 66.67% and 33.33%.
  const segmentPcts: number[] = []
  if (bossMaxPhase > 1) {
    for (let p = 1; p < bossMaxPhase; p++) {
      segmentPcts.push(((bossMaxPhase - p) / bossMaxPhase) * 100)
    }
  }

  return (
    <div className="boss-health-bar" aria-label="Boss encounter">
      <div className="boss-health-bar__header">
        <span className="boss-health-bar__skull" aria-hidden="true">☠</span>
        <span className="boss-health-bar__name">{bossName}</span>
        {bossMaxPhase > 1 && (
          <span className="boss-health-bar__phase-badge">
            PHASE {bossPhase}
          </span>
        )}
      </div>

      <div
        className="boss-health-bar__track"
        role="meter"
        aria-label={`${bossName} health`}
        aria-valuenow={bossHp}
        aria-valuemin={0}
        aria-valuemax={bossMaxHp}
      >
        {/* HP fill */}
        <div
          className={`boss-health-bar__fill boss-health-bar__fill--phase${bossPhase}`}
          style={{ width: `${hpPct}%` }}
        />

        {/* Phase segment dividers */}
        {segmentPcts.map((pct) => (
          <div
            key={pct}
            className="boss-health-bar__segment"
            style={{ left: `${pct}%` }}
            aria-hidden="true"
          />
        ))}

        {/* Numeric HP label */}
        <span className="boss-health-bar__label">
          {bossHp} / {bossMaxHp}
        </span>
      </div>
    </div>
  )
}
