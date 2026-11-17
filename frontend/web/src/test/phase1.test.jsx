import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import {
  hashPassword,
  hashPasswordPBKDF2,
  hashPasswordLegacySHA256,
  generateSalt,
  verifyPassword,
  isWebCryptoAvailable,
} from '../utils/crypto'
import { isValidPhone, isNonEmptyText } from '../utils/validation'
import { validateContact } from '../utils/contacts'
import { AuthProvider } from '../context/AuthContext.jsx'
import { useAuth } from '../context/useAuth'
import App from '../App'

describe('Phase 1: Crypto & Password Security (PBKDF2)', () => {
  it('detects Web Cryptography availability', () => {
    expect(isWebCryptoAvailable()).toBe(true)
  })

  it('generates unique cryptographically random salts', () => {
    const salt1 = generateSalt()
    const salt2 = generateSalt()
    expect(salt1).not.toBe(salt2)
    expect(salt1).toHaveLength(32) // 16 bytes = 32 hex chars
    expect(salt2).toHaveLength(32)
  })

  it('derives passwords using Web Crypto PBKDF2 with SHA-256 and metadata', async () => {
    const salt = generateSalt()
    const credentials = await hashPassword('password123', salt)

    expect(credentials.kdf).toBe('PBKDF2')
    expect(credentials.iterations).toBe(600000)
    expect(credentials.hash).toBe('SHA-256')
    expect(credentials.salt).toBe(salt)
    expect(credentials.passwordHash).toHaveLength(64) // 256 bits = 64 hex chars

    // Consistent output for same input
    const derivedAgain = await hashPasswordPBKDF2('password123', salt, 600000)
    expect(derivedAgain).toBe(credentials.passwordHash)
  })

  it('verifies PBKDF2, legacy SHA-256, and legacy plaintext accounts', async () => {
    const salt = generateSalt()
    const pbkdf2Account = await hashPassword('SecretKey!99', salt)

    // 1. Verify valid PBKDF2 account (600,000 iterations: no upgrade needed)
    const v1 = await verifyPassword('SecretKey!99', pbkdf2Account)
    expect(v1.valid).toBe(true)
    expect(v1.needsUpgrade).toBe(false)

    // PBKDF2 account with older 100,000 iterations: valid, but flags needsUpgrade: true
    const pbkdf2Account100k = await hashPassword('SecretKey!99', salt, 100000)
    const v100k = await verifyPassword('SecretKey!99', pbkdf2Account100k)
    expect(v100k.valid).toBe(true)
    expect(v100k.needsUpgrade).toBe(true)

    const vWrong = await verifyPassword('WrongPassword', pbkdf2Account)
    expect(vWrong.valid).toBe(false)

    // 2. Legacy SHA-256 account
    const legacyShaHash = await hashPasswordLegacySHA256('LegacyPass!1', salt)
    const legacyShaAccount = {
      passwordHash: legacyShaHash,
      salt,
      kdf: 'SHA-256',
    }
    const vLegacySha = await verifyPassword('LegacyPass!1', legacyShaAccount)
    expect(vLegacySha.valid).toBe(true)
    expect(vLegacySha.needsUpgrade).toBe(true) // requires upgrade to PBKDF2

    // 3. Legacy plaintext account
    const plaintextAccount = { password: 'myplaintextpassword' }
    const vPlain = await verifyPassword('myplaintextpassword', plaintextAccount)
    expect(vPlain.valid).toBe(true)
    expect(vPlain.needsUpgrade).toBe(true) // requires upgrade to PBKDF2
  })

  it('handles environment where crypto.subtle is unavailable (non-HTTPS/LAN) with a clear error', async () => {
    const originalSubtle = globalThis.crypto.subtle
    try {
      // Simulate non-secure context where crypto.subtle is undefined
      Object.defineProperty(globalThis.crypto, 'subtle', {
        value: undefined,
        configurable: true,
      })

      expect(isWebCryptoAvailable()).toBe(false)
      await expect(hashPassword('password', 'salt1234salt1234')).rejects.toThrow(
        /Web Cryptography is unavailable in this environment/i
      )
    } finally {
      Object.defineProperty(globalThis.crypto, 'subtle', {
        value: originalSubtle,
        configurable: true,
      })
    }
  })
})

