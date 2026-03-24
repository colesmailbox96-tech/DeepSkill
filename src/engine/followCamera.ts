import * as THREE from 'three'

// ─── Tuneable constants ───────────────────────────────────────────────────────

/** Minimum pitch (radians) – near top-down, but not fully vertical. */
export const PHI_MIN = 0.2
/** Maximum pitch (radians) – prevents dropping to low-angle combat framing. */
export const PHI_MAX = 1.1
/** Closest the camera can get to the player (metres). */
export const RADIUS_MIN = 6
/** Furthest the camera can pull back (metres). */
export const RADIUS_MAX = 20
/** Angle sensitivity for pointer-drag orbit (radians per pixel). */
const ORBIT_SENSITIVITY = 0.005
/** Angle sensitivity for touch-drag orbit on mobile (radians per pixel).
 *  Intentionally lower than mouse sensitivity – finger swipes cover more
 *  screen distance so the same pixel-delta formula feels too fast. */
export const TOUCH_ORBIT_SENSITIVITY = 0.003
/** Zoom speed (radius units per normalised scroll notch). */
const ZOOM_SPEED = 0.7
/** Smoothing factor – higher = snappier camera. */
const LERP_FACTOR = 10
/** Height above the player's base used as the follow target. */
const FOLLOW_HEIGHT = 1.6
/** Horizontal shoulder offset (metres), applied on camera-right axis. */
const SHOULDER_OFFSET = 1.2
/** Pull the camera in this many metres from a collision surface. */
const COLLISION_MARGIN = 0.25
/** Absolute minimum radius used when collision clipping is active. */
const COLLISION_RADIUS_MIN = 0.75
/** Follow smoothing factor – higher = tighter target tracking. */
const FOLLOW_LERP_FACTOR = 8

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
  /** Smoothed follow target to reduce jitter while moving. */
  followTarget: THREE.Vector3
  /** Whether followTarget has been initialized to the player's position. */
  followInitialized: boolean
}

/** Create a default CameraState with a high-angle exploration framing. */
export function createCameraState(): CameraState {
  return {
    thetaTarget: 0,
    phiTarget: 0.55,
    radiusTarget: 11,
    theta: 0,
    phi: 0.55,
    radius: 11,
    followTarget: new THREE.Vector3(),
    followInitialized: false,
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

  // Smooth follow target: player position raised to exploration framing height.
  const followT = Math.min(1, FOLLOW_LERP_FACTOR * delta)
  if (!state.followInitialized) {
    state.followTarget.copy(target.position)
    state.followTarget.y += FOLLOW_HEIGHT
    state.followInitialized = true
  } else {
    _lookAt.copy(target.position)
    _lookAt.y += FOLLOW_HEIGHT
    state.followTarget.lerp(_lookAt, followT)
  }

  // Shoulder-offset look-at point, applied on yaw-relative right axis.
  _lookAt.copy(state.followTarget)
  _applyShoulderOffset(_lookAt, state.theta, SHOULDER_OFFSET)

  // Compute the spherical offset at the smoothed radius.
  _sphereOffset(state.theta, state.phi, state.radius, _offset)

  // Collision-aware radius: cast a ray from lookAt toward the camera.
  let clippedRadius = state.radius
  if (collidables.length > 0) {
    _rayDir.copy(_offset).normalize()
    _raycaster.set(_lookAt, _rayDir)
    _raycaster.far = state.radius
    const hits = _raycaster.intersectObjects(collidables, true)
    if (hits.length > 0 && hits[0].distance < state.radius) {
      clippedRadius = Math.max(COLLISION_RADIUS_MIN, hits[0].distance - COLLISION_MARGIN)
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
 * Pass an explicit `sensitivity` to override the default (e.g. use
 * `TOUCH_ORBIT_SENSITIVITY` for touch-based orbit on mobile).
 */
export function applyOrbitDrag(
  state: CameraState,
  dx: number,
  dy: number,
  sensitivity: number = ORBIT_SENSITIVITY,
): void {
  state.thetaTarget -= dx * sensitivity
  state.phiTarget = THREE.MathUtils.clamp(
    state.phiTarget + dy * sensitivity,
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

/** Apply a yaw-relative shoulder offset on the horizontal camera-right axis. */
function _applyShoulderOffset(out: THREE.Vector3, theta: number, shoulder: number): void {
  out.x += Math.cos(theta) * shoulder
  out.z -= Math.sin(theta) * shoulder
}
