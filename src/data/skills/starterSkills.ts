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
]
