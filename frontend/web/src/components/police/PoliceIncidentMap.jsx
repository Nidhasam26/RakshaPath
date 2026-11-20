import { useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { Siren } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { tokens } from '../../theme/tokens'

const SEVERITY_COLORS = {
  Critical: tokens.danger,
  High: tokens.orange,
  Medium: tokens.amber,
  Low: tokens.info,
}

const DEFAULT_CENTER = [12.955, 77.63] // Central Bangalore corridor

function getIncidentCoords(item) {
  if (Array.isArray(item.coords) && item.coords.length === 2 && !isNaN(item.coords[0])) {
    return item.coords
  }
  const loc = (item.location || '').toLowerCase()
  if (loc.includes('koramangala')) return [12.9345, 77.6245]
  if (loc.includes('indiranagar')) return [12.9719, 77.6412]
  if (loc.includes('mg road')) return [12.9754, 77.6067]
  if (loc.includes('silk board')) return [12.9175, 77.6231]
  if (loc.includes('whitefield')) return [12.9863, 77.7342]
  return [12.945 + (item.id?.charCodeAt(item.id.length - 1) % 10) * 0.005, 77.62 + (item.id?.charCodeAt(item.id.length - 2) % 10) * 0.005]
}

export function PoliceIncidentMap({ incidents = [], selectedIncidentId, onSelectIncident, height = '360px' }) {
  const mappedIncidents = useMemo(() => {
    return incidents.map((item) => ({
      ...item,
      resolvedCoords: getIncidentCoords(item),
      resolvedSeverity: item.severity || (item.category === 'Hazard Report' ? 'Medium' : 'Critical'),
    }))
  }, [incidents])

  return (
    <div
      className="police-incident-map-frame"
      role="region"
      aria-label="Police incident map"
      style={{ position: 'relative', minHeight: height, borderRadius: 10, overflow: 'hidden' }}
    >
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        scrollWheelZoom={false}
        aria-label="Police incident map"
        style={{ height: '100%', minHeight: height, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mappedIncidents.map((incident) => {
          const color = SEVERITY_COLORS[incident.resolvedSeverity] || '#ff4d4d'
          const isSelected = incident.id === selectedIncidentId

          return (
            <CircleMarker
              key={incident.id}
              center={incident.resolvedCoords}
              radius={isSelected ? 11 : 8}
              pathOptions={{
                color: isSelected ? '#ffffff' : color,
                fillColor: color,
                fillOpacity: 0.9,
                weight: isSelected ? 3 : 2,
              }}
              eventHandlers={{
                click: () => onSelectIncident && onSelectIncident(incident),
              }}
            >
              <Popup>
                <div style={{ minWidth: 180, maxWidth: 240, padding: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
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
                      {incident.resolvedSeverity}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>{incident.status}</span>
                  </div>

                  <strong style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                    <Siren size={13} color={color} />
                    {incident.id}
                  </strong>
                  <div style={{ fontSize: 11, margin: '2px 0 4px', fontWeight: 600 }}>{incident.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{incident.location}</div>
                  <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 4 }}>Time: {incident.time}</div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>

      {/* Demo Badge */}
      <span
        className="badge-demo"
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 500,
        }}
      >
        SIMULATED INCIDENT MAP
      </span>
    </div>
  )
}

export default PoliceIncidentMap
