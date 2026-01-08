import { Task } from '../types/Task'

export interface TaskHistoryEntry {
  id: string
  taskId: string
  timestamp: Date
  action: 'created' | 'updated' | 'completed' | 'uncompleted' | 'deleted' | 'archived' | 'restored'
  field?: string // Какое поле изменилось
  oldValue?: any
  newValue?: any
  changes?: Partial<Task> // Полные изменения
  userId?: string
}

export class TaskHistoryService {
  private static historyKey = 'ticktick_task_history'
  private static maxHistoryPerTask = 100

  static addEntry(entry: Omit<TaskHistoryEntry, 'id' | 'timestamp'>): void {
    const history = this.getHistory()
    const newEntry: TaskHistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }

    history.push(newEntry)

    // Ограничиваем историю для каждой задачи
    const taskHistory = history.filter(h => h.taskId === entry.taskId)
    if (taskHistory.length > this.maxHistoryPerTask) {
      const toRemove = taskHistory.slice(0, taskHistory.length - this.maxHistoryPerTask)
      toRemove.forEach(entry => {
        const index = history.findIndex(h => h.id === entry.id)
        if (index !== -1) history.splice(index, 1)
      })
    }

    this.saveHistory(history)
  }

  static getHistoryForTask(taskId: string): TaskHistoryEntry[] {
    return this.getHistory()
      .filter(entry => entry.taskId === taskId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  static getAllHistory(): TaskHistoryEntry[] {
    return this.getHistory().sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  static getHistoryByAction(action: TaskHistoryEntry['action']): TaskHistoryEntry[] {
    return this.getHistory()
      .filter(entry => entry.action === action)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  static getHistoryByDateRange(startDate: Date, endDate: Date): TaskHistoryEntry[] {
    return this.getHistory()
      .filter(entry => {
        const timestamp = entry.timestamp.getTime()
        return timestamp >= startDate.getTime() && timestamp <= endDate.getTime()
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  static clearHistoryForTask(taskId: string): void {
    const history = this.getHistory().filter(entry => entry.taskId !== taskId)
    this.saveHistory(history)
  }

  static clearAllHistory(): void {
    this.saveHistory([])
  }

  static getHistoryStats(taskId: string): {
    totalChanges: number
    lastChanged: Date | null
    mostChangedField: string | null
  } {
    const taskHistory = this.getHistoryForTask(taskId)
    
    if (taskHistory.length === 0) {
      return {
        totalChanges: 0,
        lastChanged: null,
        mostChangedField: null
      }
    }

    const fieldCounts: Record<string, number> = {}
    taskHistory.forEach(entry => {
      if (entry.field) {
        fieldCounts[entry.field] = (fieldCounts[entry.field] || 0) + 1
      }
    })

    const mostChangedField = Object.entries(fieldCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || null

    return {
      totalChanges: taskHistory.length,
      lastChanged: taskHistory[0]?.timestamp || null,
      mostChangedField
    }
  }

  private static getHistory(): TaskHistoryEntry[] {
    const data = localStorage.getItem(this.historyKey)
    if (!data) return []
    return JSON.parse(data).map((entry: any) => ({
      ...entry,
      timestamp: new Date(entry.timestamp)
    }))
  }

  private static saveHistory(history: TaskHistoryEntry[]): void {
    localStorage.setItem(this.historyKey, JSON.stringify(history))
  }
}

