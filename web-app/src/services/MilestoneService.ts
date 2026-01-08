import { Task } from '../types/Task'

export interface Milestone {
  id: string
  name: string
  description?: string
  projectId: string
  dueDate: Date
  completed: boolean
  completedAt?: Date
  color: string
  createdAt: Date
  taskIds: string[] // Tasks linked to this milestone
}

export class MilestoneService {
  private static milestonesKey = 'ticktick_milestones'

  static createMilestone(
    name: string,
    projectId: string,
    dueDate: Date,
    description?: string,
    color: string = '#007AFF'
  ): Milestone {
    const milestones = this.getAllMilestones()
    const newMilestone: Milestone = {
      id: `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      projectId,
      dueDate,
      completed: false,
      color,
      createdAt: new Date(),
      taskIds: []
    }

    milestones.push(newMilestone)
    this.saveMilestones(milestones)

    return newMilestone
  }

  static updateMilestone(milestoneId: string, updates: Partial<Omit<Milestone, 'id' | 'createdAt'>>): void {
    const milestones = this.getAllMilestones()
    const milestone = milestones.find(m => m.id === milestoneId)
    if (milestone) {
      if (updates.completed && !milestone.completed) {
        updates.completedAt = new Date()
      } else if (updates.completed === false) {
        updates.completedAt = undefined
      }
      Object.assign(milestone, updates)
      this.saveMilestones(milestones)
    }
  }

  static deleteMilestone(milestoneId: string): void {
    const milestones = this.getAllMilestones().filter(m => m.id !== milestoneId)
    this.saveMilestones(milestones)
  }

  static getMilestone(milestoneId: string): Milestone | undefined {
    return this.getAllMilestones().find(m => m.id === milestoneId)
  }

  static getAllMilestones(): Milestone[] {
    const data = localStorage.getItem(this.milestonesKey)
    if (!data) return []
    return JSON.parse(data).map((m: any) => ({
      ...m,
      dueDate: new Date(m.dueDate),
      createdAt: new Date(m.createdAt),
      completedAt: m.completedAt ? new Date(m.completedAt) : undefined
    }))
  }

  static getMilestonesForProject(projectId: string): Milestone[] {
    return this.getAllMilestones()
      .filter(m => m.projectId === projectId)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  }

  static linkTaskToMilestone(milestoneId: string, taskId: string): void {
    const milestones = this.getAllMilestones()
    const milestone = milestones.find(m => m.id === milestoneId)
    if (milestone && !milestone.taskIds.includes(taskId)) {
      milestone.taskIds.push(taskId)
      this.saveMilestones(milestones)
    }
  }

  static unlinkTaskFromMilestone(milestoneId: string, taskId: string): void {
    const milestones = this.getAllMilestones()
    const milestone = milestones.find(m => m.id === milestoneId)
    if (milestone) {
      milestone.taskIds = milestone.taskIds.filter(id => id !== taskId)
      this.saveMilestones(milestones)
    }
  }

  static getTasksForMilestone(milestoneId: string, allTasks: Task[]): Task[] {
    const milestone = this.getMilestone(milestoneId)
    if (!milestone) return []
    return allTasks.filter(t => milestone.taskIds.includes(t.id))
  }

  static getUpcomingMilestones(days: number = 7): Milestone[] {
    const now = new Date()
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    return this.getAllMilestones()
      .filter(m => !m.completed && m.dueDate >= now && m.dueDate <= future)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  }

  static getOverdueMilestones(): Milestone[] {
    const now = new Date()
    return this.getAllMilestones()
      .filter(m => !m.completed && m.dueDate < now)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  }

  static getMilestoneProgress(milestoneId: string, tasks: Task[]): {
    total: number
    completed: number
    percentage: number
  } {
    const milestone = this.getMilestone(milestoneId)
    if (!milestone) return { total: 0, completed: 0, percentage: 0 }

    const milestoneTasks = tasks.filter(t => milestone.taskIds.includes(t.id))
    const completed = milestoneTasks.filter(t => t.isCompleted).length

    return {
      total: milestoneTasks.length,
      completed,
      percentage: milestoneTasks.length > 0 ? (completed / milestoneTasks.length) * 100 : 0
    }
  }

  private static saveMilestones(milestones: Milestone[]): void {
    localStorage.setItem(this.milestonesKey, JSON.stringify(milestones))
  }
}

