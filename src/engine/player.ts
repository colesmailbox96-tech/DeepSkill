import * as THREE from 'three'

export type MoveState = 'idle' | 'walk'

export interface Player {
  mesh: THREE.Group
  moveState: MoveState
  speed: number
}

/** Half-width of the 24×24 ground plane, with a small inset so the player stays visible. */
const HALF_BOUNDS = 11.5

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
): void {
  const dir = new THREE.Vector3()

  if (keys.has('KeyW') || keys.has('ArrowUp')) dir.z -= 1
  if (keys.has('KeyS') || keys.has('ArrowDown')) dir.z += 1
  if (keys.has('KeyA') || keys.has('ArrowLeft')) dir.x -= 1
  if (keys.has('KeyD') || keys.has('ArrowRight')) dir.x += 1

  if (dir.lengthSq() > 0) {
    player.moveState = 'walk'
    dir.normalize()

    // Capture rotation angle from the unit-direction vector before scaling.
    const angle = Math.atan2(dir.x, dir.z)

    dir.multiplyScalar(player.speed * delta)

    player.mesh.position.x = THREE.MathUtils.clamp(
      player.mesh.position.x + dir.x,
      -HALF_BOUNDS,
      HALF_BOUNDS,
    )
    player.mesh.position.z = THREE.MathUtils.clamp(
      player.mesh.position.z + dir.z,
      -HALF_BOUNDS,
      HALF_BOUNDS,
    )

    // Rotate mesh to face the direction of travel.
    player.mesh.rotation.y = angle
  } else {
    player.moveState = 'idle'
  }
}
