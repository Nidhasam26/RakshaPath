import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/useAuth'
import tripService from '../services/tripService'

export function useTripTracker(autoTickIntervalMs = 4000) {
  const { user } = useAuth()
  const userId = user?.id

  const [activeTrip, setActiveTrip] = useState(() => tripService.getActiveTrip(userId))
  const timerRef = useRef(null)

  const refresh = useCallback(() => {
    setActiveTrip(tripService.getActiveTrip(userId))
  }, [userId])

  // Sync on window events and storage
  useEffect(() => {
    const handleTripUpdated = (e) => {
      if (!e.detail || e.detail.userId === userId || !userId) {
        refresh()
      }
    }

    const handleStorage = (e) => {
      if (e.key && e.key.includes(':active_trip')) {
        refresh()
      }
    }

    // Tab focus recovery: recalculate progress based on elapsed time if tab was backgrounded
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const current = tripService.getActiveTrip(userId)
        if (current && current.status === 'Active' && !current.isPaused && current.lastTickAt) {
          const elapsedSec = Math.floor((Date.now() - current.lastTickAt) / 1000)
          if (elapsedSec >= 4) {
            const steps = Math.min(15, Math.floor(elapsedSec / 4))
            tripService.tickProgress(userId, steps * 4)
          }
        }
        refresh()
      }
    }

    window.addEventListener('rakshapath:trip_updated', handleTripUpdated)
    window.addEventListener('storage', handleStorage)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('rakshapath:trip_updated', handleTripUpdated)
      window.removeEventListener('storage', handleStorage)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [userId, refresh])

  // Auto-tick interval when trip is active
  useEffect(() => {
    if (activeTrip && activeTrip.status === 'Active' && !activeTrip.isPaused) {
      timerRef.current = setInterval(() => {
        tripService.tickProgress(userId, 4)
        refresh()
      }, autoTickIntervalMs)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeTrip, userId, autoTickIntervalMs, refresh])

  const startTrip = useCallback(
    (params) => {
      const trip = tripService.startTrip(userId, params)
      refresh()
      return trip
    },
    [userId, refresh]
  )

  const pauseTrip = useCallback(() => {
    const trip = tripService.pauseTrip(userId)
    refresh()
    return trip
  }, [userId, refresh])

  const resumeTrip = useCallback(() => {
    const trip = tripService.resumeTrip(userId)
    refresh()
    return trip
  }, [userId, refresh])

  const endTrip = useCallback(() => {
    const result = tripService.endTrip(userId)
    refresh()
    return result
  }, [userId, refresh])

  return {
    activeTrip,
    startTrip,
    pauseTrip,
    resumeTrip,
    endTrip,
    refresh,
  }
}

export default useTripTracker
