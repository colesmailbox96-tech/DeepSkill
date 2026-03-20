/**
 * Phase 44 — Surveying Panel
 *
 * A survey-stone panel toggled when the player interacts with the Survey Stone
 * or presses Y while nearby.  The panel shows the current surveying level, the
 * active sweep timer (when running), and a button to begin a new sweep.
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
            <li>Lvl 1 — <em>Ore Chip</em>, <em>Raw Resin</em></li>
            <li>Lvl 2 — <em>Flint Shard</em></li>
            <li>Lvl 3 — <em>Rare Fragment</em></li>
          </ul>
        </div>
      </div>

      <p className="surveying-panel__hint">Press Y or Esc to close</p>
    </div>
  )
}
