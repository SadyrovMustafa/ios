import { Task, TaskList } from '../types/Task'

export class ArchiveService {
  private static archivedTasksKey = 'ticktick_archived_tasks'
  private static archivedListsKey = 'ticktick_archived_lists'

  static archiveTask(task: Task): void {
    const archived = this.getArchivedTasks()
    archived.push({
      ...task,
      archivedAt: new Date()
    })
    localStorage.setItem(this.archivedTasksKey, JSON.stringify(archived))
  }

  static archiveList(list: TaskList): void {
    const archived = this.getArchivedLists()
    archived.push({
      ...list,
      archivedAt: new Date()
    })
    localStorage.setItem(this.archivedListsKey, JSON.stringify(archived))
  }

  static getArchivedTasks(): Array<Task & { archivedAt: Date }> {
    const data = localStorage.getItem(this.archivedTasksKey)
    if (!data) return []
    return JSON.parse(data).map((t: any) => ({
      ...t,
      archivedAt: new Date(t.archivedAt),
      createdAt: new Date(t.createdAt),
      dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
      completedAt: t.completedAt ? new Date(t.completedAt) : undefined
    }))
  }

  static getArchivedLists(): Array<TaskList & { archivedAt: Date }> {
    const data = localStorage.getItem(this.archivedListsKey)
    if (!data) return []
    return JSON.parse(data).map((l: any) => ({
      ...l,
      archivedAt: new Date(l.archivedAt)
    }))
  }

  static restoreTask(taskId: string): Task | null {
    const archived = this.getArchivedTasks()
    const task = archived.find(t => t.id === taskId)
    if (task) {
      const { archivedAt, ...restoredTask } = task
      const updated = archived.filter(t => t.id !== taskId)
      localStorage.setItem(this.archivedTasksKey, JSON.stringify(updated))
      return restoredTask
    }
    return null
  }

  static restoreList(listId: string): TaskList | null {
    const archived = this.getArchivedLists()
    const list = archived.find(l => l.id === listId)
    if (list) {
      const { archivedAt, ...restoredList } = list
      const updated = archived.filter(l => l.id !== listId)
      localStorage.setItem(this.archivedListsKey, JSON.stringify(updated))
      return restoredList
    }
    return null
  }

  static deleteArchivedTask(taskId: string): void {
    const archived = this.getArchivedTasks()
    const updated = archived.filter(t => t.id !== taskId)
    localStorage.setItem(this.archivedTasksKey, JSON.stringify(updated))
  }

  static deleteArchivedList(listId: string): void {
    const archived = this.getArchivedLists()
    const updated = archived.filter(l => l.id !== listId)
    localStorage.setItem(this.archivedListsKey, JSON.stringify(updated))
  }
}

