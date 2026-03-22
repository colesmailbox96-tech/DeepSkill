/**
 * Phase 38 — Task Registry (extended from Phase 37)
 *
 * Registers all task definitions in the engine registry and exports a
 * convenience initialiser that App.tsx calls once at startup.
 *
 * Phase 37 shipped with two introductory tasks ("Word from the Elder" and
 * "Warm Runoff") that demonstrate the full framework pipeline.
 *
 * Phase 38 adds the first practical task set — gather and deliver tasks that
 * make use of every gathering skill in the starter zone:
 *   "Haul for the Hearth"     – cut ashwood logs and deliver them to Bron
 *   "Stock the Camp Stores"   – catch perch and deliver them to Mira
 *   "Stone from the Quarry"   – mine copper ore for the settlement
 *
 * Phase 64 adds the Tidemark Storyline Arc — four connected tasks centred on
 * the Tidemark Chapel, the mist-seep hazard, and the Ashwillow Ward:
 *   "Word from the Tidemark"      – speak with Nairn Dusk (chapel hazard intro)
 *   "A Ward Before the Mist"      – obtain an Ashwillow Ward (warding relevance)
 *   "The Mist-Born"               – defeat 3 Chapel Wisps (hazard combat)
 *   "Echoes of the Sealed Shaft"  – explore inner shrine, gather wisp_ember,
 *                                   deliver to Nairn (region reward unlock)
 */

import { registerTasks } from '../../engine/task'
import type { TaskDefinition } from '../../engine/task'

// ─── Task definitions ─────────────────────────────────────────────────────────

/**
 * "Word from the Elder"
 * An introductory task that asks the player to speak with Aldric.
 * This demonstrates talk-type objectives, reward delivery, and journal entries.
 * Completing it opens further context in Aldric's dialogue tree.
 *
 * NOTE: `targetId` for 'talk' objectives must exactly match the NPC's
 * `DialogueTree.npcName` value (defined in npcDialogues.ts), since the game
 * loop compares `openDialogueNpcName === obj.targetId` to advance progress.
 */
const wordFromTheElder: TaskDefinition = {
  id: 'word_from_the_elder',
  title: 'Word from the Elder',
  description:
    'Aldric, the village elder, has asked to speak with you about recent disturbances along the Brackroot Trail.',
  giverName: 'Aldric (Village Elder)',
  objectives: [
    {
      id: 'talk_to_aldric',
      description: 'Speak with Aldric (Village Elder)',
      type: 'talk',
      targetId: 'Aldric (Village Elder)',
      required: 1,
    },
  ],
  reward: {
    coins: 5,
    xp: [{ skill: 'wayfaring', amount: 15 }],
  },
  journalEntry:
    'The elder flagged me down near the settlement hall. His face was drawn — more than the usual frontier weariness. He said the Veil has been shifting and that strange tracks have been found on the Brackroot Trail. He wants to brief me in person before I wander further south.',
}

/**
 * "Warm Runoff"
 * An exploration task to investigate a geothermal seep site in the marsh.
 * Demonstrates explore-type objectives with zone targeting.
 */
const warmRunoff: TaskDefinition = {
  id: 'warm_runoff',
  title: 'Warm Runoff',
  description:
    'Sera the Herbalist has noticed an unusual warm current flowing from the marsh toward the settlement. She wants someone to investigate the source.',
  giverName: 'Sera (Herbalist)',
  objectives: [
    {
      id: 'reach_brackroot_trail',
      description: 'Reach the Brackroot Trail',
      type: 'explore',
      targetId: 'brackroot_trail',
      required: 1,
    },
  ],
  reward: {
    coins: 8,
    items: [{ itemId: 'marsh_herb', qty: 2 }],
    xp: [{ skill: 'foraging', amount: 20 }],
  },
  journalEntry:
    "Sera pulled me aside by the commons pond. She's been tracking the temperature of the runoff channels and says something deeper in the grove is leaking heat — warm enough to alter the herb growth along the trail edge. She can't leave the settlement herself and asked me to go look. I should follow the south road and see what's changed.",
}

// ─── ALL_TASKS ────────────────────────────────────────────────────────────────

// ── Phase 38 — Practical starter tasks ────────────────────────────────────

/**
 * "Haul for the Hearth"
 * Bron the Blacksmith needs ashwood logs to keep the forge fire going.
 * Demonstrates a gather → deliver two-objective chain.
 */
