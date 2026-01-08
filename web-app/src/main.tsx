import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/animations.css'
import { registerServiceWorker } from './utils/registerServiceWorker'
import { ThemeService } from './services/ThemeService'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register Service Worker for offline support (only in browser, not in native app)
// Check if Capacitor is available
let isNative = false
try {
  const { Capacitor } = require('@capacitor/core')
  isNative = Capacitor.isNativePlatform()
} catch {
  // Capacitor not installed yet
}

if (!isNative) {
  registerServiceWorker()
}

// Initialize theme
ThemeService.initializeTheme()

// Initialize Capacitor plugins on native platforms
if (isNative) {
  try {
    import('@capacitor/splash-screen').then(({ SplashScreen }) => {
      SplashScreen.hide()
    }).catch(() => {
      // Plugin not available
    })
  } catch {
    // Capacitor not installed
  }
}

// Setup API interceptor for development
if (import.meta.env.DEV) {
  import('./utils/apiEndpointHandler').then(({ setupAPIInterceptor }) => {
    setupAPIInterceptor()
  }).catch(() => {
    // API interceptor not available
  })
}
