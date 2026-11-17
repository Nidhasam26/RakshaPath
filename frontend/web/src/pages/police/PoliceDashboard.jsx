import { useState, useEffect, lazy, Suspense } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Check,
  Clock3,
  Filter,
  History,
  Layers,
  MapPin,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Users,
} from 'lucide-react'
import useLocalStorage from '../../hooks/useLocalStorage'
import PageHeader from '../../components/PageHeader'
import { demoPoliceAlerts } from '../../data/demoData'
import { sosService } from '../../services/sosService'
import storageService from '../../services/storageService'
import { POLICE_ALERTS_KEY } from '../../services/mockApi'

const PoliceAnalyticsCharts = lazy(() => import('../../components/police/PoliceAnalyticsCharts'))
const PoliceIncidentMap = lazy(() => import('../../components/police/PoliceIncidentMap'))

const SEVERITY_COLORS = {
  Critical: '#ff4d4d',
  High: '#ff8c42',
  Medium: '#ffc66d',
  Low: '#4facfe',
}

function PoliceDashboard({ overview = false }) {
  const [alerts, setAlerts] = useLocalStorage('rakshapath_police_alerts', demoPoliceAlerts)
  const [statusFilter, setStatusFilter] = useState('All')
  const [severityFilter, setSeverityFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [selectedId, setSelectedId] = useState(alerts[0]?.id)

  // Real-time synchronization when SOS alerts are confirmed or updated across components
  useEffect(() => {
    const handleUpdate = () => {
      const fresh = storageService.get(POLICE_ALERTS_KEY, demoPoliceAlerts)
      setAlerts(fresh)
    }
    window.addEventListener('rakshapath:police_alerts_updated', handleUpdate)
    return () => {
      window.removeEventListener('rakshapath:police_alerts_updated', handleUpdate)
    }
  }, [setAlerts])

  const activeCount = alerts.filter((item) => item.status !== 'Resolved').length

  // Filter alerts safely handling missing/legacy fields
  const visible = alerts.filter((item) => {
    const itemSeverity = item.severity || (item.category === 'Hazard Report' ? 'Medium' : 'Critical')
    const itemCategory = item.category || (item.id?.startsWith('sos-') || item.name?.includes('SOS') ? 'SOS Emergency' : 'General')

    if (statusFilter !== 'All' && item.status !== statusFilter) return false
    if (severityFilter !== 'All' && itemSeverity !== severityFilter) return false
    if (categoryFilter !== 'All' && itemCategory !== categoryFilter) return false
    return true
  })

  const selected = visible.find((item) => item.id === selectedId) || visible[0] || (alerts.length > 0 ? alerts[0] : null)

  const updateStatus = (id, newStatus) => {
    const updated = sosService.updateIncidentStatus(id, newStatus, 'Police Console')
    setAlerts(updated)
  }

  const selectedSeverity = selected?.severity || (selected?.category === 'Hazard Report' ? 'Medium' : 'Critical')
  const selectedCategory = selected?.category || (selected?.id?.startsWith('sos-') ? 'SOS Emergency' : 'General')
  const selectedHistory = Array.isArray(selected?.history) ? selected.history : []

  return (
    <>
      <PageHeader
        eyebrow="Operations · sample data"
        title={overview ? 'Operations overview' : 'Police demo dashboard'}
        description="Review a local set of sample assistance alerts and try the triage controls."
        action={
          <span className="pill pill-lime">
            <Radio size={12} /> SIMULATED FEED
          </span>
        }
      />

      {/* Operational Banner */}
      <section className="panel police-hero" style={{ marginBottom: 16 }}>
        <div className="eyebrow">
          <Activity size={13} /> FIELD INCIDENT TELEMETRY
        </div>
        <h2 style={{ maxWidth: 680, margin: '15px 0 8px', fontSize: 'clamp(23px,3vw,34px)', fontWeight: 600, letterSpacing: '-.05em' }}>
          Unified response management, real-time safety situational awareness.
        </h2>
        <p className="muted" style={{ maxWidth: 640, margin: 0, fontSize: 12 }}>
          Simulated incident records and analytics for interface testing. Not connected to real emergency response services or police dispatch.
        </p>
      </section>

      {/* Key Metric Stat Cards */}
      <section className="grid stats" style={{ marginBottom: 16 }}>
        {[
          ['Open incidents', activeCount, Siren, 'rgba(255,119,124,.17)'],
          ['New', alerts.filter((item) => item.status === 'New').length, AlertTriangle, 'rgba(255,119,124,.1)'],
          ['In Progress', alerts.filter((item) => item.status === 'In Progress').length, Activity, 'rgba(79,172,254,.1)'],
          ['Acknowledged', alerts.filter((item) => item.status === 'Acknowledged').length, Clock3, 'rgba(198,243,106,.1)'],
          ['Total records', alerts.length, Users, 'rgba(100,226,186,.1)'],
        ].map(([label, value, Icon, glow]) => (
          <article className="panel stat-card" key={label} style={{ '--stat-glow': glow }}>
            <div className="stat-top">
              <span>{label}</span>
              <span className="stat-icon">
                <Icon size={17} />
              </span>
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-foot">Simulated field feed</div>
          </article>
        ))}
      </section>

      {/* Analytics Charts */}
      <Suspense fallback={<div className="panel panel-pad" style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="muted">Loading incident analytics...</span></div>}>
        <PoliceAnalyticsCharts incidents={alerts} />
      </Suspense>

      {/* Incident GIS Map */}
      <section className="panel panel-pad" style={{ marginBottom: 16 }}>
        <div className="panel-head" style={{ marginBottom: 12 }}>
          <div>
            <h3 style={{ fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={16} /> Incident GIS Overview
            </h3>
            <p className="muted" style={{ fontSize: 11, margin: '3px 0 0' }}>
              Interactive geographic distribution of active simulated alerts and distress markers.
            </p>
          </div>
          <span className="pill pill-quiet" style={{ fontSize: 10 }}>
            {visible.length} plotted in view
          </span>
        </div>
        <Suspense fallback={<div style={{ minHeight: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}><span className="muted">Loading incident map...</span></div>}>
          <PoliceIncidentMap
            incidents={visible}
            selectedIncidentId={selected?.id}
            onSelectIncident={(incident) => setSelectedId(incident.id)}
            height="340px"
          />
        </Suspense>
      </section>

      {/* Incident Queue & Detail Split */}
      <section className="grid main-split">
        {/* Incident Queue / Filter panel */}
        <article className="panel panel-pad">
          <div className="panel-head">
            <div>
              <h2>Assistance queue</h2>
              <p>Filter and select an incident to inspect telemetry or dispatch response.</p>
            </div>
            {/* Status tabs */}
            <div className="tabs">
              {['All', 'New', 'Acknowledged', 'In Progress', 'Resolved'].map((item) => (
                <button
                  className={`tab ${statusFilter === item ? 'active' : ''}`}
                  key={item}
                  type="button"
                  onClick={() => setStatusFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Filters: Severity & Category */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              alignItems: 'center',
              padding: '8px 10px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 8,
              marginBottom: 12,
              border: '1px solid var(--line)',
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={12} /> Filters:
            </span>

            {/* Severity select */}
            <select
              aria-label="Filter by severity"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{
                fontSize: 11,
                padding: '3px 8px',
                background: 'var(--card-bg, #111722)',
                border: '1px solid var(--line)',
                borderRadius: 4,
                color: 'var(--text-color, #e6edf3)',
              }}
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Category select */}
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                fontSize: 11,
                padding: '3px 8px',
                background: 'var(--card-bg, #111722)',
                border: '1px solid var(--line)',
                borderRadius: 4,
                color: 'var(--text-color, #e6edf3)',
              }}
            >
              <option value="All">All Categories</option>
              <option value="SOS Emergency">SOS Emergency</option>
              <option value="Community Hazard">Community Hazard</option>
              <option value="General">General Assistance</option>
            </select>

            {(statusFilter !== 'All' || severityFilter !== 'All' || categoryFilter !== 'All') && (
              <button
                type="button"
                className="btn-link"
                style={{ fontSize: 10, color: 'var(--coral)', marginLeft: 'auto' }}
                onClick={() => {
                  setStatusFilter('All')
                  setSeverityFilter('All')
                  setCategoryFilter('All')
                }}
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Incident row items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {!alerts.length ? (
              <div className="empty-state">
                <ShieldCheck size={24} color="var(--mint)" />
                <strong>No incidents in active queue</strong>
                <span className="muted" style={{ fontSize: 11 }}>
                  All simulated corridors and traveller distress signals are clear.
                </span>
              </div>
            ) : !visible.length ? (
              <div className="empty-state">
                <ShieldCheck size={21} />
                <strong>No records matching current filters</strong>
                <span className="muted" style={{ fontSize: 11 }}>
                  Try resetting filters to view all simulated reports.
                </span>
              </div>
            ) : (
              visible.map((alert) => {
                const sev = alert.severity || (alert.category === 'Hazard Report' ? 'Medium' : 'Critical')
                const sevColor = SEVERITY_COLORS[sev] || '#ff4d4d'

                return (
                  <button
                    className="row-card"
                    key={alert.id}
                    onClick={() => setSelectedId(alert.id)}
                    type="button"
                    style={{
                      width: '100%',
                      border: 0,
                      borderBottom: '1px solid var(--line)',
                      background: selected?.id === alert.id ? 'rgba(198,243,106,.05)' : 'transparent',
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: 10,
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      className="row-icon"
                      style={{
                        color: alert.status === 'New' ? 'var(--coral)' : 'var(--lime)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Siren size={17} />
                    </span>

                    <span className="row-main" style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <strong>{alert.name}</strong>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 4,
                            background: `${sevColor}20`,
                            color: sevColor,
                            textTransform: 'uppercase',
                          }}
                        >
                          {sev}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {alert.location} · {alert.time}
                      </span>
                    </span>

                    <span className={`pill ${alert.status === 'New' ? 'pill-coral' : alert.status === 'Resolved' ? 'pill-mint' : alert.status === 'In Progress' ? 'pill-quiet' : 'pill-lime'}`} style={{ fontSize: 10 }}>
                      {alert.status}
                    </span>
                  </button>
                )
              })
            )}
          </div>
          <p className="muted" style={{ margin: '13px 0 0', fontSize: 10 }}>
            Triage operations are synchronized in local browser memory.
          </p>
        </article>

        {/* Selected Incident Detail panel */}
        <article className="panel panel-pad" aria-live="polite">
          {selected ? (
            <>
              <div className="panel-head" style={{ marginBottom: 12 }}>
                <div>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldAlert size={18} color={SEVERITY_COLORS[selectedSeverity]} /> Incident Detail
                  </h2>
                  <p style={{ fontFamily: 'monospace', fontSize: 11 }}>{selected.id}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: `${SEVERITY_COLORS[selectedSeverity]}25`,
                      color: SEVERITY_COLORS[selectedSeverity],
                      textTransform: 'uppercase',
                    }}
                  >
                    {selectedSeverity}
                  </span>
                  <span className={`pill ${selected.status === 'New' ? 'pill-coral' : selected.status === 'Resolved' ? 'pill-mint' : selected.status === 'In Progress' ? 'pill-quiet' : 'pill-lime'}`}>
                    {selected.status}
                  </span>
                </div>
              </div>

              {/* Category & Location */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span className="pill pill-quiet" style={{ fontSize: 9 }}>
                  CATEGORY: {selectedCategory}
                </span>
                <span className="eyebrow" style={{ margin: 0, fontSize: 10 }}>
                  <MapPin size={11} /> SAMPLE INCIDENT TELEMETRY
                </span>
              </div>

              <h3 style={{ margin: '6px 0 2px', fontSize: 16 }}>{selected.location}</h3>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--muted)', marginBottom: 8 }}>
                Coordinates: {Array.isArray(selected.coords) ? `[${selected.coords[0].toFixed(4)}, ${selected.coords[1].toFixed(4)}]` : Array.isArray(selected.coordinates) ? `[${selected.coordinates[0].toFixed(4)}, ${selected.coordinates[1].toFixed(4)}]` : '12.9716, 77.5946 (Estimated)'}
              </div>
              <p className="muted" style={{ margin: 0, fontSize: 12, lineHeight: 1.4 }}>
                {selected.detail}
              </p>

              {/* Reporter details */}
              <div className="row-card" style={{ marginTop: 14, padding: '8px 12px' }}>
                <span className="row-icon">
                  <Users size={17} />
                </span>
                <span className="row-main">
                  <strong>{selected.name}</strong>
                  <span style={{ fontSize: 11 }}>{selected.phone || 'Phone: Not provided'}</span>
                </span>
                <span className="pill" style={{ fontSize: 10 }}>{selected.time}</span>
              </div>

              {/* Triage Actions */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                  Field Triage Actions
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={selected.status === 'Acknowledged' || selected.status === 'In Progress' || selected.status === 'Resolved'}
                    onClick={() => updateStatus(selected.id, 'Acknowledged')}
                  >
                    <Check size={14} /> Acknowledge
                  </button>
                  <button
                    className="btn"
                    type="button"
                    disabled={selected.status === 'In Progress' || selected.status === 'Resolved'}
                    onClick={() => updateStatus(selected.id, 'In Progress')}
                  >
                    <Clock3 size={14} /> In Progress
                  </button>
                  <button
                    className="btn"
                    type="button"
                    disabled={selected.status === 'Resolved'}
                    onClick={() => updateStatus(selected.id, 'Resolved')}
                  >
                    <ShieldCheck size={14} /> Resolve Incident
                  </button>
                </div>
              </div>

              {/* Incident History Audit Log */}
              <div style={{ marginTop: 20, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                  <History size={13} />
                  <span>Audit Trail & Response Log</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                  {selectedHistory.length === 0 ? (
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic', padding: '4px 0' }}>
                      Initial incident recorded at {selected.time || 'origin'}. No triage actions performed yet.
                    </div>
                  ) : (
                    selectedHistory.map((h, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: 11,
                          padding: '6px 8px',
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: 6,
                          borderLeft: `3px solid ${h.status === 'Resolved' ? 'var(--mint)' : 'var(--lime)'}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: 10 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-color, #e6edf3)' }}>{h.status}</span>
                          <span>{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                        <div style={{ marginTop: 2, color: 'var(--muted)' }}>{h.note}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: '40px 16px' }}>
              <ShieldAlert size={24} color="var(--muted)" />
              <strong style={{ display: 'block', margin: '8px 0 4px' }}>No incident selected</strong>
              <span className="muted" style={{ fontSize: 11 }}>
                Select an incident from the assistance queue to inspect telemetry, responder actions, and coordinates.
              </span>
            </div>
          )}
        </article>
      </section>

      {/* Safety & Demo notice */}
      <div className="notice" style={{ marginTop: 15 }}>
        <AlertTriangle size={15} />
        <span>
          Simulated incident records and analytics for interface testing. Not connected to real emergency response services or police dispatch. For actual emergencies, call your local emergency helpline immediately.
        </span>
        <ArrowUpRight size={13} />
      </div>
    </>
  )
}

export default PoliceDashboard
