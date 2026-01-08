import { Task } from '../types/Task'
import { LocalAuthService } from './LocalAuthService'
import { TaskAssignmentService } from './TaskAssignmentService'
import { NotificationService } from './NotificationService'

export interface ActivityRecord {
  id: string
  userId: string
  userName: string
  type: 'task_created' | 'task_completed' | 'task_updated' | 'comment_added' | 'task_assigned'
  taskId?: string
  taskTitle?: string
  timestamp: Date
}

export interface TeamStatistics {
  totalTasks: number
  completedTasks: number
  activeUsers: number
  tasksByUser: Record<string, { created: number; completed: number; assigned: number }>
  activityByDay: Record<string, number>
  topPerformers: Array<{ userId: string; userName: string; completed: number }>
}

export class TeamActivityService {
  private static activitiesKey = 'ticktick_team_activities'

  static recordActivity(
    userId: string,
    type: ActivityRecord['type'],
    taskId?: string,
    taskTitle?: string
  ): ActivityRecord {
    const user = LocalAuthService.getUserById(userId)
    const activities = this.getAllActivities()
    
    const newActivity: ActivityRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName: user?.name || 'Unknown',
      type,
      taskId,
      taskTitle,
      timestamp: new Date()
    }
    
    activities.push(newActivity)
    // Keep only last 1000 activities
    if (activities.length > 1000) {
      activities.splice(0, activities.length - 1000)
    }
    this.saveActivities(activities)

    return newActivity
  }

  static getActivities(limit: number = 50): ActivityRecord[] {
    return this.getAllActivities()
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  static getActivitiesForUser(userId: string, limit: number = 50): ActivityRecord[] {
    return this.getAllActivities()
      .filter(a => a.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  static getStatistics(tasks: Task[]): TeamStatistics {
    const activities = this.getAllActivities()
    const users = LocalAuthService.getAllUsers()
    const assignments = TaskAssignmentService.getAllAssignments()
    
    const stats: TeamStatistics = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.isCompleted).length,
      activeUsers: new Set(activities.map(a => a.userId)).size,
      tasksByUser: {},
      activityByDay: {},
      topPerformers: []
    }

    // Tasks by user
    users.forEach(user => {
      stats.tasksByUser[user.id] = {
        created: activities.filter(a => a.userId === user.id && a.type === 'task_created').length,
        completed: activities.filter(a => a.userId === user.id && a.type === 'task_completed').length,
        assigned: assignments.filter(a => a.assignedTo === user.id).length
      }
    })

    // Activity by day
    activities.forEach(activity => {
      const day = activity.timestamp.toISOString().split('T')[0]
      stats.activityByDay[day] = (stats.activityByDay[day] || 0) + 1
    })

    // Top performers
    const completedByUser: Record<string, number> = {}
    activities
      .filter(a => a.type === 'task_completed')
      .forEach(a => {
        completedByUser[a.userId] = (completedByUser[a.userId] || 0) + 1
      })

    stats.topPerformers = Object.entries(completedByUser)
      .map(([userId, completed]) => ({
        userId,
        userName: LocalAuthService.getUserById(userId)?.name || 'Unknown',
        completed
      }))
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 10)

    return stats
  }

  static getActivityChartData(days: number = 30): Array<{ date: string; count: number }> {
    const activities = this.getAllActivities()
    const now = new Date()
    const data: Record<string, number> = {}

    for (let i = 0; i < days; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      data[dateStr] = 0
    }

    activities.forEach(activity => {
      const dateStr = activity.timestamp.toISOString().split('T')[0]
      if (data.hasOwnProperty(dateStr)) {
        data[dateStr]++
      }
    })

    return Object.entries(data)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  private static getAllActivities(): ActivityRecord[] {
    const data = localStorage.getItem(this.activitiesKey)
    if (!data) return []
    return JSON.parse(data).map((a: any) => ({
      ...a,
      timestamp: new Date(a.timestamp)
    }))
  }

  private static saveActivities(activities: ActivityRecord[]): void {
    localStorage.setItem(this.activitiesKey, JSON.stringify(activities))
  }
}

