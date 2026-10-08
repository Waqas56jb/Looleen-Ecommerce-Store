import { db } from '@/store/db'

/**
 * Live notification selectors for the header bell. Reads the mock DB store
 * reactively; when the backend arrives this becomes a polling/websocket store.
 */
export const useUnreadCount = () => db.notifications((s) => s.items.filter((n) => !n.read).length)

export const useLatestNotifications = (limit = 6) => db.notifications((s) => s.items).slice(0, limit)
