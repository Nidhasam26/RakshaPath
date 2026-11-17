import { useState, useCallback } from 'react'

export function useGeolocation() {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      return Promise.reject(new Error('Geolocation not supported'))
    }

    setLoading(true)
    setError(null)

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy),
            coordsText: `${position.coords.latitude.toFixed(4)}° N, ${position.coords.longitude.toFixed(4)}° E`,
            timestamp: position.timestamp || Date.now(),
          }
          setLocation(loc)
          setLoading(false)
          resolve({ success: true, location: loc })
        },
        (geoError) => {
          let message = 'Location unavailable.'
          if (geoError.code === geoError.PERMISSION_DENIED) {
            message = 'Location permission was denied. You can continue, but coordinates will not be attached to the demo alert.'
          } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
            message = 'Position information is currently unavailable on this device.'
          } else if (geoError.code === geoError.TIMEOUT) {
            message = 'The location request timed out.'
          }
          setError(message)
          setLoading(false)
          resolve({ success: false, error: message })
        },
        { timeout: 10000, enableHighAccuracy: true }
      )
    })
  }, [])

  return {
    location,
    error,
    loading,
    requestLocation,
  }
}

export default useGeolocation
