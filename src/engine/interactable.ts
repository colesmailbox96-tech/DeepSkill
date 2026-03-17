import type * as THREE from 'three'

/** Anything in the world that the player can interact with. */
export interface Interactable {
  /** The Three.js object used for position + proximity checks. */
  mesh: THREE.Object3D
  /** Label shown in the interaction prompt (e.g. "Wooden Chest", "Gate Lever"). */
  label: string
  /** Proximity radius within which the player can target this object (metres). */
  interactRadius: number
  /** Called once when the player confirms interaction (default key: E). */
  onInteract: () => void
}

/** Live interaction targeting state. */
export interface InteractionState {
  /** The interactable currently nearest and in range, or null when clear. */
  target: Interactable | null
}

/** Create a fresh InteractionState with no active target. */
export function createInteractionState(): InteractionState {
  return { target: null }
}
