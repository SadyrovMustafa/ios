import { useState, useEffect } from 'react'
import { ThemeService } from '../services/ThemeService'
import ThemeSelector from './ThemeSelector'
import './ThemeToggle.css'

export default function ThemeToggle() {
  const [showSelector, setShowSelector] = useState(false)

  useEffect(() => {
    ThemeService.initializeTheme()
  }, [])

  return (
    <>
      <button
        className="theme-toggle"
        onClick={() => setShowSelector(true)}
        aria-label="Select theme"
        title="Select theme"
      >
        🎨
      </button>
      {showSelector && (
        <ThemeSelector onClose={() => setShowSelector(false)} />
      )}
    </>
  )
}

