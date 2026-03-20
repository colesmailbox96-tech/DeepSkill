import type { Skill } from './skillSchema'
import { xpToNextLevel } from './xpCurve'

/**
 * Phase 13 — Starter Skill Set
 *
 * Six foundational skills available from the start of the game.
 * Every skill begins at level 1 with 0 XP.  Descriptions are
 * Veilmarch-original — no external IP references.
 *
 * Phase 14: experienceToNextLevel is now derived from xpToNextLevel()
 * so the data layer and the XP-curve module stay in sync.
 *
 * Phase 42: carving skill added.
 * Phase 43: tinkering skill added.
 */
export const STARTER_SKILLS: Skill[] = [
  {
    id: 'woodcutting',
    name: 'Woodcutting',
    level: 1,
    experience: 0,
    experienceToNextLevel: xpToNextLevel(1),
    description:
      'Felling the ironwood and ashwood stands of Cinderglen Reach. Mastery reveals denser grain layers and unlocks access to mineralized growth-ring timber.',
  },
  {
    id: 'mining',
    name: 'Mining',
    level: 1,
    experience: 0,
    experienceToNextLevel: xpToNextLevel(1),
    description:
      'Reading the vein-pulse of stone warmed by Deep Heart currents. Skilled quarriers chip uncracked cores from the rock and recognise rare mineral pockets.',
  },
  {
    id: 'fishing',
    name: 'Fishing',
    level: 1,
    experience: 0,
    experienceToNextLevel: xpToNextLevel(1),
    description:
      'Working the geothermal seep-lines where warm upwellings draw cold-water fish toward the shallows. Patience and technique matter as much as the rod.',
  },
  {
    id: 'foraging',
    name: 'Foraging',
    level: 1,
    experience: 0,
    experienceToNextLevel: xpToNextLevel(1),
    description:
      'Gathering plants, fungi, reeds, and resin from the wild margins of Cinderglen Reach. A trained forager reads the terrain and coaxes richer yields from the same patch.',
  },
  {
    id: 'hearthcraft',
    name: 'Hearthcraft',
    level: 1,
    experience: 0,
    experienceToNextLevel: xpToNextLevel(1),
    description:
      'Preparing food over open flame or forge-coals. Higher mastery unlocks richer recipes that restore greater vitality and grant short-term endurance boosts.',
  },
  {
    id: 'forging',
    name: 'Forging',
    level: 1,
    experience: 0,
    experienceToNextLevel: xpToNextLevel(1),
    description:
      'Shaping raw metal against hammer and heat. Mastery determines the hardness, edge retention, and durability of crafted tools, blades, and fittings.',
  },
  {
    id: 'wayfaring',
    name: 'Wayfaring',
    level: 1,
    experience: 0,
    experienceToNextLevel: xpToNextLevel(1),
    description:
      'Reading terrain, managing load, and moving through rough country. Seasoned wayfinders tire more slowly, discover hidden paths, and shrug off rough ground.',
  },
  {
    id: 'carving',
    name: 'Carving',
    level: 1,
    experience: 0,
    experienceToNextLevel: xpToNextLevel(1),
    description:
      'Shaping raw wood and bone into functional utility pieces. A skilled carver wastes less material, works faster, and unlocks finer forms that serve as components in advanced crafting.',
  },

  {
    id: 'tinkering',
    name: 'Tinkering',
    level: 1,
    experience: 0,
    experienceToNextLevel: xpToNextLevel(1),
    description:
      'Assembling refined components into practical utility devices. A skilled tinkerer turns copper, iron, and worked wood into lanterns, hooks, baskets, and clamps that support every other discipline.',
  },

  {
    id: 'surveying',
    name: 'Surveying',
    level: 1,
    experience: 0,
    experienceToNextLevel: xpToNextLevel(1),
    description:
      'Reading subtle disturbances in soil, stone, and roots that betray buried caches left by travellers long gone. A trained surveyor detects richer deposits and rarer fragments missed by untrained eyes.',
  },
]
