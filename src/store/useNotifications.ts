import { create } from 'zustand'

export type NotificationKind = 'info' | 'success' | 'warning'

export interface Notification {
  id: string
  message: string
  kind: NotificationKind
}

/** How long (ms) each notification lingers before auto-dismissal. */
const NOTIFICATION_TTL_MS = 4000

interface NotificationsState {
  notifications: Notification[]
  /** Push a new notification. It will auto-dismiss after NOTIFICATION_TTL_MS. */
  push: (message: string, kind?: NotificationKind) => void
  /** Manually remove a notification by id. */
  dismiss: (id: string) => void
}

export const useNotifications = create<NotificationsState>((set, get) => ({
  notifications: [],

  push: (message, kind = 'info') => {
    const id = crypto.randomUUID()
    set((s) => ({ notifications: [...s.notifications, { id, message, kind }] }))
    setTimeout(() => get().dismiss(id), NOTIFICATION_TTL_MS)
  },

  dismiss: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
}))
