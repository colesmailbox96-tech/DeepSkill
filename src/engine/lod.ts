/**
 * Phase 88 — LOD / Streaming Pass
 *
 * Distance-based region visibility control with hysteresis to prevent pop-in.
 *
 * Each world region is wrapped into a THREE.Group during scene setup via
 * captureIntoGroup().  Per-frame, updateRegionLOD() compares the player's XZ
 * distance to each region's activation centre and sets group.visible
 * accordingly.  A hysteresis band (hideDistance > showDistance) prevents
 * flickering when the player stands near an activation boundary.
 *
 * The starting hub (Hushwood) is marked always-visible and is never culled.
 */

import * as THREE from 'three'

// ─── Region chunk definition ──────────────────────────────────────────────────

/** Configuration for one streamable region chunk. */
export interface RegionChunkDef {
  /** Unique identifier, matching minimap region ids where applicable. */
  id: string
  /**
   * World-space XZ reference point used for distance measurement.
   * Prefer the region's entrance / nearest-to-hub edge over its geometric
   * centre so that the activation distance is meaningful from the hub.
   * The Y component is ignored — only planar (XZ) distance is measured.
   */
  center: THREE.Vector3
  /**
   * Maximum distance from `center` at which a currently-hidden group is
   * made visible.  Must be less than hideDistance to create a hysteresis band.
   * Set to Infinity to mark the region as always-visible.
   */
  showDistance: number
  /**
   * Minimum distance from `center` at which a currently-visible group is
   * hidden.  Must be greater than showDistance.
   * Set to Infinity to mark the region as always-visible.
   */
  hideDistance: number
}

/**
 * Canonical region chunk definitions.
 *
 * Centres are biased toward each region's entry point (the edge closest to
 * the Hushwood hub) rather than the geometric centre so that the activation
 * radius feels consistent from the player's perspective.
 *
 * Hysteresis band = hideDistance − showDistance = 20 units, which at normal
 * walking speed (~6 u/s) gives ~3 seconds of buffer before a region toggles.
 */
export const REGION_CHUNKS: readonly RegionChunkDef[] = [
  // ── Always-visible starting hub ───────────────────────────────────────────
  {
    id: 'hushwood',
    center: new THREE.Vector3(0, 0, 0),
    showDistance: Infinity,
    hideDistance: Infinity,
  },
  // ── Surrounding regions ───────────────────────────────────────────────────
  // Redwake Quarry — north zone, trail entry at z ≈ −19.
  {
    id: 'quarry',
    center: new THREE.Vector3(0, 0, -25),
    showDistance: 120,
    hideDistance: 140,
  },
  // Gloamwater Shore — east zone, entry from settlement east edge.
  {
    id: 'shoreline',
    center: new THREE.Vector3(15, 0, 0),
    showDistance: 110,
    hideDistance: 130,
  },
  // Brackroot Bog — south zone, trail entry at z ≈ +19.
  {
    id: 'bog',
    center: new THREE.Vector3(0, 0, 25),
    showDistance: 110,
    hideDistance: 130,
  },
  // Marrowfen — deep-south fen, entry at z ≈ +60.
  {
    id: 'marrowfen',
    center: new THREE.Vector3(0, 0, 65),
    showDistance: 130,
    hideDistance: 150,
  },
  // Ashfen Copse — northeast zone, entry at x ≈ +34, z ≈ −54.
  {
    id: 'ashfen',
    center: new THREE.Vector3(38, 0, -58),
    showDistance: 130,
    hideDistance: 150,
  },
  // Tidemark Chapel — west zone, entry at x ≈ −32.
  {
    id: 'chapel',
    center: new THREE.Vector3(-38, 0, 0),
    showDistance: 110,
    hideDistance: 130,
  },
  // Hollow Vault Steps — deep-west ruin, entry at x ≈ −60.
  {
    id: 'hollow_vault',
    center: new THREE.Vector3(-65, 0, 0),
    showDistance: 130,
    hideDistance: 150,
  },
  // Belowglass Vaults — far-west late-game zone, entry at x ≈ −98.
  {
    id: 'belowglass',
    center: new THREE.Vector3(-102, 0, 0),
    showDistance: 140,
    hideDistance: 160,
  },
] as const

/**
 * Convenience lookup map from chunk id → RegionChunkDef.
 * Built once at module load; avoids repeated Array.find() calls in App.tsx.
 */
export const REGION_CHUNK_MAP: ReadonlyMap<string, RegionChunkDef> = new Map(
  REGION_CHUNKS.map((d) => [d.id, d] as [string, RegionChunkDef]),
)

// ─── Group capture helper ─────────────────────────────────────────────────────

/**
 * Execute `fn` synchronously (which is expected to call `scene.add()` one or
 * more times internally), then move every newly-added scene child into a
 * fresh THREE.Group that is itself added to the scene and returned.
 *
 * This lets existing region builder functions — which call `scene.add`
 * directly — be grouped for LOD visibility control without requiring any
 * changes to those builders.
 *
 * @param scene  The active THREE.Scene.
 * @param fn     Builder callback that populates the scene.
 * @returns      The group containing all objects added by `fn`.
 */
export function captureIntoGroup(
  scene: THREE.Scene,
  fn: () => void,
): THREE.Group {
  // Snapshot existing children so we can diff after fn() runs.
  const before = new Set<THREE.Object3D>(scene.children)

  fn()

  // Collect newly-added children into a snapshot array first to avoid
  // mutating scene.children while iterating it.
  const added = scene.children.filter((c) => !before.has(c))

  const group = new THREE.Group()
  for (const obj of added) {
    scene.remove(obj)
    group.add(obj)
  }
  scene.add(group)
  return group
}

// ─── LOD entry and per-frame updater ─────────────────────────────────────────

/** Pairs a region definition with its scene group for per-frame updates. */
export interface RegionLODEntry {
  def: RegionChunkDef
  group: THREE.Group
}

/** Scratch vector reused every frame to avoid allocation pressure. */
const _playerFlat = new THREE.Vector3()

/**
 * Call once per animation frame to show/hide region groups based on the
 * current player world position.
 *
 * Uses XZ-only (planar) distance so that height differences between regions
 * do not affect streaming boundaries.  Hysteresis prevents rapid toggling
 * when the player walks back and forth across an activation boundary.
 *
 * @param playerPos  Current player world position (Y component ignored).
 * @param entries    Region group entries built during scene initialisation.
 */
export function updateRegionLOD(
  playerPos: THREE.Vector3,
  entries: readonly RegionLODEntry[],
): void {
  _playerFlat.set(playerPos.x, 0, playerPos.z)

  for (const { def, group } of entries) {
    if (def.hideDistance === Infinity) {
      // Always-visible region — unconditionally ensure it stays shown.
      group.visible = true
      continue
    }

    const dist = _playerFlat.distanceTo(def.center)

    if (group.visible) {
      // Hysteresis: only hide once the player moves beyond the larger
      // hideDistance threshold, preventing toggling at the show boundary.
      if (dist > def.hideDistance) group.visible = false
    } else {
      // Show once the player is close enough to the showDistance threshold.
      if (dist <= def.showDistance) group.visible = true
    }
  }
}
