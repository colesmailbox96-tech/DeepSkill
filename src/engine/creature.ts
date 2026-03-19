/**
 * Phase 29 — Non-Aggressive Wildlife
 *
 * Extends the Phase 28 creature framework with wildlife-specific behaviour:
 *
 *   Flee state:
 *     Non-aggressive creatures sprint away from the player when the player
 *     enters their fleeRadius.  The flee target is the point directly opposite
 *     the player relative to the creature's current position, clamped to
 *     pursuitRadius from the spawn origin.  On arrival the creature enters a
 *     brief skittish idle before resuming normal roaming.
 *
 *   Harvestable drops:
 *     Creatures with a `dropItemId` expose themselves as interactables.  When
 *     the player presses [E] within interactRadius the harvest callback fires,
 *     which awards the drop and triggers a flee.  A `dropCooldown` timer (25 s)
 *     prevents repeated harvesting from the same instance.
 *
 *   Creatures added:
 *     - Cinderhare  — long-eared, quick; drops cinderhare_meat.
 *     - Slatebeak   — stocky wading bird; drops slatebeak_feather.
 *
 *   Three placeholder creatures from Phase 28 (murkweasel, bog_lurker,
 *   drift_moth) are retired in favour of the Phase 29 wildlife.
 *
 *   Phase 30 will introduce hostile Thornling and Mossback Toad using the
 *   same schema with an aggro state instead of flee.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'

// ─── Public types ─────────────────────────────────────────────────────────────

/** State of the creature's finite-state machine. */
export type CreatureState = 'idle' | 'roam' | 'flee' | 'reset'

/**
 * Static data schema for a creature type.
 * One CreatureDef represents the template used by spawnCreature(); multiple live
 * Creature instances may share the same def.
 */
export interface CreatureDef {
  /** Unique identifier for this creature type (e.g. 'cinderhare'). */
  id: string
  /** Display name shown in inspect UI and notification messages. */
  name: string
  /** Default spawn X position. */
  x: number
  /** Default spawn Z position (Y is always 0 / ground). */
  z: number
  /** Body colour as a hex integer (e.g. 0xc8a87c). */
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
   * Speed multiplier applied while fleeing (relative to `speed`).
   * Defaults to 1.8 so fleeing feels genuinely urgent.
   */
  fleeSpeedMult?: number
  /**
   * Base idle pause between roams (seconds).
   * Actual wait time is randomised ±50 % of this value each cycle.
   */
  idleBase: number
  /**
   * Distance from the player (metres) at which this creature will enter the
   * 'flee' state.  Set to 0 or omit for non-skittish creatures.
   */
  fleeRadius?: number
  /**
   * Item id awarded when the player harvests this creature (e.g. 'cinderhare_meat').
   * Omit for creatures that yield no direct drop.
   */
  dropItemId?: string
  /**
   * 0–1 probability that an interaction yields the drop.
   * Defaults to 0.75 when `dropItemId` is set.
   */
  dropChance?: number
}

/** A live creature instance in the world. */
export interface Creature {
  /** The def this creature was spawned from. */
  def: CreatureDef
  /** Scene group; position.y = 0 places the creature base on the ground. */
  mesh: THREE.Group
  /** Immutable world-space spawn position used for roam-radius and reset math. */
  spawnPos: THREE.Vector3
  /** Current movement destination while in 'roam' or 'flee' state. */
  targetPos: THREE.Vector3
  /** Current FSM state. */
  state: CreatureState
  /** Seconds remaining in the current idle pause. */
  idleTimer: number
  /**
   * Seconds until the creature can yield another drop (0 = ready).
   * Prevents repeated harvesting from the same instance.
   */
  dropCooldown: number
}

// ─── Creature definitions ─────────────────────────────────────────────────────

/**
 * Phase 29 wildlife: two non-aggressive species that roam the settlement
 * surroundings, flee from approaching players, and yield optional drops.
 */
