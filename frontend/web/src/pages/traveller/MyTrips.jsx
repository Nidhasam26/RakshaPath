import { useMemo, useState } from 'react'
import { CalendarDays, Check, Clock3, MapPin, Play, Plus, Route, Trash2 } from 'lucide-react'
import useUserStorage from '../../hooks/useUserStorage'
import { useTripTracker } from '../../hooks/useTripTracker'
import ActiveTripTracker from '../../components/trips/ActiveTripTracker'
import PageHeader from '../../components/PageHeader'
import { initialTrips } from '../../data/demoData'
import { isNonEmptyText } from '../../utils/validation'

function MyTrips() {
  const [trips, setTrips] = useUserStorage('trips', initialTrips)
  const { activeTrip, startTrip, pauseTrip, resumeTrip, endTrip } = useTripTracker()
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('All trips')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [error, setError] = useState('')

  const handleStartJourney = (trip) => {
    setError('')
    try {
      startTrip({
        plannedTripId: trip.id,
        start: trip.start,
        end: trip.end || trip.destination,
      })
    } catch (err) {
      setError(err.message || 'Could not start trip.')
    }
  }

  const completed = trips.filter((trip) => trip.status === 'Completed').length
  const planned = trips.filter((trip) => trip.status === 'Planned').length
  const visibleTrips = useMemo(
    () => (filter === 'All trips' ? trips : trips.filter((trip) => trip.status === filter)),
    [filter, trips],
  )

  const createTrip = (event) => {
    event.preventDefault()
    if (!isNonEmptyText(start) || !isNonEmptyText(end)) {
      setError('Starting point and destination cannot be empty or whitespace only.')
      return
    }
    const cleanStart = start.trim()
    const cleanEnd = end.trim()
    const next = {
      id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
      start: cleanStart,
      end: cleanEnd,
      destination: cleanEnd,
      date: new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date()),
      status: 'Planned',
    }
    setTrips((current) => [next, ...current])
    setStart('')
    setEnd('')
    setError('')
    setShowForm(false)
  }

  const updateStatus = (id, status) =>
    setTrips((current) => current.map((trip) => (trip.id === id ? { ...trip, status } : trip)))
  const removeTrip = (id) => setTrips((current) => current.filter((trip) => trip.id !== id))

  return (
    <>
      <PageHeader
        eyebrow="Every mile, remembered"
        title="My trips"
        description="Keep your plans together and revisit the journeys you’ve taken."
        action={
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              setError('')
              setShowForm((open) => !open)
            }}
          >
            <Plus size={15} /> Plan a trip
          </button>
        }
      />
      <section className="grid three" style={{ marginBottom: 17 }}>
        {[
          ['Total journeys', trips.length, Route],
          ['Completed', completed, Check],
          ['Planned', planned, Clock3],
        ].map(([label, value, Icon]) => (
          <article className="panel stat-card" key={label}>
            <div className="stat-top">
              <span>{label}</span>
              <span className="stat-icon">
                <Icon size={17} />
              </span>
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-foot">Saved in this browser</div>
          </article>
        ))}
      </section>

      {/* Active Trip Live Monitor */}
      {activeTrip && (
        <ActiveTripTracker
          activeTrip={activeTrip}
          onPause={pauseTrip}
          onResume={resumeTrip}
          onEnd={endTrip}
        />
      )}
      {showForm && (
        <form className="panel panel-pad" onSubmit={createTrip} style={{ marginBottom: 17 }}>
          <div className="panel-head">
            <div>
              <h2>Plan a new journey</h2>
              <p>Give your trip a start and destination.</p>
            </div>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => {
                setError('')
                setShowForm(false)
              }}
            >
              Cancel
            </button>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="trip-start">Starting point</label>
              <input
                className="input"
                id="trip-start"
                value={start}
                onChange={(event) => {
                  setStart(event.target.value)
                  setError('')
                }}
                placeholder="e.g. Home"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="trip-end">Destination</label>
              <input
                className="input"
                id="trip-end"
                value={end}
                onChange={(event) => {
                  setEnd(event.target.value)
                  setError('')
                }}
                placeholder="e.g. City centre"
                required
              />
            </div>
          </div>
          {error && (
            <p role="alert" style={{ color: 'var(--coral)', fontSize: 11, marginTop: 10 }}>
              {error}
            </p>
          )}
          <button className="btn btn-primary" type="submit" style={{ marginTop: 15 }}>
            Save journey <Plus size={14} />
          </button>
        </form>
      )}
      <section className="panel panel-pad">
        <div className="panel-head">
          <div>
            <h2>Your journey history</h2>
            <p>Planned routes and completed trips</p>
          </div>
          <div className="tabs">
            {['All trips', 'Planned', 'Completed'].map((item) => (
              <button
                className={`tab ${filter === item ? 'active' : ''}`}
                key={item}
                type="button"
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        {!visibleTrips.length ? (
          <div className="empty-state">
            <Route size={23} />
            <strong>No journeys here yet</strong>
            <span>Plan a trip to get started.</span>
          </div>
        ) : (
          <div>
            {visibleTrips.map((trip) => (
              <div className="row-card" key={trip.id}>
                <span className="row-icon">
                  <Route size={18} />
                </span>
                <span className="row-main">
                  <strong>
                    {trip.start} <span style={{ color: 'var(--lime)' }}>→</span> {trip.end}
                  </strong>
                  <span>
                    <CalendarDays size={12} style={{ verticalAlign: '-2px', marginRight: 5 }} />
                    {trip.date}
                  </span>
                </span>
                <span className={`pill ${trip.status === 'Completed' ? 'pill-mint' : 'pill-lime'}`}>
                  {trip.status}
                </span>
                {trip.status === 'Planned' && (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      className="btn btn-quiet"
                      type="button"
                      style={{ fontSize: 11, padding: '3px 8px', color: 'var(--mint)' }}
                      title="Start this journey"
                      aria-label={`Start journey to ${trip.destination}`}
                      disabled={Boolean(activeTrip && activeTrip.status === 'Active')}
                      onClick={() => handleStartJourney(trip)}
                    >
                      <Play size={12} /> Start
                    </button>
                    <button
                      className="icon-btn"
                      type="button"
                      title="Mark journey completed"
                      aria-label={`Mark ${trip.destination} completed`}
                      onClick={() => updateStatus(trip.id, 'Completed')}
                    >
                      <Check size={15} />
                    </button>
                  </div>
                )}
                <button
                  className="icon-btn"
                  type="button"
                  title="Delete journey"
                  aria-label={`Delete trip to ${trip.destination}`}
                  onClick={() => removeTrip(trip.id)}
                >
                  <Trash2 size={15} />
                </button>
                <MapPin size={14} className="muted" />
              </div>
            ))}
          </div>
        )}
      </section>
      <p className="muted" style={{ marginTop: 13, fontSize: 10 }}>
        Demo mode: trips are saved on this device. Routes, tracking, and sharing are not connected to live services.
      </p>
    </>
  )
}

export default MyTrips
