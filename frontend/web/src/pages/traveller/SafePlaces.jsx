import { useState, useMemo } from 'react'
import {
  Compass,
  HeartPulse,
  Hospital,
  Info,
  MapPin,
  Navigation,
  Phone,
  Search,
  Shield,
  ShieldCheck,
  Siren,
  Train,
} from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import PageHeader from '../../components/PageHeader'
import safePlacesService from '../../services/safePlacesService'
import { SAFE_PLACE_CATEGORIES } from '../../data/safePlacesData'
import 'leaflet/dist/leaflet.css'

const CATEGORY_ICONS = {
  [SAFE_PLACE_CATEGORIES.HOSPITAL]: Hospital,
  [SAFE_PLACE_CATEGORIES.POLICE]: Siren,
  [SAFE_PLACE_CATEGORIES.PHARMACY]: HeartPulse,
  [SAFE_PLACE_CATEGORIES.TRANSIT]: Train,
}

const CATEGORY_COLORS = {
  [SAFE_PLACE_CATEGORIES.HOSPITAL]: '#ff777c',
  [SAFE_PLACE_CATEGORIES.POLICE]: '#4facfe',
  [SAFE_PLACE_CATEGORIES.PHARMACY]: '#64e2ba',
  [SAFE_PLACE_CATEGORIES.TRANSIT]: '#c6f36a',
}

const DEFAULT_MAP_CENTER = [12.95, 77.63]

