import { Task } from '../types/Task'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: Date
  progress: number
  maxProgress: number
}

export interface Streak {
  type: 'daily' | 'weekly'
  current: number
  longest: number
  lastDate: Date
}

export interface UserStats {
  level: number
  xp: number
  xpToNextLevel: number
  totalTasksCompleted: number
  achievements: Achievement[]
  streaks: {
    daily: Streak
    weekly: Streak
  }
  badges: string[]
}

export class GamificationService {
  private static statsKey = 'ticktick_gamification_stats'
  private static achievementsKey = 'ticktick_achievements'

  static getAchievements(): Achievement[] {
    return [
      {
        id: 'first_task',
        name: 'First Steps',
        description: 'Complete your first task',
        icon: '🎯',
        progress: 0,
        maxProgress: 1
      },
      {
        id: 'task_master',
        name: 'Task Master',
        description: 'Complete 10 tasks',
        icon: '⭐',
        progress: 0,
        maxProgress: 10
      },
      {
        id: 'productivity_king',
        name: 'Productivity King',
        description: 'Complete 100 tasks',
        icon: '👑',
        progress: 0,
        maxProgress: 100
      },
      {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Complete 5 tasks before 9 AM',
        icon: '🌅',
        progress: 0,
        maxProgress: 5
      },
      {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Complete 5 tasks after 10 PM',
        icon: '🦉',
        progress: 0,
        maxProgress: 5
      },
      {
        id: 'streak_7',
        name: 'Week Warrior',
        description: '7 day streak',
        icon: '🔥',
        progress: 0,
        maxProgress: 7
      },
      {
        id: 'streak_30',
        name: 'Month Master',
        description: '30 day streak',
        icon: '💪',
        progress: 0,
        maxProgress: 30
      },
      {
        id: 'organizer',
        name: 'Organizer',
        description: 'Create 10 lists',
        icon: '📋',
        progress: 0,
        maxProgress: 10
      },
      {
        id: 'tag_master',
        name: 'Tag Master',
        description: 'Use tags in 20 tasks',
        icon: '🏷️',
        progress: 0,
        maxProgress: 20
      },
      {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete 5 tasks in one day',
        icon: '⚡',
        progress: 0,
        maxProgress: 5
      }
    ]
  }

  static getUserStats(): UserStats {
    const data = localStorage.getItem(this.statsKey)
    if (!data) {
      return {
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        totalTasksCompleted: 0,
        achievements: this.getAchievements(),
        streaks: {
          daily: { type: 'daily', current: 0, longest: 0, lastDate: new Date(0) },
          weekly: { type: 'weekly', current: 0, longest: 0, lastDate: new Date(0) }
        },
        badges: []
      }
    }
    const parsed = JSON.parse(data)
    return {
      ...parsed,
      achievements: parsed.achievements.map((a: any) => ({
        ...a,
        unlockedAt: a.unlockedAt ? new Date(a.unlockedAt) : undefined
      })),
      streaks: {
        daily: {
          ...parsed.streaks.daily,
          lastDate: new Date(parsed.streaks.daily.lastDate)
        },
        weekly: {
          ...parsed.streaks.weekly,
          lastDate: new Date(parsed.streaks.weekly.lastDate)
        }
      }
    }
  }

  static saveUserStats(stats: UserStats): void {
    localStorage.setItem(this.statsKey, JSON.stringify(stats))
  }

  static addXP(amount: number): { levelUp: boolean; newLevel?: number } {
    const stats = this.getUserStats()
    stats.xp += amount
    stats.totalTasksCompleted++

    let levelUp = false
    while (stats.xp >= stats.xpToNextLevel) {
      stats.xp -= stats.xpToNextLevel
      stats.level++
      stats.xpToNextLevel = Math.floor(stats.xpToNextLevel * 1.5)
      levelUp = true
    }

    this.saveUserStats(stats)
    return { levelUp, newLevel: levelUp ? stats.level : undefined }
  }

