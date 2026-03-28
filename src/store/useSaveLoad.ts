/**
 * Stabilization Pass A — Sub-phase A14: Save / load / session resilience.
 *
 * Persists a minimal save snapshot to localStorage so that mobile users can
 * leave the app and return without losing progress.
 *
 * Saved fields: playerStats, inventory, skills, equipment, settings, and
 * vendor stock counts (so finite-supply items stay depleted across sessions).
 * Items marked resetEachSession in their VendorItem definition are excluded
 * from the restored stock and reset to their initial supply on every load.
 * Phase 86 — task state (active + completed records) is now also saved so
 * staged quest progression persists across sessions.
 * Phase 90 — save schema versioning + step-by-step migration runner +
 * corruption recovery with backup fallback + player notifications.
 * Phase 102 — save schema v3: adds openedGates array so unlocked doors
 * persist across save/load cycles (gated_door_save_state feature).
 * Large/transient state (NPC positions, combat, active sessions) is
 * intentionally excluded — it is rebuilt from defaults on each load.
 */
import { useCallback } from 'react'
import { useGameStore } from './useGameStore'
import { useShopStore } from './useShopStore'
import { useFactionStore } from './useFactionStore'
import { useTaskStore } from './useTaskStore'
import { useOpenedGatesStore } from './useOpenedGatesStore'
import { useNotifications } from './useNotifications'
import type { TaskRecord } from './useTaskStore'
import { getAllVendorDefs } from '../engine/shop'
import { getTask } from '../engine/task'
import type { PlayerStats, InventoryState, EquipmentState, Settings } from './useGameStore'
import type { SkillsState } from './useGameStore'

/** Current save schema version. Increment whenever the snapshot shape changes. */
const SAVE_VERSION = 3

/** Primary localStorage key — name kept from Phase 50 so existing saves survive. */
const SAVE_KEY = 'veilmarch_save_v1'

/**
 * Secondary key — written on every successful save so a corrupt primary can
 * be recovered from the last-known-good snapshot.
 */
const BACKUP_KEY = 'veilmarch_save_backup'

interface SaveSnapshot {
  version: number
  playerStats: PlayerStats
  inventory: InventoryState
  skills: SkillsState
  equipment: EquipmentState
  settings: Settings
  /** Remaining stock counts for finite-supply vendor items. Optional for
   *  backward compatibility with saves created before Phase 55. */
  vendorStocks?: Record<string, Record<string, number>>
  /** Phase 76 — faction reputation values. Optional for backward compatibility. */
  factionRep?: Record<string, number>
  /**
   * Phase 86 — task journal state.  Optional for backward compatibility with
   * saves created before Phase 86.  Storing this prevents the task list from
   * resetting to only the intro task every time the player continues a game.
   */
  taskState?: {
    active: TaskRecord[]
    completed: TaskRecord[]
  }
  /**
   * Phase 102 — opened gate IDs.  Optional for backward compatibility with
   * saves created before Phase 102.  Stores the set of gated doors the player
   * has permanently unlocked so they remain open after a save/load cycle.
   */
  openedGates?: string[]
}

// ── Save migrations ───────────────────────────────────────────────────────────

type MigrateFn = (raw: Record<string, unknown>) => Record<string, unknown>

/**
 * V1 → V2: no structural changes to the snapshot; this migration exists to
 * establish the migration infrastructure.  Future phases add transforms here.
 */
function migrateV1(raw: Record<string, unknown>): Record<string, unknown> {
  return { ...raw, version: 2 }
}

/**
 * V2 → V3 (Phase 102): add the openedGates field as an empty array.
 * Existing saves from sessions where the player opened gates will start
 * with an empty set (doors will be re-sealed once), but from this point
 * forward gate state persists across save/load cycles.
 */
function migrateV2(raw: Record<string, unknown>): Record<string, unknown> {
  return { ...raw, version: 3, openedGates: [] }
}

/**
 * Step-by-step migration table.
 * Key = source version, value = function that upgrades it to key+1.
 */
const MIGRATION_TABLE: Record<number, MigrateFn> = {
  1: migrateV1,
  2: migrateV2,
}

/**
 * Given a raw parsed value (unknown version), repeatedly apply migration
 * functions until the version matches SAVE_VERSION.
 *
 * Returns the migrated snapshot, or null when:
 *  - the input is not a plain object
 *  - the version field is missing / non-numeric
 *  - no migration path exists from the detected version
 */
