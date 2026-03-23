import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGameStore, type InventoryItem } from '../../store/useGameStore'
import { getItem } from '../../data/items/itemRegistry'
import { CURRENCY_NAME, CURRENCY_PLURAL } from '../../engine/economy'
import { meetsEquipRequirements, EQUIP_SLOT_META } from '../../engine/equipment'
import { useNotifications } from '../../store/useNotifications'
import { useFoodStore } from '../../store/useFoodStore'
import { useCombatStore } from '../../store/useCombatStore'

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
  const equipItem = useGameStore((s) => s.equipItem)
  const skills = useGameStore((s) => s.skills.skills)

  // Phase 33 — food consumption
  const foodCooldown = useFoodStore((s) => s.cooldownRemaining)
  const eatFood = useFoodStore((s) => s.eat)
  const inCombat = useCombatStore((s) => s.targetName !== null)

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

  // Memoize the skill-level map so it is only rebuilt when skills change, not on every render.
  const skillMap = useMemo(() => {
    const map: Partial<Record<string, number>> = {}
    for (const sk of skills) {
      map[sk.id] = sk.level
    }
    return map
  }, [skills])

  if (!isOpen) return null

  // Build a fixed-length array so empty slots always render.
  const cells: (InventoryItem | null)[] = Array.from(
    { length: maxSlots },
    (_, i) => slots[i] ?? null,
  )

  const usedCount = slots.length

  // Resolve the hovered item's definition once, outside JSX, to avoid an IIFE.
  const tooltipDef = tooltip ? getItem(tooltip.item.id) : null

  // True when all equip requirements for the tooltip item are satisfied.
  const tooltipReqsMet =
    tooltipDef?.type === 'equipment' && tooltipDef.equipMeta
      ? meetsEquipRequirements(tooltipDef, skillMap)
      : true

  // Phase 73 — Durability display values, computed once outside JSX.
  const toolMaxDur = tooltipDef?.type === 'tool' ? tooltipDef.toolMeta?.maxDurability ?? 0 : 0
  const toolCurDur = tooltip && toolMaxDur > 0 ? (tooltip.item.durability ?? toolMaxDur) : 0
  const toolDurPct = toolMaxDur > 0 ? Math.max(0, Math.min(1, toolCurDur / toolMaxDur)) : 0
  const toolDurColor = toolDurPct > 0.6 ? '#60c870' : toolDurPct > 0.25 ? '#f0b830' : '#d85040'

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
          <strong className="inv-tooltip__name">{tooltipDef?.name ?? tooltip.item.name}</strong>
          {tooltipDef && (
            <span className="inv-tooltip__type">{tooltipDef.type}</span>
          )}
          <span className="inv-tooltip__qty">Qty: {tooltip.item.quantity}</span>
          {tooltipDef && (
            <span className="inv-tooltip__value">
              Value: {tooltipDef.value} {tooltipDef.value === 1 ? CURRENCY_NAME : CURRENCY_PLURAL}
            </span>
          )}
          {/* Phase 73 — Durability bar for tool items */}
          {tooltipDef?.type === 'tool' && toolMaxDur > 0 && (
            <div className="inv-tooltip__durability">
              <span className="inv-tooltip__durability-label">
                Durability: {toolCurDur}/{toolMaxDur}
              </span>
              <div className="inv-tooltip__durability-bar">
                <div
                  className="inv-tooltip__durability-fill"
                  style={{ width: `${toolDurPct * 100}%`, background: toolDurColor }}
                />
              </div>
            </div>
          )}
          {/* Phase 27 — Equipment stat bonuses */}
          {tooltipDef?.equipMeta && (
            <div className="inv-tooltip__equip-stats">
              {(tooltipDef.equipMeta.attackBonus ?? 0) !== 0 && (
                <span className="inv-tooltip__stat inv-tooltip__stat--atk">
                  ⚔ Attack <strong>+{tooltipDef.equipMeta.attackBonus}</strong>
                </span>
              )}
              {(tooltipDef.equipMeta.defenceBonus ?? 0) !== 0 && (
                <span className="inv-tooltip__stat inv-tooltip__stat--def">
                  🛡 Defence <strong>+{tooltipDef.equipMeta.defenceBonus}</strong>
                </span>
              )}
              {tooltipDef.equipMeta.attackSpeed !== undefined && (
                  <span className="inv-tooltip__stat inv-tooltip__stat--spd">
                    ⚡ Speed <strong>{tooltipDef.equipMeta.attackSpeed.toFixed(2)}×</strong>
                  </span>
                )}
              {tooltipDef.equipMeta.weaponType && (
                <span className="inv-tooltip__stat inv-tooltip__stat--type">
                  Type: <strong>{tooltipDef.equipMeta.weaponType}</strong>
                </span>
              )}
              <span className="inv-tooltip__slot">
                Slot: {EQUIP_SLOT_META[tooltipDef.equipMeta.slot].label}
              </span>
            </div>
          )}
          {/* Phase 27 — Skill requirements */}
          {tooltipDef?.equipMeta?.requirements &&
            Object.keys(tooltipDef.equipMeta.requirements).length > 0 && (
              <div className="inv-tooltip__reqs">
                <span className="inv-tooltip__reqs-label">Requires:</span>
                {Object.entries(tooltipDef.equipMeta.requirements).map(([skillId, minLvl]) => {
                  const playerLvl = skillMap[skillId] ?? 0
                  const met = playerLvl >= (minLvl ?? 0)
                  return (
                    <span
                      key={skillId}
                      className={`inv-tooltip__req${met ? ' inv-tooltip__req--met' : ' inv-tooltip__req--unmet'}`}
                    >
                      {skillId.charAt(0).toUpperCase() + skillId.slice(1)} {minLvl}
                      {met ? ' ✓' : ` (${playerLvl}/${minLvl})`}
                    </span>
                  )
                })}
              </div>
            )}
          {tooltipDef?.description && (
            <span className="inv-tooltip__desc">{tooltipDef.description}</span>
          )}
          {tooltipDef?.type === 'equipment' && (
            <button
              className={`inv-tooltip__equip${tooltipReqsMet ? '' : ' inv-tooltip__equip--locked'}`}
              disabled={!tooltipReqsMet}
              aria-disabled={!tooltipReqsMet}
              onClick={() => {
                if (!tooltipReqsMet) return
                const equipped = equipItem(tooltip.item.id)
                if (equipped) {
                  setTooltip(null)
                } else {
                  useNotifications.getState().push(
                    `Cannot equip ${tooltipDef?.name ?? tooltip.item.id}.`,
                    'info',
                  )
                }
              }}
            >
              {tooltipReqsMet ? 'Equip' : 'Requirements not met'}
            </button>
          )}
          {/* Phase 33 — Eat button for consumable food items */}
          {tooltipDef?.type === 'consumable' && tooltipDef.consumableMeta?.healsHp && (
            <button
              className={`inv-tooltip__eat${inCombat && foodCooldown > 0 ? ' inv-tooltip__eat--cooldown' : ''}`}
              disabled={inCombat && foodCooldown > 0}
              aria-disabled={inCombat && foodCooldown > 0}
              onClick={() => {
                const consumed = eatFood(tooltipDef.id, inCombat)
                if (consumed) {
                  setTooltip(null)
                }
              }}
            >
              {inCombat && foodCooldown > 0
                ? `On cooldown (${Math.ceil(foodCooldown)}s)`
                : `Eat (+${tooltipDef.consumableMeta.healsHp} HP)`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