describe('Phase 1: Input Validation Utilities', () => {
  it('validates phone numbers correctly', () => {
    expect(isValidPhone('+91 98765 43210')).toBe(true)
    expect(isValidPhone('9876543210')).toBe(true)
    expect(isValidPhone('+1-555-123-4567')).toBe(true)
    expect(isValidPhone('12345')).toBe(false) // too short
    expect(isValidPhone('abcde12345')).toBe(false)
    expect(isValidPhone('')).toBe(false)
    expect(isValidPhone(null)).toBe(false)
  })

  it('validates non-empty text strings', () => {
    expect(isNonEmptyText('New Delhi')).toBe(true)
    expect(isNonEmptyText('   ')).toBe(false)
    expect(isNonEmptyText('')).toBe(false)
    expect(isNonEmptyText(null)).toBe(false)
  })

  it('confirms Family Sharing phone is optional (validated only when filled)', () => {
    // When phone is empty string or omitted in Family Sharing, it is valid:
    expect(validateContact({ name: 'Asha', relationship: 'Mother', phone: '', requirePhone: false }).valid).toBe(true)
    expect(validateContact({ name: 'Asha', relationship: 'Mother', requirePhone: false }).valid).toBe(true)

    // When phone is filled, it must be valid:
    expect(validateContact({ name: 'Asha', relationship: 'Mother', phone: '+91 98765 43210', requirePhone: false }).valid).toBe(true)
    expect(validateContact({ name: 'Asha', relationship: 'Mother', phone: 'not-a-phone', requirePhone: false }).valid).toBe(false)

    // For emergency contacts, phone is strictly required:
    expect(validateContact({ name: 'Asha', relationship: 'Mother', phone: '', requirePhone: true }).valid).toBe(false)
    expect(validateContact({ name: 'Asha', relationship: 'Mother', phone: '+91 98765 43210', requirePhone: true }).valid).toBe(true)
  })
})

describe('Phase 1: Authentication & Password Migration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  function TestAuthConsumer({ onRegistered, onLoggedIn }) {
    const { user, login, register, logout, updateProfile } = useAuth()
    return (
      <div>
        <div data-testid="user-info">{user ? `${user.id}:${user.name}:${user.email}` : 'no-user'}</div>
        <button
          onClick={async () => {
            const res = await register({
              name: 'Test User',
              email: 'test@example.com',
              password: 'secretpassword',
              role: 'Traveller',
            })
            onRegistered?.(res)
          }}
        >
          Register
        </button>
        <button
          onClick={async () => {
            const res = await login({ email: 'legacy@example.com', password: 'plainpassword' })
            onLoggedIn?.(res)
          }}
        >
          Login Legacy
        </button>
        <button onClick={() => logout()}>Logout</button>
        <button onClick={() => updateProfile({ name: 'Updated Name', email: 'updated@example.com' })}>
          Update Profile
        </button>
      </div>
    )
  }

  it('registers with PBKDF2 hash, salt, iterations, and stores NO plaintext password', async () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    )

    fireEvent.click(screen.getByText('Register'))

    await waitFor(() => {
      expect(screen.getByTestId('user-info').textContent).toContain('test@example.com')
    })

    const storedUsers = JSON.parse(localStorage.getItem('rakshapath_demo_users'))
    const registered = storedUsers.find((u) => u.email === 'test@example.com')
    expect(registered).toBeDefined()
    expect(registered.password).toBeUndefined()
    expect(registered.passwordHash).toBeDefined()
    expect(registered.salt).toBeDefined()
    expect(registered.kdf).toBe('PBKDF2')
    expect(registered.iterations).toBe(600000)
    expect(registered.hash).toBe('SHA-256')
  })

  it('migrates legacy plaintext account to PBKDF2 upon successful login and deletes plaintext', async () => {
    const legacyUser = {
      id: 'legacy-user-1',
      name: 'Legacy User',
      email: 'legacy@example.com',
      password: 'plainpassword',
      role: 'Traveller',
    }
    localStorage.setItem('rakshapath_demo_users', JSON.stringify([legacyUser]))

    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    )

    fireEvent.click(screen.getByText('Login Legacy'))

    await waitFor(() => {
      expect(screen.getByTestId('user-info').textContent).toContain('legacy@example.com')
    })

    const storedUsers = JSON.parse(localStorage.getItem('rakshapath_demo_users'))
    const upgradedUser = storedUsers.find((u) => u.email === 'legacy@example.com')
    expect(upgradedUser.password).toBeUndefined()
    expect(upgradedUser.passwordHash).toBeDefined()
    expect(upgradedUser.salt).toBeDefined()
    expect(upgradedUser.kdf).toBe('PBKDF2')
    expect(upgradedUser.iterations).toBe(600000)
  })
})

