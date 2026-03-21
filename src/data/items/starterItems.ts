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

  // ── Wildlife drops (Phase 29) ─────────────────────────────────────────────

  {
    id: 'slatebeak_feather',
    name: 'Slatebeak Feather',
    type: 'material',
    stackable: true,
    value: 3,
    icon: 'items/slatebeak_feather.png',
    description:
      'A stiff, dark-grey flight feather shed by a Slatebeak. ' +
      'The broad quill holds its shape well — useful for fletching and light waterproofing.',
  },

  // ── Materials ──────────────────────────────────────────────────────────────

  {
    id: 'ash_sapling_log',
    name: 'Ash Sapling Log',
    type: 'material',
    stackable: true,
    value: 1,
    icon: 'items/ash_sapling_log.png',
    description:
      'A slender branch harvested from a young ash sapling. ' +
      'Too thin for heavy construction, but useful as kindling or simple fletching stock.',
  },

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
    id: 'ironbark_log',
    name: 'Ironbark Log',
    type: 'material',
    stackable: true,
    value: 6,
    icon: 'items/ironbark_log.png',
    description:
      'A dense, dark-grained log from an ironbark youngling. ' +
      'Heavier than ashwood and resistant to splitting; prized for tool handles and structural beams.',
  },

  {
    id: 'copper_ore',
    name: 'Copper Ore',
    type: 'material',
    stackable: true,
    value: 4,
    icon: 'items/copper_ore.png',
    description:
      'A rough chunk of greenish-orange ore chipped from a surface copper vein. ' +
      'Relatively soft and easy to smelt; the primary metal for beginner-tier tools and fittings.',
  },

  {
    id: 'iron_ore',
    name: 'Iron Ore',
    type: 'material',
    stackable: true,
    value: 7,
    icon: 'items/iron_ore.png',
    description:
      'A dense, rust-flecked ore broken from a deep iron seam. ' +
      'Heavier and harder to work than copper, but yields stronger and more durable metal goods.',
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

  {
    id: 'marsh_herb',
    name: 'Marsh Herb',
    type: 'material',
    stackable: true,
    value: 3,
    icon: 'items/marsh_herb.png',
    description:
      'A cluster of flat, moisture-loving leaves gathered from damp ground near waterways. ' +
      'Bitter-smelling but valued for hearthcraft preparations and field poultices.',
  },

  {
    id: 'resin_glob',
    name: 'Resin Glob',
    type: 'material',
    stackable: true,
    value: 4,
    icon: 'items/resin_glob.png',
    description:
      'A hardened bead of amber-hued resin scraped from the bark of a stressed ironbark tree. ' +
      'Useful as a natural sealant, tinder accelerant, or raw ingredient in tinkering.',
  },

  // ── Fish ───────────────────────────────────────────────────────────────────

  {
    id: 'minnow',
    name: 'Minnow',
    type: 'material',
    stackable: true,
    value: 2,
    icon: 'items/minnow.png',
    description:
      'A tiny silver fish pulled from the shallow edges of a calm pond. ' +
      'Too small to eat outright, but useful for cooking stock or as bait.',
  },

  {
    id: 'perch',
    name: 'Perch',
    type: 'material',
    stackable: true,
    value: 5,
    icon: 'items/perch.png',
    description:
      'A striped freshwater perch caught from a reed-sheltered pool. ' +
      'Firm white flesh — good eating once cleaned and cooked over a fire.',
  },

  {
    id: 'gloomfin',
    name: 'Gloomfin',
    type: 'material',
    stackable: true,
    value: 10,
    icon: 'items/gloomfin.png',
    description:
      'A deep-dwelling fish with translucent fins and faint bioluminescent spots along its flank. ' +
      'Rarely surfaces in ordinary ponds — a sign of hidden thermal currents below.',
  },

  // ── Phase 22 — Cooked food (Hearthcraft outputs) ───────────────────────

  {
    id: 'cooked_minnow',
    name: 'Cooked Minnow',
    type: 'consumable',
    stackable: true,
    value: 4,
    icon: 'items/cooked_minnow.png',
    description:
      'A tiny minnow crisped over hearthfire coals. ' +
      'A modest mouthful that takes the edge off minor scrapes and bruises.',
    consumableMeta: { healsHp: 6, effect: 'Restores 6 HP' },
  },

  {
    id: 'cooked_perch',
    name: 'Cooked Perch',
    type: 'consumable',
    stackable: true,
    value: 10,
    icon: 'items/cooked_perch.png',
    description:
      'A perch fillet cooked through over an open fire, skin lightly charred. ' +
      'Fills the stomach and closes shallow wounds with steady warmth.',
    consumableMeta: { healsHp: 14, effect: 'Restores 14 HP' },
  },

  {
    id: 'cooked_gloomfin',
    name: 'Cooked Gloomfin',
    type: 'consumable',
    stackable: true,
    value: 22,
    icon: 'items/cooked_gloomfin.png',
    description:
      'A gloomfin steak rendered over hearthfire until its bioluminescent oils seep into the flesh. ' +
      'Rich and restorative — prized by scouts venturing deep into the Reach.',
    consumableMeta: { healsHp: 25, effect: 'Restores 25 HP' },
  },

  {
    id: 'cooked_cinderhare',
    name: 'Cooked Cinderhare',
    type: 'consumable',
    stackable: true,
    value: 8,
    icon: 'items/cooked_cinderhare.png',
    description:
      'A haunched loin of Cinderhare, properly fire-roasted until the sinew falls loose. ' +
      'Far more restorative than the raw meat and carries a faint smoky warmth.',
    consumableMeta: { healsHp: 18, effect: 'Restores 18 HP' },
  },

  // ── Phase 32 — Hostile creature drops ────────────────────────────────────

  {
    id: 'thornling_shard',
    name: 'Thornling Shard',
    type: 'material',
    stackable: true,
    value: 5,
    icon: 'items/thornling_shard.png',
    description:
      'A jagged briar spike broken from the dense thorn-armour of a Thornling. ' +
      'Surprisingly hard and sharply barbed — useful in basic trapping and rough-crafting.',
  },

  {
    id: 'mossback_hide',
    name: 'Mossback Hide',
    type: 'material',
    stackable: true,
    value: 4,
    icon: 'items/mossback_hide.png',
    description:
      'A patch of thick, moss-patterned hide stripped from a defeated Mossback Toad. ' +
      'Soft yet surprisingly water-resistant; suitable for patching light armour or lining boots.',
  },

  // ── Phase 41 — Tier 2 Gathering Tools ────────────────────────────────────

  {
    id: 'copper_hatchet',
    name: 'Copper Hatchet',
    type: 'tool',
    stackable: false,
    value: 38,
    icon: 'items/copper_hatchet.png',
    description:
      'A hatchet with a copper head set into a seasoned ashwood handle. ' +
      'Noticeably heavier than the rough starter axe; the harder edge stays keen through ironbark and aged hardwood.',
    toolMeta: { skill: 'woodcutting', tier: 2 },
  },

  {
    id: 'iron_pick',
    name: 'Iron Pick',
    type: 'tool',
    stackable: false,
    value: 52,
    icon: 'items/iron_pick.png',
    description:
      'A pick forged from iron bar stock, weighted for deep-seam work. ' +
      'The balanced swing drives through dense ore veins in fewer blows than any surface quarry tool.',
    toolMeta: { skill: 'mining', tier: 2 },
  },

  {
    id: 'reinforced_rod',
    name: 'Reinforced Rod',
    type: 'tool',
    stackable: false,
    value: 32,
    icon: 'items/reinforced_rod.png',
    description:
      'A stout reed rod fitted with copper guides and a tightly woven reed-fiber line. ' +
      'The stiffer blank handles deeper pools; bites register faster than with a plain bone hook.',
    toolMeta: { skill: 'fishing', tier: 2 },
  },

  // ── Phase 40 — Smithing bars ──────────────────────────────────────────────

  {
    id: 'copper_bar',
    name: 'Copper Bar',
    type: 'material',
    stackable: true,
    value: 14,
    icon: 'items/copper_bar.png',
    description:
      'A smooth ingot of smelted copper, still warm from the furnace. ' +
      'Soft enough to shape by hand but sturdy in finished fittings; the foundation of beginner-tier metalwork.',
  },

  {
    id: 'iron_bar',
    name: 'Iron Bar',
    type: 'material',
    stackable: true,
    value: 24,
    icon: 'items/iron_bar.png',
    description:
      'A dense, dark ingot drawn from iron ore at high heat. ' +
      'Heavier and harder than copper — the preferred stock for reliable tools, clasps, and reinforced fittings.',
  },

  // ── Phase 35 — Brackroot Trail drops & cache ──────────────────────────────

  {
    id: 'snarl_pelt',
    name: 'Snarl Pelt',
    type: 'material',
    stackable: true,
    value: 3,
    icon: 'items/snarl_pelt.png',
    description:
      'A rough, mottled pelt stripped from a Snarl Whelp. ' +
      'The coarse fur is too patchy for fine leatherwork, but serviceable as crude insulation or padding.',
  },

  {
    id: 'crawler_chitin',
    name: 'Crawler Chitin',
    type: 'material',
    stackable: true,
    value: 5,
    icon: 'items/crawler_chitin.png',
    description:
      'A segment of hardened shell plating from a Brackroot Crawler. ' +
      'Surprisingly rigid for its weight — prized by tinkerers for lightweight reinforcement projects.',
  },

  {
    id: 'waystone_fragment',
    name: 'Waystone Fragment',
    type: 'material',
    stackable: true,
    value: 12,
    icon: 'items/waystone_fragment.png',
    description:
      'A chipped piece of engraved grey stone etched with concentric survey marks. ' +
      'Waystones were placed by Veilmarch surveyors to mark territorial boundaries and deep-route intersections. ' +
      'This fragment was broken from a buried marker — someone has been through this trail before.',
  },

  // ── Phase 42 — Carving Outputs ────────────────────────────────────────────

  {
    id: 'whittled_peg',
    name: 'Whittled Peg',
    type: 'material',
    stackable: true,
    value: 3,
    icon: 'items/whittled_peg.png',
    description:
      'A smooth tapered peg whittled from ashwood. ' +
      'Simple to make and widely used in camp construction, furniture repair, and basic assembly.',
  },

  {
    id: 'carved_bowl',
    name: 'Carved Bowl',
    type: 'material',
    stackable: true,
    value: 7,
    icon: 'items/carved_bowl.png',
    description:
      'A shallow bowl hollowed from a dense ashwood block. ' +
      'Useful as a camp utensil or as a component in more complex hearthcraft recipes.',
  },

  {
    id: 'ashwood_shaft',
    name: 'Ashwood Shaft',
    type: 'material',
    stackable: true,
    value: 10,
    icon: 'items/ashwood_shaft.png',
    description:
      'A straight, sanded length of ashwood trimmed to shaft dimensions. ' +
      'A versatile component — tinkerers prize it as the basis for tool handles, poles, and frames.',
  },

  {
    id: 'chitin_pin',
    name: 'Chitin Pin',
    type: 'material',
    stackable: true,
    value: 8,
    icon: 'items/chitin_pin.png',
    description:
      'A slender pin ground from Brackroot Crawler chitin. ' +
      'Harder than bone and lightweight — valued for precision fastening and as an ingredient in refined gear.',
  },

  // ── Phase 43 — Tinkering Outputs ─────────────────────────────────────────

  {
    id: 'lantern_parts',
    name: 'Lantern Parts',
    type: 'material',
    stackable: true,
    value: 14,
    icon: 'items/lantern_parts.png',
    description:
      'A set of pressed-copper panels and a simple oil reservoir, ready for assembly. ' +
      'The foundation for a portable lantern — essential for venturing into darker reaches of Cinderglen.',
  },

  {
    id: 'reinforced_hook',
    name: 'Reinforced Hook',
    type: 'material',
    stackable: true,
    value: 12,
    icon: 'items/reinforced_hook.png',
    description:
      'A forged-iron fishing hook with a barbed collar and a hammered eye. ' +
      'Far sturdier than the crude bone hooks sold at market — holds fast against larger, stronger fish.',
  },

  {
    id: 'bait_basket',
    name: 'Bait Basket',
    type: 'material',
    stackable: true,
    value: 11,
    icon: 'items/bait_basket.png',
    description:
      'A woven ashwood basket designed to keep live bait submerged near the fishing line. ' +
      'Extends the effective range of each bait charge and draws fish from slightly deeper water.',
  },

  {
    id: 'repair_clamp',
    name: 'Repair Clamp',
    type: 'material',
    stackable: true,
    value: 16,
    icon: 'items/repair_clamp.png',
    description:
      'A solid iron clamp with a screw-tighten jaw, used to hold workpieces during field repairs. ' +
      'An indispensable tool for mending cracked hafts, loose joints, and fractured fittings.',
  },

  // ── Phase 44 — Surveying Salvage Outputs ─────────────────────────────────

  {
    id: 'ore_chip',
    name: 'Ore Chip',
    type: 'material',
    stackable: true,
    value: 4,
    icon: 'items/ore_chip.png',
    description:
      'A palm-sized fragment of mineral-bearing rock pried from a shallow buried pocket. ' +
      'Not worth smelting alone, but a handful of chips can be traded or ground into flux.',
  },

  {
    id: 'raw_resin',
    name: 'Raw Resin',
    type: 'material',
    stackable: true,
    value: 6,
    icon: 'items/raw_resin.png',
    description:
      'Thick amber sap harvested from a buried root cache, preserved by the cold ground. ' +
      'Used as a binder in leatherwork, a wood sealant, and a slow-burn fuel in lanterns.',
  },

  {
    id: 'flint_shard',
    name: 'Flint Shard',
    type: 'material',
    stackable: true,
    value: 7,
    icon: 'items/flint_shard.png',
    description:
      'A razor-edged fragment of dark flint uncovered beneath the topsoil. ' +
      'Valued by arrowsmiths and carvers for its natural edge — sharper than most rough-ground iron.',
  },

  {
    id: 'rare_fragment',
    name: 'Rare Fragment',
    type: 'material',
    stackable: true,
    value: 28,
    icon: 'items/rare_fragment.png',
    description:
      'A shard of unidentified mineral with a faint inner luminescence. ' +
      'Found only in the deepest buried caches far from settlement — its eventual use is unknown, but traders pay well for it.',
  },

  // ── Phase 46 — Ward Marks ─────────────────────────────────────────────────

  {
    id: 'ashwillow_ward',
    name: 'Ashwillow Ward',
    type: 'consumable',
    stackable: true,
    value: 12,
    icon: 'items/ashwillow_ward.png',
    description:
      'A flat disc of ashwood scored with interlocking willow-braid glyphs and sealed with resin smoke. ' +
      'When pressed into the earth it forms a low barrier against environmental hazards — mist seep, cold creep, and seeping vapours — for a short duration.',
  },

  {
    id: 'thornward_mark',
    name: 'Thornward Mark',
    type: 'consumable',
    stackable: true,
    value: 16,
    icon: 'items/thornward_mark.png',
    description:
      'A bundle of dried reed wrapped with three knotted thornwire loops, bound with marsh-tar. ' +
      'Its acrid scent and latent ward pattern unsettles most creatures of the Reach, causing them to avoid the marked ground.',
  },

  // ── Phase 26 / 27 — Starter Equipment ────────────────────────────────────

  {
    id: 'patchplate_buckler',
    name: 'Patchplate Buckler',
    type: 'equipment',
    stackable: false,
    value: 18,
    icon: 'items/patchplate_buckler.png',
    description:
      'A dented iron buckler reinforced with mismatched leather patches. ' +
      'Offers modest protection — better than nothing when the alternative is an open hand.',
    equipMeta: { slot: 'offHand', defenceBonus: 3 },
  },

  {
    id: 'roughhide_vest',
    name: 'Roughhide Vest',
    type: 'equipment',
    stackable: false,
    value: 22,
    icon: 'items/roughhide_vest.png',
    description:
      'A stiff vest of cured marsh-hide, stitched with sinew thread. ' +
      'Cheap and serviceable — standard frontier wear for those expecting trouble.',
    equipMeta: { slot: 'chest', defenceBonus: 4 },
  },

  {
    id: 'ashwood_club',
    name: 'Ashwood Club',
    type: 'equipment',
    stackable: false,
    value: 14,
    icon: 'items/ashwood_club.png',
    description:
      'A knob-headed club carved from dense ashwood, sanded smooth at the grip. ' +
      'Simple and reliable — deals a respectable blow without demanding skilled hands.',
    equipMeta: { slot: 'mainHand', attackBonus: 4 },
  },

  {
    id: 'marsh_boots',
    name: 'Marsh Boots',
    type: 'equipment',
    stackable: false,
    value: 12,
    icon: 'items/marsh_boots.png',
    description:
      'Knee-high boots of oiled leather with a wide, flat sole. ' +
      'Designed for waterlogged terrain — keeps the feet dry and the footing sure.',
    equipMeta: { slot: 'feet', defenceBonus: 1 },
  },

  {
    id: 'ironspine_spear',
    name: 'Ironspine Spear',
    type: 'equipment',
    stackable: false,
    value: 28,
    icon: 'items/ironspine_spear.png',
    description:
      'A slender iron-tipped spear with a ridged spine running the length of the shaft. ' +
      'Favoured by frontier scouts for its reach — demands steady footing and trail-hardened arms.',
    equipMeta: {
      slot: 'mainHand',
      attackBonus: 6,
      requirements: { wayfaring: 2 },
    },
  },
]
