import { Task } from '../types/Task'
import { ProjectService, Project } from './ProjectService'

export interface Sprint {
  id: string
  projectId: string
  name: string
  goal?: string
  startDate: Date
  endDate: Date
  status: 'planned' | 'active' | 'completed' | 'cancelled'
  tasks: string[] // Task IDs
  createdAt: Date
}

export class SprintService {
  private static sprintsKey = 'ticktick_sprints'

  static createSprint(
    projectId: string,
    name: string,
    startDate: Date,
    endDate: Date,
    goal?: string
  ): Sprint {
    const sprints = this.getAllSprints()
    const newSprint: Sprint = {
      id: `sprint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      name,
      goal,
      startDate,
      endDate,
      status: 'planned',
      tasks: [],
      createdAt: new Date()
    }
    
    sprints.push(newSprint)
    this.saveSprints(sprints)

    return newSprint
  }

  static updateSprint(sprintId: string, updates: Partial<Omit<Sprint, 'id' | 'createdAt'>>): void {
    const sprints = this.getAllSprints()
    const sprint = sprints.find(s => s.id === sprintId)
    if (sprint) {
      Object.assign(sprint, updates)
      this.saveSprints(sprints)
    }
  }

  static deleteSprint(sprintId: string): void {
    const sprints = this.getAllSprints().filter(s => s.id !== sprintId)
    this.saveSprints(sprints)
  }

  static getSprint(sprintId: string): Sprint | undefined {
    return this.getAllSprints().find(s => s.id === sprintId)
  }

  static getSprintsForProject(projectId: string): Sprint[] {
    return this.getAllSprints()
      .filter(s => s.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  static getActiveSprint(projectId: string): Sprint | undefined {
    return this.getAllSprints().find(
      s => s.projectId === projectId && s.status === 'active'
    )
  }

  static startSprint(sprintId: string): void {
    const sprint = this.getSprint(sprintId)
    if (sprint) {
      // End other active sprints in the same project
      const otherSprints = this.getSprintsForProject(sprint.projectId)
        .filter(s => s.id !== sprintId && s.status === 'active')
      otherSprints.forEach(s => {
        s.status = 'completed'
      })
      
      sprint.status = 'active'
      this.updateSprint(sprintId, { status: 'active' })
    }
  }

  static completeSprint(sprintId: string): void {
    this.updateSprint(sprintId, { status: 'completed' })
  }

  static addTaskToSprint(sprintId: string, taskId: string): void {
    const sprint = this.getSprint(sprintId)
    if (sprint && !sprint.tasks.includes(taskId)) {
      sprint.tasks.push(taskId)
      this.updateSprint(sprintId, { tasks: sprint.tasks })
    }
  }

  static removeTaskFromSprint(sprintId: string, taskId: string): void {
    const sprint = this.getSprint(sprintId)
    if (sprint) {
      sprint.tasks = sprint.tasks.filter(id => id !== taskId)
      this.updateSprint(sprintId, { tasks: sprint.tasks })
    }
  }

  static getSprintStatistics(sprint: Sprint, tasks: Task[]): {
    totalTasks: number
    completedTasks: number
    completionRate: number
    tasksByStatus: Record<string, number>
  } {
    const sprintTasks = tasks.filter(t => sprint.tasks.includes(t.id))
    const completedTasks = sprintTasks.filter(t => t.isCompleted)
    
    const tasksByStatus: Record<string, number> = {
      completed: completedTasks.length,
      pending: sprintTasks.filter(t => !t.isCompleted && !t.dueDate).length,
      overdue: sprintTasks.filter(t => !t.isCompleted && t.dueDate && new Date(t.dueDate) < new Date()).length
    }

    return {
      totalTasks: sprintTasks.length,
      completedTasks: completedTasks.length,
      completionRate: sprintTasks.length > 0 ? (completedTasks.length / sprintTasks.length) * 100 : 0,
      tasksByStatus
    }
  }

  private static getAllSprints(): Sprint[] {
    const data = localStorage.getItem(this.sprintsKey)
    if (!data) return []
    return JSON.parse(data).map((s: any) => ({
      ...s,
      startDate: new Date(s.startDate),
      endDate: new Date(s.endDate),
      createdAt: new Date(s.createdAt)
    }))
  }

  private static saveSprints(sprints: Sprint[]): void {
    localStorage.setItem(this.sprintsKey, JSON.stringify(sprints))
  }
}

