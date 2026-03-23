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
 *
 * Phase 75 adds three region-bridging quest chains:
 *   Chain 1 — "The Foreman's Contract" (Hushwood ↔ Quarry):
 *     "Word from the Foreman"     – explore quarry, speak with Gorven
 *     "Iron for the Settlement"   – mine iron_ore, deliver to Bron
 *     "The Deep Seam"             – mine duskiron_ore, deliver to Gorven;
 *                                   unlocks quarry supply cache (gated door)
 *   Chain 2 — "Mist and Fen" (Chapel ↔ Marrowfen):
 *     "The Fen Signal"            – explore Marrowfen on Nairn's instruction
 *     "Fen Samples"               – gather marrowfen_spore, return to Nairn
 *     "Wards Against the Fen"     – defeat bogfiend × 2 + mire_hound × 2,
 *                                   return to Nairn; rewards bog gear + ward
 *   Chain 3 — "The Elder's Survey" (Hushwood → all regions):
 *     "Survey the Reach"          – accept commission from Aldric
 *     "Samples from the Frontier" – gather duskiron_ore, marrowfen_spore,
 *                                   wisp_ember (one from each region)
 *     "Full Report to the Elder"  – deliver samples to Aldric; major XP reward
 *
 * Phase 86 — each task definition now carries an optional `unlocksTaskIds`
 * field.  When a task completes, useTaskStore.completeTask() automatically
 * accepts every task listed there, so players experience a staged quest
 * introduction rather than receiving every task simultaneously at game start.
 *
 * Chain summary (new game flow):
 *   Start                              → word_from_the_elder
 *   word_from_the_elder completes      → warm_runoff, haul_for_the_hearth,
 *                                        stock_the_camp_stores, stone_from_the_quarry
 *   haul_for_the_hearth completes      → tidemark_word, survey_reach
 *   stone_from_the_quarry completes    → quarry_word
 *   tidemark_word      → tidemark_ward_proof → tidemark_mist_born
 *                      → tidemark_sealed_shaft → fen_signal → fen_samples
 *                      → fen_ward_work
 *   quarry_word        → quarry_iron_haul → quarry_deep_seam
 *   survey_reach       → survey_samples  → survey_report
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
    factionRep: [{ factionId: 'hushwrights', amount: 10 }],
  },
  journalEntry:
    'The elder flagged me down near the settlement hall. His face was drawn — more than the usual frontier weariness. He said the Veil has been shifting and that strange tracks have been found on the Brackroot Trail. He wants to brief me in person before I wander further south.',
  // Phase 86 — unlock the first practical task set after meeting the elder.
  unlocksTaskIds: ['warm_runoff', 'haul_for_the_hearth', 'stock_the_camp_stores', 'stone_from_the_quarry'],
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
    factionRep: [{ factionId: 'hushwrights', amount: 20 }],
  },
  journalEntry:
    "Bron stopped me outside the smithy — the forge fire is running low and he's too busy mending tools to head out himself. He needs ashwood logs, five of them, to keep the heat through the night. I should head to the roadside trees, cut what he needs, and bring them back.",
  // Phase 86 — completing the first woodcutting task opens the Tidemark arc
  // and the Elder's Survey commission.
  unlocksTaskIds: ['tidemark_word', 'survey_reach'],
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
    factionRep: [{ factionId: 'hushwrights', amount: 15 }],
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
    factionRep: [{ factionId: 'quarry_union', amount: 15 }],
  },
  journalEntry:
    "Aldric pulled me aside near the settlement hall. The hearth wall is crumbling and the last of the cut stone was used up in last season's repairs. He says there's copper-bearing rock along the old quarry face east of the settlement — four chunks should give the masons enough to work with.",
  // Phase 86 — completing the first mining task opens the Foreman's Contract chain.
  unlocksTaskIds: ['quarry_word'],
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
    factionRep: [{ factionId: 'tidebound_keepers', amount: 15 }],
  },
  journalEntry:
    'Nairn Dusk waylaid me near the chapel entrance. She has been stationed here for weeks, studying the ward patterns carved into the stone and monitoring the mist that rises from the shaft. She said I need to understand the danger before I go any further — the shaft seeps something that drains the warmth from you. She asked me to come and hear her out properly.',
  unlocksTaskIds: ['tidemark_ward_proof'],
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
    factionRep: [{ factionId: 'tidebound_keepers', amount: 20 }],
  },
  journalEntry:
    "Nairn explained the Ashwillow Ward — a flat disc of scored ashwood sealed with resin smoke. The interlocking glyph pattern resonates with the boundary markers carved into the chapel stone, causing the mist to divert away from the bearer. Without one, she said, standing in the inner shrine for any length of time is a death sentence. I need to get hold of one from the warding altar in Hushwood before I go further.",
  unlocksTaskIds: ['tidemark_mist_born'],
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
    factionRep: [{ factionId: 'tidebound_keepers', amount: 25 }],
  },
  journalEntry:
    "Nairn has a theory: the wisps aren't separate creatures but crystallised fragments of the mist, given unstable form by the Veil boundary beneath the shaft. She says they dissolve when struck and leave behind a cold light she calls a Wisp Ember. She wants me to fight three of them to thin the population inside the shrine and bring back what they shed.",
  unlocksTaskIds: ['tidemark_sealed_shaft'],
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
    factionRep: [{ factionId: 'tidebound_keepers', amount: 40 }],
  },
  journalEntry:
    "Nairn laid out her full plan: she needs three Wisp Ember fragments to triangulate the edges of the Tidemark boundary — the point underground where the Veil runs thin and the mist originates. She wants me to enter the inner shrine, gather the embers the wisps leave behind, and bring them back to her. She pressed two extra Ashwillow Wards into my hands and told me not to go in without at least one of them. Whatever the founders sealed in that shaft, she is certain it is still down there.",
  // Phase 86 — completing the Tidemark arc opens the Mist and Fen chain.
  unlocksTaskIds: ['fen_signal'],
}

