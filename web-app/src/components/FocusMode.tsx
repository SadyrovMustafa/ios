import { useState, useEffect } from 'react'
import './FocusMode.css'

interface FocusModeProps {
  isActive: boolean
  onToggle: (active: boolean) => void
}

export default function FocusMode({ isActive, onToggle }: FocusModeProps) {
  useEffect(() => {
    if (isActive) {
      document.body.classList.add('focus-mode')
      // Hide distracting elements
      const sidebar = document.querySelector('.sidebar')
      const stats = document.querySelector('.stats-panel')
      if (sidebar) (sidebar as HTMLElement).style.display = 'none'
      if (stats) (stats as HTMLElement).style.display = 'none'
    } else {
      document.body.classList.remove('focus-mode')
      const sidebar = document.querySelector('.sidebar')
      const stats = document.querySelector('.stats-panel')
      if (sidebar) (sidebar as HTMLElement).style.display = ''
      if (stats) (stats as HTMLElement).style.display = ''
    }

    return () => {
      document.body.classList.remove('focus-mode')
    }
  }, [isActive])

  return (
    <button
      className={`focus-mode-btn ${isActive ? 'active' : ''}`}
      onClick={() => onToggle(!isActive)}
      title={isActive ? 'Выйти из режима фокуса' : 'Войти в режим фокуса'}
    >
      {isActive ? '🔓' : '🔒'} {isActive ? 'Выйти' : 'Фокус'}
    </button>
  )
}

