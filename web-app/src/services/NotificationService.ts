import { Task } from '../types/Task'
import { LocalAuthService } from './LocalAuthService'
import { PushNotificationService } from './PushNotificationService'
import { TaskAssignmentService } from './TaskAssignmentService'

export type NotificationType = 
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'task_completed'
  | 'comment_added'
  | 'task_assigned'
  | 'mention'
  | 'project_updated'
  | 'sprint_started'
  | 'sprint_ended'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  createdAt: Date
}

export class NotificationService {
  private static notificationsKey = 'ticktick_notifications'
  private static settingsKey = 'ticktick_notification_settings'

  static createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Notification {
    const notifications = this.getAllNotifications()
    const newNotification: Notification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: new Date()
    }
    notifications.push(newNotification)
    this.saveNotifications(notifications)

    // Send push notification if enabled
    const settings = this.getSettings(userId)
    if (settings[type] !== false) {
      PushNotificationService.sendNotification(title, {
        body: message,
        data: { ...data, notificationId: newNotification.id, type }
      }).catch(console.error)
    }

    return newNotification
  }

  static notifyTaskCreated(task: Task, createdBy: string): void {
    // Notify all users in shared lists (if implemented)
    const users = LocalAuthService.getAllUsers()
    users.forEach(user => {
      if (user.id !== createdBy) {
        this.createNotification(
          user.id,
          'task_created',
          'Новая задача создана',
          `Создана задача: ${task.title}`,
          { taskId: task.id, listId: task.listId }
        )
      }
    })
  }

  static notifyTaskUpdated(task: Task, updatedBy: string): void {
    const assignment = TaskAssignmentService.getAssignment(task.id)
    if (assignment && assignment.assignedTo !== updatedBy) {
      this.createNotification(
        assignment.assignedTo,
        'task_updated',
        'Задача обновлена',
        `Задача "${task.title}" была обновлена`,
        { taskId: task.id }
      )
    }
  }

  static notifyTaskDeleted(taskTitle: string, deletedBy: string): void {
    const users = LocalAuthService.getAllUsers()
    users.forEach(user => {
      if (user.id !== deletedBy) {
        this.createNotification(
          user.id,
          'task_deleted',
          'Задача удалена',
          `Задача "${taskTitle}" была удалена`,
          {}
        )
      }
    })
  }

  static notifyTaskCompleted(task: Task, completedBy: string): void {
    const assignment = TaskAssignmentService.getAssignment(task.id)
    if (assignment && assignment.assignedBy !== completedBy) {
      this.createNotification(
        assignment.assignedBy,
        'task_completed',
        'Задача выполнена',
        `Задача "${task.title}" выполнена`,
        { taskId: task.id }
      )
    }
  }

  static notifyCommentAdded(taskId: string, taskTitle: string, commentBy: string): void {
    const assignment = TaskAssignmentService.getAssignment(taskId)
    if (assignment && assignment.assignedTo !== commentBy) {
      this.createNotification(
        assignment.assignedTo,
        'comment_added',
        'Новый комментарий',
        `Новый комментарий к задаче "${taskTitle}"`,
        { taskId }
      )
    }
  }

  static notifyMention(userId: string, mentionedBy: string, context: string): void {
    this.createNotification(
      userId,
      'mention',
      'Вас упомянули',
      `${LocalAuthService.getUserById(mentionedBy)?.name || 'Кто-то'} упомянул вас: ${context}`,
      { mentionedBy }
    )
  }

  static getNotificationsForUser(userId: string): Notification[] {
    return this.getAllNotifications()
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  static getUnreadCount(userId: string): number {
    return this.getNotificationsForUser(userId).filter(n => !n.read).length
  }

  static markAsRead(notificationId: string): void {
    const notifications = this.getAllNotifications()
    const notification = notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      this.saveNotifications(notifications)
    }
  }

  static markAllAsRead(userId: string): void {
    const notifications = this.getAllNotifications()
    notifications.forEach(n => {
      if (n.userId === userId && !n.read) {
        n.read = true
      }
    })
    this.saveNotifications(notifications)
  }

  static deleteNotification(notificationId: string): void {
    const notifications = this.getAllNotifications().filter(n => n.id !== notificationId)
    this.saveNotifications(notifications)
  }

  static getSettings(userId: string): Record<NotificationType, boolean> {
    const data = localStorage.getItem(`${this.settingsKey}_${userId}`)
    if (!data) {
      // Default: all enabled
      return {
        task_created: true,
        task_updated: true,
        task_deleted: true,
        task_completed: true,
        comment_added: true,
        task_assigned: true,
        mention: true,
        project_updated: true,
        sprint_started: true,
        sprint_ended: true
      }
    }
    return JSON.parse(data)
  }

  static updateSettings(userId: string, settings: Partial<Record<NotificationType, boolean>>): void {
    const current = this.getSettings(userId)
    const updated = { ...current, ...settings }
    localStorage.setItem(`${this.settingsKey}_${userId}`, JSON.stringify(updated))
  }

  private static getAllNotifications(): Notification[] {
    const data = localStorage.getItem(this.notificationsKey)
    if (!data) return []
    return JSON.parse(data).map((n: any) => ({
      ...n,
      createdAt: new Date(n.createdAt)
    }))
  }

  private static saveNotifications(notifications: Notification[]): void {
    localStorage.setItem(this.notificationsKey, JSON.stringify(notifications))
  }
}
