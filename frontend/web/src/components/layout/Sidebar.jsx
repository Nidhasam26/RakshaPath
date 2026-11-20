import { Activity, Bell, ChevronLeft, ChevronRight, Compass, LayoutDashboard, LogOut, Map, Phone, Route, Settings, ShieldAlert, Users } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { Logo } from '../common/Logo'

const navigationByRole = {
  Traveller: [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Live Map', path: '/map', icon: Map },
    { name: 'Safe Places', path: '/safe-places', icon: Compass },
    { name: 'My Trips', path: '/trips', icon: Route },
    { name: 'Family Sharing', path: '/family', icon: Users },
    { name: 'Emergency Contacts', path: '/contacts', icon: Phone },
    { name: 'Emergency SOS', path: '/sos', icon: ShieldAlert },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ],
  Family: [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Family Sharing', path: '/family', icon: Users },
    { name: 'Safe Places', path: '/safe-places', icon: Compass },
    { name: 'Live Map', path: '/map', icon: Map },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ],
  Police: [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Police Dashboard', path: '/police', icon: Activity },
    { name: 'Live Map', path: '/map', icon: Map },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ],
}

function Sidebar({ collapsed, setCollapsed, mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const role = user?.role || 'Traveller'
  const navigation = navigationByRole[role] || navigationByRole.Traveller
  const initials =
    user?.name
      ?.split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'RP'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleNavClick = () => {
    if (onCloseMobile) {
      onCloseMobile()
    }
  }

  return (
    <aside
      className={`sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      aria-label="Main navigation"
      role={mobileOpen ? 'dialog' : undefined}
      aria-modal={mobileOpen ? 'true' : undefined}
    >
      <Link to="/dashboard" className="brand" onClick={handleNavClick} aria-label="RakshaPath home">
        <span className="brand-mark">
          <Logo variant="icon" size={34} />
        </span>
        {!collapsed && (
          <span className="brand-text">
            <span className="brand-name">
              <span>Raksha</span>
              <span className="brand-accent">Path</span>
            </span>
          </span>
        )}
      </Link>
      {!collapsed && <p className="sidebar-label">Workspace</p>}
      <nav className="nav-list">
        {navigation.map(({ name, path, icon: Icon }) => (
          <NavLink
            to={path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            key={path}
            onClick={handleNavClick}
            title={collapsed ? name : undefined}
          >
            <span className="nav-icon">
              <Icon size={18} />
            </span>
            {!collapsed && <span>{name}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
          title={collapsed ? 'Settings' : undefined}
        >
          <span className="nav-icon">
            <Settings size={18} />
          </span>
          {!collapsed && <span>Settings</span>}
        </NavLink>
        {!collapsed && (
          <div className="sidebar-user">
            <span className="avatar">{initials}</span>
            <span className="user-meta">
              <strong>{user?.name || 'Traveller'}</strong>
              <span>{role} · Demo account</span>
            </span>
          </div>
        )}
        <button className="nav-item" type="button" onClick={handleLogout} title="Sign out">
          <span className="nav-icon">
            <LogOut size={18} />
          </span>
          {!collapsed && <span>Sign out</span>}
        </button>
        <button
          className="nav-item"
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="nav-icon">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </span>
          {!collapsed && <span>Collapse menu</span>}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
