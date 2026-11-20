import { DEMO_HUBS, DEMO_CORRIDORS } from '../data/routeData'
import { HAZARD_STATUS } from '../data/hazardData'
import { tokens } from '../theme/tokens'

/**
 * In-memory caches to prevent redundant network requests and respect API limits.
 */
const geocodeCache = new Map()
const routeCache = new Map()

/**
 * Throttle queue for the public OSRM demo server (strict 1 req/sec policy).
 */
let lastOsrmRequestTimestamp = 0
const OSRM_MIN_INTERVAL_MS = 1100

async function throttleOsrm() {
  const now = Date.now()
  const timeSinceLast = now - lastOsrmRequestTimestamp
  if (timeSinceLast < OSRM_MIN_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, OSRM_MIN_INTERVAL_MS - timeSinceLast))
  }
  lastOsrmRequestTimestamp = Date.now()
}

/**
 * Haversine distance formula between two lat/lng pairs in kilometers.
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Projects a GPS coordinate pair [lat, lon] onto the closest segment of a route polyline.
 * Calculates:
 * - distanceToRouteKm: perpendicular distance to closest point on polyline (for off-route detection).
 * - distanceTravelledKm: cumulative distance along polyline from start to projection.
 * - remainingDistanceKm: remaining distance from projection to destination.
 * - fractionTravelled: 0.0 to 1.0 progress fraction.
 * - closestPoint: [lat, lon] coordinates on the polyline.
 * - closestSegmentIndex: index of segment where point projects.
 */
export function projectPointOnRoute(coords, waypoints = [], options = {}) {
  if (
    !coords ||
    !Array.isArray(coords) ||
    coords.length < 2 ||
    !Number.isFinite(coords[0]) ||
    !Number.isFinite(coords[1]) ||
    !waypoints ||
    waypoints.length < 2
  ) {
    return {
      distanceToRouteKm: 0,
      distanceTravelledKm: 0,
      remainingDistanceKm: 0,
      totalDistanceKm: 0,
      fractionTravelled: 0,
      closestPoint: coords || [0, 0],
      closestSegmentIndex: 0,
    }
  }

  const [pLat, pLon] = coords

  // Precompute cumulative distances along polyline
  const cumDistances = [0]
  for (let i = 0; i < waypoints.length - 1; i++) {
    const d = calculateHaversineDistance(
      waypoints[i][0],
      waypoints[i][1],
      waypoints[i + 1][0],
      waypoints[i + 1][1]
    )
    cumDistances.push(cumDistances[i] + d)
  }
  const totalDistanceKm = cumDistances[cumDistances.length - 1]

  const lastTravelledKm =
    typeof options.lastTravelledKm === 'number' && Number.isFinite(options.lastTravelledKm)
      ? Math.max(0, options.lastTravelledKm)
      : null

  // Forward jump safeguard window:
  // Allow normal vehicle forward movement up to maxForwardKm (1.5 km or 25% of route),
  // plus backward tolerance (0.2 km) for GPS jitter.
  const maxForwardKm = Math.max(1.5, totalDistanceKm * 0.25)
  const windowMinKm = lastTravelledKm !== null ? Math.max(0, lastTravelledKm - 0.2) : 0
  const windowMaxKm = lastTravelledKm !== null ? lastTravelledKm + maxForwardKm : Infinity

  let minDistanceToRouteKm = Infinity
  let bestTravelledKm = 0
  let bestClosestPoint = waypoints[0]
  let bestSegmentIndex = 0

  let localMinDistanceKm = Infinity
  let localTravelledKm = 0
  let localClosestPoint = waypoints[0]
  let localSegmentIndex = 0
  let foundInWindow = false

  for (let i = 0; i < waypoints.length - 1; i++) {
    const [aLat, aLon] = waypoints[i]
    const [bLat, bLon] = waypoints[i + 1]

    const cosMidLat = Math.cos(((aLat + bLat) / 2) * (Math.PI / 180))
    const dx = (bLon - aLon) * cosMidLat
    const dy = bLat - aLat
    const denom = dx * dx + dy * dy

    let t = 0
    if (denom > 1e-12) {
      const px = (pLon - aLon) * cosMidLat
      const py = pLat - aLat
      t = (px * dx + py * dy) / denom
      t = Math.max(0, Math.min(1, t))
    }

    const projLat = aLat + t * (bLat - aLat)
    const projLon = aLon + t * (bLon - aLon)

    const distToProj = calculateHaversineDistance(pLat, pLon, projLat, projLon)
    const segTravelledKm = cumDistances[i] + calculateHaversineDistance(aLat, aLon, projLat, projLon)

    // Check if segment falls within forward movement window
    if (lastTravelledKm !== null && segTravelledKm >= windowMinKm && segTravelledKm <= windowMaxKm) {
      if (distToProj < localMinDistanceKm) {
        localMinDistanceKm = distToProj
        localTravelledKm = segTravelledKm
        localClosestPoint = [projLat, projLon]
        localSegmentIndex = i
        foundInWindow = true
      }
    }

    // Global best tracking (fallback if user took a major detour or starting fresh)
    if (distToProj < minDistanceToRouteKm) {
      minDistanceToRouteKm = distToProj
      bestTravelledKm = segTravelledKm
      bestClosestPoint = [projLat, projLon]
      bestSegmentIndex = i
    }
  }

  // If a segment within the forward window is reasonably close (<= 80m),
  // prefer it over a distant parallel road that happens to pass nearby.
  if (foundInWindow && localMinDistanceKm <= 0.08) {
    minDistanceToRouteKm = localMinDistanceKm
    bestTravelledKm = localTravelledKm
    bestClosestPoint = localClosestPoint
    bestSegmentIndex = localSegmentIndex
  }

  const remainingDistanceKm = Math.max(0, totalDistanceKm - bestTravelledKm)
  const fractionTravelled =
    totalDistanceKm > 0 ? Math.min(1, Math.max(0, bestTravelledKm / totalDistanceKm)) : 0

  return {
    distanceToRouteKm: Number(minDistanceToRouteKm.toFixed(3)),
    distanceTravelledKm: Number(bestTravelledKm.toFixed(2)),
    remainingDistanceKm: Number(remainingDistanceKm.toFixed(2)),
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    fractionTravelled: Number(fractionTravelled.toFixed(4)),
    closestPoint: [
      Number(bestClosestPoint[0].toFixed(5)),
      Number(bestClosestPoint[1].toFixed(5)),
    ],
    closestSegmentIndex: bestSegmentIndex,
  }
}

