/**
 * Phase 48 — Hazard Warning HUD
 *
 * Renders a persistent on-screen banner while the player is inside an
 * environmental hazard zone.  The banner shows:
 *   • The hazard icon and name
 *   • A "Protected" badge when a ward item neutralises the effect
 *   • A pulsing danger indicator when the player is unprotected
 *
 * The component reads from `useHazardStore` (updated every frame by
 * App.tsx) and from the static hazard registry so it can display the
 * correct accent colour without extra prop-drilling.
 */

import type { CSSProperties } from 'react'
import { useHazardStore } from '../../store/useHazardStore'
import { getAllHazardDefs } from '../../engine/hazard'

// Build a quick lookup map so we can resolve icon/colour/label by id.
const HAZARD_MAP = Object.fromEntries(
  getAllHazardDefs().map((d) => [d.id, d]),
)

export function HazardWarningHud() {
  const activeHazardId = useHazardStore((s) => s.activeHazardId)
  const isProtected    = useHazardStore((s) => s.isProtected)

  if (!activeHazardId) return null

  const def = HAZARD_MAP[activeHazardId]
  if (!def) return null

  return (
    <div
      className={`hazard-warning${isProtected ? ' hazard-warning--protected' : ' hazard-warning--danger'}`}
      style={{ '--hazard-color': def.color } as CSSProperties}
      role="status"
      aria-live="polite"
      aria-label={`Hazard: ${def.label}`}
    >
      <span className="hazard-warning__icon" aria-hidden="true">
        {def.icon}
      </span>
      <span className="hazard-warning__label">{def.label}</span>
      {isProtected ? (
        <span className="hazard-warning__badge hazard-warning__badge--safe">
          Protected
        </span>
      ) : (
        <span className="hazard-warning__badge hazard-warning__badge--danger">
          Danger
        </span>
      )}
    </div>
  )
}
