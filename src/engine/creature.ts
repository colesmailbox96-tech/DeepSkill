/**
 * Phase 29 — Non-Aggressive Wildlife
 * Phase 30 — Starter Hostile Creatures
 *
 * Phase 29 extensions:
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
 * Phase 30 extensions:
 *   Aggro state:
 *     Hostile creatures charge the player when the player enters their
 *     aggroRadius.  They pursue until the player escapes beyond pursuitRadius
 *     from the creature's spawn, at which point they reset.  While adjacent
 *     (within MELEE_RANGE) they fire periodic attacks governed by attackCooldown.
 *     Each attack invokes the optional `onAttack` callback so callers can apply
 *     damage to the player.
 *
 *   Health / defeat / respawn:
 *     Hostile creatures have a finite HP pool (maxHp).  When hp reaches zero
 *     the creature enters the 'dead' state: its mesh is hidden and a respawn
 *     countdown begins.  After respawnDelay seconds the creature is fully
 *     restored and re-enters idle at its spawn position.
 *
 *   Phase 30 hostile creatures:
 *     - Thornling     — dense briar-beast lurking north of the settlement.
 *     - Mossback Toad — bloated swamp amphibian from the marsh margins.
 *
 *   Phase 31 will add target selection and player-side damage application using
 *   the exported damageCreature() helper added in this phase.
 *
 * Phase 56 — Creature Behavior Improvement Pass:
 *   Leash logic:
 *     Hostile creatures now track the player's distance from the creature's own
 *     spawn origin (leashRadius).  When the player exits the leash boundary the
 *     creature disengages immediately instead of chasing indefinitely.
 *
 *   Better return-to-spawn:
 *     Instead of an instant teleport, disengaging creatures enter the new
 *     'return' state and walk home at a brisk pace.  Only the dead-respawn path
 *     still teleports (intentional invisibility during respawn).
 *
 *   Obstacle awareness / separation steering:
 *     After each movement step, a lightweight separation force pushes nearby
 *     creatures apart.  This prevents creatures from stacking on the same tile
 *     and improves perceived obstacle awareness without requiring a navmesh.
 *
 *   Swarm jitter reduction:
 *     The 'return' state is excluded from aggro/flee re-triggers so a creature
 *     that has disengaged completes its walk home before re-entering combat.
 *     Separation forces also prevent the oscillation that occurs when many
 *     creatures converge on the same world point.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * State of the creature's finite-state machine.
 *
 * Phase 56 adds 'return': the creature walks back to its spawn origin after
 * disengaging from pursuit (aggro leash broken or pursuit-radius exceeded).
 * This replaces the instant teleport used by earlier phases.
 */
export type CreatureState = 'idle' | 'roam' | 'flee' | 'reset' | 'aggro' | 'dead' | 'return'

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

  // ── Phase 30 hostile fields ───────────────────────────────────────────────

  /**
   * Distance from the player (metres) at which a hostile creature transitions
   * to the 'aggro' state and begins pursuing.  Set to 0 or omit for
   * non-aggressive creatures.
   */
  aggroRadius?: number
  /**
   * Maximum hit-points for this creature.  Omit for non-combative wildlife.
   * Hostile creatures (aggroRadius > 0) must set this.
   */
  maxHp?: number
  /**
   * Damage dealt to the player per melee hit (default: DEFAULT_ATTACK_DAMAGE).
   * Only relevant for hostile creatures.
   */
  attackDamage?: number
  /**
   * Seconds between successive attacks while in melee range
   * (default: DEFAULT_ATTACK_COOLDOWN).
   */
  attackCooldown?: number
  /**
   * Seconds after defeat before the creature respawns at its origin
   * (default: DEFAULT_RESPAWN_DELAY).
   */
  respawnDelay?: number
  /**
   * Phase 56 — Leash radius (metres from spawn origin).
   *
   * A hostile creature disengages from pursuit and enters the 'return' state
   * when the *player* moves this far from the creature's spawn.  This prevents
   * creatures from following the player across the entire map.
   *
   * Defaults to `pursuitRadius` when omitted, which preserves the existing
   * "creature distance from spawn" cut-off behaviour while also adding the
   * player-side check.
   */
  leashRadius?: number
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

  // ── Phase 30 combat fields ────────────────────────────────────────────────

  /**
   * Current hit-points.  Equals def.maxHp on spawn.  0 for non-hostile
   * creatures that have no maxHp defined.
   */
  hp: number
  /**
   * Seconds until this creature can land another melee hit on the player.
   * Reloads from def.attackCooldown after each attack.
   */
  attackTimer: number
  /**
   * Countdown (seconds) while the creature is in the 'dead' state.
   * Decrements each frame; when it reaches 0 the creature respawns.
   */
  respawnTimer: number
}