// ─── Phase 75 — Chain 1: The Foreman's Contract (Hushwood ↔ Quarry) ──────────

/**
 * "Word from the Foreman" (Task 1 of 3)
 * Gorven (Quarry Foreman) needs the settlement's support.  The player must
 * travel to the quarry and speak with him to open the chain.
 */
const quarryWord: TaskDefinition = {
  id: 'quarry_word',
  title: 'Word from the Foreman',
  description:
    'Gorven at Redwake Quarry has sent word to the settlement — he needs help keeping the iron quota up. Head north to the quarry and hear him out.',
  giverName: 'Gorven (Quarry Foreman)',
  objectives: [
    {
      id: 'explore_quarry',
      description: 'Reach Redwake Quarry',
      type: 'explore',
      targetId: 'quarry',
      required: 1,
    },
    {
      id: 'talk_to_gorven_word',
      description: 'Speak with Gorven (Quarry Foreman)',
      type: 'talk',
      targetId: 'Gorven (Quarry Foreman)',
      required: 1,
    },
  ],
  reward: {
    coins: 10,
    xp: [{ skill: 'wayfaring', amount: 15 }],
    factionRep: [{ factionId: 'quarry_union', amount: 10 }],
  },
  journalEntry:
    "A note was left at the settlement gate — Gorven at the Redwake face is behind on quota and wants a word. The settlement relies on the quarry output for repairs and smithing stock, so I should head north and find out what he needs.",
  unlocksTaskIds: ['quarry_iron_haul'],
}

/**
 * "Iron for the Settlement" (Task 2 of 3)
 * Mine five iron ore from the quarry and deliver them to Bron the Blacksmith
 * in Hushwood.  Bridges the quarry and the settlement.
 */
const quarryIronHaul: TaskDefinition = {
  id: 'quarry_iron_haul',
  title: 'Iron for the Settlement',
  description:
    "Gorven needs five chunks of iron ore delivered to Bron the Blacksmith. Mine them from the quarry's iron veins and make the run south.",
  giverName: 'Gorven (Quarry Foreman)',
  objectives: [
    {
      id: 'mine_iron_ore_haul',
      description: 'Mine 5 Iron Ore',
      type: 'gather',
      targetId: 'iron_ore',
      required: 5,
    },
    {
      id: 'deliver_iron_to_bron',
      description: 'Deliver the iron to Bron (Blacksmith)',
      type: 'deliver',
      targetId: 'Bron (Blacksmith)',
      required: 1,
    },
  ],
  reward: {
    coins: 20,
    xp: [{ skill: 'mining', amount: 40 }],
    factionRep: [
      { factionId: 'quarry_union', amount: 25 },
      { factionId: 'hushwrights', amount: 10 },
    ],
  },
  journalEntry:
    "Gorven laid it out plainly: five chunks of iron ore, delivered to Bron at the smithy. The quarry iron veins run deep — the three seams at the back of the basin are the richest. After I've filled the order I should run them south before Bron runs short.",
  unlocksTaskIds: ['quarry_deep_seam'],
}

