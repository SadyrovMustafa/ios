export interface TimeEstimate {
  taskId: string
  estimatedMinutes: number
  actualMinutes: number
  startedAt?: Date
  completedAt?: Date
  sessions: TimeSession[]
}

export interface TimeSession {
  id: string
  startTime: Date
  endTime?: Date
  duration: number // в миллисекундах
}

export class TimeEstimateService {
  private static estimatesKey = 'ticktick_time_estimates'

  static setEstimate(taskId: string, estimatedMinutes: number): void {
    const estimates = this.getAllEstimates()
    const existing = estimates.find(e => e.taskId === taskId)

    if (existing) {
      existing.estimatedMinutes = estimatedMinutes
    } else {
      estimates.push({
        taskId,
        estimatedMinutes,
        actualMinutes: 0,
        sessions: []
      })
    }

    this.saveEstimates(estimates)
  }

  static startTracking(taskId: string): void {
    const estimates = this.getAllEstimates()
    let estimate = estimates.find(e => e.taskId === taskId)

    if (!estimate) {
      estimate = {
        taskId,
        estimatedMinutes: 0,
        actualMinutes: 0,
        sessions: []
      }
      estimates.push(estimate)
    }

    // Завершить предыдущую сессию, если есть активная
    const activeSession = estimate.sessions.find(s => !s.endTime)
    if (activeSession) {
      activeSession.endTime = new Date()
      activeSession.duration = activeSession.endTime.getTime() - activeSession.startTime.getTime()
    }

    // Начать новую сессию
    const newSession: TimeSession = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date(),
      duration: 0
    }
    estimate.sessions.push(newSession)
    estimate.startedAt = newSession.startTime

    this.saveEstimates(estimates)
  }

  static stopTracking(taskId: string): void {
    const estimates = this.getAllEstimates()
    const estimate = estimates.find(e => e.taskId === taskId)

    if (!estimate) return

    const activeSession = estimate.sessions.find(s => !s.endTime)
    if (activeSession) {
      activeSession.endTime = new Date()
      activeSession.duration = activeSession.endTime.getTime() - activeSession.startTime.getTime()
      
      // Обновить общее время
      estimate.actualMinutes = Math.round(
        estimate.sessions.reduce((sum, s) => sum + s.duration, 0) / (1000 * 60)
      )
      estimate.completedAt = activeSession.endTime
    }

    this.saveEstimates(estimates)
  }

  static getEstimate(taskId: string): TimeEstimate | null {
    return this.getAllEstimates().find(e => e.taskId === taskId) || null
  }

  static getAllEstimates(): TimeEstimate[] {
    const data = localStorage.getItem(this.estimatesKey)
    if (!data) return []
    return JSON.parse(data).map((e: any) => ({
      ...e,
      startedAt: e.startedAt ? new Date(e.startedAt) : undefined,
      completedAt: e.completedAt ? new Date(e.completedAt) : undefined,
      sessions: e.sessions.map((s: any) => ({
        ...s,
        startTime: new Date(s.startTime),
        endTime: s.endTime ? new Date(s.endTime) : undefined
      }))
    }))
  }

  static getTotalTimeForTask(taskId: string): number {
    const estimate = this.getEstimate(taskId)
    if (!estimate) return 0

    const activeSession = estimate.sessions.find(s => !s.endTime)
    let totalMs = estimate.sessions
      .filter(s => s.endTime)
      .reduce((sum, s) => sum + s.duration, 0)

    if (activeSession) {
      totalMs += Date.now() - activeSession.startTime.getTime()
    }

    return Math.round(totalMs / (1000 * 60)) // в минутах
  }

  static formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}м`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`
  }

  private static saveEstimates(estimates: TimeEstimate[]): void {
    localStorage.setItem(this.estimatesKey, JSON.stringify(estimates))
  }
}

