/**
 * Phase 23 — Starter Shop / Trade Interface
 *
 * Two-tab panel (Buy / Sell) opened by interacting with Tomas (Merchant).
 * Close via the ✕ button, pressing Escape, or pressing B again.
 *
 * Buy tab  — shows vendor stock with item names and buy prices.
 * Sell tab — shows player inventory items with sell prices.
 *
 * Currency: coins displayed in the header.  Buy deducts coins; sell adds coins.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { useShopStore } from '../../store/useShopStore'
import { useNotifications } from '../../store/useNotifications'
import { getItem } from '../../data/items/itemRegistry'
import { VENDOR_STOCK, getBuyPrice, getSellPrice } from '../../engine/shop'

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
  isOpenRef.current = isOpen

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

    // Check inventory space.
    const existsInInv = slots.some((s) => s.id === itemId)
    const { inventory } = useGameStore.getState()
    if (!existsInInv && inventory.slots.length >= inventory.maxSlots) {
      useNotifications.getState().push('Your inventory is full.', 'info')
      return
    }

    if (!spendCoins(price)) {
      useNotifications.getState().push(`Not enough coins. Need ${price}.`, 'info')
      return
    }
    addItem({ id: itemId, name: def.name, quantity: 1 })
    useNotifications.getState().push(`Bought ${def.name} for ${price} coin${price !== 1 ? 's' : ''}.`, 'success')
  }

  // ── Sell tab ─────────────────────────────────────────────────────────────────

  const handleSell = (itemId: string) => {
    const def = getItem(itemId)
    if (!def) return
    // Quest items cannot be sold.
    if (def.type === 'quest') {
      useNotifications.getState().push(`${def.name} cannot be sold.`, 'info')
      return
    }
    const price = getSellPrice(def.value)
    removeItem(itemId, 1)
    addCoins(price)
    useNotifications.getState().push(`Sold ${def.name} for ${price} coin${price !== 1 ? 's' : ''}.`, 'success')
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
        <span className="shop-panel__coins">
          <span className="shop-panel__coin-icon">⬡</span>
          {coins}
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
                  ⬡ {price}
                </span>
                <button
                  className="shop-row__btn"
                  onClick={() => handleBuy(id)}
                  disabled={!canAfford}
                  aria-label={`Buy ${def.name} for ${price} coins`}
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
          {slots.length === 0 && (
            <li className="shop-row shop-row--empty">Nothing to sell.</li>
          )}
          {slots.map((item) => {
            const def = getItem(item.id)
            if (!def || def.type === 'quest') return null
            const price = getSellPrice(def.value)
            return (
              <li key={item.id} className="shop-row" role="listitem">
                <span className="shop-row__name">
                  {item.name}
                  {item.quantity > 1 && (
                    <span className="shop-row__qty"> ×{item.quantity}</span>
                  )}
                </span>
                <span className="shop-row__price">⬡ {price}</span>
                <button
                  className="shop-row__btn"
                  onClick={() => handleSell(item.id)}
                  aria-label={`Sell ${item.name} for ${price} coins`}
                >
                  Sell
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
