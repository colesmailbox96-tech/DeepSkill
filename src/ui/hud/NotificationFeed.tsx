import { useNotifications } from '../../store/useNotifications'

/**
 * Transient notification feed — messages appear in the top-right corner and
 * auto-dismiss after a short TTL.  New entries are appended at the bottom of
 * the list, so the feed grows downward over time.
 */
export function NotificationFeed() {
  const notifications = useNotifications((s) => s.notifications)

  if (notifications.length === 0) return null

  return (
    <ul
      className="hud-notification-feed"
      aria-live="polite"
      aria-label="Notifications"
    >
      {notifications.map((n) => (
        <li
          key={n.id}
          className={`hud-notification hud-notification--${n.kind}`}
        >
          {n.message}
        </li>
      ))}
    </ul>
  )
}
