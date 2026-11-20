import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, Settings, ShieldAlert, User } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import NotificationBell from '../notifications/NotificationBell'
import { Logo } from '../common/Logo'

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
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [prevPathname, setPrevPathname] = useState(location.pathname)
  const dropdownRef = useRef(null)
  const avatarBtnRef = useRef(null)

  // Synchronously close dropdown on route change during render
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname)
    setDropdownOpen(false)
  }

  const currentMeta = pageMeta[location.pathname] || {
    title: 'RakshaPath',
    desc: 'Plan • Travel • Stay Safe',
  }

  const accessDeniedMessage = location.state?.denied ? location.state.message : null

  const userInitials =
    user?.name
      ?.split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ||
    user?.email?.charAt(0).toUpperCase() ||
    'U'

  // Handle click outside and Escape key
  useEffect(() => {
    if (!dropdownOpen) return undefined

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false)
        avatarBtnRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [dropdownOpen])

  const handleLogout = () => {
    setDropdownOpen(false)
    logout()
    navigate('/login')
  }

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
          <Link
            to="/dashboard"
            className="header-brand-badge"
            aria-label="RakshaPath home"
          >
            <Logo variant="icon" size={32} />
            <span className="brand-name header-brand-text" style={{ fontSize: 15, fontWeight: 800 }}>
              <span>Raksha</span>
              <span className="brand-accent">Path</span>
            </span>
          </Link>
          <div className="topbar-title">
            <strong>{currentMeta.title}</strong>
            <span>{currentMeta.desc}</span>
          </div>
        </div>
        <div className="topbar-actions">
          <NotificationBell />
          <div className="profile-dropdown-wrapper" ref={dropdownRef}>
            <button
              ref={avatarBtnRef}
              type="button"
              className="topbar-avatar-btn"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-label={`User account menu for ${user?.name || 'User'}`}
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
              title={user?.name || 'User account'}
            >
              <span className="avatar-initials">{userInitials}</span>
            </button>

            {dropdownOpen && (
              <div
                className="profile-dropdown-menu"
                role="menu"
                aria-label="Profile navigation options"
              >
                <div className="profile-dropdown-header">
                  <div className="profile-dropdown-avatar" aria-hidden="true">
                    {userInitials}
                  </div>
                  <div className="profile-dropdown-user-info">
                    <div className="profile-dropdown-name">{user?.name || 'Traveller'}</div>
                    <div className="profile-dropdown-email">{user?.email || 'account@rakshapath.demo'}</div>
                    {user?.role && (
                      <span className="profile-dropdown-role">{user.role}</span>
                    )}
                  </div>
                </div>

                <div className="profile-dropdown-divider" role="separator" />

                <div className="profile-dropdown-body">
                  <Link
                    to="/settings"
                    className="profile-dropdown-item"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={16} />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="profile-dropdown-item"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </Link>
                </div>

                <div className="profile-dropdown-divider" role="separator" />

                <div className="profile-dropdown-footer">
                  <button
                    type="button"
                    className="profile-dropdown-item profile-dropdown-logout"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
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
