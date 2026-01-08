import { useEffect, useRef, ReactNode } from 'react'
import './GestureHandler.css'

interface GestureHandlerProps {
  children: ReactNode
  onLongPress?: () => void
  onDoubleTap?: () => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  longPressDelay?: number
  swipeThreshold?: number
  className?: string
}

export default function GestureHandler({
  children,
  onLongPress,
  onDoubleTap,
  onSwipeLeft,
  onSwipeRight,
  longPressDelay = 500,
  swipeThreshold = 50,
  className = ''
}: GestureHandlerProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const longPressTimerRef = useRef<number | null>(null)
  const lastTapRef = useRef<number>(0)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }

      // Start long press timer
      if (onLongPress) {
        longPressTimerRef.current = window.setTimeout(() => {
          onLongPress()
          longPressTimerRef.current = null
        }, longPressDelay)
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }

      if (!touchStartRef.current) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y
      const deltaTime = Date.now() - touchStartRef.current.time

      // Handle swipe gestures
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold && deltaTime < 300) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft()
        }
      }

      // Handle double tap
      if (onDoubleTap && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        const now = Date.now()
        const timeSinceLastTap = now - lastTapRef.current
        if (timeSinceLastTap < 300) {
          onDoubleTap()
          lastTapRef.current = 0
        } else {
          lastTapRef.current = now
        }
      }

      touchStartRef.current = null
    }

    const handleTouchMove = (e: TouchEvent) => {
      // Cancel long press if user moves finger
      if (longPressTimerRef.current && touchStartRef.current) {
        const touch = e.touches[0]
        const deltaX = Math.abs(touch.clientX - touchStartRef.current.x)
        const deltaY = Math.abs(touch.clientY - touchStartRef.current.y)
        
        if (deltaX > 10 || deltaY > 10) {
          clearTimeout(longPressTimerRef.current)
          longPressTimerRef.current = null
        }
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      // For desktop: simulate long press with mouse
      if (onLongPress && e.button === 0) {
        touchStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          time: Date.now()
        }
        longPressTimerRef.current = window.setTimeout(() => {
          onLongPress()
          longPressTimerRef.current = null
        }, longPressDelay)
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }

      if (!touchStartRef.current) return

      const deltaX = e.clientX - touchStartRef.current.x
      const deltaY = e.clientY - touchStartRef.current.y
      const deltaTime = Date.now() - touchStartRef.current.time

      // Handle double click (desktop double tap)
      if (onDoubleTap && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
        const now = Date.now()
        const timeSinceLastTap = now - lastTapRef.current
        if (timeSinceLastTap < 300) {
          onDoubleTap()
          lastTapRef.current = 0
        } else {
          lastTapRef.current = now
        }
      }

      touchStartRef.current = null
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (longPressTimerRef.current && touchStartRef.current) {
        const deltaX = Math.abs(e.clientX - touchStartRef.current.x)
        const deltaY = Math.abs(e.clientY - touchStartRef.current.y)
        
        if (deltaX > 10 || deltaY > 10) {
          clearTimeout(longPressTimerRef.current)
          longPressTimerRef.current = null
        }
      }
    }

    // Touch events
    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })

    // Mouse events (for desktop)
    element.addEventListener('mousedown', handleMouseDown)
    element.addEventListener('mouseup', handleMouseUp)
    element.addEventListener('mousemove', handleMouseMove)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('mousedown', handleMouseDown)
      element.removeEventListener('mouseup', handleMouseUp)
      element.removeEventListener('mousemove', handleMouseMove)
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [onLongPress, onDoubleTap, onSwipeLeft, onSwipeRight, longPressDelay, swipeThreshold])

  return (
    <div ref={elementRef} className={`gesture-handler ${className}`}>
      {children}
    </div>
  )
}

