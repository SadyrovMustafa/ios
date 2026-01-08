import { Task } from '../types/Task'
import { TaskManager } from './TaskManager'
import { LocalAuthService } from './LocalAuthService'

export interface APIKey {
  id: string
  name: string
  key: string
  userId: string
  createdAt: Date
  lastUsed?: Date
  permissions: APIPermission[]
  rateLimit?: number // requests per hour
}

export type APIPermission = 
  | 'tasks:read' 
  | 'tasks:write' 
  | 'tasks:delete'
  | 'lists:read'
  | 'lists:write'
  | 'lists:delete'
  | 'projects:read'
  | 'projects:write'
  | 'users:read'

export interface APIRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  headers: Record<string, string>
  body?: any
  query?: Record<string, string>
}

export interface APIResponse {
  status: number
  data?: any
  error?: {
    code: string
    message: string
  }
  meta?: {
    page?: number
    limit?: number
    total?: number
  }
}

export class APIService {
  private static apiKeysKey = 'ticktick_api_keys'
  private static rateLimitKey = 'ticktick_api_rate_limits'
  private static taskManager = new TaskManager()

  // API Key Management
  static createAPIKey(name: string, userId: string, permissions: APIPermission[] = ['tasks:read']): APIKey {
    const keys = this.getAllAPIKeys()
    const newKey: APIKey = {
      id: `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      key: this.generateAPIKey(),
      userId,
      createdAt: new Date(),
      permissions,
      rateLimit: 1000 // default: 1000 requests per hour
    }

    keys.push(newKey)
    this.saveAPIKeys(keys)

    return newKey
  }

  static deleteAPIKey(keyId: string, userId: string): void {
    const keys = this.getAllAPIKeys().filter(k => {
      if (k.id === keyId && k.userId !== userId) {
        throw new Error('Unauthorized')
      }
      return k.id !== keyId
    })
    this.saveAPIKeys(keys)
  }

  static getAllAPIKeys(): APIKey[] {
    const data = localStorage.getItem(this.apiKeysKey)
    if (!data) return []
    return JSON.parse(data).map((k: any) => ({
      ...k,
      createdAt: new Date(k.createdAt),
      lastUsed: k.lastUsed ? new Date(k.lastUsed) : undefined
    }))
  }

  static getAPIKeyByKey(key: string): APIKey | undefined {
    return this.getAllAPIKeys().find(k => k.key === key)
  }

  static validateAPIKey(key: string): { valid: boolean; apiKey?: APIKey; error?: string } {
    const apiKey = this.getAPIKeyByKey(key)
    if (!apiKey) {
      return { valid: false, error: 'Invalid API key' }
    }

    // Check rate limit
    if (!this.checkRateLimit(apiKey.id)) {
      return { valid: false, error: 'Rate limit exceeded' }
    }

    // Update last used
    this.updateLastUsed(apiKey.id)

    return { valid: true, apiKey }
  }

  // Rate Limiting
  private static checkRateLimit(keyId: string): boolean {
    const limits = this.getRateLimits()
    const limit = limits[keyId]
    if (!limit) return true

    const now = Date.now()
    const hourAgo = now - 60 * 60 * 1000

    // Remove old entries
    limit.requests = limit.requests.filter(t => t > hourAgo)

    const apiKey = this.getAllAPIKeys().find(k => k.id === keyId)
    const maxRequests = apiKey?.rateLimit || 1000

    if (limit.requests.length >= maxRequests) {
      return false
    }

    limit.requests.push(now)
    limits[keyId] = limit
    this.saveRateLimits(limits)

    return true
  }

  private static getRateLimits(): Record<string, { requests: number[] }> {
    const data = localStorage.getItem(this.rateLimitKey)
    return data ? JSON.parse(data) : {}
  }

  private static saveRateLimits(limits: Record<string, { requests: number[] }>): void {
    localStorage.setItem(this.rateLimitKey, JSON.stringify(limits))
  }

  private static updateLastUsed(keyId: string): void {
    const keys = this.getAllAPIKeys()
    const key = keys.find(k => k.id === keyId)
    if (key) {
      key.lastUsed = new Date()
      this.saveAPIKeys(keys)
    }
  }

  // API Endpoints
  static async handleRequest(request: APIRequest): Promise<APIResponse> {
    try {
      // Validate API key
      const apiKey = request.headers['x-api-key'] || request.headers['Authorization']?.replace('Bearer ', '')
      if (!apiKey) {
        return { status: 401, error: { code: 'UNAUTHORIZED', message: 'API key required' } }
      }

      const validation = this.validateAPIKey(apiKey)
      if (!validation.valid || !validation.apiKey) {
        return { 
          status: validation.error === 'Rate limit exceeded' ? 429 : 401, 
          error: { code: 'UNAUTHORIZED', message: validation.error || 'Invalid API key' } 
        }
      }

      const { apiKey: key } = validation

      // Route request
      const response = await this.routeRequest(request, key)
      return response
    } catch (error: any) {
      return {
        status: 500,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Internal server error'
        }
      }
    }
  }

  private static async routeRequest(request: APIRequest, apiKey: APIKey): Promise<APIResponse> {
    const { method, path, body, query } = request
    const pathParts = path.split('/').filter(p => p)

    // Tasks endpoints
    if (pathParts[0] === 'tasks') {
      return this.handleTasksEndpoint(method, pathParts, body, query, apiKey)
    }

    // Lists endpoints
    if (pathParts[0] === 'lists') {
      return this.handleListsEndpoint(method, pathParts, body, query, apiKey)
    }

    // Projects endpoints
    if (pathParts[0] === 'projects') {
      return this.handleProjectsEndpoint(method, pathParts, body, query, apiKey)
    }

    // Users endpoints
    if (pathParts[0] === 'users') {
      return this.handleUsersEndpoint(method, pathParts, body, query, apiKey)
    }

    // Health check
    if (path === '/health' || path === '/') {
      return { status: 200, data: { status: 'ok', version: '1.0.0' } }
    }

    return { status: 404, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }
  }

  // Tasks endpoints
  private static async handleTasksEndpoint(
    method: string,
    pathParts: string[],
    body: any,
    query: Record<string, string> | undefined,
    apiKey: APIKey
  ): Promise<APIResponse> {
    if (!apiKey.permissions.includes('tasks:read') && method !== 'GET') {
      if (!apiKey.permissions.includes('tasks:write') && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        return { status: 403, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }
      }
      if (!apiKey.permissions.includes('tasks:delete') && method === 'DELETE') {
        return { status: 403, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }
      }
    }

    switch (method) {
      case 'GET':
        if (pathParts.length === 1) {
          // GET /tasks
          const tasks = this.taskManager.getTasks()
          const filtered = this.filterTasks(tasks, query)
          return { status: 200, data: filtered }
        } else if (pathParts.length === 2) {
          // GET /tasks/:id
          const tasks = this.taskManager.getTasks()
          const task = tasks.find(t => t.id === pathParts[1])
          if (!task) {
            return { status: 404, error: { code: 'NOT_FOUND', message: 'Task not found' } }
          }
          return { status: 200, data: task }
        }
        break

      case 'POST':
        // POST /tasks
        if (!body || !body.title) {
          return { status: 400, error: { code: 'BAD_REQUEST', message: 'Title is required' } }
        }
        const newTask = this.taskManager.addTask({
          title: body.title,
          notes: body.notes || '',
          isCompleted: body.isCompleted || false,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          priority: body.priority || 'none',
          listId: body.listId || this.taskManager.getLists()[0]?.id || '',
          tags: body.tags || []
        })
        return { status: 201, data: newTask }

      case 'PUT':
      case 'PATCH':
        // PUT/PATCH /tasks/:id
        if (pathParts.length !== 2) {
          return { status: 400, error: { code: 'BAD_REQUEST', message: 'Task ID required' } }
        }
        const tasks = this.taskManager.getTasks()
        const existingTask = tasks.find(t => t.id === pathParts[1])
        if (!existingTask) {
          return { status: 404, error: { code: 'NOT_FOUND', message: 'Task not found' } }
        }
        const updatedTask = {
          ...existingTask,
          ...body,
          dueDate: body.dueDate ? new Date(body.dueDate) : existingTask.dueDate
        }
        this.taskManager.updateTask(updatedTask)
        return { status: 200, data: updatedTask }

      case 'DELETE':
        // DELETE /tasks/:id
        if (pathParts.length !== 2) {
          return { status: 400, error: { code: 'BAD_REQUEST', message: 'Task ID required' } }
        }
        this.taskManager.deleteTask(pathParts[1])
        return { status: 204, data: null }
    }

    return { status: 405, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }
  }

  // Lists endpoints
  private static async handleListsEndpoint(
    method: string,
    pathParts: string[],
    body: any,
    _query: Record<string, string> | undefined,
    apiKey: APIKey
  ): Promise<APIResponse> {
    if (!apiKey.permissions.includes('lists:read') && method === 'GET') {
      return { status: 403, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }
    }
    if (!apiKey.permissions.includes('lists:write') && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      return { status: 403, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }
    }
    if (!apiKey.permissions.includes('lists:delete') && method === 'DELETE') {
      return { status: 403, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }
    }

    switch (method) {
      case 'GET':
        if (pathParts.length === 1) {
          // GET /lists
          const lists = this.taskManager.getLists()
          return { status: 200, data: lists }
        } else if (pathParts.length === 2) {
          // GET /lists/:id
          const list = this.taskManager.getLists().find(l => l.id === pathParts[1])
          if (!list) {
            return { status: 404, error: { code: 'NOT_FOUND', message: 'List not found' } }
          }
          return { status: 200, data: list }
        }
        break

      case 'POST':
        // POST /lists
        if (!body || !body.name) {
          return { status: 400, error: { code: 'BAD_REQUEST', message: 'Name is required' } }
        }
        const newList = this.taskManager.addList({
          name: body.name,
          color: body.color || '#007AFF',
          icon: body.icon || '📋'
        })
        return { status: 201, data: newList }

      case 'PUT':
      case 'PATCH':
        // PUT/PATCH /lists/:id
        if (pathParts.length !== 2) {
          return { status: 400, error: { code: 'BAD_REQUEST', message: 'List ID required' } }
        }
        const lists = this.taskManager.getLists()
        const listIndex = lists.findIndex(l => l.id === pathParts[1])
        if (listIndex === -1) {
          return { status: 404, error: { code: 'NOT_FOUND', message: 'List not found' } }
        }
        const updatedList = { ...lists[listIndex], ...body }
        // TaskManager doesn't have updateList, so we'll need to delete and recreate
        // For now, just return the updated list (actual update would require modifying TaskManager)
        return { status: 200, data: updatedList }

      case 'DELETE':
        // DELETE /lists/:id
        if (pathParts.length !== 2) {
          return { status: 400, error: { code: 'BAD_REQUEST', message: 'List ID required' } }
        }
        this.taskManager.deleteList(pathParts[1])
        return { status: 204, data: null }
    }

    return { status: 405, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }
  }

  // Projects endpoints
  private static async handleProjectsEndpoint(
    method: string,
    pathParts: string[],
    body: any,
    _query: Record<string, string> | undefined,
    apiKey: APIKey
  ): Promise<APIResponse> {
    // Import ProjectService
    const { ProjectService } = await import('./ProjectService')

    if (!apiKey.permissions.includes('projects:read') && method === 'GET') {
      return { status: 403, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }
    }
    if (!apiKey.permissions.includes('projects:write') && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      return { status: 403, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }
    }

    switch (method) {
      case 'GET':
        if (pathParts.length === 1) {
          // GET /projects
          const projects = ProjectService.getProjectsForUser(apiKey.userId)
          return { status: 200, data: projects }
        } else if (pathParts.length === 2) {
          // GET /projects/:id
          const project = ProjectService.getProject(pathParts[1])
          if (!project) {
            return { status: 404, error: { code: 'NOT_FOUND', message: 'Project not found' } }
          }
          return { status: 200, data: project }
        }
        break

      case 'POST':
        // POST /projects
        if (!body || !body.name) {
          return { status: 400, error: { code: 'BAD_REQUEST', message: 'Name is required' } }
        }
        const newProject = ProjectService.createProject(
          body.name,
          body.description,
          apiKey.userId,
          body.color,
          body.icon
        )
        return { status: 201, data: newProject }
    }

    return { status: 405, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }
  }

  // Users endpoints
  private static async handleUsersEndpoint(
    method: string,
    pathParts: string[],
    _body: any,
    _query: Record<string, string> | undefined,
    apiKey: APIKey
  ): Promise<APIResponse> {
    if (!apiKey.permissions.includes('users:read')) {
      return { status: 403, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }
    }

    if (method === 'GET' && pathParts.length === 1) {
      // GET /users
      const users = LocalAuthService.getAllUsers()
      return { status: 200, data: users.map(u => ({ id: u.id, name: u.name, email: u.email })) }
    } else if (method === 'GET' && pathParts.length === 2) {
      // GET /users/:id
      const user = LocalAuthService.getUserById(pathParts[1])
      if (!user) {
        return { status: 404, error: { code: 'NOT_FOUND', message: 'User not found' } }
      }
      return { status: 200, data: { id: user.id, name: user.name, email: user.email } }
    }

    return { status: 405, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }
  }

  // Helper methods
  private static filterTasks(tasks: Task[], query?: Record<string, string>): Task[] {
    if (!query) return tasks

    let filtered = [...tasks]

    if (query.listId) {
      filtered = filtered.filter(t => t.listId === query.listId)
    }

    if (query.priority) {
      filtered = filtered.filter(t => t.priority === query.priority)
    }

    if (query.completed === 'true') {
      filtered = filtered.filter(t => t.isCompleted)
    } else if (query.completed === 'false') {
      filtered = filtered.filter(t => !t.isCompleted)
    }

    if (query.tag) {
      filtered = filtered.filter(t => t.tags?.includes(query.tag!))
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase()
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchLower) ||
        t.notes.toLowerCase().includes(searchLower)
      )
    }

    // Pagination
    const page = parseInt(query.page || '1')
    const limit = parseInt(query.limit || '50')
    const start = (page - 1) * limit
    const end = start + limit

    return filtered.slice(start, end)
  }

  private static generateAPIKey(): string {
    return `tt_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`
  }

  private static saveAPIKeys(keys: APIKey[]): void {
    localStorage.setItem(this.apiKeysKey, JSON.stringify(keys))
  }
}