const CREATURE_DEFS: CreatureDef[] = [
  // 1. Cinderhare — swift, long-eared animal that nests near the geothermal
  //    vents east of the settlement.  Drops raw meat when harvested.
  {
    id: 'cinderhare',
    name: 'Cinderhare',
    x: 14,
    z: -8,
    color: 0xc8a87c,
    scale: 0.6,
    roamRadius: 7,
    pursuitRadius: 18,
    speed: 3.2,
    fleeSpeedMult: 2.0,
    idleBase: 2.5,
    fleeRadius: 4.5,
    dropItemId: 'cinderhare_meat',
    dropChance: 0.8,
  },

  // 2. Slatebeak — stocky, dark-feathered wading bird common in the marsh
  //    margins west of the shoreline.  Drops a broad flight feather.
  {
    id: 'slatebeak',
    name: 'Slatebeak',
    x: -18,
    z: -4,
    color: 0x4a5260,
    scale: 0.75,
    roamRadius: 6,
    pursuitRadius: 16,
    speed: 2.4,
    fleeSpeedMult: 1.7,
    idleBase: 3.5,
    fleeRadius: 5.0,
    dropItemId: 'slatebeak_feather',
    dropChance: 0.75,
  },
]

/** Interaction radius for wildlife harvest. */
const HARVEST_INTERACT_RADIUS = 2.2

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Spawn all default wildlife into `scene` and return their live instances.
 *
 * @param scene         The Three.js scene to add meshes to.
 * @param interactables Shared interactable list; harvestable creatures are
 *                      registered here so the interaction system can target them.
 * @param onHarvest     Called when the player successfully harvests a creature.
 *                      Receives the Creature; caller decides which item to award.
 */
export function buildCreatures(
  scene: THREE.Scene,
  interactables: Interactable[],
  onHarvest: (creature: Creature) => void,
): Creature[] {
  return CREATURE_DEFS.map((def) => spawnCreature(scene, def, interactables, onHarvest))
}

/**
 * Spawn a single creature defined by `def` into `scene`.
 * Can be called by later phases to add individual creature types programmatically.
 */
export function spawnCreature(
  scene: THREE.Scene,
  def: CreatureDef,
  interactables?: Interactable[],
  onHarvest?: (creature: Creature) => void,
): Creature {
  const mesh = _buildMesh(def)
  scene.add(mesh)

  const spawnPos = new THREE.Vector3(def.x, 0, def.z)

  const creature: Creature = {
    def,
    mesh,
    spawnPos: spawnPos.clone(),
    targetPos: spawnPos.clone(),
    state: 'idle',
    idleTimer: def.idleBase * (0.5 + Math.random()),
    dropCooldown: 0,
  }

  // Register as an interactable if it has a drop and a harvest callback.
  if (def.dropItemId && interactables && onHarvest) {
    interactables.push({
      mesh,
      label: `Harvest ${def.name}`,
      interactRadius: HARVEST_INTERACT_RADIUS,
      onInteract() {
        onHarvest(creature)
      },
    })
  }

  return creature
}

/**
 * Advance every creature's AI one simulation step.
 * Call once per animation frame with the frame delta (seconds).
 *
 * @param creatures  The live creature array returned by buildCreatures().
 * @param delta      Frame time in seconds.
 * @param playerPos  Current player world position; used for flee detection.
 */
export function updateCreatures(
  creatures: Creature[],
  delta: number,
  playerPos: THREE.Vector3,
): void {
  for (const creature of creatures) {
    // Tick drop cooldown regardless of AI state.
    if (creature.dropCooldown > 0) {
      creature.dropCooldown = Math.max(0, creature.dropCooldown - delta)
    }
    _stepCreature(creature, delta, playerPos)
  }
}

/**
 * Externally trigger a flee on a creature from a given world position.
 * Used by the harvest callback in App.tsx when the player interacts with wildlife.
 */
