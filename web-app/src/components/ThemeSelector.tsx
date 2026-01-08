import { useState, useEffect } from 'react'
import { ThemeService, Theme } from '../services/ThemeService'
import './ThemeSelector.css'

interface ThemeSelectorProps {
  onClose: () => void
}

export default function ThemeSelector({ onClose }: ThemeSelectorProps) {
  const [themes, setThemes] = useState<Theme[]>([])
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null)

  useEffect(() => {
    const loadedThemes = ThemeService.getAllThemes()
    setThemes(loadedThemes)
    const currentThemeId = ThemeService.getCurrentTheme()
    const current = loadedThemes.find(t => t.id === currentThemeId)
    setCurrentTheme(current || null)
  }, [])

  const handleThemeSelect = (theme: Theme) => {
    ThemeService.setCurrentTheme(theme.id)
    setCurrentTheme(theme)
  }

  return (
    <div className="theme-selector-overlay" onClick={onClose}>
      <div className="theme-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="theme-selector-header">
          <h2>Select Theme</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="theme-selector-content">
          <div className="themes-grid">
            {themes.map(theme => (
              <div
                key={theme.id}
                className={`theme-card ${currentTheme?.id === theme.id ? 'active' : ''}`}
                onClick={() => handleThemeSelect(theme)}
              >
                <div className="theme-preview">
                  <div 
                    className="theme-preview-primary"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <div 
                    className="theme-preview-secondary"
                    style={{ backgroundColor: theme.colors.secondary }}
                  />
                  <div 
                    className="theme-preview-success"
                    style={{ backgroundColor: theme.colors.success }}
                  />
                  <div 
                    className="theme-preview-danger"
                    style={{ backgroundColor: theme.colors.danger }}
                  />
                </div>
                <div className="theme-name">{theme.name}</div>
                {currentTheme?.id === theme.id && (
                  <div className="theme-check">✓</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

