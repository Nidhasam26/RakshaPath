import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { AuthProvider } from '../context/AuthContext.jsx'
import authService from '../services/authService'
import { hazardService, getUserHazardsKey } from '../services/hazardService'
import { routeService, calculateHaversineDistance, calculateRouteSafetyScore } from '../services/routeService'
import { HAZARD_CATEGORIES, HAZARD_SEVERITIES, HAZARD_STATUS, initialSeedHazards } from '../data/hazardData'
import HazardReportModal from '../components/maps/HazardReportModal'
import RoutePlanner from '../components/navigation/RoutePlanner'
import SafetyMap from '../components/maps/SafetyMap'

describe('Phase 4: Smart Map, Hazard Integration & Route Safety Intelligence', () => {
  const travellerUserA = {
    id: 'user_traveller_alpha',
    name: 'Ananya Sharma',
    email: 'ananya@example.com',
    role: 'Traveller',
  }

  const travellerUserB = {
    id: 'user_traveller_beta',
    name: 'Rohan Mehra',
    email: 'rohan@example.com',
    role: 'Traveller',
  }

  const familyUser = {
    id: 'user_family_gamma',
    name: 'Suresh Sharma',
    email: 'suresh@example.com',
    role: 'Family',
  }

  const policeUser = {
    id: 'user_police_delta',
    name: 'Inspector Vijay',
    email: 'vijay@police.gov.in',
    role: 'Police',
  }

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('1. Hazard Creation, Validation & Duplicate Prevention', () => {
    it('validates required fields on hazard submission and rejects invalid inputs', () => {
      // Missing title
      expect(() =>
        hazardService.addReport(travellerUserA.id, {
          title: '',
          category: HAZARD_CATEGORIES[0],
          severity: HAZARD_SEVERITIES.HIGH,
          description: 'Valid description',
          position: [12.93, 77.62],
        })
      ).toThrow(/hazard title is required/i)

      // Invalid category
      expect(() =>
        hazardService.addReport(travellerUserA.id, {
          title: 'Road Damage',
          category: 'NonExistentCategory',
          severity: HAZARD_SEVERITIES.HIGH,
          description: 'Valid description',
          position: [12.93, 77.62],
        })
      ).toThrow(/valid hazard category/i)

      // Invalid severity
      expect(() =>
        hazardService.addReport(travellerUserA.id, {
          title: 'Road Damage',
          category: HAZARD_CATEGORIES[0],
          severity: 'ExtremeDanger',
          description: 'Valid description',
          position: [12.93, 77.62],
        })
      ).toThrow(/valid severity level/i)

      // Missing description
      expect(() =>
        hazardService.addReport(travellerUserA.id, {
          title: 'Road Damage',
          category: HAZARD_CATEGORIES[0],
          severity: HAZARD_SEVERITIES.HIGH,
          description: '',
          position: [12.93, 77.62],
        })
      ).toThrow(/description/i)

      // Invalid coordinates
      expect(() =>
        hazardService.addReport(travellerUserA.id, {
          title: 'Road Damage',
          category: HAZARD_CATEGORIES[0],
          severity: HAZARD_SEVERITIES.HIGH,
          description: 'Valid description',
          position: 'not-an-array',
        })
      ).toThrow(/geographic coordinates/i)
    })

    it('successfully creates a hazard report with unique ID, timestamps, and Active status', () => {
      const created = hazardService.addReport(travellerUserA.id, {
        title: 'Fallen Cable Wire',
        category: 'Poorly lit areas',
        severity: 'Medium',
        description: 'Overhead cable sagging across street, creating snag hazard.',
        position: [12.935, 77.621],
        durationHours: 4,
      })

      expect(created.id).toMatch(/^HAZ-USER-/)
      expect(created.status).toBe(HAZARD_STATUS.ACTIVE)
      expect(created.isDemo).toBe(true)
      expect(created.reportedAt).toBeDefined()
      expect(created.expiresAt).toBeDefined()

      const userReports = hazardService.getUserHazards(travellerUserA.id)
      expect(userReports).toHaveLength(1)
      expect(userReports[0].id).toBe(created.id)
    })

    it('prevents immediate duplicate hazard reports with same title and coordinates', () => {
      const reportData = {
        title: 'Oil Spill on Curve',
        category: 'Road accidents',
        severity: 'High',
        description: 'Slippery diesel slick on road bend.',
        position: [12.942, 77.628],
      }

      hazardService.addReport(travellerUserA.id, reportData)

      // Attempt immediate duplicate
      expect(() => hazardService.addReport(travellerUserA.id, reportData)).toThrow(
        /duplicate reports are prevented/i
      )
    })
  })

  describe('2. Hazard Filtering & Expiry Evaluation', () => {
    it('filters hazards accurately by category, severity, status, and search keyword', () => {
      const all = hazardService.getSeedHazards()

      // Category filter
      const flooding = hazardService.filterHazards(all, { category: 'Flooding or waterlogging' })
      expect(flooding.every((h) => h.category === 'Flooding or waterlogging')).toBe(true)

      // Severity filter
      const critical = hazardService.filterHazards(all, { severity: 'Critical' })
      expect(critical.every((h) => h.severity === 'Critical')).toBe(true)

      // Status filter
      const active = hazardService.filterHazards(all, { status: 'Active' })
      expect(active.every((h) => h.status === 'Active')).toBe(true)

      // Search keyword filter
      const searchMatch = hazardService.filterHazards(all, { search: 'Silk Board' })
      expect(searchMatch.length).toBeGreaterThan(0)
      expect(searchMatch[0].title).toContain('Silk Board')
    })

    it('automatically evaluates expired hazards based on expiresAt timestamp', () => {
      const expiredSeed = initialSeedHazards.find((h) => new Date(h.expiresAt).getTime() < Date.now())

      expect(expiredSeed).toBeDefined()
      const evaluated = hazardService.getSeedHazards().find((h) => h.id === expiredSeed.id)
      expect(evaluated.status).toBe(HAZARD_STATUS.EXPIRED)
    })

    it('allows updating hazard status to Resolved', () => {
      const created = hazardService.addReport(travellerUserA.id, {
        title: 'Pothole on 1st Main',
        category: 'Construction work',
        severity: 'Low',
        description: 'Fresh gravel filled.',
        position: [12.929, 77.618],
      })

      const updated = hazardService.updateHazardStatus(travellerUserA.id, created.id, HAZARD_STATUS.RESOLVED)
      expect(updated.status).toBe(HAZARD_STATUS.RESOLVED)

      const reloaded = hazardService.getUserHazards(travellerUserA.id).find((h) => h.id === created.id)
      expect(reloaded.status).toBe(HAZARD_STATUS.RESOLVED)
    })
  })

  describe('3. Account Isolation & LocalStorage Integrity', () => {
    it('isolates User A hazard reports from User B', () => {
      hazardService.addReport(travellerUserA.id, {
        title: 'User A Hazard Observation',
        category: 'Poorly lit areas',
        severity: 'Low',
        description: 'Dark alley noted by user A.',
        position: [12.931, 77.625],
      })

      expect(hazardService.getUserHazards(travellerUserA.id)).toHaveLength(1)
      expect(hazardService.getUserHazards(travellerUserB.id)).toHaveLength(0)

      expect(getUserHazardsKey(travellerUserA.id)).toBe('rakshapath:user_traveller_alpha:user_hazards')
      expect(getUserHazardsKey(travellerUserB.id)).toBe('rakshapath:user_traveller_beta:user_hazards')
    })

    it('preserves seeded demo hazards without mutating or overwriting them with user data', () => {
      const initialCount = initialSeedHazards.length
      hazardService.addReport(travellerUserA.id, {
        title: 'Additional Hazard',
        category: 'Traffic congestion',
        severity: 'Low',
        description: 'Testing demo preservation.',
        position: [12.932, 77.626],
      })

      expect(hazardService.getSeedHazards()).toHaveLength(initialCount)
      expect(hazardService.getAllHazards(travellerUserA.id)).toHaveLength(initialCount + 1)
    })

    it('defensively handles malformed or corrupted LocalStorage data without crashing', () => {
      // Store malformed data: non-array, null, missing position, string
      localStorage.setItem(
        getUserHazardsKey(travellerUserA.id),
        JSON.stringify([
          null,
          'malformed string item',
          { id: 'corrupt-1', title: 'Missing coords' },
          { id: 'corrupt-2', title: 'Null coords', position: null },
          { id: 'corrupt-3', title: 'NaN coords', position: [NaN, 77.6] },
          {
            id: 'valid-recovered',
            title: 'Valid Hazard',
            category: 'Poor lighting',
            severity: 'Low',
            position: [12.93, 77.62],
            status: HAZARD_STATUS.ACTIVE,
          },
        ])
      )

      // getUserHazards should sanitize and only return valid items
      const userHazards = hazardService.getUserHazards(travellerUserA.id)
      expect(userHazards).toHaveLength(1)
      expect(userHazards[0].id).toBe('valid-recovered')

      // SafetyMap rendering with sanitized hazards should not crash
      render(<SafetyMap hazards={userHazards} showFilters={true} showLegend={true} />)
      expect(screen.getByRole('region', { name: /illustrative safety map/i })).toBeInTheDocument()
    })
  })

  describe('4. Route Search, Comparison & Safety Score Calculation', () => {
    it('calculates geographic distance with Haversine formula', () => {
      // Distance between Koramangala (12.9345, 77.6245) and Indiranagar (12.9719, 77.6412) is ~4.5-5.0 km straight line
      const dist = calculateHaversineDistance(12.9345, 77.6245, 12.9719, 77.6412)
      expect(dist).toBeGreaterThan(4)
      expect(dist).toBeLessThan(6)
    })

    it('validates route origin and destination inputs', () => {
      expect(() => routeService.generateRouteAlternatives('', 'Indiranagar')).toThrow(
        /both a starting point and a destination/i
      )
      expect(() => routeService.generateRouteAlternatives('Koramangala', 'Koramangala')).toThrow(
        /cannot be the same/i
      )
    })

    it('generates 3 alternative routes with distances, durations, and estimated safety scores', () => {
      const hazards = hazardService.getAllHazards(travellerUserA.id)
      const routes = routeService.generateRouteAlternatives(
        'Koramangala Sony World',
        'Indiranagar 100ft Road',
        hazards
      )

      expect(routes).toHaveLength(3)

      const [saferRoute, directRoute, altRoute] = routes
      expect(saferRoute.type).toBe('recommended')
      expect(saferRoute.tag).toContain('Recommended (Safer)')
      expect(directRoute.type).toBe('direct')
      expect(altRoute.type).toBe('alternative')

      // All routes have valid distance and duration
      routes.forEach((r) => {
        expect(r.distanceKm).toBeGreaterThan(0)
        expect(r.durationMins).toBeGreaterThan(0)
        expect(r.waypoints.length).toBeGreaterThanOrEqual(2)
        expect(r.safetyScore).toBeGreaterThanOrEqual(18)
        expect(r.safetyScore).toBeLessThanOrEqual(96)
        expect(r.scoreFactors.length).toBeGreaterThan(0)
      })

      // Recommended safer route has higher safety score than direct route that intersects hazard
      expect(saferRoute.safetyScore).toBeGreaterThanOrEqual(directRoute.safetyScore)
    })

    it('distinguishes predefined demo corridors from arbitrary synthetic estimates with internal consistency', () => {
      // 1. Predefined corridor
      const predefinedRoutes = routeService.generateRouteAlternatives(
        'Koramangala Sony World',
        'Indiranagar 100ft Road'
      )
      expect(predefinedRoutes[0].isPredefined).toBe(true)
      expect(predefinedRoutes[0].calculationType).toBe('predefined-corridor')

      // 2. Arbitrary user-entered locations
      const arbitraryRoutes = routeService.generateRouteAlternatives(
        'Electronic City Toll',
        'Hebbal Flyover'
      )
      expect(arbitraryRoutes).toHaveLength(3)
      expect(arbitraryRoutes[0].isPredefined).toBe(false)
      expect(arbitraryRoutes[0].calculationType).toBe('synthetic-estimate')

      // Internal consistency: direct distance < safer distance < alternative distance
      const [safer, direct, alt] = arbitraryRoutes
      expect(direct.distanceKm).toBeLessThan(safer.distanceKm)
      expect(safer.distanceKm).toBeLessThan(alt.distanceKm)
      expect(direct.durationMins).toBeLessThanOrEqual(safer.durationMins)
      expect(safer.durationMins).toBeLessThanOrEqual(alt.durationMins)
    })

    it('recalculates route safety score when new severe hazards are introduced', () => {
      const baseHazards = []
      const initialScoreData = calculateRouteSafetyScore(
        [
          [12.9345, 77.6245],
          [12.95, 77.63],
          [12.9719, 77.6412],
        ],
        baseHazards,
        'recommended'
      )

      // Add a Critical hazard right on the route waypoint
      const severeHazards = [
        {
          id: 'HAZ-TEST-CRITICAL',
          category: 'Road closures',
          severity: 'Critical',
          position: [12.95, 77.63],
          title: 'Total Road Closure',
          status: HAZARD_STATUS.ACTIVE,
        },
      ]

      const updatedScoreData = calculateRouteSafetyScore(
        [
          [12.9345, 77.6245],
          [12.95, 77.63],
          [12.9719, 77.6412],
        ],
        severeHazards,
        'recommended'
      )

      expect(updatedScoreData.score).toBeLessThan(initialScoreData.score)
      // Contains deduction factor in explanation
      const deductionFactor = updatedScoreData.factors.find((f) => f.impact === '-25')
      expect(deductionFactor).toBeDefined()
    })
  })

  describe('5. Interactive UI & Accessibility Verification', () => {
    it('renders the RoutePlanner search, comparison cards, and swap controls', () => {
      const hazards = hazardService.getAllHazards()
      render(
        <RoutePlanner
          hazards={hazards}
          onSelectRoute={vi.fn()}
          onRoutesCalculated={vi.fn()}
        />
      )

      expect(screen.getByRole('heading', { name: /route safety intelligence/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/starting point/i)).toHaveValue('Koramangala Sony World')
      expect(screen.getByLabelText(/destination/i)).toHaveValue('Indiranagar 100ft Road')

      // Swap button
      const swapBtn = screen.getByLabelText(/reverse route/i)
      fireEvent.click(swapBtn)
      expect(screen.getByLabelText(/starting point/i)).toHaveValue('Indiranagar 100ft Road')
      expect(screen.getByLabelText(/destination/i)).toHaveValue('Koramangala Sony World')

      // Route comparison cards displayed
      expect(screen.getAllByText(/recommended safer path/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText(/estimated safety score breakdown/i)).toBeInTheDocument()
      expect(screen.getByText(/estimated score disclaimer/i)).toBeInTheDocument()
    })

    it('renders the HazardReportModal with validation, accessible controls, and closes on Escape', () => {
      const handleClose = vi.fn()
      const handleSubmit = vi.fn()

      render(
        <HazardReportModal
          onClose={handleClose}
          onSubmit={handleSubmit}
          defaultCoordinates={[12.935, 77.625]}
        />
      )

      expect(screen.getByRole('dialog', { name: /report a safety hazard/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/hazard title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/severity level/i)).toBeInTheDocument()

      // Fill valid form
      fireEvent.change(screen.getByLabelText(/hazard title/i), { target: { value: 'Broken Guardrail' } })
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Deep drop-off along turn.' } })
      fireEvent.click(screen.getByRole('button', { name: /submit demo report/i }))

      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(handleClose).toHaveBeenCalledTimes(1)

      // Test Escape listener
      fireEvent.keyDown(window, { key: 'Escape' })
      expect(handleClose).toHaveBeenCalledTimes(2)
    })

    it('renders SafetyMap with Leaflet container, legend, and severity pills', () => {
      const hazards = hazardService.getSeedHazards()
      render(
        <SafetyMap
          hazards={hazards}
          showFilters={true}
          showLegend={true}
        />
      )

      expect(screen.getByLabelText(/illustrative safety map/i)).toBeInTheDocument()
      expect(screen.getByRole('region', { name: /map legend/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /critical/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /high/i })).toBeInTheDocument()
      expect(screen.getByText(/demo safety map/i)).toBeInTheDocument()
    })

    it('renders LiveMap page with tabs, metrics, and switchable route/hazard views', async () => {
      authService.setCurrentUser(travellerUserA)
      render(
        <MemoryRouter initialEntries={['/map']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      // Heading and metrics
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /safety map/i })).toBeInTheDocument()
        expect(screen.getByText(/active hazards/i)).toBeInTheDocument()
        expect(screen.getByText(/high & critical risks/i)).toBeInTheDocument()
      })

      // Tabs: switch to Hazard Directory
      const hazardTab = screen.getByRole('tab', { name: /hazard directory & filters/i })
      fireEvent.click(hazardTab)

      expect(screen.getByRole('heading', { name: /filter safety hazards/i })).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/search hazard title/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /report hazard \(demo\)/i })).toBeInTheDocument()
    })

    it('enforces role-based map access: Family is read-only while Police and Traveller can report', async () => {
      // 1. Family role test: read-only, no report button
      authService.setCurrentUser(familyUser)
      const { unmount } = render(
        <MemoryRouter initialEntries={['/map']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /safety map/i })).toBeInTheDocument()
      })

      // Family view has read-only indicator
      expect(screen.getByText(/read-only \(family\)/i)).toBeInTheDocument()
      expect(screen.getByText(/family monitoring access/i)).toBeInTheDocument()
      // "Report Hazard (Demo)" button MUST NOT exist for Family
      expect(screen.queryByRole('button', { name: /report hazard \(demo\)/i })).not.toBeInTheDocument()

      unmount()

      // 2. Police role test: can report hazards
      authService.setCurrentUser(policeUser)
      render(
        <MemoryRouter initialEntries={['/map']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /safety map/i })).toBeInTheDocument()
      })
      expect(screen.getByRole('button', { name: /report hazard \(demo\)/i })).toBeInTheDocument()
    })
  })
})
