import { useEffect, useState } from 'react'
import { useGameStore, type InventoryItem } from '../../store/useGameStore'

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
 *  - Close via the ✕ button or pressing I again.
 */
export function InventoryPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const slots = useGameStore((s) => s.inventory.slots)
  const maxSlots = useGameStore((s) => s.inventory.maxSlots)

  // Toggle with I key; guard against repeat-fires.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'KeyI') setIsOpen((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!isOpen) return null

  // Build a fixed-length array so empty slots always render.
  const cells: (InventoryItem | null)[] = Array.from(
    { length: maxSlots },
    (_, i) => slots[i] ?? null,
  )

  const usedCount = slots.length

  return (
    <div
      className="inv-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Inventory"
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="inv-panel__header">
        <span className="inv-panel__title">Inventory</span>
        <span className="inv-panel__count">
          {usedCount} / {maxSlots}
        </span>
        <button
          className="inv-panel__close"
          onClick={() => setIsOpen(false)}
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
            onMouseMove={(e) =>
              item &&
              setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : t))
            }
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
          <span className="inv-tooltip__qty">Qty: {tooltip.item.quantity}</span>
        </div>
      )}
    </div>
  )
}
