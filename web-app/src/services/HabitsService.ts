export interface Habit {
  id: string
  name: string
  description?: string
  color: string
  icon: string
  createdAt: Date
  streak: number
  longestStreak: number
  lastCompletedDate?: string // YYYY-MM-DD
}

export interface HabitCompletion {
  id: string
  habitId: string
  date: string // YYYY-MM-DD
  completedAt: Date
}

export class HabitsService {
  private static habitsKey = 'ticktick_habits'
  private static completionsKey = 'ticktick_habit_completions'

  static addHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'streak' | 'longestStreak'>): Habit {
    const habits = this.getAllHabits()
    const newHabit: Habit = {
      ...habit,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      streak: 0,
      longestStreak: 0
    }
    habits.push(newHabit)
    this.saveHabits(habits)
    return newHabit
  }

  static updateHabit(habit: Habit): void {
    const habits = this.getAllHabits()
    const index = habits.findIndex(h => h.id === habit.id)
    if (index !== -1) {
      habits[index] = habit
      this.saveHabits(habits)
    }
  }

  static deleteHabit(habitId: string): void {
    const habits = this.getAllHabits().filter(h => h.id !== habitId)
    this.saveHabits(habits)
    
    // Удалить все завершения
    const completions = this.getAllCompletions().filter(c => c.habitId !== habitId)
    this.saveCompletions(completions)
  }

  static completeHabit(habitId: string, date: Date = new Date()): void {
    const dateStr = this.formatDate(date)
    const completions = this.getAllCompletions()
    
    // Проверить, не завершена ли уже сегодня
    const todayCompletion = completions.find(
      c => c.habitId === habitId && c.date === dateStr
    )
    if (todayCompletion) return

    // Добавить завершение
    const completion: HabitCompletion = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      habitId,
      date: dateStr,
      completedAt: date
    }
    completions.push(completion)
    this.saveCompletions(completions)

    // Обновить стрик
    const habit = this.getHabit(habitId)
    if (habit) {
      const yesterday = new Date(date)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = this.formatDate(yesterday)

      if (habit.lastCompletedDate === yesterdayStr) {
        // Продолжение стрика
        habit.streak += 1
      } else if (habit.lastCompletedDate !== dateStr) {
        // Новый стрик
        habit.streak = 1
      }

      if (habit.streak > habit.longestStreak) {
        habit.longestStreak = habit.streak
      }

      habit.lastCompletedDate = dateStr
      this.updateHabit(habit)
    }
  }

  static uncompleteHabit(habitId: string, date: Date = new Date()): void {
    const dateStr = this.formatDate(date)
    const completions = this.getAllCompletions()
    const filtered = completions.filter(
      c => !(c.habitId === habitId && c.date === dateStr)
    )
    this.saveCompletions(filtered)

    // Обновить стрик
    const habit = this.getHabit(habitId)
    if (habit && habit.lastCompletedDate === dateStr) {
      habit.streak = Math.max(0, habit.streak - 1)
      this.updateHabit(habit)
    }
  }

  static isHabitCompleted(habitId: string, date: Date = new Date()): boolean {
    const dateStr = this.formatDate(date)
    const completions = this.getAllCompletions()
    return completions.some(c => c.habitId === habitId && c.date === dateStr)
  }

  static getHabit(habitId: string): Habit | null {
    return this.getAllHabits().find(h => h.id === habitId) || null
  }

  static getAllHabits(): Habit[] {
    const data = localStorage.getItem(this.habitsKey)
    if (!data) return []
    return JSON.parse(data).map((h: any) => ({
      ...h,
      createdAt: new Date(h.createdAt)
    }))
  }

  static getCompletionsForHabit(habitId: string, startDate: Date, endDate: Date): HabitCompletion[] {
    const completions = this.getAllCompletions()
    return completions.filter(c => {
      if (c.habitId !== habitId) return false
      const completionDate = new Date(c.date)
      return completionDate >= startDate && completionDate <= endDate
    })
  }

  static getAllCompletions(): HabitCompletion[] {
    const data = localStorage.getItem(this.completionsKey)
    if (!data) return []
    return JSON.parse(data).map((c: any) => ({
      ...c,
      completedAt: new Date(c.completedAt)
    }))
  }

  private static formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  private static saveHabits(habits: Habit[]): void {
    localStorage.setItem(this.habitsKey, JSON.stringify(habits))
  }

  private static saveCompletions(completions: HabitCompletion[]): void {
    localStorage.setItem(this.completionsKey, JSON.stringify(completions))
  }
}

