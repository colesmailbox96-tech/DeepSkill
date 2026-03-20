/**
 * Phase 37 — Task Store
 *
 * Manages the live state of the player's task journal:
 *   - active tasks currently in progress (acceptTask, updateObjective)
 *   - completed tasks with their final objective states (completeTask)
 *   - reward delivery (coins, items, skill XP) on completion
 *
 * Actions
 * ───────
 *  acceptTask(taskId)
 *      Starts tracking a registered task.  No-ops if the task is unknown,
 *      already active, or already completed.
 *
 *  updateObjective(taskId, objectiveId, increment)
 *      Advances the progress counter for one objective by `increment` units
 *      (capped at `required`).  Auto-completes the task when all objectives
 *      are satisfied.
 *
 *  completeTask(taskId)
 *      Moves the task to the completed list, fires reward callbacks, and
 *      pushes a success notification.  Calling this directly bypasses the
 *      objective check — useful for scripted completions (e.g. talk tasks).
 *
 * Selectors
 * ─────────
 *  isActive(taskId)        – true when the task is currently in progress
 *  isCompleted(taskId)     – true when the task has been finished
 *  getObjectiveProgress(taskId, objectiveId) – current counter value (0 if unknown)
 */

import { create } from 'zustand'
import { getTask } from '../engine/task'
import type { TaskDefinition } from '../engine/task'
import { useGameStore } from './useGameStore'
import { useNotifications } from './useNotifications'
import { getItem as _getItemDef } from '../data/items/itemRegistry'

// ─── Runtime record ──────────────────────────────────────────────────────────

/** Live progress snapshot for one task. */
export interface TaskRecord {
  /** The task id (matches TaskDefinition.id). */
  taskId: string
  /** Per-objective progress counters (keyed by TaskObjective.id). */
  progress: Record<string, number>
  /** Unix timestamp (ms) when the task was accepted. */
  acceptedAt: number
  /** Unix timestamp (ms) when the task was completed, or undefined if active. */
  completedAt?: number
}

// ─── Store interface ─────────────────────────────────────────────────────────

export interface TaskState {
  /** Tasks currently in progress, ordered by acceptance time. */
  active: TaskRecord[]
  /** Tasks that have been fully completed. */
  completed: TaskRecord[]

  /** Accept a task by id.  No-ops when unknown, active, or already completed. */
  acceptTask: (taskId: string) => void
  /**
   * Advance objective progress for an active task.
   * `increment` defaults to 1.  Progress is capped at the objective's
   * `required` value.  When all objectives are satisfied the task
   * auto-completes and rewards are granted.
   */
  updateObjective: (taskId: string, objectiveId: string, increment?: number) => void
  /**
   * Force-complete a task regardless of objective state.
   * Moves to completed list, grants rewards, fires notification.
   * No-ops when the task is not currently active.
   */
  completeTask: (taskId: string) => void

