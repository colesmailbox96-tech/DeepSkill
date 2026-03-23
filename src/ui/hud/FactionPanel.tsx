/**
 * Phase 76 — Faction Panel
 *
 * A read-only panel showing the player's current standing with every faction.
 * Toggle with the [U] key or the Escape key to close.
 *
 * Layout
 * ──────
 *  ┌───────────────────────────────────────┐
 *  │ Factions                          [✕] │
 *  ├───────────────────────────────────────┤
 *  │  The Hushwrights                      │
 *  │  ████████░░░░  Acquainted  (120/300)  │
 *  │  ...                                  │
 *  └───────────────────────────────────────┘
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useFactionStore } from '../../store/useFactionStore'
import { getAllFactions } from '../../data/factions/factionRegistry'
import { tierFromRep, TIER_REP } from '../../store/useFactionStore'
import type { FactionTier } from '../../store/useFactionStore'
import { FACTION_TIER_ORDER } from '../../engine/shop'

// ─── Tier helpers ─────────────────────────────────────────────────────────────

const TIER_LABELS: Record<FactionTier, string> = {
  neutral:    'Neutral',
  acquainted: 'Acquainted',
  trusted:    'Trusted',
  honored:    'Honored',
}

const TIER_COLOURS: Record<FactionTier, string> = {
  neutral:    '#6b7280',
  acquainted: '#60a5fa',
  trusted:    '#34d399',
  honored:    '#fbbf24',
}

/** Next tier threshold (or max cap 1000 for honored). */
function nextThreshold(tier: FactionTier): number {
  if (tier === 'neutral')    return TIER_REP.acquainted   // 100
  if (tier === 'acquainted') return TIER_REP.trusted       // 300
  if (tier === 'trusted')    return TIER_REP.honored       // 600
  return 1000
}

/** Fill proportion 0–1 within the current tier band. */
function tierProgress(rep: number, tier: FactionTier): number {
  const low  = TIER_REP[tier]
  const high = nextThreshold(tier)
  return Math.min(1, Math.max(0, (rep - low) / (high - low)))
}

/**
 * Phase 77 — Faction vendor perks displayed below the rep bar.
 * These are keyed by faction id and describe what unlocks at each tier.
 */
const FACTION_PERKS: Partial<Record<string, { tier: FactionTier; text: string }[]>> = {
  quarry_union: [
    { tier: 'acquainted', text: "Olen's Union Post unlocked" },
    { tier: 'trusted',    text: 'Duskiron Pick available + 15% sell bonus' },
    { tier: 'honored',    text: '30% sell bonus at union post' },
  ],
}

// ─── Faction row ──────────────────────────────────────────────────────────────

interface FactionRowProps {
  factionId: string
  name: string
  description: string
}

function FactionRow({ factionId, name, description }: FactionRowProps) {
  const rep    = useFactionStore((s) => s.rep[factionId] ?? 0)
  const tier   = tierFromRep(rep)
  const fill   = tierProgress(rep, tier)
  const next   = nextThreshold(tier)
  const colour = TIER_COLOURS[tier]

  // Determine next perk to show (first perk the player hasn't reached yet).
  const perks = FACTION_PERKS[factionId]
  const currentTierIdx = FACTION_TIER_ORDER.indexOf(tier)
  const nextPerk = perks?.find(
    (p) => FACTION_TIER_ORDER.indexOf(p.tier) > currentTierIdx,
  )
  const earnedPerks = perks?.filter(
    (p) => FACTION_TIER_ORDER.indexOf(p.tier) <= currentTierIdx,
  )

  return (
    <div className="faction-row" title={description}>
      <div className="faction-row__name">{name}</div>
      <div className="faction-row__bar-wrap">
        <div
          className="faction-row__bar-fill"
          style={{ width: `${fill * 100}%`, background: colour }}
        />
      </div>
      <div className="faction-row__info">
        <span className="faction-row__tier" style={{ color: colour }}>
          {TIER_LABELS[tier]}
        </span>
        <span className="faction-row__rep">
          {rep} / {next}
        </span>
      </div>
      {earnedPerks && earnedPerks.length > 0 && (
        <div className="faction-row__perks">
          {earnedPerks.map((p) => (
            <span key={p.tier} className="faction-row__perk faction-row__perk--earned">
              ✦ {p.text}
            </span>
          ))}
        </div>
      )}
      {nextPerk && (
        <div className="faction-row__perks">
          <span className="faction-row__perk faction-row__perk--next">
            Next ({nextPerk.tier}): {nextPerk.text}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function FactionPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const isOpenRef = useRef(false)
  const panelRef  = useRef<HTMLDivElement>(null)

  useEffect(() => { isOpenRef.current = isOpen }, [isOpen])

  // Focus the panel when it opens so keyboard / screen-reader users are taken
  // into the dialog, matching the pattern used by JournalPanel / SkillsPanel.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

  const handleClose = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'Escape' && isOpenRef.current) {
        setIsOpen(false)
      } else if (e.code === 'KeyU') {
        setIsOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!isOpen) return null

  const factions = getAllFactions()

  return (
    <div
      ref={panelRef}
      className="faction-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Faction standings"
      tabIndex={-1}
    >
      {/* Header */}
      <div className="faction-panel__header">
        <span className="faction-panel__title">Factions</span>
        <button
          className="faction-panel__close"
          onClick={handleClose}
          aria-label="Close faction panel"
        >
          ✕
        </button>
      </div>

      {/* Faction list */}
      <div className="faction-panel__list">
        {factions.map((f) => (
          <FactionRow
            key={f.id}
            factionId={f.id}
            name={f.name}
            description={f.description}
          />
        ))}
      </div>

      {/* Hotkey hint */}
      <div className="faction-panel__hint">[U] toggle · [Esc] close</div>
    </div>
  )
}
