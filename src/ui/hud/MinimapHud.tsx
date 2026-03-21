/**
 * Phase 54 — Minimap HUD
 *
 * Renders a compact canvas-based minimap in the top-right corner of the
 * screen.  Pressing N (or the Map button on mobile) expands it to a full
 * region-map overlay.
 *
 * Architecture:
 *  • A single <canvas> element is used for both the small and expanded views.
 *  • The minimap subscribes directly to useMinimapStore via .subscribe() and
 *    redraws the canvas imperatively each time position/angle changes — this
 *    avoids triggering React reconciliation on every game frame.
 *  • isExpanded triggers a React re-render (size change + legend visibility).
 */

import { useCallback, useEffect, useRef } from 'react'
import { useMinimapStore } from '../../store/useMinimapStore'
import {
  MINIMAP_REGIONS,
  MINIMAP_MARKERS,
  WORLD_MIN_X,
  WORLD_MAX_X,
  WORLD_MIN_Z,
  WORLD_MAX_Z,
  worldToCanvasX,
  worldToCanvasY,
  markerColor,
  markerStroke,
} from '../../engine/minimap'

// ─── Drawing constants ────────────────────────────────────────────────────────

/** Canvas resolution in logical pixels for the small widget. */
const SMALL_SIZE = 160
/** Canvas resolution in logical pixels for the expanded overlay. */
const LARGE_SIZE = 360
/** Radius of the player dot on the small map. */
const PLAYER_R_SMALL = 4
/** Radius of the player dot on the large map. */
const PLAYER_R_LARGE = 6
/** Radius of a regular marker dot on the small map. */
const MARKER_R_SMALL = 2.5
/** Radius of a regular marker dot on the large map. */
const MARKER_R_LARGE = 4

// ─── Canvas drawing ───────────────────────────────────────────────────────────