// ─── Creature definitions ─────────────────────────────────────────────────────

// ── Phase 30 constants ────────────────────────────────────────────────────────

/** Melee range (metres): distance at which a hostile creature can land a hit. */
const MELEE_RANGE = 1.8

/** Default damage per hit when def.attackDamage is not set. */
const DEFAULT_ATTACK_DAMAGE = 4

/** Default seconds between successive hits when def.attackCooldown is not set. */
const DEFAULT_ATTACK_COOLDOWN = 1.5

/** Default seconds before a defeated creature respawns. */
const DEFAULT_RESPAWN_DELAY = 30

// ── Phase 56 constants ────────────────────────────────────────────────────────

/**
 * Speed multiplier applied while a creature walks back to its spawn origin
 * in the 'return' state.  Slightly faster than normal roam speed so the
 * return feels purposeful without being instant.
 */
const RETURN_SPEED_MULT = 1.3

/**
 * Distance threshold (metres) at which a returning creature considers itself
 * home and re-enters the idle state.
 */
const RETURN_ARRIVAL_DIST = 0.4

/**
 * Minimum centre-to-centre distance (metres) below which the separation
 * steering force activates between two creatures.  Sized to prevent creatures
 * from occupying the same tile without being so large that they repel at
 * visible ranges.
 */
const SEPARATION_RADIUS = 1.4

/**
 * Strength scalar for the separation steering force (metres/second).  Applied
 * proportional to how deeply two creatures overlap within SEPARATION_RADIUS.
 */
const SEPARATION_STRENGTH = 2.5

/**
 * Phase 29 wildlife: two non-aggressive species that roam the settlement
 * surroundings, flee from approaching players, and yield optional drops.
 * Phase 30 hostile creatures: two aggressive species that pursue and attack.
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

  // 3. Thornling — Phase 30 hostile creature.  A dense, briar-wrapped biped
  //    that lurks north of the settlement.  Aggressive on sight; slow but hits
  //    hard.
  {
    id: 'thornling',
    name: 'Thornling',
    x: 8,
    z: 18,
    color: 0x2d5a27,
    scale: 1.05,
    roamRadius: 6,
    pursuitRadius: 22,
    speed: 1.8,
    idleBase: 3.5,
    aggroRadius: 7,
    maxHp: 20,
    attackDamage: 4,
    attackCooldown: 2.0,
    respawnDelay: 45,
  },

  // 4. Mossback Toad — Phase 30 hostile creature.  A bloated amphibian haunting
  //    the western marsh margins.  Quicker than it looks; weaker but more
  //    frequent attacks.
  {
    id: 'mossback_toad',
    name: 'Mossback Toad',
    x: -14,
    z: 20,
    color: 0x556b2f,
    scale: 0.8,
    roamRadius: 5,
    pursuitRadius: 18,
    speed: 2.2,
    idleBase: 4.0,
    aggroRadius: 5,
    maxHp: 12,
    attackDamage: 3,
    attackCooldown: 1.5,
    respawnDelay: 30,
  },

  // 5. Snarl Whelp — Phase 35 Brackroot Trail creature.  A small, feral
  //    four-legged creature with mottled rust-brown fur.  Territorial but
  //    fragile — the weakest hostile in the trail zone.
  {
    id: 'snarl_whelp',
    name: 'Snarl Whelp',
    x: 6,
    z: 62,
    color: 0x8b4513,
    scale: 0.55,
    roamRadius: 5,
    pursuitRadius: 14,
    speed: 2.8,
    idleBase: 3.0,
    aggroRadius: 5,
    maxHp: 8,
    attackDamage: 2,
    attackCooldown: 1.2,
    respawnDelay: 20,
  },

  // 6. Brackroot Crawler — Phase 35 Brackroot Trail creature.  A heavily
  //    chitinous insect-like creature that lurks in the undergrowth.
  //    Slower than the Snarl Whelp but tougher, with a moderate bite.
  {
    id: 'brackroot_crawler',
    name: 'Brackroot Crawler',
    x: -8,
    z: 67,
    color: 0x3b5323,
    scale: 0.7,
    roamRadius: 5,
    pursuitRadius: 16,
    speed: 1.9,
    idleBase: 4.0,
    aggroRadius: 6,
    maxHp: 14,
    attackDamage: 3,
    attackCooldown: 2.0,
    respawnDelay: 30,
  },

  // 7. Chapel Wisp — Phase 47 Tidemark Chapel creature.  An unstable
  //    light-being that drifts through the flooded inner shrine.  Ethereal and
  //    swift, it attacks with a cold pulse.  Drops a wisp_ember.
  {
    id: 'chapel_wisp',
    name: 'Chapel Wisp',
    x: -52,
    z: -4,
    color: 0x90c0e8,
    scale: 0.65,
    roamRadius: 6,
    pursuitRadius: 20,
    speed: 2.6,
    fleeSpeedMult: 1.8,
    idleBase: 3.0,
    aggroRadius: 7,
    maxHp: 16,
    attackDamage: 3,
    attackCooldown: 1.8,
    respawnDelay: 35,
    dropItemId: 'wisp_ember',
    dropChance: 0.70,
  },

  // ── Phase 57 — Ashfen Copse creatures ────────────────────────────────────

  // 8. Hushfang — Phase 57 Ashfen Copse creature.  A sleek, low-slung predator
  //    with mottled charcoal-grey hide that blends with the mineral bark.  Quick
  //    and aggressive; drops a hollow fang on defeat.
  {
    id: 'hushfang',
    name: 'Hushfang',
    x: 48,
    z: -70,
    color: 0x2e2e34,
    scale: 0.80,
    roamRadius: 7,
    pursuitRadius: 22,
    leashRadius: 28,
    speed: 3.0,
    idleBase: 3.0,
    aggroRadius: 8,
    maxHp: 22,
    attackDamage: 5,
    attackCooldown: 1.6,
    respawnDelay: 40,
    dropItemId: 'hushfang_fang',
    dropChance: 0.65,
  },

  // 9. Ember Ram — Phase 57 Ashfen Copse creature.  A stocky, thick-horned
  //    beast with charred-rust fur and faintly glowing horn-tips fed by
  //    geothermal trace.  Slower than the Hushfang but hits harder; drops a
  //    warm horn shard on defeat.
  {
    id: 'ember_ram',
    name: 'Ember Ram',
    x: 58,
    z: -78,
    color: 0x7a3a18,
    scale: 1.10,
    roamRadius: 6,
    pursuitRadius: 20,
    leashRadius: 26,
    speed: 2.2,
    idleBase: 4.0,
    aggroRadius: 7,
    maxHp: 32,
    attackDamage: 7,
    attackCooldown: 2.2,
    respawnDelay: 55,
    dropItemId: 'ember_ram_horn',
    dropChance: 0.60,
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
    hp: def.maxHp ?? 0,
    attackTimer: 0,
    respawnTimer: 0,
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
 * @param playerPos  Current player world position; used for flee/aggro detection.
 * @param onAttack   Optional callback invoked when a hostile creature lands a
 *                   melee hit on the player.  Receives the attacker and the raw
 *                   damage value so the caller can apply it to player HP.
 */
