import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Circle, CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { hazardService } from '../../services/hazardService'
import { SEVERITY_COLORS, HAZARD_STATUS } from '../../data/hazardData'
import { Crosshair, Eye, Layers, Navigation } from 'lucide-react'
import { tokens } from '../../theme/tokens'

/**
 * Automatically adjusts the map camera to encompass all coordinates of the active route.
 */
function RouteBoundsUpdater({ waypoints }) {
  const map = useMap()

  useEffect(() => {
    if (waypoints && Array.isArray(waypoints) && waypoints.length >= 2) {
      try {
        map.fitBounds(waypoints, {
          padding: [45, 45],
          maxZoom: 16,
        })
      } catch {
        // Map bounds update skipped if map container is not yet initialized
      }
    }
  }, [map, waypoints])

  return null
}

/**
 * Manages following user location and auto-disables follow mode when user manually drags or zooms.
 * Automatically centers the map once on the first valid GPS fix without locking the camera.
 */
function UserLocationFollower({ coords, isFollowing, onUserPanOrZoom, recenterTrigger, initialZoom = 15 }) {
  const map = useMap()
  const hasInitiallyCenteredRef = useRef(false)

  useEffect(() => {
    const handleInteraction = () => {
      onUserPanOrZoom()
    }

    map.on('dragstart', handleInteraction)
    map.on('zoomstart', handleInteraction)

    return () => {
      map.off('dragstart', handleInteraction)
      map.off('zoomstart', handleInteraction)
    }
  }, [map, onUserPanOrZoom])

  // Center camera once on first valid real GPS acquisition
  useEffect(() => {
    if (coords && coords.length === 2 && !hasInitiallyCenteredRef.current) {
      hasInitiallyCenteredRef.current = true
      try {
        map.setView(coords, initialZoom, { animate: true })
      } catch {
        // Safe fallback if container is resizing
      }
    }
  }, [map, coords, initialZoom])

  // Recenter or follow when user requested or in active follow mode
  useEffect(() => {
    if ((isFollowing || recenterTrigger > 0) && coords && coords.length === 2) {
      try {
        map.panTo(coords, { animate: true, duration: 0.6 })
      } catch {
        // Safe fallback if container is resizing
      }
    }
  }, [map, coords, isFollowing, recenterTrigger])

  return null
}

/**
 * Automatically recalculates Leaflet tile boundaries and viewport dimensions
 * whenever the browser window is resized or device orientation changes.
 */
