import { Menu, ShieldAlert } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import NotificationBell from '../notifications/NotificationBell'

const pageMeta = {
  '/dashboard': { title: 'Dashboard', desc: 'Your journeys, safety tools, all in one place' },
  '/map': { title: 'Live Map', desc: 'Explore illustrative safety information' },
  '/trips': { title: 'My Trips', desc: 'Plan and revisit your journeys' },
  '/family': { title: 'Family Sharing', desc: 'Stay close, wherever the road leads' },
  '/contacts': { title: 'Emergency Contacts', desc: 'Your trusted people, one tap away' },
  '/sos': { title: 'Emergency SOS', desc: 'Assistance center · demonstration mode' },
  '/notifications': { title: 'Notifications', desc: 'Journey updates and safety advisories' },
  '/settings': { title: 'Settings', desc: 'Make RakshaPath feel like yours' },
  '/police': { title: 'Police Dashboard', desc: 'Operations overview · demonstration mode' },
}

function Header({ mobileMenuOpen, onMenuClick }) {
  const { user } = useAuth()
  const location = useLocation()
  const currentMeta = pageMeta[location.pathname] || {
    title: 'RakshaPath',
    desc: 'Your safety companion',
  }

  const accessDeniedMessage = location.state?.denied ? location.state.message : null

  return (
    <>
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button
            className="icon-btn mobile-only"
            type="button"
            aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileMenuOpen}
            onClick={onMenuClick}
          >
            <Menu size={18} />
          </button>
          <div className="topbar-title">
            <strong>{currentMeta.title}</strong>
            <span>{currentMeta.desc}</span>
          </div>
        </div>
        <div className="topbar-actions">
          <NotificationBell />
          <span className="pill pill-lime">
            <span style={{ width: 6, height: 6, borderRadius: 9, background: 'currentColor' }} /> DEMO MODE
          </span>
          <span className="avatar" title={user?.name || 'User'}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
      </header>
      {accessDeniedMessage && (
        <div
          role="alert"
          style={{
            margin: '12px 16px 0',
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(255, 107, 107, 0.12)',
            border: '1px solid var(--coral, #ff6b6b)',
            color: 'var(--coral, #ff6b6b)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <ShieldAlert size={16} />
          <span>{accessDeniedMessage}</span>
        </div>
      )}
    </>
  )
}

export default Header
