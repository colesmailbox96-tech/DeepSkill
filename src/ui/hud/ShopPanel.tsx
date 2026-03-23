/**
 * Phase 23 — Starter Shop / Trade Interface
 * Phase 24 — uses economy module for currency naming and transaction validation.
 * Phase 55 — Vendor Diversity: panel adapts to the active vendor (Tomas/Bron/Brin Salt).
 * Phase 77 — Faction Vendors / Rewards: faction-gated items shown with lock
 *             indicator; faction sell bonus applied for Trusted/Honored members.
 *
 * Two-tab panel (Buy / Sell) opened by interacting with any vendor NPC.
 * Close via the ✕ button or pressing Escape.
 *
 * Buy tab  — shows the vendor's specific stock with buy prices in Marks.
 *            Items with a factionGate are shown locked if standing is too low.
 * Sell tab — shows player inventory items accepted by this vendor, with prices.
 *            Faction-aligned vendors apply a sell bonus to Trusted+ members.
 *
 * Each vendor has distinct stock and sell constraints:
 *   Tomas (general)      — provisions and raw materials; buys anything.
 *   Bron (toolsmith)     — gathering tools and ores; buys tools + mining materials.
 *   Brin Salt (fisher)   — fishing gear and tackle; buys fish + fishing tools.
 *   Olen (faction_union) — union-grade tools and ore; buys mining tools + ore.
 *
 * Currency: Marks (⬡) displayed in the header.
 * Buy deducts Marks; sell adds Marks.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { useShopStore } from '../../store/useShopStore'
import { useNotifications } from '../../store/useNotifications'
import { useFactionStore, tierFromRep } from '../../store/useFactionStore'
import { getItem } from '../../data/items/itemRegistry'
import {
  getBuyPrice,
  getSellPrice,
  CURRENCY_SYMBOL,
  CURRENCY_NAME,
  CURRENCY_PLURAL,
  validatePurchase,
  validateSale,
  getVendorDef,
  canSellToVendor,
  getFactionSellBonus,
  FACTION_TIER_ORDER,
} from '../../engine/shop'

type ShopTab = 'buy' | 'sell'

export function ShopPanel() {
  const isOpen       = useShopStore((s) => s.isOpen)
  const vendorId     = useShopStore((s) => s.vendorId)
  const vendorStocks = useShopStore((s) => s.vendorStocks)
  const closeShop    = useShopStore((s) => s.closeShop)
  const decrementStock = useShopStore((s) => s.decrementStock)

  const coins       = useGameStore((s) => s.playerStats.coins)
  const slots       = useGameStore((s) => s.inventory.slots)
  const addItem     = useGameStore((s) => s.addItem)
  const removeItem  = useGameStore((s) => s.removeItem)
  const addCoins    = useGameStore((s) => s.addCoins)
  const spendCoins  = useGameStore((s) => s.spendCoins)

  // Faction rep for sell-bonus and gate checks.
  const factionRep = useFactionStore((s) => s.rep)

  const [tab, setTab] = useState<ShopTab>('buy')

  // Ref mirrors isOpen so the key handler reads current state.
  const isOpenRef = useRef(false)
  useEffect(() => { isOpenRef.current = isOpen }, [isOpen])

  const panelRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => {
    closeShop()
  }, [closeShop])

  // Escape closes the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'Escape' && isOpenRef.current) {
        handleClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  // Focus panel on open for keyboard / screen-reader users.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  const vendor = getVendorDef(vendorId)

  // ── Buy tab ──────────────────────────────────────────────────────────────────

  const handleBuy = (itemId: string) => {
    const def = getItem(itemId)
    if (!def) return
    const price = getBuyPrice(def.value)
    const { inventory } = useGameStore.getState()
    const alreadyHasItem = inventory.slots.some((s) => s.id === itemId)

    // Check faction gate: if the item requires a faction tier, verify it.
    const vendorItemDef = vendor.stock.find((v) => v.id === itemId)
    if (vendorItemDef?.factionGate) {
      const { factionId, factionName, minTier } = vendorItemDef.factionGate
      const playerRep = useFactionStore.getState().getRepForFaction(factionId)
      const playerTier = tierFromRep(playerRep)
      const minIdx = FACTION_TIER_ORDER.indexOf(minTier)
      const playerIdx = FACTION_TIER_ORDER.indexOf(playerTier)
      if (playerIdx < minIdx) {
        useNotifications.getState().push(
          `Requires ${factionName} standing: ${minTier}. You have ${playerTier} (${playerRep} rep).`,
          'info',
        )
        return
      }
    }

    // Defensive: verify remaining stock for finite-supply items.
    // Only enter this block when the item is confirmed finite-supply (stock !== null).
    const currentStocks = useShopStore.getState().vendorStocks
    if (vendorItemDef && vendorItemDef.stock !== null) {
      const remaining = currentStocks[vendorId]?.[itemId] ?? vendorItemDef.stock
      if (remaining <= 0) {
        useNotifications.getState().push('That item is out of stock.', 'info')
        return
      }
    }

    const result = validatePurchase(
      price,
      coins,
      inventory.slots.length,
      inventory.maxSlots,
      alreadyHasItem,
    )
    if (!result.ok) {
      useNotifications.getState().push(result.reason, 'info')
      return
    }

    // validatePurchase already confirmed the player has sufficient funds,
    // so spendCoins is guaranteed to succeed here.
    if (!spendCoins(price)) return  // defensive — should never fire
    addItem({ id: itemId, name: def.name, quantity: 1 })
    // Decrement remaining stock for finite-supply items.
    decrementStock(vendorId, itemId)
    useNotifications.getState().push(
      `Bought ${def.name} for ${price} ${price === 1 ? CURRENCY_NAME : CURRENCY_PLURAL}.`,
      'success',
    )
  }

  // ── Sell tab ─────────────────────────────────────────────────────────────────

  // Compute faction sell bonus for this vendor.
  const vendorFactionTier = vendor.factionId
    ? tierFromRep(factionRep[vendor.factionId] ?? 0)
    : 'neutral'
  const sellBonus = getFactionSellBonus(vendorFactionTier)

  /** Returns the effective sell price accounting for any faction bonus. */
  const effectiveSellPrice = (itemValue: number, isConsumable = false): number =>
    Math.max(1, Math.floor(getSellPrice(itemValue, isConsumable) * sellBonus))

  const handleSell = (itemId: string) => {
    const def = getItem(itemId)
    if (!def) return
    // Atomic check: confirm the item is still in inventory before processing the transaction.
    const { inventory } = useGameStore.getState()
    const hasItem = inventory.slots.some((s) => s.id === itemId && s.quantity > 0)

    const result = validateSale(def.type, hasItem)
    if (!result.ok) {
      useNotifications.getState().push(result.reason, 'info')
      return
    }

    const price = effectiveSellPrice(def.value, def.type === 'consumable')
    removeItem(itemId, 1)
    addCoins(price)
    useNotifications.getState().push(
      `Sold ${def.name} for ${price} ${price === 1 ? CURRENCY_NAME : CURRENCY_PLURAL}.`,
      'success',
    )
  }

  return (
    <div
      ref={panelRef}
      className="shop-panel"
      role="dialog"
      aria-modal="false"
      aria-label={vendor.displayName}
      tabIndex={-1}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="shop-panel__header">
        <div className="shop-panel__title-block">
          <span className="shop-panel__title">{vendor.displayName}</span>
          <span className="shop-panel__tagline">{vendor.tagline}</span>
          {vendor.factionId && (
            <span className="shop-panel__faction-standing">
              Standing: <span
                className={`shop-panel__faction-tier shop-panel__faction-tier--${vendorFactionTier}`}
              >
                {vendorFactionTier.charAt(0).toUpperCase() + vendorFactionTier.slice(1)}
              </span>
            </span>
          )}
        </div>
        <span className="shop-panel__coins" aria-label={`${coins} ${coins === 1 ? CURRENCY_NAME : CURRENCY_PLURAL}`}>
          <span className="shop-panel__coin-icon">{CURRENCY_SYMBOL}</span>
          {coins} <span className="shop-panel__coin-label">{coins === 1 ? CURRENCY_NAME : CURRENCY_PLURAL}</span>
        </span>
        <button
          className="shop-panel__close"
          onClick={handleClose}
          aria-label="Close shop"
        >
          ✕
        </button>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="shop-panel__tabs" role="tablist">
        <button
          className={`shop-tab${tab === 'buy' ? ' shop-tab--active' : ''}`}
          role="tab"
          aria-selected={tab === 'buy'}
          onClick={() => setTab('buy')}
        >
          Buy
        </button>
        <button
          className={`shop-tab${tab === 'sell' ? ' shop-tab--active' : ''}`}
          role="tab"
          aria-selected={tab === 'sell'}
          onClick={() => setTab('sell')}
        >
          Sell
        </button>
      </div>

      {/* ── Buy list ──────────────────────────────────────────────────────── */}
      {tab === 'buy' && (
        <ul className="shop-panel__list" role="list">
          {vendor.stock.map(({ id, stock: initialStock, factionGate }) => {
            const def = getItem(id)
            if (!def) return null
            const price = getBuyPrice(def.value)
            const canAfford = coins >= price
            // Determine remaining stock: if item is finite-supply, read the
            // live count from the store; unlimited items have remaining = null.
            const remaining: number | null =
              initialStock !== null
                ? (vendorStocks[vendorId]?.[id] ?? initialStock)
                : null
            const soldOut = remaining !== null && remaining <= 0

            // Faction gate: check if the player meets the standing requirement.
            let factionLocked = false
            let factionLockHint = ''
            if (factionGate) {
              const playerRep = factionRep[factionGate.factionId] ?? 0
              const playerTier = tierFromRep(playerRep)
              const minIdx = FACTION_TIER_ORDER.indexOf(factionGate.minTier)
              const playerIdx = FACTION_TIER_ORDER.indexOf(playerTier)
              if (playerIdx < minIdx) {
                factionLocked = true
                factionLockHint = `Requires ${factionGate.factionName}: ${factionGate.minTier}`
              }
            }

            const isDisabled = !canAfford || soldOut || factionLocked
            return (
              <li
                key={id}
                className={`shop-row${factionLocked ? ' shop-row--faction-locked' : ''}`}
                role="listitem"
              >
                <span className="shop-row__name">
                  {def.name}
                  {factionLocked && (
                    <span className="shop-row__faction-lock" title={factionLockHint}>
                      {' '}🔒<span className="shop-row__faction-lock-hint" aria-hidden="true">{factionLockHint}</span>
                    </span>
                  )}
                  {!factionLocked && remaining !== null && (
                    <span className={`shop-row__stock${soldOut ? ' shop-row__stock--out' : ''}`}>
                      {soldOut ? ' (sold out)' : ` (${remaining} left)`}
                    </span>
                  )}
                </span>
                <span className={`shop-row__price${canAfford && !isDisabled ? '' : ' shop-row__price--insufficient'}`}>
                  {CURRENCY_SYMBOL} {price}
                </span>
                <button
                  className="shop-row__btn"
                  onClick={() => handleBuy(id)}
                  disabled={isDisabled}
                  aria-label={
                    factionLocked
                      ? `${def.name} — ${factionLockHint}`
                      : `Buy ${def.name} for ${price} ${price === 1 ? CURRENCY_NAME : CURRENCY_PLURAL}`
                  }
                >
                  {factionLocked ? '🔒' : 'Buy'}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* ── Sell list ─────────────────────────────────────────────────────── */}
      {tab === 'sell' && (
        <ul className="shop-panel__list" role="list">
          {sellBonus > 1.0 && (
            <li className="shop-row shop-row--faction-bonus" role="listitem">
              <span className="shop-row__faction-bonus-msg">
                ✦ Faction member bonus: +{Math.round((sellBonus - 1) * 100)}% sell prices
              </span>
            </li>
          )}
          {(() => {
            const sellableSlots = slots.filter((item) => {
              const def = getItem(item.id)
              return def && canSellToVendor(def, vendor)
            })
            if (sellableSlots.length === 0) {
              return (
                <li className="shop-row shop-row--empty">
                  {vendor.role === 'general'
                    ? 'Nothing to sell.'
                    : `${vendor.shortName} doesn't want anything you're carrying.`}
                </li>
              )
            }
            return sellableSlots.map((item) => {
              const def = getItem(item.id)!
              const price = effectiveSellPrice(def.value, def.type === 'consumable')
              const basePrice = getSellPrice(def.value, def.type === 'consumable')
              const hasBonusPrice = price > basePrice
              return (
                <li key={item.id} className="shop-row" role="listitem">
                  <span className="shop-row__name">
                    {item.name}
                    {item.quantity > 1 && (
                      <span className="shop-row__qty"> ×{item.quantity}</span>
                    )}
                  </span>
                  <span className={`shop-row__price${hasBonusPrice ? ' shop-row__price--bonus' : ''}`}>
                    {CURRENCY_SYMBOL} {price}
                    {hasBonusPrice && (
                      <span className="shop-row__price-base"> ({CURRENCY_SYMBOL}{basePrice})</span>
                    )}
                  </span>
                  <button
                    className="shop-row__btn"
                    onClick={() => handleSell(item.id)}
                    aria-label={`Sell ${item.name} for ${price} ${price === 1 ? CURRENCY_NAME : CURRENCY_PLURAL}`}
                  >
                    Sell
                  </button>
                </li>
              )
            })
          })()}
        </ul>
      )}
    </div>
  )
}

