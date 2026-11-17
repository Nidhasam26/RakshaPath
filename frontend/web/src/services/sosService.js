import storageService from './storageService'
import { POLICE_ALERTS_KEY } from './mockApi'
import { demoPoliceAlerts } from '../data/demoData'
import { notificationService, NOTIFICATION_TYPES } from './notificationService'
import tripService, { getSharedRegistry, SHARED_REGISTRY_KEY } from './tripService'

export const SOS_STATUS = {
  PREPARED: 'Prepared',
  QUEUED: 'Queued',
  SENT: 'Sent (simulated)',
}

export function getUserSosHistoryKey(userId) {
  return userId ? `rakshapath:${userId}:sos_history` : 'rakshapath:guest:sos_history'
}

export const sosService = {
  getHistory(userId) {
    const key = getUserSosHistoryKey(userId)
    return storageService.get(key, [])
  },

  /**
   * Adds or updates a user SOS history record.
   * If an item with the same ID already exists (e.g. status update or retry),
   * it updates the existing entry to prevent duplicate history records.
   */
  addHistoryItem(userId, item) {
    const key = getUserSosHistoryKey(userId)
    const current = this.getHistory(userId)
    const existingIndex = current.findIndex((h) => h.id === item.id)

    let updated
    if (existingIndex >= 0) {
      updated = [...current]
      updated[existingIndex] = { ...updated[existingIndex], ...item }
    } else {
      updated = [item, ...current]
    }

    storageService.set(key, updated)
    return updated
  },

  clearHistory(userId) {
    const key = getUserSosHistoryKey(userId)
    storageService.set(key, [])
    if (userId) {
      tripService.clearSosAlertFromSharedTrips(userId)
    }
  },

  /**
   * Dispatches the simulated SOS alert into the shared Police Dashboard store.
   * Ensures idempotency: updates existing incident if alert ID already exists,
   * avoiding duplicate alerts upon retries.
   * Protects private user credentials by only sharing necessary simulated data.
   */
  dispatchToPoliceFeed(alert, user) {
    const currentAlerts = storageService.get(POLICE_ALERTS_KEY, demoPoliceAlerts)
    const alertId = alert.id || `SOS-${Date.now().toString().slice(-4)}`
    const existingIndex = currentAlerts.findIndex((a) => a.id === alertId)

    const incidentData = {
      id: alertId,
      travellerUserId: user?.id,
      name: user?.name || 'Traveller (Demo)',
      location: alert.location?.address || alert.location?.coordsText || 'Coordinates shared (Demo)',
      time: 'Just now',
      status: 'New',
      severity: alert.severity || 'Critical',
      category: 'SOS Emergency',
      coords: alert.location?.coordinates || (alert.location?.latitude ? [alert.location.latitude, alert.location.longitude] : [12.9345, 77.6245]),
      detail: `Simulated SOS alert triggered (${alert.status || 'Sent (simulated)'}). ${alert.contactsCount || 0} emergency contacts queued for demo notification.`,
      // Privacy safeguard: do not expose private user account email or raw keys
      phone: '+91 98765 43210 (Demo Contact)',
      isSimulatedSos: true,
      timestamp: alert.timestamp || new Date().toISOString(),
      history: [
        {
          action: 'Alert Triggered (Demo)',
          status: 'New',
          time: new Date().toISOString(),
          by: user?.name || 'Traveller',
        },
      ],
    }

    let updated
    if (existingIndex >= 0) {
      updated = [...currentAlerts]
      const prev = updated[existingIndex]
      updated[existingIndex] = {
        ...incidentData,
        // Preserve triage status and existing history if already triaged by police
        status: prev.status || 'New',
        history: prev.history?.length ? prev.history : incidentData.history,
      }
    } else {
      updated = [incidentData, ...currentAlerts]
    }

    storageService.set(POLICE_ALERTS_KEY, updated)

    // Notify user of SOS dispatch status
    notificationService.addNotification(user?.id, {
      type: NOTIFICATION_TYPES.SOS,
      title: 'Emergency SOS Alert Queued',
      message: `Emergency SOS status: ${alert.status || 'Sent (simulated)'}. Dispatched to Police feed.`,
      severity: 'Critical',
    })

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('rakshapath:police_alerts_updated', { detail: { incident: incidentData } }))
    }

    return incidentData
  },

  /**
   * Notifies authorized Family members linked to the traveller's active shared trip tokens.
   */
  notifyAuthorizedFamily(alert, user) {
    if (!user?.id) return

    // 1. Attach SOS alert to active shared trips in registry
    tripService.attachSosAlertToSharedTrips(user.id, alert)

    // 2. Notify linked family subscribers
    const registry = getSharedRegistry()
    const matchingTokens = Object.values(registry).filter(
      (r) => r.travellerUserId === user.id && !r.isRevoked && new Date(r.expiresAt).getTime() >= Date.now()
    )

    matchingTokens.forEach((record) => {
      if (Array.isArray(record.subscribers)) {
        record.subscribers.forEach((familyUserId) => {
          notificationService.addNotification(familyUserId, {
            type: NOTIFICATION_TYPES.SOS,
            title: `EMERGENCY ALERT: ${record.travellerName}`,
            message: `${record.travellerName} confirmed an Emergency SOS (${alert.status}). Location telemetry available in your Family Monitor.`,
            severity: 'Critical',
            metadata: {
              token: record.token,
              alertId: alert.id,
              status: alert.status,
            },
          })
        })
      }
    })

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('rakshapath:family_alert_updated', { detail: { alert, userId: user.id } }))
    }
  },

  /**
   * Updates police incident status and synchronizes Traveller SOS history and Family sharing.
   */
  updateIncidentStatus(alertId, newStatus, actorName = 'Police Console') {
    const currentAlerts = storageService.get(POLICE_ALERTS_KEY, demoPoliceAlerts)
    let updatedTravellerUserId = null

    const updatedAlerts = currentAlerts.map((item) => {
      if (item.id !== alertId) return item
      updatedTravellerUserId = item.travellerUserId
      const existingHistory = Array.isArray(item.history) ? item.history : []
      const historyEntry = {
        action: `Status marked as ${newStatus}`,
        status: newStatus,
        timestamp: new Date().toISOString(),
        note: `Incident marked as ${newStatus} by ${actorName}`,
        by: actorName,
      }
      return {
        ...item,
        status: newStatus,
        history: [...existingHistory, historyEntry],
      }
    })

    storageService.set(POLICE_ALERTS_KEY, updatedAlerts)

    // If this incident is linked to a traveller, synchronize their user-scoped SOS history
    if (updatedTravellerUserId) {
      const history = this.getHistory(updatedTravellerUserId)
      const updatedHistory = history.map((h) =>
        h.id === alertId ? { ...h, policeStatus: newStatus } : h
      )
      storageService.set(getUserSosHistoryKey(updatedTravellerUserId), updatedHistory)

      // In-app notification to traveller
      notificationService.addNotification(updatedTravellerUserId, {
        type: NOTIFICATION_TYPES.SOS,
        title: `Incident Triage: ${newStatus}`,
        message: `Police console updated your emergency incident status to ${newStatus}.`,
        severity: newStatus === 'Resolved' ? 'Low' : 'Medium',
      })

      // Update active SOS in shared registry
      const registry = getSharedRegistry()
      let regUpdated = false
      Object.keys(registry).forEach((tok) => {
        if (registry[tok].travellerUserId === updatedTravellerUserId && registry[tok].activeSosAlert) {
          registry[tok].activeSosAlert.policeStatus = newStatus
          if (newStatus === 'Resolved') {
            registry[tok].activeSosAlert.isResolved = true
          }
          regUpdated = true
        }
      })
      if (regUpdated) {
        storageService.set(SHARED_REGISTRY_KEY, registry)
      }
    }

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('rakshapath:police_alerts_updated', { detail: { alertId, newStatus } }))
      window.dispatchEvent(new CustomEvent('rakshapath:family_share_updated', { detail: { alertId, newStatus } }))
    }

    return updatedAlerts
  },
}

export default sosService
