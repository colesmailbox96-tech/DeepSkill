/**
 * Phase 63 — Tailoring Panel
 *
 * A sewing-table-side crafting panel toggled when the player interacts with
 * the Sewing Table or presses H while near it.  All tailoring recipes are
 * shown in a single list; outputs are hide armour pieces and utility clothing.
 *
 * Pressing H, Escape, or clicking ✕ closes the panel.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useTailoringStore } from '../../store/useTailoringStore'
import { useGameStore } from '../../store/useGameStore'
import { getItem } from '../../data/items/itemRegistry'
import { getAllTailorRecipes } from '../../engine/tailoring'
import type { TailorRecipeConfig } from '../../engine/tailoring'

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
      <ul className="tailoring-recipe__ingredient-list">
        <li className={primaryQty >= recipe.materialQty ? '' : 'tailoring-recipe__ingredient--low'}>
          {primaryName} ×{recipe.materialQty}
          <span className="tailoring-recipe__stock"> ({primaryQty})</span>
        </li>
        <li className={secondaryQty >= recipe.secondaryIngredient.qty ? '' : 'tailoring-recipe__ingredient--low'}>
          {secondaryName} ×{recipe.secondaryIngredient.qty}
          <span className="tailoring-recipe__stock"> ({secondaryQty})</span>
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

  const recipes = getAllTailorRecipes()

  const getQty = (itemId: string): number =>
    slots.find((s) => s.id === itemId)?.quantity ?? 0

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

      {/* ── Recipe list ────────────────────────────────────────────────── */}
      <ul className="tailoring-panel__list" role="list">
        {recipes.map((recipe) => (
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
