import { useState } from 'react'
import { CheckCheck, Info, ShieldCheck, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import NotificationItem from '../../components/notifications/NotificationItem'
import { useNotifications } from '../../hooks/useNotifications'

export function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } =
    useNotifications()
  const [filter, setFilter] = useState('All')

  const filterTypes = ['All', 'hazard', 'trip', 'sos', 'family']

  const filtered = notifications.filter((n) => {
    if (filter === 'All') return true
    return n.type === filter
  })

  return (
    <div className="notifications-page">
      <PageHeader
        eyebrow="Activity & alerts"
        title="Notifications"
        description="Stay updated on journey progress, hazard advisories, emergency updates, and family tracking."
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              style={{ fontSize: 11, minHeight: 34 }}
            >
              <CheckCheck size={13} /> Mark all as read
            </button>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={clearAll}
              disabled={notifications.length === 0}
              style={{ fontSize: 11, minHeight: 34, color: 'var(--coral)' }}
            >
              <Trash2 size={13} /> Clear history
            </button>
          </div>
        }
      />

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          marginBottom: 16,
          justifyContent: 'space-between',
        }}
      >
        <div className="tabs" role="tablist" aria-label="Notification categories">
          {filterTypes.map((t) => {
            const label = t === 'All' ? 'All' : t.toUpperCase()
            const isActive = filter === t
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`tab ${isActive ? 'active' : ''}`}
                onClick={() => setFilter(t)}
                style={{ fontSize: 11, padding: '4px 12px' }}
              >
                {label}
              </button>
            )
          })}
        </div>

        <Link
          to="/settings"
          className="muted"
          style={{ fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Info size={12} /> Configure in Settings
        </Link>
      </div>

      {/* Notification List */}
      <div style={{ display: 'grid', gap: 10 }}>
        {filtered.length === 0 ? (
          <article className="panel panel-pad" style={{ textAlign: 'center', padding: '36px 20px' }}>
            <ShieldCheck size={28} color="var(--mint)" style={{ margin: '0 auto 8px', display: 'block' }} />
            <h3 style={{ fontSize: 15, margin: '0 0 4px' }}>All caught up</h3>
            <p className="muted" style={{ fontSize: 12, margin: 0 }}>
              {filter === 'All'
                ? 'No notifications yet. Journey alerts, hazard updates, and SOS status will appear here.'
                : `No notifications in the ${filter.toUpperCase()} category.`}
            </p>
          </article>
        ) : (
          filtered.map((item) => (
            <NotificationItem
              key={item.id}
              notification={item}
              onToggleRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default Notifications
