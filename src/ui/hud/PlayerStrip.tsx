import { useGameStore } from '../../store/useGameStore'

/**
 * Player name + level strip with health and stamina bars.
 * Reads live values from the global game store.
 */
export function PlayerStrip() {
  const name = useGameStore((s) => s.playerStats.name)
  const level = useGameStore((s) => s.playerStats.level)
  const health = useGameStore((s) => s.playerStats.health)
  const maxHealth = useGameStore((s) => s.playerStats.maxHealth)
  const stamina = useGameStore((s) => s.playerStats.stamina)
  const maxStamina = useGameStore((s) => s.playerStats.maxStamina)

  const healthPct = maxHealth > 0 ? (health / maxHealth) * 100 : 0
  const staminaPct = maxStamina > 0 ? (stamina / maxStamina) * 100 : 0

  return (
    <div className="hud-player-strip" role="status" aria-label="Player status">
      <div className="hud-name-row">
        <span className="hud-name">{name}</span>
        <span className="hud-level">Lv {level}</span>
      </div>

      <div
        className="hud-bar hud-bar--health"
        role="meter"
        aria-label="Health"
        aria-valuenow={health}
        aria-valuemin={0}
        aria-valuemax={maxHealth}
      >
        <div className="hud-bar__fill" style={{ width: `${healthPct}%` }} />
        <span className="hud-bar__label">
          {health} / {maxHealth}
        </span>
      </div>

      <div
        className="hud-bar hud-bar--stamina"
        role="meter"
        aria-label="Stamina"
        aria-valuenow={stamina}
        aria-valuemin={0}
        aria-valuemax={maxStamina}
      >
        <div className="hud-bar__fill" style={{ width: `${staminaPct}%` }} />
        <span className="hud-bar__label">
          {stamina} / {maxStamina}
        </span>
      </div>
    </div>
  )
}