export function triggerFlee(creature: Creature, fromPos: THREE.Vector3): void {
  _startFlee(creature, fromPos)
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Run one FSM step for a single creature.
 *
 * States:
 *   idle  → decrement timer; check flee trigger; on expiry pick a roam target.
 *   roam  → translate toward targetPos; check flee trigger; on arrival → idle.
 *   flee  → sprint away from player; on arrival → idle (skittish pause).
 *   reset → teleport back to spawn; enter idle.
 *
 * Flee logic:
 *   When the player is within `fleeRadius` the creature computes a flee target
 *   directly opposite the player, clamped to pursuitRadius from spawn.  The
 *   flee state uses fleeSpeedMult × speed to sprint.
 *
 * Pursuit / safety bounds:
 *   Before the FSM runs, if the creature is beyond pursuitRadius from its spawn
 *   position it is immediately snapped back and enters idle.
 */
function _stepCreature(c: Creature, delta: number, playerPos: THREE.Vector3): void {
  const pos = c.mesh.position

  // ── Pursue-radius safety bounds ──────────────────────────────────────────
  if (pos.distanceTo(c.spawnPos) > c.def.pursuitRadius) {
    _resetToSpawn(c)
    return
  }

  // ── Flee trigger — overrides idle/roam but not an already-active flee ───
  if (c.state !== 'flee' && c.state !== 'reset') {
    const fr = c.def.fleeRadius ?? 0
    if (fr > 0) {
      const dx = pos.x - playerPos.x
      const dz = pos.z - playerPos.z
      const distToPlayer = Math.sqrt(dx * dx + dz * dz)
      if (distToPlayer < fr) {
        _startFlee(c, playerPos)
        return
      }
    }
  }

  // ── FSM ──────────────────────────────────────────────────────────────────
  switch (c.state) {
    case 'idle': {
      c.idleTimer -= delta
      if (c.idleTimer <= 0) {
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
        pos.x = c.targetPos.x
        pos.z = c.targetPos.z
        c.state = 'idle'
        c.idleTimer = c.def.idleBase * (0.5 + Math.random())
      } else {
        const step = Math.min(c.def.speed * delta, distToTarget)
        const invDist = 1 / distToTarget
        pos.x += dx * invDist * step
        pos.z += dz * invDist * step
        c.mesh.rotation.y = Math.atan2(dx * invDist, dz * invDist)
      }
      break
    }

    case 'flee': {
      const dx = c.targetPos.x - pos.x
      const dz = c.targetPos.z - pos.z
      const distToTarget = Math.sqrt(dx * dx + dz * dz)
      const fleeSpeed = c.def.speed * (c.def.fleeSpeedMult ?? 1.8)

      if (distToTarget < 0.2) {
        pos.x = c.targetPos.x
        pos.z = c.targetPos.z
        c.state = 'idle'
        // Skittish pause: slightly longer idle after fleeing.
        c.idleTimer = c.def.idleBase * (1.0 + Math.random() * 0.5)
      } else {
        const step = Math.min(fleeSpeed * delta, distToTarget)
        const invDist = 1 / distToTarget
        pos.x += dx * invDist * step
        pos.z += dz * invDist * step
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

/**
 * Compute a flee-away target and transition the creature to the 'flee' state.
 * The flee destination is the point directly opposite the player from the
 * creature's position, clamped to pursuitRadius from the spawn origin.
 */
function _startFlee(c: Creature, playerPos: THREE.Vector3): void {
  const pos = c.mesh.position

  // Direction away from player (creature → player, then negate).
  const awayX = pos.x - playerPos.x
  const awayZ = pos.z - playerPos.z
  const len = Math.sqrt(awayX * awayX + awayZ * awayZ) || 1

  // Sprint 60 % of pursuitRadius in the away direction — far enough to feel
  // urgent while staying well within the safety boundary before clamping.
  const sprintDist = c.def.pursuitRadius * 0.6
  let targetX = pos.x + (awayX / len) * sprintDist
  let targetZ = pos.z + (awayZ / len) * sprintDist

  // Clamp flee target to within pursuitRadius of spawn.
  const tdx = targetX - c.spawnPos.x
  const tdz = targetZ - c.spawnPos.z
  const tDist = Math.sqrt(tdx * tdx + tdz * tdz)
  if (tDist > c.def.pursuitRadius) {
    const scale = c.def.pursuitRadius / tDist
    targetX = c.spawnPos.x + tdx * scale
    targetZ = c.spawnPos.z + tdz * scale
  }

  c.targetPos.set(targetX, 0, targetZ)
  c.state = 'flee'
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