  static updateStreak(tasksCompleted: Task[]): { daily: number; weekly: number } {
    const stats = this.getUserStats()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Daily streak
    if (stats.streaks.daily.lastDate.getTime() === yesterday.getTime()) {
      stats.streaks.daily.current++
    } else if (stats.streaks.daily.lastDate.getTime() !== today.getTime()) {
      stats.streaks.daily.current = 1
    }
    stats.streaks.daily.lastDate = today
    if (stats.streaks.daily.current > stats.streaks.daily.longest) {
      stats.streaks.daily.longest = stats.streaks.daily.current
    }

    // Weekly streak (tasks completed this week)
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const completedThisWeek = tasksCompleted.filter(t => {
      if (!t.completedAt) return false
      const completed = new Date(t.completedAt)
      completed.setHours(0, 0, 0, 0)
      return completed >= weekStart
    }).length

    if (completedThisWeek >= 5) {
      if (stats.streaks.weekly.lastDate < weekStart) {
        stats.streaks.weekly.current++
      }
      stats.streaks.weekly.lastDate = today
      if (stats.streaks.weekly.current > stats.streaks.weekly.longest) {
        stats.streaks.weekly.longest = stats.streaks.weekly.current
      }
    }

    this.saveUserStats(stats)
    return {
      daily: stats.streaks.daily.current,
      weekly: stats.streaks.weekly.current
    }
  }

  static checkAchievements(tasks: Task[], lists: any[]): Achievement[] {
    const stats = this.getUserStats()
    const completedTasks = tasks.filter(t => t.isCompleted)
    const now = new Date()
    const hour = now.getHours()

    // Update achievement progress
    stats.achievements.forEach(achievement => {
      if (achievement.unlockedAt) return // Already unlocked

      switch (achievement.id) {
        case 'first_task':
          achievement.progress = completedTasks.length > 0 ? 1 : 0
          break
        case 'task_master':
          achievement.progress = Math.min(completedTasks.length, 10)
          break
        case 'productivity_king':
          achievement.progress = Math.min(completedTasks.length, 100)
          break
        case 'early_bird':
          const earlyTasks = completedTasks.filter(t => {
            if (!t.completedAt) return false
            return new Date(t.completedAt).getHours() < 9
          })
          achievement.progress = Math.min(earlyTasks.length, 5)
          break
        case 'night_owl':
          const nightTasks = completedTasks.filter(t => {
            if (!t.completedAt) return false
            return new Date(t.completedAt).getHours() >= 22
          })
          achievement.progress = Math.min(nightTasks.length, 5)
          break
        case 'streak_7':
          achievement.progress = Math.min(stats.streaks.daily.current, 7)
          break
        case 'streak_30':
          achievement.progress = Math.min(stats.streaks.daily.current, 30)
          break
        case 'organizer':
          achievement.progress = Math.min(lists.length, 10)
          break
        case 'tag_master':
          const taggedTasks = tasks.filter(t => t.tags && t.tags.length > 0)
          achievement.progress = Math.min(taggedTasks.length, 20)
          break
        case 'speed_demon':
          const todayTasks = completedTasks.filter(t => {
            if (!t.completedAt) return false
            const completed = new Date(t.completedAt)
            return completed.toDateString() === now.toDateString()
          })
          achievement.progress = Math.min(todayTasks.length, 5)
          break
      }

      // Unlock if progress reached
      if (achievement.progress >= achievement.maxProgress && !achievement.unlockedAt) {
        achievement.unlockedAt = new Date()
        this.addXP(achievement.maxProgress * 10)
      }
    })

    this.saveUserStats(stats)
    return stats.achievements.filter(a => a.unlockedAt)
  }

  static getUnlockedAchievements(): Achievement[] {
    const stats = this.getUserStats()
    return stats.achievements.filter(a => a.unlockedAt)
  }
}

