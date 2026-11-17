import storageService from './storageService'

export const NOTIFICATION_TYPES = {
  HAZARD: 'hazard',
  TRIP: 'trip',
  SOS: 'sos',
  FAMILY: 'family',
}

export function getUserNotificationsKey(userId) {
  return userId ? `rakshapath:${userId}:notifications` : 'rakshapath:guest:notifications'
}

export function getUserPreferencesKey(userId) {
  return userId ? `rakshapath:${userId}:preferences` : 'rakshapath:guest:preferences'
}

const DEFAULT_PREFERENCES = {
  notifications: true,
  safetyAlerts: true,
  tripReminders: true,
  locationSharing: false,
  privacyMode: true,
}

export const notificationService = {
  /**
   * Retrieves all notifications for the given user.
   */
  getNotifications(userId) {
    const key = getUserNotificationsKey(userId)
    const list = storageService.get(key, [])
    return Array.isArray(list) ? list : []
  },

  /**
   * Retrieves user notification and privacy preferences.
   */
  getUserPreferences(userId) {
    const key = getUserPreferencesKey(userId)
    const prefs = storageService.get(key, DEFAULT_PREFERENCES)
    return { ...DEFAULT_PREFERENCES, ...(prefs || {}) }
  },

  /**
   * Returns unread notification count.
   */
  getUnreadCount(userId) {
    const list = this.getNotifications(userId)
    return list.filter((n) => !n.read).length
  },

  /**
   * Adds an in-app notification if allowed by user preferences.
   * Deduplicates identical notifications arriving within 30 seconds.
   */
  addNotification(userId, data) {
    if (!data || !data.title || !data.message) return null

    const prefs = this.getUserPreferences(userId)

    // Master switch suppression
    if (!prefs.notifications) return null

    // Category-specific suppression
    if (data.type === NOTIFICATION_TYPES.HAZARD && !prefs.safetyAlerts) return null
    if (data.type === NOTIFICATION_TYPES.TRIP && !prefs.tripReminders) return null

    const key = getUserNotificationsKey(userId)
    const current = this.getNotifications(userId)
    const now = Date.now()

    // Deduplication check: prevent identical title and message within 30s
    const isDuplicate = current.some((n) => {
      if (n.title === data.title && n.message === data.message) {
        const timeDiff = now - new Date(n.timestamp).getTime()
        return timeDiff < 30 * 1000
      }
      return false
    })

    if (isDuplicate) return null

    const newNotif = {
      id: data.id || `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: data.type || NOTIFICATION_TYPES.TRIP,
      title: data.title.trim(),
      message: data.message.trim(),
      severity: data.severity || 'Medium',
      timestamp: new Date().toISOString(),
      read: false,
      metadata: data.metadata || null,
    }

    const updated = [newNotif, ...current]
    storageService.set(key, updated)

    // Notify reactive listeners
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('rakshapath:notifications_updated', { detail: { userId } }))
    }

    return newNotif
  },

  /**
   * Marks a single notification as read.
   */
  markAsRead(userId, notifId) {
    const key = getUserNotificationsKey(userId)
    const current = this.getNotifications(userId)
    const updated = current.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    storageService.set(key, updated)

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('rakshapath:notifications_updated', { detail: { userId } }))
    }
    return updated
  },

  /**
   * Marks all notifications as read.
   */
  markAllAsRead(userId) {
    const key = getUserNotificationsKey(userId)
    const current = this.getNotifications(userId)
    const updated = current.map((n) => ({ ...n, read: true }))
    storageService.set(key, updated)

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('rakshapath:notifications_updated', { detail: { userId } }))
    }
    return updated
  },

  /**
   * Deletes a notification by ID.
   */
  deleteNotification(userId, notifId) {
    const key = getUserNotificationsKey(userId)
    const current = this.getNotifications(userId)
    const updated = current.filter((n) => n.id !== notifId)
    storageService.set(key, updated)

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('rakshapath:notifications_updated', { detail: { userId } }))
    }
    return updated
  },

  /**
   * Clears all notifications.
   */
  clearAll(userId) {
    const key = getUserNotificationsKey(userId)
    storageService.set(key, [])
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('rakshapath:notifications_updated', { detail: { userId } }))
    }
  },
}

export default notificationService