/**
 * "The Deep Seam" (Task 3 of 3)
 * Mine three duskiron ore from the deep seam and deliver them to Gorven.
 * Completing this task unlocks the quarry supply cache (gated door).
 */
const quarryDeepSeam: TaskDefinition = {
  id: 'quarry_deep_seam',
  title: 'The Deep Seam',
  description:
    "Gorven has a harder job: three chunks of duskiron ore from the seam at the back of the quarry. Bring them to him and he'll open the sealed supply cache.",
  giverName: 'Gorven (Quarry Foreman)',
  objectives: [
    {
      id: 'mine_duskiron_ore',
      description: 'Mine 3 Duskiron Ore',
      type: 'gather',
      targetId: 'duskiron_ore',
      required: 3,
    },
    {
      id: 'deliver_duskiron_to_gorven',
      description: 'Deliver the duskiron ore to Gorven (Quarry Foreman)',
      type: 'deliver',
      targetId: 'Gorven (Quarry Foreman)',
      required: 1,
    },
  ],
  reward: {
    coins: 30,
    items: [{ itemId: 'iron_bar', qty: 2 }],
    xp: [{ skill: 'mining', amount: 80 }],
    factionRep: [{ factionId: 'quarry_union', amount: 40 }],
  },
  journalEntry:
    "Gorven pointed toward the north wall — a darker band of rock that runs through the cliff face. Duskiron: harder than iron, takes a proper pick to chip. He said there's a supply cache sealed back in the alcove, stocked before the last crew left. Three chunks and it's mine to open. I'll need a good pick and patience.",
}

// ─── Phase 75 — Chain 2: Mist and Fen (Chapel ↔ Marrowfen) ──────────────────

/**
 * "The Fen Signal" (Task 1 of 3)
 * Nairn Dusk has detected a similarity between the chapel mist signature and
 * the gas vent activity in Marrowfen.  She asks the player to travel there
 * and observe the vents firsthand.
 */
const fenSignal: TaskDefinition = {
  id: 'fen_signal',
  title: 'The Fen Signal',
  description:
    "Nairn Dusk believes the gas vents in Marrowfen share an origin with the chapel's mist seep. She wants you to travel south into the fen and observe the vent activity.",
  giverName: 'Nairn Dusk (Ward-Adept)',
  objectives: [
    {
      id: 'explore_marrowfen_signal',
      description: 'Enter Marrowfen',
      type: 'explore',
      targetId: 'marrowfen',
      required: 1,
    },
  ],
  reward: {
    coins: 10,
    xp: [{ skill: 'warding', amount: 15 }],
    factionRep: [{ factionId: 'lantern_circle', amount: 15 }],
  },
  journalEntry:
    "Nairn stopped me before I left the chapel grounds. She's been cross-referencing the mist vent patterns and she says the gas readings from Marrowfen — the deep fen south of the Brackroot Bog — show the same thermal signature as the sealed shaft here. She wants eyes on those vents. I should head into the fen and come back with a description of what I find.",
  unlocksTaskIds: ['fen_samples'],
}

/**
 * "Fen Samples" (Task 2 of 3)
 * Gather three marrowfen_spore clusters from the fen floor and deliver them
 * to Nairn for her comparative analysis.
 */
const fenSamples: TaskDefinition = {
  id: 'fen_samples',
  title: 'Fen Samples',
  description:
    "Nairn needs three Marrowfen Spore clusters from the fen floor for her analysis. Forage them from the deep fen and return to the chapel.",
  giverName: 'Nairn Dusk (Ward-Adept)',
  objectives: [
    {
      id: 'gather_marrowfen_spore',
      description: 'Gather 3 Marrowfen Spore',
      type: 'gather',
      targetId: 'marrowfen_spore',
      required: 3,
    },
    {
      id: 'deliver_spore_to_nairn',
      description: 'Deliver the spore samples to Nairn Dusk (Ward-Adept)',
      type: 'deliver',
      targetId: 'Nairn Dusk (Ward-Adept)',
      required: 1,
    },
  ],
  reward: {
    coins: 15,
    xp: [{ skill: 'warding', amount: 35 }],
    factionRep: [{ factionId: 'lantern_circle', amount: 20 }],
  },
  journalEntry:
    "Nairn confirmed it after I described the vents — the pattern matches the Tidemark boundary almost exactly. She wants physical samples: the spore clusters that grow near the gas vent cracks are laden with the same mineral trace she found in the chapel mist. Three of them, brought back carefully. She said the fen floor near the cracks is the richest source.",
  unlocksTaskIds: ['fen_ward_work'],
}