function applySaveMigrations(raw: unknown): SaveSnapshot | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  let obj = raw as Record<string, unknown>

  if (typeof obj.version !== 'number' || !Number.isFinite(obj.version)) return null

  let version = obj.version as number

  // A save written by a future build — accept without migration (fields we
  // don't know about are silently ignored during hydration).
  if (version > SAVE_VERSION) {
    console.warn(`[Save] loading future-version save (v${version}); some features may behave unexpectedly.`)
    return obj as unknown as SaveSnapshot
  }

  while (version < SAVE_VERSION) {
    const migrate = MIGRATION_TABLE[version]
    if (!migrate) {
      console.warn(`[Save] no migration path from v${version} — save is too old to recover.`)
      return null
    }
    obj = migrate(obj)
    const nextVersion = obj.version
    // Guard: every migration must advance the version; a bad implementation
    // that leaves version unchanged would cause an infinite loop.
    if (typeof nextVersion !== 'number' || !Number.isFinite(nextVersion) || nextVersion <= version) {
      console.warn(`[Save] migration from v${version} did not advance version — aborting.`)
      return null
    }
    version = nextVersion
  }

  return obj as unknown as SaveSnapshot
}

/** Runtime guard: verify that `v` is a finite, non-NaN number. */
function isValidNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

/** Serialise the relevant slice of game state to localStorage. */
export function useSaveGame(): () => boolean {
  return useCallback((): boolean => {
    try {
      const { playerStats, inventory, skills, equipment, settings } =
        useGameStore.getState()
      const { vendorStocks } = useShopStore.getState()
      const { rep: factionRep } = useFactionStore.getState()
      const { active: taskActive, completed: taskCompleted } = useTaskStore.getState()
      const openedGates = [...useOpenedGatesStore.getState().openedGates]
      const snapshot: SaveSnapshot = {
        version: SAVE_VERSION,
        playerStats,
        inventory,
        skills,
        equipment,
        settings,
        vendorStocks,
        factionRep,
        taskState: { active: taskActive, completed: taskCompleted },
        openedGates,
      }
      const json = JSON.stringify(snapshot)
      localStorage.setItem(SAVE_KEY, json)
      // Keep a backup copy so corruption of the primary can be recovered.
      try { localStorage.setItem(BACKUP_KEY, json) } catch { /* quota edge-case */ }
      return true
    } catch (err) {
      // localStorage can throw in private-browsing modes or when the quota is full.
      console.warn('[Save] failed to persist game state:', err)
      return false
    }
  }, [])
}

/**
 * Read a saved snapshot from localStorage and hydrate the store.
 *
 * Load order:
 *  1. Try the primary save key; run migrations to bring it to SAVE_VERSION.
 *  2. If the primary is absent, corrupt, or unmigrateable, try the backup key.
 *  3. If both fail, start from defaults and notify the player.
 *
 * Corruption is always surfaced via a toast notification instead of a silent
 * no-op so the player knows their save was affected.
 */
