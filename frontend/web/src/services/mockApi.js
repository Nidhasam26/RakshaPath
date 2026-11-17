import storageService from './storageService'
import { demoPoliceAlerts, initialTrips } from '../data/demoData'

export const POLICE_ALERTS_KEY = 'rakshapath_police_alerts'

/**
 * Mock API service simulating asynchronous operations with mock data.
 * Does not call any real external endpoints.
 */
export const mockApi = {
  async getPoliceAlerts() {
    return storageService.get(POLICE_ALERTS_KEY, demoPoliceAlerts)
  },

  async updatePoliceAlerts(alerts) {
    return storageService.set(POLICE_ALERTS_KEY, alerts)
  },

  async getInitialTrips() {
    return initialTrips
  },
}

export default mockApi