function MapOrientationResizer() {
  const map = useMap()
  useEffect(() => {
    const handleResize = () => {
      try {
        map.invalidateSize({ animate: false })
      } catch {
        // Safe fallback
      }
    }
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [map])

  return null
}

export function SafetyMap({
  hazards: propHazards,
  selectedHazard,
  onSelectHazard,
  routes = [],
  selectedRouteId,
  onSelectRoute,
  userLocation,
  isTracking = false,
  center = [12.945, 77.625],
  zoom = 13,
  showLegend = true,
  showFilters = true,
  height = '420px',
}) {
  // If no hazards prop passed, default to all seed & user hazards
  const allAvailableHazards = useMemo(() => {
    return propHazards || hazardService.getAllHazards()
  }, [propHazards])

  // Filter states
  const [selectedSeverities, setSelectedSeverities] = useState(['Low', 'Medium', 'High', 'Critical'])
  const [showRadiusCircles, setShowRadiusCircles] = useState(true)
  const [legendOpen, setLegendOpen] = useState(false)

  // Follow user camera control states
  const [isFollowing, setIsFollowing] = useState(false)
  const [recenterCount, setRecenterCount] = useState(0)

  // Turn off follow camera when user drags or zooms the map
  const handleUserPanOrZoom = useCallback(() => {
    setIsFollowing(false)
  }, [])

  // Toggle follow mode or recenter on user demand
  const handleRecenter = () => {
    if (!genuineUserCoords) return
    setIsFollowing((prev) => !prev)
    setRecenterCount((c) => c + 1)
  }

  // Visible hazards based on severity filter (defensively filters malformed entries)
  const visibleHazards = useMemo(() => {
    return allAvailableHazards.filter((h) => {
      if (!h || !Array.isArray(h.position) || h.position.length < 2 || isNaN(h.position[0]) || isNaN(h.position[1])) {
        return false
      }
      if (h.status === HAZARD_STATUS.EXPIRED) return false
      return selectedSeverities.includes(h.severity)
    })
  }, [allAvailableHazards, selectedSeverities])

  const validRoutes = useMemo(() => {
    return (routes || []).filter(
      (r) => r && Array.isArray(r.waypoints) && r.waypoints.length > 0
    )
  }, [routes])

  // Real GPS Coordinates: strictly null unless genuine userLocation coordinates are provided.
  // Never attribute fallback Koramangala coordinates as the user's real location.
  const genuineUserCoords = Array.isArray(userLocation) &&
    userLocation.length === 2 &&
    Number.isFinite(userLocation[0]) &&
    Number.isFinite(userLocation[1])
      ? userLocation
      : userLocation?.latitude &&
        userLocation?.longitude &&
        Number.isFinite(userLocation.latitude) &&
        Number.isFinite(userLocation.longitude)
      ? [userLocation.latitude, userLocation.longitude]
      : null

  const userAccuracy = userLocation?.accuracy || 20
  const isAccurate = userAccuracy <= 65
  const userHeading = Number.isFinite(userLocation?.heading) ? userLocation.heading : null

  // Directional heading vector waypoint (35m forward) when valid compass heading is available
  const headingWaypoint =
    genuineUserCoords && userHeading !== null
      ? (() => {
          const [lat, lon] = genuineUserCoords
          const distKm = 0.035 // 35 meters
          const rad = (userHeading * Math.PI) / 180
          const latEnd = lat + (distKm / 111.32) * Math.cos(rad)
          const lonEnd = lon + (distKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.sin(rad)
          return [latEnd, lonEnd]
        })()
      : null

  const toggleSeverity = (sev) => {
    setSelectedSeverities((prev) =>
      prev.includes(sev) ? prev.filter((s) => s !== sev) : [...prev, sev]
    )
  }

  const activeRoute = validRoutes.find((r) => r.id === selectedRouteId) || validRoutes[0]
  const startWaypoint = activeRoute?.waypoints?.[0]
  const endWaypoint = activeRoute?.waypoints?.[activeRoute.waypoints.length - 1]

  return (
    <div className="safety-map-wrapper" style={{ position: 'relative' }}>
      {/* Optional Filters Bar */}
      {showFilters && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
            marginBottom: 10,
            justifyContent: 'space-between',
          }}
          role="group"
          aria-label="Map filters"
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Critical', 'High', 'Medium', 'Low'].map((sev) => {
              const active = selectedSeverities.includes(sev)
              const color = SEVERITY_COLORS[sev]
              return (
                <button
                  type="button"
                  key={sev}
                  className={`hazard-filter-pill ${active ? `active active-${sev.toLowerCase()}` : 'inactive'}`}
                  aria-pressed={active}
                  onClick={() => toggleSeverity(sev)}
                >
                  <span
                    className="hazard-filter-dot"
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: color,
                      display: 'inline-block',
                      marginRight: 4,
                    }}
                  />
                  {sev}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              type="button"
              className={`pill ${showRadiusCircles ? 'pill-accent' : ''}`}
              style={{ fontSize: 10, padding: '3px 8px' }}
              onClick={() => setShowRadiusCircles((prev) => !prev)}
              title="Toggle affected hazard safety radii"
            >
              <Eye size={12} /> {showRadiusCircles ? 'Radii Visible' : 'Radii Hidden'}
            </button>
            <span className="pill" aria-live="polite" style={{ fontSize: 11 }}>
              {visibleHazards.length} hazards visible
            </span>
          </div>
        </div>
      )}

      {/* Leaflet Map Frame */}
      <div
        className="map-frame"
        role="region"
        aria-label="Illustrative safety map"
        style={{ position: 'relative', minHeight: height, borderRadius: 10, overflow: 'hidden' }}
      >
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={false}
          aria-label="Illustrative safety map"
          style={{ height: '100%', minHeight: height, width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Auto-fit map viewport to active route (suppressed when genuine user GPS is present and route is predefined demo) */}
          {activeRoute?.waypoints && (!genuineUserCoords || !activeRoute.isPredefined) && (
            <RouteBoundsUpdater waypoints={activeRoute.waypoints} />
          )}

          {/* Follow user location controller */}
          <UserLocationFollower
            coords={genuineUserCoords}
            isFollowing={isFollowing}
            onUserPanOrZoom={handleUserPanOrZoom}
            recenterTrigger={recenterCount}
          />

          {/* Dynamic map viewport resizer on orientation change / window resize */}
          <MapOrientationResizer />

          {/* Genuine User Location Marker (rendered ONLY when real GPS coordinates exist) */}
          {genuineUserCoords && (
            <>
              {/* Live Pulsing Radar Outer Ring */}
              <CircleMarker
                center={genuineUserCoords}
                radius={isTracking ? 14 : 10}
                pathOptions={{
                  color: isAccurate ? tokens.accent : tokens.amber,
                  fillColor: isAccurate ? tokens.accent : tokens.amber,
                  fillOpacity: isTracking ? 0.22 : 0.12,
                  weight: 1,
                }}
              />

              {/* Core User Position Marker */}
              <CircleMarker
                center={genuineUserCoords}
                radius={7}
                pathOptions={{
                  color: '#ffffff',
                  fillColor: isAccurate ? tokens.accent : tokens.amber,
                  fillOpacity: 1,
                  weight: 2,
                }}
              >
                <Popup>
                  <div style={{ fontSize: 12 }}>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Navigation size={13} color="var(--accent)" /> Current GPS Position
                    </strong>
                    <div style={{ fontSize: 11, color: isAccurate ? 'var(--accent)' : 'var(--amber)', marginTop: 2 }}>
                      {isTracking ? 'Active Live Tracking' : 'One-Shot Position'} · Accuracy ±{userAccuracy}m
                    </div>
                    {userHeading !== null && (
                      <div className="muted" style={{ fontSize: 10 }}>
                        Heading: {Math.round(userHeading)}° · {userLocation.speed ? `${(userLocation.speed * 3.6).toFixed(1)} km/h` : 'Stationary'}
                      </div>
                    )}
                    <span style={{ fontSize: 10, color: '#74808a' }}>
                      {genuineUserCoords[0].toFixed(5)}° N, {genuineUserCoords[1].toFixed(5)}° E
                    </span>
                  </div>
                </Popup>
              </CircleMarker>

              {/* Accuracy Radius Circle */}
              <Circle
                center={genuineUserCoords}
                radius={userAccuracy}
                pathOptions={{
                  color: isAccurate ? tokens.accent : tokens.amber,
                  fillColor: isAccurate ? tokens.accent : tokens.amber,
                  fillOpacity: 0.08,
                  weight: 1,
                  dashArray: '4, 6',
                }}
              />

              {/* Directional Heading Vector Indicator (when reliable compass heading is available) */}
              {headingWaypoint && (
                <Polyline
                  positions={[genuineUserCoords, headingWaypoint]}
                  pathOptions={{
                    color: tokens.accent,
                    weight: 3,
                    opacity: 0.9,
                  }}
                />
              )}
            </>
          )}

          {/* Route Start (Origin) Pin Marker */}
          {startWaypoint && (
            <CircleMarker
              center={startWaypoint}
              radius={7}
              pathOptions={{
                color: '#ffffff',
                fillColor: tokens.accent,
                fillOpacity: 1,
                weight: 2,
              }}
            >
              <Popup>
                <div style={{ fontSize: 12 }}>
                  <strong style={{ color: 'var(--accent)' }}>Starting Point</strong>
                  <div style={{ fontSize: 11, marginTop: 2 }}>
                    {activeRoute.origin?.name || 'Route Origin'}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                    {startWaypoint[0].toFixed(4)}°, {startWaypoint[1].toFixed(4)}°
                  </span>
                </div>
              </Popup>
            </CircleMarker>
          )}

          {/* Route End (Destination) Pin Marker: White with accent ring */}
          {endWaypoint && (
            <CircleMarker
              center={endWaypoint}
              radius={8}
              pathOptions={{
                color: tokens.accent,
                fillColor: '#ffffff',
                fillOpacity: 1,
                weight: 3,
              }}
            >
              <Popup>
                <div style={{ fontSize: 12 }}>
                  <strong style={{ color: 'var(--accent)' }}>Destination</strong>
                  <div style={{ fontSize: 11, marginTop: 2 }}>
                    {activeRoute.destination?.name || 'Route Destination'}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                    {endWaypoint[0].toFixed(4)}°, {endWaypoint[1].toFixed(4)}°
                  </span>
                </div>
              </Popup>
            </CircleMarker>
          )}

          {/* Route Polylines: Selected solid, Alternatives dashed */}
          {validRoutes.map((route) => {
            const isSelected = route.id === (activeRoute?.id || selectedRouteId)
            if (!route.waypoints || route.waypoints.length < 2) return null

            return (
              <Polyline
                key={route.id}
                positions={route.waypoints}
                pathOptions={{
                  color: route.color || (isSelected ? tokens.accent : '#74808a'),
                  weight: isSelected ? 6 : 4,
                  opacity: isSelected ? 0.95 : 0.45,
                  dashArray: isSelected ? undefined : '6, 8',
                }}
                eventHandlers={{
                  click: () => onSelectRoute && onSelectRoute(route),
                }}
              >
                <Popup>
                  <div style={{ padding: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: route.color || 'var(--accent)',
                        }}
                      />
                      <strong>{route.name}</strong>
                    </div>
                    <div style={{ fontSize: 11, color: '#bac2c5', marginTop: 4 }}>
                      {route.distanceKm} km · {route.durationMins} mins · Safety Score: {route.safetyScore}/100
                    </div>
                    {route.isRealRoad && (
                      <span className="pill pill-accent" style={{ fontSize: 9, marginTop: 4, display: 'inline-block' }}>
                        OSRM Road Geometry
                      </span>
                    )}
                  </div>
                </Popup>
              </Polyline>
            )
          })}

          {/* Hazard Affected Radius Circles */}
          {showRadiusCircles &&
            visibleHazards
              .filter((h) => h.severity === 'Critical' || h.severity === 'High')
              .map((h) => {
                const color = SEVERITY_COLORS[h.severity] || '#ff4d4d'
                return (
                  <Circle
                    key={`radius-${h.id}`}
                    center={h.position}
                    radius={h.radiusMeters || 400}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: 0.08,
                      weight: 1,
                      dashArray: '3, 5',
                    }}
                  />
                )
              })}

          {/* Hazard Circle Markers */}
          {visibleHazards.map((hazard) => {
            const color = SEVERITY_COLORS[hazard.severity] || '#ffc66d'
            const isSelected = selectedHazard?.id === hazard.id

            return (
              <CircleMarker
                key={hazard.id}
                center={hazard.position}
                radius={isSelected ? 11 : 8}
                pathOptions={{
                  color: isSelected ? '#ffffff' : color,
                  fillColor: color,
                  fillOpacity: 0.9,
                  weight: isSelected ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => onSelectHazard && onSelectHazard(hazard),
                }}
              >
                <Popup>
                  <div style={{ minWidth: 190, maxWidth: 260, padding: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: 4,
                          background: `${color}25`,
                          color,
                          textTransform: 'uppercase',
                        }}
                      >
                        {hazard.severity} Severity
                      </span>
                      <span style={{ fontSize: 10, color: '#74808a' }}>{hazard.category}</span>
                    </div>

                    <strong style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
                      {hazard.title}
                    </strong>
                    <p style={{ margin: '0 0 6px', fontSize: 11, color: '#bac2c5', lineHeight: 1.4 }}>
                      {hazard.description}
                    </p>

                    <div style={{ fontSize: 10, color: '#74808a', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 4 }}>
                      <span>Source: {hazard.source || 'Community Advisory'}</span>
                      {hazard.locationName && <div>Location: {hazard.locationName}</div>}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>

        {/* Dynamic GPS & Navigation State Badge */}
        <div
          style={{
            position: 'absolute',
            right: 11,
            top: 11,
            zIndex: 500,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 4,
          }}
        >
          {genuineUserCoords ? (
            <span
              className={`pill ${isAccurate ? 'pill-accent' : 'pill-amber'}`}
              style={{
                backdropFilter: 'blur(10px)',
                fontSize: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: isAccurate ? 'var(--mint)' : 'var(--amber)',
                  display: 'inline-block',
                }}
              />
              {isTracking
                ? isAccurate
                  ? `GPS TRACKING (±${userAccuracy}m)`
                  : `POOR ACCURACY (±${userAccuracy}m)`
                : `LIVE GPS (±${userAccuracy}m)`}
            </span>
          ) : isTracking ? (
            <span
              className="pill pill-amber"
              style={{ backdropFilter: 'blur(10px)', fontSize: 10 }}
            >
              GPS: ACQUIRING FIX...
            </span>
          ) : (
            <span
              className={activeRoute?.isRealRoad ? 'pill pill-accent' : 'badge-demo'}
              style={{
                backdropFilter: 'blur(10px)',
              }}
            >
              {activeRoute?.isRealRoad ? 'LIVE OSRM NAVIGATION' : 'DEMO SAFETY MAP · Bengaluru'}
            </span>
          )}
        </div>

        {/* Follow / Recenter Location Control (44px touch target) */}
        {genuineUserCoords && (
          <button
            type="button"
            className={`btn map-recenter-btn ${isFollowing ? 'map-btn-active' : 'btn-quiet'}`}
            onClick={handleRecenter}
            title={isFollowing ? 'Camera locked to your location (Click to unlock)' : 'Recenter camera on my GPS location'}
            aria-label="Recenter camera on my GPS location"
            style={{
              position: 'absolute',
              right: 12,
              bottom: 12,
              zIndex: 500,
              width: 44,
              height: 44,
              minHeight: 44,
              borderRadius: '50%',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
            }}
          >
            <Crosshair size={18} color="var(--mint)" />
          </button>
        )}

        {/* Interactive Map Legend Dock */}
        {showLegend && (
          <aside
            role="region"
            aria-label="Map Legend"
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              zIndex: 500,
              background: 'rgba(9, 13, 18, 0.9)',
              backdropFilter: 'blur(8px)',
              padding: legendOpen ? '10px 14px' : '6px 10px',
              borderRadius: 8,
              border: '1px solid var(--line, rgba(255,255,255,0.1))',
              fontSize: 11,
              maxWidth: 240,
            }}
          >
            <button
              type="button"
              aria-expanded={legendOpen}
              aria-controls="map-legend-content"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: 0,
                color: 'inherit',
                font: 'inherit',
                cursor: 'pointer',
              }}
              onClick={() => setLegendOpen((prev) => !prev)}
            >
              <strong style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <Layers size={13} color="var(--accent)" /> Legend
              </strong>
              <span className="muted" style={{ fontSize: 9 }}>
                {legendOpen ? 'Collapse' : 'Expand'}
              </span>
            </button>

            <div
              id="map-legend-content"
              aria-hidden={!legendOpen}
              hidden={!legendOpen}
              style={{ marginTop: 8, display: legendOpen ? 'grid' : 'none', gap: 5 }}
            >
              {genuineUserCoords && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
                  <span>Your GPS Position {isTracking && '(Live)'}</span>
                </div>
              )}
              {startWaypoint && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
                  <span>Route Starting Point</span>
                </div>
              )}
              {endWaypoint && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffffff', border: `2px solid ${tokens.accent}` }} />
                  <span>Destination</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: SEVERITY_COLORS.Critical }} />
                <span>Critical Hazard (Avoid)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: SEVERITY_COLORS.High }} />
                <span>High Hazard (Caution)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: SEVERITY_COLORS.Medium }} />
                <span>Medium / Construction</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: SEVERITY_COLORS.Low }} />
                <span>Low / Traffic Congestion</span>
              </div>
              {validRoutes.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid var(--line)', paddingTop: 4 }}>
                  <span style={{ width: 14, height: 3, background: 'var(--accent)' }} />
                  <span>Selected Active Route</span>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

export default SafetyMap
