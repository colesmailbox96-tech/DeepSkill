/**
 * Phase 25 — Storage / Ledger Hall System
 *
 * Defines the Ledger Hall storage constants.
 * The Ledger Hall is a personal storage facility located inside the
 * Hushwood Storage Shed.  Players can deposit items from their inventory
 * and withdraw them later.  Storage persists as long as the game session
 * is open (Zustand store — useLedgerStore).
 *
 * Capacity is intentionally larger than the player's carry-limit so that
 * the storage hall feels meaningful and worth using.
 */

/** Maximum number of unique item stacks the Ledger Hall can hold. */
export const LEDGER_HALL_CAPACITY = 50

/** Label shown in the panel header. */
export const LEDGER_HALL_NAME = 'Ledger Hall'

/** Sub-label shown under the title. */
export const LEDGER_HALL_SUBTITLE = 'Personal Storage'
