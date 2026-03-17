import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore, type InventoryItem } from '../../store/useGameStore'
import { getItem } from '../../data/items/itemRegistry'

interface TooltipState {
  item: InventoryItem
  x: number
  y: number
}

/**
 * Inventory panel — a 4×5 slot grid toggled with the I key.
 *
 * Rules:
 *  - Each slot corresponds to one unique item stack (stacking by id).
 *  - Occupied slots show a short label and a quantity badge when qty > 1.
 *  - Hovering an occupied slot reveals a tooltip with full name and quantity.
 *  - Close via the ✕ button, pressing I again, or pressing Escape.
 */
export function InventoryPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  // Ref mirrors isOpen so key handlers read current state without stale closures.
  const isOpenRef = useRef(false)
  // Panel container — focused on open for keyboard / screen-reader users.
  const panelRef = useRef<HTMLDivElement>(null)
  // Pending rAF id for throttled tooltip position updates.
  const rafRef = useRef<number>(0)

  const slots = useGameStore((s) => s.inventory.slots)
  const maxSlots = useGameStore((s) => s.inventory.maxSlots)

  /** Close the panel and clear any lingering tooltip state. */
  const handleClose = useCallback(() => {
    isOpenRef.current = false
    setIsOpen(false)
    setTooltip(null)
  }, [])

  // I key toggles open/close; Escape always closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'KeyI') {
        const next = !isOpenRef.current
        isOpenRef.current = next
        setIsOpen(next)
        // Closing via I — clear any stale tooltip immediately.
        if (!next) setTooltip(null)
      } else if (e.code === 'Escape' && isOpenRef.current) {
        handleClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  // Move keyboard focus into the panel whenever it opens so screen-reader
  // users and keyboard-only players land in a sensible place.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

  // Cancel any pending rAF when the component unmounts.
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  if (!isOpen) return null

  // Build a fixed-length array so empty slots always render.
  const cells: (InventoryItem | null)[] = Array.from(
    { length: maxSlots },
    (_, i) => slots[i] ?? null,
  )

  const usedCount = slots.length

  // Resolve the hovered item's definition once, outside JSX, to avoid an IIFE.
  const tooltipDef = tooltip ? getItem(tooltip.item.id) : null

  return (
    <div
      ref={panelRef}
      className="inv-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Inventory"
      tabIndex={-1}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="inv-panel__header">
        <span className="inv-panel__title">Inventory</span>
        <span className="inv-panel__count">
          {usedCount} / {maxSlots}
        </span>
        <button
          className="inv-panel__close"
          onClick={handleClose}
          aria-label="Close inventory"
        >
          ✕
        </button>
      </div>

      {/* ── Slot grid ────────────────────────────────────────────────────── */}
      <div className="inv-panel__grid" role="list">
        {cells.map((item, i) => (
          <div
            key={i}
            className={`inv-slot${item ? ' inv-slot--filled' : ''}`}
            role="listitem"
            aria-label={item ? `${item.name}, quantity ${item.quantity}` : 'Empty slot'}
            onMouseEnter={(e) =>
              item && setTooltip({ item, x: e.clientX, y: e.clientY })
            }
            onMouseMove={(e) => {
              if (!item) return
              // Throttle position updates to one per animation frame to avoid
              // flooding React with state updates at pointer-move frequency.
              const x = e.clientX
              const y = e.clientY
              cancelAnimationFrame(rafRef.current)
              rafRef.current = requestAnimationFrame(() => {
                setTooltip((t) => (t ? { ...t, x, y } : t))
              })
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            {item && (
              <>
                <span className="inv-slot__label">
                  {item.name.length > 5 ? `${item.name.slice(0, 5)}…` : item.name}
                </span>
                {item.quantity > 1 && (
                  <span className="inv-slot__qty">{item.quantity}</span>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── Hover tooltip ────────────────────────────────────────────────── */}
      {tooltip && (
        <div
          className="inv-tooltip"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
          role="tooltip"
        >
          <strong className="inv-tooltip__name">{tooltip.item.name}</strong>
          {tooltipDef && (
            <span className="inv-tooltip__type">{tooltipDef.type}</span>
          )}
          <span className="inv-tooltip__qty">Qty: {tooltip.item.quantity}</span>
          {tooltipDef && (
            <span className="inv-tooltip__value">
              Value: {tooltipDef.value} {tooltipDef.value === 1 ? 'coin' : 'coins'}
            </span>
          )}
          {tooltipDef?.description && (
            <span className="inv-tooltip__desc">{tooltipDef.description}</span>
          )}
        </div>
      )}
    </div>
  )
}
