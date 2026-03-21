/**
 * Phase 54 — Minimap / Region Map Foundation
 *
 * Static world data consumed by MinimapHud: region colour bands, named
 * location markers, and world-space ↔ canvas-pixel conversion helpers.
 *
 * World coordinate conventions
 * ─────────────────────────────
 *  +X → east   (shoreline side)
 *  −X → west   (chapel side)
 *  +Z → south  (bog / brackroot)
 *  −Z → north  (quarry side)
 */

// ─── World bounds ─────────────────────────────────────────────────────────────

/** Leftmost (west) world X used for canvas projection. */
export const WORLD_MIN_X = -65
/** Rightmost (east) world X used for canvas projection.
 *  Shoreline east boundary is x=+80 (shoreline.ts). */
export const WORLD_MAX_X = 84
/** Northernmost (top) world Z used for canvas projection.
 *  Quarry north cliff is z=−96 (quarry.ts). */
export const WORLD_MIN_Z = -100
/** Southernmost (bottom) world Z used for canvas projection.
 *  Brackroot Bog south boundary is z=+82 (brackroot.ts). */
export const WORLD_MAX_Z = 86

// ─── Region definitions ───────────────────────────────────────────────────────

/** One named region painted as a colour band on the minimap. */
export interface MinimapRegion {
  /** Unique identifier, mirrors the AudioRegion id. */
  id: string
  /** Short name shown in the expanded overlay. */
  label: string
  /**
   * Predicate that returns true when world coordinates (x, z) fall inside
   * this region.  Regions are evaluated in order; the first match wins.
   */
  contains: (x: number, z: number) => boolean
  /** CSS hex fill colour for the region band. */
  color: string
  /** Slightly lighter highlight used for the legend swatch. */
  borderColor: string
}

export const MINIMAP_REGIONS: MinimapRegion[] = [
  {
    id: 'chapel',
    label: 'Tidemark Chapel',
    // West zone: chapel grounds start at x=−32 (corridor from x=−19).
    contains: (x) => x <= -32,
    color: '#3b4d6a',
    borderColor: '#5a72a0',
  },
  {
    id: 'bog',
    label: 'Brackroot Bog',
    // South zone: bog trail begins at z=+19 (brackroot.ts).
    contains: (_, z) => z >= 19,
    color: '#2e4a2e',
    borderColor: '#4a7a3a',
  },
  {
    id: 'quarry',
    label: 'Redwake Quarry',
    // North zone: quarry trail begins at z=−19 (quarry.ts).
    contains: (_, z) => z <= -19,
    color: '#5a3d28',
    borderColor: '#8a6040',
  },
  {
    id: 'shoreline',
    label: 'Gloamwater Shore',
    // East zone: shoreline trail begins at x=+19 (shoreline.ts).
    contains: (x) => x >= 19,
    color: '#2a3d5a',
    borderColor: '#3a6080',
  },
  {
    id: 'hushwood',
    label: 'Hushwood',
    contains: () => true,
    color: '#2e4a1e',
    borderColor: '#4a7a3a',
  },
]

// ─── Marker definitions ───────────────────────────────────────────────────────

/** Category of map marker, drives icon and colour selection. */
export type MarkerKind = 'spawn' | 'station' | 'npc' | 'zone'

/** A named point of interest shown on the minimap. */
export interface MinimapMarker {
  id: string
  label: string
  x: number
  z: number
  kind: MarkerKind
  /** Optional short display icon that UIs may render alongside the label. */
  icon?: string
}

