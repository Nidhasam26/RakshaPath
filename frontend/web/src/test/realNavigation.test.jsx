import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { routeService } from '../services/routeService'
import SafetyMap from '../components/maps/SafetyMap'
import RoutePlanner from '../components/navigation/RoutePlanner'

describe('Phase 1: Real Destination Search & Road Routing', () => {
  beforeEach(() => {
    routeService.clearCaches()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    routeService.clearCaches()
    vi.restoreAllMocks()
  })

  describe('1. Photon Geocoding Service', () => {
    it('returns empty array if search query is less than 3 characters or whitespace', async () => {
      const emptyRes = await routeService.geocodePhoton('')
      const shortRes = await routeService.geocodePhoton('ab')
      const spaceRes = await routeService.geocodePhoton('   ')

      expect(emptyRes).toEqual([])
      expect(shortRes).toEqual([])
      expect(spaceRes).toEqual([])
    })

    it('fetches and converts Photon GeoJSON [lon, lat] coordinates into Leaflet [lat, lon]', async () => {
      const mockPhotonResponse = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [77.6245, 12.9345], // GeoJSON order: [lon, lat]
            },
            properties: {
              osm_id: 12345,
              name: 'Sony World Signal',
              street: '80 Feet Road',
              district: 'Koramangala',
              city: 'Bengaluru',
              state: 'Karnataka',
              country: 'India',
            },
          },
        ],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockPhotonResponse,
      })

      const results = await routeService.geocodePhoton('Sony World')

      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch.mock.calls[0][0]).toContain('photon.komoot.io/api/?q=Sony%20World')
      expect(results).toHaveLength(1)

      const result = results[0]
      expect(result.name).toBe('Sony World Signal')
      // Leaflet requires [lat, lon]!
      expect(result.coordinates).toEqual([12.9345, 77.6245])
      expect(result.label).toContain('Sony World Signal')
      expect(result.label).toContain('Bengaluru')
    })

    it('uses in-memory cache to prevent duplicate geocoding network queries', async () => {
      const mockResponse = {
        type: 'FeatureCollection',
        features: [
          {
            geometry: { coordinates: [77.6412, 12.9719] },
            properties: { name: 'Indiranagar Metro', city: 'Bengaluru' },
          },
        ],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const firstCall = await routeService.geocodePhoton('Indiranagar')
      const secondCall = await routeService.geocodePhoton('Indiranagar')

      expect(fetch).toHaveBeenCalledTimes(1)
      expect(firstCall).toEqual(secondCall)
      expect(routeService.getGeocodeCacheSize()).toBe(1)
    })

    it('handles HTTP 429 rate limit with a clear descriptive error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      })

      await expect(routeService.geocodePhoton('MG Road')).rejects.toThrow(
        /rate limit reached/i
      )
    })

    it('handles network failure gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'))

      await expect(routeService.geocodePhoton('MG Road')).rejects.toThrow(
        /geocoding network error/i
      )
    })
  })

  describe('2. OSRM Road Routing Service', () => {
    it('validates start and destination coordinate arrays', async () => {
      await expect(
        routeService.fetchRealRouteOSRM(null, [12.97, 77.64])
      ).rejects.toThrow(/valid starting coordinates/i)

      await expect(
        routeService.fetchRealRouteOSRM([12.93, 77.62], [NaN, 77.64])
      ).rejects.toThrow(/valid destination coordinates/i)
    })

    it('rejects identical start and destination coordinates', async () => {
      await expect(
        routeService.fetchRealRouteOSRM([12.9345, 77.6245], [12.9345, 77.6245])
      ).rejects.toThrow(/cannot be the same location/i)
    })

    it('fetches OSRM driving routes, converts [lon, lat] geometry to Leaflet [lat, lon], and extracts steps', async () => {
      const mockOsrmResponse = {
        code: 'Ok',
        routes: [
          {
            geometry: {
              coordinates: [
                [77.6245, 12.9345],
                [77.63, 12.95],
                [77.6412, 12.9719],
              ],
            },
            distance: 5400, // 5.4 km
            duration: 900, // 15 mins (900 sec)
            legs: [
              {
                summary: '100 Feet Road',
                steps: [
                  {
                    name: 'Intermediate Ring Rd',
                    distance: 1200,
                    duration: 180,
                    maneuver: { type: 'depart', modifier: 'north' },
                  },
                  {
                    name: '100 Feet Road',
                    distance: 4200,
                    duration: 720,
                    maneuver: { type: 'turn', modifier: 'left' },
                  },
                  {
                    name: 'Destination Point',
                    distance: 0,
                    duration: 0,
                    maneuver: { type: 'arrive' },
                  },
                ],
              },
            ],
          },
        ],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockOsrmResponse,
      })

      const originCoords = [12.9345, 77.6245]
      const destCoords = [12.9719, 77.6412]

      const routes = await routeService.fetchRealRouteOSRM(originCoords, destCoords, [], {
        originName: 'Koramangala',
        destinationName: 'Indiranagar',
      })

      expect(fetch).toHaveBeenCalledTimes(1)
      // OSRM URL path must be lon1,lat1;lon2,lat2
      expect(fetch.mock.calls[0][0]).toContain('77.6245,12.9345;77.6412,12.9719')
      expect(routes).toHaveLength(1)

      const primaryRoute = routes[0]
      expect(primaryRoute.isRealRoad).toBe(true)
      expect(primaryRoute.calculationType).toBe('osrm-live-road')
      expect(primaryRoute.distanceKm).toBe(5.4)
      expect(primaryRoute.durationMins).toBe(15)
      expect(primaryRoute.waypoints).toEqual([
        [12.9345, 77.6245],
        [12.95, 77.63],
        [12.9719, 77.6412],
      ])
      expect(primaryRoute.steps).toHaveLength(3)
      expect(primaryRoute.steps[0].instruction).toContain('Head north on Intermediate Ring Rd')
      expect(primaryRoute.steps[1].instruction).toContain('Turn left onto 100 Feet Road')
      expect(primaryRoute.steps[2].instruction).toContain('Arrive at destination')
      expect(primaryRoute.safetyScore).toBeGreaterThanOrEqual(18)
      expect(primaryRoute.safetyScore).toBeLessThanOrEqual(96)
    })

    it('handles OSRM NoRoute error cleanly without silently falling back', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ code: 'NoRoute', message: 'No route found' }),
      })

      await expect(
        routeService.fetchRealRouteOSRM([12.9345, 77.6245], [20.0, 80.0])
      ).rejects.toThrow(/no drivable road route found/i)
    })
  })

  describe('3. GPS Correctness & Map Integration', () => {
    it('SafetyMap does NOT render user location marker when userLocation is null', () => {
      render(
        <SafetyMap
          userLocation={null}
          showFilters={false}
          showLegend={false}
        />
      )

      // Leaflet container should be present
      expect(screen.getByLabelText(/illustrative safety map/i)).toBeInTheDocument()
      // Should NOT render any popup or label claiming "Your Location" or "Current GPS Position"
      expect(screen.queryByText(/current gps position/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/your location/i)).not.toBeInTheDocument()
    })

    it('SafetyMap renders user location marker when genuine GPS coordinates are provided', () => {
      render(
        <SafetyMap
          userLocation={{ latitude: 12.95, longitude: 77.60, accuracy: 25 }}
          showFilters={false}
          showLegend={true}
        />
      )

      expect(screen.getByText(/your gps position/i)).toBeInTheDocument()
    })

    it('SafetyMap renders start and destination markers when route waypoints exist', () => {
      const mockRoute = {
        id: 'route-test-1',
        name: 'Test Road Route',
        color: '#64e2ba',
        waypoints: [
          [12.9345, 77.6245],
          [12.9719, 77.6412],
        ],
        origin: { name: 'Origin Hub' },
        destination: { name: 'Dest Hub' },
        distanceKm: 5.2,
        durationMins: 14,
        safetyScore: 88,
      }

      render(
        <SafetyMap
          routes={[mockRoute]}
          selectedRouteId="route-test-1"
          showFilters={false}
          showLegend={true}
        />
      )

      expect(screen.getByText(/route starting point/i)).toBeInTheDocument()
      expect(screen.getByText(/destination/i)).toBeInTheDocument()
      expect(screen.getByText(/selected active route/i)).toBeInTheDocument()
    })
  })

  describe('4. RoutePlanner Autocomplete & Route Execution', () => {
    it('shows autocomplete suggestions when typing 3+ characters', async () => {
      const mockFeatures = [
        {
          geometry: { coordinates: [77.6245, 12.9345] },
          properties: { name: 'Koramangala Club', city: 'Bengaluru' },
        },
      ]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ type: 'FeatureCollection', features: mockFeatures }),
      })

      render(<RoutePlanner hazards={[]} />)

      const originInput = screen.getByLabelText(/starting point/i)
      fireEvent.change(originInput, { target: { value: 'Kora' } })

      const option = await screen.findByRole('option', { name: /koramangala club/i }, { timeout: 3000 })
      expect(option).toBeInTheDocument()

      // Clicking suggestion selects it
      fireEvent.click(option)

      await waitFor(() => {
        expect(originInput).toHaveValue('Koramangala Club')
      })
    })

    it('allows selecting Demo Presets and populates destination', () => {
      render(<RoutePlanner hazards={[]} />)

      const presetBtn = screen.getByRole('button', { name: 'MG Road Metro Station' })
      fireEvent.click(presetBtn)

      expect(screen.getByLabelText(/destination/i)).toHaveValue('MG Road Metro Station')
    })

    it('displays error and allows fallback to predefined demo corridors when road calculation fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'))

      render(<RoutePlanner hazards={[]} />)

      const submitBtn = screen.getByRole('button', { name: /calculate road route/i })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      }, { timeout: 3000 })

      expect(screen.getByText(/switch to predefined demo corridors/i)).toBeInTheDocument()

      // Click fallback to demo corridors
      fireEvent.click(screen.getByText(/switch to predefined demo corridors/i))
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(screen.getByText(/demonstration corridor/i)).toBeInTheDocument()
    })

    it('renders "Use Current Location" button when userLocation is provided', () => {
      const mockGps = { latitude: 13.0827, longitude: 80.2707, accuracy: 12 }
      render(<RoutePlanner hazards={[]} userLocation={mockGps} />)

      const useLocBtn = screen.getByRole('button', { name: /set origin to current gps location/i })
      expect(useLocBtn).toBeInTheDocument()

      // Click "Use Current Location"
      fireEvent.click(useLocBtn)
      expect(screen.getByLabelText(/^starting point$/i)).toHaveValue('My Current Location')
    })

    it('shows useful error and avoids silent Bangalore fallback when destination cannot be resolved', async () => {
      // Mock geocode returning empty results
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ type: 'FeatureCollection', features: [] }),
      })

      render(<RoutePlanner hazards={[]} />)

      const destInput = screen.getByLabelText(/destination/i)
      fireEvent.change(destInput, { target: { value: 'Nonexistent Place XYZ 999' } })

      const submitBtn = screen.getByRole('button', { name: /calculate road route/i })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      expect(screen.getByText(/could not locate destination/i)).toBeInTheDocument()
      expect(screen.getByText(/Nonexistent Place XYZ 999/i)).toBeInTheDocument()
    })
  })
})
