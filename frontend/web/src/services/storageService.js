/**
 * Storage Service
 * Centralizes localStorage access, user-namespacing, and safe JSON serialization.
 */

export function getUserStorageKey(userId, subKey) {
  return userId ? `rakshapath:${userId}:${subKey}` : `rakshapath:guest:${subKey}`
}

export const storageService = {
  get(key, fallback = null) {
    try {
      const item = localStorage.getItem(key)
      return item !== null ? JSON.parse(item) : fallback
    } catch (error) {
      console.error(`storageService: Failed to read key "${key}":`, error)
      return fallback
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`storageService: Failed to write key "${key}":`, error)
      return false
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`storageService: Failed to remove key "${key}":`, error)
      return false
    }
  },

  getUserData(userId, subKey, fallback = null) {
    const key = getUserStorageKey(userId, subKey)
    return this.get(key, fallback)
  },

  setUserData(userId, subKey, value) {
    const key = getUserStorageKey(userId, subKey)
    return this.set(key, value)
  },
}

export default storageService
