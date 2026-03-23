/**
 * Phase 42 — Carving Panel
 * Phase 70 — Crafting Panel UX Pass (filter bar, output preview, missing-material feedback)
 *
 * A workbench-side crafting panel toggled when the player interacts with the
 * Carving Workbench or presses V while near it.  All carving recipes are shown
 * in a single list; completed items are wood/bone utility components.
 *
 * Pressing V, Escape, or clicking ✕ closes the panel.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useCarvingStore } from '../../store/useCarvingStore'
import { useGameStore } from '../../store/useGameStore'
import { getItem } from '../../data/items/itemRegistry'
import { getAllCarveRecipes } from '../../engine/carving'
import type { CarveRecipeConfig } from '../../engine/carving'
import { CraftFilterBar, RecipeOutputPreview } from './CraftFilterBar'
import type { CraftSortMode } from './CraftFilterBar'

// ─── Recipe row ───────────────────────────────────────────────────────────

interface CarveRecipeRowProps {
  recipe: CarveRecipeConfig
  materialQty: number
  carvingLevel: number
  onCarve: (recipe: CarveRecipeConfig) => void
}

function CarveRecipeRow({ recipe, materialQty, carvingLevel, onCarve }: CarveRecipeRowProps) {
  const outputDef    = getItem(recipe.outputId)
  const materialDef  = getItem(recipe.materialId)
  const outputName   = outputDef?.name   ?? recipe.outputId
  const materialName = materialDef?.name ?? recipe.materialId
  const meetsLevel   = carvingLevel >= recipe.levelReq
  const hasMaterial  = materialQty >= recipe.materialQty
  const canCarve     = meetsLevel && hasMaterial
  const need         = Math.max(0, recipe.materialQty - materialQty)

  return (
    <li className={`carving-recipe${canCarve ? '' : ' carving-recipe--locked'}`}>
      <div className="carving-recipe__top">
        <span className="carving-recipe__name">
          {materialName} ×{recipe.materialQty}
          <span className="carving-recipe__arrow"> → </span>
          {outputName}
        </span>
        {!meetsLevel && (
          <span className="carving-recipe__lock-badge">Carving {recipe.levelReq} req</span>
        )}
      </div>
      <RecipeOutputPreview outputDef={outputDef} />
      <div className="carving-recipe__meta">
        <span>Lvl {recipe.levelReq}</span>
        <span>·</span>
        <span>{recipe.xp} XP</span>
        <span>·</span>
        <span>{recipe.carveDuration} s</span>
      </div>
      <div className="carving-recipe__bottom">
        <span className={`carving-recipe__count${hasMaterial ? '' : ' carving-recipe__count--low'}`}>
          In bag: {materialQty}{need > 0 && <span className="craft-need"> (need {need} more)</span>}
        </span>
        <button
          className="carving-recipe__btn"
          disabled={!canCarve}
          onClick={() => onCarve(recipe)}
          aria-label={`Carve ${outputName}`}
        >
          Carve
        </button>
      </div>
    </li>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────

interface CarvingPanelProps {
  /** Called when the player activates a carve from this panel. */
  onCarve: (recipe: CarveRecipeConfig) => void
}

export function CarvingPanel({ onCarve }: CarvingPanelProps) {
  const isOpen     = useCarvingStore((s) => s.isOpen)
  const closePanel = useCarvingStore((s) => s.closePanel)
  const slots      = useGameStore((s) => s.inventory.slots)
  const carvingLevel = useGameStore(
    (s) => s.skills.skills.find((sk) => sk.id === 'carving')?.level ?? 1,
  )

  const [craftableOnly, setCraftableOnly] = useState(false)
  const [sortMode, setSortMode] = useState<CraftSortMode>('level')

  const isOpenRef = useRef(false)
  useEffect(() => { isOpenRef.current = isOpen }, [isOpen])
  const panelRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => closePanel(), [closePanel])

  // V key or Escape closes the panel; V opening is handled in App.tsx.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if ((e.code === 'KeyV' || e.code === 'Escape') && isOpenRef.current) {
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

  const allRecipes = getAllCarveRecipes()

  const getMaterialQty = (materialId: string): number =>
    slots.find((s) => s.id === materialId)?.quantity ?? 0

  const craftableRecipes = allRecipes.filter(
    (r) => carvingLevel >= r.levelReq && getMaterialQty(r.materialId) >= r.materialQty,
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
      className="carving-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Workbench — Carving"
      tabIndex={-1}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="carving-panel__header">
        <span className="carving-panel__title">Workbench · Carving</span>
        <span className="carving-panel__level">Carving lvl {carvingLevel}</span>
        <button
          className="carving-panel__close"
          onClick={handleClose}
          aria-label="Close carving panel"
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
      <ul className="carving-panel__list" role="list">
        {visibleRecipes.map((recipe) => (
          <CarveRecipeRow
            key={recipe.outputId}
            recipe={recipe}
            materialQty={getMaterialQty(recipe.materialId)}
            carvingLevel={carvingLevel}
            onCarve={onCarve}
          />
        ))}
      </ul>

      <p className="carving-panel__hint">Press V or Esc to close</p>
    </div>
  )
}