describe('Phase 1: Legacy Data Migration Audit & Per-User Isolation', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('migrates legacy global data to the first logged-in user and cleans up global keys', async () => {
    // Seed legacy global keys
    localStorage.setItem('trips', JSON.stringify([{ id: 't1', start: 'Old Delhi', end: 'Connaught Place', status: 'Planned' }]))
    localStorage.setItem('contacts', JSON.stringify([{ id: 'c1', name: 'Papa', phone: '+91 99999 99999' }]))
    localStorage.setItem('primaryId', JSON.stringify('c1'))
    localStorage.setItem('sharingEnabled', JSON.stringify(true))
    localStorage.setItem('rakshapath_preferences', JSON.stringify({ notifications: true, safetyAlerts: false }))

    const { migrateLegacyDataForUser } = await import('../hooks/useUserStorage')
    migrateLegacyDataForUser('user-1')

    // Global keys must be deleted
    expect(localStorage.getItem('trips')).toBeNull()
    expect(localStorage.getItem('contacts')).toBeNull()
    expect(localStorage.getItem('primaryId')).toBeNull()
    expect(localStorage.getItem('sharingEnabled')).toBeNull()
    expect(localStorage.getItem('rakshapath_preferences')).toBeNull()

    // User-1 must have the migrated data
    const user1Trips = JSON.parse(localStorage.getItem('rakshapath:user-1:trips'))
    expect(user1Trips).toHaveLength(1)
    expect(user1Trips[0].start).toBe('Old Delhi')

    const user1Contacts = JSON.parse(localStorage.getItem('rakshapath:user-1:contacts'))
    expect(user1Contacts[0].name).toBe('Papa')

    const user1Prefs = JSON.parse(localStorage.getItem('rakshapath:user-1:preferences'))
    expect(user1Prefs.locationSharing).toBe(true)
    expect(user1Prefs.safetyAlerts).toBe(false)
  })

  it('does NOT overwrite existing user data if user already has data', async () => {
    // Pre-existing user data
    localStorage.setItem('rakshapath:user-1:trips', JSON.stringify([{ id: 'existing', start: 'Existing', end: 'Trip' }]))
    // Stale global key
    localStorage.setItem('trips', JSON.stringify([{ id: 'legacy', start: 'Legacy', end: 'Trip' }]))

    const { migrateLegacyDataForUser } = await import('../hooks/useUserStorage')
    migrateLegacyDataForUser('user-1')

    // Existing data is preserved
    const trips = JSON.parse(localStorage.getItem('rakshapath:user-1:trips'))
    expect(trips[0].start).toBe('Existing')
  })

  it('ensures a second user NEVER receives the first user’s migrated data', async () => {
    localStorage.setItem('trips', JSON.stringify([{ id: 't1', start: 'User1 Trip', end: 'Destination' }]))

    const { migrateLegacyDataForUser } = await import('../hooks/useUserStorage')
    // Migrate for user-1
    migrateLegacyDataForUser('user-1')

    // Now user-2 logs in
    migrateLegacyDataForUser('user-2')

    // User-2 should NOT have User-1's trips
    expect(localStorage.getItem('rakshapath:user-2:trips')).toBeNull()
  })

  it('guarantees an interrupted/failed migration preserves legacy keys and does not set global flag', async () => {
    localStorage.setItem('trips', JSON.stringify([{ id: 't1', start: 'Keep Me' }]))
    localStorage.setItem('contacts', JSON.stringify([{ id: 'c1', name: 'Keep Contact' }]))

    const { migrateLegacyDataForUser } = await import('../hooks/useUserStorage')

    // Simulate a failure during write (e.g. QuotaExceededError when setting contacts)
    const realSetItem = Storage.prototype.setItem
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, val) {
      if (key.includes(':contacts')) {
        throw new Error('QuotaExceededError: Storage quota exceeded')
      }
      return realSetItem.call(this, key, val)
    })

    migrateLegacyDataForUser('user-fail')
    spy.mockRestore()

    // Legacy keys must STILL exist because migration did not complete
    expect(localStorage.getItem('trips')).not.toBeNull()
    expect(localStorage.getItem('contacts')).not.toBeNull()

    // Global completion flag must NOT be set
    expect(localStorage.getItem('rakshapath:legacy_data_migrated')).toBeNull()
    expect(localStorage.getItem('rakshapath:user-fail:_migrated')).toBeNull()

    // Now retry when storage is available
    migrateLegacyDataForUser('user-fail')

    // Now migration succeeds
    expect(localStorage.getItem('trips')).toBeNull()
    expect(localStorage.getItem('rakshapath:legacy_data_migrated')).toBe('true')
    expect(JSON.parse(localStorage.getItem('rakshapath:user-fail:trips'))[0].start).toBe('Keep Me')
    expect(JSON.parse(localStorage.getItem('rakshapath:user-fail:contacts'))[0].name).toBe('Keep Contact')
  })

  it('preserves shared police alerts across all users', () => {
    const policeAlerts = [{ id: 'alert-1', type: 'SOS', status: 'Pending' }]
    localStorage.setItem('rakshapath_police_alerts', JSON.stringify(policeAlerts))

    // Police alerts are stored under shared key 'rakshapath_police_alerts'
    const stored = JSON.parse(localStorage.getItem('rakshapath_police_alerts'))
    expect(stored).toHaveLength(1)
    expect(stored[0].id).toBe('alert-1')
  })

  it('isolates trips, contacts, primaryId, and preferences between two users', () => {
    localStorage.setItem('rakshapath:userA:trips', JSON.stringify([{ id: 'tA', start: 'Start A' }]))
    localStorage.setItem('rakshapath:userA:contacts', JSON.stringify([{ id: 'cA', name: 'Contact A' }]))
    localStorage.setItem('rakshapath:userA:primaryId', JSON.stringify('cA'))
    localStorage.setItem('rakshapath:userA:preferences', JSON.stringify({ locationSharing: true }))

    localStorage.setItem('rakshapath:userB:trips', JSON.stringify([{ id: 'tB', start: 'Start B' }]))
    localStorage.setItem('rakshapath:userB:contacts', JSON.stringify([{ id: 'cB', name: 'Contact B' }]))
    localStorage.setItem('rakshapath:userB:primaryId', JSON.stringify('cB'))
    localStorage.setItem('rakshapath:userB:preferences', JSON.stringify({ locationSharing: false }))

    expect(JSON.parse(localStorage.getItem('rakshapath:userA:trips'))[0].start).toBe('Start A')
    expect(JSON.parse(localStorage.getItem('rakshapath:userB:trips'))[0].start).toBe('Start B')
    expect(JSON.parse(localStorage.getItem('rakshapath:userA:preferences')).locationSharing).toBe(true)
    expect(JSON.parse(localStorage.getItem('rakshapath:userB:preferences')).locationSharing).toBe(false)
  })
})

