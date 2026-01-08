import { Task } from '../types/Task'
import { LocationService, Location } from './LocationService'
import { PushNotificationService } from './PushNotificationService'
import { toastService } from './ToastService'

export interface SmartReminder {
  id: string
  taskId: string
  type: 'time' | 'location' | 'activity' | 'context'
  conditions: ReminderConditions
  isActive: boolean
  createdAt: Date
  lastTriggered?: Date
}

export interface ReminderConditions {
  // Time-based
  time?: Date
  daysOfWeek?: number[] // 0 = Sunday, 1 = Monday, etc.
  timeRange?: { start: string; end: string } // "09:00" - "17:00"
  
  // Location-based
  location?: Location
  locationRadius?: number // meters
  
  // Activity-based
  afterTaskId?: string // Trigger after another task is completed
  afterTimeSpent?: number // minutes spent on another task
  
  // Context-based
  deviceActivity?: 'idle' | 'active' // Device idle/active state
  appOpen?: boolean // When app is opened
}

export class SmartReminderService {
  private static remindersKey = 'ticktick_smart_reminders'
  private static checkInterval: number | null = null

  static addReminder(taskId: string, conditions: ReminderConditions, type: SmartReminder['type']): SmartReminder {
    const reminders = this.getReminders()
    const newReminder: SmartReminder = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      type,
      conditions,
      isActive: true,
      createdAt: new Date()
    }
    reminders.push(newReminder)
    this.saveReminders(reminders)
    this.startChecking()
    return newReminder
  }

  static removeReminder(reminderId: string): void {
    const reminders = this.getReminders().filter(r => r.id !== reminderId)
    this.saveReminders(reminders)
    if (reminders.length === 0) {
      this.stopChecking()
    }
  }

  static getRemindersForTask(taskId: string): SmartReminder[] {
    return this.getReminders().filter(r => r.taskId === taskId && r.isActive)
  }

  static getAllReminders(): SmartReminder[] {
    return this.getReminders()
  }

  static toggleReminder(reminderId: string): void {
    const reminders = this.getReminders()
    const reminder = reminders.find(r => r.id === reminderId)
    if (reminder) {
      reminder.isActive = !reminder.isActive
      this.saveReminders(reminders)
    }
  }

  private static getReminders(): SmartReminder[] {
    const data = localStorage.getItem(this.remindersKey)
    if (!data) return []
    return JSON.parse(data).map((r: any) => ({
      ...r,
      createdAt: new Date(r.createdAt),
      lastTriggered: r.lastTriggered ? new Date(r.lastTriggered) : undefined,
      conditions: {
        ...r.conditions,
        time: r.conditions.time ? new Date(r.conditions.time) : undefined,
        location: r.conditions.location ? {
          ...r.conditions.location
        } : undefined
      }
    }))
  }

  private static saveReminders(reminders: SmartReminder[]): void {
    localStorage.setItem(this.remindersKey, JSON.stringify(reminders))
  }

  static startChecking(): void {
    if (this.checkInterval !== null) return

    // Check every minute
    this.checkInterval = window.setInterval(() => {
      this.checkReminders()
    }, 60000)

    // Also check immediately
    this.checkReminders()
  }

  static stopChecking(): void {
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  private static async checkReminders(): Promise<void> {
    const reminders = this.getReminders().filter(r => r.isActive)
    const now = new Date()

    for (const reminder of reminders) {
      if (this.shouldTrigger(reminder, now)) {
        await this.triggerReminder(reminder)
      }
    }
  }

  private static shouldTrigger(reminder: SmartReminder, now: Date): boolean {
    const { conditions, type, lastTriggered } = reminder

    // Don't trigger if already triggered in the last 5 minutes
    if (lastTriggered) {
      const timeSinceLastTrigger = now.getTime() - lastTriggered.getTime()
      if (timeSinceLastTrigger < 5 * 60 * 1000) {
        return false
      }
    }

    switch (type) {
      case 'time':
        return this.checkTimeCondition(conditions, now)
      
      case 'location':
        return this.checkLocationCondition(conditions)
      
      case 'activity':
        return this.checkActivityCondition(conditions)
      
      case 'context':
        return this.checkContextCondition(conditions)
      
      default:
        return false
    }
  }

  private static checkTimeCondition(conditions: ReminderConditions, now: Date): boolean {
    if (conditions.time) {
      const reminderTime = new Date(conditions.time)
      const timeDiff = Math.abs(now.getTime() - reminderTime.getTime())
      // Trigger if within 1 minute of the time
      return timeDiff < 60 * 1000
    }

    if (conditions.daysOfWeek && conditions.daysOfWeek.includes(now.getDay())) {
      if (conditions.timeRange) {
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        return currentTime >= conditions.timeRange.start && currentTime <= conditions.timeRange.end
      }
      return true
    }

    return false
  }

  private static async checkLocationCondition(conditions: ReminderConditions): Promise<boolean> {
    if (!conditions.location) return false

    try {
      const currentLocation = await LocationService.getCurrentLocation()
      const distance = LocationService.calculateDistance(currentLocation, conditions.location)
      return distance <= (conditions.locationRadius || 100)
    } catch {
      return false
    }
  }

  private static checkActivityCondition(conditions: ReminderConditions): boolean {
    // Check if task is completed
    if (conditions.afterTaskId) {
      const tasks = JSON.parse(localStorage.getItem('ticktick_tasks') || '[]')
      const task = tasks.find((t: Task) => t.id === conditions.afterTaskId)
      return task?.isCompleted === true
    }

    return false
  }

  private static checkContextCondition(conditions: ReminderConditions): boolean {
    if (conditions.appOpen) {
      // Check if app is currently open (simplified - always true in web app)
      return document.visibilityState === 'visible'
    }

    if (conditions.deviceActivity === 'idle') {
      // Check if device is idle (simplified - would need idle detection API)
      return false
    }

    return false
  }

  private static async triggerReminder(reminder: SmartReminder): Promise<void> {
    const tasks = JSON.parse(localStorage.getItem('ticktick_tasks') || '[]')
    const task = tasks.find((t: Task) => t.id === reminder.taskId)

    if (!task) return

    // Update last triggered time
    const reminders = this.getReminders()
    const index = reminders.findIndex(r => r.id === reminder.id)
    if (index !== -1) {
      reminders[index].lastTriggered = new Date()
      this.saveReminders(reminders)
    }

    // Send notification
    const message = this.getReminderMessage(reminder, task)
    await PushNotificationService.sendNotification(
      `Напоминание: ${task.title}`,
      {
        body: message,
        tag: `smart-reminder-${reminder.id}`,
        requireInteraction: true
      }
    )

    toastService.info(message)
  }

  private static getReminderMessage(reminder: SmartReminder, task: Task): string {
    switch (reminder.type) {
      case 'time':
        return 'Время выполнить задачу!'
      case 'location':
        return 'Вы находитесь рядом с местом для задачи'
      case 'activity':
        return 'Пора выполнить следующую задачу'
      case 'context':
        return 'Напоминание о задаче'
      default:
        return 'Напоминание о задаче'
    }
  }
}

// Start checking on service load
SmartReminderService.startChecking()

