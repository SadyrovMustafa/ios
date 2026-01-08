import { Task } from '../types/Task'
import { LocalAuthService, User } from './LocalAuthService'
import { PushNotificationService } from './PushNotificationService'
import { toastService } from './ToastService'

export interface TaskAssignment {
  taskId: string
  assignedTo: string // User ID
  assignedBy: string // User ID
  assignedAt: Date
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
}

export class TaskAssignmentService {
  private static assignmentsKey = 'ticktick_task_assignments'

  static assignTask(taskId: string, userId: string, assignedBy: string): TaskAssignment {
    const assignments = this.getAssignments()
    
    // Remove existing assignment if any
    const filtered = assignments.filter(a => a.taskId !== taskId)
    
    const newAssignment: TaskAssignment = {
      taskId,
      assignedTo: userId,
      assignedBy,
      assignedAt: new Date(),
      status: 'pending'
    }
    
    filtered.push(newAssignment)
    this.saveAssignments(filtered)

    // Send notification
    const user = LocalAuthService.getUserById(userId)
    if (user) {
      const assigner = LocalAuthService.getUserById(assignedBy)
      PushNotificationService.sendNotification(
        'Новая задача назначена',
        {
          body: `${assigner?.name || 'Кто-то'} назначил вам задачу`,
          data: { taskId, type: 'assignment' }
        }
      ).catch(console.error)
    }

    return newAssignment
  }

  static unassignTask(taskId: string): void {
    const assignments = this.getAssignments().filter(a => a.taskId !== taskId)
    this.saveAssignments(assignments)
  }

  static updateAssignmentStatus(taskId: string, status: TaskAssignment['status']): void {
    const assignments = this.getAssignments()
    const assignment = assignments.find(a => a.taskId === taskId)
    if (assignment) {
      assignment.status = status
      this.saveAssignments(assignments)
    }
  }

  static getAssignment(taskId: string): TaskAssignment | undefined {
    return this.getAssignments().find(a => a.taskId === taskId)
  }

  static getAssignmentsForUser(userId: string): TaskAssignment[] {
    return this.getAssignments().filter(a => a.assignedTo === userId)
  }

  static getAssignmentsByUser(userId: string): TaskAssignment[] {
    return this.getAssignments().filter(a => a.assignedBy === userId)
  }

  static getAllAssignments(): TaskAssignment[] {
    return this.getAssignments()
  }

  static getTasksForUser(userId: string, tasks: Task[]): Task[] {
    const assignments = this.getAssignmentsForUser(userId)
    const taskIds = assignments.map(a => a.taskId)
    return tasks.filter(t => taskIds.includes(t.id))
  }

  static getStatistics(): {
    total: number
    byUser: Record<string, { assigned: number; completed: number; pending: number }>
  } {
    const assignments = this.getAssignments()
    const stats: Record<string, { assigned: number; completed: number; pending: number }> = {}

    assignments.forEach(assignment => {
      if (!stats[assignment.assignedTo]) {
        stats[assignment.assignedTo] = { assigned: 0, completed: 0, pending: 0 }
      }
      stats[assignment.assignedTo].assigned++
      if (assignment.status === 'completed') {
        stats[assignment.assignedTo].completed++
      } else if (assignment.status === 'pending' || assignment.status === 'in_progress') {
        stats[assignment.assignedTo].pending++
      }
    })

    return {
      total: assignments.length,
      byUser: stats
    }
  }

  private static getAssignments(): TaskAssignment[] {
    const data = localStorage.getItem(this.assignmentsKey)
    if (!data) return []
    return JSON.parse(data).map((a: any) => ({
      ...a,
      assignedAt: new Date(a.assignedAt)
    }))
  }

  private static saveAssignments(assignments: TaskAssignment[]): void {
    localStorage.setItem(this.assignmentsKey, JSON.stringify(assignments))
  }
}

