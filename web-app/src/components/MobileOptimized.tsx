// Mobile-specific optimizations and gestures
export const useSwipe = (onSwipeLeft?: () => void, onSwipeRight?: () => void) => {
  let touchStartX = 0
  let touchEndX = 0

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX = e.changedTouches[0].screenX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX = e.changedTouches[0].screenX
    handleSwipe()
  }

  const handleSwipe = () => {
    const swipeDistance = touchEndX - touchStartX
    const minSwipeDistance = 50

    if (swipeDistance > minSwipeDistance && onSwipeRight) {
      onSwipeRight()
    } else if (swipeDistance < -minSwipeDistance && onSwipeLeft) {
      onSwipeLeft()
    }
  }

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd
  }
}

export const vibrate = (pattern: number | number[] = 200) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

