import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import FloatingSosButton from '../emergency/FloatingSosButton'

function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const [prevPathname, setPrevPathname] = useState(location.pathname)

  // Synchronously reset mobile drawer when route changes during render
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname)
    setMobileOpen(false)
  }

  useEffect(() => {
    if (!mobileOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.querySelector('.sidebar.mobile-open .nav-item')?.focus()

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileOpen(false)
      if (event.key === 'Tab') {
        const drawer = document.querySelector('.sidebar.mobile-open')
        const focusable = drawer?.querySelectorAll(
          'button:not(:disabled), a[href], input:not(:disabled), [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable?.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    const closeOnWideScreen = () => window.innerWidth > 820 && setMobileOpen(false)
    document.addEventListener('keydown', closeOnEscape)
    window.addEventListener('resize', closeOnWideScreen)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('resize', closeOnWideScreen)
      document.querySelector('.topbar .mobile-only')?.focus()
    }
  }, [mobileOpen])

  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          className="mobile-nav-backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={`main-column ${collapsed ? 'is-wide' : ''}`}>
        <Header mobileMenuOpen={mobileOpen} onMenuClick={() => setMobileOpen((open) => !open)} />
        <main className="page-content" key={location.pathname}>
          {children || <Outlet />}
        </main>
      </div>
      <FloatingSosButton />
    </div>
  )
}

export default MainLayout
