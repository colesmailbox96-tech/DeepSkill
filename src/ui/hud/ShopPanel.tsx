/**
 * Phase 23 — Starter Shop / Trade Interface
 * Phase 24 — uses economy module for currency naming and transaction validation.
 *
 * Two-tab panel (Buy / Sell) opened by interacting with Tomas (Merchant).
 * Close via the ✕ button, pressing Escape, or pressing B again.
 *
 * Buy tab  — shows vendor stock with item names and buy prices in Marks.
 * Sell tab — shows player inventory items with sell prices in Marks.
 *
 * Currency: Marks (⬡) displayed in the header.
 * Buy deducts Marks; sell adds Marks.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { useShopStore } from '../../store/useShopStore'
import { useNotifications } from '../../store/useNotifications'
import { getItem } from '../../data/items/itemRegistry'
import {
  VENDOR_STOCK,
  getBuyPrice,
  getSellPrice,
  CURRENCY_SYMBOL,
  CURRENCY_NAME,
  CURRENCY_PLURAL,
  validatePurchase,
  validateSale,
} from '../../engine/shop'

type ShopTab = 'buy' | 'sell'

export function ShopPanel() {
  const isOpen   = useShopStore((s) => s.isOpen)
  const closeShop = useShopStore((s) => s.closeShop)

  const coins       = useGameStore((s) => s.playerStats.coins)
  const slots       = useGameStore((s) => s.inventory.slots)
  const addItem     = useGameStore((s) => s.addItem)
  const removeItem  = useGameStore((s) => s.removeItem)
  const addCoins    = useGameStore((s) => s.addCoins)
  const spendCoins  = useGameStore((s) => s.spendCoins)

  const [tab, setTab] = useState<ShopTab>('buy')

  // Ref mirrors isOpen so the key handler reads current state.
  const isOpenRef = useRef(false)
  useEffect(() => { isOpenRef.current = isOpen }, [isOpen])

  const panelRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => {
    closeShop()
  }, [closeShop])

  // Escape closes; B toggles.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'Escape' && isOpenRef.current) {
        handleClose()
      } else if (e.code === 'KeyB') {
        if (isOpenRef.current) {
          handleClose()
        } else {
          useShopStore.getState().openShop()
        }
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

  // ── Buy tab ──────────────────────────────────────────────────────────────────

  const handleBuy = (itemId: string) => {
    const def = getItem(itemId)
    if (!def) return
    const price = getBuyPrice(def.value)
    const { inventory } = useGameStore.getState()
    const alreadyHasItem = inventory.slots.some((s) => s.id === itemId)

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
    useNotifications.getState().push(
      `Bought ${def.name} for ${price} ${price === 1 ? CURRENCY_NAME : CURRENCY_PLURAL}.`,
      'success',
    )
  }

  // ── Sell tab ─────────────────────────────────────────────────────────────────

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

    const price = getSellPrice(def.value)
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
      aria-label="Tomas's Shop"
      tabIndex={-1}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="shop-panel__header">
        <span className="shop-panel__title">Tomas's Shop</span>
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
          {VENDOR_STOCK.map(({ id }) => {
            const def = getItem(id)
            if (!def) return null
            const price = getBuyPrice(def.value)
            const canAfford = coins >= price
            return (
              <li key={id} className="shop-row" role="listitem">
                <span className="shop-row__name">{def.name}</span>
                <span className={`shop-row__price${canAfford ? '' : ' shop-row__price--insufficient'}`}>
                  {CURRENCY_SYMBOL} {price}
                </span>
                <button
                  className="shop-row__btn"
                  onClick={() => handleBuy(id)}
                  disabled={!canAfford}
                  aria-label={`Buy ${def.name} for ${price} ${price === 1 ? CURRENCY_NAME : CURRENCY_PLURAL}`}
                >
                  Buy
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* ── Sell list ─────────────────────────────────────────────────────── */}
      {tab === 'sell' && (
        <ul className="shop-panel__list" role="list">
          {(() => {
            const sellableSlots = slots.filter((item) => {
              const def = getItem(item.id)
              return def && def.type !== 'quest'
            })
            if (sellableSlots.length === 0) {
              return <li className="shop-row shop-row--empty">Nothing to sell.</li>
            }
            return sellableSlots.map((item) => {
              const def = getItem(item.id)!
              const price = getSellPrice(def.value)
              return (
                <li key={item.id} className="shop-row" role="listitem">
                  <span className="shop-row__name">
                    {item.name}
                    {item.quantity > 1 && (
                      <span className="shop-row__qty"> ×{item.quantity}</span>
                    )}
                  </span>
                  <span className="shop-row__price">{CURRENCY_SYMBOL} {price}</span>
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
