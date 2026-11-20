import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { AuthProvider } from '../context/AuthContext.jsx'
import authService from '../services/authService'
import storageService from '../services/storageService'
import { sosService, SOS_STATUS, getUserSosHistoryKey } from '../services/sosService'
import { sirenPlayer } from '../utils/sirenAudio'
import { POLICE_ALERTS_KEY } from '../services/mockApi'
import { FakeCallModal } from '../components/emergency/FakeCallModal'
import { SafetyCheckInModal } from '../components/emergency/SafetyCheckInModal'
import { SuspiciousSituationModal } from '../components/emergency/SuspiciousSituationModal'

describe('Phase 3: SOS & Emergency Features (PRD Module H)', () => {
  const travellerUser = {
    id: 'user_traveller_1',
    name: 'Ananya Sharma',
    email: 'ananya@example.com',
    role: 'Traveller',
  }

  const policeUser = {
    id: 'user_police_1',
    name: 'Inspector Vijay',
    email: 'vijay@police.gov.in',
    role: 'Police',
  }

  const familyUser = {
    id: 'user_family_1',
    name: 'Rajesh Sharma',
    email: 'rajesh@example.com',
    role: 'Family',
  }

  beforeEach(() => {
    localStorage.clear()
    sirenPlayer.stop()
  })

  afterEach(() => {
    sirenPlayer.stop()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('1. Persistent Floating SOS Action & Role Segregation', () => {
    it('renders the floating SOS button for Traveller users on protected routes', () => {
      authService.setCurrentUser(travellerUser)
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      const floatingSos = screen.getByRole('link', { name: /activate emergency sos/i })
      expect(floatingSos).toBeInTheDocument()
      expect(floatingSos).toHaveAttribute('href', '/sos')
    })

    it('does NOT render the floating SOS button for Police or Family roles (prevents accidental trigger)', () => {
      authService.setCurrentUser(policeUser)
      const { unmount } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.queryByRole('link', { name: /activate emergency sos/i })).not.toBeInTheDocument()
      unmount()

      authService.setCurrentUser(familyUser)
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )
      expect(screen.queryByRole('link', { name: /activate emergency sos/i })).not.toBeInTheDocument()
    })

    it('does NOT render the floating SOS button when already on /sos page', () => {
      authService.setCurrentUser(travellerUser)
      render(
        <MemoryRouter initialEntries={['/sos']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      // The dedicated SOS page has its own button; floating button must be hidden
      expect(screen.queryByRole('link', { name: /activate emergency sos \(demo\)/i })).not.toBeInTheDocument()
    })

    it('restricts /sos route to Traveller role only (Police redirected to /dashboard)', async () => {
      authService.setCurrentUser(policeUser)
      render(
        <MemoryRouter initialEntries={['/sos']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/restricted to Traveller accounts/i)
      })
    })
  })

  describe('2. Configurable Countdown, Cancellation & Immediate Dispatch Guard', () => {
    it('starts with prominent Demo warnings, default 5s duration, and configurable duration selector', () => {
      authService.setCurrentUser(travellerUser)
      render(
        <MemoryRouter initialEntries={['/sos']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText(/demonstration simulation only · no live 112 dispatch/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start emergency sos countdown/i })).toBeInTheDocument()
      expect(screen.getByText(/5s \(default\)/i)).toBeInTheDocument()

      // Change countdown duration to 3s
      const threeSecBtn = screen.getByRole('button', { name: /3 seconds countdown/i })
      fireEvent.click(threeSecBtn)
      expect(screen.getByText(/tap once to begin 3-second countdown/i)).toBeInTheDocument()
    })

    it('initiates countdown when activated and allows user to cancel before confirmation', async () => {
      authService.setCurrentUser(travellerUser)

      render(
        <MemoryRouter initialEntries={['/sos']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      const startBtn = screen.getByRole('button', { name: /start emergency sos countdown/i })
      fireEvent.click(startBtn)

      // Countdown screen displayed
      expect(screen.getByText(/sos countdown in progress/i)).toBeInTheDocument()
      expect(screen.getAllByText(/seconds/i)[0]).toBeInTheDocument()

      // Click Cancel SOS button
      const cancelBtn = screen.getByRole('button', { name: /cancel sos/i })
      fireEvent.click(cancelBtn)

      // Verified: State transitions to cancelled and no alert is triggered
      expect(screen.getByText(/sos countdown cancelled/i)).toBeInTheDocument()
      expect(screen.getByText(/no emergency alert was prepared or transmitted/i)).toBeInTheDocument()
    })

    it('requires explicit confirmation before immediate demo bypass to prevent accidental activation', async () => {
      authService.setCurrentUser(travellerUser)

      render(
        <MemoryRouter initialEntries={['/sos']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      fireEvent.click(screen.getByRole('button', { name: /start emergency sos countdown/i }))

      // First click on demo testing shortcut: shows confirmation prompt
      const shortcutBtn = screen.getByRole('button', { name: /skip countdown demo shortcut/i })
      fireEvent.click(shortcutBtn)

      expect(screen.getByText(/confirm immediate test dispatch\?/i)).toBeInTheDocument()

      // Confirm dispatch
      const confirmDispatchBtn = screen.getByRole('button', { name: /dispatch now \(demo\)/i })
      fireEvent.click(confirmDispatchBtn)

      // Advances through Prepared -> Queued -> Sent
      expect(await screen.findByText(/status: prepared/i)).toBeInTheDocument()
      expect(await screen.findByText(/status: queued/i, {}, { timeout: 8000 })).toBeInTheDocument()
      expect(await screen.findByText(/status: sent \(simulated\)/i, {}, { timeout: 8000 })).toBeInTheDocument()

      // Strict validation: NEVER display "Delivered"
      const fullText = document.body.textContent
      expect(fullText).not.toMatch(/\bDelivered\b/i)
      expect(fullText).toContain(SOS_STATUS.SENT)
    })
  })

  describe('3. Offline Handling, UI Accuracy & Duplicate Prevention on Retry', () => {
    it('does NOT falsely claim Sent when offline; stays Queued locally', async () => {
      vi.stubGlobal('navigator', {
        ...navigator,
        onLine: false,
      })

      authService.setCurrentUser(travellerUser)
      render(
        <MemoryRouter initialEntries={['/sos']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText(/offline mode detected/i)).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /start emergency sos countdown/i }))
      fireEvent.click(screen.getByRole('button', { name: /skip countdown demo shortcut/i }))
      fireEvent.click(screen.getByRole('button', { name: /dispatch now \(demo\)/i }))

      // Status 1: Prepared
      expect(await screen.findByText(/status: prepared/i)).toBeInTheDocument()
      // Status 2: Queued (Offline)
      expect(await screen.findByText(/status: queued/i, {}, { timeout: 8000 })).toBeInTheDocument()
      expect(screen.getByText(/alert queued \(offline\)/i)).toBeInTheDocument()

      // Verified: Status NEVER advanced to "Sent" while offline
      expect(screen.queryByText(/status: sent/i)).not.toBeInTheDocument()

      // Retry while still offline: remains queued
      const retryBtn = screen.getByRole('button', { name: /retry transmission \(demo\)/i })
      fireEvent.click(retryBtn)
      expect(screen.getByText(/transmission retried while offline/i)).toBeInTheDocument()
    })

    it('advances to Sent upon retry after connection is restored and avoids duplicate records', async () => {
      // Start offline
      vi.stubGlobal('navigator', {
        ...navigator,
        onLine: false,
      })

      authService.setCurrentUser(travellerUser)
      render(
        <MemoryRouter initialEntries={['/sos']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      fireEvent.click(screen.getByRole('button', { name: /start emergency sos countdown/i }))
      fireEvent.click(screen.getByRole('button', { name: /skip countdown demo shortcut/i }))
      fireEvent.click(screen.getByRole('button', { name: /dispatch now \(demo\)/i }))

      await screen.findByText(/status: queued/i, {}, { timeout: 8000 })

      // Check user history: exactly 1 item recorded with status Queued
      let history = sosService.getHistory(travellerUser.id)
      expect(history).toHaveLength(1)
      expect(history[0].status).toBe(SOS_STATUS.QUEUED)

      // Connection restored
      vi.stubGlobal('navigator', {
        ...navigator,
        onLine: true,
      })
      fireEvent(window, new Event('online'))

      // Click retry
      const retryBtn = screen.getByRole('button', { name: /retry transmission \(demo\)/i })
      fireEvent.click(retryBtn)

      // Verified: status transitions to Sent
      expect(await screen.findByText(/status: sent \(simulated\)/i)).toBeInTheDocument()

      // Click retry a second time to test idempotency
      fireEvent.click(retryBtn)

      // Verified: User history still has exactly 1 item (updated, NOT duplicated)
      history = sosService.getHistory(travellerUser.id)
      expect(history).toHaveLength(1)
      expect(history[0].status).toBe(SOS_STATUS.SENT)

      // Verified: Police alerts store has exactly 1 alert for this incident (NOT duplicated)
      const policeAlerts = storageService.get(POLICE_ALERTS_KEY, [])
      const matchedAlerts = policeAlerts.filter((a) => a.id === history[0].id)
      expect(matchedAlerts).toHaveLength(1)
    })
  })

  describe('4. Police Integration, Triage & Privacy Safeguards', () => {
    it('dispatches simulated alert to Police feed, allows Police triage, and sanitizes private user data', async () => {
      // 1. Traveller triggers alert
      authService.setCurrentUser(travellerUser)
      const { unmount } = render(
        <MemoryRouter initialEntries={['/sos']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      fireEvent.click(screen.getByRole('button', { name: /start emergency sos countdown/i }))
      fireEvent.click(screen.getByRole('button', { name: /skip countdown demo shortcut/i }))
      fireEvent.click(screen.getByRole('button', { name: /dispatch now \(demo\)/i }))

      await screen.findByText(/status: sent \(simulated\)/i, {}, { timeout: 8000 })
      unmount()

      // 2. Check Police alert payload privacy: must NOT expose user's login email
      const policeAlerts = storageService.get(POLICE_ALERTS_KEY, [])
      const newAlert = policeAlerts.find((a) => a.isSimulatedSos)
      expect(newAlert).toBeDefined()
      expect(newAlert.phone).not.toContain(travellerUser.email)
      expect(newAlert.phone).toContain('Demo Contact')

      // 3. Police logs in and reviews assistance queue
      authService.setCurrentUser(policeUser)
      render(
        <MemoryRouter initialEntries={['/police']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      // Find the traveller's alert in the queue
      const alertNameElements = await screen.findAllByText(travellerUser.name)
      expect(alertNameElements.length).toBeGreaterThan(0)

      // Police clicks Acknowledge triage action
      const ackButton = screen.getByRole('button', { name: /^acknowledge$/i })
      fireEvent.click(ackButton)

      // Status in police store transitions to Acknowledged
      await waitFor(() => {
        const updatedAlerts = storageService.get(POLICE_ALERTS_KEY, [])
        const acked = updatedAlerts.find((a) => a.id === newAlert.id)
        expect(acked.status).toBe('Acknowledged')
      })
    })

    it('isolates User A SOS history from User B', () => {
      sosService.addHistoryItem(travellerUser.id, {
        id: 'SOS-USER-A-01',
        status: SOS_STATUS.SENT,
        timestamp: new Date().toISOString(),
      })

      expect(sosService.getHistory(travellerUser.id)).toHaveLength(1)
      expect(sosService.getHistory(travellerUser.id)[0].id).toBe('SOS-USER-A-01')

      // User B has 0 items
      const userB = { id: 'user_traveller_2', name: 'Rohan', role: 'Traveller' }
      expect(sosService.getHistory(userB.id)).toEqual([])

      expect(getUserSosHistoryKey(travellerUser.id)).toBe('rakshapath:user_traveller_1:sos_history')
      expect(getUserSosHistoryKey(userB.id)).toBe('rakshapath:user_traveller_2:sos_history')
    })
  })

  describe('5. Geolocation Integration & Error Recovery', () => {
    it('gracefully handles location permission denial without crashing', async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((_success, error) => {
          error({ code: 1, PERMISSION_DENIED: 1, message: 'User denied geolocation' })
        }),
      }
      vi.stubGlobal('navigator', {
        ...navigator,
        geolocation: mockGeolocation,
      })

      authService.setCurrentUser(travellerUser)
      render(
        <MemoryRouter initialEntries={['/sos']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      fireEvent.click(screen.getByRole('button', { name: /start emergency sos countdown/i }))
      fireEvent.click(screen.getByRole('button', { name: /skip countdown demo shortcut/i }))
      fireEvent.click(screen.getByRole('button', { name: /dispatch now \(demo\)/i }))

      await screen.findByText(/status: sent \(simulated\)/i, {}, { timeout: 8000 })
      expect(screen.getAllByText(/location unavailable \(demo\)/i)[0]).toBeInTheDocument()
    })

    it('records coordinates when geolocation succeeds', async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success) => {
          success({
            coords: {
              latitude: 28.6139,
              longitude: 77.209,
              accuracy: 15,
            },
            timestamp: Date.now(),
          })
        }),
      }
      vi.stubGlobal('navigator', {
        ...navigator,
        geolocation: mockGeolocation,
      })

      authService.setCurrentUser(travellerUser)
      render(
        <MemoryRouter initialEntries={['/sos']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      fireEvent.click(screen.getByRole('button', { name: /start emergency sos countdown/i }))
      fireEvent.click(screen.getByRole('button', { name: /skip countdown demo shortcut/i }))
      fireEvent.click(screen.getByRole('button', { name: /dispatch now \(demo\)/i }))

      await screen.findByText(/status: sent \(simulated\)/i, {}, { timeout: 8000 })
      expect(screen.getAllByText(/28.6139° n, 77.2090° e/i)[0]).toBeInTheDocument()
    })
  })

  describe('6. Emergency Assistance Tools (Siren, Fake Call, Check-In, Suspicious)', () => {
    it('provides a Call 112 phone dialler link with explicit disclaimer', () => {
      authService.setCurrentUser(travellerUser)
      render(
        <MemoryRouter initialEntries={['/sos']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      const callLinks = screen.getAllByRole('link', { name: /call 112/i })
      expect(callLinks.length).toBeGreaterThan(0)
      expect(callLinks[0]).toHaveAttribute('href', 'tel:112')
    })

    it('starts demonstration siren silent and toggles cleanly', () => {
      expect(sirenPlayer.getStatus()).toBe(false)

      const startSpy = vi.spyOn(sirenPlayer, 'start')
      const stopSpy = vi.spyOn(sirenPlayer, 'stop')

      authService.setCurrentUser(travellerUser)
      render(
        <MemoryRouter initialEntries={['/sos']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      const sirenBtn = screen.getByRole('button', { name: /start siren/i })
      fireEvent.click(sirenBtn)
      expect(startSpy).toHaveBeenCalledTimes(1)

      const stopBtn = screen.getByRole('button', { name: /stop siren/i })
      fireEvent.click(stopBtn)
      expect(stopSpy).toHaveBeenCalledTimes(1)
    })

    it('activates siren on SOS countdown and stops on cancel or silence', () => {
      const startSpy = vi.spyOn(sirenPlayer, 'start')
      const stopSpy = vi.spyOn(sirenPlayer, 'stop')

      authService.setCurrentUser(travellerUser)
      render(
        <MemoryRouter initialEntries={['/sos']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      // Start SOS Countdown
      const sosBtn = screen.getByRole('button', { name: /start emergency sos countdown/i })
      fireEvent.click(sosBtn)
      expect(startSpy).toHaveBeenCalled()

      // Silence Siren button is present and stops audio
      const silenceBtn = screen.getByRole('button', { name: /silence siren audio/i })
      expect(silenceBtn).toBeInTheDocument()
      fireEvent.click(silenceBtn)
      expect(stopSpy).toHaveBeenCalled()

      // Cancel SOS stops siren
      const cancelBtn = screen.getByRole('button', { name: /cancel sos/i })
      fireEvent.click(cancelBtn)
      expect(stopSpy).toHaveBeenCalled()
    })

    it('triggers Fake Call modal, supports answering, and closes on Escape', () => {
      const handleClose = vi.fn()
      render(<FakeCallModal callerName="Papa" onClose={handleClose} />)

      expect(screen.getByText(/incoming simulated call/i)).toBeInTheDocument()
      expect(screen.getByText('Papa')).toBeInTheDocument()

      // Answer call
      const acceptBtn = screen.getByLabelText(/accept fake call/i)
      fireEvent.click(acceptBtn)
      expect(screen.getByText(/connected/i)).toBeInTheDocument()

      // Press Escape to close
      fireEvent.keyDown(window, { key: 'Escape' })
      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('triggers Safety Check-In modal, confirms safe check-in, and closes on Escape', () => {
      const handleClose = vi.fn()
      render(<SafetyCheckInModal onClose={handleClose} defaultMinutes={10} />)

      expect(screen.getByText(/safety check-in/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /i am safe/i })).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /i am safe/i }))
      expect(screen.getByText(/check-in confirmed/i)).toBeInTheDocument()

      fireEvent.keyDown(window, { key: 'Escape' })
      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('triggers Suspicious Situation modal with flashlight, stealth mode, and closes on Escape', () => {
      const handleClose = vi.fn()
      render(<SuspiciousSituationModal onClose={handleClose} />)

      expect(screen.getByText(/following me \/ suspicious situation/i)).toBeInTheDocument()

      const flashlightBtn = screen.getByRole('button', { name: /high-visibility screen flash/i })
      fireEvent.click(flashlightBtn)
      expect(screen.getByText('ON')).toBeInTheDocument()

      const callLink = screen.getByRole('link', { name: /call emergency services/i })
      expect(callLink).toHaveAttribute('href', 'tel:112')

      fireEvent.keyDown(window, { key: 'Escape' })
      expect(handleClose).toHaveBeenCalledTimes(1)
    })
  })
})
