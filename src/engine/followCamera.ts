import * as THREE from 'three'

/** Fixed camera offset from the player in world space. */
const OFFSET = new THREE.Vector3(0, 3.8, 7)
/** Look-target raised slightly above the player's base so the camera frames the avatar. */
const LOOK_RAISE = new THREE.Vector3(0, 1, 0)
/** How quickly the camera catches up to the player (units per second, clamped to 1). */
const LERP_FACTOR = 8

// Reused each frame to avoid per-frame allocations.
const _desired = new THREE.Vector3()
const _lookAt = new THREE.Vector3()

export function updateFollowCamera(
  camera: THREE.PerspectiveCamera,
  target: THREE.Object3D,
  delta: number,
): void {
  _desired.copy(target.position).add(OFFSET)
  camera.position.lerp(_desired, Math.min(1, LERP_FACTOR * delta))
  _lookAt.copy(target.position).add(LOOK_RAISE)
  camera.lookAt(_lookAt)
}