const haulForTheHearth: TaskDefinition = {
  id: 'haul_for_the_hearth',
  title: 'Haul for the Hearth',
  description:
    "Bron's forge fire is running low. He needs five ashwood logs cut and delivered before nightfall.",
  giverName: 'Bron (Blacksmith)',
  objectives: [
    {
      id: 'cut_ashwood_logs',
      description: 'Cut 5 Ashwood Logs',
      type: 'gather',
      targetId: 'ashwood_log',
      required: 5,
    },
    {
      id: 'deliver_logs_to_bron',
      description: 'Deliver the logs to Bron (Blacksmith)',
      type: 'deliver',
      targetId: 'Bron (Blacksmith)',
      required: 1,
    },
  ],
  reward: {
    coins: 15,
    xp: [{ skill: 'woodcutting', amount: 35 }],
  },
  journalEntry:
    "Bron stopped me outside the smithy — the forge fire is running low and he's too busy mending tools to head out himself. He needs ashwood logs, five of them, to keep the heat through the night. I should head to the roadside trees, cut what he needs, and bring them back.",
}

/**
 * "Stock the Camp Stores"
 * Mira the Innkeeper needs fresh perch for the settlement kitchen.
 * Demonstrates a gather → deliver two-objective chain.
 */
const stockTheCampStores: TaskDefinition = {
  id: 'stock_the_camp_stores',
  title: 'Stock the Camp Stores',
  description:
    'Mira is running low on fresh fish. She needs three perch delivered to the inn kitchen.',
  giverName: 'Mira (Innkeeper)',
  objectives: [
    {
      id: 'catch_perch',
      description: 'Catch 3 Perch',
      type: 'gather',
      targetId: 'perch',
      required: 3,
    },
    {
      id: 'deliver_fish_to_mira',
      description: 'Deliver the fish to Mira (Innkeeper)',
      type: 'deliver',
      targetId: 'Mira (Innkeeper)',
      required: 1,
    },
  ],
  reward: {
    coins: 10,
    items: [{ itemId: 'cooked_perch', qty: 1 }],
    xp: [{ skill: 'fishing', amount: 30 }],
  },
  journalEntry:
    "Mira is running low on fresh protein. She said the usual supply traders haven't come through and the settlement is eating dry rations again. She's asked me to fish the nearby pond for perch — three should be enough to feed the kitchen tonight. In return she'll cook one up for me to take.",
}

/**
 * "Stone from the Quarry"
 * Aldric needs copper ore from the quarry face for settlement repairs.
 * Demonstrates a standalone gather objective — no delivery step required.
 */
const stoneFromTheQuarry: TaskDefinition = {
  id: 'stone_from_the_quarry',
  title: 'Stone from the Quarry',
  description:
    'Aldric needs copper ore from the quarry face for hearth-wall repairs. Mine four chunks from the exposed rock.',
  giverName: 'Aldric (Village Elder)',
  objectives: [
    {
      id: 'mine_copper_ore',
      description: 'Mine 4 Copper Ore',
      type: 'gather',
      targetId: 'copper_ore',
      required: 4,
    },
  ],
  reward: {
    coins: 12,
    xp: [{ skill: 'mining', amount: 30 }],
  },
  journalEntry:
    "Aldric pulled me aside near the settlement hall. The hearth wall is crumbling and the last of the cut stone was used up in last season's repairs. He says there's copper-bearing rock along the old quarry face east of the settlement — four chunks should give the masons enough to work with.",
}

// ─── Phase 64 — Tidemark Storyline Arc ───────────────────────────────────────

/**
 * "Word from the Tidemark" (Task 1 of 4)
 * Nairn Dusk flags the player down and asks them to come speak with her about
 * the chapel hazard.  This is the arc entry point — a simple talk objective
 * that rewards the chapel hazard explanation.
 */
const wordFromTheTidemark: TaskDefinition = {
  id: 'tidemark_word',
  title: 'Word from the Tidemark',
  description:
    "Nairn Dusk, the ward-adept who keeps vigil at the Tidemark Chapel, has something important to tell you about the mist rising from the sealed shaft.",
  giverName: 'Nairn Dusk (Ward-Adept)',
  objectives: [
    {
      id: 'talk_to_nairn',
      description: 'Speak with Nairn Dusk (Ward-Adept)',
      type: 'talk',
      targetId: 'Nairn Dusk (Ward-Adept)',
      required: 1,
    },
  ],
  reward: {
    coins: 8,
    xp: [{ skill: 'wayfaring', amount: 20 }],
  },
  journalEntry:
    'Nairn Dusk waylaid me near the chapel entrance. She has been stationed here for weeks, studying the ward patterns carved into the stone and monitoring the mist that rises from the shaft. She said I need to understand the danger before I go any further — the shaft seeps something that drains the warmth from you. She asked me to come and hear her out properly.',
}

/**
 * "A Ward Before the Mist" (Task 2 of 4)
 * Nairn makes the warding system tangible: the player must obtain one
 * Ashwillow Ward to prove they are prepared to enter the hazard zone safely.
 */
