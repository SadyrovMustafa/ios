import { Task, Priority } from '../types/Task'

export interface PlannedTask {
  task: Task
  scheduledTime: Date
  estimatedDuration: number // в минутах
  reason: string
}

export class AutoPlanningService {
  static planTasks(
    tasks: Task[],
    availableHours: number = 8,
    startTime: Date = new Date()
  ): PlannedTask[] {
    const activeTasks = tasks.filter(t => !t.isCompleted)
    const prioritizedTasks = this.prioritizeTasks(activeTasks)
    
    const planned: PlannedTask[] = []
    let currentTime = new Date(startTime)
    const endTime = new Date(startTime)
    endTime.setHours(startTime.getHours() + availableHours)

    for (const task of prioritizedTasks) {
      if (currentTime >= endTime) break

      const estimatedDuration = this.estimateTaskDuration(task)
      const scheduledTime = new Date(currentTime)

      // Проверяем, не выходит ли за пределы рабочего дня
      if (scheduledTime.getHours() >= 18) {
        // Переносим на следующий день
        scheduledTime.setDate(scheduledTime.getDate() + 1)
        scheduledTime.setHours(9, 0, 0, 0)
        currentTime = new Date(scheduledTime)
      }

      planned.push({
        task,
        scheduledTime,
        estimatedDuration,
        reason: this.getReason(task, prioritizedTasks.indexOf(task))
      })

      // Увеличиваем время на следующую задачу
      currentTime = new Date(scheduledTime.getTime() + estimatedDuration * 60 * 1000)
    }

    return planned
  }

  private static prioritizeTasks(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      // Приоритет по важности
      const priorityOrder: Record<Priority, number> = {
        [Priority.High]: 4,
        [Priority.Medium]: 3,
        [Priority.Low]: 2,
        [Priority.None]: 1
      }

      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff

      // Затем по дате выполнения
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime()
      }
      if (a.dueDate) return -1
      if (b.dueDate) return 1

      // Затем по дате создания
      return a.createdAt.getTime() - b.createdAt.getTime()
    })
  }

  private static estimateTaskDuration(task: Task): number {
    // Проверяем, есть ли сохраненная оценка
    const estimate = TimeEstimateService.getEstimate(task.id)
    if (estimate && estimate.estimatedMinutes > 0) {
      return estimate.estimatedMinutes
    }

    // Базовая оценка на основе приоритета и сложности
    let baseMinutes = 30

    // Учитываем приоритет
    switch (task.priority) {
      case Priority.High:
        baseMinutes = 60
        break
      case Priority.Medium:
        baseMinutes = 45
        break
      case Priority.Low:
        baseMinutes = 30
        break
      default:
        baseMinutes = 20
    }

    // Учитываем подзадачи
    if (task.subtasks && task.subtasks.length > 0) {
      baseMinutes += task.subtasks.length * 15
    }

    // Учитываем длину заметок (больше заметок = больше времени)
    if (task.notes && task.notes.length > 100) {
      baseMinutes += Math.floor(task.notes.length / 100) * 10
    }

    return baseMinutes
  }

  static formatTime(minutes: number): string {
    return TimeEstimateService.formatTime(minutes)
  }

  private static getReason(task: Task, position: number): string {
    const reasons: string[] = []

    if (task.priority === Priority.High) {
      reasons.push('высокий приоритет')
    }

    if (task.dueDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const due = new Date(task.dueDate)
      due.setHours(0, 0, 0, 0)
      const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        reasons.push('срок сегодня')
      } else if (diffDays === 1) {
        reasons.push('срок завтра')
      } else if (diffDays < 0) {
        reasons.push('просрочено')
      }
    }

    if (position === 0) {
      reasons.push('первая в списке')
    }

    return reasons.length > 0 ? reasons.join(', ') : 'планирование по умолчанию'
  }

  static suggestOptimalTime(task: Task, availableSlots: Date[]): Date | null {
    // Находим оптимальный слот для задачи
    const estimatedDuration = this.estimateTaskDuration(task)

    for (const slot of availableSlots) {
      const endTime = new Date(slot.getTime() + estimatedDuration * 60 * 1000)
      
      // Проверяем, не выходит ли за рабочие часы
      if (endTime.getHours() <= 18) {
        return slot
      }
    }

    return null
  }
}

