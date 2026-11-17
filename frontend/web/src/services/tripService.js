import storageService from './storageService'
import { routeService } from './routeService'
import { hazardService } from './hazardService'
import { notificationService, NOTIFICATION_TYPES } from './notificationService'

export const SHARED_REGISTRY_KEY = 'rakshapath:shared_trip_registry'
export const LEGACY_SHARED_REGISTRY_KEY = 'rakshapath_shared_trips_registry'

/**
 * Non-destructive migration and retrieval of the shared trip registry.
 * Safely preserves any pre-existing shares from legacy key format.
 */
export function getSharedRegistry() {
  const current = storageService.get(SHARED_REGISTRY_KEY, null)
  const legacy = storageService.get(LEGACY_SHARED_REGISTRY_KEY, null)

  if (legacy && typeof legacy === 'object' && Object.keys(legacy).length > 0) {
    const merged = { ...(legacy || {}), ...(current || {}) }
    storageService.set(SHARED_REGISTRY_KEY, merged)
    storageService.remove(LEGACY_SHARED_REGISTRY_KEY)
    return merged
  }

  return current || {}
}

export function getUserActiveTripKey(userId) {
  return userId ? `rakshapath:${userId}:active_trip` : 'rakshapath:guest:active_trip'
}

export function getUserTripsKey(userId) {
  return userId ? `rakshapath:${userId}:trips` : 'rakshapath:guest:trips'
}

export function getUserFamilyShareConfigKey(userId) {
  return userId ? `rakshapath:${userId}:family_share_config` : 'rakshapath:guest:family_share_config'
}

