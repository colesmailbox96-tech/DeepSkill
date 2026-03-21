/**
 * Phase 42 — Carving Panel
 *
 * A workbench-side crafting panel toggled when the player interacts with the
 * Carving Workbench or presses V while near it.  All carving recipes are shown
 * in a single list; completed items are wood/bone utility components.
 *
 * Pressing V, Escape, or clicking ✕ closes the panel.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useCarvingStore } from '../../store/useCarvingStore'
import { useGameStore } from '../../store/useGameStore'
import { getItem } from '../../data/items/itemRegistry'
import { getAllCarveRecipes } from '../../engine/carving'
import type { CarveRecipeConfig } from '../../engine/carving'

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
      <div className="carving-recipe__meta">
        <span>Lvl {recipe.levelReq}</span>
        <span>·</span>
        <span>{recipe.xp} XP</span>
        <span>·</span>
        <span>{recipe.carveDuration} s</span>
      </div>
      <div className="carving-recipe__bottom">
        <span className={`carving-recipe__count${hasMaterial ? '' : ' carving-recipe__count--low'}`}>
          In bag: {materialQty}
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

  const recipes = getAllCarveRecipes()

  const getMaterialQty = (materialId: string): number =>
    slots.find((s) => s.id === materialId)?.quantity ?? 0

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

      {/* ── Recipe list ────────────────────────────────────────────────── */}
      <ul className="carving-panel__list" role="list">
        {recipes.map((recipe) => (
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
