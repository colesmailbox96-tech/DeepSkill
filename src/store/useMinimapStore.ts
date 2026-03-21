/**
 * Phase 54 — Minimap Store
 *
 * Holds the minimap's runtime state:
 *  • player world-space position (updated each frame by App.tsx)
 *  • player facing angle (radians, Y-axis rotation from THREE.js mesh)
 *  • isExpanded — whether the full region overlay is visible (toggled by N key)
 *  • currentRegionLabel — derived region name shown in the HUD
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

  /** Called every game frame by App.tsx. */
  setPlayerState: (x: number, z: number, angle: number, regionLabel: string) => void
  /** Toggle the expanded overlay on/off (bound to N key). */
  toggleExpanded: () => void
  /** Close the expanded overlay. */
  closeExpanded: () => void
}

export const useMinimapStore = create<MinimapState>((set) => ({
  playerX:            0,
  playerZ:            0,
  playerAngle:        0,
  currentRegionLabel: 'Hushwood',
  isExpanded:         false,

  setPlayerState: (x, z, angle, regionLabel) =>
    set({ playerX: x, playerZ: z, playerAngle: angle, currentRegionLabel: regionLabel }),

  toggleExpanded: () => set((s) => ({ isExpanded: !s.isExpanded })),
  closeExpanded:  () => set({ isExpanded: false }),
}))
