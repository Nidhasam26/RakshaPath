import storageService from './storageService'
import {
  initialSeedHazards,
  HAZARD_CATEGORIES,
  HAZARD_SEVERITIES,
  HAZARD_STATUS,
} from '../data/hazardData'

export function getUserHazardsKey(userId) {
  return userId ? `rakshapath:${userId}:user_hazards` : 'rakshapath:guest:user_hazards'
}

export function getStatusOverridesKey() {
  return 'rakshapath:global:hazard_status_overrides'
}

export const hazardService = {
  /**
   * Returns default seeded hazards with status dynamically updated for expiration.
   */
  getSeedHazards() {
    const rawOverrides = storageService.get(getStatusOverridesKey(), {})
    const overrides = rawOverrides && typeof rawOverrides === 'object' ? rawOverrides : {}
    const now = Date.now()

    return initialSeedHazards.map((item) => {
      let status = overrides[item.id] || item.status
      if (status === HAZARD_STATUS.ACTIVE && item.expiresAt && new Date(item.expiresAt).getTime() < now) {
        status = HAZARD_STATUS.EXPIRED
      }
      return {
        ...item,
        status,
      }
    })
  },

  /**
   * Retrieves user-reported hazards from isolated LocalStorage.
   * Defensively filters out malformed or corrupt entries.
   */
  getUserHazards(userId) {
    const key = getUserHazardsKey(userId)
    const rawReports = storageService.get(key, [])
    const userReports = Array.isArray(rawReports) ? rawReports : []
    const now = Date.now()

    return userReports
      .filter(
        (item) =>
          item &&
          typeof item === 'object' &&
          Array.isArray(item.position) &&
          item.position.length >= 2 &&
          typeof item.position[0] === 'number' &&
          typeof item.position[1] === 'number' &&
          !isNaN(item.position[0]) &&
          !isNaN(item.position[1])
      )
      .map((item) => {
        let status = item.status || HAZARD_STATUS.ACTIVE
        if (status === HAZARD_STATUS.ACTIVE && item.expiresAt && new Date(item.expiresAt).getTime() < now) {
          status = HAZARD_STATUS.EXPIRED
        }
        return {
          ...item,
          status,
        }
      })
  },

  /**
   * Combines seeded hazards and user-submitted hazards for the given account.
   */
  getAllHazards(userId) {
    const seeds = this.getSeedHazards()
    const userHazards = this.getUserHazards(userId)
    return [...userHazards, ...seeds]
  },

  /**
   * Validates and records a new hazard report scoped to the user account.
   */
  addReport(userId, data) {
    // 1. Validation
    if (!data.title || !data.title.trim()) {
      throw new Error('Hazard title is required.')
    }
    if (!data.category || !HAZARD_CATEGORIES.includes(data.category)) {
      throw new Error('A valid hazard category must be selected.')
    }
    if (!data.severity || !Object.values(HAZARD_SEVERITIES).includes(data.severity)) {
      throw new Error('A valid severity level (Low, Medium, High, Critical) must be chosen.')
    }
    if (!data.description || !data.description.trim()) {
      throw new Error('Please provide an informative description of the hazard.')
    }
    if (
      !data.position ||
      !Array.isArray(data.position) ||
      data.position.length !== 2 ||
      typeof data.position[0] !== 'number' ||
      typeof data.position[1] !== 'number'
    ) {
      throw new Error('Valid geographic coordinates (latitude and longitude) are required.')
    }

    // 2. Duplicate detection: prevent identical title and position reported in last 10 minutes
    const existing = this.getUserHazards(userId)
    const isDuplicate = existing.some(
      (h) =>
        h.title.toLowerCase().trim() === data.title.toLowerCase().trim() &&
        Math.abs(h.position[0] - data.position[0]) < 0.0005 &&
        Math.abs(h.position[1] - data.position[1]) < 0.0005 &&
        Date.now() - new Date(h.reportedAt).getTime() < 10 * 60 * 1000
    )
    if (isDuplicate) {
      throw new Error('A similar hazard report was recently submitted. Duplicate reports are prevented.')
    }

    // 3. Packaging
    const now = new Date()
    const durationHours = Number(data.durationHours) || 6
    const expiresAt = new Date(now.getTime() + durationHours * 3600 * 1000).toISOString()

    const newReport = {
      id: data.id || `HAZ-USER-${Date.now().toString().slice(-5)}`,
      title: data.title.trim(),
      category: data.category,
      severity: data.severity,
      position: [Number(data.position[0].toFixed(5)), Number(data.position[1].toFixed(5))],
      locationName: data.locationName || `${data.position[0].toFixed(4)}° N, ${data.position[1].toFixed(4)}° E`,
      description: data.description.trim(),
      reportedAt: now.toISOString(),
      expiresAt,
      status: HAZARD_STATUS.ACTIVE,
      radiusMeters: Number(data.radiusMeters) || 300,
      source: 'User Report (Demo)',
      userId: userId || 'guest',
      isDemo: true,
    }

    const updatedUserReports = [newReport, ...existing]
    storageService.set(getUserHazardsKey(userId), updatedUserReports)
    return newReport
  },

  /**
   * Updates hazard status (Active, Resolved, Expired).
   */
  updateHazardStatus(userId, hazardId, newStatus) {
    if (!Object.values(HAZARD_STATUS).includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`)
    }

    // Check if it belongs to user-reported hazards
    const key = getUserHazardsKey(userId)
    const userReports = storageService.get(key, [])
    const userIdx = userReports.findIndex((h) => h.id === hazardId)

    if (userIdx >= 0) {
      const updated = [...userReports]
      updated[userIdx] = { ...updated[userIdx], status: newStatus }
      storageService.set(key, updated)
      return updated[userIdx]
    }

    // Otherwise record in global demo status overrides
    const overridesKey = getStatusOverridesKey()
    const overrides = storageService.get(overridesKey, {})
    overrides[hazardId] = newStatus
    storageService.set(overridesKey, overrides)
    return { id: hazardId, status: newStatus }
  },

  /**
   * Filters a list of hazards by category, severity, status, and search query.
   */
  filterHazards(hazards = [], filters = {}) {
    return hazards.filter((hazard) => {
      if (filters.category && filters.category !== 'All' && hazard.category !== filters.category) {
        return false
      }
      if (filters.severity && filters.severity !== 'All' && hazard.severity !== filters.severity) {
        return false
      }
      if (filters.status && filters.status !== 'All' && hazard.status !== filters.status) {
        return false
      }
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim()
        const titleMatch = hazard.title?.toLowerCase().includes(q)
        const descMatch = hazard.description?.toLowerCase().includes(q)
        const locMatch = hazard.locationName?.toLowerCase().includes(q)
        const catMatch = hazard.category?.toLowerCase().includes(q)
        if (!titleMatch && !descMatch && !locMatch && !catMatch) {
          return false
        }
      }
      return true
    })
  },
}

export default hazardService
