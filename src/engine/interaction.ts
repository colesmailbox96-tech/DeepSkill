import * as THREE from 'three'
import type { Interactable, InteractionState } from './interactable'
import type { Player } from './player'

// Reused scratch vector — avoids per-frame heap allocations.
const _itemWorldPos = new THREE.Vector3()

/**
 * Update the interaction targeting state each frame.
 *
 * Scans all registered interactables and finds the one closest to the player
 * whose **horizontal** (XZ ground-plane) distance is within that object's
 * `interactRadius`.  Y-axis separation is intentionally ignored so that
 * objects on raised platforms or stairs remain reachable when the player
 * stands at their base.  The nearest qualifying object becomes `state.target`;
 * all others are cleared.
 *
 * World-space positions are resolved via `getWorldPosition` so the system
 * works correctly even when an interactable mesh is nested inside a parent
 * group or transform node.
 */
export function updateInteraction(
  state: InteractionState,
  player: Player,
  interactables: Interactable[],
): void {
  const px = player.mesh.position.x
  const pz = player.mesh.position.z
  let best: Interactable | null = null
  let bestDistSq = Infinity

  for (const item of interactables) {
    item.mesh.getWorldPosition(_itemWorldPos)
    const dx = _itemWorldPos.x - px
    const dz = _itemWorldPos.z - pz
    const distSq = dx * dx + dz * dz
    const r = item.interactRadius
    if (distSq > r * r || distSq > bestDistSq) continue
    bestDistSq = distSq
    best = item
  }

  state.target = best
}
