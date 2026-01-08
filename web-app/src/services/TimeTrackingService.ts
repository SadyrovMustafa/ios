import { Task } from '../types/Task'

export interface TimeEntry {
  id: string
  taskId: string
  startTime: Date
  endTime?: Date
  duration?: number // in minutes
  notes?: string
}

export class TimeTrackingService {
  private static entriesKey = 'ticktick_time_entries'

  static getEntries(): TimeEntry[] {
    const data = localStorage.getItem(this.entriesKey)
    if (!data) return []
    return JSON.parse(data).map((e: any) => ({
      ...e,
      startTime: new Date(e.startTime),
      endTime: e.endTime ? new Date(e.endTime) : undefined
    }))
  }

  static startTracking(taskId: string): TimeEntry {
    const entries = this.getEntries()
    // Stop any currently running entries
    entries.forEach(entry => {
      if (!entry.endTime) {
        entry.endTime = new Date()
        entry.duration = Math.floor((entry.endTime.getTime() - entry.startTime.getTime()) / 1000 / 60)
      }
    })

    const newEntry: TimeEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      startTime: new Date()
    }
    entries.push(newEntry)
    this.saveEntries(entries)
    return newEntry
  }

  static stopTracking(taskId: string): void {
    const entries = this.getEntries()
    const activeEntry = entries.find(e => e.taskId === taskId && !e.endTime)
    if (activeEntry) {
      activeEntry.endTime = new Date()
      activeEntry.duration = Math.floor((activeEntry.endTime.getTime() - activeEntry.startTime.getTime()) / 1000 / 60)
      this.saveEntries(entries)
    }
  }

  static getTaskTime(taskId: string): number {
    const entries = this.getEntries()
    return entries
      .filter(e => e.taskId === taskId && e.duration)
      .reduce((total, e) => total + (e.duration || 0), 0)
  }

  static getTimeByHour(hour: number): number {
    const entries = this.getEntries()
    return entries
      .filter(e => {
        const startHour = new Date(e.startTime).getHours()
        return startHour === hour && e.duration
      })
      .reduce((total, e) => total + (e.duration || 0), 0)
  }

  static getProductivityByHour(): Array<{ hour: number; minutes: number }> {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    return hours.map(hour => ({
      hour,
      minutes: this.getTimeByHour(hour)
    }))
  }

  private static saveEntries(entries: TimeEntry[]): void {
    localStorage.setItem(this.entriesKey, JSON.stringify(entries))
  }
}

