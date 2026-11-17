import { useMemo, useState } from 'react'
import { Circle, CircleMarker, MapContainer, Polyline, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { hazardService } from '../../services/hazardService'
import { SEVERITY_COLORS, HAZARD_STATUS } from '../../data/hazardData'
import { Crosshair, Eye, Layers } from 'lucide-react'

// Default fallback demo user location
const DEFAULT_USER_COORDS = [12.9345, 77.6245]

export function SafetyMap({
  hazards: propHazards,
  selectedHazard,
  onSelectHazard,
  routes = [],
  selectedRouteId,
  onSelectRoute,
  userLocation,
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
  const [legendOpen, setLegendOpen] = useState(true)

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

  const userCoords = useMemo(() => {
    if (Array.isArray(userLocation) && userLocation.length === 2) return userLocation
    if (userLocation?.latitude && userLocation?.longitude) {
      return [userLocation.latitude, userLocation.longitude]
    }
    return DEFAULT_USER_COORDS
  }, [userLocation])

  const toggleSeverity = (sev) => {
    setSelectedSeverities((prev) =>
      prev.includes(sev) ? prev.filter((s) => s !== sev) : [...prev, sev]
    )
  }

  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0]

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
                  className={`pill ${active ? 'pill-lime' : ''}`}
                  style={{
                    fontSize: 11,
                    padding: '3px 9px',
                    borderColor: active ? color : undefined,
                    cursor: 'pointer',
                  }}
                  aria-pressed={active}
                  onClick={() => toggleSeverity(sev)}
                >
                  <span
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
              className={`pill ${showRadiusCircles ? 'pill-lime' : ''}`}
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

          {/* User Location Marker */}
          <CircleMarker
            center={userCoords}
            radius={8}
            pathOptions={{
              color: '#ffffff',
              fillColor: '#64e2ba', // Mint
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Popup>
              <div style={{ padding: 4 }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Crosshair size={14} color="#64e2ba" />
                  Your Location (Demo)
                </strong>
                <span style={{ fontSize: 11, color: '#74808a' }}>
                  {userCoords[0].toFixed(4)}° N, {userCoords[1].toFixed(4)}° E
                </span>
              </div>
            </Popup>
          </CircleMarker>
          <Circle
            center={userCoords}
            radius={250}
            pathOptions={{
              color: '#64e2ba',
              fillColor: '#64e2ba',
              fillOpacity: 0.1,
              weight: 1,
              dashArray: '4, 6',
            }}
          />

          {/* Route Polylines */}
          {validRoutes.map((route) => {
            const isSelected = route.id === (activeRoute?.id || selectedRouteId)
            if (!route.waypoints || route.waypoints.length < 2) return null

            return (
              <Polyline
                key={route.id}
                positions={route.waypoints}
                pathOptions={{
                  color: route.color || (isSelected ? '#64e2ba' : '#74808a'),
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
                    <strong>{route.name}</strong>
                    <div style={{ fontSize: 11, color: '#74808a', marginTop: 3 }}>
                      {route.distanceKm} km · {route.durationMins} mins · Safety Score: {route.safetyScore}/100
                    </div>
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
                      <span>Source: {hazard.source || 'Simulated Demo Feed'}</span>
                      {hazard.locationName && <div>Location: {hazard.locationName}</div>}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>

        {/* DEMO MAP Badge */}
        <span
          className="pill"
          style={{
            position: 'absolute',
            right: 11,
            top: 11,
            zIndex: 500,
            backdropFilter: 'blur(10px)',
            fontSize: 10,
          }}
        >
          DEMO SAFETY MAP
        </span>

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
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
              }}
              onClick={() => setLegendOpen((prev) => !prev)}
            >
              <strong style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <Layers size={13} color="var(--lime)" /> Legend
              </strong>
              <span className="muted" style={{ fontSize: 9 }}>
                {legendOpen ? 'Collapse' : 'Expand'}
              </span>
            </div>

            {legendOpen && (
              <div style={{ marginTop: 8, display: 'grid', gap: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#64e2ba' }} />
                  <span>Your Location (Demo)</span>
                </div>
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
                {routes.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid var(--line)', paddingTop: 4 }}>
                    <span style={{ width: 14, height: 3, background: 'var(--mint)' }} />
                    <span>Selected Safer Route</span>
                  </div>
                )}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}

export default SafetyMap
