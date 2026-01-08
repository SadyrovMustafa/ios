import { Task, TaskList } from '../types/Task'

export interface ImportResult {
  tasks: Task[]
  lists: TaskList[]
  errors: string[]
}

export class ImportService {
  static async importFromTodoist(jsonData: any): Promise<ImportResult> {
    const tasks: Task[] = []
    const lists: TaskList[] = []
    const errors: string[] = []

    try {
      // Todoist export format
      if (jsonData.projects) {
        jsonData.projects.forEach((project: any) => {
          lists.push({
            id: `imported-${project.id}`,
            name: project.name,
            color: project.color || '#007AFF',
            icon: '📋'
          })
        })
      }

      if (jsonData.items) {
        jsonData.items.forEach((item: any) => {
          const listId = lists.find(l => l.id === `imported-${item.project_id}`)?.id || lists[0]?.id || ''
          tasks.push({
            id: `imported-${item.id}`,
            title: item.content,
            notes: item.description || '',
            isCompleted: item.checked === 1,
            dueDate: item.due_date ? new Date(item.due_date.date) : undefined,
            priority: this.mapTodoistPriority(item.priority),
            listId,
            createdAt: new Date(item.added_at),
            completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
            tags: item.labels || []
          })
        })
      }
    } catch (error: any) {
      errors.push(`Todoist import error: ${error.message}`)
    }

    return { tasks, lists, errors }
  }

  static async importFromAsana(jsonData: any): Promise<ImportResult> {
    const tasks: Task[] = []
    const lists: TaskList[] = []
    const errors: string[] = []

    try {
      // Asana export format
      if (jsonData.data) {
        jsonData.data.forEach((task: any) => {
          tasks.push({
            id: `imported-${task.gid}`,
            title: task.name,
            notes: task.notes || '',
            isCompleted: task.completed || false,
            dueDate: task.due_on ? new Date(task.due_on) : undefined,
            priority: 'none',
            listId: task.projects?.[0]?.gid ? `imported-${task.projects[0].gid}` : '',
            createdAt: new Date(task.created_at),
            completedAt: task.completed_at ? new Date(task.completed_at) : undefined
          })
        })
      }
    } catch (error: any) {
      errors.push(`Asana import error: ${error.message}`)
    }

    return { tasks, lists, errors }
  }

  static async importFromTrello(jsonData: any): Promise<ImportResult> {
    const tasks: Task[] = []
    const lists: TaskList[] = []
    const errors: string[] = []

    try {
      // Trello export format
      if (jsonData.lists) {
        jsonData.lists.forEach((list: any) => {
          lists.push({
            id: `imported-${list.id}`,
            name: list.name,
            color: '#007AFF',
            icon: '📋'
          })
        })
      }

      if (jsonData.cards) {
        jsonData.cards.forEach((card: any) => {
          const listId = lists.find(l => l.id === `imported-${card.idList}`)?.id || lists[0]?.id || ''
          tasks.push({
            id: `imported-${card.id}`,
            title: card.name,
            notes: card.desc || '',
            isCompleted: card.closed || false,
            dueDate: card.due ? new Date(card.due) : undefined,
            priority: card.labels?.find((l: any) => l.color === 'red') ? 'high' : 'none',
            listId,
            createdAt: new Date(card.dateLastActivity),
            tags: card.labels?.map((l: any) => l.name) || []
          })
        })
      }
    } catch (error: any) {
      errors.push(`Trello import error: ${error.message}`)
    }

    return { tasks, lists, errors }
  }

  private static mapTodoistPriority(priority: number): 'none' | 'low' | 'medium' | 'high' {
    // Todoist: 1 = normal, 2 = high, 3 = urgent, 4 = very urgent
    if (priority >= 3) return 'high'
    if (priority === 2) return 'medium'
    if (priority === 1) return 'low'
    return 'none'
  }
}

