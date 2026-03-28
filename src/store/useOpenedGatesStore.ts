import { create } from 'zustand'

/**
 * Phase 102 — Opened Gates Store
 *
 * Tracks the set of gated doors/passages that the player has permanently
 * unlocked during their playthrough.  Each gate is identified by a stable
 * string ID that corresponds to a physical door or gate mesh in the world.
 *
 * Gate IDs
 * ────────
 *  'hollow_vault_gate'         — Main Hollow Vault entrance slab (ward-sealed).
 *  'hollow_vault_inner_sanctum' — Iron sanctum door inside the Hollow Vault.
 *  'quarry_supply_cache'       — Supply cache door in Redwake Quarry.
 *  'belowglass_gate'           — Belowglass Vaults entrance gate slab.
 *  'belowglass_sanctum'        — Inner boss-chamber gate in Belowglass Vaults.
 *
 * Persistence
 * ───────────
 * useSaveLoad reads this store when building the save snapshot and writes
 * back to it after a successful load.  The save schema version was bumped
 * to 3 (Phase 102) to carry the openedGates array.
 */

interface OpenedGatesState {
  /** Set of gate IDs that have been permanently opened. */
  openedGates: ReadonlySet<string>

  /** Record a gate as permanently opened.  Idempotent. */
  addOpened: (id: string) => void

  /** Return true if the gate with the given ID was previously opened. */
  wasOpened: (id: string) => boolean

  /** Replace the full set — used by the save/load system on restore. */
  setOpenedGates: (gates: Set<string>) => void

  /** Clear all opened gates — called on New Game. */
  reset: () => void
}

export const useOpenedGatesStore = create<OpenedGatesState>((set, get) => ({
  openedGates: new Set<string>(),

  addOpened: (id) =>
    set((s) => {
      if (s.openedGates.has(id)) return s
      const next = new Set(s.openedGates)
      next.add(id)
      return { openedGates: next }
    }),

  wasOpened: (id) => get().openedGates.has(id),

  setOpenedGates: (gates) => set({ openedGates: gates }),

  reset: () => set({ openedGates: new Set<string>() }),
}))
