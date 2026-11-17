import { DEMO_HUBS, DEMO_CORRIDORS } from '../data/routeData'
import { HAZARD_STATUS } from '../data/hazardData'

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
 * Checks which active hazards lie within `thresholdKm` of any waypoint along the route polyline.
 */
export function getNearbyHazardsForRoute(waypoints = [], hazards = [], thresholdKm = 0.75) {
  const activeHazards = hazards.filter((h) => h.status === HAZARD_STATUS.ACTIVE)
  const matched = []

  activeHazards.forEach((hazard) => {
    if (!hazard.position || !Array.isArray(hazard.position)) return
    const [hLat, hLng] = hazard.position

    let minDistance = Infinity
    for (const [wLat, wLng] of waypoints) {
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
      text: 'Follows major illuminated arterial roads with active public transit and CCTV coverage.',
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
      text: 'Secondary perimeter bypass with standard street lighting.',
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
  let toneColor = 'var(--lime, #c6f36a)'
  if (finalScore >= 85) {
    ratingLabel = 'Optimal Safety (Estimate)'
    toneColor = 'var(--mint, #64e2ba)'
  } else if (finalScore >= 70) {
    ratingLabel = 'Good Safety (Estimate)'
    toneColor = 'var(--lime, #c6f36a)'
  } else if (finalScore >= 50) {
    ratingLabel = 'Moderate Risk (Estimate)'
    toneColor = 'var(--amber, #ffc66d)'
  } else {
    ratingLabel = 'High Risk (Estimate)'
    toneColor = 'var(--coral, #ff6b6b)'
  }

  return {
    score: finalScore,
    ratingLabel,
    toneColor,
    factors,
    nearbyHazards,
    disclaimer:
      'Safety scores are illustrative estimates based on simulated mock data. RakshaPath does not guarantee route safety or road conditions.',
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

  /**
   * Generates 3 alternative mock routes for the given origin and destination,
   * calculating distances, durations, nearby hazards, and transparent safety scores.
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
        color: '#64e2ba', // Mint
        isPredefined,
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
        color: '#ffc66d', // Amber
        isPredefined,
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
