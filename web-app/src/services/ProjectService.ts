import { Task, TaskList } from '../types/Task'
import { RoleService, Role } from './RoleService'
import { LocalAuthService } from './LocalAuthService'

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  icon: string
  ownerId: string
  createdAt: Date
  lists: string[] // List IDs
}

export class ProjectService {
  private static projectsKey = 'ticktick_projects'

  static createProject(
    name: string,
    description: string | undefined,
    ownerId: string,
    color: string = '#007AFF',
    icon: string = '📁'
  ): Project {
    const projects = this.getAllProjects()
    const newProject: Project = {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      color,
      icon,
      ownerId,
      createdAt: new Date(),
      lists: []
    }
    
    projects.push(newProject)
    this.saveProjects(projects)

    // Grant owner permission
    RoleService.grantProjectPermission(newProject.id, ownerId, 'owner', ownerId)

    return newProject
  }

  static updateProject(projectId: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'ownerId'>>): void {
    const projects = this.getAllProjects()
    const project = projects.find(p => p.id === projectId)
    if (project) {
      Object.assign(project, updates)
      this.saveProjects(projects)
    }
  }

  static deleteProject(projectId: string): void {
    const projects = this.getAllProjects().filter(p => p.id !== projectId)
    this.saveProjects(projects)
  }

  static getProject(projectId: string): Project | undefined {
    return this.getAllProjects().find(p => p.id === projectId)
  }

  static getAllProjects(): Project[] {
    const data = localStorage.getItem(this.projectsKey)
    if (!data) return []
    return JSON.parse(data).map((p: any) => ({
      ...p,
      createdAt: new Date(p.createdAt)
    }))
  }

  static getProjectsForUser(userId: string): Project[] {
    return this.getAllProjects().filter(p => {
      const role = RoleService.getProjectPermission(p.id, userId)
      return role !== null
    })
  }

  static addListToProject(projectId: string, listId: string): void {
    const projects = this.getAllProjects()
    const project = projects.find(p => p.id === projectId)
    if (project && !project.lists.includes(listId)) {
      project.lists.push(listId)
      this.saveProjects(projects)
    }
  }

  static removeListFromProject(projectId: string, listId: string): void {
    const projects = this.getAllProjects()
    const project = projects.find(p => p.id === projectId)
    if (project) {
      project.lists = project.lists.filter(id => id !== listId)
      this.saveProjects(projects)
    }
  }

  static getProjectStatistics(projectId: string, tasks: Task[], lists: TaskList[]): {
    totalTasks: number
    completedTasks: number
    totalLists: number
    tasksByList: Record<string, number>
  } {
    const project = this.getProject(projectId)
    if (!project) {
      return { totalTasks: 0, completedTasks: 0, totalLists: 0, tasksByList: {} }
    }

    const projectTasks = tasks.filter(t => project.lists.includes(t.listId))
    const tasksByList: Record<string, number> = {}

    project.lists.forEach(listId => {
      tasksByList[listId] = projectTasks.filter(t => t.listId === listId).length
    })

    return {
      totalTasks: projectTasks.length,
      completedTasks: projectTasks.filter(t => t.isCompleted).length,
      totalLists: project.lists.length,
      tasksByList
    }
  }

  static addMember(projectId: string, userId: string, role: Role, grantedBy: string): void {
    RoleService.grantProjectPermission(projectId, userId, role, grantedBy)
  }

  static removeMember(projectId: string, userId: string): void {
    RoleService.revokeProjectPermission(projectId, userId)
  }

  private static saveProjects(projects: Project[]): void {
    localStorage.setItem(this.projectsKey, JSON.stringify(projects))
  }
}
