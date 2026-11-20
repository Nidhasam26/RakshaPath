import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  Navigation,
  Plus,
  RefreshCw,
  Route,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import SafetyMap from '../../components/maps/SafetyMap'
import HazardReportModal from '../../components/maps/HazardReportModal'
import RoutePlanner from '../../components/navigation/RoutePlanner'
import { useAuth } from '../../context/useAuth'
import { useGeolocation } from '../../hooks/useGeolocation'
import { hazardService } from '../../services/hazardService'
import { routeService } from '../../services/routeService'
import { HAZARD_CATEGORIES, SEVERITY_COLORS, HAZARD_STATUS } from '../../data/hazardData'

export function LiveMap() {
  const { user } = useAuth()
  const {
    location: geoLoc,
    isTracking,
    startWatching,
    stopWatching,
    requestLocation,
    permissionDenied,
  } = useGeolocation()

  // Automatically request a single real device location fix on mount
  const hasRequestedLocationRef = useRef(false)
  useEffect(() => {
    if (!hasRequestedLocationRef.current) {
      hasRequestedLocationRef.current = true
      requestLocation().catch(() => { })
    }
  }, [requestLocation])

  // Role permissions
  const isFamily = user?.role === 'Family'
  const isPolice = user?.role === 'Police'
  const canReportHazard = user?.role === 'Traveller' || isPolice

  // Hazards state for current user
  const [hazards, setHazards] = useState(() => hazardService.getAllHazards(user?.id))
  const [selectedHazard, setSelectedHazard] = useState(null)
  const [showReportModal, setShowReportModal] = useState(false)

  // Route state (initialized with demo corridors for immediate map display)
  const [activeRoutes, setActiveRoutes] = useState(() => {
    try {
      return routeService.generateRouteAlternatives(
        'Koramangala Sony World',
        'Indiranagar 100ft Road',
        hazardService.getAllHazards(user?.id)
      )
    } catch {
      return []
    }
  })
  const [selectedRoute, setSelectedRoute] = useState(() => {
    try {
      const init = routeService.generateRouteAlternatives(
        'Koramangala Sony World',
        'Indiranagar 100ft Road',
        hazardService.getAllHazards(user?.id)
      )
      return init[0] || null
    } catch {
      return null
    }
  })

  // View mode tab: 'routes' | 'hazards'
  const [viewMode, setViewMode] = useState('routes')

  // Hazard directory filter states
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [severityFilter, setSeverityFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Sync hazards
  const refreshHazards = useCallback(() => {
    setHazards(hazardService.getAllHazards(user?.id))
  }, [user?.id])

  // Handle new hazard report submission
  const handleAddHazard = (data) => {
    if (!canReportHazard) {
      return
    }
    const created = hazardService.addReport(user?.id, data)
    refreshHazards()
    setSelectedHazard(created)
  }

  // Handle resolving a hazard report
  const handleResolveHazard = (hazardId) => {
    if (isFamily) return
    hazardService.updateHazardStatus(user?.id, hazardId, HAZARD_STATUS.RESOLVED)
    refreshHazards()
  }

  // Filtered hazards for directory list
  const filteredHazards = useMemo(() => {
    return hazardService.filterHazards(hazards, {
      category: categoryFilter,
      severity: severityFilter,
      status: statusFilter,
      search: searchQuery,
    })
  }, [hazards, categoryFilter, severityFilter, statusFilter, searchQuery])

  // Statistics
  const activeHazardsCount = hazards.filter((h) => h.status === HAZARD_STATUS.ACTIVE).length
  const criticalCount = hazards.filter(
    (h) => h.status === HAZARD_STATUS.ACTIVE && (h.severity === 'Critical' || h.severity === 'High')
  ).length
  const userReportsCount = hazardService.getUserHazards(user?.id).length

  return (
    <div className="live-map-page">
      {/* Hazard Report Modal */}
      {showReportModal && (
        <HazardReportModal
          onClose={() => setShowReportModal(false)}
          onSubmit={handleAddHazard}
          defaultCoordinates={
            geoLoc ? [geoLoc.latitude, geoLoc.longitude] : [12.9345, 77.6245]
          }
        />
      )}

      <PageHeader
        eyebrow="Explore the area"
        title="Safety map"
        description="A clear view of sample locations, reported hazards, and route safety intelligence."
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn ${isTracking ? 'btn-primary' : 'btn-quiet'}`}
              onClick={isTracking ? stopWatching : startWatching}
              style={{ fontSize: 12, minHeight: 36 }}
            >
              <Navigation size={14} /> {isTracking ? 'Stop Live GPS' : 'Track My Location'}
            </button>
            {canReportHazard && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowReportModal(true)}
                style={{ fontSize: 12, minHeight: 36 }}
              >
                <Plus size={14} /> Report Hazard (Demo)
              </button>
            )}
            {geoLoc?.isRealGps ? (
              <span className="pill pill-accent" style={{ fontSize: 10 }}>
                LIVE GPS (±{geoLoc.accuracy}m)
              </span>
            ) : permissionDenied ? (
              <span className="pill pill-coral" style={{ fontSize: 10 }}>
                GPS DENIED (DEMO FALLBACK)
              </span>
            ) : (
              <span className={`pill ${isFamily ? 'pill-quiet' : 'pill-accent'}`} style={{ fontSize: 10 }}>
                {isFamily ? 'READ-ONLY (FAMILY)' : 'DEMO ENVIRONMENT'}
              </span>
            )}
          </div>
        }
      />

      {/* Permission Denied Notice */}
      {permissionDenied && (
        <div
          className="notice"
          role="status"
          style={{
            marginBottom: 16,
            borderColor: 'var(--amber)',
            color: 'var(--amber)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={15} />
          <span>
            Location access was not granted. Displaying demo environment in Bengaluru. You can enable location in your browser at any time to see your real position.
          </span>
        </div>
      )}

      {/* Overview Metric Cards */}
      <section className="grid three" style={{ marginBottom: 16 }}>
        <article className="panel stat-card">
          <div className="stat-top">
            <span>Active Hazards</span>
            <span className="stat-icon" style={{ color: 'var(--amber, #ffc66d)' }}>
              <AlertTriangle size={17} />
            </span>
          </div>
          <div className="stat-value">{activeHazardsCount}</div>
          <div className="stat-foot">Simulated map observations</div>
        </article>

        <article className="panel stat-card">
          <div className="stat-top">
            <span>High & Critical Risks</span>
            <span className="stat-icon" style={{ color: 'var(--danger)' }}>
              <ShieldAlert size={17} />
            </span>
          </div>
          <div className="stat-value">{criticalCount}</div>
          <div className="stat-foot">Corridors flagged for caution</div>
        </article>

        <article className="panel stat-card">
          <div className="stat-top">
            <span>{isFamily ? 'Account Mode' : 'Your Demo Reports'}</span>
            <span className="stat-icon" style={{ color: 'var(--accent, #2de2b0)' }}>
              <ShieldCheck size={17} />
            </span>
          </div>
          <div className="stat-value">{isFamily ? 'Read-only' : userReportsCount}</div>
          <div className="stat-foot">{isFamily ? 'Family monitoring access' : 'Saved locally on this device'}</div>
        </article>
      </section>

      {/* View Switcher Tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          borderBottom: '1px solid var(--line)',
          paddingBottom: 10,
          marginBottom: 16,
        }}
        role="tablist"
        aria-label="Safety map sections"
      >
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'routes'}
          className={`btn ${viewMode === 'routes' ? 'btn-secondary' : 'btn-quiet'}`}
          onClick={() => setViewMode('routes')}
          style={{ minHeight: 40 }}
        >
          <Route size={16} /> Route Safety & Comparison
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'hazards'}
          className={`btn ${viewMode === 'hazards' ? 'btn-secondary' : 'btn-quiet'}`}
          onClick={() => setViewMode('hazards')}
          style={{ minHeight: 40 }}
        >
          <AlertTriangle size={16} /> Hazard Directory & Filters ({hazards.length})
        </button>
      </div>

      {/* View Mode 1: Route Safety & Comparison */}
      {viewMode === 'routes' && (
        <div className="grid main-split" style={{ alignItems: 'start', gap: 16 }}>
          {/* Left Column: Interactive Safety Map with Route Overlay */}
          <div className="panel panel-pad">
            <div className="panel-head" style={{ marginBottom: 12 }}>
              <div>
                <h2>Explore your surroundings</h2>
                <p>Choose a marker for more context. Map pins are not live reports.</p>
              </div>
              {selectedRoute && (
                <span className="pill pill-accent" style={{ fontSize: 10 }}>
                  Active: {selectedRoute.name}
                </span>
              )}
            </div>

            <SafetyMap
              hazards={hazards}
              selectedHazard={selectedHazard}
              onSelectHazard={(h) => setSelectedHazard(h)}
              routes={activeRoutes}
              selectedRouteId={selectedRoute?.id}
              onSelectRoute={(r) => setSelectedRoute(r)}
              userLocation={geoLoc}
              isTracking={isTracking}
              height="480px"
            />
          </div>

          {/* Right Column: Route Planner & Comparison Panel */}
          <div>
            <RoutePlanner
              hazards={hazards}
              userLocation={geoLoc}
              onSelectRoute={(r) => setSelectedRoute(r)}
              selectedRouteId={selectedRoute?.id}
              onRoutesCalculated={(calcRoutes) => {
                setActiveRoutes(calcRoutes)
                if (calcRoutes.length > 0) {
                  setSelectedRoute(calcRoutes[0])
                }
              }}
            />
          </div>
        </div>
      )}

      {/* View Mode 2: Hazard Directory & Interactive Filter Panel */}
      {viewMode === 'hazards' && (
        <div className="grid main-split" style={{ alignItems: 'start', gap: 16 }}>
          {/* Left Column: Safety Map */}
          <div className="panel panel-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, margin: 0 }}>Hazard Map Explorer</h3>
                <span className="muted" style={{ fontSize: 11 }}>
                  Inspect reported safety conditions, infrastructure delays, and community advisories.
                </span>
              </div>
              <button
                type="button"
                className="btn btn-quiet"
                onClick={refreshHazards}
                title="Refresh hazard feeds"
                aria-label="Refresh hazard feeds"
                style={{ fontSize: 11, padding: '4px 8px' }}
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>

            <SafetyMap
              hazards={filteredHazards}
              selectedHazard={selectedHazard}
              onSelectHazard={(h) => setSelectedHazard(h)}
              userLocation={geoLoc}
              isTracking={isTracking}
              height="500px"
            />
          </div>

          {/* Right Column: Hazard Filter and Directory */}
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="panel panel-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Filter size={16} color="var(--accent)" />
                  <h4 style={{ fontSize: 15, margin: 0 }}>Filter Safety Hazards</h4>
                </div>
                <button
                  type="button"
                  className="btn btn-quiet"
                  style={{ fontSize: 11, padding: '2px 8px' }}
                  onClick={() => {
                    setCategoryFilter('All')
                    setSeverityFilter('All')
                    setStatusFilter('All')
                    setSearchQuery('')
                  }}
                >
                  Reset Filters
                </button>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <Search
                  size={15}
                  style={{ position: 'absolute', left: 10, top: 12, color: 'var(--muted)' }}
                />
                <input
                  type="text"
                  className="input"
                  placeholder="Search hazard title, location, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: 32 }}
                />
              </div>

              {/* Category, Severity, and Status dropdowns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                <div>
                  <label htmlFor="filter-cat" style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                    Category
                  </label>
                  <select
                    id="filter-cat"
                    className="input"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{ fontSize: 12, background: 'var(--panel)', color: 'inherit' }}
                  >
                    <option value="All">All Categories</option>
                    {HAZARD_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="filter-sev" style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                    Severity
                  </label>
                  <select
                    id="filter-sev"
                    className="input"
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    style={{ fontSize: 12, background: 'var(--panel)', color: 'inherit' }}
                  >
                    <option value="All">All Severities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="filter-stat" style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                    Status
                  </label>
                  <select
                    id="filter-stat"
                    className="input"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ fontSize: 12, background: 'var(--panel)', color: 'inherit' }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Filtered Hazards List */}
            <div className="panel panel-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ fontSize: 14, margin: 0 }}>
                  Reported Incidents ({filteredHazards.length})
                </h4>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowReportModal(true)}
                  style={{ fontSize: 11, padding: '4px 10px' }}
                >
                  <Plus size={13} /> Report Hazard
                </button>
              </div>

              {filteredHazards.length === 0 ? (
                <div className="empty-state" style={{ minHeight: 120 }}>
                  <ShieldCheck size={24} color="var(--mint)" />
                  <strong>No matching hazards found</strong>
                  <span style={{ fontSize: 11 }}>Try resetting filters or expanding your search query.</span>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
                  {filteredHazards.map((h) => {
                    const isSelected = selectedHazard?.id === h.id
                    const color = SEVERITY_COLORS[h.severity] || 'var(--coral)'
                    const isUserReport = (h.userId === user?.id || isPolice) && !isFamily

                    return (
                      <div
                        key={h.id}
                        onClick={() => setSelectedHazard(h)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setSelectedHazard(h)
                        }}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 8,
                          background: isSelected ? 'rgba(45, 226, 176, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                          border: isSelected ? '1px solid var(--accent)' : '1px solid var(--line)',
                          cursor: 'pointer',
                          transition: 'border-color 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: color,
                                flexShrink: 0,
                              }}
                            />
                            <strong style={{ fontSize: 13 }}>{h.title}</strong>
                          </div>
                          <span
                            className={`pill ${h.severity === 'Critical'
                              ? 'pill-coral'
                              : h.severity === 'High'
                                ? 'pill-orange'
                                : 'pill-accent'
                              }`}
                            style={{ fontSize: 9, padding: '1px 6px', flexShrink: 0 }}
                          >
                            {h.severity}
                          </span>
                        </div>

                        <p className="muted" style={{ fontSize: 11, margin: '4px 0 6px', lineHeight: 1.4 }}>
                          {h.description}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: 'var(--muted)' }}>
                          <span>
                            {h.category} · {h.locationName}
                          </span>
                          <span>Status: {h.status}</span>
                        </div>

                        {/* Owner action: resolve user-reported hazard */}
                        {isUserReport && h.status === HAZARD_STATUS.ACTIVE && (
                          <div style={{ marginTop: 8, textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-quiet"
                              style={{ fontSize: 10, padding: '2px 8px', minHeight: 24 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleResolveHazard(h.id)
                              }}
                            >
                              <CheckCircle2 size={12} color="var(--mint)" /> Mark as Resolved
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Safety & Mock Data Notice */}
      <div className="notice" style={{ marginTop: 18 }}>
        <AlertTriangle size={15} />
        <span>
          <strong>Simulated demonstration intelligence:</strong> Locations, road hazards, safe areas, and estimated route safety scores are illustrative mock data. Live turn-by-turn navigation, official road certifications, and real-time hazard feeds are not enabled.
        </span>
      </div>
    </div>
  )
}

export default LiveMap
