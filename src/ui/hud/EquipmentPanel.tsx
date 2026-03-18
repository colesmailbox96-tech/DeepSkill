import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore, type EquipSlot } from '../../store/useGameStore'
import { EQUIP_SLOTS, EQUIP_SLOT_META } from '../../engine/equipment'
import { getItem } from '../../data/items/itemRegistry'

/**
 * Phase 26 — Equipment Panel
 *
 * Displays all equipment slots in a paper-doll list.  Occupied slots show
 * the equipped item name and a "Remove" button that unequips the item.
 * Also displays the derived attack and defence bonuses from all gear.
 *
 * Toggled with the Q key.  Close via ✕, pressing Q again, or Escape.
 */
export function EquipmentPanel() {
  const [isOpen, setIsOpen] = useState(false)

  const isOpenRef = useRef(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const equipment = useGameStore((s) => s.equipment)
  const equipStats = useGameStore((s) => s.equipStats)
  const unequipItem = useGameStore((s) => s.unequipItem)

  const handleClose = useCallback(() => {
    isOpenRef.current = false
    setIsOpen(false)
  }, [])

  // Q key toggles; Escape closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'KeyQ') {
        const next = !isOpenRef.current
        isOpenRef.current = next
        setIsOpen(next)
      } else if (e.code === 'Escape' && isOpenRef.current) {
        handleClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  // Move keyboard focus into the panel on open.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  const equippedCount = Object.values(equipment).filter(Boolean).length

  return (
    <div
      className="equip-panel"
      ref={panelRef}
      tabIndex={-1}
      role="dialog"
      aria-label="Equipment"
      aria-modal="false"
    >
      {/* Header */}
      <div className="equip-panel__header">
        <div className="equip-panel__title-block">
          <span className="equip-panel__title">Equipment</span>
          <span className="equip-panel__count">{equippedCount} / {EQUIP_SLOTS.length} slots filled</span>
        </div>
        <button
          className="equip-panel__close"
          onClick={handleClose}
          aria-label="Close equipment panel"
        >
          ✕
        </button>
      </div>

      {/* Stat summary */}
      <div className="equip-panel__stats">
        <span className="equip-panel__stat">
          ⚔ Attack <strong>{equipStats.totalAttack >= 0 ? '+' : ''}{equipStats.totalAttack}</strong>
        </span>
        <span className="equip-panel__stat">
          🛡 Defence <strong>{equipStats.totalDefence >= 0 ? '+' : ''}{equipStats.totalDefence}</strong>
        </span>
      </div>

      {/* Slot list */}
      <ul className="equip-panel__list" aria-label="Equipment slots">
        {EQUIP_SLOTS.map((slot: EquipSlot) => {
          const item = equipment[slot] ?? null
          const def = item ? getItem(item.id) : null
          const isEmpty = item === null

          return (
            <li key={slot} className={`equip-row${isEmpty ? ' equip-row--empty' : ''}`}>
              <span className="equip-row__slot">{EQUIP_SLOT_META[slot].label}</span>
              {isEmpty ? (
                <span className="equip-row__empty">— empty —</span>
              ) : (
                <>
                  <span className="equip-row__name">{def?.name ?? item.id}</span>
                  <button
                    className="equip-row__unequip"
                    onClick={() => unequipItem(slot)}
                    aria-label={`Unequip ${def?.name ?? item.id}`}
                  >
                    Remove
                  </button>
                </>
              )}
            </li>
          )
        })}
      </ul>

      <p className="equip-panel__hint">Q to close · Equip items from the Inventory (I)</p>
    </div>
  )
}
