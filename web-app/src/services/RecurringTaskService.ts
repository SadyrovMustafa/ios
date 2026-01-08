import { Task, RecurringPattern } from '../types/Task'
import { TaskManager } from './TaskManager'

export class RecurringTaskService {
  static shouldCreateNextInstance(task: Task, taskManager: TaskManager): boolean {
    if (!task.recurring || !task.isCompleted) return false

    const completedAt = task.completedAt
    if (!completedAt) return false

    const now = new Date()
    const lastCompleted = new Date(completedAt)

    switch (task.recurring.type) {
      case 'daily':
        return this.shouldCreateDaily(task.recurring, lastCompleted, now)
      case 'weekly':
        return this.shouldCreateWeekly(task.recurring, lastCompleted, now)
      case 'monthly':
        return this.shouldCreateMonthly(task.recurring, lastCompleted, now)
      case 'yearly':
        return this.shouldCreateYearly(task.recurring, lastCompleted, now)
      default:
        return false
    }
  }

  static createNextInstance(task: Task, taskManager: TaskManager): Task | null {
    if (!task.recurring || !task.dueDate) return null

    const lastDueDate = new Date(task.dueDate)
    const nextDueDate = this.calculateNextDate(task.recurring, lastDueDate)

    if (task.recurring.endDate && nextDueDate > new Date(task.recurring.endDate)) {
      return null
    }

    const newTask: Omit<Task, 'id' | 'createdAt'> = {
      ...task,
      isCompleted: false,
      completedAt: undefined,
      dueDate: nextDueDate,
      reminderDate: task.reminderDate
        ? this.calculateNextReminder(task.recurring, new Date(task.reminderDate), nextDueDate)
        : undefined
    }

    return taskManager.addTask(newTask)
  }

  private static shouldCreateDaily(pattern: RecurringPattern, lastCompleted: Date, now: Date): boolean {
    const daysDiff = Math.floor((now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff >= pattern.interval
  }

  private static shouldCreateWeekly(pattern: RecurringPattern, lastCompleted: Date, now: Date): boolean {
    const weeksDiff = Math.floor((now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24 * 7))
    return weeksDiff >= pattern.interval
  }

  private static shouldCreateMonthly(pattern: RecurringPattern, lastCompleted: Date, now: Date): boolean {
    const monthsDiff = (now.getFullYear() - lastCompleted.getFullYear()) * 12 +
      (now.getMonth() - lastCompleted.getMonth())
    return monthsDiff >= pattern.interval
  }

  private static shouldCreateYearly(pattern: RecurringPattern, lastCompleted: Date, now: Date): boolean {
    const yearsDiff = now.getFullYear() - lastCompleted.getFullYear()
    return yearsDiff >= pattern.interval
  }

  private static calculateNextDate(pattern: RecurringPattern, lastDate: Date): Date {
    const next = new Date(lastDate)

    switch (pattern.type) {
      case 'daily':
        next.setDate(next.getDate() + pattern.interval)
        break
      case 'weekly':
        next.setDate(next.getDate() + (7 * pattern.interval))
        break
      case 'monthly':
        next.setMonth(next.getMonth() + pattern.interval)
        break
      case 'yearly':
        next.setFullYear(next.getFullYear() + pattern.interval)
        break
    }

    return next
  }

  private static calculateNextReminder(
    pattern: RecurringPattern,
    lastReminder: Date,
    nextDueDate: Date
  ): Date {
    // Calculate the time difference between reminder and due date
    const lastDueDate = new Date(lastReminder)
    const reminderOffset = lastReminder.getTime() - lastDueDate.getTime()
    const nextReminder = new Date(nextDueDate)
    nextReminder.setTime(nextReminder.getTime() + reminderOffset)
    return nextReminder
  }

  static processRecurringTasks(taskManager: TaskManager): void {
    const tasks = taskManager.getTasks()
    const completedRecurringTasks = tasks.filter(t => 
      t.isCompleted && t.recurring
    )

    completedRecurringTasks.forEach(task => {
      if (this.shouldCreateNextInstance(task, taskManager)) {
        this.createNextInstance(task, taskManager)
      }
    })
  }
}

