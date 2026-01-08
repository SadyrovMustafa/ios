import { Task, TaskList } from '../types/Task'
import * as XLSX from 'xlsx'

export class ExportImportService {
  static exportTasks(tasks: Task[], lists: TaskList[]): string {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      tasks: tasks.map(task => ({
        ...task,
        dueDate: task.dueDate?.toISOString(),
        createdAt: task.createdAt.toISOString(),
        completedAt: task.completedAt?.toISOString(),
        reminderDate: task.reminderDate?.toISOString()
      })),
      lists
    }

    return JSON.stringify(data, null, 2)
  }

  static exportToCSV(tasks: Task[]): string {
    const headers = ['Title', 'Notes', 'Priority', 'Status', 'Due Date', 'List', 'Tags', 'Created']
    const rows = tasks.map(task => [
      task.title,
      task.notes,
      task.priority,
      task.isCompleted ? 'Completed' : 'Active',
      task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
      '', // List name would need to be resolved
      task.tags?.join(', ') || '',
      new Date(task.createdAt).toLocaleDateString()
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    return csvContent
  }

  static importTasks(jsonData: string): { tasks: Task[]; lists: TaskList[] } {
    try {
      const data = JSON.parse(jsonData)

      if (!data.tasks || !Array.isArray(data.tasks)) {
        throw new Error('Invalid data format')
      }

      const tasks: Task[] = data.tasks.map((task: any) => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        reminderDate: task.reminderDate ? new Date(task.reminderDate) : undefined,
        tags: task.tags || [],
        subtasks: task.subtasks || []
      }))

      const lists: TaskList[] = data.lists || []

      return { tasks, lists }
    } catch (error) {
      throw new Error(`Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  static exportToMarkdown(tasks: Task[], lists: TaskList[]): string {
    const format = (date: Date | undefined) => {
      if (!date) return ''
      return new Date(date).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    let markdown = `# TickTick Export\n\n`
    markdown += `**Дата экспорта:** ${new Date().toLocaleDateString('ru-RU')}\n\n`
    markdown += `**Всего задач:** ${tasks.length}\n\n`
    markdown += `---\n\n`

    // Group by lists
    const tasksByList = new Map<string, Task[]>()
    tasks.forEach(task => {
      const listTasks = tasksByList.get(task.listId) || []
      listTasks.push(task)
      tasksByList.set(task.listId, listTasks)
    })

    lists.forEach(list => {
      const listTasks = tasksByList.get(list.id) || []
      if (listTasks.length === 0) return

      markdown += `## ${list.icon} ${list.name}\n\n`

      listTasks.forEach(task => {
        const status = task.isCompleted ? '✅' : '⬜'
        const priority = task.priority !== 'none' ? ` [${task.priority}]` : ''
        
        markdown += `### ${status} ${task.title}${priority}\n\n`

        if (task.notes) {
          markdown += `${task.notes}\n\n`
        }

        if (task.dueDate) {
          markdown += `**Срок:** ${format(task.dueDate)}\n\n`
        }

        if (task.tags && task.tags.length > 0) {
          markdown += `**Теги:** ${task.tags.map(t => `\`${t}\``).join(', ')}\n\n`
        }

        if (task.subtasks && task.subtasks.length > 0) {
          markdown += `**Подзадачи:**\n`
          task.subtasks.forEach(subtask => {
            const subtaskStatus = subtask.isCompleted ? '✅' : '⬜'
            markdown += `- ${subtaskStatus} ${subtask.title}\n`
          })
          markdown += `\n`
        }

        markdown += `**Создано:** ${format(task.createdAt)}\n\n`
        if (task.completedAt) {
          markdown += `**Завершено:** ${format(task.completedAt)}\n\n`
        }

        markdown += `---\n\n`
      })
    })

    return markdown
  }

  static exportTasksToFile(tasks: Task[], lists: TaskList[], format: 'json' | 'csv' | 'markdown' = 'json') {
    let content: string
    let filename: string
    let mimeType: string

    if (format === 'json') {
      content = this.exportTasks(tasks, lists)
      filename = `ticktick-export-${new Date().toISOString().split('T')[0]}.json`
      mimeType = 'application/json'
    } else if (format === 'csv') {
      content = this.exportToCSV(tasks)
      filename = `ticktick-export-${new Date().toISOString().split('T')[0]}.csv`
      mimeType = 'text/csv'
    } else {
      content = this.exportToMarkdown(tasks, lists)
      filename = `ticktick-export-${new Date().toISOString().split('T')[0]}.md`
      mimeType = 'text/markdown'
    }

    this.downloadFile(content, filename, mimeType)
  }

  static importTasksFromFile(file: File): Promise<{ tasks: Task[]; lists: TaskList[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const result = this.importTasks(content)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }

      reader.readAsText(file)
    })
  }
}

