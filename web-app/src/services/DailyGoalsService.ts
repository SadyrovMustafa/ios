export interface DailyGoal {
  id: string
  date: string // YYYY-MM-DD
  targetTasks: number
  completedTasks: number
  createdAt: Date
}

export class DailyGoalsService {
  private static goalsKey = 'ticktick_daily_goals'

  static getGoalForDate(date: Date): DailyGoal | null {
    const dateStr = this.formatDate(date)
    const goals = this.getAllGoals()
    return goals.find(g => g.date === dateStr) || null
  }

  static setGoalForDate(date: Date, targetTasks: number): DailyGoal {
    const dateStr = this.formatDate(date)
    const goals = this.getAllGoals()
    const existingIndex = goals.findIndex(g => g.date === dateStr)

    const goal: DailyGoal = {
      id: existingIndex !== -1 ? goals[existingIndex].id : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: dateStr,
      targetTasks,
      completedTasks: existingIndex !== -1 ? goals[existingIndex].completedTasks : 0,
      createdAt: existingIndex !== -1 ? goals[existingIndex].createdAt : new Date()
    }

    if (existingIndex !== -1) {
      goals[existingIndex] = goal
    } else {
      goals.push(goal)
    }

    this.saveGoals(goals)
    return goal
  }

  static updateCompletedTasks(date: Date, completedTasks: number): void {
    const dateStr = this.formatDate(date)
    const goals = this.getAllGoals()
    const goal = goals.find(g => g.date === dateStr)

    if (goal) {
      goal.completedTasks = completedTasks
      this.saveGoals(goals)
    }
  }

  static getProgress(date: Date): number {
    const goal = this.getGoalForDate(date)
    if (!goal || goal.targetTasks === 0) return 0
    return Math.min((goal.completedTasks / goal.targetTasks) * 100, 100)
  }

  static getAllGoals(): DailyGoal[] {
    const data = localStorage.getItem(this.goalsKey)
    if (!data) return []
    return JSON.parse(data).map((g: any) => ({
      ...g,
      createdAt: new Date(g.createdAt)
    }))
  }

  static getGoalsForWeek(startDate: Date): DailyGoal[] {
    const goals = this.getAllGoals()
    const weekGoals: DailyGoal[] = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = this.formatDate(date)
      const goal = goals.find(g => g.date === dateStr)
      if (goal) {
        weekGoals.push(goal)
      }
    }

    return weekGoals
  }

  private static formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  private static saveGoals(goals: DailyGoal[]): void {
    localStorage.setItem(this.goalsKey, JSON.stringify(goals))
  }
}

