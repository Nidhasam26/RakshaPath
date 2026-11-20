export function Skeleton({ width = '100%', height = 20, borderRadius = 6, style = {} }) {
  return (
    <div
      className="skeleton-pulse"
      style={{
        width,
        height,
        borderRadius,
        background: 'rgba(255, 255, 255, 0.08)',
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
        ...style,
      }}
      aria-hidden="true"
    />
  )
}

export function PageSkeleton() {
  return (
    <div style={{ padding: 24, display: 'grid', gap: 20 }}>
      {/* Header skeleton with shield watermark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <img
          src="/brand/rakshapath-shield.png"
          alt=""
          aria-hidden="true"
          style={{ width: 28, height: 24, objectFit: 'contain', opacity: 0.55 }}
        />
        <div style={{ display: 'grid', gap: 6, flex: 1 }}>
          <Skeleton width="180px" height={14} />
          <Skeleton width="320px" height={24} />
        </div>
      </div>

      {/* Grid content skeleton */}
      <div className="grid two" style={{ gap: 16 }}>
        <div className="panel panel-pad" style={{ minHeight: 320, display: 'grid', gap: 14 }}>
          <Skeleton width="60%" height={20} />
          <Skeleton width="100%" height={220} borderRadius={10} />
        </div>
        <div className="panel panel-pad" style={{ minHeight: 320, display: 'grid', gap: 14 }}>
          <Skeleton width="50%" height={20} />
          <Skeleton width="100%" height={60} borderRadius={8} />
          <Skeleton width="100%" height={60} borderRadius={8} />
          <Skeleton width="100%" height={60} borderRadius={8} />
        </div>
      </div>
    </div>
  )
}

export function AppLoadingScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg, #080b10)',
        gap: 16,
      }}
      role="status"
      aria-label="Loading RakshaPath"
    >
      <img
        src="/brand/rakshapath-shield.png"
        alt="Loading RakshaPath"
        style={{
          width: 56,
          height: 48,
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 16px rgba(249, 102, 8, 0.35))',
          animation: 'skeleton-pulse 1.8s ease-in-out infinite',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 16, fontWeight: 750, color: '#ffffff', letterSpacing: '-0.02em' }}>
          Raksha<span style={{ color: 'var(--orange, #f96608)' }}>Path</span>
        </span>
      </div>
    </div>
  )
}

export default Skeleton
