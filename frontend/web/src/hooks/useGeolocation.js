import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Enhanced Geolocation Hook with One-Shot and Continuous Tracking Capabilities.
 * Handles permission states, graceful fallbacks, heading, speed, and automatic watch cleanup.
 */
export function useGeolocation() {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [permissionState, setPermissionState] = useState(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return 'unsupported'
    return 'prompt'
  })
  const [isTracking, setIsTracking] = useState(false)
  const [lastSuccessfulTimestamp, setLastSuccessfulTimestamp] = useState(null)

  const watchIdRef = useRef(null)

  // One-shot location retrieval
  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const msg = 'Geolocation is not supported by this browser.'
      setError(msg)
      setPermissionState('unsupported')
      return Promise.resolve({ success: false, error: msg, permissionDenied: false })
    }

    setLoading(true)
    setError(null)
    setPermissionDenied(false)

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy || 0),
            heading: Number.isFinite(position.coords.heading) ? position.coords.heading : null,
            speed: Number.isFinite(position.coords.speed) ? position.coords.speed : null,
            coordsText: `${position.coords.latitude.toFixed(4)}° N, ${position.coords.longitude.toFixed(4)}° E`,
            timestamp: position.timestamp || Date.now(),
            isRealGps: true,
          }
          setLocation(loc)
          setLastSuccessfulTimestamp(loc.timestamp)
          setPermissionState('granted')
          setPermissionDenied(false)
          setLoading(false)
          resolve({ success: true, location: loc })
        },
        (geoError) => {
          let message = 'Location unavailable.'
          let denied = false
          if (geoError.code === geoError.PERMISSION_DENIED) {
            denied = true
            message =
              'Location permission was denied. You can continue, but coordinates will not be attached to the alert.'
            setPermissionState('denied')
          } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
            message = 'Position information is currently unavailable on this device.'
            setPermissionState('unavailable')
          } else if (geoError.code === geoError.TIMEOUT) {
            message = 'The location request timed out.'
            setPermissionState('timeout')
          }
          setPermissionDenied(denied)
          setError(message)
          setLoading(false)
          resolve({ success: false, error: message, permissionDenied: denied })
        },
        { timeout: 15000, enableHighAccuracy: true, maximumAge: 3000 }
      )
    })
  }, [])

  // Stop active position watcher
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
    setLoading(false)
  }, [])

  // Start continuous position watching
  const startWatching = useCallback(
    (customOptions = {}) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        const msg = 'Geolocation is not supported by this browser.'
        setError(msg)
        setPermissionState('unsupported')
        return
      }

      // If already watching, avoid starting a duplicate watcher
      if (watchIdRef.current !== null) {
        return
      }

      setLoading(true)
      setError(null)
      setIsTracking(true)

      const options = {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 15000,
        ...customOptions,
      }

      try {
        const id = navigator.geolocation.watchPosition(
          (position) => {
            const loc = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: Math.round(position.coords.accuracy || 0),
              heading: Number.isFinite(position.coords.heading) ? position.coords.heading : null,
              speed: Number.isFinite(position.coords.speed) ? position.coords.speed : null,
              coordsText: `${position.coords.latitude.toFixed(4)}° N, ${position.coords.longitude.toFixed(4)}° E`,
              timestamp: position.timestamp || Date.now(),
              isRealGps: true,
            }
            setLocation(loc)
            setLastSuccessfulTimestamp(loc.timestamp)
            setPermissionState('granted')
            setPermissionDenied(false)
            setLoading(false)
            setError(null)
          },
          (geoError) => {
            let message = 'Location unavailable.'
            let denied = false
            if (geoError.code === geoError.PERMISSION_DENIED) {
              denied = true
              message = 'Location permission was denied. Live tracking stopped.'
              setPermissionState('denied')
              stopWatching()
            } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
              message = 'GPS signal is currently unavailable on this device.'
              setPermissionState('unavailable')
            } else if (geoError.code === geoError.TIMEOUT) {
              message = 'Live GPS location update timed out.'
              setPermissionState('timeout')
            }
            setPermissionDenied(denied)
            setError(message)
            setLoading(false)
          },
          options
        )
        watchIdRef.current = id
      } catch (err) {
        setError(err.message || 'Failed to start GPS tracking.')
        setIsTracking(false)
        setLoading(false)
      }
    },
    [stopWatching]
  )

  // Automatic cleanup on hook unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [])

  // Evaluate whether current GPS fix is considered high-accuracy
  const isAccurate = Boolean(location && (location.accuracy == null || location.accuracy <= 65))

  return {
    location,
    error,
    loading,
    permissionDenied,
    permissionState,
    isTracking,
    lastSuccessfulTimestamp,
    isAccurate,
    requestLocation,
    startWatching,
    stopWatching,
  }
}

export default useGeolocation
