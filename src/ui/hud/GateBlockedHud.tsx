import { useEffect } from 'react'
import { useGatingStore } from '../../store/useGatingStore'
import type { FactionTier } from '../../store/useFactionStore'

/** Display labels for faction trust tiers. */
const FACTION_TIER_LABELS: Record<FactionTier, string> = {
  neutral:    'Neutral',
  acquainted: 'Acquainted',
  trusted:    'Trusted',
  honored:    'Honored',
}

/** How long (ms) the gate requirement panel stays visible. */
const DISPLAY_TTL_MS = 7000

/**
 * Phase 67 — Gate Requirement Feedback HUD
 *
 * Renders a persistent panel whenever the player attempts to pass a blocked
 * gate.  Shows exactly what type of gate is blocking and what the player must
 * do to satisfy it.  Auto-clears after DISPLAY_TTL_MS.
 *
 * Sits just above the interaction prompt in screen space so the two UI
 * elements never overlap.
 */
export function GateBlockedHud() {
  const blockedRequirement = useGatingStore((s) => s.blockedRequirement)
  const setBlockedRequirement = useGatingStore((s) => s.setBlockedRequirement)

  useEffect(() => {
    if (!blockedRequirement) return
    const timer = setTimeout(() => setBlockedRequirement(null), DISPLAY_TTL_MS)
    return () => clearTimeout(timer)
  }, [blockedRequirement, setBlockedRequirement])

  if (!blockedRequirement) return null

  let icon: string
  let label: string
  let detail: string

  switch (blockedRequirement.kind) {
    case 'skill':
      icon = '⚔'
      label = `${blockedRequirement.skillName} ${blockedRequirement.minLevel} Required`
      detail = `Train your ${blockedRequirement.skillName} skill to level ${blockedRequirement.minLevel}.`
      break
    case 'task':
      icon = '📜'
      label = 'Task Required'
      detail = `Complete "${blockedRequirement.taskTitle}" to proceed.`
      break
    case 'item':
      icon = '🔑'
      label = 'Item Required'
      detail = `Carry ${blockedRequirement.itemName} to pass.`
      break
    case 'faction':
      icon = '⚜'
      label = `${blockedRequirement.factionName} Standing Required`
      detail = `Reach ${FACTION_TIER_LABELS[blockedRequirement.minTier]} standing with ${blockedRequirement.factionName}.`
      break
  }

  return (
    <div className="gate-blocked-hud" role="status" aria-live="polite">
      <span className="gate-blocked-hud__icon" aria-hidden="true">{icon}</span>
      <div className="gate-blocked-hud__text">
        <strong className="gate-blocked-hud__label">{label}</strong>
        <span className="gate-blocked-hud__detail">{detail}</span>
      </div>
    </div>
  )
}