  /** True when the task is currently active. */
  isActive: (taskId: string) => boolean
  /** True when the task has been completed. */
  isCompleted: (taskId: string) => boolean
  /**
   * Returns the current progress value for an objective.
   * Returns 0 when the task or objective is not found.
   */
  getObjectiveProgress: (taskId: string, objectiveId: string) => number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Deliver all rewards for a completed task definition. */
function _grantRewards(def: TaskDefinition): void {
  const gameStore = useGameStore.getState()

  if (def.reward.coins && def.reward.coins > 0) {
    gameStore.addCoins(def.reward.coins)
  }

  if (def.reward.items) {
    const { inventory } = useGameStore.getState()
    const lostItems: string[] = []

    for (const reward of def.reward.items) {
      // addItem auto-resolves the display name from the item registry;
      // the `name` field here is a fallback in case the id is unregistered.
      const itemDef = _getItemDef(reward.itemId)
      const displayName = itemDef?.name ?? reward.itemId

      // Guard: addItem returns false when the inventory is full and the
      // item doesn't already stack. Check the return value so we can
      // notify the player if a reward item cannot be delivered.
      const existsInInventory = inventory.slots.some((s) => s.id === reward.itemId)
      const inventoryFull = inventory.slots.length >= inventory.maxSlots

      if (inventoryFull && !existsInInventory) {
        lostItems.push(displayName)
      } else {
        gameStore.addItem({
          id: reward.itemId,
          name: displayName,
          quantity: reward.qty,
        })
      }
    }

    if (lostItems.length > 0) {
      useNotifications.getState().push(
        `Inventory full — reward item(s) lost: ${lostItems.join(', ')}. Clear space before completing this task next time.`,
        'warning',
      )
    }
  }

  if (def.reward.xp) {
    for (const xpReward of def.reward.xp) {
      gameStore.grantSkillXp(xpReward.skill, xpReward.amount)
    }
  }
}

/** Return true when every objective in a task record has reached `required`. */
function _allObjectivesDone(record: TaskRecord, def: TaskDefinition): boolean {
  return def.objectives.every(
    (obj) => (record.progress[obj.id] ?? 0) >= obj.required,
  )
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useTaskStore = create<TaskState>((set, get) => ({
  active: [],
  completed: [],

  acceptTask: (taskId) => {
    const def = getTask(taskId)
    if (!def) return

    const { active, completed } = get()
    if (active.some((r) => r.taskId === taskId)) return
    if (completed.some((r) => r.taskId === taskId)) return

    // Initialise all objective counters at 0.
    const progress: Record<string, number> = {}
    for (const obj of def.objectives) {
      progress[obj.id] = 0
    }

    const record: TaskRecord = {
      taskId,
      progress,
      acceptedAt: Date.now(),
    }

    set((s) => ({ active: [...s.active, record] }))
    useNotifications.getState().push(`Task accepted: ${def.title}`, 'info')
  },

  updateObjective: (taskId, objectiveId, increment = 1) => {
    const safeIncrement = Number(increment)
    if (!Number.isFinite(safeIncrement) || safeIncrement <= 0) return

    const def = getTask(taskId)
    if (!def) return

    const { active } = get()
    const recordIndex = active.findIndex((r) => r.taskId === taskId)
    if (recordIndex === -1) return

    const record = active[recordIndex]
    const obj = def.objectives.find((o) => o.id === objectiveId)
    if (!obj) return

    const current = record.progress[objectiveId] ?? 0
    const updated = Math.max(0, Math.min(current + safeIncrement, obj.required))

    if (updated === current) return // already at cap or no effective change

    const updatedRecord: TaskRecord = {
      ...record,
      progress: { ...record.progress, [objectiveId]: updated },
    }

    const updatedActive = [
      ...active.slice(0, recordIndex),
      updatedRecord,
      ...active.slice(recordIndex + 1),
    ]

    set({ active: updatedActive })

    // Auto-complete when all objectives are now satisfied.
    if (_allObjectivesDone(updatedRecord, def)) {
      get().completeTask(taskId)
    }
  },

  completeTask: (taskId) => {
    const def = getTask(taskId)
    if (!def) return

    const { active } = get()
    const record = active.find((r) => r.taskId === taskId)
    if (!record) return

    const completedRecord: TaskRecord = {
      ...record,
      completedAt: Date.now(),
    }

    set((s) => ({
      active: s.active.filter((r) => r.taskId !== taskId),
      completed: [...s.completed, completedRecord],
    }))

    _grantRewards(def)
    useNotifications.getState().push(`Task complete: ${def.title}`, 'success')
  },

  isActive: (taskId) => get().active.some((r) => r.taskId === taskId),

  isCompleted: (taskId) => get().completed.some((r) => r.taskId === taskId),

  getObjectiveProgress: (taskId, objectiveId) => {
    const { active, completed } = get()
    const record =
      active.find((r) => r.taskId === taskId) ??
      completed.find((r) => r.taskId === taskId)
    return record?.progress[objectiveId] ?? 0
  },
}))
