/**
 * Phase 96 — Demo Welcome Overlay
 *
 * Full-screen informational overlay shown once per new game. Presents the
 * public demo slice: available regions, included skills, active questlines,
 * and a brief note about content locked to the full release.
 *
 * Dismissed by the player clicking "Begin Adventure"; the flag is stored in
 * useDemoStore so it does not re-appear during the same session.
 */

import { useRef, useEffect } from 'react'
import { useDemoStore } from '../../store/useDemoStore'
import {
  DEMO_REGIONS,
  DEMO_SKILLS,
  DEMO_QUESTLINES,
  DEMO_CONTENT_LOCK,
} from '../../engine/demoSlice'

export function DemoWelcomeOverlay() {
  const welcomeSeen = useDemoStore((s) => s.welcomeSeen)
  const setWelcomeSeen = useDemoStore((s) => s.setWelcomeSeen)

  const btnRef = useRef<HTMLButtonElement>(null)

  // Focus the dismiss button on mount so keyboard users can immediately proceed.
  useEffect(() => {
    if (!welcomeSeen) {
      btnRef.current?.focus()
    }
  }, [welcomeSeen])

  if (welcomeSeen) return null

  return (
    <div
      className="demo-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Public Demo — available content"
    >
      <div className="demo-overlay__panel">
        <div className="demo-overlay__header">
          <span className="demo-overlay__badge">Public Demo</span>
          <h2 className="demo-overlay__title">Veilmarch</h2>
          <p className="demo-overlay__subtitle">
            Welcome to the demo slice. Explore the regions and skills listed below.
            The full release extends far beyond what is available here.
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
          ref={btnRef}
          className="demo-overlay__btn"
          onClick={() => setWelcomeSeen(true)}
        >
          Begin Adventure
        </button>
      </div>
    </div>
  )
}
