import { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const SEVERITY_COLORS = {
  Critical: '#ff4d4d',
  High: '#ff8c42',
  Medium: '#ffc66d',
  Low: '#4facfe',
}

const STATUS_COLORS = {
  New: '#ff6b6b',
  Acknowledged: '#ffc66d',
  'In Progress': '#4facfe',
  Resolved: '#64e2ba',
}

export function PoliceAnalyticsCharts({ incidents = [] }) {
  // Aggregate incidents by status
  const statusData = useMemo(() => {
    const counts = { New: 0, Acknowledged: 0, 'In Progress': 0, Resolved: 0 }
    incidents.forEach((item) => {
      const s = item.status || 'New'
      counts[s] = (counts[s] || 0) + 1
    })
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      color: STATUS_COLORS[name] || '#c6f36a',
    }))
  }, [incidents])

  // Aggregate incidents by severity (with fallback for legacy records)
  const severityData = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 }
    incidents.forEach((item) => {
      const s = item.severity || (item.category === 'Hazard Report' ? 'Medium' : 'Critical')
      counts[s] = (counts[s] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: SEVERITY_COLORS[name] || '#ff4d4d',
    }))
  }, [incidents])

  const totalIncidents = incidents.length

  return (
    <div
      className="police-analytics-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
        marginBottom: 16,
      }}
    >
      {/* Incidents by Status Bar Chart */}
      <article className="panel panel-pad" style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h4 style={{ fontSize: 14, margin: 0 }}>Incidents by Status</h4>
          <span className="pill pill-quiet" style={{ fontSize: 9 }}>
            TOTAL: {totalIncidents}
          </span>
        </div>

        <div style={{ width: '100%', height: 160 }}>
          <ResponsiveContainer width="100%" height={160} minWidth={100} minHeight={160}>
            <BarChart data={statusData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} />
              <YAxis stroke="#888888" fontSize={10} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#161b22',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  fontSize: 11,
                  color: '#ffffff',
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {statusData.map((entry, index) => (
                  <Cell key={`bar-cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      {/* Incidents by Severity Distribution Chart */}
      <article className="panel panel-pad" style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h4 style={{ fontSize: 14, margin: 0 }}>Severity Distribution</h4>
          <span className="pill pill-quiet" style={{ fontSize: 9 }}>
            DEMO ANALYTICS
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 12, height: 160 }}>
          <div style={{ width: 140, height: 160 }}>
            <ResponsiveContainer width="100%" height={160} minWidth={100} minHeight={160}>
              <PieChart>
                <Pie
                  data={severityData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={3}
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161b22',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    fontSize: 11,
                    color: '#ffffff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Severity Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 100 }}>
            {severityData.map((item) => {
              const pct = totalIncidents > 0 ? Math.round((item.value / totalIncidents) * 100) : 0
              return (
                <div
                  key={item.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    fontSize: 11,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: item.color,
                      }}
                    />
                    {item.name}
                  </span>
                  <strong style={{ fontSize: 10, color: 'var(--text-color, #e6edf3)' }}>
                    {item.value} ({pct}%)
                  </strong>
                </div>
              )
            })}
          </div>
        </div>
      </article>
    </div>
  )
}

export default PoliceAnalyticsCharts
