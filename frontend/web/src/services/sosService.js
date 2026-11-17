import storageService from './storageService'
import { POLICE_ALERTS_KEY } from './mockApi'
import { demoPoliceAlerts } from '../data/demoData'
import { notificationService, NOTIFICATION_TYPES } from './notificationService'

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
      name: user?.name || 'Traveller (Demo)',
      location: alert.location?.address || alert.location?.coordsText || 'Coordinates shared (Demo)',
      time: 'Just now',
      status: 'New',
      severity: alert.severity || 'Critical',
      category: 'SOS Emergency',
      coords: alert.location?.coordinates || [12.9345, 77.6245],
      detail: `Simulated SOS alert triggered (${alert.status || 'Sent (simulated)'}). ${alert.contactsCount || 0} emergency contacts queued for demo notification.`,
      // Privacy safeguard: do not expose private user account email or raw keys
      phone: '+91 98765 43210 (Demo Contact)',
      isSimulatedSos: true,
      timestamp: alert.timestamp || new Date().toISOString(),
      history: [
        {
          action: 'Alert Triggered (Demo)',
          time: new Date().toISOString(),
          by: user?.name || 'Traveller',
        },
      ],
    }

    let updated
    if (existingIndex >= 0) {
      updated = [...currentAlerts]
      updated[existingIndex] = { ...updated[existingIndex], ...incidentData }
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

    return incidentData
  },
}

export default sosService
