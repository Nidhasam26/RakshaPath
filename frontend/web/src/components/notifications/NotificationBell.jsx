import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useNotifications } from '../../hooks/useNotifications'

export function NotificationBell() {
  const { unreadCount } = useNotifications()

  return (
    <Link
      to="/notifications"
      className="icon-btn"
      aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
      title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
      }}
    >
      <Bell size={18} />
      {unreadCount > 0 && (
        <span
          className="notification-badge"
          style={{
            position: 'absolute',
            top: -3,
            right: -3,
            background: 'var(--coral, #ff6b6b)',
            color: '#ffffff',
            fontSize: 10,
            fontWeight: 800,
            borderRadius: 999,
            minWidth: 16,
            height: 16,
            padding: '0 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            boxShadow: '0 0 0 2px var(--bg, #0b0f14)',
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}

export default NotificationBell
