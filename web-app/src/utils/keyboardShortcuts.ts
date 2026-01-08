export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
}

export class KeyboardShortcuts {
  private static shortcuts: KeyboardShortcut[] = []
  private static isInitialized = false

  static register(shortcut: KeyboardShortcut): () => void {
    this.shortcuts.push(shortcut)
    if (!this.isInitialized) {
      this.initialize()
    }
    return () => {
      this.shortcuts = this.shortcuts.filter(s => s !== shortcut)
    }
  }

  private static initialize() {
    if (this.isInitialized) return
    this.isInitialized = true

    document.addEventListener('keydown', (e) => {
      const matching = this.shortcuts.find(s => {
        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase()
        const ctrlMatch = !!s.ctrl === (e.ctrlKey || e.metaKey)
        const shiftMatch = !!s.shift === e.shiftKey
        const altMatch = !!s.alt === e.altKey
        return keyMatch && ctrlMatch && shiftMatch && altMatch
      })

      if (matching) {
        e.preventDefault()
        matching.action()
      }
    })
  }

  static getShortcuts(): KeyboardShortcut[] {
    return this.shortcuts
  }
}

// Common shortcuts
export const CommonShortcuts = {
  NEW_TASK: { key: 'n', ctrl: true, description: 'New Task' },
  SEARCH: { key: 'f', ctrl: true, description: 'Search' },
  TODAY: { key: 't', ctrl: true, description: 'Go to Today' },
  ALL_TASKS: { key: 'a', ctrl: true, description: 'All Tasks' },
  CALENDAR: { key: 'c', ctrl: true, description: 'Calendar' },
  ANALYTICS: { key: 'g', ctrl: true, description: 'Analytics' },
  ESCAPE: { key: 'Escape', description: 'Close Modal' }
}

