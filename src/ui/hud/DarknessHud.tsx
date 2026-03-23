/**
 * Phase 68 — Darkness HUD
 *
 * Renders two overlapping layers when the player is inside a dark zone:
 *
 *  1. A radial-gradient vignette that dims the edges and corners of the
 *     viewport, scaled by the zone's intensity and whether the player is lit.
 *
 *  2. A compact status pill at the bottom-centre of the screen that names the
 *     zone and indicates whether a lantern is active.
 *
 * The component reads from `useLightingStore` (updated every frame by
 * App.tsx) and from the static dark zone registry for accent colour and label.
 */

import type { CSSProperties } from 'react'
import { useLightingStore } from '../../store/useLightingStore'
import { getAllDarkZoneDefs } from '../../engine/lighting'

// Build a quick lookup map so we can resolve label/intensity by id.
const DARK_ZONE_MAP = Object.fromEntries(
  getAllDarkZoneDefs().map((d) => [d.id, d]),
)

export function DarknessHud() {
  const activeDarkZoneId = useLightingStore((s) => s.activeDarkZoneId)
  const isLit = useLightingStore((s) => s.isLit)

  if (!activeDarkZoneId) return null

  const def = DARK_ZONE_MAP[activeDarkZoneId]
  if (!def) return null

  // Lantern reduces the vignette to a mild atmospheric effect; no lantern
  // leaves the full intensity in place.
  const vignetteOpacity = isLit ? def.intensity * 0.28 : def.intensity

  return (
    <>
      {/* Layer 1 — radial vignette overlay covering the full viewport */}
      <div
        className="darkness-vignette"
        style={{ '--darkness-opacity': vignetteOpacity } as CSSProperties}
        aria-hidden="true"
      />

      {/* Layer 2 — compact zone + lantern status pill */}
      <div
        className={`darkness-status${isLit ? ' darkness-status--lit' : ' darkness-status--dark'}`}
        role="status"
        aria-live="polite"
        aria-label={`Dark zone: ${def.label}${isLit ? ', lantern active' : ', no light source'}`}
      >
        <span className="darkness-status__icon" aria-hidden="true">
          {isLit ? '🪔' : '🌑'}
        </span>
        <span className="darkness-status__label">{def.label}</span>
        {isLit ? (
          <span className="darkness-status__badge darkness-status__badge--lit">
            Lantern
          </span>
        ) : (
          <span className="darkness-status__badge darkness-status__badge--dark">
            Dark
          </span>
        )}
      </div>
    </>
  )
}
