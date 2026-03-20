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

/** Complete list of all task definitions (Phase 37 + Phase 38). */
export const ALL_TASKS: TaskDefinition[] = [
  wordFromTheElder,
  warmRunoff,
  haulForTheHearth,
  stockTheCampStores,
  stoneFromTheQuarry,
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