/**
 * Checks which active hazards lie within `thresholdKm` of any waypoint along the route polyline.
 * For long OSRM routes with hundreds of coordinates, skips step sampling when appropriate.
 */
export function getNearbyHazardsForRoute(waypoints = [], hazards = [], thresholdKm = 0.75) {
  const activeHazards = hazards.filter((h) => h.status === HAZARD_STATUS.ACTIVE)
  const matched = []

  if (!waypoints || waypoints.length === 0 || activeHazards.length === 0) {
    return matched
  }

  // To maintain fast performance on dense OSRM geometries (> 500 points), sample if needed
  const step = waypoints.length > 300 ? Math.ceil(waypoints.length / 200) : 1
  const sampledWaypoints = step === 1 ? waypoints : waypoints.filter((_, idx) => idx % step === 0)

  activeHazards.forEach((hazard) => {
    if (!hazard.position || !Array.isArray(hazard.position)) return
    const [hLat, hLng] = hazard.position

    let minDistance = Infinity
    for (const [wLat, wLng] of sampledWaypoints) {
      const dist = calculateHaversineDistance(wLat, wLng, hLat, hLng)
      if (dist < minDistance) {
        minDistance = dist
      }
    }

    if (minDistance <= thresholdKm) {
      matched.push({
        ...hazard,
        distanceToRouteKm: Number(minDistance.toFixed(2)),
      })
    }
  })

  return matched
}

/**
 * Calculates a transparent Estimated Safety Score from 0 to 100 based on hazard presence and corridor characteristics.
 * Safety scores are strictly labelled as estimates and never guarantee real-world safety.
 */
