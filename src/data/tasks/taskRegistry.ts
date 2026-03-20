/**
 * Phase 37 — Task Registry
 *
 * Registers all task definitions in the engine registry and exports a
 * convenience initialiser that App.tsx calls once at startup.
 *
 * Phase 37 ships with two introductory tasks ("Word from the Elder" and
 * "Warm Runoff") that together demonstrate the full framework pipeline:
 *   - task acceptance (auto-accepted at game start)
 *   - objective tracking (talk-type and explore-type objectives)
 *   - reward delivery (coins, items, and skill XP)
 *   - journal entry bodies
 *
 * Phase 38 will add the first practical task set (gather / kill / deliver).
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

/** Complete list of Phase 37 task definitions. */
export const ALL_TASKS: TaskDefinition[] = [wordFromTheElder, warmRunoff]

// ─── Initialiser ─────────────────────────────────────────────────────────────

/**
 * Register all task definitions into the engine registry.
 * Call once at application startup (e.g. in App.tsx) before any store
 * operations that reference task ids.
 */
export function registerAllTasks(): void {
  registerTasks(ALL_TASKS)
}
