import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  Compass,
  Route,
  Shield,
} from 'lucide-react'
import { routeService } from '../../services/routeService'
import { SEVERITY_COLORS } from '../../data/hazardData'

export function RoutePlanner({
  hazards = [],
  onSelectRoute,
  selectedRouteId,
  onRoutesCalculated,
}) {
  const demoHubs = routeService.getDemoHubs()
  const [origin, setOrigin] = useState('Koramangala Sony World')
  const [destination, setDestination] = useState('Indiranagar 100ft Road')
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
  const [error, setError] = useState(null)

  // Swap origin and destination
  const handleSwap = () => {
    const prevOrigin = origin
    setOrigin(destination)
    setDestination(prevOrigin)
  }

  // Handle route search / recalculate
  const handleSearch = (e) => {
    if (e) e.preventDefault()
    setError(null)

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
      setError(err.message || 'Failed to calculate routes.')
    }
  }

  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0]

  return (
    <div className="route-planner" style={{ display: 'grid', gap: 16 }}>
      {/* Origin & Destination Search Form */}
      <div className="panel panel-pad">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Compass size={18} color="var(--lime)" />
            <h3 style={{ fontSize: 16, margin: 0 }}>Route Safety Intelligence</h3>
          </div>
          <span className="pill pill-lime" style={{ fontSize: 10 }}>DEMO ESTIMATES</span>
        </div>

        <p className="muted" style={{ fontSize: 12, margin: '0 0 14px' }}>
          Compare travel routes based on distance, duration, and safety intelligence from reported hazards.
        </p>

        {error && (
          <div className="notice" role="alert" style={{ marginBottom: 14, borderColor: 'var(--coral)', color: 'var(--coral)' }}>
            <AlertCircle size={15} />
            <span>{error}</span>
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
            <div>
              <label htmlFor="origin-input" style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                Starting Point
              </label>
              <input
                id="origin-input"
                type="text"
                className="input"
                placeholder="Enter starting location..."
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn btn-quiet reverse-btn"
              onClick={handleSwap}
              title="Reverse route"
              aria-label="Reverse route"
              style={{ marginTop: 18, width: 38, height: 38, padding: 0, borderRadius: '50%' }}
            >
              <ArrowUpDown size={15} />
            </button>

            <div>
              <label htmlFor="destination-input" style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                Destination
              </label>
              <input
                id="destination-input"
                type="text"
                className="input"
                placeholder="Enter destination..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
          </div>

          {/* Quick preset hub buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            <span className="muted" style={{ fontSize: 10, alignSelf: 'center', marginRight: 4 }}>
              Presets:
            </span>
            {demoHubs.map((hub) => (
              <button
                key={hub.id}
                type="button"
                className="btn btn-quiet"
                style={{ fontSize: 10, padding: '2px 8px', minHeight: 26, borderRadius: 12 }}
                onClick={() => setDestination(hub.name)}
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
                borderColor: routes[0]?.isPredefined ? 'rgba(100, 226, 186, 0.35)' : 'rgba(255, 198, 109, 0.35)',
              }}
            >
              <Route size={14} color={routes[0]?.isPredefined ? 'var(--mint)' : 'var(--amber)'} />
              <span>
                {routes[0]?.isPredefined
                  ? 'Showing pre-modeled demonstration corridor. Turn-by-turn routing is simulated for UI testing.'
                  : `Showing synthetic demonstration estimate for "${origin}" to "${destination}". Real-world navigation API is unavailable in offline demo mode.`}
              </span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8, minHeight: 44 }}>
            <Route size={16} /> Compare Route Alternatives (Demo)
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
                      <span className={`pill ${route.type === 'recommended' ? 'pill-mint' : 'pill-quiet'}`} style={{ fontSize: 10, marginTop: 4 }}>
                        {route.tag}
                      </span>
                    </div>

                    {/* Estimated Safety Score Dial Badge */}
                    <div
                      style={{
                        textAlign: 'right',
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${route.toneColor || 'var(--lime)'}`,
                      }}
                    >
                      <div style={{ fontSize: 18, fontWeight: 800, color: route.toneColor || 'var(--lime)' }}>
                        {route.safetyScore}
                        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)' }}> / 100</span>
                      </div>
                      <span style={{ fontSize: 10, color: route.toneColor || 'var(--lime)', fontWeight: 600 }}>
                        {route.ratingLabel}
                      </span>
                    </div>
                  </div>

                  {/* Distance, Duration and Hazard Summary */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, marginTop: 8, color: 'var(--muted)' }}>
                    <span>
                      <strong style={{ color: '#fff' }}>{route.distanceKm}</strong> km est.
                    </span>
                    <span>
                      <strong style={{ color: '#fff' }}>{route.durationMins}</strong> mins est.
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={13} style={{ color: route.nearbyHazards?.length ? 'var(--coral)' : 'var(--mint)' }} />
                      <strong style={{ color: '#fff' }}>{route.nearbyHazards?.length || 0}</strong> hazards along path
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

      {/* Selected Route Deep Dive & Safety Score Explanation */}
      {activeRoute && (
        <article className="panel panel-pad" style={{ marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ fontSize: 15, margin: 0 }}>
              Estimated Safety Score Breakdown
            </h4>
            <span className="pill pill-lime" style={{ fontSize: 10 }}>{activeRoute.name}</span>
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
                  Calculated using hazard proximity, severity weights, and corridor illumination.
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
                      color: f.type === 'positive' ? 'var(--mint)' : 'var(--coral)',
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
                          className={`pill ${h.severity === 'Critical' ? 'pill-coral' : 'pill-lime'}`}
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
              <strong>Estimated score disclaimer:</strong> Safety scores are illustrative estimates based on simulated mock data. RakshaPath does not guarantee real-world route safety, clear passage, or emergency responder availability.
            </span>
          </div>
        </article>
      )}
    </div>
  )
}

export default RoutePlanner
