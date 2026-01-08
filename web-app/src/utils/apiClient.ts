/**
 * API Client для использования в приложении
 * Упрощенный клиент для работы с REST API
 */

export class APIClient {
  private apiKey: string
  private baseURL: string

  constructor(apiKey: string, baseURL: string = '/api/v1') {
    this.apiKey = apiKey
    this.baseURL = baseURL
  }

  private async request(method: string, path: string, body?: any, query?: Record<string, string>): Promise<any> {
    const url = new URL(path, window.location.origin)
    url.pathname = this.baseURL + path

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
      throw new Error(error.error?.message || `HTTP ${response.status}`)
    }

    if (response.status === 204) {
      return null
    }

    return response.json()
  }

  // Tasks
  async getTasks(filters?: Record<string, string>) {
    return this.request('GET', '/tasks', undefined, filters)
  }

  async getTask(id: string) {
    return this.request('GET', `/tasks/${id}`)
  }

  async createTask(task: any) {
    return this.request('POST', '/tasks', task)
  }

  async updateTask(id: string, updates: any) {
    return this.request('PATCH', `/tasks/${id}`, updates)
  }

  async deleteTask(id: string) {
    return this.request('DELETE', `/tasks/${id}`)
  }

  // Lists
  async getLists() {
    return this.request('GET', '/lists')
  }

  async getList(id: string) {
    return this.request('GET', `/lists/${id}`)
  }

  async createList(list: any) {
    return this.request('POST', '/lists', list)
  }

  async updateList(id: string, updates: any) {
    return this.request('PATCH', `/lists/${id}`, updates)
  }

  async deleteList(id: string) {
    return this.request('DELETE', `/lists/${id}`)
  }

  // Projects
  async getProjects() {
    return this.request('GET', '/projects')
  }

  async getProject(id: string) {
    return this.request('GET', `/projects/${id}`)
  }

  async createProject(project: any) {
    return this.request('POST', '/projects', project)
  }

  // Users
  async getUsers() {
    return this.request('GET', '/users')
  }

  async getUser(id: string) {
    return this.request('GET', `/users/${id}`)
  }

  // Health
  async health() {
    return this.request('GET', '/health')
  }
}

