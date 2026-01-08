import { Task } from '../types/Task'
import { TimeEstimateService } from './TimeEstimateService'

export interface WorkloadEntry {
  userId: string
  date: Date
  estimatedHours: number
  actualHours: number
  taskIds: string[]
}

export interface WorkloadSummary {
  userId: string
  weekStart: Date
  weekEnd: Date
  totalEstimatedHours: number
  totalActualHours: number
  taskCount: number
  overloaded: boolean
}

export class WorkloadService {
  static calculateUserWorkload(
    userId: string,
    tasks: Task[],
    startDate: Date,
    endDate: Date
  ): WorkloadEntry[] {
    const entries: WorkloadEntry[] = []
    const userTasks = tasks.filter(t => {
      // Assuming tasks have assigneeId - need to check Task type
      const assigneeId = (t as any).assigneeId
      return assigneeId === userId && t.dueDate
    })

    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dayTasks = userTasks.filter(t => {
        if (!t.dueDate) return false
        const taskDate = new Date(t.dueDate)
        return taskDate.toDateString() === currentDate.toDateString()
      })

      const estimatedHours = dayTasks.reduce((sum, task) => {
        const estimate = TimeEstimateService.getEstimate(task.id)
        return sum + (estimate?.hours || 0)
      }, 0)

      const actualHours = dayTasks.reduce((sum, task) => {
        // Get actual time from time tracking if available
        return sum + 0 // Placeholder
      }, 0)

      entries.push({
        userId,
        date: new Date(currentDate),
        estimatedHours,
        actualHours,
        taskIds: dayTasks.map(t => t.id)
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return entries
  }

  static getWeeklyWorkload(
    userId: string,
    tasks: Task[],
    weekStart: Date
  ): WorkloadSummary {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const entries = this.calculateUserWorkload(userId, tasks, weekStart, weekEnd)
    
    const totalEstimatedHours = entries.reduce((sum, e) => sum + e.estimatedHours, 0)
    const totalActualHours = entries.reduce((sum, e) => sum + e.actualHours, 0)
    const taskCount = new Set(entries.flatMap(e => e.taskIds)).size

    // Consider overloaded if more than 40 hours per week
    const overloaded = totalEstimatedHours > 40

    return {
      userId,
      weekStart: new Date(weekStart),
      weekEnd,
      totalEstimatedHours,
      totalActualHours,
      taskCount,
      overloaded
    }
  }

  static getTeamWorkload(
    userIds: string[],
    tasks: Task[],
    weekStart: Date
  ): WorkloadSummary[] {
    return userIds.map(userId => this.getWeeklyWorkload(userId, tasks, weekStart))
  }

  static getOverloadedUsers(
    userIds: string[],
    tasks: Task[],
    weekStart: Date
  ): string[] {
    const summaries = this.getTeamWorkload(userIds, tasks, weekStart)
    return summaries
      .filter(s => s.overloaded)
      .map(s => s.userId)
  }

  static getWorkloadCalendar(
    userId: string,
    tasks: Task[],
    monthStart: Date
  ): Map<string, number> {
    const monthEnd = new Date(monthStart)
    monthEnd.setMonth(monthEnd.getMonth() + 1)
    monthEnd.setDate(monthEnd.getDate() - 1)

    const entries = this.calculateUserWorkload(userId, tasks, monthStart, monthEnd)
    const calendar = new Map<string, number>()

    entries.forEach(entry => {
      const dateKey = entry.date.toISOString().split('T')[0]
      calendar.set(dateKey, entry.estimatedHours)
    })

    return calendar
  }

  static redistributeTasks(
    overloadedUserId: string,
    availableUserIds: string[],
    tasks: Task[]
  ): { taskId: string; suggestedUserId: string }[] {
    const overloadedTasks = tasks.filter(t => {
      const assigneeId = (t as any).assigneeId
      return assigneeId === overloadedUserId && !t.isCompleted
    })

    const suggestions: { taskId: string; suggestedUserId: string }[] = []
    const userLoads = new Map<string, number>()

    availableUserIds.forEach(userId => {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const summary = this.getWeeklyWorkload(userId, tasks, weekStart)
      userLoads.set(userId, summary.totalEstimatedHours)
    })

    overloadedTasks.forEach(task => {
      // Find user with least workload
      let minLoad = Infinity
      let suggestedUserId = availableUserIds[0]

      availableUserIds.forEach(userId => {
        const load = userLoads.get(userId) || 0
        if (load < minLoad) {
          minLoad = load
          suggestedUserId = userId
        }
      })

      suggestions.push({ taskId: task.id, suggestedUserId })
    })

    return suggestions
  }
}

