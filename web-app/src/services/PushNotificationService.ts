export class PushNotificationService {
  private static registration: ServiceWorkerRegistration | null = null

  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications')
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission
    }

    return 'denied'
  }

  static async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.ready
        return this.registration
      } catch (error) {
        console.error('Service Worker registration failed:', error)
        throw error
      }
    }
    throw new Error('Service Workers are not supported')
  }

  static async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.registerServiceWorker()
    }

    if (!this.registration) {
      return null
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'YOUR_VAPID_PUBLIC_KEY' // Замените на ваш VAPID ключ
        )
      })
      return subscription
    } catch (error) {
      console.error('Push subscription failed:', error)
      return null
    }
  }

  static async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    const permission = await this.requestPermission()
    
    if (permission !== 'granted') {
      console.warn('Notification permission not granted')
      return
    }

    if (this.registration) {
      await this.registration.showNotification(title, {
        icon: '/vite.svg',
        badge: '/vite.svg',
        ...options
      })
    } else {
      new Notification(title, {
        icon: '/vite.svg',
        ...options
      })
    }
  }

  static async sendTaskNotification(taskTitle: string, type: 'created' | 'completed' | 'overdue' = 'created'): Promise<void> {
    const messages = {
      created: `Новая задача: ${taskTitle}`,
      completed: `Задача выполнена: ${taskTitle}`,
      overdue: `Просроченная задача: ${taskTitle}`
    }

    await this.sendNotification(messages[type], {
      body: type === 'overdue' ? 'Не забудьте выполнить!' : '',
      tag: `task-${type}`,
      requireInteraction: type === 'overdue'
    })
  }

  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }
}

