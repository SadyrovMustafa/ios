import { LocalAuthService } from './LocalAuthService'

export type Role = 'owner' | 'admin' | 'editor' | 'viewer'

export interface ListPermission {
  listId: string
  userId: string
  role: Role
  grantedBy: string
  grantedAt: Date
}

export interface ProjectPermission {
  projectId: string
  userId: string
  role: Role
  grantedBy: string
  grantedAt: Date
}

export class RoleService {
  private static listPermissionsKey = 'ticktick_list_permissions'
  private static projectPermissionsKey = 'ticktick_project_permissions'

  static grantListPermission(listId: string, userId: string, role: Role, grantedBy: string): ListPermission {
    const permissions = this.getAllListPermissions()
    
    // Remove existing permission
    const filtered = permissions.filter(p => !(p.listId === listId && p.userId === userId))
    
    const newPermission: ListPermission = {
      listId,
      userId,
      role,
      grantedBy,
      grantedAt: new Date()
    }
    
    filtered.push(newPermission)
    this.saveListPermissions(filtered)

    return newPermission
  }

  static revokeListPermission(listId: string, userId: string): void {
    const permissions = this.getAllListPermissions().filter(
      p => !(p.listId === listId && p.userId === userId)
    )
    this.saveListPermissions(permissions)
  }

  static getListPermission(listId: string, userId: string): Role | null {
    const permission = this.getAllListPermissions().find(
      p => p.listId === listId && p.userId === userId
    )
    return permission ? permission.role : null
  }

  static getListPermissionsForList(listId: string): ListPermission[] {
    return this.getAllListPermissions().filter(p => p.listId === listId)
  }

  static canEditList(listId: string, userId: string): boolean {
    const role = this.getListPermission(listId, userId)
    return role === 'owner' || role === 'admin' || role === 'editor'
  }

  static canDeleteList(listId: string, userId: string): boolean {
    const role = this.getListPermission(listId, userId)
    return role === 'owner' || role === 'admin'
  }

  static canViewList(listId: string, userId: string): boolean {
    const role = this.getListPermission(listId, userId)
    return role !== null
  }

  static grantProjectPermission(projectId: string, userId: string, role: Role, grantedBy: string): ProjectPermission {
    const permissions = this.getAllProjectPermissions()
    
    const filtered = permissions.filter(p => !(p.projectId === projectId && p.userId === userId))
    
    const newPermission: ProjectPermission = {
      projectId,
      userId,
      role,
      grantedBy,
      grantedAt: new Date()
    }
    
    filtered.push(newPermission)
    this.saveProjectPermissions(filtered)

    return newPermission
  }

  static revokeProjectPermission(projectId: string, userId: string): void {
    const permissions = this.getAllProjectPermissions().filter(
      p => !(p.projectId === projectId && p.userId === userId)
    )
    this.saveProjectPermissions(permissions)
  }

  static getProjectPermission(projectId: string, userId: string): Role | null {
    const permission = this.getAllProjectPermissions().find(
      p => p.projectId === projectId && p.userId === userId
    )
    return permission ? permission.role : null
  }

  static getProjectPermissions(projectId: string): ProjectPermission[] {
    return this.getAllProjectPermissions().filter(p => p.projectId === projectId)
  }

  static canEditProject(projectId: string, userId: string): boolean {
    const role = this.getProjectPermission(projectId, userId)
    return role === 'owner' || role === 'admin' || role === 'editor'
  }

  static canDeleteProject(projectId: string, userId: string): boolean {
    const role = this.getProjectPermission(projectId, userId)
    return role === 'owner' || role === 'admin'
  }

  static canViewProject(projectId: string, userId: string): boolean {
    const role = this.getProjectPermission(projectId, userId)
    return role !== null
  }

  private static getAllListPermissions(): ListPermission[] {
    const data = localStorage.getItem(this.listPermissionsKey)
    if (!data) return []
    return JSON.parse(data).map((p: any) => ({
      ...p,
      grantedAt: new Date(p.grantedAt)
    }))
  }

  private static saveListPermissions(permissions: ListPermission[]): void {
    localStorage.setItem(this.listPermissionsKey, JSON.stringify(permissions))
  }

  private static getAllProjectPermissions(): ProjectPermission[] {
    const data = localStorage.getItem(this.projectPermissionsKey)
    if (!data) return []
    return JSON.parse(data).map((p: any) => ({
      ...p,
      grantedAt: new Date(p.grantedAt)
    }))
  }

  private static saveProjectPermissions(permissions: ProjectPermission[]): void {
    localStorage.setItem(this.projectPermissionsKey, JSON.stringify(permissions))
  }
}