export function calculateRouteSafetyScore(waypoints = [], hazards = [], routeType = 'recommended') {
  const nearbyHazards = getNearbyHazardsForRoute(waypoints, hazards)
  const factors = []
  let score = 92 // Baseline score for standard primary roads

  if (routeType === 'recommended') {
    score += 4
    factors.push({
      type: 'positive',
      impact: '+4',
      text: 'Follows major illuminated arterial roads with active transit and visibility.',
    })
  } else if (routeType === 'direct') {
    score -= 4
    factors.push({
      type: 'negative',
      impact: '-4',
      text: 'Passes through dense urban corridors with higher frequency of congestion and stops.',
    })
  } else {
    factors.push({
      type: 'neutral',
      impact: '0',
      text: 'Alternative transit route or perimeter bypass.',
    })
  }

  // Deduct points based on hazard severity and count
  nearbyHazards.forEach((hazard) => {
    let deduction = 0
    if (hazard.severity === 'Critical') {
      deduction = -25
    } else if (hazard.severity === 'High') {
      deduction = -15
    } else if (hazard.severity === 'Medium') {
      deduction = -8
    } else {
      deduction = -3
    }

    score += deduction
    factors.push({
      type: 'negative',
      impact: `${deduction}`,
      text: `${hazard.category} (${hazard.severity}): "${hazard.title}" approximately ${(hazard.distanceToRouteKm * 1000).toFixed(0)}m from route.`,
    })
  })

  // Clamp strictly between 18 and 96 (never 0 or 100 to prevent false certainty)
  const finalScore = Math.min(96, Math.max(18, score))

  let ratingLabel = 'Good Safety (Estimate)'
  let toneColor = 'var(--accent)'
  if (finalScore >= 85) {
    ratingLabel = 'Optimal Safety (Estimate)'
    toneColor = 'var(--accent)'
  } else if (finalScore >= 70) {
    ratingLabel = 'Good Safety (Estimate)'
    toneColor = 'var(--accent)'
  } else if (finalScore >= 50) {
    ratingLabel = 'Moderate Risk (Estimate)'
    toneColor = 'var(--amber)'
  } else {
    ratingLabel = 'High Risk (Estimate)'
    toneColor = 'var(--danger)'
  }

  return {
    score: finalScore,
    ratingLabel,
    toneColor,
    factors,
    nearbyHazards,
    disclaimer:
      'Safety scores are illustrative estimates based on community hazard reports. RakshaPath does not guarantee route safety or road conditions.',
  }
}

