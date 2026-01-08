export interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number
  resistance?: number
}

export function usePullToRefresh(
  element: HTMLElement | null,
  options: PullToRefreshOptions
): (() => void) | undefined {
  if (!element) return

  const { onRefresh, threshold = 80, resistance = 2.5 } = options

  let startY = 0
  let currentY = 0
  let isPulling = false
  let isRefreshing = false

  const handleTouchStart = (e: TouchEvent) => {
    if (isRefreshing) return
    if (element.scrollTop > 0) return

    startY = e.touches[0].clientY
    isPulling = true
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling || isRefreshing) return

    currentY = e.touches[0].clientY
    const deltaY = currentY - startY

    if (deltaY > 0 && element.scrollTop === 0) {
      e.preventDefault()
      const pullDistance = Math.min(deltaY / resistance, threshold * 1.5)
      element.style.transform = `translateY(${pullDistance}px)`
      element.style.transition = 'none'
    }
  }

  const handleTouchEnd = async () => {
    if (!isPulling) return

    const deltaY = currentY - startY
    const pullDistance = deltaY / resistance

    if (pullDistance >= threshold && !isRefreshing) {
      isRefreshing = true
      element.style.transform = `translateY(${threshold}px)`
      element.style.transition = 'transform 0.3s ease-out'

      try {
        await onRefresh()
      } finally {
        setTimeout(() => {
          element.style.transform = 'translateY(0)'
          element.style.transition = 'transform 0.3s ease-out'
          setTimeout(() => {
            isRefreshing = false
            isPulling = false
            startY = 0
            currentY = 0
          }, 300)
        }, 500)
      }
    } else {
      element.style.transform = 'translateY(0)'
      element.style.transition = 'transform 0.3s ease-out'
      isPulling = false
      startY = 0
      currentY = 0
    }
  }

  element.addEventListener('touchstart', handleTouchStart, { passive: false })
  element.addEventListener('touchmove', handleTouchMove, { passive: false })
  element.addEventListener('touchend', handleTouchEnd)

  return () => {
    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchmove', handleTouchMove)
    element.removeEventListener('touchend', handleTouchEnd)
  }
}

