/**
 * Phase 44 — Surveying Panel
 * Phase 45 — Hidden Cache System
 *
 * A survey-stone panel toggled when the player interacts with the Survey Stone
 * or presses Y while nearby.  The panel shows the current surveying level, the
 * active sweep timer (when running), a button to begin a new sweep, and a
 * live cache-status table showing cooldown timers and readiness for each of
 * the known buried caches.
 *
 * Pressing Y, Escape, or clicking ✕ closes the panel.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useSurveyingStore } from '../../store/useSurveyingStore'
import { useGameStore } from '../../store/useGameStore'
import { SURVEY_MODE_DURATION, SURVEY_DETECT_RADIUS } from '../../engine/surveying'

// ─── Main panel ───────────────────────────────────────────────────────────

interface SurveyingPanelProps {
  /** Called when the player activates a survey sweep from this panel. */
  onStartSurvey: () => void
}

export function SurveyingPanel({ onStartSurvey }: SurveyingPanelProps) {
  const isOpen             = useSurveyingStore((s) => s.isOpen)
  const closePanel         = useSurveyingStore((s) => s.closePanel)
  const surveyActive       = useSurveyingStore((s) => s.surveyActive)
  const timeRemaining      = useSurveyingStore((s) => s.surveyTimeRemaining)
  const cacheStatusList    = useSurveyingStore((s) => s.cacheStatusList)
  const surveyingLevel     = useGameStore(
    (s) => s.skills.skills.find((sk) => sk.id === 'surveying')?.level ?? 1,
  )

  const isOpenRef = useRef(false)
  isOpenRef.current = isOpen
  const panelRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => closePanel(), [closePanel])

  // Escape closes the panel; Y toggle is handled exclusively in App.tsx.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'Escape' && isOpenRef.current) {
        handleClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  // Focus panel on open.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  const progressPct = surveyActive
    ? Math.round((timeRemaining / SURVEY_MODE_DURATION) * 100)
    : 0

  const { readyCount, cooldownCount, lockedCount, revealedCount } =
    cacheStatusList.reduce(
      (acc, c) => {
        if (c.cooldownRemaining > 0) acc.cooldownCount++
        else if (c.levelReq > surveyingLevel) acc.lockedCount++
        else if (c.revealed) acc.revealedCount++
        else acc.readyCount++
        return acc
      },
      { readyCount: 0, cooldownCount: 0, lockedCount: 0, revealedCount: 0 },
    )

  return (
    <div
      ref={panelRef}
      className="surveying-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Survey Stone — Surveying"
      tabIndex={-1}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="surveying-panel__header">
        <span className="surveying-panel__title">Survey Stone · Surveying</span>
        <span className="surveying-panel__level">Surveying lvl {surveyingLevel}</span>
        <button
          className="surveying-panel__close"
          onClick={handleClose}
          aria-label="Close surveying panel"
        >
          ✕
        </button>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="surveying-panel__body">
        <p className="surveying-panel__desc">
          Activate a survey sweep to detect hidden caches buried nearby.
          Revealed caches glow with a golden beacon — approach and press{' '}
          <strong>E</strong> to claim salvage.
        </p>

        {surveyActive ? (
          <div className="surveying-panel__active">
            <span className="surveying-panel__active-label">
              ◈ Survey sweep active — {Math.ceil(timeRemaining)}s remaining
            </span>
            <div className="surveying-panel__progress-bar" aria-hidden="true">
              <div
                className="surveying-panel__progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        ) : (
          <button
            className="surveying-panel__sweep-btn"
            onClick={onStartSurvey}
            aria-label="Begin survey sweep"
          >
            Begin Survey Sweep
          </button>
        )}

        <div className="surveying-panel__cache-info">
          <span className="surveying-panel__cache-hint">
            Cache detection radius: {SURVEY_DETECT_RADIUS} m · Sweep duration: {SURVEY_MODE_DURATION} s
          </span>
          <ul className="surveying-panel__reward-list">
            <li>Possible cache rewards include:</li>
            <li>
              <em>Ore Chip</em>, <em>Raw Resin</em>, <em>Reed Fiber</em>,{' '}
              <em>Marsh Herb</em>, <em>Flint Shard</em>, <em>Copper Ore</em>,{' '}
              <em>Rare Fragment</em>, <em>Waystone Fragment</em>
            </li>
          </ul>
        </div>

        {/* ── Phase 45 — Cache status table ────────────────────────────── */}
        {cacheStatusList.length > 0 && (
          <div className="surveying-panel__cache-status">
            <div className="surveying-panel__cache-status-header">
              <span className="surveying-panel__cache-status-title">Buried Caches</span>
              <span className="surveying-panel__cache-status-summary">
                {readyCount} ready · {revealedCount > 0 ? `${revealedCount} revealed · ` : ''}{cooldownCount} resetting · {lockedCount} locked
              </span>
            </div>
            <ul className="surveying-panel__cache-list" aria-label="Cache status">
              {cacheStatusList.map((cache) => {
                const locked = cache.levelReq > surveyingLevel
                const onCooldown = cache.cooldownRemaining > 0
                const statusClass = locked
                  ? 'surveying-panel__cache-item--locked'
                  : onCooldown
                  ? 'surveying-panel__cache-item--cooldown'
                  : cache.revealed
                  ? 'surveying-panel__cache-item--revealed'
                  : 'surveying-panel__cache-item--ready'

                return (
                  <li
                    key={cache.id}
                    className={`surveying-panel__cache-item ${statusClass}`}
                  >
                    <span className="surveying-panel__cache-item-name">
                      {cache.label}
                    </span>
                    <span className="surveying-panel__cache-item-req">
                      lvl {cache.levelReq}
                    </span>
                    <span className="surveying-panel__cache-item-status">
                      {locked
                        ? '🔒 locked'
                        : onCooldown
                        ? `⏳ ${Math.ceil(cache.cooldownRemaining)}s`
                        : cache.revealed
                        ? '✦ revealed'
                        : '● ready'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      <p className="surveying-panel__hint">Press Y or Esc to close</p>
    </div>
  )
}