/**
 * "Wards Against the Fen" (Task 3 of 3)
 * The fen creatures — bogfiend and mire_hound — have become more aggressive
 * near the vents.  Nairn asks the player to cull their numbers.  Completing
 * this task rewards a bog_filter_wrap and thornward_mark.
 */
const fenWardWork: TaskDefinition = {
  id: 'fen_ward_work',
  title: 'Wards Against the Fen',
  description:
    "The creatures near the Marrowfen vents have grown dangerous. Defeat two Bogfiends and two Mire Hounds, then return to Nairn.",
  giverName: 'Nairn Dusk (Ward-Adept)',
  objectives: [
    {
      id: 'kill_bogfiend',
      description: 'Defeat 2 Bogfiends',
      type: 'kill',
      targetId: 'bogfiend',
      required: 2,
    },
    {
      id: 'kill_mire_hound',
      description: 'Defeat 2 Mire Hounds',
      type: 'kill',
      targetId: 'mire_hound',
      required: 2,
    },
    {
      id: 'talk_to_nairn_ward',
      description: 'Return to Nairn Dusk (Ward-Adept)',
      type: 'talk',
      targetId: 'Nairn Dusk (Ward-Adept)',
      required: 1,
    },
  ],
  reward: {
    coins: 20,
    items: [
      { itemId: 'bog_filter_wrap', qty: 1 },
      { itemId: 'thornward_mark', qty: 1 },
    ],
    xp: [{ skill: 'warding', amount: 60 }],
    factionRep: [{ factionId: 'lantern_circle', amount: 35 }],
  },
  journalEntry:
    "Nairn said the bogfiends and mire hounds near the vent cracks are drawing energy from the same source as the mist — it's making them volatile and territorial. She needs the area thinned before she can establish a safe survey perimeter. She handed me a bog filter wrap as a precaution against the gas and told me to bring back a thornward mark once the creatures are dealt with — she knows a way to key it to the fen's ward pattern.",
}

// ─── Phase 75 — Chain 3: The Elder's Survey (Hushwood → all regions) ─────────

/**
 * "Survey the Reach" (Task 1 of 3)
 * Aldric has commissioned a formal survey of all frontier zones to understand
 * the Veil disturbances.  A talk objective to open the chain.
 */
const surveyReach: TaskDefinition = {
  id: 'survey_reach',
  title: 'Survey the Reach',
  description:
    "Aldric the Village Elder wants a full survey of the frontier zones — quarry, chapel, and fen. Speak with him to accept the commission.",
  giverName: 'Aldric (Village Elder)',
  objectives: [
    {
      id: 'talk_to_aldric_survey',
      description: 'Speak with Aldric (Village Elder)',
      type: 'talk',
      targetId: 'Aldric (Village Elder)',
      required: 1,
    },
  ],
  reward: {
    coins: 5,
    xp: [{ skill: 'wayfaring', amount: 10 }],
    factionRep: [{ factionId: 'underline_syndics', amount: 10 }],
  },
  journalEntry:
    "Aldric wants a formal survey done — reports from Redwake Quarry, Tidemark Chapel, and the deep fen to the south. He says the Veil disturbances are being reported from all three directions now and the settlement council needs hard evidence before they can act. He's offering decent pay for a thorough job.",
  unlocksTaskIds: ['survey_samples'],
}

/**
 * "Samples from the Frontier" (Task 2 of 3)
 * Gather one material from each of the three frontier regions:
 *   duskiron_ore from the quarry, marrowfen_spore from the fen,
 *   wisp_ember from the chapel.
 */
