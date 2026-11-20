import { AlertTriangle, Check, Route, Siren, Trash2, Users } from 'lucide-react'

const TYPE_ICONS = {
  hazard: AlertTriangle,
  trip: Route,
  sos: Siren,
  family: Users,
}

const TYPE_COLORS = {
  hazard: 'var(--amber)',
  trip: 'var(--accent)',
  sos: 'var(--danger)',
  family: 'var(--accent)',
}

export function NotificationItem({ notification, onToggleRead, onDelete }) {
  const Icon = TYPE_ICONS[notification.type] || Route
  const iconColor = TYPE_COLORS[notification.type] || 'var(--accent)'

  const formattedTime = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(new Date(notification.timestamp))

  return (
    <div
      className="row-card"
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: 12,
        alignItems: 'start',
        padding: '12px 14px',
        borderRadius: 10,
        background: notification.read ? 'rgba(255, 255, 255, 0.02)' : 'rgba(45, 226, 176, 0.05)',
        border: notification.read ? '1px solid var(--line, rgba(255,255,255,0.08))' : '1px solid rgba(45, 226, 176, 0.3)',
        transition: 'background 0.15s ease',
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `${iconColor}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: iconColor,
          flexShrink: 0,
        }}
      >
        <Icon size={16} />
      </span>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <strong style={{ fontSize: 13, color: notification.read ? 'var(--text)' : '#ffffff' }}>
            {notification.title}
          </strong>
          <span
            className="pill"
            style={{
              fontSize: 9,
              padding: '1px 6px',
              textTransform: 'uppercase',
              color: iconColor,
            }}
          >
            {notification.type}
          </span>
          {notification.severity === 'Critical' && (
            <span className="pill pill-coral" style={{ fontSize: 9, padding: '1px 6px' }}>
              CRITICAL
            </span>
          )}
        </div>

        <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
          {notification.message}
        </p>

        <span style={{ fontSize: 10, color: 'var(--muted)' }}>{formattedTime}</span>
      </div>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn-quiet"
          style={{ fontSize: 10, padding: '4px 8px', minHeight: 28 }}
          title={notification.read ? 'Mark as unread' : 'Mark as read'}
          aria-label={notification.read ? 'Mark as unread' : 'Mark as read'}
          onClick={() => onToggleRead(notification.id)}
        >
          <Check size={12} color={notification.read ? 'var(--muted)' : 'var(--mint)'} />
        </button>
        {onDelete && (
          <button
            type="button"
            className="btn btn-quiet"
            style={{ fontSize: 10, padding: '4px 8px', minHeight: 28 }}
            title="Delete notification"
            aria-label="Delete notification"
            onClick={() => onDelete(notification.id)}
          >
            <Trash2 size={12} color="var(--coral)" />
          </button>
        )}
      </div>
    </div>
  )
}

export default NotificationItem
