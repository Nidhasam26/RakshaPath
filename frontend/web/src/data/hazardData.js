import { tokens } from '../theme/tokens'

/**
 * Seed hazard demonstration dataset.
 * All entries are explicitly fictional and for demonstration purposes only.
 */

export const HAZARD_CATEGORIES = [
  'Poorly lit areas',
  'Unsafe or isolated locations',
  'Road accidents',
  'Traffic congestion',
  'Road closures',
  'Construction work',
  'Flooding or waterlogging',
  'Harassment or suspicious activity',
]

export const HAZARD_SEVERITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
}

export const HAZARD_STATUS = {
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  RESOLVED: 'Resolved',
}

// Severity color palette: Critical = --danger, High = orange, Medium = amber, Low = --info
export const SEVERITY_COLORS = {
  Low: tokens.info,       // Informational Blue (--info)
  Medium: tokens.amber,   // Amber
  High: tokens.orange,    // Orange
  Critical: tokens.danger,// Coral Red (--danger)
}

const NOW = Date.now()
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

export const initialSeedHazards = [
  {
    id: 'HAZ-2026-001',
    title: 'Waterlogging on Silk Board Underpass',
    category: 'Flooding or waterlogging',
    severity: 'High',
    position: [12.9172, 77.6227],
    locationName: 'Silk Board Junction Underpass',
    description: 'Significant water accumulation following unseasonal heavy rain. Slow movement for two-wheelers and sedans.',
    reportedAt: new Date(NOW - 3 * HOUR).toISOString(),
    expiresAt: new Date(NOW + 8 * HOUR).toISOString(),
    status: 'Active',
    radiusMeters: 400,
    source: 'Demonstration Traffic Feed (TomTom Demo)',
    isDemo: true,
  },
  {
    id: 'HAZ-2026-002',
    title: 'Defective Streetlights along Canal Road',
    category: 'Poorly lit areas',
    severity: 'Medium',
    position: [12.9352, 77.6189],
    locationName: 'Canal Road, Near 5th Cross',
    description: 'Multiple overhead sodium lamps non-functional for a 500m stretch. Low visibility for pedestrians after 7 PM.',
    reportedAt: new Date(NOW - 26 * HOUR).toISOString(),
    expiresAt: new Date(NOW + 48 * HOUR).toISOString(),
    status: 'Active',
    radiusMeters: 550,
    source: 'Traveller Safety Report (Demo)',
    isDemo: true,
  },
  {
    id: 'HAZ-2026-003',
    title: 'Metro Phase-3 Flyover Construction',
    category: 'Construction work',
    severity: 'Medium',
    position: [12.9385, 77.6308],
    locationName: 'Sony World Junction to 80 Feet Road',
    description: 'Heavy machinery and barricades restricting traffic to a single lane each side. Concrete delivery trucks present.',
    reportedAt: new Date(NOW - 12 * HOUR).toISOString(),
    expiresAt: new Date(NOW + 7 * DAY).toISOString(),
    status: 'Active',
    radiusMeters: 600,
    source: 'Municipal Works Notice (Demo)',
    isDemo: true,
  },
  {
    id: 'HAZ-2026-004',
    title: 'Road Surface Subsidence & Diversion',
    category: 'Road closures',
    severity: 'Critical',
    position: [12.9569, 77.6408],
    locationName: 'Indiranagar 100 Feet Road Diversion',
    description: 'Deep road cavity reported near drainage line. Road completely closed to vehicular movement; detours active.',
    reportedAt: new Date(NOW - 2 * HOUR).toISOString(),
    expiresAt: new Date(NOW + 14 * HOUR).toISOString(),
    status: 'Active',
    radiusMeters: 800,
    source: 'Official Police Alert (Demo)',
    isDemo: true,
  },
  {
    id: 'HAZ-2026-005',
    title: 'Isolated Railway Boundary Stretch',
    category: 'Unsafe or isolated locations',
    severity: 'High',
    position: [12.9642, 77.6121],
    locationName: 'East Railway Boundary Service Lane',
    description: 'Uninhabited service road lacking footfall, mobile signal fluctuations, and no commercial establishments.',
    reportedAt: new Date(NOW - 48 * HOUR).toISOString(),
    expiresAt: new Date(NOW + 30 * DAY).toISOString(),
    status: 'Active',
    radiusMeters: 500,
    source: 'Community Watch Advisory (Demo)',
    isDemo: true,
  },
  {
    id: 'HAZ-2026-006',
    title: 'Multi-Vehicle Collision Clearing',
    category: 'Road accidents',
    severity: 'Critical',
    position: [12.9716, 77.5946],
    locationName: 'MG Road Junction near Central Mall',
    description: 'Two-car collision blocking central lanes. Emergency services on scene; heavy gridlock reported.',
    reportedAt: new Date(NOW - 45 * 60 * 1000).toISOString(),
    expiresAt: new Date(NOW + 2 * HOUR).toISOString(),
    status: 'Active',
    radiusMeters: 450,
    source: 'Traffic Control Room (Demo)',
    isDemo: true,
  },
  {
    id: 'HAZ-2026-007',
    title: 'Evening Peak Hour Congestion',
    category: 'Traffic congestion',
    severity: 'Low',
    position: [12.9856, 77.6083],
    locationName: 'Trinity Circle towards Old Airport Road',
    description: 'Slow-moving commuter traffic with speeds averaging under 10 km/h.',
    reportedAt: new Date(NOW - 1 * HOUR).toISOString(),
    expiresAt: new Date(NOW + 3 * HOUR).toISOString(),
    status: 'Active',
    radiusMeters: 300,
    source: 'TomTom Traffic API (Demo)',
    isDemo: true,
  },
  {
    id: 'HAZ-2026-008',
    title: 'Unattended Gathering & Suspicious Loitering',
    category: 'Harassment or suspicious activity',
    severity: 'High',
    position: [12.9248, 77.6322],
    locationName: 'Koramangala 4th Block Park Perimeter',
    description: 'Group loitering near unlit ATM vestibule with reports of aggressive verbal confrontation. Exercise caution.',
    reportedAt: new Date(NOW - 4 * HOUR).toISOString(),
    expiresAt: new Date(NOW + 6 * HOUR).toISOString(),
    status: 'Active',
    radiusMeters: 350,
    source: 'Citizen Safety Alert (Demo)',
    isDemo: true,
  },
  {
    id: 'HAZ-2026-009',
    title: 'Cleared Broken Tree Limb',
    category: 'Road accidents',
    severity: 'Low',
    position: [12.9412, 77.6154],
    locationName: 'Madivala Lake Road',
    description: 'Fallen tree limb has been moved to road shoulder. Traffic restored to normal flow.',
    reportedAt: new Date(NOW - 36 * HOUR).toISOString(),
    expiresAt: new Date(NOW - 6 * HOUR).toISOString(), // Expired
    status: 'Expired',
    radiusMeters: 100,
    source: 'BBMP Ward Control (Demo)',
    isDemo: true,
  },
  {
    id: 'HAZ-2026-010',
    title: 'Repaired Water Pipeline Excavation',
    category: 'Construction work',
    severity: 'Low',
    position: [12.9511, 77.6288],
    locationName: 'Domlur Inner Ring Road',
    description: 'Pipeline repair completed; road resurfaced and opened for all traffic.',
    reportedAt: new Date(NOW - 24 * HOUR).toISOString(),
    expiresAt: new Date(NOW + 24 * HOUR).toISOString(),
    status: 'Resolved',
    radiusMeters: 150,
    source: 'Municipal Water Board (Demo)',
    isDemo: true,
  },
]