export const routeService = {
  getDemoHubs() {
    return DEMO_HUBS
  },

  findHubByName(name) {
    if (!name) return null
    return DEMO_HUBS.find((h) => h.name.toLowerCase().includes(name.toLowerCase()))
  },

  clearCaches() {
    geocodeCache.clear()
    routeCache.clear()
  },

  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    return calculateHaversineDistance(lat1, lon1, lat2, lon2)
  },

  calculateRouteSafetyScore(waypoints, hazards, routeType) {
    return calculateRouteSafetyScore(waypoints, hazards, routeType)
  },

  projectPointOnRoute(coords, waypoints, options) {
    return projectPointOnRoute(coords, waypoints, options)
  },

  getGeocodeCacheSize() {
    return geocodeCache.size
  },

  getRouteCacheSize() {
    return routeCache.size
  },

  /**
   * Real geocoding using the open Photon (OSM-based) API.
   * Photon returns GeoJSON FeatureCollection where coordinates are [lon, lat].
   * We convert them into Leaflet-ready [lat, lon].
   */
  async geocodePhoton(query, options = {}) {
    const trimmed = (query || '').trim()
    if (!trimmed || trimmed.length < 3) {
      return []
    }

    const limit = Math.min(10, Math.max(1, options.limit || 5))
    const cacheKey = `${trimmed.toLowerCase()}__limit${limit}`

    if (!options.forceFresh && geocodeCache.has(cacheKey)) {
      return geocodeCache.get(cacheKey)
    }

    let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=${limit}`
    if (options.biasCoords && Array.isArray(options.biasCoords) && options.biasCoords.length === 2) {
      url += `&lat=${options.biasCoords[0]}&lon=${options.biasCoords[1]}`
    }

    const fetchOptions = {}
    if (options.signal) {
      fetchOptions.signal = options.signal
    }

    let response
    try {
      response = await fetch(url, fetchOptions)
    } catch (err) {
      if (err.name === 'AbortError') {
        throw err
      }
      throw new Error(`Geocoding network error: ${err.message || 'Unable to connect to Photon search service.'}`)
    }

    if (response.status === 429) {
      throw new Error('Geocoding rate limit reached. Please wait a moment before searching again.')
    }

    if (!response.ok) {
      throw new Error(`Geocoding service unavailable (HTTP ${response.status}).`)
    }

    const data = await response.json()
    const features = Array.isArray(data.features) ? data.features : []

    const suggestions = features
      .map((feat, index) => {
        const coords = feat.geometry?.coordinates || []
        if (coords.length < 2) return null
        const [lon, lat] = coords
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

        const props = feat.properties || {}
        const namePart = props.name || props.street || ''
        const streetPart = props.street && props.street !== props.name ? props.street : null
        const districtPart = props.district || props.suburb || null
        const cityPart = props.city || props.town || props.village || null
        const statePart = props.state || null
        const countryPart = props.country || null

        const localityParts = [districtPart, cityPart].filter(Boolean)
        const uniqueLocalities = localityParts.filter((v, i, arr) => arr.indexOf(v) === i)

        const segments = [namePart, streetPart, ...uniqueLocalities, statePart, countryPart].filter(Boolean)
        const label = segments.length > 0 ? segments.join(', ') : `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`

        return {
          id: `photon-${props.osm_id || index}-${lat}-${lon}`,
          name: namePart || label,
          label,
          coordinates: [lat, lon], // [latitude, longitude] for Leaflet
          osmType: props.osm_type,
          type: props.type,
          raw: feat,
        }
      })
      .filter(Boolean)

    geocodeCache.set(cacheKey, suggestions)
    return suggestions
  },

  /**
   * Real road route calculation using the public OSRM driving engine.
   * Accepts [lat, lon] coordinates, converts to OSRM's required "lon,lat" path format,
   * converts returned GeoJSON [lon, lat] coordinates back to Leaflet [lat, lon],
   * throttles requests to adhere to public server limits, and computes safety scores.
   */
  async fetchRealRouteOSRM(originCoords, destinationCoords, hazards = [], options = {}) {
    if (
      !Array.isArray(originCoords) ||
      originCoords.length < 2 ||
      !Number.isFinite(originCoords[0]) ||
      !Number.isFinite(originCoords[1])
    ) {
      throw new Error('Valid starting coordinates [latitude, longitude] are required for real road routing.')
    }

    if (
      !Array.isArray(destinationCoords) ||
      destinationCoords.length < 2 ||
      !Number.isFinite(destinationCoords[0]) ||
      !Number.isFinite(destinationCoords[1])
    ) {
      throw new Error('Valid destination coordinates [latitude, longitude] are required for real road routing.')
    }

    // Distance check to prevent identical start/destination
    const straightDistKm = calculateHaversineDistance(
      originCoords[0],
      originCoords[1],
      destinationCoords[0],
      destinationCoords[1]
    )

    if (straightDistKm < 0.02) {
      throw new Error('Route calculation unavailable: Starting point and destination cannot be the same location.')
    }

    const cacheKey = `${originCoords[0].toFixed(5)},${originCoords[1].toFixed(5)}_${destinationCoords[0].toFixed(5)},${destinationCoords[1].toFixed(5)}`
    if (!options.forceFresh && routeCache.has(cacheKey)) {
      const cached = routeCache.get(cacheKey)
      // Re-evaluate hazard scoring with currently provided hazards
      return cached.map((r, idx) => {
        const scoreData = calculateRouteSafetyScore(
          r.waypoints,
          hazards,
          idx === 0 ? 'recommended' : 'alternative'
        )
        return {
          ...r,
          safetyScore: scoreData.score,
          ratingLabel: scoreData.ratingLabel,
          toneColor: scoreData.toneColor,
          scoreFactors: scoreData.factors,
          nearbyHazards: scoreData.nearbyHazards,
        }
      })
    }

    // Respect public OSRM rate limits (maximum 1 req/sec)
    await throttleOsrm()

    // OSRM expects coordinates in lon,lat order in the URL path
    const [startLat, startLon] = originCoords
    const [endLat, endLon] = destinationCoords
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson&alternatives=true&steps=true`

    const fetchOptions = {}
    if (options.signal) {
      fetchOptions.signal = options.signal
    }

    let response
    try {
      response = await fetch(osrmUrl, fetchOptions)
    } catch (err) {
      if (err.name === 'AbortError') {
        throw err
      }
      throw new Error(`Road routing network error: ${err.message || 'Unable to connect to OSRM routing server.'}`)
    }

    if (response.status === 429) {
      throw new Error('OSRM routing rate limit exceeded. Please wait a moment before recalculating.')
    }

    if (!response.ok) {
      throw new Error(`OSRM routing service unavailable (HTTP ${response.status}).`)
    }

    const data = await response.json()
    if (data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0) {
      if (data.code === 'NoRoute') {
        throw new Error('No drivable road route found between these locations.')
      }
      throw new Error(`Routing error from OSRM: ${data.message || data.code || 'No route returned.'}`)
    }

    const originInfo = {
      name: options.originName || `${startLat.toFixed(4)}°, ${startLon.toFixed(4)}°`,
      coords: originCoords,
    }
    const destInfo = {
      name: options.destinationName || `${endLat.toFixed(4)}°, ${endLon.toFixed(4)}°`,
      coords: destinationCoords,
    }

    const parsedRoutes = data.routes.map((osrmRoute, index) => {
      // GeoJSON coordinates are [lon, lat] -> convert to Leaflet [lat, lon]
      const rawCoords = osrmRoute.geometry?.coordinates || []
      const waypoints = rawCoords.map(([lon, lat]) => [lat, lon])

      const distanceKm = Number((osrmRoute.distance / 1000).toFixed(1))
      const durationMins = Math.max(1, Math.round(osrmRoute.duration / 60))

      // Extract turn-by-turn road steps
      const rawSteps = osrmRoute.legs?.[0]?.steps || []
      const steps = rawSteps.map((step, sIdx) => {
        let instruction = step.name ? `Proceed onto ${step.name}` : 'Continue along road'
        const maneuverType = step.maneuver?.type
        const modifier = step.maneuver?.modifier

        if (maneuverType === 'depart') {
          instruction = modifier ? `Head ${modifier} on ${step.name || 'unnamed road'}` : `Depart on ${step.name || 'unnamed road'}`
        } else if (maneuverType === 'arrive') {
          instruction = 'Arrive at destination'
        } else if (maneuverType === 'turn') {
          instruction = modifier ? `Turn ${modifier} onto ${step.name || 'the road'}` : `Turn onto ${step.name || 'the road'}`
        } else if (maneuverType === 'new name') {
          instruction = `Continue onto ${step.name || 'the road'}`
        } else if (modifier) {
          instruction = `${modifier.charAt(0).toUpperCase() + modifier.slice(1)} at ${step.name || 'intersection'}`
        }

        return {
          id: `step-${index}-${sIdx}`,
          instruction,
          distanceMeters: Math.round(step.distance || 0),
          durationSeconds: Math.round(step.duration || 0),
          name: step.name || '',
          location: step.maneuver?.location ? [step.maneuver.location[1], step.maneuver.location[0]] : null,
        }
      })

      const isPrimary = index === 0
      const routeType = isPrimary ? 'recommended' : 'alternative'
      const scoreData = calculateRouteSafetyScore(waypoints, hazards, routeType)

      const roadSummary = osrmRoute.legs?.[0]?.summary
      const routeName = roadSummary
        ? `${isPrimary ? 'Primary: ' : 'Alternative: '}Via ${roadSummary}`
        : `${isPrimary ? 'Primary Driving Route' : `Alternative Route ${index}`}`

      return {
        id: `osrm-route-${index + 1}`,
        name: routeName,
        tag: isPrimary ? 'OSRM Live Road (Primary)' : `Alternative Road ${index}`,
        type: routeType,
        color: isPrimary ? tokens.accent : (index === 1 ? tokens.amber : '#4facfe'),
        isRealRoad: true,
        isPredefined: false,
        calculationType: 'osrm-live-road',
        distanceKm,
        durationMins,
        waypoints,
        steps,
        origin: originInfo,
        destination: destInfo,
        safetyScore: scoreData.score,
        ratingLabel: scoreData.ratingLabel,
        toneColor: scoreData.toneColor,
        scoreFactors: scoreData.factors,
        nearbyHazards: scoreData.nearbyHazards,
        summary: `Real-world road navigation via OSRM (${distanceKm} km, ~${durationMins} mins). Real road geometry with ${steps.length} navigational steps.`,
      }
    })

    routeCache.set(cacheKey, parsedRoutes)
    return parsedRoutes
  },

  /**
   * Generates 3 alternative mock routes for the given origin and destination,
   * calculating distances, durations, nearby hazards, and transparent safety scores.
   * Retained for demo presets and offline testing.
   */
  generateRouteAlternatives(originText, destinationText, hazards = []) {
    const originTrimmed = (originText || '').trim()
    const destTrimmed = (destinationText || '').trim()

    if (!originTrimmed || !destTrimmed) {
      throw new Error('Please enter both a starting point and a destination.')
    }
    if (originTrimmed.toLowerCase() === destTrimmed.toLowerCase()) {
      throw new Error('Route calculation unavailable: Starting point and destination cannot be the same.')
    }

    // Match or resolve coordinates
    const originHub = this.findHubByName(originTrimmed) || {
      coords: [12.9345, 77.6245],
      name: originTrimmed,
    }
    const destHub = this.findHubByName(destTrimmed) || {
      coords: [12.9719, 77.6412],
      name: destTrimmed,
    }

    // Base straight-line distance
    const baseDistKm = calculateHaversineDistance(
      originHub.coords[0],
      originHub.coords[1],
      destHub.coords[0],
      destHub.coords[1]
    )

    // Retrieve corridors
    const corridorKey = `${originHub.name} to ${destHub.name}`
    const isPredefined = Boolean(DEMO_CORRIDORS[corridorKey])
    const corridorData =
      DEMO_CORRIDORS[corridorKey] || DEMO_CORRIDORS.default(originHub.coords, destHub.coords)

    // Route 1: Recommended Safer Path (avoids critical hazards, uses main arterials)
    const waypointsR1 = corridorData.recommended
    const distR1 = Number((baseDistKm * 1.18 + 0.5).toFixed(1))
    const durationR1 = Math.round(distR1 * 2.3) + 4
    const scoreDataR1 = calculateRouteSafetyScore(waypointsR1, hazards, 'recommended')

    // Route 2: Direct Shortest Path (shortest km, but higher hazard encounter)
    const waypointsR2 = corridorData.direct
    const distR2 = Number((baseDistKm * 1.02 + 0.2).toFixed(1))
    const durationR2 = Math.round(distR2 * 2.1) + 2
    const scoreDataR2 = calculateRouteSafetyScore(waypointsR2, hazards, 'direct')

    // Route 3: Perimeter / Alternative Path
    const waypointsR3 = corridorData.alternative
    const distR3 = Number((baseDistKm * 1.35 + 0.8).toFixed(1))
    const durationR3 = Math.round(distR3 * 2.5) + 6
    const scoreDataR3 = calculateRouteSafetyScore(waypointsR3, hazards, 'alternative')

    return [
      {
        id: 'route-safer-1',
        name: 'Arterial Corridor (Recommended Safer Path)',
        tag: 'Recommended (Safer)',
        type: 'recommended',
        color: tokens.accent,
        isPredefined,
        isRealRoad: false,
        calculationType: isPredefined ? 'predefined-corridor' : 'synthetic-estimate',
        distanceKm: distR1,
        durationMins: durationR1,
        waypoints: waypointsR1,
        origin: originHub,
        destination: destHub,
        safetyScore: scoreDataR1.score,
        ratingLabel: scoreDataR1.ratingLabel,
        toneColor: scoreDataR1.toneColor,
        scoreFactors: scoreDataR1.factors,
        nearbyHazards: scoreDataR1.nearbyHazards,
        summary:
          'Navigates along well-lit primary transit arteries. Minimizes proximity to unlit sections and road excavations.',
      },
      {
        id: 'route-direct-2',
        name: 'Direct Transit Line (Shortest Distance)',
        tag: 'Direct (Higher Risk)',
        type: 'direct',
        color: tokens.amber,
        isPredefined,
        isRealRoad: false,
        calculationType: isPredefined ? 'predefined-corridor' : 'synthetic-estimate',
        distanceKm: distR2,
        durationMins: durationR2,
        waypoints: waypointsR2,
        origin: originHub,
        destination: destHub,
        safetyScore: scoreDataR2.score,
        ratingLabel: scoreDataR2.ratingLabel,
        toneColor: scoreDataR2.toneColor,
        scoreFactors: scoreDataR2.factors,
        nearbyHazards: scoreDataR2.nearbyHazards,
        summary:
          'Shortest travel distance through city center, but intersects active construction and localized traffic bottlenecks.',
      },
      {
        id: 'route-perimeter-3',
        name: 'Perimeter Bypass (Alternative Route)',
        tag: 'Alternative Bypass',
        type: 'alternative',
        color: '#4facfe', // Blue
        isPredefined,
        isRealRoad: false,
        calculationType: isPredefined ? 'predefined-corridor' : 'synthetic-estimate',
        distanceKm: distR3,
        durationMins: durationR3,
        waypoints: waypointsR3,
        origin: originHub,
        destination: destHub,
        safetyScore: scoreDataR3.score,
        ratingLabel: scoreDataR3.ratingLabel,
        toneColor: scoreDataR3.toneColor,
        scoreFactors: scoreDataR3.factors,
        nearbyHazards: scoreDataR3.nearbyHazards,
        summary:
          'Circumnavigates inner core delays via wider perimeter roads. Moderate travel distance with steady throughput.',
      },
    ]
  },
}

export default routeService