function SafePlaces() {
  const [selectedCategory, setSelectedCategory] = useState(SAFE_PLACE_CATEGORIES.ALL)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlaceId, setSelectedPlaceId] = useState(null)

  const places = safePlacesService.getSafePlaces()

  const filteredPlaces = useMemo(() => {
    return safePlacesService.filterSafePlaces({
      category: selectedCategory,
      search: searchQuery,
    })
  }, [selectedCategory, searchQuery])

  const selectedPlace = useMemo(() => {
    return places.find((p) => p.id === selectedPlaceId) || filteredPlaces[0] || null
  }, [places, selectedPlaceId, filteredPlaces])

  const mapCenter = useMemo(() => {
    if (selectedPlace && selectedPlace.coords) {
      return selectedPlace.coords
    }
    return DEFAULT_MAP_CENTER
  }, [selectedPlace])

  return (
    <>
      <PageHeader
        eyebrow="Emergency & Assistance Points"
        title="Nearby Safe Places"
        description="Directory of nearby emergency safe havens, medical posts, 24/7 pharmacies and transit shelters (Demonstration Sample Data)."
        action={
          <span className="pill pill-lime">
            <Compass size={12} /> SIMULATED DIRECTORY
          </span>
        }
      />

      {/* Overview Hero Banner */}
      <section className="panel" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 6px' }}>
          <ShieldCheck size={14} color="var(--mint)" /> COMMUNITY PROTECTION NETWORK (DEMO)
        </div>
        <h2 style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 600, margin: '0 0 6px' }}>
          Locate immediate sanctuary, medical care and emergency authorities.
        </h2>
        <p className="muted" style={{ margin: 0, fontSize: 12, maxWidth: 680 }}>
          Demonstration directory of nearby assistance resources. All listed facilities, contact numbers, and hours are unverified sample records for interface preview. When in distress or unfamiliar surroundings, seek out verified emergency services or dial 112 immediately.
        </p>
      </section>

      {/* Filter & Search Bar */}
      <div
        className="panel"
        style={{
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Category Tabs */}
        <div className="tabs" role="tablist" aria-label="Safe place categories">
          {[
            { id: SAFE_PLACE_CATEGORIES.ALL, label: 'All Places' },
            { id: SAFE_PLACE_CATEGORIES.HOSPITAL, label: 'Hospitals' },
            { id: SAFE_PLACE_CATEGORIES.POLICE, label: 'Police Posts' },
            { id: SAFE_PLACE_CATEGORIES.PHARMACY, label: '24/7 Pharmacies' },
            { id: SAFE_PLACE_CATEGORIES.TRANSIT, label: 'Transit Hubs' },
          ].map((cat) => (
            <button
              key={cat.id}
              role="tab"
              aria-selected={selectedCategory === cat.id}
              type="button"
              className={`tab ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Quick Search */}
        <div style={{ position: 'relative', minWidth: 220, flex: '1 1 220px', maxWidth: 360 }}>
          <Search
            size={14}
            color="var(--muted)"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            className="input"
            type="search"
            placeholder="Search by facility name or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 30, fontSize: 12, width: '100%' }}
            aria-label="Search safe places"
          />
        </div>
      </div>

      {/* Main Layout Split: Map & Place Cards */}
      <div className="grid main-split" style={{ alignItems: 'start' }}>
        {/* Left Column: Place Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredPlaces.length === 0 ? (
            <div className="panel panel-pad empty-state">
              <Shield size={24} color="var(--muted)" />
              <strong>No safe places found</strong>
              <span className="muted" style={{ fontSize: 12 }}>
                Try resetting your search query or selecting "All Places".
              </span>
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() => {
                  setSelectedCategory(SAFE_PLACE_CATEGORIES.ALL)
                  setSearchQuery('')
                }}
                style={{ marginTop: 8 }}
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredPlaces.map((place) => {
              const Icon = CATEGORY_ICONS[place.category] || Shield
              const color = CATEGORY_COLORS[place.category] || '#64e2ba'
              const isSelected = selectedPlace?.id === place.id

              return (
                <article
                  key={place.id}
                  className="panel panel-pad"
                  style={{
                    borderLeft: `4px solid ${color}`,
                    background: isSelected ? 'rgba(198, 243, 106, 0.04)' : undefined,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setSelectedPlaceId(place.id)}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSelected}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedPlaceId(place.id)
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: `${color}20`,
                            color,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            textTransform: 'uppercase',
                          }}
                        >
                          <Icon size={11} /> {place.category}
                        </span>
                        <span className="pill pill-quiet" style={{ fontSize: 10 }}>
                          {place.openStatus}
                        </span>
                        <span className="pill pill-coral" style={{ fontSize: 9 }}>
                          DEMO RECORD
                        </span>
                      </div>
                      <h3 style={{ margin: '4px 0 2px', fontSize: 15, fontWeight: 600 }}>
                        {place.name}
                      </h3>
                      <p className="muted" style={{ fontSize: 11, margin: '0 0 6px' }}>
                        {place.address}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <strong style={{ fontSize: 14, color: 'var(--lime)', display: 'block' }}>
                        {place.distanceKm} km
                      </strong>
                      <span className="muted" style={{ fontSize: 10 }}>approx distance</span>
                    </div>
                  </div>

                  <p style={{ fontSize: 12, margin: '6px 0 12px', lineHeight: 1.4, color: 'var(--soft)' }}>
                    {place.detail}
                  </p>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <a
                      href={`tel:${place.phone}`}
                      className="btn btn-quiet"
                      style={{ fontSize: 11, padding: '4px 10px', textDecoration: 'none' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone size={12} /> Call (Demo: {place.phone})
                    </a>

                    <button
                      type="button"
                      className="btn"
                      style={{ fontSize: 11, padding: '4px 10px' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPlaceId(place.id)
                      }}
                    >
                      <Navigation size={12} /> View on Map
                    </button>
                  </div>
                </article>
              )
            })
          )}
        </div>

        {/* Right Column: Safe Places Map & Directions Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 20 }}>
          <article className="panel panel-pad" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
              <h3 style={{ fontSize: 14, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={15} color="var(--lime)" /> Safe Haven Geographic Plottings
              </h3>
              <span className="muted" style={{ fontSize: 11 }}>
                Plotted reference sanctuary locations in Bangalore central corridor.
              </span>
            </div>

            <div style={{ height: 320, width: '100%', position: 'relative' }}>
              <MapContainer
                center={mapCenter}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
                aria-label="Safe Places Map"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {filteredPlaces.map((p) => {
                  const color = CATEGORY_COLORS[p.category] || '#64e2ba'
                  const isCurrent = selectedPlace?.id === p.id

                  return (
                    <CircleMarker
                      key={p.id}
                      center={p.coords}
                      radius={isCurrent ? 12 : 8}
                      pathOptions={{
                        color: isCurrent ? '#ffffff' : color,
                        fillColor: color,
                        fillOpacity: 0.85,
                        weight: isCurrent ? 3 : 1.5,
                      }}
                      eventHandlers={{
                        click: () => setSelectedPlaceId(p.id),
                      }}
                    >
                      <Popup>
                        <div style={{ color: '#080b10', fontSize: 12, minWidth: 160 }}>
                          <strong>{p.name}</strong>
                          <div style={{ fontSize: 10, color: '#555555', marginTop: 2 }}>{p.category} · {p.distanceKm} km</div>
                          <p style={{ margin: '4px 0', fontSize: 11 }}>{p.address}</p>
                          <a href={`tel:${p.phone}`} style={{ color: '#0066cc', fontWeight: 600 }}>
                            {p.phone}
                          </a>
                        </div>
                      </Popup>
                    </CircleMarker>
                  )
                })}
              </MapContainer>
            </div>
          </article>

          {/* Selected Destination Action Card */}
          {selectedPlace && (
            <article className="panel panel-pad" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className="pill pill-lime" style={{ fontSize: 9 }}>
                  SELECTED SANCTUARY
                </span>
                <span className="muted" style={{ fontSize: 11 }}>
                  {selectedPlace.category}
                </span>
              </div>
              <h4 style={{ margin: '0 0 4px', fontSize: 15 }}>{selectedPlace.name}</h4>
              <p className="muted" style={{ margin: '0 0 12px', fontSize: 11 }}>
                {selectedPlace.address}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 11, marginBottom: 12 }}>
                <div className="panel" style={{ padding: '8px 10px' }}>
                  <span className="muted" style={{ display: 'block', fontSize: 9 }}>ETA / DISTANCE</span>
                  <strong>~{Math.round(selectedPlace.distanceKm * 3)} mins ({selectedPlace.distanceKm} km)</strong>
                </div>
                <div className="panel" style={{ padding: '8px 10px' }}>
                  <span className="muted" style={{ display: 'block', fontSize: 9 }}>OPEN HOURS</span>
                  <strong>{selectedPlace.openStatus}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={`tel:${selectedPlace.phone}`}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}
                >
                  <Phone size={13} /> Call (Demo Contact)
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.coords[0]},${selectedPlace.coords[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}
                >
                  <Navigation size={13} /> Open Navigation
                </a>
              </div>
            </article>
          )}

          {/* Safety Disclaimer Banner */}
          <div className="notice" style={{ margin: 0 }}>
            <Info size={15} />
            <span>
              All nearby safe place listings, contact numbers and GPS coordinates are unverified simulated demo data for testing. Never rely on demo entries during an actual emergency; dial emergency helpline <strong>112</strong> directly.
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default SafePlaces
