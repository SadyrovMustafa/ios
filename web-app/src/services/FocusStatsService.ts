export interface FocusSession {
  id: string
  taskId?: string
  startTime: Date
  endTime?: Date
  duration: number // в миллисекундах
  notes?: string
}

export class FocusStatsService {
  private static sessionsKey = 'ticktick_focus_sessions'

  static startSession(taskId?: string): FocusSession {
    const sessions = this.getAllSessions()
    const activeSession = sessions.find(s => !s.endTime)
    
    if (activeSession) {
      // Завершить предыдущую сессию
      this.endSession(activeSession.id)
    }

    const newSession: FocusSession = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      startTime: new Date(),
      duration: 0
    }
    sessions.push(newSession)
    this.saveSessions(sessions)
    return newSession
  }

  static endSession(sessionId: string): FocusSession | null {
    const sessions = this.getAllSessions()
    const session = sessions.find(s => s.id === sessionId)
    
    if (!session || session.endTime) return null

    session.endTime = new Date()
    session.duration = session.endTime.getTime() - session.startTime.getTime()
    this.saveSessions(sessions)
    return session
  }

  static getActiveSession(): FocusSession | null {
    return this.getAllSessions().find(s => !s.endTime) || null
  }

  static getAllSessions(): FocusSession[] {
    const data = localStorage.getItem(this.sessionsKey)
    if (!data) return []
    return JSON.parse(data).map((s: any) => ({
      ...s,
      startTime: new Date(s.startTime),
      endTime: s.endTime ? new Date(s.endTime) : undefined
    }))
  }

  static getSessionsForDate(date: Date): FocusSession[] {
    const dateStr = this.formatDate(date)
    return this.getAllSessions().filter(s => {
      const sessionDate = this.formatDate(s.startTime)
      return sessionDate === dateStr && s.endTime
    })
  }

  static getSessionsForTask(taskId: string): FocusSession[] {
    return this.getAllSessions().filter(s => s.taskId === taskId && s.endTime)
  }

  static getTotalFocusTime(date: Date): number {
    const sessions = this.getSessionsForDate(date)
    return sessions.reduce((total, session) => total + session.duration, 0)
  }

  static getTotalFocusTimeForTask(taskId: string): number {
    const sessions = this.getSessionsForTask(taskId)
    return sessions.reduce((total, session) => total + session.duration, 0)
  }

  static getAverageSessionDuration(days: number = 7): number {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const sessions = this.getAllSessions().filter(s => {
      if (!s.endTime) return false
      return s.startTime >= startDate && s.startTime <= endDate
    })

    if (sessions.length === 0) return 0

    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0)
    return totalDuration / sessions.length
  }

  static getFocusStreak(): number {
    const sessions = this.getAllSessions()
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = this.formatDate(checkDate)
      
      const hasSession = sessions.some(s => {
        if (!s.endTime) return false
        const sessionDate = this.formatDate(s.startTime)
        return sessionDate === dateStr && s.duration > 0
      })

      if (hasSession) {
        streak++
      } else if (i > 0) {
        break
      }
    }

    return streak
  }

  private static formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  private static saveSessions(sessions: FocusSession[]): void {
    localStorage.setItem(this.sessionsKey, JSON.stringify(sessions))
  }
}

