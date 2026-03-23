/**
 * Phase 63 — Tailoring Panel
 * Phase 70 — Crafting Panel UX Pass (filter bar, output preview, missing-material feedback)
 *
 * A sewing-table-side crafting panel toggled when the player interacts with
 * the Sewing Table or presses H while near it.  All tailoring recipes are
 * shown in a single list; outputs are hide armour pieces and utility clothing.
 *
 * Pressing H, Escape, or clicking ✕ closes the panel.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTailoringStore } from '../../store/useTailoringStore'
import { useGameStore } from '../../store/useGameStore'
import { getItem } from '../../data/items/itemRegistry'
import { getAllTailorRecipes } from '../../engine/tailoring'
import type { TailorRecipeConfig } from '../../engine/tailoring'
import { CraftFilterBar, RecipeOutputPreview } from './CraftFilterBar'
import type { CraftSortMode } from './CraftFilterBar'

// ─── Recipe row ───────────────────────────────────────────────────────────

interface TailorRecipeRowProps {
  recipe: TailorRecipeConfig
  primaryQty: number
  secondaryQty: number
  tailoringLevel: number
  onTailor: (recipe: TailorRecipeConfig) => void
}

function TailorRecipeRow({
  recipe,
  primaryQty,
  secondaryQty,
  tailoringLevel,
  onTailor,
}: TailorRecipeRowProps) {
  const outputDef     = getItem(recipe.outputId)
  const primaryDef    = getItem(recipe.materialId)
  const secondaryDef  = getItem(recipe.secondaryIngredient.id)
  const outputName    = outputDef?.name    ?? recipe.outputId
  const primaryName   = primaryDef?.name   ?? recipe.materialId
  const secondaryName = secondaryDef?.name ?? recipe.secondaryIngredient.label

  const meetsLevel    = tailoringLevel >= recipe.levelReq
  const hasPrimary    = primaryQty >= recipe.materialQty
  const hasSecondary  = secondaryQty >= recipe.secondaryIngredient.qty
  const canTailor     = meetsLevel && hasPrimary && hasSecondary

  const primaryNeed   = Math.max(0, recipe.materialQty - primaryQty)
  const secondaryNeed = Math.max(0, recipe.secondaryIngredient.qty - secondaryQty)

  return (
    <li className={`tailoring-recipe${canTailor ? '' : ' tailoring-recipe--locked'}`}>
      <div className="tailoring-recipe__top">
        <span className="tailoring-recipe__name">
          {outputName}
        </span>
        {!meetsLevel && (
          <span className="tailoring-recipe__lock-badge">Tailoring {recipe.levelReq} req</span>
        )}
      </div>
      <RecipeOutputPreview outputDef={outputDef} />
      <ul className="tailoring-recipe__ingredient-list">
        <li className={hasPrimary ? '' : 'tailoring-recipe__ingredient--low'}>
          {primaryName} ×{recipe.materialQty}
          <span className="tailoring-recipe__stock"> ({primaryQty})</span>
          {primaryNeed > 0 && <span className="craft-need"> need {primaryNeed} more</span>}
        </li>
        <li className={hasSecondary ? '' : 'tailoring-recipe__ingredient--low'}>
          {secondaryName} ×{recipe.secondaryIngredient.qty}
          <span className="tailoring-recipe__stock"> ({secondaryQty})</span>
          {secondaryNeed > 0 && <span className="craft-need"> need {secondaryNeed} more</span>}
        </li>
      </ul>
      <div className="tailoring-recipe__meta">
        <span>Lvl {recipe.levelReq}</span>
        <span>·</span>
        <span>{recipe.xp} XP</span>
        <span>·</span>
        <span>{recipe.tailorDuration} s</span>
      </div>
      <div className="tailoring-recipe__bottom">
        <button
          className="tailoring-recipe__btn"
          disabled={!canTailor}
          onClick={() => onTailor(recipe)}
          aria-label={`Tailor ${outputName}`}
        >
          Stitch
        </button>
      </div>
    </li>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────

interface TailoringPanelProps {
  /** Called when the player activates a tailoring craft from this panel. */
  onTailor: (recipe: TailorRecipeConfig) => void
}

export function TailoringPanel({ onTailor }: TailoringPanelProps) {
  const isOpen     = useTailoringStore((s) => s.isOpen)
  const closePanel = useTailoringStore((s) => s.closePanel)
  const slots      = useGameStore((s) => s.inventory.slots)
  const tailoringLevel = useGameStore(
    (s) => s.skills.skills.find((sk) => sk.id === 'tailoring')?.level ?? 1,
  )

  const [craftableOnly, setCraftableOnly] = useState(false)
  const [sortMode, setSortMode] = useState<CraftSortMode>('level')

  const isOpenRef = useRef(false)
  useEffect(() => { isOpenRef.current = isOpen }, [isOpen])
  const panelRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => closePanel(), [closePanel])

  // H key or Escape closes the panel; H opening is handled in App.tsx.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if ((e.code === 'KeyH' || e.code === 'Escape') && isOpenRef.current) {
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

  const allRecipes = getAllTailorRecipes()

  const getQty = (itemId: string): number =>
    slots.find((s) => s.id === itemId)?.quantity ?? 0

  const craftableRecipes = allRecipes.filter(
    (r) =>
      tailoringLevel >= r.levelReq &&
      getQty(r.materialId) >= r.materialQty &&
      getQty(r.secondaryIngredient.id) >= r.secondaryIngredient.qty,
  )

  const visibleRecipes = (craftableOnly ? craftableRecipes : allRecipes)
    .slice()
    .sort((a, b) =>
      sortMode === 'name'
        ? (getItem(a.outputId)?.name ?? a.outputId).localeCompare(getItem(b.outputId)?.name ?? b.outputId)
        : a.levelReq - b.levelReq,
    )

  return (
    <div
      ref={panelRef}
      className="tailoring-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Sewing Table — Tailoring"
      tabIndex={-1}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="tailoring-panel__header">
        <span className="tailoring-panel__title">Sewing Table · Tailoring</span>
        <span className="tailoring-panel__level">Tailoring lvl {tailoringLevel}</span>
        <button
          className="tailoring-panel__close"
          onClick={handleClose}
          aria-label="Close tailoring panel"
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
      <ul className="tailoring-panel__list" role="list">
        {visibleRecipes.map((recipe) => (
          <TailorRecipeRow
            key={recipe.outputId}
            recipe={recipe}
            primaryQty={getQty(recipe.materialId)}
            secondaryQty={getQty(recipe.secondaryIngredient.id)}
            tailoringLevel={tailoringLevel}
            onTailor={onTailor}
          />
        ))}
      </ul>

      <p className="tailoring-panel__hint">Press H or Esc to close</p>
    </div>
  )
}
