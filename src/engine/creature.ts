/**
 * Phase 28 — Basic Creature Framework
 *
 * Implements the foundational non-player entity system:
 *   - Creature data schema (CreatureDef) — defines static properties per creature type.
 *   - Live creature instance type (Creature) — runtime state for each spawned entity.
 *   - Spawn system (buildCreatures / spawnCreature) — instantiates meshes and places
 *     them in the scene at their defined spawn positions.
 *   - Idle roaming — creatures periodically pick a random destination within their
 *     roam radius and walk toward it, then pause before choosing the next target.
 *   - Pursuit bounds — each creature has a pursuit radius beyond which it will not
 *     stray from its spawn point; this cap is used by future aggro logic (Phase 30).
 *   - Despawn / reset logic — if a creature exceeds its pursuit radius it is
 *     immediately returned to its spawn position and re-enters idle state.
 *
 * Three placeholder creatures are spawned around the settlement perimeter to
 * exercise the full framework.  Phase 29 will replace these with properly
 * named wildlife (Cinderhare, Slatebeak) using the same API.
 */

import * as THREE from 'three'

// ─── Public types ─────────────────────────────────────────────────────────────

/** State of the creature's finite-state machine. */
export type CreatureState = 'idle' | 'roam' | 'reset'

/**
 * Static data schema for a creature type.
 * One CreatureDef represents the template used by spawnCreature(); multiple live
 * Creature instances may share the same def.
 */
export interface CreatureDef {
  /** Unique identifier for this creature type (e.g. 'murkweasel'). */
  id: string
  /** Display name shown in future combat / inspect UI. */
  name: string
  /** Default spawn X position. */
  x: number
  /** Default spawn Z position (Y is always 0 / ground). */
  z: number
  /** Body colour as a hex integer (e.g. 0x7a5a3a). */
  color: number
  /** Uniform scale applied to the base capsule geometry (1 = NPC-sized). */
  scale: number
  /**
   * Maximum wander distance from the spawn origin (metres).
   * Creatures pick random targets within this circle.
   */
  roamRadius: number
  /**
   * Safety boundary distance from spawn (metres).  Must be ≥ roamRadius.
   * When a creature's distance from spawn exceeds this value it is
   * immediately reset — this is the hook future pursuit logic will use.
   */
  pursuitRadius: number
  /** Movement speed while roaming (metres per second). */
  speed: number
  /**
   * Base idle pause between roams (seconds).
   * Actual wait time is randomised ±50 % of this value each cycle.
   */
  idleBase: number
}

/** A live creature instance in the world. */
export interface Creature {
  /** The def this creature was spawned from. */
  def: CreatureDef
  /** Scene group; position.y = 0 places the creature base on the ground. */
  mesh: THREE.Group
  /** Immutable world-space spawn position used for roam-radius and reset math. */
  spawnPos: THREE.Vector3
  /** Current movement destination while in 'roam' state. */
  targetPos: THREE.Vector3
  /** Current FSM state. */
  state: CreatureState
  /** Seconds remaining in the current idle pause. */
  idleTimer: number
}

// ─── Private creature definitions ────────────────────────────────────────────

/**
 * Three placeholder creatures positioned just outside the Hushwood perimeter
 * to validate all three framework states (idle, roam, reset).
 *
 * Phase 29 will introduce Cinderhare and Slatebeak using this same schema;
 * Phase 30 will add hostile Thornling and Mossback Toad with aggro radii.
 */
const CREATURE_DEFS: CreatureDef[] = [
  // 1. Murkweasel — small, quick rodent-like creature lurking north of the
  //    settlement on the quarry approach trail (z < −19).
  {
    id: 'murkweasel',
    name: 'Murkweasel',
    x: 5,
    z: -26,
    color: 0x7a5a3a,
    scale: 0.65,
    roamRadius: 6,
    pursuitRadius: 14,
    speed: 2.8,
    idleBase: 3,
  },

  // 2. Bog Lurker — slow, heavy creature loitering on the eastern trail toward
  //    Gloamwater Bank (x > 19).
  {
    id: 'bog_lurker',
    name: 'Bog Lurker',
    x: 28,
    z: 4,
    color: 0x4a6a42,
    scale: 1.05,
    roamRadius: 8,
    pursuitRadius: 18,
    speed: 1.6,
    idleBase: 6,
  },

  // 3. Drift Moth — small, flighty creature in the open field west of the
  //    settlement (x < −19).
  {
    id: 'drift_moth',
    name: 'Drift Moth',
    x: -24,
    z: 6,
    color: 0x8a78c0,
    scale: 0.5,
    roamRadius: 10,
    pursuitRadius: 20,
    speed: 3.2,
    idleBase: 2,
  },
]

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Spawn all default creatures into `scene` and return their live instances.
 * Pass the returned array to `updateCreatures()` on every animation frame.
 */
