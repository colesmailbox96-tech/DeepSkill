import * as THREE from 'three'

export type MoveState = 'idle' | 'walk'

export interface Player {
  mesh: THREE.Group
  moveState: MoveState
  speed: number
}

/**
 * Safety-clamp applied as a last-resort fallback in case all boundary-wall
 * collision pushback is bypassed.  Both Hushwood (±19) and Redwake Quarry
 * (z down to ≈−96) plus their connecting corridor are within ±100, so this
 * value is intentionally generous — the invisible boundary walls do the real
 * work of keeping the player inside each zone.
 */
const HALF_BOUNDS = 100

/** Approximate horizontal radius of the player capsule (metres). */
const PLAYER_RADIUS = 0.35

// Reused each frame to avoid per-frame heap allocations.
const _dir = new THREE.Vector3()

export function createPlayer(scene: THREE.Scene): Player {
  const group = new THREE.Group()

  const mat = new THREE.MeshStandardMaterial({ color: 0x3a7bd5, roughness: 0.6 })
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.0, 4, 8), mat)
  // Capsule origin is at its centre; shift up so the bottom sits on y=0.
  body.position.y = 0.8
  group.add(body)

  scene.add(group)

  return { mesh: group, moveState: 'idle', speed: 5 }
}

export function updatePlayer(
  player: Player,
  keys: Set<string>,
  delta: number,
  /** Camera yaw (radians). When provided, WASD moves relative to the camera. */
  cameraYaw = 0,
  /** Static collidable bounding boxes – precomputed once, player is pushed out of each. */
  collidables: THREE.Box3[] = [],
): void {
  _dir.set(0, 0, 0)

  if (keys.has('KeyW') || keys.has('ArrowUp')) _dir.z -= 1
  if (keys.has('KeyS') || keys.has('ArrowDown')) _dir.z += 1
  if (keys.has('KeyA') || keys.has('ArrowLeft')) _dir.x -= 1
  if (keys.has('KeyD') || keys.has('ArrowRight')) _dir.x += 1

  if (_dir.lengthSq() > 0) {
    player.moveState = 'walk'
    _dir.normalize()

    // Rotate the local-space direction into world space around the camera yaw.
    // x_world =  x_local·cos(θ) + z_local·sin(θ)
    // z_world = -x_local·sin(θ) + z_local·cos(θ)
    const cos = Math.cos(cameraYaw)
    const sin = Math.sin(cameraYaw)
    const wx = _dir.x * cos + _dir.z * sin
    const wz = -_dir.x * sin + _dir.z * cos
    _dir.x = wx
    _dir.z = wz

    // Capture rotation angle from the world-space direction before scaling.
    const angle = Math.atan2(_dir.x, _dir.z)

    _dir.multiplyScalar(player.speed * delta)

    player.mesh.position.x = THREE.MathUtils.clamp(
      player.mesh.position.x + _dir.x,
      -HALF_BOUNDS,
      HALF_BOUNDS,
    )
    player.mesh.position.z = THREE.MathUtils.clamp(
      player.mesh.position.z + _dir.z,
      -HALF_BOUNDS,
      HALF_BOUNDS,
    )

    // Rotate mesh to face the direction of travel.
    player.mesh.rotation.y = angle
  } else {
    player.moveState = 'idle'
  }

  // AABB pushback — keep player outside all precomputed collidable bounding boxes.
  for (const bbox of collidables) {
    const ex = bbox.min.x - PLAYER_RADIUS
    const EX = bbox.max.x + PLAYER_RADIUS
    const ez = bbox.min.z - PLAYER_RADIUS
    const EZ = bbox.max.z + PLAYER_RADIUS
    const px = player.mesh.position.x
    const pz = player.mesh.position.z
    if (px > ex && px < EX && pz > ez && pz < EZ) {
      const dL = px - ex
      const dR = EX - px
      const dF = pz - ez
      const dB = EZ - pz
      const m = Math.min(dL, dR, dF, dB)
      if (m === dL) player.mesh.position.x = ex
      else if (m === dR) player.mesh.position.x = EX
      else if (m === dF) player.mesh.position.z = ez
      else player.mesh.position.z = EZ
    }
  }
}