const aWardBeforeTheMist: TaskDefinition = {
  id: 'tidemark_ward_proof',
  title: 'A Ward Before the Mist',
  description:
    "Nairn has warned you that the sealed shaft's mist seep is lethal without protection. Obtain an Ashwillow Ward before venturing into the inner shrine.",
  giverName: 'Nairn Dusk (Ward-Adept)',
  objectives: [
    {
      id: 'obtain_ashwillow_ward',
      description: 'Obtain 1 Ashwillow Ward',
      type: 'gather',
      targetId: 'ashwillow_ward',
      required: 1,
    },
  ],
  reward: {
    coins: 10,
    xp: [{ skill: 'warding', amount: 30 }],
  },
  journalEntry:
    "Nairn explained the Ashwillow Ward — a flat disc of scored ashwood sealed with resin smoke. The interlocking glyph pattern resonates with the boundary markers carved into the chapel stone, causing the mist to divert away from the bearer. Without one, she said, standing in the inner shrine for any length of time is a death sentence. I need to get hold of one from the warding altar in Hushwood before I go further.",
}

/**
 * "The Mist-Born" (Task 3 of 4)
 * Nairn believes the Chapel Wisps are manifestations of the shaft's mist.
 * Defeating three of them gives both combat exposure to the hazard zone and
 * drops wisp_ember fragments that Nairn needs for her research.
 */
const theMistBorn: TaskDefinition = {
  id: 'tidemark_mist_born',
  title: 'The Mist-Born',
  description:
    'Nairn believes the Chapel Wisps that haunt the inner shrine are drawn from the mist itself. Defeat three of them to thin their numbers and gather evidence.',
  giverName: 'Nairn Dusk (Ward-Adept)',
  objectives: [
    {
      id: 'kill_chapel_wisp',
      description: 'Defeat 3 Chapel Wisps',
      type: 'kill',
      targetId: 'chapel_wisp',
      required: 3,
    },
  ],
  reward: {
    coins: 15,
    xp: [{ skill: 'wayfaring', amount: 30 }],
  },
  journalEntry:
    "Nairn has a theory: the wisps aren't separate creatures but crystallised fragments of the mist, given unstable form by the Veil boundary beneath the shaft. She says they dissolve when struck and leave behind a cold light she calls a Wisp Ember. She wants me to fight three of them to thin the population inside the shrine and bring back what they shed.",
}

/**
 * "Echoes of the Sealed Shaft" (Task 4 of 4)
 * The arc climax: the player enters the inner shrine (explore objective),
 * gathers three wisp_ember fragments, and delivers them to Nairn.
 * Completing this task unlocks the region reward — a substantial XP grant
 * and two Ashwillow Wards to sustain further chapel exploration.
 */
const echoesOfTheSealedShaft: TaskDefinition = {
  id: 'tidemark_sealed_shaft',
  title: 'Echoes of the Sealed Shaft',
  description:
    "Nairn needs three Wisp Ember fragments recovered from inside the inner shrine to map the Tidemark boundary. Enter the mist zone, gather the fragments, and return to her.",
  giverName: 'Nairn Dusk (Ward-Adept)',
  objectives: [
    {
      id: 'explore_inner_shrine',
      description: 'Enter the inner shrine (Tidemark Chapel)',
      type: 'explore',
      targetId: 'tidemark_chapel',
      required: 1,
    },
    {
      id: 'gather_wisp_ember',
      description: 'Gather 3 Wisp Embers',
      type: 'gather',
      targetId: 'wisp_ember',
      required: 3,
    },
    {
      id: 'deliver_embers_to_nairn',
      description: 'Deliver the Wisp Embers to Nairn Dusk (Ward-Adept)',
      type: 'deliver',
      targetId: 'Nairn Dusk (Ward-Adept)',
      required: 1,
    },
  ],
  reward: {
    coins: 30,
    items: [{ itemId: 'ashwillow_ward', qty: 2 }],
    xp: [
      { skill: 'warding', amount: 60 },
      { skill: 'wayfaring', amount: 40 },
    ],
  },
  journalEntry:
    "Nairn laid out her full plan: she needs three Wisp Ember fragments to triangulate the edges of the Tidemark boundary — the point underground where the Veil runs thin and the mist originates. She wants me to enter the inner shrine, gather the embers the wisps leave behind, and bring them back to her. She pressed two extra Ashwillow Wards into my hands and told me not to go in without at least one of them. Whatever the founders sealed in that shaft, she is certain it is still down there.",
}

/** Complete list of all task definitions (Phase 37 + Phase 38 + Phase 64). */
export const ALL_TASKS: TaskDefinition[] = [
  wordFromTheElder,
  warmRunoff,
  haulForTheHearth,
  stockTheCampStores,
  stoneFromTheQuarry,
  // Phase 64 — Tidemark Storyline Arc
  wordFromTheTidemark,
  aWardBeforeTheMist,
  theMistBorn,
  echoesOfTheSealedShaft,
]

// ─── Initialiser ─────────────────────────────────────────────────────────────

/**
 * Register all task definitions into the engine registry.
 * Call once at application startup (e.g. in App.tsx) before any store
 * operations that reference task ids.
 */
export function registerAllTasks(): void {
  registerTasks(ALL_TASKS)
}