export function buildCreatures(scene: THREE.Scene): Creature[] {
  return CREATURE_DEFS.map((def) => spawnCreature(scene, def))
}

/**
 * Spawn a single creature defined by `def` into `scene`.
 * Can be called by later phases to add individual creature types programmatically.
 */
export function spawnCreature(scene: THREE.Scene, def: CreatureDef): Creature {
  const mesh = _buildMesh(def)
  scene.add(mesh)

  const spawnPos = new THREE.Vector3(def.x, 0, def.z)

  return {
    def,
    mesh,
    spawnPos: spawnPos.clone(),
    targetPos: spawnPos.clone(),
    state: 'idle',
    // Stagger the initial idle timers so creatures don't all move in sync.
    idleTimer: def.idleBase * (0.5 + Math.random()),
  }
}

/**
 * Advance every creature's AI one simulation step.
 * Call once per animation frame with the frame delta (seconds).
 */
export function updateCreatures(creatures: Creature[], delta: number): void {
  for (const creature of creatures) {
    _stepCreature(creature, delta)
  }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Run one FSM step for a single creature.
 *
 * States:
 *   idle  → decrement timer; on expiry pick a roam target and enter 'roam'.
 *   roam  → translate toward targetPos; on arrival enter 'idle'.
 *   reset → teleport back to spawn; enter 'idle'.  Provided as an explicit
 *           state so Phase 30 pursuit logic can trigger it cleanly.
 *
 * Pursuit / safety bounds:
 *   Before the FSM runs, if the creature is beyond pursuitRadius from its spawn
 *   position it is immediately snapped back and enters 'idle'.  This prevents
 *   runaway roaming and forms the hook for future aggro-return logic.
 */
function _stepCreature(c: Creature, delta: number): void {
  const pos = c.mesh.position

  // ── Pursuit / safety bounds check ───────────────────────────────────────
  if (pos.distanceTo(c.spawnPos) > c.def.pursuitRadius) {
    _resetToSpawn(c)
    return
  }

  // ── FSM ──────────────────────────────────────────────────────────────────
  switch (c.state) {
    case 'idle': {
      c.idleTimer -= delta
      if (c.idleTimer <= 0) {
        // Pick a random destination within roamRadius of spawn.
        const angle = Math.random() * Math.PI * 2
        const dist  = Math.random() * c.def.roamRadius
        c.targetPos.set(
          c.spawnPos.x + Math.cos(angle) * dist,
          0,
          c.spawnPos.z + Math.sin(angle) * dist,
        )
        c.state = 'roam'
      }
      break
    }

    case 'roam': {
      const dx = c.targetPos.x - pos.x
      const dz = c.targetPos.z - pos.z
      const distToTarget = Math.sqrt(dx * dx + dz * dz)

      if (distToTarget < 0.15) {
        // Arrived — snap to target and begin idle pause.
        pos.x = c.targetPos.x
        pos.z = c.targetPos.z
        c.state = 'idle'
        c.idleTimer = c.def.idleBase * (0.5 + Math.random())
      } else {
        // Translate toward target this frame.
        const step = Math.min(c.def.speed * delta, distToTarget)
        const invDist = 1 / distToTarget
        pos.x += dx * invDist * step
        pos.z += dz * invDist * step
        // Rotate mesh to face movement direction.
        c.mesh.rotation.y = Math.atan2(dx * invDist, dz * invDist)
      }
      break
    }

    case 'reset': {
      _resetToSpawn(c)
      break
    }
  }
}

/** Teleport the creature back to its spawn origin and restart idle. */
function _resetToSpawn(c: Creature): void {
  c.mesh.position.copy(c.spawnPos)
  c.state = 'idle'
  c.idleTimer = c.def.idleBase * (0.5 + Math.random())
}

/**
 * Build the visual mesh for a creature.
 * Uses a capsule body scaled by `def.scale` — consistent with the NPC visual
 * style.  A small emissive eye-point differentiates creatures from inert NPCs.
 */
function _buildMesh(def: CreatureDef): THREE.Group {
  const group = new THREE.Group()
  group.position.set(def.x, 0, def.z)

  // Body capsule — scaled uniformly from the NPC baseline dimensions.
  const r  = 0.25 * def.scale   // capsule radius
  const h  = 0.9  * def.scale   // cylinder height (capsule segment)
  const bodyMat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.75 })
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 4, 8), bodyMat)
  // Centre of capsule is at r + h/2 above ground.
  body.position.y = r + h / 2
  group.add(body)

  // Eye-point — a tiny emissive sphere at the front-upper face of the body.
  // Gives creatures a distinct look and hints at facing direction.
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xffd060,
    emissive: new THREE.Color(0xffd060),
    emissiveIntensity: 0.6,
    roughness: 0.4,
  })
  const eyeR = 0.055 * def.scale
  const eye = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 6, 6), eyeMat)
  eye.position.set(0, r + h, r * 0.85)   // front-centre, near the top
  group.add(eye)

  return group
}