const surveySamples: TaskDefinition = {
  id: 'survey_samples',
  title: 'Samples from the Frontier',
  description:
    "Aldric needs physical evidence from each frontier zone: one Duskiron Ore (quarry), one Marrowfen Spore (fen), and one Wisp Ember (chapel).",
  giverName: 'Aldric (Village Elder)',
  objectives: [
    {
      id: 'gather_duskiron_survey',
      description: 'Gather 1 Duskiron Ore (Redwake Quarry)',
      type: 'gather',
      targetId: 'duskiron_ore',
      required: 1,
    },
    {
      id: 'gather_spore_survey',
      description: 'Gather 1 Marrowfen Spore (Marrowfen)',
      type: 'gather',
      targetId: 'marrowfen_spore',
      required: 1,
    },
    {
      id: 'gather_ember_survey',
      description: 'Gather 1 Wisp Ember (Tidemark Chapel)',
      type: 'gather',
      targetId: 'wisp_ember',
      required: 1,
    },
  ],
  reward: {
    coins: 20,
    xp: [{ skill: 'wayfaring', amount: 25 }],
    factionRep: [{ factionId: 'underline_syndics', amount: 20 }],
  },
  journalEntry:
    "Aldric specified what he wants: a sample from each zone that will let Sera and the other researchers verify conditions without travelling themselves. A duskiron ore chunk from the quarry deep seam, a marrowfen spore cluster from the fen vents, and a wisp ember fragment from the chapel shrine. Each one requires going into the thick of it. I'll need to cover ground.",
  unlocksTaskIds: ['survey_report'],
}

/**
 * "Full Report to the Elder" (Task 3 of 3)
 * Return the three samples to Aldric.  The largest reward in the chain —
 * a substantial wayfaring XP grant, waystone fragments, and coins.
 */
const surveyReport: TaskDefinition = {
  id: 'survey_report',
  title: 'Full Report to the Elder',
  description:
    "Return to Aldric (Village Elder) with all three frontier samples to complete the survey commission.",
  giverName: 'Aldric (Village Elder)',
  objectives: [
    {
      id: 'deliver_survey_to_aldric',
      description: 'Return to Aldric (Village Elder) with all samples',
      type: 'talk',
      targetId: 'Aldric (Village Elder)',
      required: 1,
    },
  ],
  reward: {
    coins: 45,
    items: [{ itemId: 'waystone_fragment', qty: 3 }],
    xp: [{ skill: 'wayfaring', amount: 100 }],
    factionRep: [{ factionId: 'underline_syndics', amount: 40 }],
  },
  journalEntry:
    "With all three samples in hand I should return to Aldric and let him draw his conclusions. The duskiron ore, the fen spore, and the wisp ember — between the three of them the settlement researchers should be able to map the Veil disturbances and figure out what's connecting the frontier zones. Aldric mentioned waystone fragments as part of the payment. Those will be useful.",
}

// ─── Phase 84 — Boss Task: The Vault-Heart ───────────────────────────────────

/**
 * "The Vault-Heart" — the capstone boss encounter task.
 *
 * Triggered when the player first opens the Sanctum Resonance Seal inside the
 * Belowglass Vaults.  The player must defeat the ancient guardian that holds
 * the innermost chamber.
 */
const theVaultHeart: TaskDefinition = {
  id: 'vault_heart',
  title: 'The Vault-Heart',
  description:
    'An ancient guardian — the Vault-Heart Warden — seals the innermost sanctum of the Belowglass Vaults. Destroy it.',
  giverName: 'Sanctum Resonance Seal',
  objectives: [
    {
      id: 'defeat_vault_heart_warden',
      description: 'Defeat the Vault-Heart Warden',
      type: 'kill',
      targetId: 'vault_heart_warden',
      required: 1,
    },
  ],
  reward: {
    coins: 150,
    items: [],
    xp: [
      { skill: 'wayfaring', amount: 60 },
      { skill: 'salvaging', amount: 40 },
    ],
    factionRep: [{ factionId: 'tidebound_keepers', amount: 50 }],
  },
  journalEntry:
    "The resonance seal inside the Belowglass Vaults finally yielded to my salvaging skill. Beyond it the Inner Sanctum stretches out — a vast chamber lit by deep vaultglass glow. At its centre, on a raised altar, something massive and ancient stirs. Nairn warned me that the Deep Hearts left guardians behind when their maintenance cycles broke down. This is one of them. I don't think I can slip past it.",
}

/** Complete list of all task definitions (Phase 37 + Phase 38 + Phase 64 + Phase 75 + Phase 84). */
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
  // Phase 75 — Chain 1: The Foreman's Contract (Hushwood ↔ Quarry)
  quarryWord,
  quarryIronHaul,
  quarryDeepSeam,
  // Phase 75 — Chain 2: Mist and Fen (Chapel ↔ Marrowfen)
  fenSignal,
  fenSamples,
  fenWardWork,
  // Phase 75 — Chain 3: The Elder's Survey (Hushwood → all regions)
  surveyReach,
  surveySamples,
  surveyReport,
  // Phase 84 — First Boss Encounter
  theVaultHeart,
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
