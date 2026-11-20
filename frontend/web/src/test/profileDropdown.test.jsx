import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Header from '../components/layout/Header'
import AuthContext from '../context/authContext'

describe('Header & Profile Navigation Dropdown', () => {
  const mockLogout = vi.fn()
  const mockUser = {
    id: 'user-traveller',
    name: 'Priya Sharma',
    email: 'traveller.demo@rakshapath.local',
    role: 'Traveller',
  }

  const renderHeader = (user = mockUser, logout = mockLogout) => {
    return render(
      <AuthContext.Provider
        value={{
          user,
          isAuthenticated: Boolean(user),
          logout,
          login: vi.fn(),
          register: vi.fn(),
          updateProfile: vi.fn(),
        }}
      >
        <MemoryRouter initialEntries={['/dashboard']}>
          <Header mobileMenuOpen={false} onMenuClick={vi.fn()} />
        </MemoryRouter>
      </AuthContext.Provider>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. Removes the DEMO MODE badge from the global application header', () => {
    renderHeader()

    // Assert that DEMO MODE badge is not in the header
    expect(screen.queryByText(/DEMO MODE/i)).toBeNull()
  })

  it('2. Shows Notification Bell and interactive Profile Avatar in header actions', () => {
    renderHeader()

    // Bell button exists
    const bell = screen.getByRole('link', { name: /notifications/i })
    expect(bell).toBeInTheDocument()

    // Avatar button exists with user initials "PS"
    const avatarBtn = screen.getByRole('button', { name: /User account menu for Priya Sharma/i })
    expect(avatarBtn).toBeInTheDocument()
    expect(avatarBtn).toHaveTextContent('PS')
    expect(avatarBtn).toHaveAttribute('aria-expanded', 'false')
    expect(avatarBtn).toHaveAttribute('aria-haspopup', 'menu')
  })

  it('3. Toggles the profile dropdown on avatar click and displays user info', () => {
    renderHeader()

    const avatarBtn = screen.getByRole('button', { name: /User account menu/i })

    // Initially closed
    expect(screen.queryByRole('menu', { name: /Profile navigation options/i })).toBeNull()

    // Click to open
    fireEvent.click(avatarBtn)

    expect(avatarBtn).toHaveAttribute('aria-expanded', 'true')
    const menu = screen.getByRole('menu', { name: /Profile navigation options/i })
    expect(menu).toBeInTheDocument()

    // Displays full name and email
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument()
    expect(screen.getByText('traveller.demo@rakshapath.local')).toBeInTheDocument()
    expect(screen.getByText('Traveller')).toBeInTheDocument()

    // Displays navigation links and logout button
    expect(screen.getByRole('menuitem', { name: /My Profile/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Settings/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Logout/i })).toBeInTheDocument()

    // Click again to close
    fireEvent.click(avatarBtn)
    expect(screen.queryByRole('menu')).toBeNull()
    expect(avatarBtn).toHaveAttribute('aria-expanded', 'false')
  })

  it('4. Closes dropdown when Escape key is pressed and returns focus to avatar button', () => {
    renderHeader()

    const avatarBtn = screen.getByRole('button', { name: /User account menu/i })
    fireEvent.click(avatarBtn)

    expect(screen.getByRole('menu')).toBeInTheDocument()

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })

    expect(screen.queryByRole('menu')).toBeNull()
    expect(avatarBtn).toHaveAttribute('aria-expanded', 'false')
    expect(document.activeElement).toBe(avatarBtn)
  })

  it('5. Closes dropdown when clicking outside', () => {
    renderHeader()

    const avatarBtn = screen.getByRole('button', { name: /User account menu/i })
    fireEvent.click(avatarBtn)

    expect(screen.getByRole('menu')).toBeInTheDocument()

    // Click outside on document body
    fireEvent.mouseDown(document.body)

    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('6. Calls logout and closes dropdown when Logout is clicked', () => {
    renderHeader()

    const avatarBtn = screen.getByRole('button', { name: /User account menu/i })
    fireEvent.click(avatarBtn)

    const logoutBtn = screen.getByRole('menuitem', { name: /Logout/i })
    fireEvent.click(logoutBtn)

    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).toBeNull()
  })
})
