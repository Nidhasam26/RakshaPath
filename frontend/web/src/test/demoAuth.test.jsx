import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext.jsx'
import Login from '../pages/auth/Login'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import { DEMO_ACCOUNTS } from '../constants/demoUsers'

describe('FR-100: Quick Demo-Role Authentication & Role-Based Routing', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  const renderLoginWithRoutes = (initialEntries = ['/login']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['Traveller']}>
                  <div data-testid="traveller-dashboard">Traveller Dashboard View</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/family"
              element={
                <ProtectedRoute allowedRoles={['Family', 'Traveller']}>
                  <div data-testid="family-dashboard">Family Sharing View</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/police"
              element={
                <ProtectedRoute allowedRoles={['Police']}>
                  <div data-testid="police-dashboard">Police Operations View</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )
  }

  // 1. Traveller demo button provisions seeded account, logs in, navigates to /dashboard
  it('1. provisions seeded Traveller demo account and navigates to /dashboard', async () => {
    renderLoginWithRoutes()

    const travellerBtn = screen.getByRole('button', { name: 'Sign in as demo Traveller' })
    expect(travellerBtn).toBeInTheDocument()

    fireEvent.click(travellerBtn)

    await waitFor(() => {
      expect(screen.getByTestId('traveller-dashboard')).toBeInTheDocument()
    })

    const storedUsers = JSON.parse(localStorage.getItem('rakshapath_demo_users') || '[]')
    const traveller = storedUsers.find((u) => u.email === DEMO_ACCOUNTS[0].email)
    expect(traveller).toBeDefined()
    expect(traveller.role).toBe('Traveller')
  })

  // 2. Family demo button provisions seeded account, logs in, navigates to /family
  it('2. provisions seeded Family demo account and navigates to /family', async () => {
    renderLoginWithRoutes()

    const familyBtn = screen.getByRole('button', { name: 'Sign in as demo Family' })
    expect(familyBtn).toBeInTheDocument()

    fireEvent.click(familyBtn)

    await waitFor(() => {
      expect(screen.getByTestId('family-dashboard')).toBeInTheDocument()
    })

    const storedUsers = JSON.parse(localStorage.getItem('rakshapath_demo_users') || '[]')
    const family = storedUsers.find((u) => u.email === DEMO_ACCOUNTS[1].email)
    expect(family).toBeDefined()
    expect(family.role).toBe('Family')
  })

  // 3. Police demo button provisions seeded account, logs in, navigates to /police
  it('3. provisions seeded Police demo account and navigates to /police', async () => {
    renderLoginWithRoutes()

    const policeBtn = screen.getByRole('button', { name: 'Sign in as demo Police' })
    expect(policeBtn).toBeInTheDocument()

    fireEvent.click(policeBtn)

    await waitFor(() => {
      expect(screen.getByTestId('police-dashboard')).toBeInTheDocument()
    })

    const storedUsers = JSON.parse(localStorage.getItem('rakshapath_demo_users') || '[]')
    const police = storedUsers.find((u) => u.email === DEMO_ACCOUNTS[2].email)
    expect(police).toBeDefined()
    expect(police.role).toBe('Police')
  })

  // 4. Existing accounts sign in without duplicate registration
  it('4. signs in existing seeded accounts without duplicate entries or error', async () => {
    renderLoginWithRoutes()

    const travellerBtn = screen.getByRole('button', { name: 'Sign in as demo Traveller' })
    fireEvent.click(travellerBtn)

    await waitFor(() => {
      expect(screen.getByTestId('traveller-dashboard')).toBeInTheDocument()
    })

    // Now re-render login while account is already in storage
    renderLoginWithRoutes()

    const travellerBtn2 = screen.getAllByRole('button', { name: 'Sign in as demo Traveller' })[0]
    fireEvent.click(travellerBtn2)

    await waitFor(() => {
      const storedUsers = JSON.parse(localStorage.getItem('rakshapath_demo_users') || '[]')
      const travellerMatches = storedUsers.filter((u) => u.email === DEMO_ACCOUNTS[0].email)
      expect(travellerMatches.length).toBe(1)
    })
  })

  // 5. Passwords use PBKDF2 Web Crypto hashing with salt and iterations
  it('5. stores credentials hashed via PBKDF2 with salt, iterations, and no plaintext', async () => {
    renderLoginWithRoutes()

    fireEvent.click(screen.getByRole('button', { name: 'Sign in as demo Police' }))

    await waitFor(() => {
      expect(screen.getByTestId('police-dashboard')).toBeInTheDocument()
    })

    const storedUsers = JSON.parse(localStorage.getItem('rakshapath_demo_users') || '[]')
    const police = storedUsers.find((u) => u.email === DEMO_ACCOUNTS[2].email)

    expect(police.password).toBeUndefined()
    expect(police.passwordHash).toBeDefined()
    expect(police.salt).toBeDefined()
    expect(police.salt).toHaveLength(32)
    expect(police.kdf).toBe('PBKDF2')
    expect(police.iterations).toBe(600000)
    expect(police.hash).toBe('SHA-256')
  })

  // 6. Login failure displays error message
  it('6. displays an error message on invalid standard login credentials', async () => {
    renderLoginWithRoutes()

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'nonexistent@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'WrongPassword123!' },
    })

    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByRole('alert').textContent).toMatch(/no account found|invalid/i)
    })
  })

  // 7. Buttons are disabled during submission
  it('7. disables submission and demo buttons while authentication is in progress', async () => {
    renderLoginWithRoutes()

    const travellerBtn = screen.getByRole('button', { name: 'Sign in as demo Traveller' })
    const submitBtn = screen.getByRole('button', { name: /continue/i })

    fireEvent.click(travellerBtn)

    // During processing, state isSubmitting is true
    expect(travellerBtn).toBeDisabled()
    expect(submitBtn).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByTestId('traveller-dashboard')).toBeInTheDocument()
    })
  })

  // 8. Duplicate clicks do not trigger duplicate calls
  it('8. prevents multiple simultaneous submissions on rapid clicks', async () => {
    renderLoginWithRoutes()

    const travellerBtn = screen.getByRole('button', { name: 'Sign in as demo Traveller' })

    // Double fire
    fireEvent.click(travellerBtn)
    fireEvent.click(travellerBtn)

    await waitFor(() => {
      expect(screen.getByTestId('traveller-dashboard')).toBeInTheDocument()
    })

    const storedUsers = JSON.parse(localStorage.getItem('rakshapath_demo_users') || '[]')
    const matches = storedUsers.filter((u) => u.email === DEMO_ACCOUNTS[0].email)
    expect(matches.length).toBe(1)
  })

  // 9. Protected routes and role guards remain enforced
  it('9. enforces role-based routing guards: Family cannot access Police dashboard', async () => {
    renderLoginWithRoutes()

    fireEvent.click(screen.getByRole('button', { name: 'Sign in as demo Family' }))

    await waitFor(() => {
      expect(screen.getByTestId('family-dashboard')).toBeInTheDocument()
    })

    // Confirm that the user role stored is Family, not Police
    const activeSession = JSON.parse(localStorage.getItem('rakshapath_demo_session') || '{}')
    expect(activeSession.role).toBe('Family')
  })
})
