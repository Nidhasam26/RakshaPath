import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  CarFront,
  Clock3,
  Compass,
  MapPin,
  Navigation,
  Radio,
  Route,
  Search,
  ShieldCheck,
  Siren,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import useUserStorage from '../../hooks/useUserStorage'
import { useContacts } from '../../hooks/useContacts'
import PageHeader, { CardTitle } from '../../components/PageHeader'
import SafetyMap from '../../components/maps/SafetyMap'
import { initialTrips } from '../../data/demoData'
import hazardService from '../../services/hazardService'
import tripService from '../../services/tripService'

function Metric({ label, value, foot, icon: Icon, tone }) {
  return (
    <article className="panel stat-card" style={{ '--stat-glow': tone }}>
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">
          <Icon size={17} />
        </span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">{foot}</div>
    </article>
  )
}

const DESTINATION_PRESETS = [
  'Indiranagar 100ft Rd',
  'Whitefield ITPL',
  'Koramangala 5th Block',
  'Kempegowda Airport',
]

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trips] = useUserStorage('trips', initialTrips)
  const { contacts } = useContacts()
  const [searchTarget, setSearchTarget] = useState('')

  // Network connectivity status (FR-18)
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true))

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Dynamic Hazard and Trip counts
  const allHazards = useMemo(() => hazardService.getAllHazards(user?.id), [user?.id])
  const activeHazards = useMemo(() => allHazards.filter((h) => h.status === 'active'), [allHazards])
  const nextTrip = useMemo(() => trips.find((trip) => trip.status === 'Planned'), [trips])
  const activeTrip = useMemo(() => tripService.getActiveTrip(user?.id), [user?.id])

  const handleDestinationSearch = (e) => {
    e.preventDefault()
    if (!searchTarget.trim()) return
    navigate('/map', { state: { destination: searchTarget.trim() } })
  }

  const handleSelectPreset = (preset) => {
    navigate('/map', { state: { destination: preset } })
  }

  const isFamilyRole = user?.role === 'Family'

  return (
    <>
      <PageHeader
        eyebrow={isFamilyRole ? 'Family Guardian · Overview' : 'Your journey starts here'}
        title={`Good to see you, ${user?.name?.split(' ')[0] || (isFamilyRole ? 'Guardian' : 'Traveller')}.`}
        description={
          isFamilyRole
            ? 'Monitor shared loved-one journeys and maintain situational awareness.'
            : 'A calmer way to keep an eye on the road ahead with safety advisories.'
        }
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Network connectivity pill */}
            <span
              className={`pill ${isOnline ? 'pill-mint' : 'pill-coral'}`}
              role="status"
              aria-label={isOnline ? 'Online mode active' : 'Offline mode active'}
            >
              {isOnline ? (
                <>
                  <Wifi size={12} /> Online · Simulated services
                </>
              ) : (
                <>
                  <WifiOff size={12} /> Offline Mode · Cached data
                </>
              )}
            </span>
          </div>
        }
      />

      {/* Overview Stat Metrics */}
      <section className="grid stats" aria-label="Travel overview">
        <Metric
          label="Safety status"
          value={activeTrip ? 'Active Trip' : 'Ready'}
          foot={activeTrip ? `${activeTrip.remainingKm} km remaining (Simulated)` : 'Demo environment · No live assessment'}
          icon={ShieldCheck}
          tone={activeTrip ? 'rgba(198,243,106,.2)' : 'rgba(100,226,186,.18)'}
        />
        <Metric
          label={isFamilyRole ? 'Family Circles' : 'Your journeys'}
          value={isFamilyRole ? 'Active' : trips.length}
          foot={isFamilyRole ? 'Controlled token monitoring' : `${trips.filter((trip) => trip.status === 'Completed').length} completed`}
          icon={Route}
        />
        <Metric
          label="Hazard markers"
          value={String(allHazards.length).padStart(2, '0')}
          foot={`${activeHazards.length} active in area`}
          icon={MapPin}
          tone="rgba(255,198,109,.18)"
        />
        <Metric
          label="Trusted contacts"
          value={contacts.length}
          foot={contacts.length ? 'Saved on this device' : 'Add someone you trust'}
          icon={Users}
          tone="rgba(100,226,186,.13)"
        />
      </section>

      {/* Destination Quick-Search Bar (FR-15) - Available for Travellers */}
      {!isFamilyRole && (
        <section className="panel panel-pad" style={{ marginTop: 16 }}>
          <form onSubmit={handleDestinationSearch} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label htmlFor="destination-quick-search" style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Compass size={15} color="var(--lime)" /> Plan a Safe Route (FR-15)
              </label>
              <span className="pill pill-quiet" style={{ fontSize: 9 }}>
                DEMO CORRIDOR SEARCH
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  id="destination-quick-search"
                  type="text"
                  className="input"
                  placeholder="Where are you heading? e.g. Indiranagar, ITPL, Kempegowda Airport..."
                  value={searchTarget}
                  onChange={(e) => setSearchTarget(e.target.value)}
                  style={{ width: '100%', paddingLeft: 34 }}
                />
                <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                Inspect Route <ArrowRight size={14} />
              </button>
            </div>

            {/* Quick Presets */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 2 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Popular destinations:</span>
              {DESTINATION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="btn-quiet"
                  style={{
                    fontSize: 10,
                    padding: '3px 8px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--line)',
                    cursor: 'pointer',
                    color: 'var(--text-color, #e6edf3)',
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </form>
        </section>
      )}

      {/* Main Split Content */}
      <section className="grid main-split" style={{ marginTop: 16 }}>
        {/* Left Side: Map Preview */}
        <article className="panel panel-pad">
          <CardTitle
            title="The road, in view"
            detail={isFamilyRole ? 'Overview map for situational awareness' : 'A quick look at illustrative safety points'}
            action={
              <button className="btn btn-quiet" onClick={() => navigate('/map')} type="button">
                Open map <ArrowRight size={14} />
              </button>
            }
          />
          <SafetyMap />
          <p className="muted" style={{ margin: '12px 0 0', fontSize: 10 }}>
            {isFamilyRole
              ? 'Read-only preview for general situational awareness. No live GPS or real vehicle tracking.'
              : 'Map pins are sample locations only. They do not represent verified live reports or your current position.'}
          </p>
        </article>

        {/* Right Side: Family view vs Traveller view */}
        <div className="grid" style={{ alignContent: 'start', gap: 16 }}>
          {isFamilyRole ? (
            /* Dedicated Family Guardian Dashboard cards */
            <>
              <article className="panel panel-pad">
                <CardTitle title="Family Guardian Portal" detail="Shared Journey Tracking" />
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '8px 0 14px' }}>
                  Track loved ones when they share an active demo link. Data is sanitized and contains zero passwords or private account details.
                </p>
                <button
                  className="btn btn-primary"
                  type="button"
                  style={{ width: '100%', minHeight: 44 }}
                  onClick={() => navigate('/family')}
                >
                  <Users size={16} /> Open Family Tracking Monitor
                </button>
              </article>

              <article className="panel panel-pad">
                <CardTitle title="Emergency Contacts" detail="Trusted Circle Coordination" />
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '8px 0 14px' }}>
                  Ensure your phone number is saved in the traveller's trusted contacts circle on their device.
                </p>
                <button className="btn" type="button" style={{ width: '100%' }} onClick={() => navigate('/contacts')}>
                  <Users size={15} /> View Trusted Contacts
                </button>
              </article>
            </>
          ) : (
            /* Traveller cards */
            <>
              <article className="panel panel-pad">
                <CardTitle title={activeTrip ? 'Active Journey' : 'Next journey'} detail="Your plans, all in one place" />
                {activeTrip ? (
                  <div className="row-card" style={{ borderLeft: '3px solid var(--lime)' }}>
                    <span className="row-icon" style={{ color: 'var(--lime)' }}>
                      <Radio size={18} />
                    </span>
                    <span className="row-main">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <strong>
                          {activeTrip.start} → {activeTrip.end}
                        </strong>
                        <span className="pill pill-lime" style={{ fontSize: 9 }}>
                          {activeTrip.progress}%
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {activeTrip.remainingKm} km left · approx {activeTrip.remainingMins} mins
                      </span>
                    </span>
                  </div>
                ) : nextTrip ? (
                  <div className="row-card">
                    <span className="row-icon">
                      <Navigation size={18} />
                    </span>
                    <span className="row-main">
                      <strong>
                        {nextTrip.start} → {nextTrip.end}
                      </strong>
                      <span>{nextTrip.date} · Planned</span>
                    </span>
                  </div>
                ) : (
                  <div className="empty-state" style={{ minHeight: 118 }}>
                    <Clock3 size={20} />
                    <strong>No journeys planned</strong>
                    <span style={{ fontSize: 10 }}>Your next trip will show up here.</span>
                  </div>
                )}
                <button className="btn" type="button" style={{ marginTop: 14 }} onClick={() => navigate('/trips')}>
                  <Route size={15} /> {activeTrip ? 'Manage Active Trip' : 'View my trips'}
                </button>
              </article>

              <article className="panel panel-pad">
                <CardTitle title="Emergency assistance" detail="Keep the right help close" />
                <button
                  className="btn btn-danger"
                  style={{ width: '100%', minHeight: 48 }}
                  type="button"
                  onClick={() => navigate('/sos')}
                >
                  <Siren size={17} /> Open SOS emergency center
                </button>
                <a className="btn" href="tel:112" style={{ width: '100%', marginTop: 9 }}>
                  <CarFront size={15} /> Call emergency number 112
                </a>
                <button
                  className="btn btn-quiet"
                  type="button"
                  style={{ width: '100%', marginTop: 9 }}
                  onClick={() => navigate('/safe-places')}
                >
                  <Compass size={15} /> Nearby Safe Places
                </button>
              </article>
            </>
          )}

          <div className="notice">
            <Activity size={15} />
            <span>
              This workspace uses illustrative information. Live location, dispatch, and verified alerts are not connected.
            </span>
          </div>
        </div>
      </section>
    </>
  )
}

export default Dashboard
