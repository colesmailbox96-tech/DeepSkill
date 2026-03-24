/**
 * Phase 89 — Accessibility Settings Panel
 *
 * Floating panel (B key) that lets the player adjust:
 *  - Reduced motion: disables all CSS animations and transitions.
 *  - Text size: scales the root font-size (Small / Medium / Large).
 *
 * Preferences are persisted to localStorage via useAccessibilityStore so
 * they survive page reloads independently of the main game save.
 * App.tsx subscribes to the store and applies the corresponding classes to
 * <html> so the CSS rules in App.css take effect immediately.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useAccessibilityStore } from '../../store/useAccessibilityStore'
import type { FontScale } from '../../store/useAccessibilityStore'

const FONT_SCALE_OPTIONS: { value: FontScale; label: string }[] = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
]

export function AccessibilityPanel() {
  const isOpen         = useAccessibilityStore((s) => s.isOpen)
  const closePanel     = useAccessibilityStore((s) => s.closePanel)
  const reducedMotion  = useAccessibilityStore((s) => s.reducedMotion)
  const fontScale      = useAccessibilityStore((s) => s.fontScale)
  const setReducedMotion = useAccessibilityStore((s) => s.setReducedMotion)
  const setFontScale   = useAccessibilityStore((s) => s.setFontScale)

  const isOpenRef = useRef(false)
  useEffect(() => { isOpenRef.current = isOpen }, [isOpen])

  const panelRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => closePanel(), [closePanel])

  // Escape closes the panel; B toggle is handled in App.tsx.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'Escape' && isOpenRef.current) handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  // Focus panel on open.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      className="access-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Accessibility Settings"
      tabIndex={-1}
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="access-panel__header">
        <span className="access-panel__title">♿ Accessibility</span>
        <button
          className="access-panel__close"
          onClick={handleClose}
          aria-label="Close accessibility settings"
        >
          ✕
        </button>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="access-panel__body">

        {/* Reduced motion toggle */}
        <div className="access-panel__row">
          <label className="access-panel__label" htmlFor="access-reduced-motion">
            Reduced motion
          </label>
          <button
            id="access-reduced-motion"
            className={`access-panel__toggle${reducedMotion ? ' access-panel__toggle--on' : ''}`}
            onClick={() => setReducedMotion(!reducedMotion)}
            aria-pressed={reducedMotion}
          >
            {reducedMotion ? 'On' : 'Off'}
          </button>
        </div>

        {/* Font size selector */}
        <div className="access-panel__row">
          <span className="access-panel__label" id="access-font-label">
            Text size
          </span>
          <div
            className="access-panel__scale-btns"
            role="group"
            aria-labelledby="access-font-label"
          >
            {FONT_SCALE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                className={`access-panel__scale-btn${fontScale === value ? ' access-panel__scale-btn--active' : ''}`}
                onClick={() => setFontScale(value)}
                aria-pressed={fontScale === value}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

      </div>

      <p className="access-panel__hint">Press B or Esc to close</p>
    </div>
  )
}
