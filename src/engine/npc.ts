/**
 * Phase 08 — Hushwood NPC Placement
 *
 * Places 6 named non-combat NPCs at idle locations around the settlement.
 * Each NPC has:
 *   - a capsule mesh (slightly smaller than the player capsule)
 *   - a small emissive disc above the head to indicate interactability
 *   - an idle facing angle (yaw)
 *   - a gentle sinusoidal sway so NPCs feel alive without full animation
 *
 * buildNpcs()  – instantiates all NPCs, adds them to the scene, and appends
 *                an Interactable descriptor for each into the provided array.
 * updateNpcs() – advances the ambient sway every frame.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { useNotifications } from '../store/useNotifications'
import { useShopStore } from '../store/useShopStore'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface Npc {
  /** Scene group; position.y = 0 places the NPC base on the ground. */
  mesh: THREE.Group
  /** Resting yaw angle (radians) the NPC centres its sway on. */
  idleAngle: number
  /** Per-NPC phase offset so the sways are not all in sync. */
  ambientPhase: number
  /** Accumulated time used for the sway oscillation (seconds). */
  ambientTime: number
}

// ─── Private NPC descriptor table ────────────────────────────────────────────

interface NpcDef {
  name: string
  /** XZ position; base sits on y = 0. */
  x: number
  z: number
  /** Resting facing yaw (radians). 0 = south (+Z), Math.PI = north (−Z),
   *  Math.PI/2 = east (+X), −Math.PI/2 = west (−X). */
  idleAngle: number
  /** Body colour (hex). */
  color: number
  /** Ambient oscillation phase offset (radians). */
  phase: number
  /** When true, interacting with this NPC opens the shop instead of a chat message. */
  opensShop?: true
}

const NPC_DEFS: NpcDef[] = [
  // 1. Aldric — Village Elder; stands just south of the hall entrance
  //    Hall centre: (0, −10) → front face at z = −7.5; Aldric faces north.
  { name: 'Aldric (Village Elder)', x:  1.5, z: -6.0, idleAngle:  Math.PI,       color: 0x8b5a2b, phase: 0.0 },

  // 2. Bron — Blacksmith; stands just west of the forge, facing the coals
  //    Forge centre: (10, 3) → west face at x = 7.5; Bron faces east.
  { name: 'Bron (Blacksmith)',       x:  6.5, z:  2.0, idleAngle:  Math.PI / 2,  color: 0x4a4a4a, phase: 1.1 },

  // 3. Mira — Innkeeper; loiters just north of the Mudroot Inn
  //    Inn centre: (0, 14) → north face at z = 11; Mira faces south.
  { name: 'Mira (Innkeeper)',        x:  1.5, z: 10.5, idleAngle:  0,            color: 0xb06030, phase: 2.1 },

  // 4. Dwyn — Guard; stationed just east of the guard hut
  //    Hut centre: (−11, −9) → east face at x = −9.5; Dwyn faces west.
  { name: 'Dwyn (Guard)',            x: -8.5, z: -8.5, idleAngle: -Math.PI / 2,  color: 0x505878, phase: 3.0 },

  // 5. Sera — Herbalist; lingers at the east edge of the commons
  //    Faces toward the pond (roughly north-east).
  { name: 'Sera (Herbalist)',        x:  3.5, z:  1.5, idleAngle:  Math.PI / 4,  color: 0x4a7a4a, phase: 0.7 },

  // 6. Tomas — Travelling Merchant; just east of the storage shed
  //    Shed centre: (−10, 3) → east face at x = −7.5; Tomas faces west.
  { name: 'Tomas (Merchant)',        x: -6.5, z:  1.5, idleAngle: -Math.PI / 2,  color: 0x7a5a30, phase: 1.9, opensShop: true },
]

// ─── Ambient oscillation constants ───────────────────────────────────────────

/** Maximum left/right sway from the resting angle (radians). */
const SWAY_AMPLITUDE = 0.3
/** Sway frequency (radians per second). */
const SWAY_FREQ = 0.6

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Instantiate all NPCs, add them to `scene`, and push an `Interactable`
 * for each into `interactables`.  Returns the list of live `Npc` objects
 * so the caller can pass them to `updateNpcs()` each frame.
 */
export function buildNpcs(
  scene: THREE.Scene,
  interactables: Interactable[],
): Npc[] {
  const npcs: Npc[] = []

  for (const def of NPC_DEFS) {
    const npc = _createNpc(scene, def)
    npcs.push(npc)

    interactables.push({
      mesh: npc.mesh,
      label: def.name,
      interactRadius: 2.2,
      onInteract: def.opensShop
        ? () => useShopStore.getState().openShop()
        : () => useNotifications.getState().push(`Spoke with ${def.name}`, 'info'),
    })
  }

  return npcs
}

/**
 * Advance the ambient idle sway for all NPCs.  Call once per animation frame.
 */
export function updateNpcs(npcs: Npc[], delta: number): void {
  for (const npc of npcs) {
    npc.ambientTime += delta
    npc.mesh.rotation.y =
      npc.idleAngle +
      Math.sin(SWAY_FREQ * npc.ambientTime + npc.ambientPhase) * SWAY_AMPLITUDE
  }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _createNpc(scene: THREE.Scene, def: NpcDef): Npc {
  const group = new THREE.Group()
  group.position.set(def.x, 0, def.z)
  group.rotation.y = def.idleAngle

  // Body: capsule slightly smaller than the player capsule
  const bodyMat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.7 })
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.9, 4, 8), bodyMat)
  // Capsule origin is at its centre; shift up so the base sits on y = 0.
  body.position.y = 0.7
  group.add(body)

  // Name indicator: small emissive disc floating above the NPC's head
  const discMat = new THREE.MeshStandardMaterial({
    color: 0xffe080,
    emissive: new THREE.Color(0xffe080),
    emissiveIntensity: 0.4,
    roughness: 0.5,
  })
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 8), discMat)
  disc.position.y = 1.85
  group.add(disc)

  scene.add(group)

  return { mesh: group, idleAngle: def.idleAngle, ambientPhase: def.phase, ambientTime: 0 }
}
