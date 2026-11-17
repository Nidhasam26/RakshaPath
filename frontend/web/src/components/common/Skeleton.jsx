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
      {/* Header skeleton */}
      <div style={{ display: 'grid', gap: 8 }}>
        <Skeleton width="180px" height={14} />
        <Skeleton width="320px" height={28} />
        <Skeleton width="480px" height={16} />
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

export default Skeleton
