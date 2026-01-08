import { Task, TaskList } from '../types/Task'
import { AutomationService } from './AutomationService'
import { SyncService } from './SyncService'
import { GamificationService } from './GamificationService'
import { NotificationSoundService } from './NotificationSoundService'
import { TaskHistoryService } from './TaskHistoryService'
import { toastService } from './ToastService'
import { PushNotificationService } from './PushNotificationService'
import { SocialService } from './SocialService'
import { LocalAuthService } from './LocalAuthService'

export class TaskManager {
  private tasksKey = 'ticktick_tasks'
  private listsKey = 'ticktick_lists'

  constructor() {
    this.initializeDefaultLists()
  }

  // Lists Management
  getLists(): TaskList[] {
    const data = localStorage.getItem(this.listsKey)
    if (!data) return []
    return JSON.parse(data).map((list: any) => ({
      ...list,
      id: list.id || this.generateId()
    }))
  }

  addList(list: Omit<TaskList, 'id'>): TaskList {
    const lists = this.getLists()
    const newList: TaskList = {
      ...list,
      id: this.generateId()
    }
    lists.push(newList)
    this.saveLists(lists)

    // Track sync change
    SyncService.addChange({
      type: 'create',
      entityType: 'list',
      entityId: newList.id,
      data: newList
    })

    return newList
  }

  deleteList(listId: string): void {
    const lists = this.getLists().filter(list => list.id !== listId)
    this.saveLists(lists)
    // Also delete tasks in this list
    const tasks = this.getTasks().filter(task => task.listId !== listId)
    this.saveTasks(tasks)

    // Track sync change
    SyncService.addChange({
      type: 'delete',
      entityType: 'list',
      entityId: listId
    })
  }

  getList(listId: string): TaskList | undefined {
    return this.getLists().find(list => list.id === listId)
  }

  // Tasks Management
  getTasks(): Task[] {
    const data = localStorage.getItem(this.tasksKey)
    if (!data) return []
    return JSON.parse(data).map((task: any) => ({
      ...task,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
      completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      reminderDate: task.reminderDate ? new Date(task.reminderDate) : undefined,
      tags: task.tags || [],
      subtasks: task.subtasks || []
    }))
  }

  getTasksForList(listId: string): Task[] {
    return this.getTasks().filter(task => task.listId === listId)
  }

  getTasksForToday(): Task[] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return this.getTasks().filter(task => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      taskDate.setHours(0, 0, 0, 0)
      return taskDate >= today && taskDate < tomorrow
    })
  }

  addTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
    // Show toast notification
    toastService.success(`Задача "${task.title}" создана`)
    
    // Play sound
    NotificationSoundService.playSound('task-created').catch(console.error)
    
    // Send push notification
    PushNotificationService.sendTaskNotification(task.title, 'created').catch(console.error)
    // Apply automation rules
    let processedTask = AutomationService.applyRules(task as Task)
    
    const tasks = this.getTasks()
    const newTask: Task = {
      ...processedTask,
      id: this.generateId(),
      createdAt: new Date()
    }
    tasks.push(newTask)
    this.saveTasks(tasks)

    // Track history
    TaskHistoryService.addEntry({
      taskId: newTask.id,
      action: 'created',
      changes: newTask
    })

    // Track sync change
    SyncService.addChange({
      type: 'create',
      entityType: 'task',
      entityId: newTask.id,
      data: newTask
    })

    return newTask
  }

  updateTask(updatedTask: Task): void {
    // Get old task for history
    const oldTask = this.getTasks().find(t => t.id === updatedTask.id)
    
    // Apply automation rules
    let processedTask = AutomationService.applyRules(updatedTask)
    
    const tasks = this.getTasks()
    const index = tasks.findIndex(task => task.id === processedTask.id)
    if (index !== -1) {
      tasks[index] = processedTask
      this.saveTasks(tasks)

      // Track history
      if (oldTask) {
        TaskHistoryService.addEntry({
          taskId: processedTask.id,
          action: 'updated',
          changes: processedTask
        })
      }

      // Track sync change
      SyncService.addChange({
        type: 'update',
        entityType: 'task',
        entityId: processedTask.id,
        data: processedTask
      })
    }
  }

  deleteTask(taskId: string): void {
    // Track history before deletion
    TaskHistoryService.addEntry({
      taskId,
      action: 'deleted'
    })

    const tasks = this.getTasks().filter(task => task.id !== taskId)
    this.saveTasks(tasks)

    // Track sync change
    SyncService.addChange({
      type: 'delete',
      entityType: 'task',
      entityId: taskId
    })
  }

  toggleTaskCompletion(task: Task): void {
    const wasCompleted = task.isCompleted
    const updatedTask: Task = {
      ...task,
      isCompleted: !task.isCompleted,
      completedAt: !task.isCompleted ? new Date() : undefined
    }
    this.updateTask(updatedTask)
    
    // Track history
    TaskHistoryService.addEntry({
      taskId: task.id,
      action: updatedTask.isCompleted ? 'completed' : 'uncompleted'
    })
    
    // Show toast and push notification
    if (!wasCompleted) {
      toastService.success(`Задача "${task.title}" выполнена!`)
      NotificationSoundService.playSound('task-complete').catch(console.error)
      PushNotificationService.sendTaskNotification(task.title, 'completed').catch(console.error)
    }

    // Gamification: Add XP and update streaks
    if (updatedTask.isCompleted) {
      GamificationService.addXP(10)
      const allTasks = this.getTasks()
      GamificationService.updateStreak(allTasks.filter(t => t.isCompleted))
      
      // Update social profile
      try {
        const currentUser = LocalAuthService.getCurrentUser()
        if (currentUser) {
          SocialService.incrementTasksCompleted(currentUser.id)
          
          // Update challenge progress
          const activeChallenges = SocialService.getActiveChallenges()
          activeChallenges.forEach(challenge => {
            if (challenge.type === 'tasks' && challenge.participants.includes(currentUser.id)) {
              const progress = SocialService.getChallengeProgress(challenge.id, currentUser.id)
              const newProgress = (progress?.currentProgress || 0) + 1
              SocialService.updateChallengeProgress(challenge.id, currentUser.id, newProgress)
            }
          })
        }
      } catch (error) {
        // Social service not available
      }
    }
  }

  // Private methods
  private initializeDefaultLists(): void {
    const lists = this.getLists()
    if (lists.length === 0) {
      const defaultLists: Omit<TaskList, 'id'>[] = [
        { name: 'Inbox', color: '#007AFF', icon: '📥' },
        { name: 'Today', color: '#FF9500', icon: '☀️' },
        { name: 'This Week', color: '#5856D6', icon: '📅' },
        { name: 'Personal', color: '#34C759', icon: '👤' },
        { name: 'Work', color: '#FF3B30', icon: '💼' }
      ]
      defaultLists.forEach(list => this.addList(list))
    }
  }

  private saveLists(lists: TaskList[]): void {
    localStorage.setItem(this.listsKey, JSON.stringify(lists))
  }

  private saveTasks(tasks: Task[]): void {
    localStorage.setItem(this.tasksKey, JSON.stringify(tasks))
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