function drawMinimap(
  ctx: CanvasRenderingContext2D,
  size: number,
  playerX: number,
  playerZ: number,
  playerAngle: number,
): void {
  const W = size
  const H = size

  // Clear
  ctx.clearRect(0, 0, W, H)

  const isLarge = size >= LARGE_SIZE

  // ── Background ────────────────────────────────────────────────────────────
  ctx.fillStyle = '#1a2010'
  ctx.fillRect(0, 0, W, H)

  // ── Region bands ──────────────────────────────────────────────────────────
  // Rasterise region colour by sampling every N pixels (cheap per-pixel test).
  const step = isLarge ? 2 : 4
  for (let py = 0; py < H; py += step) {
    for (let px = 0; px < W; px += step) {
      // Convert normalised canvas position back to world coordinates.
      const worldX = (px / W) * (WORLD_MAX_X - WORLD_MIN_X) + WORLD_MIN_X
      const worldZ = (py / H) * (WORLD_MAX_Z - WORLD_MIN_Z) + WORLD_MIN_Z

      let color = '#1a2010'
      for (const region of MINIMAP_REGIONS) {
        if (region.contains(worldX, worldZ)) {
          color = region.color
          break
        }
      }
      ctx.fillStyle = color
      ctx.fillRect(px, py, step, step)
    }
  }

  // ── Grid lines (large view only) ──────────────────────────────────────────
  if (isLarge) {
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 0.5
    for (let wx = -60; wx <= 24; wx += 10) {
      const cx = worldToCanvasX(wx, W)
      ctx.beginPath()
      ctx.moveTo(cx, 0)
      ctx.lineTo(cx, H)
      ctx.stroke()
    }
    for (let wz = -25; wz <= 40; wz += 10) {
      const cy = worldToCanvasY(wz, H)
      ctx.beginPath()
      ctx.moveTo(0, cy)
      ctx.lineTo(W, cy)
      ctx.stroke()
    }
  }

  // ── Border ────────────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1)

  // ── Markers ───────────────────────────────────────────────────────────────
  const markerR = isLarge ? MARKER_R_LARGE : MARKER_R_SMALL

  for (const marker of MINIMAP_MARKERS) {
    if (marker.kind === 'zone') {
      // Zone labels — only render text in expanded view.
      if (!isLarge) continue
      const cx = worldToCanvasX(marker.x, W)
      const cy = worldToCanvasY(marker.z, H)
      ctx.font = 'bold 10px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.30)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(marker.label.toUpperCase(), cx, cy)
      continue
    }

    const cx = worldToCanvasX(marker.x, W)
    const cy = worldToCanvasY(marker.z, H)

    // Dot
    ctx.beginPath()
    ctx.arc(cx, cy, markerR, 0, Math.PI * 2)
    ctx.fillStyle = markerColor(marker.kind)
    ctx.fill()
    ctx.strokeStyle = markerStroke(marker.kind)
    ctx.lineWidth = 0.8
    ctx.stroke()

    // Label (large view only)
    if (isLarge) {
      ctx.font = '8px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(marker.label, cx, cy + markerR + 2)
    }
  }

  // ── Player ────────────────────────────────────────────────────────────────
  const px = worldToCanvasX(playerX, W)
  const pz = worldToCanvasY(playerZ, H)
  const pr = isLarge ? PLAYER_R_LARGE : PLAYER_R_SMALL

  // Direction arrow — canvas forward direction for facing angle A:
  //   dx = sin(A)  (world +X  →  canvas right)
  //   dy = cos(A)  (world +Z  →  canvas down)
  const arrowLen = pr * 2.2
  const dx = Math.sin(playerAngle)
  const dy = Math.cos(playerAngle)

  // Draw the filled triangle representing the player facing direction.
  const tipX = px + dx * arrowLen
  const tipY = pz + dy * arrowLen
  const perpX = -dy
  const perpY =  dx
  const baseHalf = pr * 0.85

  ctx.beginPath()
  ctx.moveTo(tipX, tipY)
  ctx.lineTo(px + perpX * baseHalf, pz + perpY * baseHalf)
  ctx.lineTo(px - perpX * baseHalf, pz - perpY * baseHalf)
  ctx.closePath()
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = '#00aaff'
  ctx.lineWidth = 1
  ctx.stroke()

  // Centre dot
  ctx.beginPath()
  ctx.arc(px, pz, pr * 0.55, 0, Math.PI * 2)
  ctx.fillStyle = '#00aaff'
  ctx.fill()
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MinimapHud() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // React-driven state — only these trigger a re-render.
  const isExpanded         = useMinimapStore((s) => s.isExpanded)
  const closeExpanded      = useMinimapStore((s) => s.closeExpanded)
  const currentRegionLabel = useMinimapStore((s) => s.currentRegionLabel)

  // ── Imperative canvas redraw subscribed to store ─────────────────────────
  // Subscribe outside React so position changes don't cause re-renders.
  useEffect(() => {
    const redraw = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const { playerX, playerZ, playerAngle, isExpanded: expanded } = useMinimapStore.getState()
      const size = expanded ? LARGE_SIZE : SMALL_SIZE
      if (canvas.width !== size) {
        canvas.width  = size
        canvas.height = size
      }
      drawMinimap(ctx, size, playerX, playerZ, playerAngle)
    }

    // Initial draw
    redraw()

    // Subscribe to every store change and redraw.
    const unsub = useMinimapStore.subscribe(redraw)
    return unsub
  }, [])

  // ── Escape closes expanded overlay ───────────────────────────────────────
  const handleClose = useCallback(() => closeExpanded(), [closeExpanded])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'Escape' && useMinimapStore.getState().isExpanded) handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  const size = isExpanded ? LARGE_SIZE : SMALL_SIZE

  return (
    <div
      className={`minimap${isExpanded ? ' minimap--expanded' : ''}`}
      role="complementary"
      aria-label="World minimap"
    >
      {/* Expanded header */}
      {isExpanded && (
        <div className="minimap__header">
          <span className="minimap__title">🗺️ Region Map</span>
          <button
            className="minimap__close"
            onClick={handleClose}
            aria-label="Close map"
          >
            ✕
          </button>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="minimap__canvas"
        width={size}
        height={size}
        aria-hidden="true"
      />

      {/* Region label (small view) */}
      {!isExpanded && (
        <div className="minimap__region-label" aria-live="polite">
          {currentRegionLabel}
        </div>
      )}

      {/* Legend (expanded view only) */}
      {isExpanded && (
        <div className="minimap__legend">
          {MINIMAP_REGIONS.map((r) => (
            <div key={r.id} className="minimap__legend-row">
              <span
                className="minimap__legend-swatch"
                style={{ background: r.color, borderColor: r.borderColor }}
              />
              <span className="minimap__legend-name">{r.label}</span>
            </div>
          ))}
          <p className="minimap__hint">Press N or Esc to close</p>
        </div>
      )}
    </div>
  )
}
