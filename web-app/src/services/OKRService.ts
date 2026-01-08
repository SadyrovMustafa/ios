export interface KeyResult {
  id: string
  name: string
  description?: string
  target: number
  current: number
  unit: string // e.g., "tasks", "hours", "%"
  completed: boolean
  completedAt?: Date
}

export interface Objective {
  id: string
  name: string
  description?: string
  projectId?: string
  portfolioId?: string
  keyResults: KeyResult[]
  progress: number // 0-100
  completed: boolean
  completedAt?: Date
  createdAt: Date
  ownerId: string
}

export class OKRService {
  private static okrsKey = 'ticktick_okrs'

  static createObjective(
    name: string,
    ownerId: string,
    description?: string,
    projectId?: string,
    portfolioId?: string
  ): Objective {
    const okrs = this.getAllObjectives()
    const newObjective: Objective = {
      id: `okr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      projectId,
      portfolioId,
      keyResults: [],
      progress: 0,
      completed: false,
      createdAt: new Date(),
      ownerId
    }

    okrs.push(newObjective)
    this.saveObjectives(okrs)

    return newObjective
  }

  static updateObjective(objectiveId: string, updates: Partial<Omit<Objective, 'id' | 'createdAt' | 'ownerId'>>): void {
    const okrs = this.getAllObjectives()
    const objective = okrs.find(o => o.id === objectiveId)
    if (objective) {
      Object.assign(objective, updates)
      
      // Recalculate progress
      if (updates.keyResults || updates.completed === undefined) {
        objective.progress = this.calculateProgress(objective)
        objective.completed = objective.progress === 100
        if (objective.completed && !objective.completedAt) {
          objective.completedAt = new Date()
        }
      }
      
      this.saveObjectives(okrs)
    }
  }

  static deleteObjective(objectiveId: string): void {
    const okrs = this.getAllObjectives().filter(o => o.id !== objectiveId)
    this.saveObjectives(okrs)
  }

  static getObjective(objectiveId: string): Objective | undefined {
    return this.getAllObjectives().find(o => o.id === objectiveId)
  }

  static getAllObjectives(): Objective[] {
    const data = localStorage.getItem(this.okrsKey)
    if (!data) return []
    return JSON.parse(data).map((o: any) => ({
      ...o,
      createdAt: new Date(o.createdAt),
      completedAt: o.completedAt ? new Date(o.completedAt) : undefined,
      keyResults: o.keyResults.map((kr: any) => ({
        ...kr,
        completedAt: kr.completedAt ? new Date(kr.completedAt) : undefined
      }))
    }))
  }

  static getObjectivesForProject(projectId: string): Objective[] {
    return this.getAllObjectives().filter(o => o.projectId === projectId)
  }

  static getObjectivesForPortfolio(portfolioId: string): Objective[] {
    return this.getAllObjectives().filter(o => o.portfolioId === portfolioId)
  }

  static getObjectivesForUser(userId: string): Objective[] {
    return this.getAllObjectives().filter(o => o.ownerId === userId)
  }

  static addKeyResult(
    objectiveId: string,
    name: string,
    target: number,
    unit: string,
    description?: string
  ): KeyResult {
    const okrs = this.getAllObjectives()
    const objective = okrs.find(o => o.id === objectiveId)
    if (!objective) throw new Error('Objective not found')

    const newKeyResult: KeyResult = {
      id: `kr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      target,
      current: 0,
      unit,
      completed: false
    }

    objective.keyResults.push(newKeyResult)
    objective.progress = this.calculateProgress(objective)
    this.saveObjectives(okrs)

    return newKeyResult
  }

  static updateKeyResult(
    objectiveId: string,
    keyResultId: string,
    updates: Partial<Omit<KeyResult, 'id'>>
  ): void {
    const okrs = this.getAllObjectives()
    const objective = okrs.find(o => o.id === objectiveId)
    if (!objective) return

    const keyResult = objective.keyResults.find(kr => kr.id === keyResultId)
    if (!keyResult) return

    Object.assign(keyResult, updates)
    
    if (updates.current !== undefined) {
      keyResult.completed = keyResult.current >= keyResult.target
      if (keyResult.completed && !keyResult.completedAt) {
        keyResult.completedAt = new Date()
      }
    }

    objective.progress = this.calculateProgress(objective)
    objective.completed = objective.progress === 100
    if (objective.completed && !objective.completedAt) {
      objective.completedAt = new Date()
    }

    this.saveObjectives(okrs)
  }

  static deleteKeyResult(objectiveId: string, keyResultId: string): void {
    const okrs = this.getAllObjectives()
    const objective = okrs.find(o => o.id === objectiveId)
    if (!objective) return

    objective.keyResults = objective.keyResults.filter(kr => kr.id !== keyResultId)
    objective.progress = this.calculateProgress(objective)
    this.saveObjectives(okrs)
  }

  static linkTaskToKeyResult(keyResultId: string, taskId: string): void {
    // Store in a separate mapping
    const mappingKey = 'ticktick_okr_task_mapping'
    const data = localStorage.getItem(mappingKey)
    const mapping: Record<string, string[]> = data ? JSON.parse(data) : {}
    
    if (!mapping[keyResultId]) {
      mapping[keyResultId] = []
    }
    if (!mapping[keyResultId].includes(taskId)) {
      mapping[keyResultId].push(taskId)
      localStorage.setItem(mappingKey, JSON.stringify(mapping))
    }
  }

  static getTasksForKeyResult(keyResultId: string): string[] {
    const mappingKey = 'ticktick_okr_task_mapping'
    const data = localStorage.getItem(mappingKey)
    if (!data) return []
    const mapping: Record<string, string[]> = JSON.parse(data)
    return mapping[keyResultId] || []
  }

  private static calculateProgress(objective: Objective): number {
    if (objective.keyResults.length === 0) return 0
    
    const totalProgress = objective.keyResults.reduce((sum, kr) => {
      const krProgress = Math.min((kr.current / kr.target) * 100, 100)
      return sum + krProgress
    }, 0)
    
    return totalProgress / objective.keyResults.length
  }

  private static saveObjectives(objectives: Objective[]): void {
    localStorage.setItem(this.okrsKey, JSON.stringify(objectives))
  }
}