export function updateCreatures(
  creatures: Creature[],
  delta: number,
  playerPos: THREE.Vector3,
  onAttack?: (creature: Creature, damage: number) => void,
): void {
  for (const creature of creatures) {
    // Tick drop cooldown regardless of AI state.
    if (creature.dropCooldown > 0) {
      creature.dropCooldown = Math.max(0, creature.dropCooldown - delta)
    }
    _stepCreature(creature, delta, playerPos, creatures, onAttack)
  }
}

/**
 * Phase 30 — Deal damage to a hostile creature.
 *
 * Reduces the creature's HP by `amount`.  If HP reaches zero the creature is
 * defeated: its mesh is hidden and a respawn countdown starts.
 *
 * Returns `true` when this hit kills the creature, `false` otherwise.
 * Returns `false` immediately for non-hostile creatures, creatures already in
 * the 'dead' state, or when `amount` is not a positive number.
 *
 * Phase 31 will call this from the player-attack handler.
 */
export function damageCreature(creature: Creature, amount: number): boolean {
  if (amount <= 0) return false
  if (creature.state === 'dead' || !_isHostile(creature.def)) return false
  creature.hp = Math.max(0, creature.hp - amount)
  if (creature.hp <= 0) {
    _killCreature(creature)
    return true
  }
  return false
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
 * Single source of truth for whether a def describes a hostile creature.
 * A creature is hostile iff it has both an aggro radius AND a defined HP pool.
 * This prevents partially-configured defs where a creature could aggro but
 * never be damaged (no maxHp), or be damaged but never engage (no aggroRadius).
 */
function _isHostile(def: CreatureDef): boolean {
  return (def.aggroRadius ?? 0) > 0 && def.maxHp != null
}

/**
 * Run one FSM step for a single creature.
 *
 * States:
 *   idle   → decrement timer; check flee/aggro trigger; on expiry pick a roam target.
 *   roam   → translate toward targetPos; check flee/aggro trigger; on arrival → idle.
 *   flee   → sprint away from player; on arrival → idle (skittish pause).
 *   reset  → teleport back to spawn; enter idle.
 *   return → (Phase 56) walk back to spawn; enter idle on arrival.
 *   aggro  → (Phase 30) pursue player; attack on contact; disengage when leash breaks.
 *   dead   → (Phase 30) hidden; respawnTimer ticks down; restore and idle on expiry.
 *
 * Flee logic:
 *   When the player is within `fleeRadius` the creature computes a flee target
 *   directly opposite the player, clamped to pursuitRadius from spawn.  The
 *   flee state uses fleeSpeedMult × speed to sprint.
 *
 * Aggro logic (Phase 30):
 *   When the player is within `aggroRadius` the creature charges.  It pursues
 *   until the leash breaks (Phase 56) or the creature itself strays beyond
 *   pursuitRadius from spawn, then enters the 'return' state.  When the player
 *   is within MELEE_RANGE and attackTimer is 0, the onAttack callback fires
 *   and attackTimer reloads.
 *
 * Leash logic (Phase 56):
 *   A disengaging creature enters 'return' and walks home at RETURN_SPEED_MULT
 *   instead of teleporting.  The leash triggers when the *player's* distance
 *   from the creature's spawn exceeds leashRadius (defaults to pursuitRadius).
 *
 * Separation steering (Phase 56):
 *   After any movement step the _applySeparation helper applies a small push
 *   force to prevent creatures from stacking.
 */
function _stepCreature(
  c: Creature,
  delta: number,
  playerPos: THREE.Vector3,
  creatures: Creature[],
  onAttack?: (creature: Creature, damage: number) => void,
): void {
  const pos = c.mesh.position

  // ── Dead state — tick respawn timer, restore when done ──────────────────
  if (c.state === 'dead') {
    c.respawnTimer -= delta
    if (c.respawnTimer <= 0) {
      c.hp = c.def.maxHp ?? 0
      c.attackTimer = 0
      c.mesh.visible = true
      _resetToSpawn(c)
    }
    return
  }

  // ── Tick attack cooldown ─────────────────────────────────────────────────
  if (c.attackTimer > 0) {
    c.attackTimer = Math.max(0, c.attackTimer - delta)
  }

  // ── Pursue-radius safety bounds (skip when in aggro/reset/return; 'dead'
  //    is already handled by the early return above) ────────────────────────
  if (c.state !== 'aggro' && c.state !== 'reset' && c.state !== 'return') {
    if (pos.distanceTo(c.spawnPos) > c.def.pursuitRadius) {
      _startReturn(c)
      return
    }
  }

  // ── Aggro trigger — overrides idle/roam for hostile creatures ────────────
  if (c.state === 'idle' || c.state === 'roam') {
    if (_isHostile(c.def)) {
      const ar = c.def.aggroRadius!
      const dx = pos.x - playerPos.x
      const dz = pos.z - playerPos.z
      if (Math.sqrt(dx * dx + dz * dz) < ar) {
        c.state = 'aggro'
        // Fall through to the FSM switch so aggro movement starts immediately.
      }
    }
  }

  // ── Flee trigger — overrides idle/roam but not flee/aggro/reset/return ───
  if (c.state !== 'flee' && c.state !== 'reset' && c.state !== 'aggro' && c.state !== 'return') {
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
        _applySeparation(c, creatures, delta)
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
        _applySeparation(c, creatures, delta)
      }
      break
    }

    case 'reset': {
      _resetToSpawn(c)
      break
    }

    // ── Phase 56: Return — walk home after disengaging ────────────────────
    case 'return': {
      const dx = c.spawnPos.x - pos.x
      const dz = c.spawnPos.z - pos.z
      const distToSpawn = Math.sqrt(dx * dx + dz * dz)

      if (distToSpawn < RETURN_ARRIVAL_DIST) {
        pos.x = c.spawnPos.x
        pos.z = c.spawnPos.z
        c.state = 'idle'
        c.idleTimer = c.def.idleBase * (0.5 + Math.random())
      } else {
        const returnSpeed = c.def.speed * RETURN_SPEED_MULT
        const step = Math.min(returnSpeed * delta, distToSpawn)
        const invDist = 1 / distToSpawn
        pos.x += dx * invDist * step
        pos.z += dz * invDist * step
        c.mesh.rotation.y = Math.atan2(dx * invDist, dz * invDist)
        _applySeparation(c, creatures, delta)
      }
      break
    }

    // ── Phase 30: Aggro — chase the player and attack on contact ──────────
    case 'aggro': {
      const dx = playerPos.x - pos.x
      const dz = playerPos.z - pos.z
      const distToPlayer = Math.sqrt(dx * dx + dz * dz)

      // Phase 56 — Leash: disengage if the player moves too far from spawn
      // (checks player distance from spawn, not creature distance from spawn).
      const leash = c.def.leashRadius ?? c.def.pursuitRadius
      const playerDistFromSpawn = playerPos.distanceTo(c.spawnPos)
      if (playerDistFromSpawn > leash || pos.distanceTo(c.spawnPos) > c.def.pursuitRadius) {
        _startReturn(c)
        break
      }

      // Face and move toward the player while outside melee range.
      if (distToPlayer > MELEE_RANGE) {
        const step = Math.min(c.def.speed * delta, distToPlayer)
        const invDist = 1 / distToPlayer
        pos.x += dx * invDist * step
        pos.z += dz * invDist * step
        c.mesh.rotation.y = Math.atan2(dx * invDist, dz * invDist)
        _applySeparation(c, creatures, delta)
      }

      // Attack when in melee range and the cooldown has elapsed.
      if (distToPlayer <= MELEE_RANGE && c.attackTimer <= 0 && onAttack) {
        const dmg = c.def.attackDamage ?? DEFAULT_ATTACK_DAMAGE
        onAttack(c, dmg)
        c.attackTimer = c.def.attackCooldown ?? DEFAULT_ATTACK_COOLDOWN
      }
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

/** Phase 30 — Transition a creature to the 'dead' state and begin respawn timer. */
function _killCreature(c: Creature): void {
  c.state = 'dead'
  c.mesh.visible = false
  c.respawnTimer = c.def.respawnDelay ?? DEFAULT_RESPAWN_DELAY
}

/**
 * Phase 56 — Begin a smooth walk-home transition.
 *
 * Switches the creature to the 'return' state. The 'return' FSM case advances
 * the creature toward its spawn origin (spawnPos) at RETURN_SPEED_MULT ×
 * def.speed each frame until it arrives.
 *
 * Only the dead-respawn path still uses the instant teleport (_resetToSpawn)
 * because the creature is invisible during that countdown anyway.
 */
function _startReturn(c: Creature): void {
  c.state = 'return'
}

/**
 * Phase 56 — Separation steering.
 *
 * Pushes `c` away from any other live creature that is within
 * SEPARATION_RADIUS metres.  The force is proportional to overlap depth
 * (strongest when creatures are perfectly coincident, zero at the boundary).
 *
 * Applied after each movement step in roam, flee, return, and aggro states so
 * creatures cannot stack on top of each other or oscillate in a tight cluster.
 */
function _applySeparation(c: Creature, creatures: Creature[], delta: number): void {
  const pos = c.mesh.position
  let sx = 0
  let sz = 0

  const sepRadSq = SEPARATION_RADIUS * SEPARATION_RADIUS

  for (const other of creatures) {
    if (other === c || other.state === 'dead') continue
    const dx = pos.x - other.mesh.position.x
    const dz = pos.z - other.mesh.position.z
    const distSq = dx * dx + dz * dz

    // Fast rejection: skip pairs outside the separation radius.
    if (distSq >= sepRadSq) continue

    const dist = Math.sqrt(distSq)
    // Overlap factor: 1 at dist=0, 0 at dist=SEPARATION_RADIUS.
    const overlap = (SEPARATION_RADIUS - dist) / SEPARATION_RADIUS

    if (dist === 0) {
      // Creatures are perfectly coincident: choose a random direction
      // in the XZ plane to nudge them apart.
      const angle = Math.random() * Math.PI * 2
      sx += Math.cos(angle) * overlap
      sz += Math.sin(angle) * overlap
    } else {
      const invDist = 1 / dist
      sx += dx * invDist * overlap
      sz += dz * invDist * overlap
    }
  }

  if (sx !== 0 || sz !== 0) {
    pos.x += sx * SEPARATION_STRENGTH * delta
    pos.z += sz * SEPARATION_STRENGTH * delta
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
  // Phase 30: hostile creatures get a red eye to signal danger.
  const eyeColor = _isHostile(def) ? 0xff3a1a : 0xffd060
  const eyeMat = new THREE.MeshStandardMaterial({
    color: eyeColor,
    emissive: new THREE.Color(eyeColor),
    emissiveIntensity: 0.7,
    roughness: 0.4,
  })
  const eyeR = 0.055 * def.scale
  const eye = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 6, 6), eyeMat)
  eye.position.set(0, r + h, r * 0.85)   // front-centre, near the top
  group.add(eye)

  return group
}
