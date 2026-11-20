import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Loader2,
  MapPin,
  Navigation,
  Route,
  Shield,
  Sparkles,
} from 'lucide-react'
import { routeService } from '../../services/routeService'
import { SEVERITY_COLORS } from '../../data/hazardData'

export function RoutePlanner({
  hazards = [],
  onSelectRoute,
  selectedRouteId,
  onRoutesCalculated,
  userLocation,
}) {
  const demoHubs = routeService.getDemoHubs()

  const hasUserLocation = Boolean(
    userLocation &&
      ((Array.isArray(userLocation) && userLocation.length === 2 && Number.isFinite(userLocation[0]) && Number.isFinite(userLocation[1])) ||
        (Number.isFinite(userLocation?.latitude) && Number.isFinite(userLocation?.longitude)))
  )

  const getUserCoords = () => {
    if (!hasUserLocation) return null
    if (Array.isArray(userLocation)) return userLocation
    return [userLocation.latitude, userLocation.longitude]
  }

  // Input states
  const [origin, setOrigin] = useState('Koramangala Sony World')
  const [destination, setDestination] = useState('Indiranagar 100ft Road')

  // Resolved coordinates { name, coords: [lat, lon] }
  const [originLocation, setOriginLocation] = useState(() => {
    const hub = routeService.findHubByName('Koramangala Sony World')
    return hub ? { name: hub.name, coords: hub.coords } : null
  })
  const [destLocation, setDestLocation] = useState(() => {
    const hub = routeService.findHubByName('Indiranagar 100ft Road')
    return hub ? { name: hub.name, coords: hub.coords } : null
  })

  // Autocomplete states
  const [originSuggestions, setOriginSuggestions] = useState([])
  const [destSuggestions, setDestSuggestions] = useState([])
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false)
  const [isSearchingDest, setIsSearchingDest] = useState(false)
  const [showOriginDropdown, setShowOriginDropdown] = useState(false)
  const [showDestDropdown, setShowDestDropdown] = useState(false)

  // Loading & calculation states
  const [isCalculating, setIsCalculating] = useState(false)
  const [showSteps, setShowSteps] = useState(false)
  const [error, setError] = useState(null)
  const [canFallbackDemo, setCanFallbackDemo] = useState(false)

  // Abort controllers for autocomplete requests
  const originAbortRef = useRef(null)
  const destAbortRef = useRef(null)
  const skipNextOriginGeocodeRef = useRef(false)
  const skipNextDestGeocodeRef = useRef(false)
  const originTouchedRef = useRef(false)
  const destTouchedRef = useRef(false)

  // Initial demo routes for testing compatibility
  const [routes, setRoutes] = useState(() => {
    try {
      return routeService.generateRouteAlternatives(
        'Koramangala Sony World',
        'Indiranagar 100ft Road',
        hazards
      )
    } catch {
      return []
    }
  })

  // Debounced geocoding for Origin input (only when user actively modifies input)
  useEffect(() => {
    if (!originTouchedRef.current) {
      return
    }

    if (skipNextOriginGeocodeRef.current) {
      skipNextOriginGeocodeRef.current = false
      return
    }

    const trimmed = origin.trim()
    if (trimmed.length < 3) {
      return
    }

    if (originAbortRef.current) {
      originAbortRef.current.abort()
    }
    const abortController = new AbortController()
    originAbortRef.current = abortController

    const timer = setTimeout(async () => {
      setIsSearchingOrigin(true)
      try {
        const results = await routeService.geocodePhoton(trimmed, {
          limit: 5,
          signal: abortController.signal,
        })
        setOriginSuggestions(results)
        setShowOriginDropdown(results.length > 0)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setOriginSuggestions([])
          setShowOriginDropdown(false)
        }
      } finally {
        setIsSearchingOrigin(false)
      }
    }, 450)

    return () => {
      clearTimeout(timer)
      abortController.abort()
    }
  }, [origin])

  // Debounced geocoding for Destination input (only when user actively modifies input)
  useEffect(() => {
    if (!destTouchedRef.current) {
      return
    }

    if (skipNextDestGeocodeRef.current) {
      skipNextDestGeocodeRef.current = false
      return
    }

    const trimmed = destination.trim()
    if (trimmed.length < 3) {
      return
    }

    if (destAbortRef.current) {
      destAbortRef.current.abort()
    }
    const abortController = new AbortController()
    destAbortRef.current = abortController

    const timer = setTimeout(async () => {
      setIsSearchingDest(true)
      try {
        const results = await routeService.geocodePhoton(trimmed, {
          limit: 5,
          signal: abortController.signal,
        })
        setDestSuggestions(results)
        setShowDestDropdown(results.length > 0)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setDestSuggestions([])
          setShowDestDropdown(false)
        }
      } finally {
        setIsSearchingDest(false)
      }
    }, 450)

    return () => {
      clearTimeout(timer)
      abortController.abort()
    }
  }, [destination])

  // Swap origin and destination
  const handleSwap = () => {
    skipNextOriginGeocodeRef.current = true
    skipNextDestGeocodeRef.current = true
    const prevOrigin = origin
    const prevOriginLoc = originLocation
    setOrigin(destination)
    setOriginLocation(destLocation)
    setDestination(prevOrigin)
    setDestLocation(prevOriginLoc)
    setShowOriginDropdown(false)
    setShowDestDropdown(false)
  }

  // Set origin to real GPS current location
  const handleUseCurrentLocation = () => {
    const coords = getUserCoords()
    if (!coords) return
    skipNextOriginGeocodeRef.current = true
    setOrigin('My Current Location')
    setOriginLocation({
      name: 'My Current Location',
      coords,
    })
    setOriginSuggestions([])
    setShowOriginDropdown(false)
  }

  // Selection from origin suggestions
  const handleSelectOriginSuggestion = (item) => {
    skipNextOriginGeocodeRef.current = true
    setOrigin(item.name || item.label)
    setOriginLocation({ name: item.name, coords: item.coordinates })
    setOriginSuggestions([])
    setShowOriginDropdown(false)
  }

  // Selection from destination suggestions
  const handleSelectDestSuggestion = (item) => {
    skipNextDestGeocodeRef.current = true
    setDestination(item.name || item.label)
    setDestLocation({ name: item.name, coords: item.coordinates })
    setDestSuggestions([])
    setShowDestDropdown(false)
  }

  // Preset button selection
  const handleSelectPreset = (hub) => {
    skipNextDestGeocodeRef.current = true
    setDestination(hub.name)
    setDestLocation({ name: hub.name, coords: hub.coords })
    setDestSuggestions([])
    setShowDestDropdown(false)
  }

  // Execute route calculation (prefers real OSRM road routing)
  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    setError(null)
    setCanFallbackDemo(false)
    setShowOriginDropdown(false)
    setShowDestDropdown(false)

    const originTrimmed = (origin || '').trim()
    const destTrimmed = (destination || '').trim()

    if (!originTrimmed || !destTrimmed) {
      setError('Please enter both a starting point and a destination.')
      return
    }
    if (originTrimmed.toLowerCase() === destTrimmed.toLowerCase()) {
      setError('Route calculation unavailable: Starting point and destination cannot be the same.')
      return
    }

    setIsCalculating(true)

    try {
      // 1. Resolve Origin Coordinates
      let resolvedOriginCoords = originLocation?.coords
      if (!resolvedOriginCoords) {
        if (hasUserLocation && /current\s+location/i.test(originTrimmed)) {
          resolvedOriginCoords = getUserCoords()
          setOriginLocation({ name: 'My Current Location', coords: resolvedOriginCoords })
        } else {
          const matchedHub = routeService.findHubByName(originTrimmed)
          if (matchedHub) {
            resolvedOriginCoords = matchedHub.coords
          } else {
            const geocoded = await routeService.geocodePhoton(originTrimmed, { limit: 1 })
            if (geocoded.length > 0) {
              resolvedOriginCoords = geocoded[0].coordinates
              setOriginLocation({ name: geocoded[0].name, coords: geocoded[0].coordinates })
            }
          }
        }
      }

      if (!resolvedOriginCoords) {
        throw new Error(
          `Could not locate starting point "${originTrimmed}". Please choose a location from suggestions.`
        )
      }

      // 2. Resolve Destination Coordinates
      let resolvedDestCoords = destLocation?.coords
      if (!resolvedDestCoords) {
        const matchedHub = routeService.findHubByName(destTrimmed)
        if (matchedHub) {
          resolvedDestCoords = matchedHub.coords
        } else {
          const geocoded = await routeService.geocodePhoton(destTrimmed, { limit: 1 })
          if (geocoded.length > 0) {
            resolvedDestCoords = geocoded[0].coordinates
            setDestLocation({ name: geocoded[0].name, coords: geocoded[0].coordinates })
          }
        }
      }

      if (!resolvedDestCoords) {
        throw new Error(
          `Could not locate destination "${destTrimmed}". Please choose a location from suggestions.`
        )
      }

      // 3. Request Real OSRM Road Routes
      const realRoutes = await routeService.fetchRealRouteOSRM(
        resolvedOriginCoords,
        resolvedDestCoords,
        hazards,
        {
          originName: originTrimmed,
          destinationName: destTrimmed,
        }
      )

      setRoutes(realRoutes)
      if (onRoutesCalculated) {
        onRoutesCalculated(realRoutes)
      }
      if (realRoutes.length > 0 && onSelectRoute) {
        onSelectRoute(realRoutes[0])
      }
    } catch (err) {
      setError(err.message || 'Real road calculation failed.')
      setCanFallbackDemo(true)
    } finally {
      setIsCalculating(false)
    }
  }

  // Explicit Fallback to Offline Demo Corridors
  const handleFallbackDemo = () => {
    setError(null)
    setCanFallbackDemo(false)
    try {
      const generated = routeService.generateRouteAlternatives(origin, destination, hazards)
      setRoutes(generated)
      if (onRoutesCalculated) {
        onRoutesCalculated(generated)
      }
      if (generated.length > 0 && onSelectRoute) {
        onSelectRoute(generated[0])
      }
    } catch (err) {
      setError(err.message || 'Failed to generate demo routes.')
    }
  }

  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0]
  const isRealRoadRoute = Boolean(activeRoute?.isRealRoad)

  return (
    <div className="route-planner" style={{ display: 'grid', gap: 16 }}>
      {/* Origin & Destination Search Form */}
      <div className="panel panel-pad">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Compass size={18} color="var(--accent)" />
            <h3 style={{ fontSize: 16, margin: 0 }}>Route Safety Intelligence</h3>
          </div>
          <span className={isRealRoadRoute ? 'pill pill-accent' : 'badge-demo'}>
            {isRealRoadRoute ? 'LIVE ROAD ROUTING (OSRM)' : 'DEMO ESTIMATES'}
          </span>
        </div>

        <p className="muted" style={{ fontSize: 12, margin: '0 0 14px' }}>
          Compare travel routes based on real road geometry, distance, duration, and safety intelligence from reported hazards.
        </p>

        {error && (
          <div
            className="notice"
            role="alert"
            style={{
              marginBottom: 14,
              borderColor: 'var(--coral)',
              color: 'var(--coral)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
            {canFallbackDemo && (
              <button
                type="button"
                className="btn btn-quiet"
                onClick={handleFallbackDemo}
                style={{ fontSize: 11, alignSelf: 'flex-start', minHeight: 28 }}
              >
                <Sparkles size={13} color="var(--mint)" /> Switch to Predefined Demo Corridors
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSearch} style={{ display: 'grid', gap: 10 }}>
          <div
            className="route-inputs-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
              gap: 8,
              alignItems: 'center',
            }}
          >
            {/* Origin Input with Autocomplete */}
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label htmlFor="origin-input" style={{ fontSize: 11, fontWeight: 600 }}>
                  Starting Point
                </label>
                {hasUserLocation && (
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="btn btn-quiet"
                    style={{
                      fontSize: 10,
                      padding: '1px 6px',
                      minHeight: 22,
                      height: 22,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      color: 'var(--mint)',
                    }}
                    title="Use GPS current location as origin"
                    aria-label="Set origin to current GPS location"
                  >
                    <Navigation size={11} /> Use Current Location
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="origin-input"
                  type="text"
                  className="input"
                  placeholder="Enter starting location..."
                  value={origin}
                  onChange={(e) => {
                    const val = e.target.value
                    originTouchedRef.current = true
                    setOrigin(val)
                    setOriginLocation(null)
                    if (val.trim().length < 3) {
                      setOriginSuggestions([])
                      setShowOriginDropdown(false)
                    }
                  }}
                  onFocus={() => {
                    if (originSuggestions.length > 0 || hasUserLocation) setShowOriginDropdown(true)
                  }}
                  autoComplete="off"
                />
                {isSearchingOrigin && (
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                    <Loader2 size={14} className="spin" color="var(--muted)" />
                  </span>
                )}
              </div>

              {/* Origin Autocomplete Dropdown */}
              {showOriginDropdown && (originSuggestions.length > 0 || hasUserLocation) && (
                <div className="suggestions-dropdown" role="listbox" aria-label="Origin suggestions">
                  {hasUserLocation && (
                    <button
                      type="button"
                      role="option"
                      aria-selected={origin === 'My Current Location'}
                      className="suggestion-item"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleUseCurrentLocation()
                      }}
                      onClick={handleUseCurrentLocation}
                      style={{ borderBottom: '1px solid var(--line, rgba(255,255,255,0.08))' }}
                    >
                      <Navigation size={13} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mint)' }} />
                      <div>
                        <strong style={{ color: 'var(--mint)' }}>Use My Current Location</strong>
                        <div className="muted" style={{ fontSize: 11 }}>
                          GPS: {getUserCoords()?.[0]?.toFixed(4)}°, {getUserCoords()?.[1]?.toFixed(4)}°
                        </div>
                      </div>
                    </button>
                  )}
                  {originSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={false}
                      className="suggestion-item"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSelectOriginSuggestion(item)
                      }}
                      onClick={() => handleSelectOriginSuggestion(item)}
                    >
                      <MapPin size={13} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mint)' }} />
                      <div>
                        <strong>{item.name}</strong>
                        <div className="muted" style={{ fontSize: 11 }}>
                          {item.label}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reverse Route Button (44px touch target) */}
            <button
              type="button"
              className="btn btn-quiet reverse-btn"
              onClick={handleSwap}
              title="Reverse route"
              aria-label="Reverse route"
              style={{ marginTop: 18, width: 44, height: 44, minWidth: 44, minHeight: 44, padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowUpDown size={15} />
            </button>

            {/* Destination Input with Autocomplete */}
            <div style={{ position: 'relative' }}>
              <label htmlFor="destination-input" style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                Destination
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="destination-input"
                  type="text"
                  className="input"
                  placeholder="Enter destination..."
                  value={destination}
                  onChange={(e) => {
                    const val = e.target.value
                    destTouchedRef.current = true
                    setDestination(val)
                    setDestLocation(null)
                    if (val.trim().length < 3) {
                      setDestSuggestions([])
                      setShowDestDropdown(false)
                    }
                  }}
                  onFocus={() => {
                    if (destSuggestions.length > 0) setShowDestDropdown(true)
                  }}
                  autoComplete="off"
                />
                {isSearchingDest && (
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                    <Loader2 size={14} className="spin" color="var(--muted)" />
                  </span>
                )}
              </div>

              {/* Destination Autocomplete Dropdown */}
              {showDestDropdown && destSuggestions.length > 0 && (
                <div className="suggestions-dropdown" role="listbox" aria-label="Destination suggestions">
                  {destSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={false}
                      className="suggestion-item"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSelectDestSuggestion(item)
                      }}
                      onClick={() => handleSelectDestSuggestion(item)}
                    >
                      <MapPin size={13} style={{ flexShrink: 0, marginTop: 2, color: 'var(--coral)' }} />
                      <div>
                        <strong>{item.name}</strong>
                        <div className="muted" style={{ fontSize: 11 }}>
                          {item.label}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Preset Hub Buttons (Clearly labeled Demo Presets) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            <span className="muted" style={{ fontSize: 10, alignSelf: 'center', marginRight: 4 }}>
              Demo Presets:
            </span>
            {demoHubs.map((hub) => (
              <button
                key={hub.id}
                type="button"
                className="btn btn-quiet"
                style={{ fontSize: 10, padding: '2px 8px', minHeight: 26, borderRadius: 12 }}
                onClick={() => handleSelectPreset(hub)}
              >
                {hub.name}
              </button>
            ))}
          </div>

          {/* Corridor Transparency Banner */}
          {routes.length > 0 && (
            <div
              className="notice"
              role="status"
              style={{
                fontSize: 11,
                marginTop: 6,
                padding: '7px 12px',
                borderColor: routes[0]?.isRealRoad
                  ? 'rgba(100, 226, 186, 0.4)'
                  : routes[0]?.isPredefined
                  ? 'rgba(100, 226, 186, 0.35)'
                  : 'rgba(255, 198, 109, 0.35)',
              }}
            >
              <Route
                size={14}
                color={
                  routes[0]?.isRealRoad
                    ? 'var(--mint)'
                    : routes[0]?.isPredefined
                    ? 'var(--mint)'
                    : 'var(--amber)'
                }
              />
              <span>
                {routes[0]?.isRealRoad
                  ? `Calculated using OSRM driving engine along real road networks for "${origin}" to "${destination}".`
                  : routes[0]?.isPredefined
                  ? 'Showing pre-modeled demonstration corridor. Turn-by-turn routing is simulated for UI testing.'
                  : `Showing synthetic demonstration estimate for "${origin}" to "${destination}". Real-world navigation API is unavailable in offline demo mode.`}
              </span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isCalculating}
            style={{ width: '100%', marginTop: 8, minHeight: 44 }}
          >
            {isCalculating ? (
              <>
                <Loader2 size={16} className="spin" /> Calculating Road Route via OSRM...
              </>
            ) : (
              <>
                <Route size={16} /> Calculate Road Route & Safety Score
              </>
            )}
          </button>
        </form>
      </div>

      {/* Route Options Comparison Grid */}
      {routes.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h4 style={{ fontSize: 14, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
              Available Route Alternatives ({routes.length})
            </h4>
            <span className="muted" style={{ fontSize: 11 }}>Tap a route to inspect and view on map</span>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {routes.map((route) => {
              const isSelected = route.id === (activeRoute?.id || routes[0].id)
              return (
                <div
                  key={route.id}
                  onClick={() => onSelectRoute && onSelectRoute(route)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      if (onSelectRoute) onSelectRoute(route)
                    }
                  }}
                  className="panel panel-pad"
                  style={{
                    cursor: 'pointer',
                    borderRadius: 10,
                    border: isSelected ? `2px solid ${route.color || 'var(--mint)'}` : '1px solid var(--line)',
                    background: isSelected ? 'rgba(100, 226, 186, 0.04)' : undefined,
                    transition: 'border-color 0.15s ease, background 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: route.color || 'var(--mint)',
                            display: 'inline-block',
                          }}
                        />
                        <strong style={{ fontSize: 14 }}>{route.name}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <span className={`pill ${route.type === 'recommended' ? 'pill-accent' : 'pill-quiet'}`} style={{ fontSize: 10 }}>
                          {route.tag}
                        </span>
                        {route.isRealRoad && (
                          <span className="pill pill-accent" style={{ fontSize: 9 }}>
                            OSRM Real Road
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Estimated Safety Score Dial Badge */}
                    <div
                      style={{
                        textAlign: 'right',
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${route.toneColor || 'var(--accent)'}`,
                      }}
                    >
                      <div style={{ fontSize: 18, fontWeight: 800, color: route.toneColor || 'var(--accent)' }}>
                        {route.safetyScore}
                        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)' }}> / 100</span>
                      </div>
                      <span style={{ fontSize: 10, color: route.toneColor || 'var(--accent)', fontWeight: 600 }}>
                        {route.ratingLabel}
                      </span>
                    </div>
                  </div>

                  {/* Distance, Duration and Hazard Summary */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, marginTop: 8, color: 'var(--muted)' }}>
                    <span>
                      <strong style={{ color: 'var(--text-color, #fff)' }}>{route.distanceKm}</strong> km
                    </span>
                    <span>
                      <strong style={{ color: 'var(--text-color, #fff)' }}>{route.durationMins}</strong> mins est.
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={13} style={{ color: route.nearbyHazards?.some(h => h.severity === 'Critical') ? 'var(--coral)' : route.nearbyHazards?.length ? 'var(--orange)' : 'var(--accent)' }} />
                      <strong style={{ color: 'var(--text-color, #fff)' }}>{route.nearbyHazards?.length || 0}</strong> hazards along path
                    </span>
                  </div>

                  <p className="muted" style={{ fontSize: 12, margin: '8px 0 0' }}>
                    {route.summary}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected Route Turn-by-Turn Steps (for Real OSRM Road Routes) */}
      {activeRoute?.steps && activeRoute.steps.length > 0 && (
        <div className="panel panel-pad">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => setShowSteps((prev) => !prev)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Navigation size={16} color="var(--mint)" />
              <h4 style={{ fontSize: 14, margin: 0 }}>
                Navigational Road Steps ({activeRoute.steps.length})
              </h4>
            </div>
            <button
              type="button"
              className="btn btn-quiet"
              style={{ fontSize: 11, padding: '2px 8px' }}
              aria-expanded={showSteps}
            >
              {showSteps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showSteps ? 'Hide Steps' : 'View Steps'}
            </button>
          </div>

          {showSteps && (
            <div style={{ marginTop: 12, display: 'grid', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
              {activeRoute.steps.map((step, idx) => (
                <div key={step.id || idx} className="route-step-item">
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'rgba(100, 226, 186, 0.15)',
                      color: 'var(--mint)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-color, #f3f4f0)', fontWeight: 500 }}>
                      {step.instruction}
                    </div>
                    {step.distanceMeters > 0 && (
                      <span className="muted" style={{ fontSize: 10 }}>
                        {step.distanceMeters >= 1000
                          ? `${(step.distanceMeters / 1000).toFixed(1)} km`
                          : `${step.distanceMeters} m`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Route Deep Dive & Safety Score Explanation */}
      {activeRoute && (
        <article className="panel panel-pad" style={{ marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ fontSize: 15, margin: 0 }}>
              Estimated Safety Score Breakdown
            </h4>
            <span className="pill pill-accent" style={{ fontSize: 10 }}>{activeRoute.name}</span>
          </div>

          <div
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--line)',
              marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Shield size={20} style={{ color: activeRoute.toneColor || 'var(--mint)' }} />
              <div>
                <strong style={{ fontSize: 15 }}>
                  {activeRoute.safetyScore} / 100 · {activeRoute.ratingLabel}
                </strong>
                <span className="muted" style={{ display: 'block', fontSize: 11 }}>
                  Calculated using hazard proximity, severity weights, and corridor characteristics.
                </span>
              </div>
            </div>

            {/* Factor explanations */}
            <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
              {activeRoute.scoreFactors?.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    fontSize: 12,
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: f.type === 'positive' ? 'rgba(100,226,186,0.06)' : 'rgba(255,107,107,0.06)',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      color: f.type === 'positive' ? 'var(--accent)' : 'var(--coral)',
                      minWidth: 28,
                    }}
                  >
                    {f.impact}
                  </span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nearby Hazards along Route List */}
          <div>
            <h5 style={{ fontSize: 13, margin: '0 0 8px', color: 'var(--muted)' }}>
              Hazards Affecting This Corridor ({activeRoute.nearbyHazards?.length || 0})
            </h5>
            {activeRoute.nearbyHazards?.length === 0 ? (
              <div className="empty-state" style={{ minHeight: 60, padding: 12 }}>
                <CheckCircle2 size={18} color="var(--mint)" />
                <span style={{ fontSize: 12 }}>No reported hazards currently intersecting this route corridor.</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {activeRoute.nearbyHazards.map((h) => (
                  <div
                    key={h.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: SEVERITY_COLORS[h.severity] || 'var(--coral)',
                          }}
                        />
                        <strong style={{ fontSize: 13 }}>{h.title}</strong>
                        <span
                          className={`pill ${h.severity === 'Critical' ? 'pill-coral' : 'pill-accent'}`}
                          style={{ fontSize: 9, padding: '1px 5px' }}
                        >
                          {h.severity}
                        </span>
                      </div>
                      <span className="muted" style={{ fontSize: 11 }}>
                        {h.category} · {h.locationName}
                      </span>
                    </div>
                    <span className="muted" style={{ fontSize: 11 }}>
                      ~{(h.distanceToRouteKm * 1000).toFixed(0)}m from path
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mandatory Safety Score Disclaimer */}
          <div className="notice" style={{ marginTop: 14 }}>
            <AlertTriangle size={15} />
            <span>
              <strong>Estimated score disclaimer:</strong> Safety scores are illustrative estimates based on community hazard reports. RakshaPath does not guarantee real-world route safety, clear passage, or emergency responder availability.
            </span>
          </div>
        </article>
      )}
    </div>
  )
}

export default RoutePlanner
