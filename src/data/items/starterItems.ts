/**
 * Phase 12 — Starter Item Set
 * Phase 58 — Resource Tier Expansion
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
    toolMeta: { skill: 'woodcutting', tier: 1, maxDurability: 50 },
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
    toolMeta: { skill: 'mining', tier: 1, maxDurability: 50 },
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
    toolMeta: { skill: 'fishing', tier: 1, maxDurability: 50 },
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
    toolMeta: { skill: 'woodcutting', tier: 2, maxDurability: 100 },
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
    toolMeta: { skill: 'mining', tier: 2, maxDurability: 100 },
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
    toolMeta: { skill: 'fishing', tier: 2, maxDurability: 100 },
  },

  // ── Phase 58 — Tier 3 Woodcutting Tool ───────────────────────────────────

  {
    id: 'duskiron_hatchet',
    name: 'Duskiron Hatchet',
    type: 'tool',
    stackable: false,
    value: 85,
    icon: 'items/duskiron_hatchet.png',
    description:
      'A hatchet forged from duskiron bar, hafted with dense ironbark hardwood. ' +
      'The dark blade holds its edge far longer than copper or iron; it shears through ' +
      'Mineral Ashwood and ironbark alike with swift, decisive blows.',
    toolMeta: { skill: 'woodcutting', tier: 3, maxDurability: 150 },
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

  // ── Phase 58 — Tinkering Output ──────────────────────────────────────────

  {
    id: 'dusk_lens_mount',
    name: 'Dusk Lens Mount',
    type: 'material',
    stackable: true,
    value: 45,
    icon: 'items/dusk_lens_mount.png',
    description:
      'A precision ring of duskiron fitted with a faceted marsh glass reed lens. ' +
      'The dark metal frame holds the prismatic lens perfectly aligned — used in advanced ' +
      'surveying instruments, signal lanterns, and high-grade optical assemblies.',
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

  // ── Phase 57 — Ashfen Copse resources & drops ────────────────────────────

  {
    id: 'mineralwood_log',
    name: 'Mineralwood Log',
    type: 'material',
    stackable: true,
    value: 20,
    icon: 'items/mineralwood_log.png',
    description:
      'A dense log hewn from a Mineral Ashwood — a rare tree species whose heartwood is laced ' +
      'with iron-trace deposits, giving the grain a dark, glinting streak. ' +
      'Harder to work than ordinary timber but prized for durable hafts and reinforced furnishings.',
  },

  {
    id: 'ashfen_resin',
    name: 'Ashfen Resin',
    type: 'material',
    stackable: true,
    value: 16,
    icon: 'items/ashfen_resin.png',
    description:
      'A thick, dark amber resin that seeps from the wounded bark of Mineral Ashwood. ' +
      'Its mineral content makes it harder and more heat-resistant than ordinary resin — ' +
      'sought after for blade coatings, waterproofing, and ward-craft binding.',
  },

  {
    id: 'hushfang_fang',
    name: 'Hushfang Fang',
    type: 'material',
    stackable: true,
    value: 18,
    icon: 'items/hushfang_fang.png',
    description:
      'A curved, hollow fang pulled from a defeated Hushfang — a sleek predator of the Ashfen Copse. ' +
      'The inner channel once carried a trace venom; now drained, the fang is prized as a ' +
      'piercing component in arrowheads and bladed grips.',
  },

  {
    id: 'ember_ram_horn',
    name: 'Ember Ram Horn',
    type: 'material',
    stackable: true,
    value: 22,
    icon: 'items/ember_ram_horn.png',
    description:
      'A spiralled horn broken from an Ember Ram, still faintly warm to the touch from its ' +
      'geothermal charge. Used in advanced smithing as a heat-draw agent, or ground into powder ' +
      'as a flux additive for high-grade iron work.',
  },

  // ── Phase 58 — Resource Tier Expansion ───────────────────────────────────

  {
    id: 'duskiron_ore',
    name: 'Duskiron Ore',
    type: 'material',
    stackable: true,
    value: 14,
    icon: 'items/duskiron_ore.png',
    description:
      'A chunk of dark, iron-dense ore threaded with faint violet mineral veins. ' +
      'Found only in the deepest seams of the Ashfen Copse, it is harder and denser ' +
      'than common iron — smelting it requires a well-maintained furnace and a steady hand.',
  },

  {
    id: 'duskiron_bar',
    name: 'Duskiron Bar',
    type: 'material',
    stackable: true,
    value: 32,
    icon: 'items/duskiron_bar.png',
    description:
      'A heavy bar of refined duskiron, still faintly warm from the furnace. ' +
      'Its dark surface holds a faint violet sheen under light — prized for high-grade ' +
      'tools and advanced tinkering assemblies that must withstand serious punishment.',
  },

  {
    id: 'marsh_glass_reed',
    name: 'Marsh Glass Reed',
    type: 'material',
    stackable: true,
    value: 10,
    icon: 'items/marsh_glass_reed.png',
    description:
      'A tall, semi-translucent reed that grows only in mineral-rich marsh shallows. ' +
      'Its hollow stalk refracts light with a faint prismatic shimmer. ' +
      'Used in fine cordage, lens-work, and as a flux binder in high-temperature smeltwork.',
  },

  // ── Phase 47 — Tidemark Chapel Drops ─────────────────────────────────────

  {
    id: 'wisp_ember',
    name: 'Wisp Ember',
    type: 'material',
    stackable: true,
    value: 14,
    icon: 'items/wisp_ember.png',
    description:
      'A cold blue-white fragment of condensed mist-light shed by a Chapel Wisp. ' +
      'Warm to the touch despite its pallor, it hums faintly with occult charge — ' +
      'useful in advanced ward inscriptions.',
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
    equipMeta: { slot: 'mainHand', attackBonus: 4, attackSpeed: 1.0, weaponType: 'blunt' },
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
      attackSpeed: 0.9,
      weaponType: 'pierce',
      requirements: { wayfaring: 2 },
    },
  },

  // ── Phase 60 — Combat Equipment Stats Pass ────────────────────────────────

  {
    id: 'flint_dagger',
    name: 'Flint Dagger',
    type: 'equipment',
    stackable: false,
    value: 16,
    icon: 'items/flint_dagger.png',
    description:
      'A short blade knapped from a single flint core, bound to a wrapped leather grip. ' +
      'Light enough to slash twice before a heavier weapon lands once — trades raw power for relentless speed.',
    equipMeta: { slot: 'mainHand', attackBonus: 3, attackSpeed: 1.4, weaponType: 'slash' },
  },

  {
    id: 'duskiron_warhammer',
    name: 'Duskiron Warhammer',
    type: 'equipment',
    stackable: false,
    value: 64,
    icon: 'items/duskiron_warhammer.png',
    description:
      'A flat-faced warhammer forged from duskiron, its head dense enough to split stone. ' +
      'Each swing arrives slowly but hits with bone-shaking force — only trail-hardened fighters can wield it safely.',
    equipMeta: {
      slot: 'mainHand',
      attackBonus: 12,
      attackSpeed: 0.65,
      weaponType: 'blunt',
      requirements: { wayfaring: 5 },
    },
  },

  {
    id: 'ironscale_helm',
    name: 'Ironscale Helm',
    type: 'equipment',
    stackable: false,
    value: 30,
    icon: 'items/ironscale_helm.png',
    description:
      'A close-fitting helm of overlapping iron scales riveted to a padded leather cap. ' +
      'Covers the crown and temples without limiting vision — a practical choice for those who expect trouble.',
    equipMeta: { slot: 'head', defenceBonus: 2, requirements: { wayfaring: 1 } },
  },

  {
    id: 'ironscale_greaves',
    name: 'Ironscale Greaves',
    type: 'equipment',
    stackable: false,
    value: 26,
    icon: 'items/ironscale_greaves.png',
    description:
      'Articulated greaves of iron scale over cured leather, covering knee to shin. ' +
      'Heavier than hide wrappings but markedly harder to cut through.',
    equipMeta: { slot: 'legs', defenceBonus: 2, requirements: { wayfaring: 1 } },
  },

  {
    id: 'ironscale_gauntlets',
    name: 'Ironscale Gauntlets',
    type: 'equipment',
    stackable: false,
    value: 22,
    icon: 'items/ironscale_gauntlets.png',
    description:
      'Knuckle-plated gauntlets of riveted iron scale with a supple leather palm. ' +
      'Keep grip on the weapon while protecting the fingers from counter-strikes.',
    equipMeta: { slot: 'hands', defenceBonus: 1, requirements: { wayfaring: 1 } },
  },

  // ── Phase 61 — Ranged Combat Foundation ──────────────────────────────────

  {
    id: 'flint_arrow',
    name: 'Flint Arrow',
    type: 'material',
    stackable: true,
    value: 1,
    icon: 'items/flint_arrow.png',
    description:
      'A straight reed shaft tipped with a knapped flint head and stabilised by split feather fletching. ' +
      'Cheap to make and accurate enough at close range — the standard ammunition for a reed shortbow.',
  },

  {
    id: 'reed_shortbow',
    name: 'Reed Shortbow',
    type: 'equipment',
    stackable: false,
    value: 22,
    icon: 'items/reed_shortbow.png',
    description:
      'A recurved bow fashioned from dried marsh-reed, bound at the tips with sinew cord. ' +
      'Fires flint arrows with enough force to strike at a distance — lets a careful fighter ' +
      'thin out threats before they close in.',
    equipMeta: {
      slot: 'mainHand',
      weaponType: 'ranged',
      rangeBonus: 5,
      ammoId: 'flint_arrow',
    },
  },

  // ── Phase 59 — Cooking Expansion ─────────────────────────────────────────

  {
    id: 'hushfang_meat',
    name: 'Hushfang Meat',
    type: 'material',
    stackable: true,
    value: 6,
    icon: 'items/hushfang_meat.png',
    description:
      'A lean strip of dark meat cut from a defeated Hushfang. ' +
      'Faintly pungent when raw — best cooked over a proper hearthfire to draw out its richness.',
  },

  {
    id: 'ember_ram_meat',
    name: 'Ember Ram Meat',
    type: 'material',
    stackable: true,
    value: 8,
    icon: 'items/ember_ram_meat.png',
    description:
      'A dense, ruddy cut of meat from an Ember Ram, still faintly warm from geothermal heat. ' +
      'When properly roasted, the natural mineral charge renders into a fortifying tallow.',
  },

  {
    id: 'hushfang_steak',
    name: 'Hushfang Steak',
    type: 'consumable',
    stackable: true,
    value: 18,
    icon: 'items/hushfang_steak.png',
    description:
      'A Hushfang cut seared over hearthfire until the sinew crisps and the dark juices seal in. ' +
      'Rich and filling — the dense muscle knits closed deeper wounds than ordinary fish or hare.',
    consumableMeta: { healsHp: 32, effect: 'Restores 32 HP' },
  },

  {
    id: 'ember_roast',
    name: 'Ember Roast',
    type: 'consumable',
    stackable: true,
    value: 26,
    icon: 'items/ember_roast.png',
    description:
      'An Ember Ram haunch slow-roasted over a banked hearthfire, basted in its own mineral-rich fat. ' +
      'The fortifying warmth lingers after eating, sharpening the next blow struck in anger.',
    consumableMeta: {
      healsHp: 22,
      buffAttack: 3,
      duration: 45,
      effect: 'Restores 22 HP · +3 Attack for 45 s',
    },
  },

  // ── Phase 62 — Creature Loot Expansion ─────────────────────────────────
  // Drop materials: hides, bone shards, glands, and resinous organs harvested
  // from defeated creatures.  Each feeds at least one crafting route, tying
  // combat rewards directly into the carving, cooking, and tinkering skills.

  {
    id: 'bone_shard',
    name: 'Bone Shard',
    type: 'material',
    stackable: true,
    value: 3,
    icon: 'items/bone_shard.png',
    description:
      'A splintered fragment of dense creature bone, still sharp along one edge. ' +
      'Collected in quantity it can be shaped into fine needles and pins at the carving bench.',
  },

  {
    id: 'toad_gland',
    name: 'Toad Gland',
    type: 'material',
    stackable: true,
    value: 5,
    icon: 'items/toad_gland.png',
    description:
      'A small, pale gland stripped from a Mossback Toad, faintly luminescent and slick to the touch. ' +
      'Rendered over a hearthfire it yields a numbing tonic used by marsh travellers.',
  },

  {
    id: 'resinous_organ',
    name: 'Resinous Organ',
    type: 'material',
    stackable: true,
    value: 6,
    icon: 'items/resinous_organ.png',
    description:
      'A compact organ saturated with natural resin, harvested from thornlings and root crawlers. ' +
      'When pressed with copper it cures into a waterproof sealing pitch prized by tinkers.',
  },

  {
    id: 'thornling_hide',
    name: 'Thornling Hide',
    type: 'material',
    stackable: true,
    value: 4,
    icon: 'items/thornling_hide.png',
    description:
      'A rough, bark-like hide peeled from a defeated Thornling, studded with hardened briar nodes. ' +
      'Coarse but supple enough to be shaped into a serviceable binding at the carving bench.',
  },

  {
    id: 'hushfang_hide',
    name: 'Hushfang Hide',
    type: 'material',
    stackable: true,
    value: 9,
    icon: 'items/hushfang_hide.png',
    description:
      'A smooth, charcoal-dark hide stripped from a Hushfang, surprisingly thin yet tough. ' +
      'Its dense weave holds stitching well, making it ideal for padded wrappings and light armour panels.',
  },

  {
    id: 'ember_ram_hide',
    name: 'Ember Ram Hide',
    type: 'material',
    stackable: true,
    value: 11,
    icon: 'items/ember_ram_hide.png',
    description:
      'A thick, heat-scarred hide taken from an Ember Ram, carrying faint mineral discolouration. ' +
      'The geothermal conditioning makes it naturally resistant to abrasion — a key material for padded armour.',
  },

  // ── Phase 62 — Crafted outputs ─────────────────────────────────────────
  // Items produced at existing craft stations using the new creature drops.

  {
    id: 'bone_needle',
    name: 'Bone Needle',
    type: 'material',
    stackable: true,
    value: 8,
    icon: 'items/bone_needle.png',
    description:
      'A slender needle ground from two bone shards at the carving bench, with a narrow eye bored through the blunt end. ' +
      'Used to stitch hides and fabric with far more precision than a chitin pin allows.',
  },

  {
    id: 'rough_binding',
    name: 'Rough Binding',
    type: 'material',
    stackable: true,
    value: 7,
    icon: 'items/rough_binding.png',
    description:
      'A length of thornling hide worked at the carving bench into a flat, flexible strip. ' +
      'Coarse but durable — used to lash tool handles, reinforce seams, and bundle equipment.',
  },

  {
    id: 'marsh_tonic',
    name: 'Marsh Tonic',
    type: 'consumable',
    stackable: true,
    value: 14,
    icon: 'items/marsh_tonic.png',
    description:
      'A cloudy amber tonic rendered from a Mossback Toad gland over a hearthfire. ' +
      'The mild anaesthetic properties dull sharp pain and restore a second wind after a hard fight.',
    consumableMeta: { healsHp: 12, restoresStamina: 20, effect: 'Restores 12 HP · +20 Stamina' },
  },

  {
    id: 'sealing_pitch',
    name: 'Sealing Pitch',
    type: 'material',
    stackable: true,
    value: 18,
    icon: 'items/sealing_pitch.png',
    description:
      'A disc of dark, flexible pitch formed by pressing resinous organs against a copper plate at the tinkering bench. ' +
      'Waterproof and adhesive — used to seal joints in lanterns, containers, and mechanical assemblies.',
  },

  {
    id: 'hide_wrap',
    name: 'Hide Wrap',
    type: 'material',
    stackable: true,
    value: 22,
    icon: 'items/hide_wrap.png',
    description:
      'Layers of Hushfang hide stitched around an iron backing strip at the tinkering bench. ' +
      'A versatile padded panel used as inner lining for armour and as handle grips on heavy weapons.',
  },

  {
    id: 'char_pad',
    name: 'Char Pad',
    type: 'material',
    stackable: true,
    value: 26,
    icon: 'items/char_pad.png',
    description:
      'A thick slab of Ember Ram hide bonded to an iron backing at the tinkering bench, hardened by residual mineral heat. ' +
      'Acts as an effective impact buffer — a primary component in mid-tier armour construction.',
  },

  // ── Phase 63 — Armor and Clothing Craft Routes ────────────────────────────
  // Items produced at the Sewing Table in the Hushwood settlement.
  // Three routes: hide armour (soft mid-tier), patchplate upgrades (reinforced),
  // and utility clothing with skill-based equip requirements.

  // ── Hide Armor Route ─────────────────────────────────────────────────────
  // Lightweight hide armour stitched together from Hushfang hides, bone
  // needles, and rough bindings.  A clear upgrade over the starter roughhide
  // vest, covering every body slot.

  {
    id: 'hide_bracers',
    name: 'Hide Bracers',
    type: 'equipment',
    stackable: false,
    value: 20,
    icon: 'items/hide_bracers.png',
    description:
      'Supple bracers of layered Hushfang hide, stitched tight at the wrist with bone-needle precision. ' +
      'Light enough for nimble work, sturdy enough to deflect glancing blows.',
    equipMeta: { slot: 'hands', defenceBonus: 3 },
  },

  {
    id: 'hide_hood',
    name: 'Hide Hood',
    type: 'equipment',
    stackable: false,
    value: 24,
    icon: 'items/hide_hood.png',
    description:
      'A close-fitting hood of doubled Hushfang hide, the seams aligned to shed rain and muffle noise. ' +
      'Modest head protection favoured by scouts who value silence over ceremony.',
    equipMeta: { slot: 'head', defenceBonus: 3 },
  },

  {
    id: 'hide_leggings',
    name: 'Hide Leggings',
    type: 'equipment',
    stackable: false,
    value: 28,
    icon: 'items/hide_leggings.png',
    description:
      'Full-length leggings of Hushfang hide, reinforced at the knee and inner thigh with rough-binding strips. ' +
      'Quiet in the undergrowth and resistant to thorn-scrape and shallow blade work.',
    equipMeta: { slot: 'legs', defenceBonus: 5 },
  },

  {
    id: 'hide_jerkin',
    name: 'Hide Jerkin',
    type: 'equipment',
    stackable: false,
    value: 34,
    icon: 'items/hide_jerkin.png',
    description:
      'A close-cut jerkin of triple-layered Hushfang hide, belted at the waist and bound at the shoulders. ' +
      'A reliable mid-tier chest piece — more protection than rough frontier cloth, lighter than iron plate.',
    equipMeta: { slot: 'chest', defenceBonus: 6 },
  },

  // ── Patchplate Upgrades ───────────────────────────────────────────────────
  // Reinforced hide-and-iron hybrid armour for seasoned fighters.  Uses
  // char_pad as the primary impact buffer and demands wayfaring experience
  // to equip safely.

  {
    id: 'patchplate_coif',
    name: 'Patchplate Coif',
    type: 'equipment',
    stackable: false,
    value: 40,
    icon: 'items/patchplate_coif.png',
    description:
      'A padded coif of Char Pad panels stitched over a hide foundation and rimmed with mismatched iron strips. ' +
      'Heavier and better-protecting than the hide hood — the preferred headwear when a hard fight is expected.',
    equipMeta: { slot: 'head', defenceBonus: 5, requirements: { wayfaring: 2 } },
  },

  {
    id: 'patchplate_vest',
    name: 'Patchplate Vest',
    type: 'equipment',
    stackable: false,
    value: 52,
    icon: 'items/patchplate_vest.png',
    description:
      'A double-layered vest built from Char Pad sections stitched over rough binding, with iron-reinforced shoulder panels. ' +
      'Absorbs more punishment than any soft-hide chest piece while remaining lighter than full plate.',
    equipMeta: { slot: 'chest', defenceBonus: 8, requirements: { wayfaring: 2 } },
  },

  // ── Utility Clothing ──────────────────────────────────────────────────────
  // Purpose-made garments for skilled practitioners of gathering and crafting.
  // Each piece requires demonstrated mastery in its associated skill to equip;
  // the fit and construction are optimised for the movements of that trade.

  {
    id: 'gatherer_wraps',
    name: "Gatherer's Wraps",
    type: 'equipment',
    stackable: false,
    value: 18,
    icon: 'items/gatherer_wraps.png',
    description:
      'Lightweight hand wraps of Thornling hide, double-layered at the palm for grip and thorn-resistance. ' +
      'Worn by foragers who spend long hours among briar and reed; the cut allows full finger movement for precise harvesting.',
    equipMeta: { slot: 'hands', defenceBonus: 1, requirements: { foraging: 3 } },
  },

  {
    id: 'woodcutter_smock',
    name: "Woodcutter's Smock",
    type: 'equipment',
    stackable: false,
    value: 22,
    icon: 'items/woodcutter_smock.png',
    description:
      'A robust Thornling-hide smock with reinforced shoulders and a deep hood to shed wood chips. ' +
      'Favoured by foresters who spend days in the canopy; the wide cut allows a full axe swing without binding.',
    equipMeta: { slot: 'chest', defenceBonus: 2, requirements: { woodcutting: 3 } },
  },

  {
    id: 'miner_gloves',
    name: "Miner's Gloves",
    type: 'equipment',
    stackable: false,
    value: 26,
    icon: 'items/miner_gloves.png',
    description:
      'Thick Ember Ram hide gloves with a heat-hardened palm panel and reinforced cuff. ' +
      'The mineral-treated hide absorbs repeated vibration from pick-strikes and repels rock dust — essential for deep-seam work.',
    equipMeta: { slot: 'hands', defenceBonus: 2, requirements: { mining: 4 } },
  },

  // ── Phase 65 — Hollow Vault Steps drop materials ──────────────────────────

  {
    id: 'vault_chitin',
    name: 'Vault Chitin',
    type: 'material',
    stackable: true,
    value: 6,
    icon: 'items/vault_chitin.png',
    description:
      'A pale, interlocking chitinous plate shed by Vault Crawlers. ' +
      'Lightweight and surprisingly rigid, the material holds a faint mineral sheen — ' +
      'useful in light armour and insulating craft applications.',
  },

  {
    id: 'wraith_stone',
    name: 'Wraith Stone',
    type: 'material',
    stackable: true,
    value: 14,
    icon: 'items/wraith_stone.png',
    description:
      'A cold, porous stone fragment that formed inside the body of a Stone Wraith. ' +
      'Residual warding resonance makes the surface faintly luminescent; ' +
      'experienced warders believe it could be refined into higher-tier ward inscriptions.',
  },

  // ── Phase 66 — Salvage System ─────────────────────────────────────────────
  // Ruin-derived raw materials gathered from salvage nodes in the Hollow Vault.
  // Each material connects to a downstream crafting recipe in tinkering or
  // warding so salvaging has an immediately meaningful loop.

  {
    id: 'crumbled_masonry',
    name: 'Crumbled Masonry',
    type: 'material',
    stackable: true,
    value: 4,
    icon: 'items/crumbled_masonry.png',
    description:
      'Loose chunks of pre-Veil stonework knocked free from vault walls and floor slabs. ' +
      'The mineral density is higher than ordinary rough stone; skilled tinkerers can ' +
      'reduce it into a dense bonding compound used in structural repair.',
  },

  {
    id: 'iron_relic_fragment',
    name: 'Iron Relic Fragment',
    type: 'material',
    stackable: true,
    value: 9,
    icon: 'items/iron_relic_fragment.png',
    description:
      'A corroded but solid iron shard broken from an ancient fixture or fitting deep ' +
      'inside the vault. Despite heavy oxidation the metal core holds its temper — ' +
      'a tinkerer can work it into precision fasteners or reinforcing pieces.',
  },

  {
    id: 'vault_seal_wax',
    name: 'Vault Seal Wax',
    type: 'material',
    stackable: true,
    value: 12,
    icon: 'items/vault_seal_wax.png',
    description:
      'Dark residue scraped from the wax seals that once bound the vault\'s inner chambers. ' +
      'Saturated with old ward-craft, the material still resonates faintly with protective ' +
      'intention — warders prize it for inscribing higher-tier seal patterns.',
  },

  // ── Phase 66 — Tinkering outputs from salvage ─────────────────────────────

  {
    id: 'vault_mortar',
    name: 'Vault Mortar',
    type: 'material',
    stackable: true,
    value: 14,
    icon: 'items/vault_mortar.png',
    description:
      'A dense grey compound pressed from pulverised Crumbled Masonry and mineral binder. ' +
      'Sets harder than common lime mortar and resists moisture — used in structural ' +
      'repairs, sealed joins, and as a filler in heavy armour construction.',
  },

  {
    id: 'relic_rivet',
    name: 'Relic Rivet',
    type: 'material',
    stackable: true,
    value: 20,
    icon: 'items/relic_rivet.png',
    description:
      'A short, precisely-formed rivet worked from Iron Relic Fragment stock. ' +
      'The pre-Veil iron holds a finer grain than modern smelts, making these ' +
      'rivets unusually strong — used in mid-tier armour assembly and secure bindings.',
  },

  // ── Phase 66 — Warding output from salvage ────────────────────────────────

  {
    id: 'vault_seal_ward',
    name: 'Vault Seal Ward',
    type: 'consumable',
    stackable: true,
    value: 28,
    icon: 'items/vault_seal_ward.png',
    description:
      'A ward mark inscribed using Vault Seal Wax as the binding medium. ' +
      'The residual intention locked inside the wax amplifies the inscription, ' +
      'producing a seal strong enough to bar lesser spirits and deter ruin creatures.',
  },

  // ── Phase 67 — Skill-gated vault inscription reward ───────────────────────

  {
    id: 'vault_inscription_fragment',
    name: 'Vault Inscription Fragment',
    type: 'material',
    stackable: true,
    value: 22,
    icon: 'items/vault_inscription_fragment.png',
    description:
      'A careful transcription of the runic inscription carved into the south ' +
      'wall of the Hollow Vault lower floor.  The glyphs predate the Veil and ' +
      'record a partial ward-boundary survey — scholars and warders prize these ' +
      'fragments for reconstructing the pre-Veil boundary map.',
  },

  // ── Phase 68 — Light and Visibility Mechanics ─────────────────────────────

  {
    id: 'hollow_lantern',
    name: 'Hollow Lantern',
    type: 'equipment',
    stackable: false,
    value: 38,
    icon: 'items/hollow_lantern.png',
    description:
      'A compact copper lantern assembled from pressed panels and a sealed wax ' +
      'reservoir.  The vault-wax lining keeps the flame steady even in the ' +
      'damp air of underground ruins.  Equipping it wards off the disorienting ' +
      'darkness found deep inside the Hollow Vault.',
    equipMeta: {
      slot: 'offHand',
      providesLight: true,
    },
  },

  {
    id: 'tallow_candle',
    name: 'Tallow Candle',
    type: 'consumable',
    stackable: true,
    value: 6,
    icon: 'items/tallow_candle.png',
    description:
      'A short candle pressed from animal tallow.  Burns with a dim, steady ' +
      'flame — not enough to fully penetrate vault darkness, but enough to ' +
      'steady your nerves and recover a little stamina.',
    consumableMeta: {
      restoresStamina: 12,
      effect: 'Restores 12 stamina.',
    },
  },

  // ── Phase 74 — Marrowfen Blockout ─────────────────────────────────────────

  {
    id: 'marrowfen_spore',
    name: 'Marrowfen Spore',
    type: 'material',
    stackable: true,
    value: 18,
    icon: 'items/marrowfen_spore.png',
    description:
      'A pale, faintly luminescent spore cap harvested from the fen floor. ' +
      'The bioluminescent spores within pulse gently with a soft violet glow. ' +
      'Herbalists and alchemists prize them for restorative and ward-binding preparations.',
  },

  {
    id: 'bogfiend_scale',
    name: 'Bogfiend Scale',
    type: 'material',
    stackable: true,
    value: 22,
    icon: 'items/bogfiend_scale.png',
    description:
      'A thick, hexagonal scale pried from a defeated Bogfiend. ' +
      'Dense and moisture-resistant, the keratin plates resist cuts and blunt impacts — ' +
      'crafters use them in mid-tier armour and durable water-resistant bindings.',
  },

  {
    id: 'mire_hound_pelt',
    name: 'Mire Hound Pelt',
    type: 'material',
    stackable: true,
    value: 16,
    icon: 'items/mire_hound_pelt.png',
    description:
      'A supple, mottled pelt stripped from a Mire Hound. ' +
      'The dense, water-repellent undercoat makes it excellent for lining cloaks ' +
      'and crafting light armour suited to wet, overgrown terrain.',
  },

  {
    id: 'bog_filter_wrap',
    name: 'Bog Filter Wrap',
    type: 'equipment',
    stackable: false,
    value: 30,
    icon: 'items/bog_filter_wrap.png',
    description:
      'A dense cloth wrap soaked in rendered Bogfiend tallow and dried Marrowfen Spore powder. ' +
      'Worn over the nose and mouth, it filters out the worst of the toxic gas that ' +
      'seeps from the Marrowfen vents — providing reliable protection inside the fen.',
    equipMeta: {
      slot: 'neck',
    },
  },
]
