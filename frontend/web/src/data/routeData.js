/**
 * Preset demonstration hubs and corridors for route simulation.
 * Coordinates are representative demonstration locations in Bangalore.
 */

export const DEMO_HUBS = [
  { id: 'hub-koramangala', name: 'Koramangala Sony World', coords: [12.9345, 77.6245] },
  { id: 'hub-indiranagar', name: 'Indiranagar 100ft Road', coords: [12.9719, 77.6412] },
  { id: 'hub-mgroad', name: 'MG Road Metro Station', coords: [12.9754, 77.6067] },
  { id: 'hub-silkboard', name: 'Silk Board Junction', coords: [12.9175, 77.6231] },
  { id: 'hub-whitefield', name: 'Whitefield ITPL', coords: [12.9863, 77.7342] },
  { id: 'hub-electronic-city', name: 'Electronic City Phase 1', coords: [12.8452, 77.6602] },
]

// Sample polyline waypoints for realistic route rendering between corridors
export const DEMO_CORRIDORS = {
  // Koramangala <-> Indiranagar (supports both full and short name keys)
  'Koramangala to Indiranagar': {
    recommended: [
      [12.9345, 77.6245], // Origin
      [12.9450, 77.6480], // Eastern Ring bypass (well lit, avoids construction & subsidence)
      [12.9620, 77.6530], // Well-lit arterial
      [12.9719, 77.6412], // Destination
    ],
    direct: [
      [12.9345, 77.6245], // Origin
      [12.9385, 77.6308], // Direct: intersects HAZ-2026-003 (Construction)
      [12.9569, 77.6408], // Direct: intersects HAZ-2026-004 (Critical road closure)
      [12.9719, 77.6412], // Destination
    ],
    alternative: [
      [12.9345, 77.6245],
      [12.9500, 77.6180],
      [12.9650, 77.6250],
      [12.9719, 77.6412],
    ],
  },
  // Default corridor generator for arbitrary user locations
  default: (originCoords, destCoords) => {
    const midLat = (originCoords[0] + destCoords[0]) / 2
    const midLng = (originCoords[1] + destCoords[1]) / 2

    return {
      recommended: [
        originCoords,
        [midLat + 0.012, midLng + 0.015],
        [midLat + 0.006, midLng + 0.010],
        destCoords,
      ],
      direct: [
        originCoords,
        [midLat, midLng],
        destCoords,
      ],
      alternative: [
        originCoords,
        [midLat - 0.010, midLng - 0.012],
        [midLat - 0.004, midLng - 0.006],
        destCoords,
      ],
    }
  },
}

// Alias for full names
DEMO_CORRIDORS['Koramangala Sony World to Indiranagar 100ft Road'] =
  DEMO_CORRIDORS['Koramangala to Indiranagar']
DEMO_CORRIDORS['Indiranagar 100ft Road to Koramangala Sony World'] = {
  recommended: [...DEMO_CORRIDORS['Koramangala to Indiranagar'].recommended].reverse(),
  direct: [...DEMO_CORRIDORS['Koramangala to Indiranagar'].direct].reverse(),
  alternative: [...DEMO_CORRIDORS['Koramangala to Indiranagar'].alternative].reverse(),
}