/** All static markers registered in the world (22 total). */
export const MINIMAP_MARKERS: MinimapMarker[] = [
  // ── Spawn ──────────────────────────────────────────────────────────────────
  { id: 'spawn',           label: 'Spawn',           x:   0,    z:    0,   kind: 'spawn',   icon: '⭐' },

  // ── Craft stations ─────────────────────────────────────────────────────────
  { id: 'hearthfire',      label: 'Hearthfire',      x:  -4,    z:    9,   kind: 'station', icon: '🔥' },
  { id: 'furnace',         label: 'Furnace',         x:   4,    z:    9,   kind: 'station', icon: '⚒️' },
  { id: 'workbench',       label: 'Workbench',       x:  -4,    z:    9,   kind: 'station', icon: '🪚' },
  { id: 'tinkerer',        label: "Tinkerer's Bench", x:  0,    z:   12,   kind: 'station', icon: '⚙️' },
  { id: 'survey_stone',    label: 'Survey Stone',    x:   4,    z:   14,   kind: 'station', icon: '🧭' },
  { id: 'warding_altar',   label: 'Warding Altar',   x:  -4,    z:   18,   kind: 'station', icon: '🛡️' },

  // ── Settlement NPCs (Hushwood) ─────────────────────────────────────────────
  { id: 'aldric',          label: 'Aldric',          x:   1.5,  z:   -6.0, kind: 'npc', icon: '🧔' },
  { id: 'bron',            label: 'Bron',            x:   6.5,  z:    2.0, kind: 'npc', icon: '🔨' },
  { id: 'mira',            label: 'Mira',            x:   1.5,  z:   10.5, kind: 'npc', icon: '🍺' },
  { id: 'dwyn',            label: 'Dwyn',            x:  -8.5,  z:   -8.5, kind: 'npc', icon: '⚔️' },
  { id: 'sera',            label: 'Sera',            x:   3.5,  z:    1.5, kind: 'npc', icon: '🌿' },
  { id: 'tomas',           label: 'Tomas',           x:  -6.5,  z:    1.5, kind: 'npc', icon: '💰' },

  // ── Chapel NPCs / encounters ───────────────────────────────────────────────
  { id: 'nairn_dusk',      label: 'Nairn Dusk',      x: -34,    z:   -4,   kind: 'npc', icon: '🕯️' },
  { id: 'chapel_wisp',     label: 'Chapel Wisp',     x: -52,    z:   -4,   kind: 'npc', icon: '👻' },

  // ── Quarry NPC ─────────────────────────────────────────────────────────────
  { id: 'gorven',          label: 'Gorven',          x:   6,    z:  -55.5, kind: 'npc', icon: '⛏️' },

  // ── Shoreline NPC ──────────────────────────────────────────────────────────
  { id: 'brin_salt',       label: 'Brin Salt',       x:  53,    z:    3,   kind: 'npc', icon: '🎣' },

  // ── Zone labels (shown only in expanded overlay) ───────────────────────────
  { id: 'zone_hushwood',   label: 'Hushwood',        x:   0,    z:    0,   kind: 'zone' },
  { id: 'zone_bog',        label: 'Bog',             x:   0,    z:   50,   kind: 'zone' },
  { id: 'zone_chapel',     label: 'Chapel',          x: -46,    z:    0,   kind: 'zone' },
  { id: 'zone_quarry',     label: 'Quarry',          x:   0,    z:  -57,   kind: 'zone' },
  { id: 'zone_shoreline',  label: 'Shoreline',       x:  50,    z:    0,   kind: 'zone' },
]

// ─── Marker colour palette ────────────────────────────────────────────────────

/** Returns the fill colour for a marker kind. */
export function markerColor(kind: MarkerKind): string {
  switch (kind) {
    case 'spawn':   return '#ffe066'
    case 'station': return '#ff9900'
    case 'npc':     return '#44ccff'
    case 'zone':    return 'rgba(255,255,255,0.0)'
  }
}

/** Returns the stroke colour for a marker kind. */
export function markerStroke(kind: MarkerKind): string {
  switch (kind) {
    case 'spawn':   return '#cc9900'
    case 'station': return '#cc5500'
    case 'npc':     return '#0088aa'
    case 'zone':    return 'rgba(0,0,0,0)'
  }
}

// ─── Projection helpers ───────────────────────────────────────────────────────

/** Map a world X coordinate to a canvas pixel X. */
export function worldToCanvasX(worldX: number, canvasW: number): number {
  return ((worldX - WORLD_MIN_X) / (WORLD_MAX_X - WORLD_MIN_X)) * canvasW
}

/** Map a world Z coordinate to a canvas pixel Y (north=top, south=bottom). */
export function worldToCanvasY(worldZ: number, canvasH: number): number {
  return ((worldZ - WORLD_MIN_Z) / (WORLD_MAX_Z - WORLD_MIN_Z)) * canvasH
}

// ─── Region lookup ────────────────────────────────────────────────────────────

/**
 * Return the label of the region that contains the given world coordinates.
 * Falls back to 'Hushwood' (the catch-all region).
 */
export function getRegionLabel(x: number, z: number): string {
  for (const region of MINIMAP_REGIONS) {
    if (region.contains(x, z)) return region.label
  }
  return 'Hushwood'
}
