export interface Location {
  latitude: number
  longitude: number
  address?: string
  name?: string
}

export interface LocationReminder {
  id: string
  taskId: string
  location: Location
  radius: number // в метрах
  isActive: boolean
  createdAt: Date
}

export class LocationService {
  private static remindersKey = 'ticktick_location_reminders'
  private static watchId: number | null = null
  private static callbacks: Array<(location: Location) => void> = []

  static async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Геолокация не поддерживается'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          reject(new Error(`Ошибка геолокации: ${error.message}`))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }

  static async getAddress(location: Location): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`
      )
      const data = await response.json()
      return data.display_name || `${location.latitude}, ${location.longitude}`
    } catch (error) {
      return `${location.latitude}, ${location.longitude}`
    }
  }

  static calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371e3 // радиус Земли в метрах
    const φ1 = loc1.latitude * Math.PI / 180
    const φ2 = loc2.latitude * Math.PI / 180
    const Δφ = (loc2.latitude - loc1.latitude) * Math.PI / 180
    const Δλ = (loc2.longitude - loc1.longitude) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // расстояние в метрах
  }

  static addLocationReminder(reminder: Omit<LocationReminder, 'id' | 'createdAt'>): LocationReminder {
    const reminders = this.getReminders()
    const newReminder: LocationReminder = {
      ...reminder,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    }
    reminders.push(newReminder)
    this.saveReminders(reminders)
    this.startWatching()
    return newReminder
  }

  static removeLocationReminder(reminderId: string): void {
    const reminders = this.getReminders().filter(r => r.id !== reminderId)
    this.saveReminders(reminders)
    if (reminders.length === 0) {
      this.stopWatching()
    }
  }

  static getReminders(): LocationReminder[] {
    const data = localStorage.getItem(this.remindersKey)
    if (!data) return []
    return JSON.parse(data).map((r: any) => ({
      ...r,
      createdAt: new Date(r.createdAt)
    }))
  }

  static getRemindersForTask(taskId: string): LocationReminder[] {
    return this.getReminders().filter(r => r.taskId === taskId && r.isActive)
  }

  static startWatching(): void {
    if (this.watchId !== null || !navigator.geolocation) return

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const currentLocation: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }

        const reminders = this.getReminders().filter(r => r.isActive)
        reminders.forEach(reminder => {
          const distance = this.calculateDistance(currentLocation, reminder.location)
          if (distance <= reminder.radius) {
            // Триггер напоминания
            this.triggerReminder(reminder)
          }
        })

        this.callbacks.forEach(callback => callback(currentLocation))
      },
      (error) => {
        console.error('Location watch error:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 минута
      }
    )
  }

  static stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
  }

  static onLocationChange(callback: (location: Location) => void): () => void {
    this.callbacks.push(callback)
    if (this.watchId === null) {
      this.startWatching()
    }
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback)
    }
  }

  private static triggerReminder(reminder: LocationReminder): void {
    // Отправить уведомление
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Напоминание по местоположению', {
        body: `Вы находитесь рядом с местом для задачи`,
        icon: '/vite.svg',
        tag: `location-${reminder.id}`
      })
    }

    // Деактивировать напоминание после срабатывания
    const reminders = this.getReminders()
    const index = reminders.findIndex(r => r.id === reminder.id)
    if (index !== -1) {
      reminders[index].isActive = false
      this.saveReminders(reminders)
    }
  }

  private static saveReminders(reminders: LocationReminder[]): void {
    localStorage.setItem(this.remindersKey, JSON.stringify(reminders))
  }
}

