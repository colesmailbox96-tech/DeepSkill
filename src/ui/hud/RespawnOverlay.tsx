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
 */

import { useRespawnStore } from '../../store/useRespawnStore'

export function RespawnOverlay() {
  const defeated = useRespawnStore((s) => s.defeated)
  const recoveryLocation = useRespawnStore((s) => s.recoveryLocation)
  const acknowledge = useRespawnStore((s) => s.acknowledge)

  if (!defeated) return null

  return (
    <div className="respawn-overlay" role="dialog" aria-modal="true" aria-label="You were defeated">
      <div className="respawn-overlay__panel">
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
