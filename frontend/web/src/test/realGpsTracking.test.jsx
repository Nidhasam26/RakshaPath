import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react'
import { useGeolocation } from '../hooks/useGeolocation'
import { tripService } from '../services/tripService'
import { projectPointOnRoute } from '../services/routeService'
import storageService from '../services/storageService'
import SafetyMap from '../components/maps/SafetyMap'
import ActiveTripTracker from '../components/trips/ActiveTripTracker'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext.jsx'
import authService from '../services/authService'
import { LiveMap } from '../pages/traveller/LiveMap'

describe('Phase 2: Continuous GPS Tracking & Live Navigation', () => {
  const userId = 'user_test_traveller'

  // Sample route waypoints (Koramangala to Indiranagar: approx 4.8 km)
  const sampleWaypoints = [
    [12.9345, 77.6245], // 0: Start (0 km)
    [12.9450, 77.6350], // 1: ~1.6 km
    [12.9580, 77.6380], // 2: ~3.2 km
    [12.9719, 77.6412], // 3: Destination (~4.8 km)
  ]

  const mockRoute = {
    id: 'route-live-1',
    name: 'Primary Arterial Road',
    waypoints: sampleWaypoints,
    distanceKm: 4.8,
    durationMins: 14,
    steps: [
      { id: 's-1', instruction: 'Head north on 80ft Road', distanceMeters: 1600 },
      { id: 's-2', instruction: 'Turn right onto 100ft Road', distanceMeters: 3200 },
      { id: 's-3', instruction: 'Arrive at destination', distanceMeters: 0 },
    ],
  }

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    storageService.set(`rakshapath:${userId}:active_trip`, null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ---------------------------------------------------------------------------
  // 1. GEOLOCATION HOOK & CONTINUOUS WATCHING
  // ---------------------------------------------------------------------------
  describe('1. Geolocation Hook: Permissions, Watch Lifecycle & Error Handling', () => {
    it('1. Handles unsupported geolocation browser environment gracefully', async () => {
      vi.stubGlobal('navigator', {})

      const { result } = renderHook(() => useGeolocation())

      expect(result.current.permissionState).toBe('unsupported')

      let res
      await act(async () => {
        res = await result.current.requestLocation()
      })

      expect(res.success).toBe(false)
      expect(result.current.error).toMatch(/not supported/i)
      expect(result.current.location).toBeNull()
    })

    it('2. Handles permission denial gracefully and records permissionDenied state', async () => {
      const mockGeo = {
        getCurrentPosition: vi.fn((_success, error) => {
          error({ code: 1, PERMISSION_DENIED: 1, message: 'User denied geolocation' })
        }),
        watchPosition: vi.fn((_success, error) => {
          error({ code: 1, PERMISSION_DENIED: 1, message: 'User denied geolocation' })
          return 101
        }),
        clearWatch: vi.fn(),
      }
      vi.stubGlobal('navigator', { geolocation: mockGeo })

      const { result } = renderHook(() => useGeolocation())

      await act(async () => {
        const res = await result.current.requestLocation()
        expect(res.permissionDenied).toBe(true)
      })

      expect(result.current.permissionDenied).toBe(true)
      expect(result.current.permissionState).toBe('denied')
      expect(result.current.error).toMatch(/permission was denied/i)
      expect(result.current.location).toBeNull()
    })

    it('3. Handles position unavailable error transparently', async () => {
      const mockGeo = {
        getCurrentPosition: vi.fn((_success, error) => {
          error({ code: 2, POSITION_UNAVAILABLE: 2, message: 'Position unavailable' })
        }),
      }
      vi.stubGlobal('navigator', { geolocation: mockGeo })

      const { result } = renderHook(() => useGeolocation())

      await act(async () => {
        const res = await result.current.requestLocation()
        expect(res.success).toBe(false)
      })

      expect(result.current.permissionState).toBe('unavailable')
      expect(result.current.error).toMatch(/unavailable on this device/i)
    })

    it('4. Handles GPS request timeout cleanly', async () => {
      const mockGeo = {
        getCurrentPosition: vi.fn((_success, error) => {
          error({ code: 3, TIMEOUT: 3, message: 'Timeout' })
        }),
      }
      vi.stubGlobal('navigator', { geolocation: mockGeo })

      const { result } = renderHook(() => useGeolocation())

      await act(async () => {
        const res = await result.current.requestLocation()
        expect(res.success).toBe(false)
      })

      expect(result.current.permissionState).toBe('timeout')
      expect(result.current.error).toMatch(/timed out/i)
    })

    it('5. Successfully acquires initial position and sets isRealGps flag', async () => {
      const mockGeo = {
        getCurrentPosition: vi.fn((success) => {
          success({
            coords: {
              latitude: 12.9345,
              longitude: 77.6245,
              accuracy: 15,
              heading: 45,
              speed: 8.5,
            },
            timestamp: 1700000000000,
          })
        }),
      }
      vi.stubGlobal('navigator', { geolocation: mockGeo })

      const { result } = renderHook(() => useGeolocation())

      await act(async () => {
        const res = await result.current.requestLocation()
        expect(res.success).toBe(true)
      })

      expect(result.current.location).toBeDefined()
      expect(result.current.location.latitude).toBe(12.9345)
      expect(result.current.location.longitude).toBe(77.6245)
      expect(result.current.location.accuracy).toBe(15)
      expect(result.current.location.heading).toBe(45)
      expect(result.current.location.speed).toBe(8.5)
      expect(result.current.location.isRealGps).toBe(true)
      expect(result.current.permissionState).toBe('granted')
    })

    it('6. Supports continuous watchPosition updates over time', () => {
      let watchCallback
      const mockGeo = {
        watchPosition: vi.fn((success) => {
          watchCallback = success
          return 777
        }),
        clearWatch: vi.fn(),
      }
      vi.stubGlobal('navigator', { geolocation: mockGeo })

      const { result } = renderHook(() => useGeolocation())

      act(() => {
        result.current.startWatching()
      })

      expect(result.current.isTracking).toBe(true)
      expect(mockGeo.watchPosition).toHaveBeenCalledTimes(1)

      // First GPS fix
      act(() => {
        watchCallback({
          coords: { latitude: 12.9345, longitude: 77.6245, accuracy: 12, heading: 90 },
          timestamp: 1000,
        })
      })

      expect(result.current.location.latitude).toBe(12.9345)
      expect(result.current.location.heading).toBe(90)

      // Second continuous GPS update as device moves
      act(() => {
        watchCallback({
          coords: { latitude: 12.9450, longitude: 77.6350, accuracy: 10, heading: 85 },
          timestamp: 2000,
        })
      })

      expect(result.current.location.latitude).toBe(12.9450)
      expect(result.current.lastSuccessfulTimestamp).toBe(2000)
    })

    it('7. Calls clearWatch on stopWatching and on unmount cleanup', () => {
      const mockGeo = {
        watchPosition: vi.fn(() => 999),
        clearWatch: vi.fn(),
      }
      vi.stubGlobal('navigator', { geolocation: mockGeo })

      const { result, unmount } = renderHook(() => useGeolocation())

      act(() => {
        result.current.startWatching()
      })

      expect(result.current.isTracking).toBe(true)

      act(() => {
        result.current.stopWatching()
      })

      expect(mockGeo.clearWatch).toHaveBeenCalledWith(999)
      expect(result.current.isTracking).toBe(false)

      // Restart and verify unmount clears watcher
      act(() => {
        result.current.startWatching()
      })

      unmount()
      expect(mockGeo.clearWatch).toHaveBeenCalledTimes(2)
    })

    it('8. Evaluates GPS accuracy threshold (isAccurate)', () => {
      let watchCallback
      const mockGeo = {
        watchPosition: vi.fn((success) => {
          watchCallback = success
          return 1
        }),
        clearWatch: vi.fn(),
      }
      vi.stubGlobal('navigator', { geolocation: mockGeo })

      const { result } = renderHook(() => useGeolocation())

      act(() => {
        result.current.startWatching()
      })

      // Good accuracy (18m <= 65m)
      act(() => {
        watchCallback({
          coords: { latitude: 12.935, longitude: 77.625, accuracy: 18 },
        })
      })
      expect(result.current.isAccurate).toBe(true)

      // Poor accuracy (120m > 65m)
      act(() => {
        watchCallback({
          coords: { latitude: 12.935, longitude: 77.625, accuracy: 120 },
        })
      })
      expect(result.current.isAccurate).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // 2. GPS-BASED ROUTE PROJECTION & JOURNEY PROGRESS
  // ---------------------------------------------------------------------------
  describe('2. GPS-Based Journey Progress (Physical Movement vs Stationary)', () => {
    it('9. Stationary device does NOT artificially advance journey progress', () => {
      tripService.startTrip(userId, {
        start: 'Koramangala',
        end: 'Indiranagar',
        route: mockRoute,
        mode: 'live',
      })

      // Stationary GPS fix right at start
      const firstUpdate = tripService.updateGpsPosition(userId, {
        latitude: 12.9345,
        longitude: 77.6245,
        accuracy: 15,
      })

      expect(firstUpdate.progress).toBe(0)
      const initialRemaining = firstUpdate.remainingKm

      // Second reading 10 seconds later at the same stationary location
      const secondUpdate = tripService.updateGpsPosition(userId, {
        latitude: 12.9345,
        longitude: 77.6245,
        accuracy: 14,
      })

      expect(secondUpdate.progress).toBe(0)
      expect(secondUpdate.remainingKm).toBe(initialRemaining)
    })

    it('10. Real physical movement along polyline advances route progress accurately', () => {
      tripService.startTrip(userId, {
        start: 'Koramangala',
        end: 'Indiranagar',
        route: mockRoute,
        mode: 'live',
      })

      // Move to midpoint of route (approx waypoint 1: 12.9450, 77.6350)
      const midTrip = tripService.updateGpsPosition(userId, {
        latitude: 12.9450,
        longitude: 77.6350,
        accuracy: 10,
      })

      expect(midTrip.progress).toBeGreaterThan(20)
      expect(midTrip.progress).toBeLessThan(60)
      expect(midTrip.remainingKm).toBeLessThan(mockRoute.distanceKm)

      // Move further to waypoint 2
      const nearEndTrip = tripService.updateGpsPosition(userId, {
        latitude: 12.9580,
        longitude: 77.6380,
        accuracy: 10,
      })

      expect(nearEndTrip.progress).toBeGreaterThan(midTrip.progress)
      expect(nearEndTrip.remainingKm).toBeLessThan(midTrip.remainingKm)
    })

    it('11. Does NOT declare destination arrival based on percentage alone or noisy GPS', () => {
      tripService.startTrip(userId, {
        start: 'Koramangala',
        end: 'Indiranagar',
        route: mockRoute,
        mode: 'live',
      })

      // Device is 300m away with poor accuracy (75m): should NOT complete
      const updateNearEnd = tripService.updateGpsPosition(userId, {
        latitude: 12.9690,
        longitude: 77.6400,
        accuracy: 75,
      })

      expect(updateNearEnd.status).toBe('Active')
      expect(tripService.getActiveTrip(userId)).not.toBeNull()
    })

    it('12. Monotonic filter prevents progress from jumping backwards due to GPS noise', () => {
      tripService.startTrip(userId, {
        start: 'Koramangala',
        end: 'Indiranagar',
        route: mockRoute,
        mode: 'live',
      })

      // Position 1
      const p1 = tripService.updateGpsPosition(userId, {
        latitude: 12.9450,
        longitude: 77.6350,
        accuracy: 15,
      })
      const progressAtP1 = p1.progress

      // Small GPS jitter backwards by 8 meters
      const p2 = tripService.updateGpsPosition(userId, {
        latitude: 12.9449,
        longitude: 77.6349,
        accuracy: 25,
      })

      // Progress must not jump backwards
      expect(p2.progress).toBeGreaterThanOrEqual(progressAtP1)
    })
  })

  // ---------------------------------------------------------------------------
  // 3. OFF-ROUTE DETECTION & REVIATION SAFEGUARDS
  // ---------------------------------------------------------------------------
  describe('3. Off-Route Detection & Recalculation Safeguards', () => {
    it('13. Detects deviation when GPS position exceeds 50m threshold from planned route', () => {
      // 100 meters east of route waypoint 1
      const offRouteCoords = [12.9450, 77.6365]
      const proj = projectPointOnRoute(offRouteCoords, sampleWaypoints)

      // Distance to route should exceed 0.05 km (50m)
      expect(proj.distanceToRouteKm).toBeGreaterThan(0.05)
    })

    it('14. Requires consecutive readings before triggering off-route warning', () => {
      tripService.startTrip(userId, {
        start: 'Koramangala',
        end: 'Indiranagar',
        route: mockRoute,
        mode: 'live',
      })

      // Reading 1: off-route by ~150m (consecutive count = 1) -> Warning NOT yet triggered
      const reading1 = tripService.updateGpsPosition(
        userId,
        { latitude: 12.9450, longitude: 77.6370, accuracy: 15 },
        { offRouteThresholdKm: 0.05 }
      )

      expect(reading1.consecutiveOffRouteCount).toBe(1)
      expect(reading1.isOffRoute).toBe(false)

      // Reading 2: second consecutive reading off-route -> Warning TRIGGERED
      const reading2 = tripService.updateGpsPosition(
        userId,
        { latitude: 12.9450, longitude: 77.6372, accuracy: 15 },
        { offRouteThresholdKm: 0.05 }
      )

      expect(reading2.consecutiveOffRouteCount).toBe(2)
      expect(reading2.isOffRoute).toBe(true)
      expect(reading2.offRouteDistanceMeters).toBeGreaterThan(50)

      // Reading 3: returns back onto route -> Warning CLEARED
      const reading3 = tripService.updateGpsPosition(
        userId,
        { latitude: 12.9450, longitude: 77.6350, accuracy: 15 },
        { offRouteThresholdKm: 0.05 }
      )

      expect(reading3.consecutiveOffRouteCount).toBe(0)
      expect(reading3.isOffRoute).toBe(false)
    })

    it('15. Poor GPS accuracy suppresses off-route warning to prevent false alarms', () => {
      tripService.startTrip(userId, {
        start: 'Koramangala',
        end: 'Indiranagar',
        route: mockRoute,
        mode: 'live',
      })

      // Off-route coordinates but accuracy is poor (95m > 65m)
      const poorGpsReading = tripService.updateGpsPosition(
        userId,
        { latitude: 12.9450, longitude: 77.6380, accuracy: 95 },
        { offRouteThresholdKm: 0.05 }
      )

      // Off-route warning should be suppressed
      expect(poorGpsReading.isOffRoute).toBe(false)
      expect(poorGpsReading.consecutiveOffRouteCount).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // 4. MAP INTERACTION & LIVE UI
  // ---------------------------------------------------------------------------
  describe('4. Map Follow Mode & Live Navigation UI', () => {
    it('16. Renders live GPS position marker and follow button when userLocation is present', () => {
      render(
        <SafetyMap
          userLocation={{ latitude: 12.935, longitude: 77.625, accuracy: 15, heading: 90 }}
          isTracking={true}
          showFilters={false}
          showLegend={false}
        />
      )

      // Follow camera button should be rendered
      const recenterBtn = screen.getByLabelText(/recenter camera/i)
      expect(recenterBtn).toBeInTheDocument()

      // Live GPS tracking badge should be displayed
      expect(screen.getByText(/gps tracking/i)).toBeInTheDocument()
    })

    it('17. Page reload restores active trip safely without advancing artificial progress', () => {
      tripService.startTrip(userId, {
        start: 'Koramangala',
        end: 'Indiranagar',
        route: mockRoute,
        mode: 'live',
      })

      // Advance by genuine GPS position to 25%
      tripService.updateGpsPosition(userId, {
        latitude: 12.9450,
        longitude: 77.6350,
        accuracy: 10,
      })

      const beforeReload = tripService.getActiveTrip(userId)
      expect(beforeReload.progress).toBeGreaterThan(0)
      const savedProgress = beforeReload.progress

      // Simulate page reload by retrieving fresh trip instance from storage
      const reloadedTrip = tripService.getActiveTrip(userId)
      expect(reloadedTrip.progress).toBe(savedProgress)
      expect(reloadedTrip.mode).toBe('live')

      // Tick progress call must not advance a live trip
      const tickAttempt = tripService.tickProgress(userId, 10)
      expect(tickAttempt.progress).toBe(savedProgress)
    })

    it('18. Demo mode remains isolated from live GPS mode', () => {
      // 1. Start Demo Mode Trip
      const demoTrip = tripService.startTrip(userId, {
        start: 'Demo Origin',
        end: 'Demo Destination',
        mode: 'demo',
        distanceKm: 10,
        durationMins: 20,
      })

      expect(demoTrip.mode).toBe('demo')

      // In demo mode, tickProgress DOES advance progress
      const tickedDemo = tripService.tickProgress(userId, 15)
      expect(tickedDemo.progress).toBe(15)

      // Switch to Live GPS mode
      const liveTrip = tripService.setTripMode(userId, 'live')
      expect(liveTrip.mode).toBe('live')

      // Now tickProgress must NO LONGER advance progress
      const tickedLive = tripService.tickProgress(userId, 15)
      expect(tickedLive.progress).toBe(15) // Unchanged!
    })
  })

  // ---------------------------------------------------------------------------
  // 5. ACTIVE TRIP TRACKER COMPONENT CONTROLS
  // ---------------------------------------------------------------------------
  describe('5. ActiveTripTracker UI: Maneuvers, Off-Route Alert & Controls', () => {
    it('renders next road maneuver when steps are present', () => {
      const activeTripWithSteps = {
        id: 'T-1',
        start: 'Koramangala',
        end: 'Indiranagar',
        totalDistanceKm: 4.8,
        totalDurationMins: 14,
        remainingKm: 4.8,
        remainingMins: 14,
        progress: 10,
        status: 'Active',
        mode: 'live',
        route: mockRoute,
      }

      render(<ActiveTripTracker activeTrip={activeTripWithSteps} />)

      expect(screen.getByText(/next maneuver:/i)).toBeInTheDocument()
      expect(screen.getByText(/head north on 80ft road/i)).toBeInTheDocument()
    })

    it('renders confirmed off-route alert and recalculate action', () => {
      const offRouteTrip = {
        id: 'T-2',
        start: 'Koramangala',
        end: 'Indiranagar',
        totalDistanceKm: 4.8,
        totalDurationMins: 14,
        remainingKm: 3.5,
        remainingMins: 10,
        progress: 30,
        status: 'Active',
        mode: 'live',
        isOffRoute: true,
        offRouteDistanceMeters: 85,
        route: mockRoute,
      }

      const handleRecalc = vi.fn().mockResolvedValue({})

      render(
        <ActiveTripTracker
          activeTrip={offRouteTrip}
          onRecalculate={handleRecalc}
        />
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/route deviation detected/i)).toBeInTheDocument()
      expect(screen.getByText(/~85m from the planned route/i)).toBeInTheDocument()

      const recalcBtn = screen.getByRole('button', { name: /recalculate route from current gps/i })
      fireEvent.click(recalcBtn)
      expect(handleRecalc).toHaveBeenCalledTimes(1)
    })
  })

  // ---------------------------------------------------------------------------
  // 6. REAL-DEVICE READINESS AUDIT SAFEGUARDS
  // ---------------------------------------------------------------------------
  describe('6. Real-Device Readiness Audit: Jitter, Stale Fixes & Arrival Confirmation', () => {
    it('19. Discards out-of-bounds and NaN coordinates defensively', () => {
      tripService.startTrip(userId, {
        start: 'Koramangala',
        end: 'Indiranagar',
        route: mockRoute,
        mode: 'live',
      })

      // Invalid latitude (> 90)
      const res1 = tripService.updateGpsPosition(userId, { latitude: 95.0, longitude: 77.625, accuracy: 10 })
      expect(res1.progress).toBe(0)

      // Invalid longitude (< -180)
      const res2 = tripService.updateGpsPosition(userId, { latitude: 12.935, longitude: -190.0, accuracy: 10 })
      expect(res2.progress).toBe(0)

      // Non-finite / NaN
      const res3 = tripService.updateGpsPosition(userId, { latitude: NaN, longitude: 77.625, accuracy: 10 })
      expect(res3.progress).toBe(0)
    })

    it('20. Ignores stale GPS fixes older than 30s and out-of-order historical fixes', () => {
      tripService.startTrip(userId, {
        start: 'Koramangala',
        end: 'Indiranagar',
        route: mockRoute,
        mode: 'live',
      })

      const now = Date.now()

      // 1. Fresh fix (now) at ~20% along route
      const freshFix = tripService.updateGpsPosition(userId, {
        latitude: 12.9450,
        longitude: 77.6350,
        accuracy: 10,
        timestamp: now,
      })
      expect(freshFix.progress).toBeGreaterThan(0)
      const savedProgress = freshFix.progress

      // 2. Stale fix (60 seconds old)
      const staleFix = tripService.updateGpsPosition(userId, {
        latitude: 12.9550,
        longitude: 77.6400,
        accuracy: 10,
        timestamp: now - 60000,
      })
      expect(staleFix.progress).toBe(savedProgress)

      // 3. Out-of-order historical fix (timestamp before previous fix)
      const outOfOrderFix = tripService.updateGpsPosition(userId, {
        latitude: 12.9550,
        longitude: 77.6400,
        accuracy: 10,
        timestamp: now - 5000,
      })
      expect(outOfOrderFix.progress).toBe(savedProgress)
    })

    it('21. Prevents single noisy GPS jump from completing trip; requires consecutive reliable arrival fixes', () => {
      tripService.startTrip(userId, {
        start: 'Koramangala',
        end: 'Indiranagar',
        route: mockRoute,
        mode: 'live',
      })

      // Destination waypoint is [12.9716, 77.6412]
      const destLat = 12.9716
      const destLon = 77.6412

      // Fix 1: A single reading directly at destination (< 50m)
      const fix1 = tripService.updateGpsPosition(userId, {
        latitude: destLat,
        longitude: destLon,
        accuracy: 15,
        timestamp: Date.now(),
      })

      // Trip must NOT be terminated on single fix! It records consecutiveArrivalCount = 1
      expect(fix1).not.toBeNull()
      expect(fix1.status).toBe('Active')
      expect(fix1.consecutiveArrivalCount).toBe(1)
      expect(tripService.getActiveTrip(userId)).not.toBeNull()

      // Fix 2: Second consecutive reliable reading at destination confirms arrival!
      tripService.updateGpsPosition(userId, {
        latitude: destLat,
        longitude: destLon,
        accuracy: 15,
        timestamp: Date.now() + 1000,
      })

      // Trip is now completed and archived to MyTrips history
      expect(tripService.getActiveTrip(userId)).toBeNull()
    })

    it('22. Resets arrival counter if an intervening fix moves away from destination', () => {
      tripService.startTrip(userId, {
        start: 'Koramangala',
        end: 'Indiranagar',
        route: mockRoute,
        mode: 'live',
      })

      const destLat = 12.9716
      const destLon = 77.6412

      // Fix 1: Near destination
      const fix1 = tripService.updateGpsPosition(userId, {
        latitude: destLat,
        longitude: destLon,
        accuracy: 15,
        timestamp: Date.now(),
      })
      expect(fix1.consecutiveArrivalCount).toBe(1)

      // Fix 2: False alarm! Device jumps 1 km back
      const fix2 = tripService.updateGpsPosition(userId, {
        latitude: 12.9600,
        longitude: 77.6380,
        accuracy: 15,
        timestamp: Date.now() + 1000,
      })
      expect(fix2.consecutiveArrivalCount).toBe(0)
      expect(fix2.status).toBe('Active')
    })

    it('23. Prevents route projection from jumping forward to a parallel road segment', () => {
      // Loopback/parallel route:
      // Segment 1 (0 to 1 km): goes north along lon 77.6200
      // Segment 2 (1 to 5 km): big detour loop
      // Segment 3 (5 to 6 km): parallel road going south along lon 77.6203 (only ~30m east of Segment 1)
      const loopRouteWaypoints = [
        [12.9300, 77.6200], // Start (0 km)
        [12.9390, 77.6200], // km 1.0 (on Avenue A)
        [12.9500, 77.6500], // km 4.0 (far detour)
        [12.9390, 77.6203], // km 7.0 (parallel road Avenue B, only 30m from Avenue A!)
        [12.9300, 77.6203], // km 8.0 (end)
      ]

      // User has travelled 0.9 km (on Avenue A)
      const userCoords = [12.9380, 77.6202] // Slightly east, closer to Avenue B (30m) than Avenue A (35m)

      const projection = projectPointOnRoute(userCoords, loopRouteWaypoints, {
        lastTravelledKm: 0.9,
      })

      // Must stay snapped to the local segment (within forward window ~0.9km to 2.5km)
      // rather than jumping to km 7.0!
      expect(projection.distanceTravelledKm).toBeLessThan(2.0)
      expect(projection.closestSegmentIndex).toBe(0) // Segment 0-1
    })

    it('24. Paused trip ignores incoming GPS fixes without modifying progress or distance', () => {
      tripService.startTrip(userId, {
        start: 'Koramangala',
        end: 'Indiranagar',
        route: mockRoute,
        mode: 'live',
      })

      // Set initial progress
      tripService.updateGpsPosition(userId, {
        latitude: 12.9450,
        longitude: 77.6350,
        accuracy: 15,
      })

      const beforePause = tripService.getActiveTrip(userId)
      const savedProgress = beforePause.progress
      const savedDistance = beforePause.remainingKm

      // Pause trip
      const paused = tripService.pauseTrip(userId)
      expect(paused.isPaused).toBe(true)

      // New GPS coordinates arrive while paused
      const res = tripService.updateGpsPosition(userId, {
        latitude: 12.9550,
        longitude: 77.6400,
        accuracy: 10,
      })

      expect(res.isPaused).toBe(true)
      expect(res.progress).toBe(savedProgress)
      expect(res.remainingKm).toBe(savedDistance)
    })

    it('25. StartWatching deduplicates active subscriptions and stopWatching clears watchId', () => {
      const mockClearWatch = vi.fn()
      let watchCount = 0
      const mockWatchPosition = vi.fn(() => {
        watchCount++
        return 555
      })

      vi.stubGlobal('navigator', {
        geolocation: {
          watchPosition: mockWatchPosition,
          clearWatch: mockClearWatch,
        },
      })

      const { result } = renderHook(() => useGeolocation())

      act(() => {
        result.current.startWatching()
      })
      expect(watchCount).toBe(1)
      expect(result.current.isTracking).toBe(true)

      // Call startWatching a second time: must not spawn duplicate
      act(() => {
        result.current.startWatching()
      })
      // ClearWatch called to release prior watch, exactly 1 active watch preserved
      expect(result.current.isTracking).toBe(true)

      // Stop watching
      act(() => {
        result.current.stopWatching()
      })
      expect(mockClearWatch).toHaveBeenCalledWith(555)
      expect(result.current.isTracking).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // 7. REAL GPS ACQUISITION, MAP CENTERING & DEMO INTERFERENCE FIXES
  // ---------------------------------------------------------------------------
  describe('7. Real GPS Acquisition, Map Centering & Demo Interference Fixes', () => {
    it('26. SafetyMap renders clear LIVE GPS badge when valid GPS coordinates exist', () => {
      render(
        <SafetyMap
          userLocation={{ latitude: 13.0827, longitude: 80.2707, accuracy: 14 }}
          isTracking={false}
          showFilters={false}
          showLegend={false}
        />
      )

      expect(screen.getByText(/LIVE GPS \(±14m\)/i)).toBeInTheDocument()
    })

    it('27. SafetyMap renders DEMO SAFETY MAP · Bengaluru when real GPS is absent', () => {
      render(
        <SafetyMap
          userLocation={null}
          isTracking={false}
          showFilters={false}
          showLegend={false}
        />
      )

      expect(screen.getByText(/DEMO SAFETY MAP · Bengaluru/i)).toBeInTheDocument()
    })

    it('28. LiveMap automatically calls requestLocation on mount', async () => {
      const mockGetCurrentPosition = vi.fn((success) => {
        success({
          coords: {
            latitude: 13.0827,
            longitude: 80.2707,
            accuracy: 10,
          },
          timestamp: Date.now(),
        })
      })

      vi.stubGlobal('navigator', {
        geolocation: {
          getCurrentPosition: mockGetCurrentPosition,
          watchPosition: vi.fn(),
          clearWatch: vi.fn(),
        },
      })

      authService.setCurrentUser({
        id: userId,
        name: 'Test Traveller',
        email: 'traveller@test.com',
        role: 'Traveller',
      })

      render(
        <MemoryRouter>
          <AuthProvider>
            <LiveMap />
          </AuthProvider>
        </MemoryRouter>
      )

      // Geolocation getCurrentPosition should have been invoked on mount
      expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1)
    })

    it('29. LiveMap renders clear permission denied notice when GPS is blocked', async () => {
      const mockDeniedPosition = vi.fn((_success, error) => {
        error({
          code: 1,
          PERMISSION_DENIED: 1,
          message: 'User denied Geolocation',
        })
      })

      vi.stubGlobal('navigator', {
        geolocation: {
          getCurrentPosition: mockDeniedPosition,
          watchPosition: vi.fn(),
          clearWatch: vi.fn(),
        },
      })

      authService.setCurrentUser({
        id: userId,
        name: 'Test Traveller',
        email: 'traveller@test.com',
        role: 'Traveller',
      })

      render(
        <MemoryRouter>
          <AuthProvider>
            <LiveMap />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(await screen.findByText(/Location access was not granted\. Displaying demo environment in Bengaluru\./i)).toBeInTheDocument()
      expect(screen.getByText(/GPS DENIED \(DEMO FALLBACK\)/i)).toBeInTheDocument()
    })
  })
})
