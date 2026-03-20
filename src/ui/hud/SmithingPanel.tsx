/**
 * Phase 40 — Smithing Panel
 *
 * A furnace-side crafting panel toggled when the player interacts with the
 * Furnace station or presses F while near it.  Displays all smelt recipes with
 * their requirements, available ore counts, and a "Smelt" button.
 *
 * Layout
 * ──────
 *  ┌─────────────────────────────────────────────────────┐
 *  │ Furnace  ·  Smithing        [Forging lvl N]     [✕] │
 *  ├─────────────────────────────────────────────────────┤
 *  │  ┌─────────────────────────────────────────────┐    │
 *  │  │  Copper Ore ×3  →  Copper Bar               │    │
 *  │  │  Req: Forging 1  ·  15 XP  ·  4 s           │    │
 *  │  │  In bag: 5                     [Smelt]       │    │
 *  │  └─────────────────────────────────────────────┘    │
 *  │  ┌─────────────────────────────────────────────┐    │
 *  │  │  Iron Ore ×4  →  Iron Bar         (locked)  │    │
 *  │  │  Req: Forging 5  ·  30 XP  ·  6 s           │    │
 *  │  │  In bag: 0                                   │    │
 *  │  └─────────────────────────────────────────────┘    │
 *  └─────────────────────────────────────────────────────┘
 *
 * Pressing F, Escape, or clicking ✕ closes the panel.
 * The "Smelt" button only enables when the player has enough ore and meets
 * the level requirement.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useSmithingStore } from '../../store/useSmithingStore'
import { useGameStore } from '../../store/useGameStore'
import { getItem } from '../../data/items/itemRegistry'
import { getAllSmeltRecipes, getForgingLevel } from '../../engine/smithing'
import type { SmeltRecipeConfig } from '../../engine/smithing'

// ─── Sub-component ────────────────────────────────────────────────────────

interface RecipeRowProps {
  recipe: SmeltRecipeConfig
  oreQty: number
  forgingLevel: number
  onSmelt: (recipe: SmeltRecipeConfig) => void
}

function RecipeRow({ recipe, oreQty, forgingLevel, onSmelt }: RecipeRowProps) {
  const barDef  = getItem(recipe.barId)
  const oreDef  = getItem(recipe.oreId)
  const barName = barDef?.name  ?? recipe.barId
  const oreName = oreDef?.name  ?? recipe.oreId
  const meetsLevel = forgingLevel >= recipe.levelReq
  const hasOre     = oreQty >= recipe.oreQty
  const canSmelt   = meetsLevel && hasOre

  return (
    <li className={`smithing-recipe${canSmelt ? '' : ' smithing-recipe--locked'}`}>
      <div className="smithing-recipe__top">
        <span className="smithing-recipe__name">
          {oreName} ×{recipe.oreQty}
          <span className="smithing-recipe__arrow"> → </span>
          {barName}
        </span>
        {!meetsLevel && (
          <span className="smithing-recipe__lock-badge">Forging {recipe.levelReq} req</span>
        )}
      </div>
      <div className="smithing-recipe__meta">
        <span>Lvl {recipe.levelReq}</span>
        <span>·</span>
        <span>{recipe.xp} XP</span>
        <span>·</span>
        <span>{recipe.smeltDuration} s</span>
      </div>
      <div className="smithing-recipe__bottom">
        <span className={`smithing-recipe__count${hasOre ? '' : ' smithing-recipe__count--low'}`}>
          In bag: {oreQty}
        </span>
        <button
          className="smithing-recipe__btn"
          disabled={!canSmelt}
          onClick={() => onSmelt(recipe)}
          aria-label={`Smelt ${barName}`}
        >
          Smelt
        </button>
      </div>
    </li>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────

interface SmithingPanelProps {
  /** Called when the player activates a smelt from this panel. */
  onSmelt: (recipe: SmeltRecipeConfig) => void
}

export function SmithingPanel({ onSmelt }: SmithingPanelProps) {
  const isOpen     = useSmithingStore((s) => s.isOpen)
  const closePanel = useSmithingStore((s) => s.closePanel)
  const slots      = useGameStore((s) => s.inventory.slots)

  const isOpenRef = useRef(false)
  isOpenRef.current = isOpen
  const panelRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => closePanel(), [closePanel])

  // F key or Escape to close; F also handled by App.tsx to open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if ((e.code === 'KeyF' || e.code === 'Escape') && isOpenRef.current) {
        handleClose()
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

  const forgingLevel = getForgingLevel()
  const recipes = getAllSmeltRecipes()

  const getOreQty = (oreId: string): number =>
    slots.find((s) => s.id === oreId)?.quantity ?? 0

  return (
    <div
      ref={panelRef}
      className="smithing-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Furnace — Smithing"
      tabIndex={-1}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="smithing-panel__header">
        <span className="smithing-panel__title">Furnace · Smithing</span>
        <span className="smithing-panel__level">Forging lvl {forgingLevel}</span>
        <button
          className="smithing-panel__close"
          onClick={handleClose}
          aria-label="Close smithing panel"
        >
          ✕
        </button>
      </div>

      {/* ── Recipe list ────────────────────────────────────────────────── */}
      <ul className="smithing-panel__list" role="list">
        {recipes.map((recipe) => (
          <RecipeRow
            key={recipe.oreId}
            recipe={recipe}
            oreQty={getOreQty(recipe.oreId)}
            forgingLevel={forgingLevel}
            onSmelt={onSmelt}
          />
        ))}
      </ul>

      <p className="smithing-panel__hint">Press F or Esc to close</p>
    </div>
  )
}
