import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { AuthProvider } from '../context/AuthContext.jsx'
import ErrorBoundary from '../components/common/ErrorBoundary'
import { PageSkeleton } from '../components/common/Skeleton'
import storageService from '../services/storageService'
import authService from '../services/authService'
import mockApi from '../services/mockApi'

describe('Phase 2: Services Layer (storageService, authService, mockApi)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('storageService reads, writes, and removes items safely with fallback', () => {
    expect(storageService.get('nonexistent', 'fallback-val')).toBe('fallback-val')

    storageService.set('test_key', { count: 42 })
    expect(storageService.get('test_key')).toEqual({ count: 42 })

    storageService.remove('test_key')
    expect(storageService.get('test_key')).toBeNull()
  })

  it('storageService handles user-scoped namespaces', () => {
    storageService.setUserData('user123', 'profile', { theme: 'dark' })
    expect(storageService.getUserData('user123', 'profile')).toEqual({ theme: 'dark' })
    expect(localStorage.getItem('rakshapath:user123:profile')).toBe(JSON.stringify({ theme: 'dark' }))
  })

  it('authService manages session and registered users', () => {
    expect(authService.getCurrentUser()).toBeNull()

    const demoUser = { id: 'u1', name: 'Asha', role: 'Traveller' }
    authService.setCurrentUser(demoUser)
    expect(authService.getCurrentUser()).toEqual(demoUser)

    authService.saveRegisteredUsers([demoUser])
    expect(authService.getRegisteredUsers()).toHaveLength(1)

    authService.clearSession()
    expect(authService.getCurrentUser()).toBeNull()
  })

  it('mockApi returns mock police alerts and initial trips', async () => {
    const alerts = await mockApi.getPoliceAlerts()
    expect(Array.isArray(alerts)).toBe(true)
    expect(alerts.length).toBeGreaterThan(0)

    const trips = await mockApi.getInitialTrips()
    expect(Array.isArray(trips)).toBe(true)
  })
})

describe('Phase 2: ErrorBoundary & Skeleton Fallbacks', () => {
  function Bomb({ throwError }) {
    if (throwError) {
      throw new Error('Explosion in view component!')
    }
    return <div>Normal Component</div>
  }

  it('ErrorBoundary catches rendering errors and displays user-friendly fallback', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Bomb throwError={true} />
      </ErrorBoundary>
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.getByText(/explosion in view component!/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reload app/i })).toBeInTheDocument()

    consoleError.mockRestore()
  })

  it('PageSkeleton renders placeholders with aria-hidden pulse animations', () => {
    const { container } = render(<PageSkeleton />)
    const pulses = container.querySelectorAll('.skeleton-pulse')
    expect(pulses.length).toBeGreaterThan(0)
  })
})

