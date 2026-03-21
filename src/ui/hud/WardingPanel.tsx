/**
 * Phase 46 — Warding Panel
 *
 * An altar-side crafting panel toggled when the player interacts with the
 * Warding Altar or presses G while near it.  All ward mark recipes are
 * shown in a single list; ward marks are consumable protective items.
 *
 * Pressing G, Escape, or clicking ✕ closes the panel.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useWardingStore } from '../../store/useWardingStore'
import { useGameStore } from '../../store/useGameStore'
import { getItem } from '../../data/items/itemRegistry'
import { getAllWardRecipes } from '../../engine/warding'
import type { WardRecipeConfig } from '../../engine/warding'

// ─── Recipe row ───────────────────────────────────────────────────────────

interface WardRecipeRowProps {
  recipe: WardRecipeConfig
  materialQty: number
  wardingLevel: number
  onWard: (recipe: WardRecipeConfig) => void
}

function WardRecipeRow({ recipe, materialQty, wardingLevel, onWard }: WardRecipeRowProps) {
  const outputDef    = getItem(recipe.outputId)
  const materialDef  = getItem(recipe.materialId)
  const outputName   = outputDef?.name   ?? recipe.outputId
  const materialName = materialDef?.name ?? recipe.materialId
  const meetsLevel   = wardingLevel >= recipe.levelReq
  const hasMaterial  = materialQty >= recipe.materialQty
  const canWard      = meetsLevel && hasMaterial

  return (
    <li className={`warding-recipe${canWard ? '' : ' warding-recipe--locked'}`}>
      <div className="warding-recipe__top">
        <span className="warding-recipe__name">
          {materialName} ×{recipe.materialQty}
          <span className="warding-recipe__arrow"> → </span>
          {outputName}
        </span>
        {!meetsLevel && (
          <span className="warding-recipe__lock-badge">Warding {recipe.levelReq} req</span>
        )}
      </div>
      <div className="warding-recipe__effect">{recipe.effectHint}</div>
      <div className="warding-recipe__meta">
        <span>Lvl {recipe.levelReq}</span>
        <span>·</span>
        <span>{recipe.xp} XP</span>
        <span>·</span>
        <span>{recipe.wardDuration} s</span>
      </div>
      <div className="warding-recipe__bottom">
        <span className={`warding-recipe__count${hasMaterial ? '' : ' warding-recipe__count--low'}`}>
          In bag: {materialQty}
        </span>
        <button
          className="warding-recipe__btn"
          disabled={!canWard}
          onClick={() => onWard(recipe)}
          aria-label={`Inscribe ${outputName}`}
        >
          Inscribe
        </button>
      </div>
    </li>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────

interface WardingPanelProps {
  /** Called when the player activates a ward inscription from this panel. */
  onWard: (recipe: WardRecipeConfig) => void
}

export function WardingPanel({ onWard }: WardingPanelProps) {
  const isOpen     = useWardingStore((s) => s.isOpen)
  const closePanel = useWardingStore((s) => s.closePanel)
  const slots      = useGameStore((s) => s.inventory.slots)
  const wardingLevel = useGameStore(
    (s) => s.skills.skills.find((sk) => sk.id === 'warding')?.level ?? 1,
  )

  const isOpenRef = useRef(false)
  useEffect(() => { isOpenRef.current = isOpen }, [isOpen])
  const panelRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => closePanel(), [closePanel])

  // Escape closes the panel; G toggle is handled exclusively in App.tsx.
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

  // Focus panel on open.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  const recipes = getAllWardRecipes()

  const getMaterialQty = (materialId: string): number =>
    slots.find((s) => s.id === materialId)?.quantity ?? 0

  return (
    <div
      ref={panelRef}
      className="warding-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Warding Altar — Warding"
      tabIndex={-1}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="warding-panel__header">
        <span className="warding-panel__title">Warding Altar · Warding</span>
        <span className="warding-panel__level">Warding lvl {wardingLevel}</span>
        <button
          className="warding-panel__close"
          onClick={handleClose}
          aria-label="Close warding panel"
        >
          ✕
        </button>
      </div>

      {/* ── Recipe list ────────────────────────────────────────────────── */}
      <ul className="warding-panel__list" role="list">
        {recipes.map((recipe) => (
          <WardRecipeRow
            key={recipe.outputId}
            recipe={recipe}
            materialQty={getMaterialQty(recipe.materialId)}
            wardingLevel={wardingLevel}
            onWard={onWard}
          />
        ))}
      </ul>

      <p className="warding-panel__hint">Press G or Esc to close</p>
    </div>
  )
}