export function useLoadGame(): () => void {
  return useCallback(() => {
    /** Attempt to read, parse, and migrate a snapshot from `storageKey`.
     *  Returns the migrated snapshot and a flag indicating if migrations ran,
     *  or null on any failure. */
    function tryRead(storageKey: string): { snapshot: SaveSnapshot; wasMigrated: boolean } | null {
      try {
        const raw = localStorage.getItem(storageKey)
        if (!raw) return null
        const parsed: unknown = JSON.parse(raw)
        const originalVersion =
          parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>).version
            : undefined
        const snapshot = applySaveMigrations(parsed)
        if (!snapshot) return null
        const wasMigrated =
          typeof originalVersion === 'number' &&
          originalVersion < SAVE_VERSION &&
          snapshot.version === SAVE_VERSION
        return { snapshot, wasMigrated }
      } catch {
        return null
      }
    }

    const notify = useNotifications.getState().push

    let snapshot: SaveSnapshot | null = null
    let usedBackup = false
    let migrated = false

    const primaryResult = tryRead(SAVE_KEY)
    if (primaryResult !== null) {
      snapshot = primaryResult.snapshot
      migrated = primaryResult.wasMigrated
    } else {
      // Primary missing or unreadable — try backup.
      const backupResult = tryRead(BACKUP_KEY)
      if (backupResult !== null) {
        snapshot = backupResult.snapshot
        usedBackup = true
        migrated = backupResult.wasMigrated
      }
    }

    if (snapshot === null) {
      // Both primary and backup are absent or corrupt; check whether data
      // existed at all (vs. a genuine first-run with no save).
      let hadData = false
      try {
        hadData =
          localStorage.getItem(SAVE_KEY) !== null ||
          localStorage.getItem(BACKUP_KEY) !== null
      } catch {
        hadData = false
      }
      if (hadData) {
        notify('⚠ Save data could not be loaded — starting fresh.', 'warning')
        console.warn('[Load] both primary and backup saves are unreadable.')
      }
      return
    }

    if (usedBackup) {
      notify('⚠ Save was corrupted — restored from last backup.', 'warning')
      console.warn('[Load] primary save corrupted; recovered from backup.')
    } else if (migrated) {
      notify('ℹ Save data updated to current format.', 'info')
    }

    // ── Hydrate store from validated snapshot ──────────────────────────────

    try {
      const store = useGameStore.getState()

      // Restore full playerStats with field-level validation so a corrupt
      // or partial save cannot introduce NaN or wrong-type values into the
      // store.  Each field falls back to the current store value when
      // invalid so partial saves still apply the valid subset.
      if (snapshot.playerStats) {
        const sp = snapshot.playerStats
        const current = store.playerStats
        useGameStore.setState({
          playerStats: {
            name: typeof sp.name === 'string' && sp.name.trim() !== '' ? sp.name : current.name,
            level: isValidNumber(sp.level) ? sp.level : current.level,
            experience: isValidNumber(sp.experience) ? sp.experience : current.experience,
            experienceToNextLevel: isValidNumber(sp.experienceToNextLevel) ? sp.experienceToNextLevel : current.experienceToNextLevel,
            health: isValidNumber(sp.health) ? sp.health : current.health,
            maxHealth: isValidNumber(sp.maxHealth) ? sp.maxHealth : current.maxHealth,
            stamina: isValidNumber(sp.stamina) ? sp.stamina : current.stamina,
            maxStamina: isValidNumber(sp.maxStamina) ? sp.maxStamina : current.maxStamina,
            coins: isValidNumber(sp.coins) ? sp.coins : current.coins,
          },
        })
      }

      if (snapshot.inventory?.slots) {
        // Re-add every saved item so the normal stacking / capacity logic
        // runs correctly rather than replacing the slot array wholesale.
        // Snapshot the current slots first — removeItem mutates the store
        // array so we need a stable copy to iterate over.
        const currentSlots = useGameStore.getState().inventory.slots.slice()
        for (const slot of currentSlots) {
          store.removeItem(slot.id, slot.quantity)
        }
        for (const item of snapshot.inventory.slots) {
          store.addItem(item)
        }
      }

      if (snapshot.skills?.skills) {
        // Replace the entire skills slice so level / experience /
        // experienceToNextLevel all stay in sync with the saved state.
        useGameStore.setState({ skills: snapshot.skills })
      }

      if (snapshot.equipment) {
        for (const [, item] of Object.entries(snapshot.equipment)) {
          if (item) store.equipItem(item.id)
        }
      }

      if (snapshot.settings) {
        store.updateSettings(snapshot.settings)
      }

      // Restore vendor stock counts if present (Phase 55+).
      // Absent in saves from before Phase 55; the store will use its defaults.
      // Phase 85 — items with resetEachSession: true are stripped from the
      // saved snapshot so they reset to their initial stock on every load
      // (e.g. camp_rations replenishes to 20 each session).
      if (snapshot.vendorStocks && typeof snapshot.vendorStocks === 'object') {
        // Build the set of session-resetting items so we can exclude them.
        const sessionResetKeys = new Set<string>()
        for (const vendor of getAllVendorDefs()) {
          for (const item of vendor.stock) {
            if (item.resetEachSession) {
              sessionResetKeys.add(`${vendor.id}::${item.id}`)
            }
          }
        }
        // Clone the saved stocks, removing any session-reset entries so they
        // fall back to the defaults provided by buildDefaultVendorStocks().
        const filteredStocks: Record<string, Record<string, number>> = {}
        for (const [vendorId, itemMap] of Object.entries(snapshot.vendorStocks)) {
          const filteredItems: Record<string, number> = {}
          for (const [itemId, qty] of Object.entries(itemMap)) {
            if (!sessionResetKeys.has(`${vendorId}::${itemId}`)) {
              filteredItems[itemId] = qty
            }
          }
          if (Object.keys(filteredItems).length > 0) {
            filteredStocks[vendorId] = filteredItems
          }
        }
        useShopStore.getState().setVendorStocks(filteredStocks)
      }

      // Phase 76 — restore faction rep if present.
      // Absent in saves from before Phase 76; the store will use its defaults.
      // Only restore rep for faction ids that exist in the registry; this
      // prevents a crafted or corrupt save from injecting arbitrary keys into
      // the runtime rep map.
      if (snapshot.factionRep && typeof snapshot.factionRep === 'object') {
        const knownRep = useFactionStore.getState().rep
        const validatedRep: Record<string, number> = {}
        for (const [factionId, amount] of Object.entries(snapshot.factionRep)) {
          // Allow 0 here (exact restore semantics); gainRep rejects <= 0
          // because it is an incremental add, not a restoration.
          if (
            factionId in knownRep &&
            typeof amount === 'number' &&
            Number.isFinite(amount) &&
            amount >= 0
          ) {
            validatedRep[factionId] = Math.floor(amount)
          }
        }
        if (Object.keys(validatedRep).length > 0) {
          useFactionStore.setState((s) => ({
            rep: { ...s.rep, ...validatedRep },
          }))
        }
      }

      // Phase 86 — restore task journal state if present.
      // Absent in saves from before Phase 86; the game will start with the
      // default intro task and chain progression from there.
      // We set task state directly (without re-granting rewards) so that
      // completed-task rewards are not awarded a second time on load.
      if (snapshot.taskState && typeof snapshot.taskState === 'object') {
        const { active, completed } = snapshot.taskState
        if (Array.isArray(active) && Array.isArray(completed)) {
          const validateRecord = (raw: unknown): TaskRecord | null => {
            if (!raw || typeof raw !== 'object') return null
            const r = raw as Record<string, unknown>

            // taskId must be a non-empty string that maps to a registered task.
            if (typeof r.taskId !== 'string' || !r.taskId) return null
            const def = getTask(r.taskId)
            if (!def) return null

            // progress must be a plain object; each value must be a finite number.
            if (!r.progress || typeof r.progress !== 'object' || Array.isArray(r.progress)) return null
            const rawProgress = r.progress as Record<string, unknown>
            const validatedProgress: Record<string, number> = {}
            for (const [key, val] of Object.entries(rawProgress)) {
              if (typeof val === 'number' && Number.isFinite(val)) {
                // Cap the value at the objective's required amount so a crafted
                // save cannot mark objectives complete beyond their limit.
                const obj = def.objectives.find((o) => o.id === key)
                validatedProgress[key] = obj
                  ? Math.max(0, Math.min(Math.floor(val), obj.required))
                  : Math.max(0, Math.floor(val))
              } else {
                validatedProgress[key] = 0
              }
            }

            // acceptedAt must be a finite number (Unix ms timestamp).
            if (typeof r.acceptedAt !== 'number' || !Number.isFinite(r.acceptedAt)) return null

            // completedAt is optional but must be a finite number when present.
            const completedAt =
              r.completedAt !== undefined
                ? typeof r.completedAt === 'number' && Number.isFinite(r.completedAt)
                  ? r.completedAt
                  : null
                : undefined
            if (completedAt === null) return null

            const record: TaskRecord = {
              taskId: r.taskId,
              progress: validatedProgress,
              acceptedAt: r.acceptedAt,
              ...(completedAt !== undefined ? { completedAt } : {}),
            }
            return record
          }

          const validActive = active.map(validateRecord).filter((r): r is TaskRecord => r !== null)
          const validCompleted = completed.map(validateRecord).filter((r): r is TaskRecord => r !== null)
          useTaskStore.setState({ active: validActive, completed: validCompleted })
        }
      }

      // Phase 102 — restore opened gate IDs if present.
      // Absent in saves from before Phase 102; the store starts with an empty
      // set (all doors sealed) which is the correct default for older saves.
      // Each ID is validated as a non-empty string before being added to the
      // set to prevent crafted saves from injecting arbitrary values.
      if (Array.isArray(snapshot.openedGates)) {
        const validIds = snapshot.openedGates.filter(
          (id): id is string => typeof id === 'string' && id.length > 0,
        )
        useOpenedGatesStore.getState().setOpenedGates(new Set(validIds))
      }
    } catch (err) {
      notify('⚠ An error occurred while loading — some progress may be lost.', 'warning')
      console.warn('[Load] failed to hydrate game state:', err)
    }
  }, [])
}

/** Returns true if a save snapshot exists in localStorage (primary or backup). */
export function hasSaveData(): boolean {
  try {
    return (
      localStorage.getItem(SAVE_KEY) !== null ||
      localStorage.getItem(BACKUP_KEY) !== null
    )
  } catch {
    return false
  }
}

/** Erase the persisted save snapshot (both primary and backup). */
export function clearSaveData(): void {
  try {
    localStorage.removeItem(SAVE_KEY)
    localStorage.removeItem(BACKUP_KEY)
  } catch {
    /* no-op in restricted environments */
  }
}
