import './SkeletonLoader.css'

interface SkeletonLoaderProps {
  type?: 'task' | 'list' | 'card' | 'line'
  count?: number
}

export default function SkeletonLoader({ type = 'task', count = 1 }: SkeletonLoaderProps) {
  const items = Array.from({ length: count }, (_, i) => i)

  if (type === 'task') {
    return (
      <>
        {items.map(i => (
          <div key={i} className="skeleton skeleton-task">
            <div className="skeleton-checkbox"></div>
            <div className="skeleton-content">
              <div className="skeleton-line skeleton-title"></div>
              <div className="skeleton-line skeleton-subtitle"></div>
              <div className="skeleton-tags">
                <div className="skeleton-tag"></div>
                <div className="skeleton-tag"></div>
              </div>
            </div>
          </div>
        ))}
      </>
    )
  }

  if (type === 'list') {
    return (
      <>
        {items.map(i => (
          <div key={i} className="skeleton skeleton-list">
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
          </div>
        ))}
      </>
    )
  }

  if (type === 'card') {
    return (
      <>
        {items.map(i => (
          <div key={i} className="skeleton skeleton-card">
            <div className="skeleton-line skeleton-title"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
          </div>
        ))}
      </>
    )
  }

  return (
    <>
      {items.map(i => (
        <div key={i} className="skeleton skeleton-line"></div>
      ))}
    </>
  )
}

