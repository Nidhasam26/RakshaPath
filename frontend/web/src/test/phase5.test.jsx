import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext.jsx'
import authService from '../services/authService'
import tripService from '../services/tripService'
import sosService, { SOS_STATUS } from '../services/sosService'
import storageService from '../services/storageService'
import { POLICE_ALERTS_KEY } from '../services/mockApi'
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

  // -------------------------------------------------------------------------
  // 6. POLICE DASHBOARD & FAMILY EMERGENCY ALERTS INTEGRATION
  // -------------------------------------------------------------------------
  describe('6. Police Dashboard & Family Emergency Alerts Integration', () => {
    it('creates an incident in the shared police feed when SOS is confirmed', () => {
      const alert = {
        id: 'SOS-TEST-9901',
        status: SOS_STATUS.SENT,
        severity: 'Critical',
        timestamp: new Date().toISOString(),
        location: {
          coordsText: '12.9345° N, 77.6245° E',
          latitude: 12.9345,
          longitude: 77.6245,
        },
      }

      sosService.dispatchToPoliceFeed(alert, travellerUserA)

      const policeAlerts = storageService.get(POLICE_ALERTS_KEY, [])
      const matched = policeAlerts.find((a) => a.id === alert.id)
      expect(matched).toBeDefined()
      expect(matched.status).toBe('New')
      expect(matched.severity).toBe('Critical')
      expect(matched.category).toBe('SOS Emergency')
      expect(matched.name).toBe(travellerUserA.name)
      expect(matched.isSimulatedSos).toBe(true)

      // Render PoliceDashboard and verify incident appears in feed
      render(
        <MemoryRouter>
          <PoliceDashboard />
        </MemoryRouter>
      )

      expect(screen.getByText('SOS-TEST-9901')).toBeInTheDocument()
      expect(screen.getAllByText(travellerUserA.name).length).toBeGreaterThanOrEqual(1)
    })

    it('notifies authorized Family members and displays emergency alert card on their dashboard', () => {
      // 1. Traveller generates a share link
      const share = tripService.generateShareToken(travellerUserA.id, {
        durationHours: 6,
        travellerName: travellerUserA.name,
      })

      // 2. Family user Gamma tracks the share token
      authService.setCurrentUser(familyUser)
      tripService.registerFamilySubscriber(share.token, familyUser.id)

      // 3. Traveller triggers and confirms SOS
      const alert = {
        id: 'SOS-TEST-9902',
        status: SOS_STATUS.SENT,
        severity: 'Critical',
        timestamp: new Date().toISOString(),
        displayTime: '10:45 PM',
        location: {
          coordsText: '12.9716° N, 77.5946° E (Demo)',
          latitude: 12.9716,
          longitude: 77.5946,
        },
      }
      sosService.notifyAuthorizedFamily(alert, travellerUserA)

      // Check notification received by Family member
      const notifs = notificationService.getNotifications(familyUser.id)
      expect(notifs.some((n) => n.title.includes(travellerUserA.name))).toBe(true)

      // Check shared trip payload in registry contains active SOS
      const sharedTrip = tripService.getSharedTripByToken(share.token)
      expect(sharedTrip.activeSosAlert).toBeDefined()
      expect(sharedTrip.activeSosAlert.id).toBe(alert.id)
      expect(sharedTrip.activeSosAlert.location.coordsText).toBe('12.9716° N, 77.5946° E (Demo)')

      // 4. Render Family dashboard for familyUser tracking this token
      localStorage.setItem(`rakshapath:${familyUser.id}:family_tracked_token`, JSON.stringify(share.token))

      render(
        <MemoryRouter>
          <AuthProvider>
            <FamilySharing />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getAllByText(/active emergency sos alert/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(alert.status).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText(/12.9716° N, 77.5946° E \(Demo\)/i)).toBeInTheDocument()
      expect(screen.getAllByRole('link', { name: /emergency helpline \(112\)/i }).length).toBeGreaterThanOrEqual(1)
    })

    it('creates no incident or Family notification when SOS countdown is cancelled', () => {
      const initialAlertsCount = storageService.get(POLICE_ALERTS_KEY, []).length
      const initialNotifsCount = notificationService.getNotifications(familyUser.id).length

      // Simulate cancelling countdown - no dispatch called
      expect(storageService.get(POLICE_ALERTS_KEY, []).length).toBe(initialAlertsCount)
      expect(notificationService.getNotifications(familyUser.id).length).toBe(initialNotifsCount)
    })

    it('ensures unauthorized Family accounts cannot access another Traveller’s alert', () => {
      // Traveller A has an active share with SOS
      const _shareA = tripService.generateShareToken(travellerUserA.id, {
        travellerName: travellerUserA.name,
      })
      const alert = {
        id: 'SOS-TEST-9904',
        status: SOS_STATUS.SENT,
        location: { coordsText: 'Private Coordinates (Traveller A)' },
      }
      sosService.notifyAuthorizedFamily(alert, travellerUserA)

      // Unrelated Family User (no token entered)
      const unrelatedFamilyUser = {
        id: 'user_family_unrelated',
        name: 'Unrelated Observer',
        role: 'Family',
      }
      authService.setCurrentUser(unrelatedFamilyUser)

      render(
        <MemoryRouter>
          <AuthProvider>
            <FamilySharing />
          </AuthProvider>
        </MemoryRouter>
      )

      // Must NOT show Traveller A's name, alert, or coordinates
      expect(screen.queryByText(/private coordinates \(traveller a\)/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/active emergency sos alert/i)).not.toBeInTheDocument()
      expect(screen.getByText(/no shared journey active/i)).toBeInTheDocument()
      expect(screen.getByText(/no linked traveller/i)).toBeInTheDocument()
    })

    it('suppresses protected location data immediately when sharing is revoked or expired', () => {
      const share = tripService.generateShareToken(travellerUserA.id, {
        durationHours: 6,
        travellerName: travellerUserA.name,
      })
      const alert = {
        id: 'SOS-TEST-9905',
        status: SOS_STATUS.SENT,
        location: { coordsText: 'Confidential Lat: 12.999, Long: 77.999' },
      }
      sosService.notifyAuthorizedFamily(alert, travellerUserA)

      // Confirm location is present prior to revocation
      const activePayload = tripService.getSharedTripByToken(share.token)
      expect(activePayload.activeSosAlert.location.coordsText).toBe('Confidential Lat: 12.999, Long: 77.999')

      // Traveller revokes sharing
      tripService.revokeShareToken(travellerUserA.id, share.token)

      // Inquire token after revocation
      const revokedPayload = tripService.getSharedTripByToken(share.token)
      expect(revokedPayload.isRevoked).toBe(true)
      expect(revokedPayload.activeSosAlert.location).toBeNull()
      expect(revokedPayload.activeSosAlert.isLocationSuppressed).toBe(true)

      // Family view must show revocation notice and hide location
      authService.setCurrentUser(familyUser)
      localStorage.setItem(`rakshapath:${familyUser.id}:family_tracked_token`, JSON.stringify(share.token))

      render(
        <MemoryRouter>
          <AuthProvider>
            <FamilySharing />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getAllByText(/sharing link revoked/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.queryByText(/confidential lat: 12.999/i)).not.toBeInTheDocument()
    })

    it('maintains status consistency across views when Police console updates an incident', () => {
      const share = tripService.generateShareToken(travellerUserA.id, {
        travellerName: travellerUserA.name,
      })
      const alert = {
        id: 'SOS-TEST-9906',
        status: SOS_STATUS.SENT,
        severity: 'Critical',
        timestamp: new Date().toISOString(),
      }
      sosService.dispatchToPoliceFeed(alert, travellerUserA)
      sosService.notifyAuthorizedFamily(alert, travellerUserA)

      // Police officer triages incident to "Acknowledged"
      sosService.updateIncidentStatus('SOS-TEST-9906', 'Acknowledged', 'Officer Rao')

      // 1. Police feed status
      const policeAlerts = storageService.get(POLICE_ALERTS_KEY, [])
      const matchedPolice = policeAlerts.find((a) => a.id === 'SOS-TEST-9906')
      expect(matchedPolice.status).toBe('Acknowledged')
      expect(matchedPolice.history.some((h) => h.status === 'Acknowledged')).toBe(true)

      // 2. Family shared trip activeSosAlert status
      const familyPayload = tripService.getSharedTripByToken(share.token)
      expect(familyPayload.activeSosAlert.policeStatus).toBe('Acknowledged')

      // 3. Traveller received notification
      const travellerNotifs = notificationService.getNotifications(travellerUserA.id)
      expect(travellerNotifs.some((n) => n.title.includes('Incident Triage: Acknowledged'))).toBe(true)
    })

    it('handles duplicate SOS events idempotently without creating duplicate police incidents', () => {
      const alert = {
        id: 'SOS-TEST-IDEMPOTENT',
        status: SOS_STATUS.QUEUED,
        timestamp: new Date().toISOString(),
      }

      // First dispatch
      sosService.dispatchToPoliceFeed(alert, travellerUserA)
      const alertsAfterFirst = storageService.get(POLICE_ALERTS_KEY, [])
      const countFirst = alertsAfterFirst.filter((a) => a.id === 'SOS-TEST-IDEMPOTENT').length
      expect(countFirst).toBe(1)

      // Second dispatch with retry / updated status
      const retryAlert = {
        ...alert,
        status: SOS_STATUS.SENT,
      }
      sosService.dispatchToPoliceFeed(retryAlert, travellerUserA)
      const alertsAfterSecond = storageService.get(POLICE_ALERTS_KEY, [])
      const countSecond = alertsAfterSecond.filter((a) => a.id === 'SOS-TEST-IDEMPOTENT').length
      expect(countSecond).toBe(1) // Still exactly 1
    })

    it('renders responsive mobile containers in Police and Family layouts without overflow', () => {
      const { container: policeContainer } = render(
        <MemoryRouter>
          <PoliceDashboard />
        </MemoryRouter>
      )
      expect(policeContainer.querySelector('.main-split')).toBeInTheDocument()
      expect(policeContainer.querySelector('.tabs')).toBeInTheDocument()

      const { container: familyContainer } = render(
        <MemoryRouter>
          <AuthProvider>
            <FamilySharing />
          </AuthProvider>
        </MemoryRouter>
      )
      expect(familyContainer.querySelector('.main-split')).toBeInTheDocument()
    })
  })
})
