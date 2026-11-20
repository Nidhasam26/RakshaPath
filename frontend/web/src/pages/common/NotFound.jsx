import { Link } from 'react-router-dom'
import { Compass, Home } from 'lucide-react'

export function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '32px 16px',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(45, 226, 176, 0.12)',
          color: 'var(--accent)',
          marginBottom: 18,
        }}
      >
        <Compass size={32} />
      </div>
      <span className="pill pill-accent" style={{ marginBottom: 12 }}>
        404 · PAGE NOT FOUND
      </span>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.03em' }}>
        Off the map
      </h1>
      <p className="muted" style={{ maxWidth: 420, margin: '0 0 24px', fontSize: 13, lineHeight: 1.6 }}>
        The page you are looking for does not exist, has been moved, or is not part of this demo workspace.
      </p>
      <Link to="/dashboard" className="btn btn-primary" style={{ display: 'inline-flex', gap: 8 }}>
        <Home size={15} /> Return to Dashboard
      </Link>
    </div>
  )
}

export default NotFound
