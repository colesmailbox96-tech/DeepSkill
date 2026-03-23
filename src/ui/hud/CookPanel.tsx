/**
 * Phase 59 — Cook Panel
 * Phase 70 — Crafting Panel UX Pass (filter bar, output preview, missing-material feedback)
 *
 * A hearthfire-side recipe browser that opens when the player interacts with
 * the campfire cook station.  All cookable recipes are listed; each row shows
 * the ingredient required, level requirement, output stats (HP restore and any
 * attack buff), and a Cook button.
 *
 * Pressing Escape or clicking ✕ closes the panel.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useCookPanelStore } from '../../store/useCookPanelStore'
import { useGameStore } from '../../store/useGameStore'
import { getItem } from '../../data/items/itemRegistry'
import { getAllCookRecipes } from '../../engine/cooking'
import type { CookRecipeConfig } from '../../engine/cooking'
import { CraftFilterBar, RecipeOutputPreview } from './CraftFilterBar'
import type { CraftSortMode } from './CraftFilterBar'

// ─── Recipe row ───────────────────────────────────────────────────────────

interface CookRecipeRowProps {
  recipe: CookRecipeConfig
  ingredientQty: number
  cookingLevel: number
  onCook: (recipe: CookRecipeConfig) => void
}

function CookRecipeRow({ recipe, ingredientQty, cookingLevel, onCook }: CookRecipeRowProps) {
  const rawDef    = getItem(recipe.rawId)
  const cookedDef = getItem(recipe.cookedId)
  const rawName   = rawDef?.name    ?? recipe.rawId
  const cookedName = cookedDef?.name ?? recipe.cookedId

  const meetsLevel   = cookingLevel >= recipe.levelReq
  const hasIngredient = ingredientQty > 0
  const canCook      = meetsLevel && hasIngredient

  // Buff/restore lines from cooked item definition
  const cookedMeta   = cookedDef?.consumableMeta
  const buffLine     = cookedMeta?.buffAttack && cookedMeta.duration
    ? `+${cookedMeta.buffAttack} Attack for ${cookedMeta.duration} s`
    : null
  const staminaLine  = cookedMeta?.restoresStamina
    ? `+${cookedMeta.restoresStamina} Stamina`
    : null

  return (
    <li className={`cook-recipe${canCook ? '' : ' cook-recipe--locked'}`}>
      <div className="cook-recipe__top">
        <span className="cook-recipe__name">
          {rawName}
          <span className="cook-recipe__arrow"> → </span>
          {cookedName}
        </span>
        {!meetsLevel && (
          <span className="cook-recipe__lock-badge">Hearthcraft {recipe.levelReq} req</span>
        )}
      </div>
      <RecipeOutputPreview outputDef={cookedDef} />
      <div className="cook-recipe__stats">
        <span className="cook-recipe__heal">+{recipe.healsHp} HP</span>
        {staminaLine && <span className="cook-recipe__stamina">{staminaLine}</span>}
        {buffLine && <span className="cook-recipe__buff">{buffLine}</span>}
      </div>
      <div className="cook-recipe__meta">
        <span>Lvl {recipe.levelReq}</span>
        <span>·</span>
        <span>{recipe.xp} XP</span>
        <span>·</span>
        <span>{recipe.cookDuration} s</span>
      </div>
      <div className="cook-recipe__bottom">
        <span className={`cook-recipe__count${hasIngredient ? '' : ' cook-recipe__count--low'}`}>
          In bag: {ingredientQty}{!hasIngredient && <span className="craft-need"> (need 1 more)</span>}
        </span>
        <button
          className="cook-recipe__btn"
          disabled={!canCook}
          onClick={() => onCook(recipe)}
          aria-label={`Cook ${cookedName}`}
        >
          Cook
        </button>
      </div>
    </li>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────

interface CookPanelProps {
  /** Called when the player selects a recipe to cook. */
  onCookSelect: (recipe: CookRecipeConfig) => void
}

export function CookPanel({ onCookSelect }: CookPanelProps) {
  const isOpen     = useCookPanelStore((s) => s.isOpen)
  const closePanel = useCookPanelStore((s) => s.closePanel)
  const slots        = useGameStore((s) => s.inventory.slots)
  const cookingLevel = useGameStore(
    (s) => s.skills.skills.find((sk) => sk.id === 'hearthcraft')?.level ?? 1,
  )

  const [craftableOnly, setCraftableOnly] = useState(false)
  const [sortMode, setSortMode] = useState<CraftSortMode>('level')

  const isOpenRef = useRef(false)
  useEffect(() => { isOpenRef.current = isOpen }, [isOpen])
  const panelRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => closePanel(), [closePanel])

  // Escape closes the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'Escape' && isOpenRef.current) handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  // Focus panel on open.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  const allRecipes = getAllCookRecipes()
  const getQty = (id: string) => slots.find((s) => s.id === id)?.quantity ?? 0

  const craftableRecipes = allRecipes.filter(
    (r) => cookingLevel >= r.levelReq && getQty(r.rawId) > 0,
  )

  const visibleRecipes = (craftableOnly ? craftableRecipes : allRecipes)
    .slice()
    .sort((a, b) =>
      sortMode === 'name'
        ? (getItem(a.cookedId)?.name ?? a.cookedId).localeCompare(getItem(b.cookedId)?.name ?? b.cookedId)
        : a.levelReq - b.levelReq,
    )

  const handleCook = (recipe: CookRecipeConfig) => {
    closePanel()
    onCookSelect(recipe)
  }

  return (
    <div
      ref={panelRef}
      className="cook-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Hearthfire — Cooking"
      tabIndex={-1}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="cook-panel__header">
        <span className="cook-panel__title">Hearthfire · Cooking</span>
        <span className="cook-panel__level">Hearthcraft lvl {cookingLevel}</span>
        <button
          className="cook-panel__close"
          onClick={handleClose}
          aria-label="Close cook panel"
        >
          ✕
        </button>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <CraftFilterBar
        craftableOnly={craftableOnly}
        sortMode={sortMode}
        onToggleCraftable={() => setCraftableOnly((v) => !v)}
        onSetSort={setSortMode}
        craftableCount={craftableRecipes.length}
        totalCount={allRecipes.length}
      />

      {/* ── Recipe list ────────────────────────────────────────────────── */}
      <ul className="cook-panel__list" role="list">
        {visibleRecipes.map((recipe) => (
          <CookRecipeRow
            key={recipe.cookedId}
            recipe={recipe}
            ingredientQty={getQty(recipe.rawId)}
            cookingLevel={cookingLevel}
            onCook={handleCook}
          />
        ))}
      </ul>

      <p className="cook-panel__hint">Press Esc to close</p>
    </div>
  )
}
