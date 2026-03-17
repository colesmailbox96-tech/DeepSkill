import type { Interactable, InteractionState } from './interactable'
import type { Player } from './player'

/**
 * Update the interaction targeting state each frame.
 *
 * Scans all registered interactables and finds the one closest to the player
 * whose **horizontal** (XZ ground-plane) distance is within that object's
 * `interactRadius`.  Y-axis separation is intentionally ignored so that
 * objects on raised platforms or stairs remain reachable when the player
 * stands at their base.  The nearest qualifying object becomes `state.target`;
 * all others are cleared.
 */
export function updateInteraction(
  state: InteractionState,
  player: Player,
  interactables: Interactable[],
): void {
  const { x: px, z: pz } = player.mesh.position
  let best: Interactable | null = null
  let bestDistSq = Infinity

  for (const item of interactables) {
    const dx = item.mesh.position.x - px
    const dz = item.mesh.position.z - pz
    const distSq = dx * dx + dz * dz
    const r = item.interactRadius
    if (distSq > r * r || distSq > bestDistSq) continue
    bestDistSq = distSq
    best = item
  }

  state.target = best
}
