/**
 * Phase 25 — Storage / Ledger Hall System
 *
 * Two-tab panel (Deposit / Withdraw) opened by interacting with the
 * Hushwood Storage Shed.
 * Close via the ✕ button, pressing Escape, or pressing L again.
 *
 * Deposit tab  — shows the player's inventory with "Deposit" buttons.
 * Withdraw tab — shows stored items with "Withdraw" buttons.
 *
 * A Sort button in the header re-orders the storage alphabetically.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { useLedgerStore } from '../../store/useLedgerStore'
import { useNotifications } from '../../store/useNotifications'
import { getItem } from '../../data/items/itemRegistry'
import { LEDGER_HALL_CAPACITY, LEDGER_HALL_NAME } from '../../engine/storage'

type LedgerTab = 'deposit' | 'withdraw'

export function LedgerPanel() {
  const isOpen      = useLedgerStore((s) => s.isOpen)
  const closeLedger = useLedgerStore((s) => s.closeLedger)
  const storedSlots = useLedgerStore((s) => s.slots)
  const depositItem = useLedgerStore((s) => s.depositItem)
  const withdrawItem = useLedgerStore((s) => s.withdrawItem)
  const sortStorage = useLedgerStore((s) => s.sortStorage)

  const invSlots  = useGameStore((s) => s.inventory.slots)
  const maxSlots  = useGameStore((s) => s.inventory.maxSlots)
  const addItem   = useGameStore((s) => s.addItem)
  const removeItem = useGameStore((s) => s.removeItem)

  const [tab, setTab] = useState<LedgerTab>('deposit')

  const isOpenRef = useRef(false)
  isOpenRef.current = isOpen
  const panelRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => {
    closeLedger()
  }, [closeLedger])

  // L toggles; Escape closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'Escape' && isOpenRef.current) {
        handleClose()
      } else if (e.code === 'KeyL') {
        if (isOpenRef.current) {
          handleClose()
        } else {
          useLedgerStore.getState().openLedger()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  // Focus panel on open.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  // ── Deposit handler ───────────────────────────────────────────────────────

  const handleDeposit = (itemId: string) => {
    const slot = invSlots.find((s) => s.id === itemId)
    if (!slot || slot.quantity <= 0) return

    const deposited = depositItem(slot.id, slot.name, 1)
    if (!deposited) {
      useNotifications.getState().push('Ledger Hall is full.', 'info')
      return
    }
    removeItem(itemId, 1)
    useNotifications.getState().push(`Deposited ${slot.name}.`, 'success')
  }

  // ── Withdraw handler ──────────────────────────────────────────────────────

  const handleWithdraw = (itemId: string) => {
    const stored = storedSlots.find((s) => s.id === itemId)
    if (!stored) return

    const def = getItem(itemId)
    const alreadyInInv = invSlots.some((s) => s.id === itemId)
    if (!alreadyInInv && invSlots.length >= maxSlots) {
      useNotifications.getState().push('Your inventory is full.', 'info')
      return
    }

    const actual = withdrawItem(itemId, 1)
    if (actual <= 0) return
    addItem({ id: itemId, name: def?.name ?? stored.name, quantity: actual })
    useNotifications.getState().push(`Withdrew ${stored.name}.`, 'success')
  }

  const usedStorage = storedSlots.length

  return (
    <div
      ref={panelRef}
      className="ledger-panel"
      role="dialog"
      aria-modal="false"
      aria-label={LEDGER_HALL_NAME}
      tabIndex={-1}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="ledger-panel__header">
        <div className="ledger-panel__title-block">
          <span className="ledger-panel__title">{LEDGER_HALL_NAME}</span>
          <span className="ledger-panel__capacity" aria-label={`${usedStorage} of ${LEDGER_HALL_CAPACITY} slots used`}>
            {usedStorage} / {LEDGER_HALL_CAPACITY}
          </span>
        </div>
        <button
          className="ledger-panel__sort"
          onClick={sortStorage}
          aria-label="Sort storage alphabetically"
          title="Sort A–Z"
        >
          A–Z
        </button>
        <button
          className="ledger-panel__close"
          onClick={handleClose}
          aria-label="Close ledger hall"
        >
          ✕
        </button>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="ledger-panel__tabs" role="tablist">
        <button
          className={`ledger-tab${tab === 'deposit' ? ' ledger-tab--active' : ''}`}
          role="tab"
          aria-selected={tab === 'deposit'}
          onClick={() => setTab('deposit')}
        >
          Deposit
        </button>
        <button
          className={`ledger-tab${tab === 'withdraw' ? ' ledger-tab--active' : ''}`}
          role="tab"
          aria-selected={tab === 'withdraw'}
          onClick={() => setTab('withdraw')}
        >
          Withdraw
        </button>
      </div>

      {/* ── Deposit list ────────────────────────────────────────────────── */}
      {tab === 'deposit' && (
        <ul className="ledger-panel__list" role="list">
          {invSlots.length === 0 ? (
            <li className="ledger-row ledger-row--empty">Inventory is empty.</li>
          ) : (
            invSlots.map((item) => (
              <li key={item.id} className="ledger-row" role="listitem">
                <span className="ledger-row__name">
                  {item.name}
                  {item.quantity > 1 && (
                    <span className="ledger-row__qty"> ×{item.quantity}</span>
                  )}
                </span>
                <button
                  className="ledger-row__btn"
                  onClick={() => handleDeposit(item.id)}
                  aria-label={`Deposit ${item.name}`}
                >
                  Deposit
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      {/* ── Withdraw list ────────────────────────────────────────────────── */}
      {tab === 'withdraw' && (
        <ul className="ledger-panel__list" role="list">
          {storedSlots.length === 0 ? (
            <li className="ledger-row ledger-row--empty">Nothing stored.</li>
          ) : (
            storedSlots.map((item) => (
              <li key={item.id} className="ledger-row" role="listitem">
                <span className="ledger-row__name">
                  {item.name}
                  {item.quantity > 1 && (
                    <span className="ledger-row__qty"> ×{item.quantity}</span>
                  )}
                </span>
                <button
                  className="ledger-row__btn"
                  onClick={() => handleWithdraw(item.id)}
                  aria-label={`Withdraw ${item.name}`}
                >
                  Withdraw
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