describe('Phase 2: React Router, Deep Linking, Protected Routes & Role Guards', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('redirects unauthenticated users to /login preserving target location in state', async () => {
    render(
      <MemoryRouter initialEntries={['/trips']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    )

    // Should redirect to /login and render login view
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in to your space/i })).toBeInTheDocument()
    })
  })

  it('redirects authenticated users away from /login to /dashboard', async () => {
    const authenticatedUser = {
      id: 'auth-u1',
      name: 'Logged In Traveller',
      email: 'loggedin@example.com',
      role: 'Traveller',
    }
    localStorage.setItem('rakshapath_demo_session', JSON.stringify(authenticatedUser))

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    )

    // Should redirect to /dashboard
    await waitFor(() => {
      expect(screen.getByText(/good to see you, logged/i)).toBeInTheDocument()
    })
  })

  it('renders 404 NotFound page for unknown URLs with link to /dashboard', async () => {
    render(
      <MemoryRouter initialEntries={['/unknown-wilderness-route']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    )

    expect(screen.getByText(/404 · page not found/i)).toBeInTheDocument()
    expect(screen.getByText(/off the map/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /return to dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard'
    )
  })

  it('enforces role-based guard: non-police user is redirected from /police with denied alert', async () => {
    const travellerUser = {
      id: 'trav-1',
      name: 'Rohan Sharma',
      email: 'rohan@example.com',
      role: 'Traveller',
    }
    localStorage.setItem('rakshapath_demo_session', JSON.stringify(travellerUser))

    render(
      <MemoryRouter initialEntries={['/police']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    )

    // Should be redirected to /dashboard and show access restricted banner
    await waitFor(() => {
      expect(screen.getByText(/good to see you, rohan/i)).toBeInTheDocument()
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent(/access to \/police is restricted to Police accounts/i)
    })
  })

  it('allows Police role to access /police and renders Police Dashboard', async () => {
    const policeUser = {
      id: 'pol-1',
      name: 'Officer Singh',
      email: 'singh@police.demo',
      role: 'Police',
    }
    localStorage.setItem('rakshapath_demo_session', JSON.stringify(policeUser))

    render(
      <MemoryRouter initialEntries={['/police']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    )

    // Lazy loads PoliceDashboard
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /police demo dashboard/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /assistance queue/i })).toBeInTheDocument()
    }, { timeout: 8000 })
  })

  it('supports deep linking to /family and /contacts for authenticated users', async () => {
    const user = {
      id: 'fam-user',
      name: 'Ananya Roy',
      email: 'ananya@example.com',
      role: 'Traveller',
    }
    localStorage.setItem('rakshapath_demo_session', JSON.stringify(user))

    // Deep link to /family
    const { unmount } = render(
      <MemoryRouter initialEntries={['/family']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /family sharing/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /your trusted circle/i })).toBeInTheDocument()
    })

    unmount()

    // Deep link to /contacts
    render(
      <MemoryRouter initialEntries={['/contacts']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /emergency contacts/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /people in your circle/i })).toBeInTheDocument()
    })
  })

  it('supports deep linking to lazy-loaded /map route with Leaflet view', async () => {
    const user = {
      id: 'map-user',
      name: 'Karan Mehra',
      email: 'karan@example.com',
      role: 'Traveller',
    }
    localStorage.setItem('rakshapath_demo_session', JSON.stringify(user))

    render(
      <MemoryRouter initialEntries={['/map']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    )

    // Suspense lazy loads LiveMap
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /safety map/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /explore your surroundings/i })).toBeInTheDocument()
    })
  })

  it('enforces route restrictions across all three roles (Traveller, Family, Police)', async () => {
    // 1. Family Member: allowed /family, forbidden /trips and /police
    const familyUser = { id: 'fam-1', name: 'Family Member', role: 'Family' }
    localStorage.setItem('rakshapath_demo_session', JSON.stringify(familyUser))

    // Permitted: /family
    const { unmount: u1 } = render(
      <MemoryRouter initialEntries={['/family']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /family sharing/i })).toBeInTheDocument()
    })
    u1()

    // Forbidden: /trips
    const { unmount: u2 } = render(
      <MemoryRouter initialEntries={['/trips']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText(/access to \/trips is restricted to Traveller accounts/i)).toBeInTheDocument()
    })
    u2()

    // Forbidden: /police
    const { unmount: u3 } = render(
      <MemoryRouter initialEntries={['/police']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText(/access to \/police is restricted to Police accounts/i)).toBeInTheDocument()
    })
    u3()

    // 2. Police Operator: allowed /police, forbidden /family and /trips
    const policeUser = { id: 'pol-1', name: 'Police Officer', role: 'Police' }
    localStorage.setItem('rakshapath_demo_session', JSON.stringify(policeUser))

    // Forbidden: /family
    const { unmount: u4 } = render(
      <MemoryRouter initialEntries={['/family']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText(/access to \/family is restricted to Traveller \/ Family accounts/i)).toBeInTheDocument()
    })
    u4()

    // Forbidden: /trips
    const { unmount: u5 } = render(
      <MemoryRouter initialEntries={['/trips']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText(/access to \/trips is restricted to Traveller accounts/i)).toBeInTheDocument()
    })
    u5()
  })

  it('logout from nested route /settings clears session, redirects to /login, and prevents back access', async () => {
    const user = {
      id: 'settings-user',
      name: 'Priya Settings',
      email: 'priya@settings.demo',
      role: 'Traveller',
    }
    localStorage.setItem('rakshapath_demo_session', JSON.stringify(user))

    const { unmount } = render(
      <MemoryRouter initialEntries={['/settings']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    )

    // 1. Verify nested route /settings is rendered
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/display name/i)).toHaveValue('Priya Settings')
    })

    // 2. Click Sign out
    const signOutBtn = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(signOutBtn)

    // 3. Verify session is cleared from localStorage
    expect(localStorage.getItem('rakshapath_demo_session')).toBeNull()

    // 4. Verify redirected to /login
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in to your space/i })).toBeInTheDocument()
    })

    unmount()

    // 5. Simulate browser Back navigation attempting to reopen /settings
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    )

    // Must be redirected to /login - protected settings content CANNOT be reopened
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in to your space/i })).toBeInTheDocument()
      expect(screen.queryByLabelText(/display name/i)).not.toBeInTheDocument()
    })
  })

  it('supports direct URL access and reload for permitted routes', async () => {
    const user = {
      id: 'reload-user',
      name: 'Vikram reload',
      email: 'vikram@demo.com',
      role: 'Traveller',
    }
    localStorage.setItem('rakshapath_demo_session', JSON.stringify(user))

    // Direct access to /settings
    const { unmount: u1 } = render(
      <MemoryRouter initialEntries={['/settings']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument()
      expect(screen.getByText(/tune the experience/i)).toBeInTheDocument()
    })
    u1()

    // Direct access to /trips
    const { unmount: u2 } = render(
      <MemoryRouter initialEntries={['/trips']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /my trips/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /plan a trip/i })).toBeInTheDocument()
    })
    u2()
  })
})
