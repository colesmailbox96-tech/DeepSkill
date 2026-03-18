/**
 * Phase 25 — Storage / Ledger Hall System
 *
 * Zustand slice that manages the Ledger Hall personal storage.
 * Keeps its own `slots` array entirely separate from the player's inventory.
 *
 * Deposit  — moves one or more of an item stack from inventory into storage.
 * Withdraw — moves one or more of a stored stack back into inventory.
 * Sort     — re-orders storage slots alphabetically by item name.
 *
 * The store intentionally does NOT import useGameStore directly — all
 * inventory mutations are delegated to the caller (LedgerPanel) so that the
 * data-flow stays explicit and the two stores remain decoupled.
 */

import { create } from 'zustand'
import { LEDGER_HALL_CAPACITY } from '../engine/storage'

// ── Types ─────────────────────────────────────────────────────────────────────

/** A single stack held in the Ledger Hall. */
export interface StorageItem {
  id: string
  name: string
  quantity: number
}

// ── Store ─────────────────────────────────────────────────────────────────────

export interface LedgerState {
  /** Whether the Ledger Hall panel is currently open. */
  isOpen: boolean
  /** Stored item stacks. */
  slots: StorageItem[]

  openLedger: () => void
  closeLedger: () => void
  toggleLedger: () => void

  /**
   * Deposit `quantity` of `item` into the Ledger Hall.
   * Returns true when the deposit succeeds.
   * Returns false when `quantity` floors to 0 or below, or when a new slot
   * is needed but the hall has reached capacity.
   */
  depositItem: (id: string, name: string, quantity: number) => boolean

  /**
   * Withdraw up to `quantity` of item `id` from the Ledger Hall.
   * Returns the actual quantity withdrawn, which may be less than `quantity`
   * when the stored stack is smaller.
   * Returns 0 if the item is not present or `quantity` floors to 0 or below.
   */
  withdrawItem: (id: string, quantity: number) => number

  /** Sort stored stacks alphabetically by name (case-insensitive). */
  sortStorage: () => void
}

export const useLedgerStore = create<LedgerState>((set, get) => ({
  isOpen: false,
  slots: [],

  openLedger:   () => set({ isOpen: true }),
  closeLedger:  () => set({ isOpen: false }),
  toggleLedger: () => set((s) => ({ isOpen: !s.isOpen })),

  depositItem: (id, name, quantity) => {
    const qty = Math.floor(quantity)
    if (qty <= 0) return false

    const { slots } = get()
    const existing = slots.find((s) => s.id === id)

    if (existing) {
      // Stack exists — just increase quantity; no capacity concern.
      set({
        slots: slots.map((s) =>
          s.id === id ? { ...s, quantity: s.quantity + qty } : s,
        ),
      })
      return true
    }

    // New stack — check capacity.
    if (slots.length >= LEDGER_HALL_CAPACITY) return false

    set({ slots: [...slots, { id, name, quantity: qty }] })
    return true
  },

  withdrawItem: (id, quantity) => {
    const qty = Math.floor(quantity)
    if (qty <= 0) return 0

    const { slots } = get()
    const existing = slots.find((s) => s.id === id)
    if (!existing) return 0

    const actual = Math.min(qty, existing.quantity)
    const updated = slots
      .map((s) => (s.id === id ? { ...s, quantity: s.quantity - actual } : s))
      .filter((s) => s.quantity > 0)

    set({ slots: updated })
    return actual
  },

  sortStorage: () =>
    set((s) => ({
      slots: [...s.slots].sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
      ),
    })),
}))
