/**
 * Phase 54 — Minimap Store
 * Phase 80 — Discovered secret-passage tracking
 *
 * Holds the minimap's runtime state:
 *  • player world-space position (updated each frame by App.tsx)
 *  • player facing angle (radians, Y-axis rotation from THREE.js mesh)
 *  • isExpanded — whether the full region overlay is visible (toggled by N key)
 *  • currentRegionLabel — derived region name shown in the HUD
 *  • discoveredShortcuts — IDs of hidden passages the player has opened
 */

import { create } from 'zustand'

interface MinimapState {
  /** Player world X position (updated each frame). */
  playerX: number
  /** Player world Z position (updated each frame). */
  playerZ: number
  /** Player facing angle in radians (player.mesh.rotation.y). */
  playerAngle: number
  /** Current region label derived from world position. */
  currentRegionLabel: string
  /** Whether the expanded region-map overlay is visible. */
  isExpanded: boolean
  /**
   * IDs of hidden shortcuts (passages) that the player has successfully opened.
   * Matching entries in SHORTCUT_MARKERS will appear on the minimap.
   */
  discoveredShortcuts: string[]

  /** Called every game frame by App.tsx. */
  setPlayerState: (x: number, z: number, angle: number, regionLabel: string) => void
  /** Toggle the expanded overlay on/off (bound to N key). */
  toggleExpanded: () => void
  /** Close the expanded overlay. */
  closeExpanded: () => void
  /** Register a newly discovered shortcut so it appears on the map. */
  addDiscoveredShortcut: (id: string) => void
}

export const useMinimapStore = create<MinimapState>((set) => ({
  playerX:             0,
  playerZ:             0,
  playerAngle:         0,
  currentRegionLabel:  'Hushwood',
  isExpanded:          false,
  discoveredShortcuts: [],

  setPlayerState: (x, z, angle, regionLabel) =>
    set({ playerX: x, playerZ: z, playerAngle: angle, currentRegionLabel: regionLabel }),

  toggleExpanded: () => set((s) => ({ isExpanded: !s.isExpanded })),
  closeExpanded:  () => set({ isExpanded: false }),

  addDiscoveredShortcut: (id) =>
    set((s) =>
      s.discoveredShortcuts.includes(id)
        ? s
        : { discoveredShortcuts: [...s.discoveredShortcuts, id] },
    ),
}))