export const tripService = {
  /**
   * Retrieves active ongoing trip for a user.
   */
  getActiveTrip(userId) {
    const key = getUserActiveTripKey(userId)
    const trip = storageService.get(key, null)
    return trip && typeof trip === 'object' && trip.id ? trip : null
  },

  /**
   * Retrieves all user trips from scoped storage.
   */
  getUserTrips(userId) {
    const list = storageService.get(getUserTripsKey(userId), [])
    return Array.isArray(list) ? list : []
  },

  /**
   * Starts a new journey. Enforces maximum 1 active trip per user.
   */
  startTrip(userId, options = {}) {
    const { plannedTripId, start, end, route, distanceKm, durationMins } = options
    const existing = this.getActiveTrip(userId)
    if (existing && (existing.status === 'Active' || existing.status === 'Paused')) {
      throw new Error(
        'An active trip is already in progress. Please pause or end the ongoing journey before starting a new one.'
      )
    }

    if (!start || !end) {
      throw new Error('Starting point and destination are required to start a trip.')
    }

    // Resolve route
    let activeRoute = route
    if (!activeRoute) {
      const generated = routeService.generateRouteAlternatives(start, end)
      activeRoute = generated[0]
    }

    const distKm = Number(distanceKm || activeRoute.distanceKm) || 12.4
    const durMins = Number(durationMins || activeRoute.durationMins) || 28

    const activeTrip = {
      id: `TRIP-ACT-${Date.now().toString().slice(-5)}`,
      plannedTripId: plannedTripId || null,
      start: start.trim(),
      end: end.trim(),
      destination: end.trim(),
      route: {
        id: activeRoute.id || 'route-safer-1',
        name: activeRoute.name || 'Safer Corridor',
        type: activeRoute.type || 'recommended',
        distanceKm: distKm,
        durationMins: durMins,
        waypoints: activeRoute.waypoints || [],
        isPredefined: Boolean(activeRoute.isPredefined),
      },
      isPredefined: Boolean(activeRoute.isPredefined),
      progress: 0,
      totalDistanceKm: distKm,
      totalDurationMins: durMins,
      remainingKm: distKm,
      remainingMins: durMins,
      status: 'Active',
      isPaused: false,
      startedAt: new Date().toISOString(),
      lastTickAt: Date.now(),
      warnings: [],
      warningTriggered: false,
    }

    storageService.set(getUserActiveTripKey(userId), activeTrip)

    // Log trip notification
    notificationService.addNotification(userId, {
      type: NOTIFICATION_TYPES.TRIP,
      title: 'Journey Started',
      message: `Simulated trip to ${end} has begun along ${activeTrip.route.name}.`,
      severity: 'Low',
    })

    // Sync to shared registry if family sharing is active
    this.syncActiveTripToSharedRegistry(userId, activeTrip)

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('rakshapath:trip_updated', { detail: { userId } }))
    }

    return activeTrip
  },

  /**
   * Advances simulated movement progress (0–100%).
   */
  tickProgress(userId, deltaPercent = 5) {
    const trip = this.getActiveTrip(userId)
    if (!trip || trip.status !== 'Active' || trip.isPaused) return null

    const nextProgress = Math.min(100, Math.round(trip.progress + deltaPercent))
    const ratio = (100 - nextProgress) / 100
    const remainingKm = Number((trip.totalDistanceKm * ratio).toFixed(1))
    const remainingMins = Math.max(0, Math.round(trip.totalDurationMins * ratio))

    let warningTriggered = trip.warningTriggered
    const warnings = [...trip.warnings]

    let hazardAlert = trip.hazardAlert || null

    // Simulated 5 km Proactive Hazard Warning
    if (remainingKm <= 5.5 && remainingKm >= 1.0 && !warningTriggered) {
      const hazards = hazardService.getAllHazards(userId)
      const nearbyHazards = hazards.filter(
        (h) => h.status?.toLowerCase() === 'active' && (h.severity === 'Critical' || h.severity === 'High' || h.severity === 'Medium')
      )
      const targetHazard = nearbyHazards[0] || hazards[0]

      const warningText = targetHazard
        ? `Simulated route advisory: "${targetHazard.title}" approximately ${remainingKm} km ahead on path.`
        : `Simulated route advisory: Approaching monitored urban corridor in ~${remainingKm} km.`

      warnings.push(warningText)
      warningTriggered = true
      hazardAlert = targetHazard ? { hazard: targetHazard, distanceKm: remainingKm } : null

      notificationService.addNotification(userId, {
        type: NOTIFICATION_TYPES.HAZARD,
        title: 'Simulated 5 km Route Advisory',
        message: warningText,
        severity: 'High',
      })
    }

    const updatedTrip = {
      ...trip,
      progress: nextProgress,
      remainingKm,
      remainingMins,
      lastTickAt: Date.now(),
      warningTriggered,
      warnings,
      hazardAlert,
    }

    // Auto-complete if 100%
    if (nextProgress >= 100) {
      return this.endTrip(userId)
    }

    storageService.set(getUserActiveTripKey(userId), updatedTrip)
    this.syncActiveTripToSharedRegistry(userId, updatedTrip)

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('rakshapath:trip_updated', { detail: { userId } }))
    }

    return updatedTrip
  },

  /**
   * Pauses active journey simulation.
   */
  pauseTrip(userId) {
    const trip = this.getActiveTrip(userId)
    if (!trip) return null

    const updated = { ...trip, status: 'Paused', isPaused: true }
    storageService.set(getUserActiveTripKey(userId), updated)
    this.syncActiveTripToSharedRegistry(userId, updated)

    notificationService.addNotification(userId, {
      type: NOTIFICATION_TYPES.TRIP,
      title: 'Journey Paused',
      message: `Trip to ${trip.end} is paused at ${trip.progress}% progress.`,
      severity: 'Low',
    })

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('rakshapath:trip_updated', { detail: { userId } }))
    }

    return updated
  },

  /**
   * Resumes active journey simulation.
   */
  resumeTrip(userId) {
    const trip = this.getActiveTrip(userId)
    if (!trip) return null

    const updated = { ...trip, status: 'Active', isPaused: false, lastTickAt: Date.now() }
    storageService.set(getUserActiveTripKey(userId), updated)
    this.syncActiveTripToSharedRegistry(userId, updated)

    notificationService.addNotification(userId, {
      type: NOTIFICATION_TYPES.TRIP,
      title: 'Journey Resumed',
      message: `Trip to ${trip.end} has resumed at ${trip.progress}% progress.`,
      severity: 'Low',
    })

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('rakshapath:trip_updated', { detail: { userId } }))
    }

    return updated
  },

  /**
   * Ends and archives the ongoing trip to MyTrips.
   */
  endTrip(userId) {
    const trip = this.getActiveTrip(userId)
    if (!trip) return null

    // 1. Archive to user trips history
    const tripsKey = getUserTripsKey(userId)
    const currentTrips = storageService.get(tripsKey, [])

    const completedRecord = {
      id: trip.plannedTripId || trip.id,
      start: trip.start,
      end: trip.end,
      destination: trip.end,
      date: new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date()),
      status: 'Completed',
      distanceKm: trip.totalDistanceKm,
      durationMins: trip.totalDurationMins,
      completedAt: new Date().toISOString(),
    }

    const updatedTrips = [
      completedRecord,
      ...currentTrips.filter((t) => t.id !== completedRecord.id),
    ]
    storageService.set(tripsKey, updatedTrips)

    // 2. Clear active trip
    storageService.set(getUserActiveTripKey(userId), null)

    // 3. Mark completed in shared registry
    const registry = getSharedRegistry()
    const shareConfig = storageService.get(getUserFamilyShareConfigKey(userId), {})
    if (shareConfig?.activeToken && registry[shareConfig.activeToken]) {
      registry[shareConfig.activeToken] = {
        ...registry[shareConfig.activeToken],
        status: 'Completed',
        progress: 100,
        remainingKm: 0,
        remainingMins: 0,
        lastUpdated: new Date().toISOString(),
      }
      storageService.set(SHARED_REGISTRY_KEY, registry)
    }

    // 4. Log notification
    notificationService.addNotification(userId, {
      type: NOTIFICATION_TYPES.TRIP,
      title: 'Journey Completed',
      message: `Journey to ${trip.end} has been safely completed and archived to My Trips.`,
      severity: 'Low',
    })

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('rakshapath:trip_updated', { detail: { userId } }))
    }

    return completedRecord
  },

  // ----------------------------------------------------
  // Controlled Family Sharing Registry Methods
  // ----------------------------------------------------

  /**
   * Generates a controlled demonstration share token with expiry (2h, 6h, 24h).
   */
  generateShareToken(userId, { durationHours = 6, travellerName = 'Demo Traveller', privacyMode = false } = {}) {
    const randomHex = Math.random().toString(36).slice(2, 6).toUpperCase()
    const token = `SHR-${Date.now().toString(36).toUpperCase()}-${randomHex}`
    const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000).toISOString()

    // Privacy Masking: if privacyMode is enabled, mask display name (e.g. "Ananya S.")
    let displayName = travellerName.trim()
    if (privacyMode && displayName.includes(' ')) {
      const parts = displayName.split(/\s+/)
      displayName = `${parts[0]} ${parts[1][0]}.`
    }

    const activeTrip = this.getActiveTrip(userId)

    const payload = {
      token,
      travellerUserId: userId,
      travellerName: displayName,
      start: activeTrip?.start || 'Bengaluru Core',
      end: activeTrip?.end || 'Destination Hub',
      routeName: activeTrip?.route?.name || 'Safer Corridor',
      progress: activeTrip?.progress || 0,
      remainingKm: activeTrip?.remainingKm || 0,
      remainingMins: activeTrip?.remainingMins || 0,
      status: activeTrip?.status || 'Idle',
      lastUpdated: new Date().toISOString(),
      expiresAt,
      isRevoked: false,
      isMissedUpdate: false,
      isDemoSimulation: true,
    }

    // Save to shared registry
    const registry = getSharedRegistry()
    registry[token] = payload
    storageService.set(SHARED_REGISTRY_KEY, registry)

    // Save configuration in traveller's user storage
    const config = {
      isSharing: true,
      activeToken: token,
      expiresAt,
      durationHours,
      privacyMode,
    }
    storageService.set(getUserFamilyShareConfigKey(userId), config)

    notificationService.addNotification(userId, {
      type: NOTIFICATION_TYPES.FAMILY,
      title: 'Family Sharing Active',
      message: `Demo share link created (expires in ${durationHours} hours).`,
      severity: 'Low',
    })

    return payload
  },

  /**
   * Immediately revokes a share token.
   */
  revokeShareToken(userId, token) {
    const registry = getSharedRegistry()
    if (token && registry[token]) {
      registry[token] = {
        ...registry[token],
        isRevoked: true,
        lastUpdated: new Date().toISOString(),
      }
      storageService.set(SHARED_REGISTRY_KEY, registry)
    }

    // Reset user config
    storageService.set(getUserFamilyShareConfigKey(userId), {
      isSharing: false,
      activeToken: null,
      expiresAt: null,
    })

    notificationService.addNotification(userId, {
      type: NOTIFICATION_TYPES.FAMILY,
      title: 'Sharing Revoked',
      message: 'Family journey sharing has been revoked immediately.',
      severity: 'Low',
    })

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('rakshapath:family_share_updated', { detail: { userId } }))
    }
  },

  /**
   * Retrieves sanitized trip telemetry for a share token.
   */
  getSharedTripByToken(token) {
    if (!token) return null
    const registry = getSharedRegistry()
    const record = registry[token]

    if (!record) return { notFound: true }

    const isExpired = new Date(record.expiresAt).getTime() < Date.now()
    if (record.isRevoked || isExpired) {
      return {
        ...record,
        isRevoked: record.isRevoked || false,
        isExpired,
        status: record.isRevoked ? 'Revoked' : 'Expired',
      }
    }

    return record
  },

  /**
   * Simulates a calm 15-minute missed-update condition without auto-escalation.
   */
  simulateMissedUpdate(token) {
    const registry = getSharedRegistry()
    if (!token || !registry[token]) return null

    const updated = {
      ...registry[token],
      isMissedUpdate: true,
      lastUpdated: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
    }
    registry[token] = updated
    storageService.set(SHARED_REGISTRY_KEY, registry)

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('rakshapath:family_share_updated', { detail: { token } }))
    }

    return updated
  },

  /**
   * Synchronizes active trip progress to shared registry if sharing is active.
   */
  syncActiveTripToSharedRegistry(userId, activeTrip) {
    const config = storageService.get(getUserFamilyShareConfigKey(userId), null)
    if (!config?.isSharing || !config?.activeToken) return

    const registry = getSharedRegistry()
    if (!registry[config.activeToken]) return

    registry[config.activeToken] = {
      ...registry[config.activeToken],
      start: activeTrip.start,
      end: activeTrip.end,
      routeName: activeTrip.route?.name || 'Safer Corridor',
      progress: activeTrip.progress,
      remainingKm: activeTrip.remainingKm,
      remainingMins: activeTrip.remainingMins,
      status: activeTrip.status,
      lastUpdated: new Date().toISOString(),
    }
    storageService.set(SHARED_REGISTRY_KEY, registry)

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('rakshapath:family_share_updated', { detail: { token: config.activeToken } }))
    }
  },
}

export default tripService
