/**
 * Phase 96 — Demo Welcome Overlay
 *
 * Full-screen informational overlay shown once per new game. Presents the
 * public demo slice: available regions, included skills, active questlines,
 * and a brief note about content locked to the full release.
 *
 * Dismissed by the player clicking "Begin Adventure" or pressing Escape.
 * The flag is stored in useDemoStore so it does not re-appear during the
 * same session.
 *
 * Accessibility:
 *   - Focus is trapped within the panel while visible so keyboard users cannot
 *     inadvertently tab into interactive HUD elements sitting behind the overlay.
 *   - Escape key dismisses the overlay.
 *   - The dismiss button receives auto-focus on mount.
 */

import { useRef, useEffect } from 'react'
import { useDemoStore } from '../../store/useDemoStore'
import {
  DEMO_REGIONS,
  DEMO_SKILLS,
  DEMO_QUESTLINES,
  DEMO_CONTENT_LOCK,
  DEMO_SUBTITLE,
  DEMO_ESTIMATED_PLAYTIME,
} from '../../engine/demoSlice'
import { recordDemoOverlayDismissed } from '../../engine/telemetry'

export function DemoWelcomeOverlay() {
  const welcomeSeen = useDemoStore((s) => s.welcomeSeen)
  const setWelcomeSeen = useDemoStore((s) => s.setWelcomeSeen)

  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (welcomeSeen) return

    const panel = panelRef.current
    if (!panel) return

    // Auto-focus the dismiss button on mount.
    const firstFocusable = panel.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    firstFocusable?.focus()

    // Focus trap: keep Tab / Shift-Tab inside the panel.
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled'))

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        recordDemoOverlayDismissed()
        setWelcomeSeen(true)
        return
      }
      if (e.key !== 'Tab' || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [welcomeSeen, setWelcomeSeen])

  const handleBeginAdventure = () => {
    recordDemoOverlayDismissed()
    setWelcomeSeen(true)
  }

  if (welcomeSeen) return null

  return (
    <div
      className="demo-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Public Demo — available content"
    >
      <div className="demo-overlay__panel" ref={panelRef}>
        <div className="demo-overlay__header">
          <div className="demo-overlay__badges">
            <span className="demo-overlay__badge">Public Demo</span>
            <span className="demo-overlay__badge demo-overlay__badge--playtime">
              ⏱ {DEMO_ESTIMATED_PLAYTIME}
            </span>
          </div>
          <h2 className="demo-overlay__title">Veilmarch</h2>
          <p className="demo-overlay__subtitle">
            {DEMO_SUBTITLE}
          </p>
        </div>

        <div className="demo-overlay__columns">
          {/* Regions */}
          <section className="demo-overlay__section">
            <h3 className="demo-overlay__section-title">Regions</h3>
            <ul className="demo-overlay__list">
              {DEMO_REGIONS.map((r) => (
                <li key={r.id} className="demo-overlay__list-item">
                  <span className="demo-overlay__item-label">{r.label}</span>
                  <span className="demo-overlay__item-desc">{r.description}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Skills */}
          <section className="demo-overlay__section">
            <h3 className="demo-overlay__section-title">Skills</h3>
            <ul className="demo-overlay__list demo-overlay__list--skills">
              {DEMO_SKILLS.map((s) => (
                <li
                  key={s.id}
                  className={`demo-overlay__skill-chip demo-overlay__skill-chip--${s.tier}`}
                >
                  {s.label}
                </li>
              ))}
            </ul>
          </section>

          {/* Questlines */}
          <section className="demo-overlay__section">
            <h3 className="demo-overlay__section-title">Questlines</h3>
            <ul className="demo-overlay__list">
              {DEMO_QUESTLINES.map((q) => (
                <li key={q.id} className="demo-overlay__list-item">
                  <span className="demo-overlay__item-label">{q.label}</span>
                  <span className="demo-overlay__item-desc">{q.summary}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Content lock */}
          <section className="demo-overlay__section demo-overlay__section--lock">
            <h3 className="demo-overlay__section-title demo-overlay__section-title--lock">
              Full Release Only
            </h3>
            <ul className="demo-overlay__lock-list">
              {DEMO_CONTENT_LOCK.map((entry) => (
                <li key={entry.label} className="demo-overlay__lock-item">
                  {entry.label}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <button
          className="demo-overlay__btn"
          onClick={handleBeginAdventure}
        >
          Begin Adventure
        </button>
      </div>
    </div>
  )
}
