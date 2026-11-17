import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import notificationService from '../services/notificationService'

export function useNotifications() {
  const { user } = useAuth()
  const userId = user?.id

  const [notifications, setNotifications] = useState(() =>
    notificationService.getNotifications(userId)
  )

  const refresh = useCallback(() => {
    setNotifications(notificationService.getNotifications(userId))
  }, [userId])

  useEffect(() => {
    const handleUpdate = (e) => {
      if (!e.detail || e.detail.userId === userId || !userId) {
        refresh()
      }
    }

    const handleStorage = (e) => {
      if (e.key && e.key.includes(':notifications')) {
        refresh()
      }
    }

    window.addEventListener('rakshapath:notifications_updated', handleUpdate)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('rakshapath:notifications_updated', handleUpdate)
      window.removeEventListener('storage', handleStorage)
    }
  }, [userId, refresh])

  const markAsRead = useCallback(
    (notifId) => {
      notificationService.markAsRead(userId, notifId)
      refresh()
    },
    [userId, refresh]
  )

  const markAllAsRead = useCallback(() => {
    notificationService.markAllAsRead(userId)
    refresh()
  }, [userId, refresh])

  const deleteNotification = useCallback(
    (notifId) => {
      notificationService.deleteNotification(userId, notifId)
      refresh()
    },
    [userId, refresh]
  )

  const clearAll = useCallback(() => {
    notificationService.clearAll(userId)
    refresh()
  }, [userId, refresh])

  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh,
  }
}

export default useNotifications
