import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore, type Skill } from '../../store/useGameStore'

interface TooltipState {
  skill: Skill
  x: number
  y: number
}

/**
 * Skills panel — a scrollable list of skill rows toggled with the K key.
 *
 * Each row shows:
 *  - skill name
 *  - current level
 *  - an XP progress bar filling toward the next level
 *  - current / max XP figures
 *
 * Hovering a row reveals a tooltip with the skill's flavour description.
 * Close via the ✕ button, pressing K again, or pressing Escape.
 */
export function SkillsPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const isOpenRef = useRef(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  const skills = useGameStore((s) => s.skills.skills)

  const handleClose = useCallback(() => {
    isOpenRef.current = false
    setIsOpen(false)
    setTooltip(null)
  }, [])

  // K key toggles open/close; Escape always closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'KeyK') {
        const next = !isOpenRef.current
        isOpenRef.current = next
        setIsOpen(next)
        if (!next) setTooltip(null)
      } else if (e.code === 'Escape' && isOpenRef.current) {
        handleClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  // Focus the panel when it opens.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

  // Cancel any pending rAF on unmount.
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      className="skills-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Skills"
      tabIndex={-1}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="skills-panel__header">
        <span className="skills-panel__title">Skills</span>
        <span className="skills-panel__count">{skills.length} skills</span>
        <button
          className="skills-panel__close"
          onClick={handleClose}
          aria-label="Close skills panel"
        >
          ✕
        </button>
      </div>

      {/* ── Skill rows ────────────────────────────────────────────────────── */}
      <ul className="skills-panel__list" role="list">
        {skills.map((skill) => {
          const xpPct =
            skill.experienceToNextLevel > 0
              ? Math.min(
                  (skill.experience / skill.experienceToNextLevel) * 100,
                  100,
                )
              : 100 // max level — fill the bar completely

          // For max-level skills, set ARIA meter bounds to [0, 1] with
          // valuenow=1 so the role="meter" element has a valid, non-zero range.
          const ariaMax = skill.experienceToNextLevel > 0 ? skill.experienceToNextLevel : 1
          const ariaNow = skill.experienceToNextLevel > 0 ? skill.experience : 1

          return (
            <li
              key={skill.id}
              className="skill-row"
              role="listitem"
              tabIndex={0}
              aria-label={`${skill.name}, level ${skill.level}`}
              aria-describedby={skill.description ? `skill-desc-${skill.id}` : undefined}
              onMouseEnter={(e) =>
                setTooltip({ skill, x: e.clientX, y: e.clientY })
              }
              onMouseMove={(e) => {
                const x = e.clientX
                const y = e.clientY
                cancelAnimationFrame(rafRef.current)
                rafRef.current = requestAnimationFrame(() => {
                  setTooltip((t) => (t ? { ...t, x, y } : t))
                })
              }}
              onMouseLeave={() => setTooltip(null)}
              onFocus={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                setTooltip({ skill, x: rect.right + 8, y: rect.top })
              }}
              onBlur={() => setTooltip(null)}
            >
              {/* Skill name + level badge */}
              <div className="skill-row__info">
                <span className="skill-row__name">{skill.name}</span>
                <span className="skill-row__level">{skill.level}</span>
              </div>

              {/* XP progress bar */}
              <div
                className="skill-row__bar"
                role="meter"
                aria-label={`${skill.name} XP`}
                aria-valuenow={ariaNow}
                aria-valuemin={0}
                aria-valuemax={ariaMax}
              >
                <div
                  className="skill-row__bar-fill"
                  style={{ width: `${xpPct}%` }}
                />
              </div>

              {/* XP figures */}
              <span className="skill-row__xp">
                {skill.experience} / {skill.experienceToNextLevel} xp
              </span>
            </li>
          )
        })}
      </ul>

      {/* ── Hover tooltip ─────────────────────────────────────────────────── */}
      {tooltip && tooltip.skill.description && (
        <div
          id={`skill-desc-${tooltip.skill.id}`}
          className="skills-tooltip"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
          role="tooltip"
        >
          <strong className="skills-tooltip__name">{tooltip.skill.name}</strong>
          <span className="skills-tooltip__level">Level {tooltip.skill.level}</span>
          <span className="skills-tooltip__desc">{tooltip.skill.description}</span>
        </div>
      )}
    </div>
  )
}
