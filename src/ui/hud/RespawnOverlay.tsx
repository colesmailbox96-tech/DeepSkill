/**
 * Phase 34 — Respawn Overlay
 *
 * Full-screen modal that appears when the player is defeated.  Blocks gameplay
 * input until explicitly dismissed, preventing soft-lock states.
 *
 * Shows:
 *   - Defeat header
 *   - Recovery location (where the player wakes)
 *   - Item-retention assurance (players keep all items)
 *   - "Wake Up" dismiss button that restores normal play
 *
 * Accessibility:
 *   - Focus is trapped within the panel while visible so keyboard users cannot
 *     inadvertently tab into interactive HUD elements sitting behind the overlay.
 */

import { useEffect, useRef } from 'react'
import { useRespawnStore } from '../../store/useRespawnStore'

export function RespawnOverlay() {
  const defeated = useRespawnStore((s) => s.defeated)
  const recoveryLocation = useRespawnStore((s) => s.recoveryLocation)
  const acknowledge = useRespawnStore((s) => s.acknowledge)

  const panelRef = useRef<HTMLDivElement>(null)

  // Focus trap: while the overlay is visible, intercept Tab / Shift-Tab so
  // focus never leaves the panel.  The panel currently has exactly one
  // focusable element (the "Wake Up" button) so we simply redirect focus back
  // to it whenever the user tries to tab away.
  useEffect(() => {
    if (!defeated) return

    const panel = panelRef.current
    if (!panel) return

    // Snapshot the focusable elements once on mount; the panel content is
    // static so there is no need to re-query on every keypress.
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled'))

    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [defeated])

  if (!defeated) return null

  return (
    <div className="respawn-overlay" role="dialog" aria-modal="true" aria-label="You were defeated">
      <div className="respawn-overlay__panel" ref={panelRef}>
        <h2 className="respawn-overlay__title">Defeated</h2>
        <p className="respawn-overlay__body">
          Your injuries overcame you. You wake in safety — all your belongings are with you.
        </p>
        <p className="respawn-overlay__location">
          <span className="respawn-overlay__location-label">Recovery point:</span>{' '}
          {recoveryLocation}
        </p>
        <button
          className="respawn-overlay__btn"
          onClick={acknowledge}
          autoFocus
        >
          Wake Up
        </button>
      </div>
    </div>
  )
}
