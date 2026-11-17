import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'

export function getUserStorageKey(userId, subKey) {
  return userId ? `rakshapath:${userId}:${subKey}` : `rakshapath:guest:${subKey}`
}

const GLOBAL_MIGRATION_FLAG = 'rakshapath:legacy_data_migrated'

/**
 * Migrates legacy unnamespaced global localStorage data to the active user's namespace.
 * Safety guarantees:
 * 1. Runs once per user account.
 * 2. Only assigns legacy data to the first logged-in user.
 * 3. Never overwrites existing namespaced data for that user.
 * 4. Preserves all legacy data if any write fails before full completion.
 * 5. Safe to retry if interrupted.
 * 6. Prevents second/subsequent accounts from inheriting the first account's data.
 */
export function migrateLegacyDataForUser(userId) {
  if (!userId) return

  const userMigrationKey = `rakshapath:${userId}:_migrated`
  if (localStorage.getItem(userMigrationKey)) {
    return
  }

  // If global legacy data was already migrated by another account, mark this user as migrated and exit
  if (localStorage.getItem(GLOBAL_MIGRATION_FLAG)) {
    localStorage.setItem(userMigrationKey, 'true')
    return
  }

  const legacyTrips = localStorage.getItem('trips')
  const legacyContacts = localStorage.getItem('contacts')
  const legacyPrimaryId = localStorage.getItem('primaryId')
  const legacyPrefsRaw = localStorage.getItem('rakshapath_preferences')
  const legacySharingRaw = localStorage.getItem('sharingEnabled')

  const hasAnyLegacyData =
    legacyTrips !== null ||
    legacyContacts !== null ||
    legacyPrimaryId !== null ||
    legacyPrefsRaw !== null ||
    legacySharingRaw !== null

  if (!hasAnyLegacyData) {
    // No legacy data exists to migrate
    localStorage.setItem(userMigrationKey, 'true')
    localStorage.setItem(GLOBAL_MIGRATION_FLAG, 'true')
    return
  }

  try {
    const pendingWrites = []

    // 1. Trips
    const userTripsKey = `rakshapath:${userId}:trips`
    if (legacyTrips !== null && localStorage.getItem(userTripsKey) === null) {
      pendingWrites.push([userTripsKey, legacyTrips])
    }

    // 2. Contacts
    const userContactsKey = `rakshapath:${userId}:contacts`
    if (legacyContacts !== null && localStorage.getItem(userContactsKey) === null) {
      pendingWrites.push([userContactsKey, legacyContacts])
    }

    // 3. Primary Contact ID
    const userPrimaryIdKey = `rakshapath:${userId}:primaryId`
    if (legacyPrimaryId !== null && localStorage.getItem(userPrimaryIdKey) === null) {
      pendingWrites.push([userPrimaryIdKey, legacyPrimaryId])
    }

    // 4. Preferences & Location Sharing unification
    const userPrefsKey = `rakshapath:${userId}:preferences`
    if (localStorage.getItem(userPrefsKey) === null) {
      let basePrefs = {
        notifications: true,
        safetyAlerts: true,
        tripReminders: true,
        locationSharing: false,
        privacyMode: true,
      }

      if (legacyPrefsRaw) {
        try {
          basePrefs = { ...basePrefs, ...JSON.parse(legacyPrefsRaw) }
        } catch {
          // ignore malformed legacy preferences
        }
      }

      if (legacySharingRaw !== null) {
        try {
          const sharingBool = JSON.parse(legacySharingRaw)
          if (typeof sharingBool === 'boolean') {
            basePrefs.locationSharing = sharingBool
          }
        } catch {
          // ignore malformed sharing boolean
        }
      }

      pendingWrites.push([userPrefsKey, JSON.stringify(basePrefs)])
    }

    // Step A: Perform all writes to the user namespace
    for (const [key, value] of pendingWrites) {
      localStorage.setItem(key, value)
    }

    // Step B: Only after all writes succeeded, clean up legacy global keys
    localStorage.removeItem('trips')
    localStorage.removeItem('contacts')
    localStorage.removeItem('primaryId')
    localStorage.removeItem('sharingEnabled')
    localStorage.removeItem('rakshapath_preferences')
    localStorage.removeItem('rakshapath_profile')

    // Step C: Mark migration complete globally and for this user
    localStorage.setItem(GLOBAL_MIGRATION_FLAG, 'true')
    localStorage.setItem(userMigrationKey, 'true')
  } catch (error) {
    console.error('Error migrating legacy data to user account:', error)
    // Legacy keys remain intact so migration can safely retry
  }
}

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    return stored !== null ? JSON.parse(stored) : fallback
  } catch (error) {
    console.error(`Error reading ${key}:`, error)
    return fallback
  }
}

export default function useUserStorage(subKey, initialValue) {
  const { user } = useAuth()
  const userId = user?.id || null
  const storageKey = getUserStorageKey(userId, subKey)

  useEffect(() => {
    if (userId) {
      migrateLegacyDataForUser(userId)
    }
  }, [userId])

  const [storedKey, setStoredKey] = useState(storageKey)
  const [value, setValue] = useState(() => {
    if (userId) {
      migrateLegacyDataForUser(userId)
    }
    return readStorage(storageKey, initialValue)
  })

  // Synchronously update when account / key changes
  if (storedKey !== storageKey) {
    setStoredKey(storageKey)
    if (userId) {
      migrateLegacyDataForUser(userId)
    }
    setValue(readStorage(storageKey, initialValue))
  }

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value))
    } catch (error) {
      console.error(`Error saving ${storageKey}:`, error)
    }
  }, [storageKey, value])

  return [value, setValue]
}
