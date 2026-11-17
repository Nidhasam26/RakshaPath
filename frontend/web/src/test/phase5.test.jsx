import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext.jsx'
import authService from '../services/authService'
import tripService from '../services/tripService'
import notificationService, {
  getUserPreferencesKey,
  NOTIFICATION_TYPES,
} from '../services/notificationService'
import ActiveTripTracker from '../components/trips/ActiveTripTracker'
import Notifications from '../pages/notifications/Notifications'
import FamilySharing from '../pages/family/FamilySharing'
import PoliceDashboard from '../pages/police/PoliceDashboard'
import Dashboard from '../pages/traveller/Dashboard'

describe('Phase 5: Trip Monitoring, Controlled Family Sharing, Unified Police Incident Center & Notifications', () => {
  const travellerUserA = {
    id: 'user_traveller_alpha',
    name: 'Ananya Sharma',
    email: 'ananya@example.com',
    role: 'Traveller',
  }

  const familyUser = {
    id: 'user_family_gamma',
    name: 'Suresh Sharma',
    email: 'suresh@example.com',
    role: 'Family',
  }

  beforeEach(() => {
    localStorage.clear()
    authService.setCurrentUser(travellerUserA)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // -------------------------------------------------------------------------
  // 1. ACTIVE TRIP LIFECYCLE & MONITORING
  // -------------------------------------------------------------------------
  describe('1. Active Trip Lifecycle & Monitoring', () => {
    it('starts an active trip and enforces maximum of one active trip per traveller', () => {
      const trip = tripService.startTrip(travellerUserA.id, {
        start: 'Koramangala 5th Block',
        end: 'Indiranagar 100ft Rd',
        distanceKm: 8.4,
        durationMins: 25,
      })

      expect(trip).toBeDefined()
      expect(trip.status).toBe('Active')
      expect(trip.progress).toBe(0)
      expect(trip.remainingKm).toBe(8.4)
      expect(trip.remainingMins).toBe(25)

      // Guard: attempting to start another trip must throw
      expect(() => {
        tripService.startTrip(travellerUserA.id, {
          start: 'MG Road',
          end: 'Whitefield',
        })
      }).toThrow(/already in progress/i)
    })

    it('advances simulated progress and recalculates remaining distance and time', () => {
      tripService.startTrip(travellerUserA.id, {
        start: 'Koramangala',
        end: 'Indiranagar',
        distanceKm: 10,
        durationMins: 30,
      })

      // Tick progress by 25%
      const updated = tripService.tickProgress(travellerUserA.id, 25)
      expect(updated.progress).toBe(25)
      expect(updated.remainingKm).toBe(7.5)
      expect(updated.remainingMins).toBe(23)
      expect(updated.status).toBe('Active')

      // Tick to 100%
      const finished = tripService.tickProgress(travellerUserA.id, 80)
      expect(finished.status).toBe('Completed')
      expect(tripService.getActiveTrip(travellerUserA.id)).toBeNull()
    })

    it('allows pausing, resuming, and ending active trips with auto-archive', () => {
      tripService.startTrip(travellerUserA.id, {
        start: 'Hebbal',
        end: 'Silk Board',
        distanceKm: 18,
        durationMins: 45,
      })

      // Pause
      const paused = tripService.pauseTrip(travellerUserA.id)
      expect(paused.status).toBe('Paused')

      // Resume
      const resumed = tripService.resumeTrip(travellerUserA.id)
      expect(resumed.status).toBe('Active')

      // End trip
      const completed = tripService.endTrip(travellerUserA.id)
      expect(completed.status).toBe('Completed')

      // Active trip must now be cleared
      expect(tripService.getActiveTrip(travellerUserA.id)).toBeNull()

      // Completed trip is archived to user trips storage
      const userTrips = tripService.getUserTrips(travellerUserA.id)
      expect(userTrips.some((t) => t.start === 'Hebbal' && t.status === 'Completed')).toBe(true)
    })

    it('detects hazards along the route within ~5 km proximity and sets advisory', () => {
      tripService.startTrip(travellerUserA.id, {
        start: 'Koramangala 4th Block',
        end: 'Koramangala 6th Block',
        distanceKm: 5.0,
        durationMins: 15,
      })

      // Tick progress to evaluate proximity
      const updated = tripService.tickProgress(travellerUserA.id, 10)
      expect(updated.warnings.length).toBeGreaterThan(0)
      expect(updated.warningTriggered).toBe(true)
    })

    it('renders ActiveTripTracker with semantic progressbar, metrics, and disclaimer', () => {
      const mockTrip = {
        id: 'test-trip-001',
        start: 'Koramangala',
        end: 'Indiranagar',
        progress: 42,
        remainingKm: 5.2,
        remainingMins: 14,
        status: 'Active',
        route: { name: 'Safer Main Arterial', safetyScore: 88 },
        warnings: ['Simulated route advisory: "Construction Caution" approximately 5.2 km ahead on path.'],
        hazardAlert: {
          hazard: { title: 'Construction Caution', category: 'Road Hazard', severity: 'Medium' },
          distanceKm: 5.2,
        },
      }

      render(
        <ActiveTripTracker
          activeTrip={mockTrip}
          onPause={vi.fn()}
          onResume={vi.fn()}
          onEnd={vi.fn()}
        />
      )

      expect(screen.getByRole('region', { name: /active journey monitoring/i })).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42')
      expect(screen.getByText(/simulated movement \(demo\)/i)).toBeInTheDocument()
      expect(screen.getByText('5.2')).toBeInTheDocument()
      expect(screen.getByText('14')).toBeInTheDocument()
      expect(screen.getAllByText(/simulated route advisory/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText(/construction caution/i)).toBeInTheDocument()
      expect(screen.getByText(/no real-world gps tracking or physical vehicle movement/i)).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------------------------
  // 2. CONTROLLED FAMILY SHARING ARCHITECTURE
  // -------------------------------------------------------------------------
  describe('2. Controlled Family Sharing Architecture', () => {
    it('generates a sanitized share token with selectable duration and zero private account data', () => {
      tripService.startTrip(travellerUserA.id, {
        start: 'Koramangala',
        end: 'Whitefield',
        distanceKm: 16,
        durationMins: 40,
      })

      const payload = tripService.generateShareToken(travellerUserA.id, {
        durationHours: 6,
        travellerName: 'Ananya Sharma',
        privacyMode: true,
      })

      expect(payload.token).toMatch(/^SHR-[A-Z0-9]+-[A-Z0-9]+$/)
      expect(payload.expiresAt).toBeDefined()
      expect(payload.start).toBe('Koramangala')
      expect(payload.end).toBe('Whitefield')
      expect(payload.isDemoSimulation).toBe(true)

      // Privacy masking: "Ananya Sharma" -> "Ananya S."
      expect(payload.travellerName).toBe('Ananya S.')

      // STRICT ZERO PRIVATE DATA CHECK:
      // Must NOT contain passwords, emails, phone numbers, or emergency contacts
      expect(payload.password).toBeUndefined()
      expect(payload.email).toBeUndefined()
      expect(payload.phone).toBeUndefined()
      expect(payload.contacts).toBeUndefined()
      expect(payload.emergencyContacts).toBeUndefined()
    })

    it('retrieves sanitized shared telemetry and enforces revocation & expiration', () => {
      const payload = tripService.generateShareToken(travellerUserA.id, {
        durationHours: 2,
        travellerName: 'Ananya Sharma',
      })

      // Lookup by token
      const retrieved = tripService.getSharedTripByToken(payload.token)
      expect(retrieved.token).toBe(payload.token)
      expect(retrieved.status).toBeDefined()

      // Revocation
      tripService.revokeShareToken(travellerUserA.id, payload.token)
      const afterRevoke = tripService.getSharedTripByToken(payload.token)
      expect(afterRevoke.isRevoked).toBe(true)
      expect(afterRevoke.status).toBe('Revoked')

      // Non-existent token
      const missing = tripService.getSharedTripByToken('SHR-INVALID-TOKEN')
      expect(missing.notFound).toBe(true)
    })

    it('simulates a calm 15-minute missed-update condition without auto-escalation or false panic', () => {
      const payload = tripService.generateShareToken(travellerUserA.id, {
        durationHours: 6,
      })

      const missed = tripService.simulateMissedUpdate(payload.token)
      expect(missed.isMissedUpdate).toBe(true)

      const fetched = tripService.getSharedTripByToken(payload.token)
      expect(fetched.isMissedUpdate).toBe(true)
      // Check last updated is in the past (~16 mins ago)
      const diffMinutes = (Date.now() - new Date(fetched.lastUpdated).getTime()) / (60 * 1000)
      expect(diffMinutes).toBeGreaterThanOrEqual(15)
    })

    it('renders FamilySharing page with duration options, privacy notice, and sanitized view', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <FamilySharing />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText(/family sharing/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/link expiration duration/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /generate demo share link/i })).toBeInTheDocument()
      expect(screen.getAllByText(/demo share link/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText(/location sharing preference/i)).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------------------------
  // 3. UNIFIED POLICE INCIDENT CENTER & ANALYTICS
  // -------------------------------------------------------------------------
  describe('3. Unified Police Incident Center & Analytics', () => {
    it('maintains backward compatibility with legacy police alert records and missing fields', () => {
      // Legacy police alerts in LocalStorage without severity or coords
      const legacyAlerts = [
        {
          id: 'POL-LEGACY-001',
          name: 'Priya Rao',
          phone: '+91 98765 00000',
          location: 'Koramangala 5th Block',
          time: '10:30 PM',
          detail: 'Requested immediate patrol check.',
          status: 'New',
        },
      ]
      localStorage.setItem('rakshapath_police_alerts', JSON.stringify(legacyAlerts))

      render(
        <MemoryRouter>
          <PoliceDashboard />
        </MemoryRouter>
      )

      expect(screen.getByText('POL-LEGACY-001')).toBeInTheDocument()
      expect(screen.getAllByText('Priya Rao')[0]).toBeInTheDocument()
      // Should default legacy severity to Critical or Medium without crashing
      expect(screen.getByText(/simulated feed/i)).toBeInTheDocument()
    })

    it('filters incidents by status, severity, and category', () => {
      const sampleAlerts = [
        {
          id: 'ALERT-001',
          name: 'Alert Alpha',
          status: 'New',
          severity: 'Critical',
          category: 'SOS Emergency',
          location: 'MG Road',
          time: '11:00 PM',
        },
        {
          id: 'ALERT-002',
          name: 'Alert Beta',
          status: 'Acknowledged',
          severity: 'Medium',
          category: 'Community Hazard',
          location: 'Whitefield',
          time: '11:15 PM',
        },
      ]
      localStorage.setItem('rakshapath_police_alerts', JSON.stringify(sampleAlerts))

      render(
        <MemoryRouter>
          <PoliceDashboard />
        </MemoryRouter>
      )

      // Filter by status 'Acknowledged'
      const ackTab = screen.getByRole('button', { name: /^acknowledged$/i })
      fireEvent.click(ackTab)

      expect(screen.getAllByText('Alert Beta')[0]).toBeInTheDocument()
      expect(screen.queryByText('Alert Alpha')).not.toBeInTheDocument()

      // Reset to All
      fireEvent.click(screen.getByRole('button', { name: /^all$/i }))
      expect(screen.getAllByText('Alert Alpha')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Alert Beta')[0]).toBeInTheDocument()

      // Filter by Severity
      const sevSelect = screen.getByLabelText(/filter by severity/i)
      fireEvent.change(sevSelect, { target: { value: 'Critical' } })
      expect(screen.getAllByText('Alert Alpha')[0]).toBeInTheDocument()
      expect(screen.queryByText('Alert Beta')).not.toBeInTheDocument()
    })

    it('performs triage actions (Acknowledge, Resolve) and records timestamped audit history', () => {
      const sampleAlerts = [
        {
          id: 'ALERT-TRIAGE-001',
          name: 'Test Citizen',
          phone: '+91 99999 88888',
          status: 'New',
          severity: 'High',
          category: 'SOS Emergency',
          location: 'Indiranagar',
          time: '09:00 PM',
          history: [],
        },
      ]
      localStorage.setItem('rakshapath_police_alerts', JSON.stringify(sampleAlerts))

      render(
        <MemoryRouter>
          <PoliceDashboard />
        </MemoryRouter>
      )

      // Click Acknowledge
      const ackBtn = screen.getByRole('button', { name: /^acknowledge$/i })
      fireEvent.click(ackBtn)

      // The button should now be disabled and status updated
      expect(ackBtn).toBeDisabled()

      // Click Resolve
      const resolveBtn = screen.getByRole('button', { name: /resolve incident/i })
      fireEvent.click(resolveBtn)
      expect(resolveBtn).toBeDisabled()

      // Verify audit history is logged
      expect(screen.getByText(/audit trail & response log/i)).toBeInTheDocument()
      expect(screen.getAllByText(/resolved/i).length).toBeGreaterThanOrEqual(1)
    })
  })

  // -------------------------------------------------------------------------
  // 4. NOTIFICATION CENTER & PREFERENCES
  // -------------------------------------------------------------------------
  describe('4. Notification Center & Preferences', () => {
    it('creates and retrieves notifications across all categories', () => {
      notificationService.addNotification(travellerUserA.id, {
        type: NOTIFICATION_TYPES.HAZARD,
        title: 'Waterlogging Reported',
        message: 'Waterlogging detected 2.1 km ahead.',
        severity: 'Medium',
      })

      notificationService.addNotification(travellerUserA.id, {
        type: NOTIFICATION_TYPES.TRIP,
        title: 'Journey Started',
        message: 'Simulated journey to Indiranagar has begun.',
        severity: 'Low',
      })

      const list = notificationService.getNotifications(travellerUserA.id)
      expect(list).toHaveLength(2)
      expect(list[0].title).toBe('Journey Started') // Latest first
      expect(notificationService.getUnreadCount(travellerUserA.id)).toBe(2)
    })

    it('suppresses notifications according to user preferences', () => {
      // Turn off hazard safetyAlerts in preferences
      const prefsKey = getUserPreferencesKey(travellerUserA.id)
      localStorage.setItem(
        prefsKey,
        JSON.stringify({
          notifications: true,
          safetyAlerts: false, // suppressed
          tripReminders: true,
        })
      )

      const suppressedHazard = notificationService.addNotification(travellerUserA.id, {
        type: NOTIFICATION_TYPES.HAZARD,
        title: 'Suppressed Hazard',
        message: 'This should not appear.',
      })
      expect(suppressedHazard).toBeNull()

      // Trip alert is allowed
      const allowedTrip = notificationService.addNotification(travellerUserA.id, {
        type: NOTIFICATION_TYPES.TRIP,
        title: 'Trip Reminder',
        message: 'Time to prepare for journey.',
      })
      expect(allowedTrip).not.toBeNull()

      // Master notifications switch turned off
      localStorage.setItem(
        prefsKey,
        JSON.stringify({
          notifications: false, // master off
          safetyAlerts: true,
          tripReminders: true,
        })
      )

      const masterOff = notificationService.addNotification(travellerUserA.id, {
        type: NOTIFICATION_TYPES.TRIP,
        title: 'Master Suppressed',
        message: 'Should be suppressed.',
      })
      expect(masterOff).toBeNull()
    })

    it('deduplicates identical notifications sent within 30 seconds', () => {
      const first = notificationService.addNotification(travellerUserA.id, {
        type: NOTIFICATION_TYPES.HAZARD,
        title: 'Pothole Alert',
        message: 'Severe pothole reported ahead.',
      })
      expect(first).not.toBeNull()

      // Immediate duplicate attempt
      const duplicate = notificationService.addNotification(travellerUserA.id, {
        type: NOTIFICATION_TYPES.HAZARD,
        title: 'Pothole Alert',
        message: 'Severe pothole reported ahead.',
      })
      expect(duplicate).toBeNull()

      const list = notificationService.getNotifications(travellerUserA.id)
      expect(list).toHaveLength(1)
    })

    it('marks notifications as read, clears all, and updates unread badge', () => {
      const notif = notificationService.addNotification(travellerUserA.id, {
        type: NOTIFICATION_TYPES.SOS,
        title: 'SOS Dispatched',
        message: 'Emergency telemetry transmitted.',
        severity: 'Critical',
      })

      expect(notificationService.getUnreadCount(travellerUserA.id)).toBe(1)

      notificationService.markAsRead(travellerUserA.id, notif.id)
      expect(notificationService.getUnreadCount(travellerUserA.id)).toBe(0)

      notificationService.clearAll(travellerUserA.id)
      expect(notificationService.getNotifications(travellerUserA.id)).toHaveLength(0)
    })

    it('renders Notifications page with category tabs, empty state, and clear actions', () => {
      notificationService.addNotification(travellerUserA.id, {
        type: NOTIFICATION_TYPES.HAZARD,
        title: 'Active Warning',
        message: 'Road construction near Dairy Circle.',
        severity: 'Medium',
      })

      render(
        <MemoryRouter>
          <AuthProvider>
            <Notifications />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText('Active Warning')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /mark all as read/i })).toBeInTheDocument()

      // Click Clear all
      const clearBtn = screen.getByRole('button', { name: /clear history/i })
      fireEvent.click(clearBtn)

      expect(screen.getByText(/all caught up/i)).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------------------------
  // 5. TRAVELLER & FAMILY DASHBOARD INTELLIGENCE
  // -------------------------------------------------------------------------
  describe('5. Traveller & Family Dashboard Intelligence', () => {
    it('displays dynamic counts for hazards, journeys, and trusted contacts', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <Dashboard />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText(/hazard markers/i)).toBeInTheDocument()
      expect(screen.getByText(/your journeys/i)).toBeInTheDocument()
      expect(screen.getByText(/trusted contacts/i)).toBeInTheDocument()
    })

    it('displays online / offline network connectivity indicator (FR-18)', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <Dashboard />
          </AuthProvider>
        </MemoryRouter>
      )

      // Defaults to online
      expect(screen.getByText(/online · simulated services/i)).toBeInTheDocument()

      // Simulate offline event
      fireEvent(window, new Event('offline'))
      expect(screen.getByText(/offline mode · cached data/i)).toBeInTheDocument()

      // Simulate back online
      fireEvent(window, new Event('online'))
      expect(screen.getByText(/online · simulated services/i)).toBeInTheDocument()
    })

    it('renders destination search bar with popular presets (FR-15)', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <Dashboard />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByLabelText(/plan a safe route/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/where are you heading\?/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /indiranagar 100ft rd/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /whitefield itpl/i })).toBeInTheDocument()
    })

    it('renders dedicated Family Guardian dashboard when role is Family', () => {
      authService.setCurrentUser(familyUser)

      render(
        <MemoryRouter>
          <AuthProvider>
            <Dashboard />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText(/family guardian · overview/i)).toBeInTheDocument()
      expect(screen.getByText(/family guardian portal/i)).toBeInTheDocument()
      expect(screen.getByText(/open family tracking monitor/i)).toBeInTheDocument()
      expect(screen.getByText(/read-only preview for general situational awareness/i)).toBeInTheDocument()
    })
  })
})
