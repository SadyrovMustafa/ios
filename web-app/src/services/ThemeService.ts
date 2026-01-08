export interface Theme {
  id: string
  name: string
  colors: {
    primary: string
    secondary: string
    success: string
    danger: string
    warning: string
    background: string
    surface: string
    textPrimary: string
    textSecondary: string
    borderColor: string
  }
}

export class ThemeService {
  private static themesKey = 'ticktick_themes'
  private static currentThemeKey = 'ticktick_current_theme'

  static getDefaultThemes(): Theme[] {
    return [
      {
        id: 'light',
        name: 'Светлая',
        colors: {
          primary: '#007AFF',
          secondary: '#5856D6',
          success: '#34C759',
          danger: '#FF3B30',
          warning: '#FF9500',
          background: '#F2F2F7',
          surface: '#FFFFFF',
          textPrimary: '#000000',
          textSecondary: '#8E8E93',
          borderColor: '#C6C6C8'
        }
      },
      {
        id: 'dark',
        name: 'Темная',
        colors: {
          primary: '#0A84FF',
          secondary: '#5E5CE6',
          success: '#30D158',
          danger: '#FF453A',
          warning: '#FF9F0A',
          background: '#000000',
          surface: '#1C1C1E',
          textPrimary: '#FFFFFF',
          textSecondary: '#8E8E93',
          borderColor: '#38383A'
        }
      },
      {
        id: 'blue',
        name: 'Синяя',
        colors: {
          primary: '#007AFF',
          secondary: '#5AC8FA',
          success: '#34C759',
          danger: '#FF3B30',
          warning: '#FF9500',
          background: '#E3F2FD',
          surface: '#FFFFFF',
          textPrimary: '#1565C0',
          textSecondary: '#64B5F6',
          borderColor: '#90CAF9'
        }
      },
      {
        id: 'green',
        name: 'Зеленая',
        colors: {
          primary: '#34C759',
          secondary: '#30D158',
          success: '#34C759',
          danger: '#FF3B30',
          warning: '#FF9500',
          background: '#E8F5E9',
          surface: '#FFFFFF',
          textPrimary: '#2E7D32',
          textSecondary: '#66BB6A',
          borderColor: '#81C784'
        }
      },
      {
        id: 'purple',
        name: 'Фиолетовая',
        colors: {
          primary: '#5856D6',
          secondary: '#AF52DE',
          success: '#34C759',
          danger: '#FF3B30',
          warning: '#FF9500',
          background: '#F3E5F5',
          surface: '#FFFFFF',
          textPrimary: '#6A1B9A',
          textSecondary: '#BA68C8',
          borderColor: '#CE93D8'
        }
      },
      {
        id: 'orange',
        name: 'Оранжевая',
        colors: {
          primary: '#FF9500',
          secondary: '#FFCC00',
          success: '#34C759',
          danger: '#FF3B30',
          warning: '#FF9500',
          background: '#FFF3E0',
          surface: '#FFFFFF',
          textPrimary: '#E65100',
          textSecondary: '#FFB74D',
          borderColor: '#FFCC80'
        }
      },
      {
        id: 'pink',
        name: 'Розовая',
        colors: {
          primary: '#FF2D55',
          secondary: '#FF6B9D',
          success: '#34C759',
          danger: '#FF3B30',
          warning: '#FF9500',
          background: '#FCE4EC',
          surface: '#FFFFFF',
          textPrimary: '#C2185B',
          textSecondary: '#F48FB1',
          borderColor: '#F8BBD0'
        }
      },
      {
        id: 'midnight',
        name: 'Полночь',
        colors: {
          primary: '#5E5CE6',
          secondary: '#64D2FF',
          success: '#30D158',
          danger: '#FF453A',
          warning: '#FF9F0A',
          background: '#0A0A0A',
          surface: '#1C1C1E',
          textPrimary: '#FFFFFF',
          textSecondary: '#8E8E93',
          borderColor: '#2C2C2E'
        }
      }
    ]
  }

  static getAllThemes(): Theme[] {
    const defaultThemes = this.getDefaultThemes()
    const customThemes = this.getCustomThemes()
    return [...defaultThemes, ...customThemes]
  }

  static getCustomThemes(): Theme[] {
    const data = localStorage.getItem(this.themesKey)
    if (!data) return []
    return JSON.parse(data)
  }

  static addCustomTheme(theme: Theme): void {
    const themes = this.getCustomThemes()
    themes.push(theme)
    localStorage.setItem(this.themesKey, JSON.stringify(themes))
  }

  static deleteCustomTheme(themeId: string): void {
    const themes = this.getCustomThemes().filter(t => t.id !== themeId)
    localStorage.setItem(this.themesKey, JSON.stringify(themes))
  }

  static getCurrentTheme(): string {
    return localStorage.getItem(this.currentThemeKey) || 'light'
  }

  static setCurrentTheme(themeId: string): void {
    localStorage.setItem(this.currentThemeKey, themeId)
    this.applyTheme(themeId)
  }

  static applyTheme(themeId: string): void {
    const themes = this.getAllThemes()
    const theme = themes.find(t => t.id === themeId) || themes[0]

    const root = document.documentElement
    root.style.setProperty('--primary-color', theme.colors.primary)
    root.style.setProperty('--secondary-color', theme.colors.secondary)
    root.style.setProperty('--success-color', theme.colors.success)
    root.style.setProperty('--danger-color', theme.colors.danger)
    root.style.setProperty('--warning-color', theme.colors.warning)
    root.style.setProperty('--background', theme.colors.background)
    root.style.setProperty('--surface', theme.colors.surface)
    root.style.setProperty('--text-primary', theme.colors.textPrimary)
    root.style.setProperty('--text-secondary', theme.colors.textSecondary)
    root.style.setProperty('--border-color', theme.colors.borderColor)
  }

  static initializeTheme(): void {
    const currentTheme = this.getCurrentTheme()
    this.applyTheme(currentTheme)
  }
}
