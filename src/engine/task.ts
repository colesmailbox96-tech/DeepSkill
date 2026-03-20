/**
 * Phase 37 — Task / Quest Framework
 *
 * Provides the data model for work-order style tasks and a simple registry
 * for looking up task definitions by id.
 *
 * Data model
 * ──────────
 *  TaskObjective   – a single measurable goal within a task.
 *                    Tracks a required quantity and optional targetId so
 *                    objective progress can be advanced by game-loop events.
 *  TaskReward      – coins, items, and/or skill XP granted on completion.
 *  TaskDefinition  – the immutable specification of a task: title, description,
 *                    giver NPC, ordered objectives, reward, and a journal entry
 *                    body (narrative flavour text).
 *
 * Objective types
 * ───────────────
 *  'gather'  – collect N of a specified item (itemId).
 *  'kill'    – defeat N of a specified creature (creatureId).
 *  'deliver' – hand gathered items to a specified NPC (npcName); items consumed
 *              are inferred from companion 'gather' objectives on the same task.
 *  'explore' – reach a specified zone or landmark (zoneId).
 *  'talk'    – open dialogue with a specified NPC (npcName).
 *
 * The store (useTaskStore) owns objective progress values; TaskDefinition
 * carries only the static required quantities.
 */

// ─── Objective ────────────────────────────────────────────────────────────────

/** Semantic classification of what a player must do to advance an objective. */
export type ObjectiveType = 'gather' | 'kill' | 'deliver' | 'explore' | 'talk'

/** One measurable goal that must be fulfilled to complete its parent task. */
export interface TaskObjective {
  /** Unique key within the owning TaskDefinition. */
  id: string
  /** Short sentence shown to the player (e.g. "Speak with Aldric the Elder"). */
  description: string
  /** Semantic category — used by game systems to route progress updates. */
  type: ObjectiveType
  /**
   * The entity this objective relates to.
   * Semantics depend on type:
   *   gather  → ItemDefinition.id
   *   kill    → Creature def.id
   *   explore → zone id / landmark label
   *   talk    → NPC display name (matches DialogueTree.npcName)
   *   deliver → NPC display name to hand items to; the items consumed are
   *             inferred from companion 'gather' objectives on the same task.
   */
  targetId?: string
  /** How many units are needed to fulfil this objective (default 1). */
  required: number
}

// ─── Reward ───────────────────────────────────────────────────────────────────

/** One item stack awarded on completion. */
export interface TaskItemReward {
  /** ItemDefinition.id of the awarded item. */
  itemId: string
  /** Number of items awarded (≥ 1). */
  qty: number
}

/** Skill XP awarded on completion. */
export interface TaskXpReward {
  /** Skill id (matches Skill.id in skillSchema, e.g. "wayfaring"). */
  skill: string
  /** Amount of XP to grant. */
  amount: number
}

/** Everything the player receives when all objectives are fulfilled. */
export interface TaskReward {
  /** Marks (⬡) added to the player's coin balance. */
  coins?: number
  /** Item stacks added to the player's inventory. */
  items?: TaskItemReward[]
  /** Skill XP grants. */
  xp?: TaskXpReward[]
}

// ─── Definition ──────────────────────────────────────────────────────────────

/** The complete immutable specification of one task. */
export interface TaskDefinition {
  /** Unique identifier used as the lookup key in the registry. */
  id: string
  /** Short display title (e.g. "Word from the Elder"). */
  title: string
  /** Brief description of the task context shown in the tracker. */
  description: string
  /** Display name of the NPC who assigns the task. */
  giverName: string
  /** Ordered list of objectives; all must reach `required` to complete. */
  objectives: TaskObjective[]
  /** Rewards granted when the task is completed. */
  reward: TaskReward
  /**
   * Narrative journal entry written by the task giver.
   * Used by the journal UI (Phase 39) and stored alongside the task record
   * for immersive context.
   */
  journalEntry: string
}

// ─── Registry ─────────────────────────────────────────────────────────────────

const _registry = new Map<string, TaskDefinition>()

/**
 * Register a task definition.  The task `id` is the lookup key and must be
 * unique across all registered tasks.
 */
export function registerTask(def: TaskDefinition): void {
  _registry.set(def.id, def)
}

/**
 * Register multiple task definitions in one call.
 */
export function registerTasks(defs: TaskDefinition[]): void {
  for (const def of defs) {
    _registry.set(def.id, def)
  }
}

/**
 * Retrieve a task definition by id.
 * Returns `undefined` if no task has been registered with that id.
 */
export function getTask(taskId: string): TaskDefinition | undefined {
  return _registry.get(taskId)
}

/**
 * Returns an array of all registered task definitions.
 * Useful for listing available tasks in a board or journal UI.
 */
export function getAllTasks(): TaskDefinition[] {
  return Array.from(_registry.values())
}
