import * as THREE from 'three'

// ─── Tuneable constants ───────────────────────────────────────────────────────

/** Minimum pitch (radians) – keeps the horizon just visible. */
export const PHI_MIN = 0.08
/** Maximum pitch (radians) – avoids flipping over the top. */
export const PHI_MAX = Math.PI / 2 - 0.05
/** Closest the camera can get to the player (metres). */
export const RADIUS_MIN = 2
/** Furthest the camera can pull back (metres). */
export const RADIUS_MAX = 18
/** Angle sensitivity for pointer-drag orbit (radians per pixel). */
const ORBIT_SENSITIVITY = 0.005
/** Zoom speed (radius units per normalised scroll notch). */
const ZOOM_SPEED = 1.0
/** Smoothing factor – higher = snappier camera. */
const LERP_FACTOR = 10
/** Height above the player's base to use as the look-at point. */
const LOOK_RAISE = 1.0
/** Pull the camera in this many metres from a collision surface. */
const COLLISION_MARGIN = 0.25

// ─── Per-frame scratch objects (no per-frame heap allocations) ────────────────

const _offset = new THREE.Vector3()
const _lookAt = new THREE.Vector3()
const _rayDir = new THREE.Vector3()
const _raycaster = new THREE.Raycaster()

// ─── Public API ───────────────────────────────────────────────────────────────

export interface CameraState {
  /** Target yaw angle around the Y-axis (radians). */
  thetaTarget: number
  /** Target pitch angle from the vertical (radians, clamped to [PHI_MIN, PHI_MAX]). */
  phiTarget: number
  /** Target orbit radius (metres, clamped to [RADIUS_MIN, RADIUS_MAX]). */
  radiusTarget: number
  /** Smoothed yaw – updated each frame. */
  theta: number
  /** Smoothed pitch – updated each frame. */
  phi: number
  /** Smoothed radius – updated each frame. */
  radius: number
}

/** Create a default CameraState positioned behind the player at 45° pitch. */
export function createCameraState(): CameraState {
  return {
    thetaTarget: 0,
    phiTarget: Math.PI / 4,
    radiusTarget: 7,
    theta: 0,
    phi: Math.PI / 4,
    radius: 7,
  }
}

/**
 * Update the orbit camera each frame.
 *
 * Smooths toward target angles/radius, then positions the camera on a sphere
 * around the player's eye-level point.  If `collidables` is non-empty a
 * ray is cast from the look-at point to the desired camera position; the
 * radius is shortened to avoid clipping through geometry.
 */
export function updateOrbitCamera(
  camera: THREE.PerspectiveCamera,
  target: THREE.Object3D,
  state: CameraState,
  delta: number,
  collidables: THREE.Object3D[],
): void {
  // Smooth all three values toward their targets.
  const t = Math.min(1, LERP_FACTOR * delta)
  state.theta  += (state.thetaTarget  - state.theta)  * t
  state.phi    += (state.phiTarget    - state.phi)    * t
  state.radius += (state.radiusTarget - state.radius) * t

  // Look-at point: player position raised to eye height.
  _lookAt.copy(target.position)
  _lookAt.y += LOOK_RAISE

  // Compute the spherical offset at the smoothed radius.
  _sphereOffset(state.theta, state.phi, state.radius, _offset)

  // Collision-aware radius: cast a ray from lookAt toward the camera.
  let clippedRadius = state.radius
  if (collidables.length > 0) {
    _rayDir.copy(_offset).normalize()
    _raycaster.set(_lookAt, _rayDir)
    const hits = _raycaster.intersectObjects(collidables, true)
    if (hits.length > 0 && hits[0].distance < state.radius) {
      clippedRadius = Math.max(RADIUS_MIN, hits[0].distance - COLLISION_MARGIN)
      // Recompute offset at the clipped radius.
      _sphereOffset(state.theta, state.phi, clippedRadius, _offset)
    }
  }

  camera.position.copy(_lookAt).add(_offset)
  camera.lookAt(_lookAt)
}

/**
 * Apply a pointer-drag delta to the camera state.
 * `dx` and `dy` are raw pixel deltas from a pointermove event.
 */
export function applyOrbitDrag(state: CameraState, dx: number, dy: number): void {
  state.thetaTarget -= dx * ORBIT_SENSITIVITY
  state.phiTarget = THREE.MathUtils.clamp(
    state.phiTarget + dy * ORBIT_SENSITIVITY,
    PHI_MIN,
    PHI_MAX,
  )
}

/**
 * Apply a scroll wheel delta to the camera state.
 * `normalised` should be in "pixel" units (multiply line/page deltas before
 * calling).  One typical mouse notch ≈ 100 pixels.
 */
export function applyZoom(state: CameraState, normalised: number): void {
  state.radiusTarget = THREE.MathUtils.clamp(
    state.radiusTarget + normalised * 0.01 * ZOOM_SPEED,
    RADIUS_MIN,
    RADIUS_MAX,
  )
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/** Convert spherical (theta, phi, r) to a Cartesian offset vector. */
function _sphereOffset(
  theta: number,
  phi: number,
  r: number,
  out: THREE.Vector3,
): void {
  out.set(
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.cos(theta),
  )
}