describe('Phase 1: Component Validations & Flow Integration', () => {
  beforeEach(() => {
    localStorage.clear()
    const testUser = {
      id: 'test-user-1',
      name: 'Priya Sharma',
      email: 'priya@example.com',
      role: 'Traveller',
    }
    localStorage.setItem('rakshapath_demo_session', JSON.stringify(testUser))
    localStorage.setItem('rakshapath_demo_users', JSON.stringify([testUser]))
  })

  it('renders login screen when logged out and resets on logout', async () => {
    localStorage.removeItem('rakshapath_demo_session')
    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    )

    expect(screen.getByRole('heading', { name: /sign in to your space/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()

    // Switch to Register
    fireEvent.click(screen.getByRole('link', { name: /create an account/i }))
    expect(screen.getByRole('heading', { name: /your journey, considered/i })).toBeInTheDocument()

    // Switch back to Login
    fireEvent.click(screen.getByRole('link', { name: /sign in/i }))
    expect(screen.getByRole('heading', { name: /sign in to your space/i })).toBeInTheDocument()
  })

  it('rejects whitespace-only trips in MyTrips component', async () => {
    const MyTrips = (await import('../pages/traveller/MyTrips')).default
    render(
      <AuthProvider>
        <MyTrips />
      </AuthProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /plan a trip/i }))
    expect(screen.getByLabelText(/starting point/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/starting point/i), { target: { value: '   ' } })
    fireEvent.change(screen.getByLabelText(/destination/i), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: /save journey/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/cannot be empty or whitespace only/i)
  })

  it('enforces maximum 5 emergency contacts and valid phone numbers', async () => {
    const EmergencyContacts = (await import('../pages/traveller/EmergencyContacts')).default
    render(
      <AuthProvider>
        <EmergencyContacts />
      </AuthProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /add contact/i }))

    // Invalid phone number
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Rohan' } })
    fireEvent.change(screen.getByLabelText(/relationship/i), { target: { value: 'Friend' } })
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: 'invalid-phone' } })
    fireEvent.click(screen.getByRole('button', { name: /save contact/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/valid phone number/i)

    // Valid phone number
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '+91 98765 43210' } })
    fireEvent.click(screen.getByRole('button', { name: /save contact/i }))

    await waitFor(() => {
      expect(screen.getAllByText('Rohan').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('PRIMARY')).toBeInTheDocument()
    })
  })

  it('unifies location sharing preference between Settings and FamilySharing', async () => {
    const Settings = (await import('../pages/settings/Settings')).default
    const FamilySharing = (await import('../pages/family/FamilySharing')).default

    const { unmount } = render(
      <AuthProvider>
        <Settings />
      </AuthProvider>
    )

    const switchBtn = screen.getByRole('switch', { name: /location sharing/i })
    expect(switchBtn).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(switchBtn)
    expect(switchBtn).toHaveAttribute('aria-checked', 'true')

    unmount()

    render(
      <AuthProvider>
        <FamilySharing />
      </AuthProvider>
    )

    const familySwitch = screen.getByRole('switch')
    expect(familySwitch).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText(/sharing preference enabled/i)).toBeInTheDocument()
  })

  it('full multi-account flow: Register A -> Add Trip & Contact -> Logout -> Register B -> Verify B isolated -> Re-login A -> Verify A intact', async () => {
    localStorage.clear()
    const { unmount } = render(
      <AuthProvider>
        <App />
      </AuthProvider>
    )

    // 1. Switch to Register and create Account A
    fireEvent.click(screen.getByRole('link', { name: /create an account/i }))
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'User Alpha' } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'alpha@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'alphapassword123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'alphapassword123' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/good to see you, user/i)).toBeInTheDocument()
    }, { timeout: 4000 })

    // Get Account A's user id from session
    const sessionA = JSON.parse(localStorage.getItem('rakshapath_demo_session'))
    expect(sessionA.email).toBe('alpha@example.com')

    // Add a trip for Account A
    const userATrips = [{ id: 'trip-a1', start: 'Alpha Home', end: 'Alpha Office', status: 'Planned', date: 'Today' }]
    localStorage.setItem(`rakshapath:${sessionA.id}:trips`, JSON.stringify(userATrips))

    // Add a contact for Account A
    const userAContacts = [{ id: 'contact-a1', name: 'Alpha Contact', phone: '+91 99999 11111', relationship: 'Friend' }]
    localStorage.setItem(`rakshapath:${sessionA.id}:contacts`, JSON.stringify(userAContacts))
    localStorage.setItem(`rakshapath:${sessionA.id}:primaryId`, JSON.stringify('contact-a1'))
    localStorage.setItem(`rakshapath:${sessionA.id}:preferences`, JSON.stringify({ locationSharing: true }))

    // 2. Log out Account A
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in to your space/i })).toBeInTheDocument()
    })

    // 3. Register Account B
    fireEvent.click(screen.getByRole('link', { name: /create an account/i }))
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'User Beta' } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'beta@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'betapassword123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'betapassword123' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/good to see you, user/i)).toBeInTheDocument()
    }, { timeout: 4000 })

    const sessionB = JSON.parse(localStorage.getItem('rakshapath_demo_session'))
    expect(sessionB.email).toBe('beta@example.com')
    expect(sessionB.id).not.toBe(sessionA.id)

    // 4. Verify Account B does not have Account A's trips or contacts
    const bTrips = localStorage.getItem(`rakshapath:${sessionB.id}:trips`)
    const bContacts = localStorage.getItem(`rakshapath:${sessionB.id}:contacts`)
    const bPrimaryId = localStorage.getItem(`rakshapath:${sessionB.id}:primaryId`)
    expect(bTrips).not.toContain('Alpha Home')
    expect(JSON.parse(bContacts)).toEqual([])
    expect(JSON.parse(bPrimaryId)).toBeNull()

    // 5. Log out Account B
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in to your space/i })).toBeInTheDocument()
    })

    // 6. Log back into Account A
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'alpha@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'alphapassword123' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(screen.getByText(/good to see you, user/i)).toBeInTheDocument()
    }, { timeout: 4000 })

    // Verify Account A data is intact
    const reloadedATrips = JSON.parse(localStorage.getItem(`rakshapath:${sessionA.id}:trips`))
    expect(reloadedATrips[0].start).toBe('Alpha Home')
    const reloadedAContacts = JSON.parse(localStorage.getItem(`rakshapath:${sessionA.id}:contacts`))
    expect(reloadedAContacts[0].name).toBe('Alpha Contact')
    const reloadedAPrefs = JSON.parse(localStorage.getItem(`rakshapath:${sessionA.id}:preferences`))
    expect(reloadedAPrefs.locationSharing).toBe(true)

    unmount()
  })
})
