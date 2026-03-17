/**
 * Phase 12 — Starter Item Set
 *
 * Defines the 8 Phase 12 starter item definitions.
 * This module only exports the definitions; registration is handled by
 * itemRegistry.ts, which imports this array at module load time so that the
 * full catalog is available to every consumer of the registry regardless of
 * which entrypoint is used.
 */

import type { ItemDefinition } from './itemSchema'

export const STARTER_ITEMS: ItemDefinition[] = [
  // ── Tools ──────────────────────────────────────────────────────────────────

  {
    id: 'rough_ash_hatchet',
    name: 'Rough Ash Hatchet',
    type: 'tool',
    stackable: false,
    value: 12,
    icon: 'items/rough_ash_hatchet.png',
    description:
      'A hatchet head lashed to a short ash-wood handle with rawhide cord. ' +
      'Serviceable for felling young trees, though the edge dulls quickly on hardwood.',
    toolMeta: { skill: 'woodcutting', tier: 1 },
  },

  {
    id: 'quarry_pick',
    name: 'Quarry Pick',
    type: 'tool',
    stackable: false,
    value: 14,
    icon: 'items/quarry_pick.png',
    description:
      'A narrow iron pick with a weighted back face, stamped with the Redwake Quarry mark. ' +
      'Chips loose stone and surface ore veins with reasonable efficiency.',
    toolMeta: { skill: 'mining', tier: 1 },
  },

  {
    id: 'reedline_rod',
    name: 'Reedline Rod',
    type: 'tool',
    stackable: false,
    value: 8,
    icon: 'items/reedline_rod.png',
    description:
      'A light reed pole strung with braided marsh-fiber line and a carved bone hook. ' +
      'Suitable for calm shallows and geothermal seep pools alike.',
    toolMeta: { skill: 'fishing', tier: 1 },
  },

  // ── Consumables ────────────────────────────────────────────────────────────

  {
    id: 'camp_rations',
    name: 'Camp Rations',
    type: 'consumable',
    stackable: true,
    value: 5,
    icon: 'items/camp_rations.png',
    description:
      'A cloth-wrapped bundle of dried meat strips, hard bread, and pressed fruit. ' +
      'Standard frontier rations — not pleasant, but reliably restorative.',
    consumableMeta: { healsHp: 15, effect: 'Restores 15 HP' },
  },

  {
    id: 'cinderhare_meat',
    name: 'Cinderhare Meat',
    type: 'consumable',
    stackable: true,
    value: 4,
    icon: 'items/cinderhare_meat.png',
    description:
      'Raw haunch from a Cinderhare, a long-eared creature that nests near geothermal vents. ' +
      'Edible as-is in an emergency, but best cooked over a proper fire.',
    consumableMeta: { healsHp: 6, effect: 'Restores 6 HP (raw)' },
  },

  // ── Materials ──────────────────────────────────────────────────────────────

  {
    id: 'ashwood_log',
    name: 'Ashwood Log',
    type: 'material',
    stackable: true,
    value: 3,
    icon: 'items/ashwood_log.png',
    description:
      'A short length of pale ashwood cut from a roadside tree. ' +
      'Used in basic construction, fuel preparation, and early crafting recipes.',
  },

  {
    id: 'reed_fiber',
    name: 'Reed Fiber',
    type: 'material',
    stackable: true,
    value: 2,
    icon: 'items/reed_fiber.png',
    description:
      'Stripped and dried strands pulled from marsh reeds. ' +
      'Pliable and lightweight; woven into rope, cloth, or fishing line.',
  },

  {
    id: 'small_stone',
    name: 'Small Stone',
    type: 'material',
    stackable: true,
    value: 1,
    icon: 'items/small_stone.png',
    description:
      'A smooth, fist-sized stone gathered from the road verge or riverbed. ' +
      'Too small for serious construction, but handy as a throwing weight or grinding surface.',
  },
]
