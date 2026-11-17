import { useEffect, useState } from 'react'
import { AlertCircle, MapPin, X } from 'lucide-react'
import { HAZARD_CATEGORIES, HAZARD_SEVERITIES } from '../../data/hazardData'

export function HazardReportModal({ onClose, onSubmit, defaultCoordinates = [12.9345, 77.6245] }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(HAZARD_CATEGORIES[0])
  const [severity, setSeverity] = useState(HAZARD_SEVERITIES.MEDIUM)
  const [locationName, setLocationName] = useState('')
  const [latitude, setLatitude] = useState(defaultCoordinates[0].toFixed(4))
  const [longitude, setLongitude] = useState(defaultCoordinates[1].toFixed(4))
  const [description, setDescription] = useState('')
  const [durationHours, setDurationHours] = useState('6')
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)

    const latNum = parseFloat(latitude)
    const lngNum = parseFloat(longitude)

    if (!title.trim()) {
      setError('Hazard title is required.')
      return
    }
    if (!description.trim()) {
      setError('Please provide a description of the hazard.')
      return
    }
    if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      setError('Please enter valid geographic coordinates.')
      return
    }

    try {
      onSubmit({
        title: title.trim(),
        category,
        severity,
        locationName: locationName.trim() || `${latNum.toFixed(4)}° N, ${lngNum.toFixed(4)}° E`,
        position: [latNum, lngNum],
        description: description.trim(),
        durationHours: Number(durationHours) || 6,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to submit report.')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Report a safety hazard"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 10, 15, 0.92)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        overflowY: 'auto',
      }}
    >
      <div
        className="panel panel-pad"
        style={{
          maxWidth: 500,
          width: '100%',
          position: 'relative',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 44,
            height: 44,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 0,
            color: 'var(--muted)',
            cursor: 'pointer',
          }}
          aria-label="Close hazard report modal"
        >
          <X size={20} />
        </button>

        <span className="pill pill-coral" style={{ marginBottom: 12 }}>
          DEMO HAZARD REPORTING · LOCAL STORAGE
        </span>

        <h2 style={{ fontSize: 20, margin: '6px 0 4px' }}>Report a Hazard or Incident</h2>
        <p className="muted" style={{ fontSize: 12, marginBottom: 16 }}>
          Contribute local safety observations. Reports are stored locally on your device for demonstration purposes.
        </p>

        {error && (
          <div className="notice" role="alert" style={{ marginBottom: 14, borderColor: 'var(--coral)', color: 'var(--coral)' }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div>
            <label htmlFor="hazard-title" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              Hazard Title *
            </label>
            <input
              id="hazard-title"
              type="text"
              className="input"
              placeholder="e.g. Broken pavement and dark alley"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <label htmlFor="hazard-category" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Category *
              </label>
              <select
                id="hazard-category"
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ background: 'var(--panel)', color: 'inherit' }}
              >
                {HAZARD_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="hazard-severity" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Severity Level *
              </label>
              <select
                id="hazard-severity"
                className="input"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                style={{ background: 'var(--panel)', color: 'inherit' }}
              >
                {Object.values(HAZARD_SEVERITIES).map((sev) => (
                  <option key={sev} value={sev}>
                    {sev}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="hazard-location-name" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              Location Name / Landmark
            </label>
            <input
              id="hazard-location-name"
              type="text"
              className="input"
              placeholder="e.g. Near Indiranagar Metro Pillar 42"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label htmlFor="hazard-lat" style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                Latitude *
              </label>
              <input
                id="hazard-lat"
                type="number"
                step="0.0001"
                className="input"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="hazard-lng" style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                Longitude *
              </label>
              <input
                id="hazard-lng"
                type="number"
                step="0.0001"
                className="input"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="hazard-desc" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              Description *
            </label>
            <textarea
              id="hazard-desc"
              className="input"
              rows={3}
              placeholder="Describe the condition, risks, or precautions for travellers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="hazard-duration" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              Estimated Duration until Expiry
            </label>
            <select
              id="hazard-duration"
              className="input"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              style={{ background: 'var(--panel)', color: 'inherit' }}
            >
              <option value="2">2 hours (temporary condition)</option>
              <option value="6">6 hours (daily shift)</option>
              <option value="24">24 hours (full day)</option>
              <option value="168">7 days (extended roadwork)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="button" className="btn btn-quiet" onClick={onClose} style={{ minHeight: 44 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ minHeight: 44 }}>
              <MapPin size={15} /> Submit Demo Report
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default HazardReportModal
