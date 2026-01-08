import { Task, Priority } from '../types/Task'

export interface TaskTemplate {
  id: string
  name: string
  description?: string
  template: TaskTemplateData
  variables: TemplateVariable[]
  createdAt: Date
  usedCount: number
}

export interface TaskTemplateData {
  title: string
  notes?: string
  priority?: Priority
  tags?: string[]
  dueDate?: string // Template string like "{{date}}"
  reminderDate?: string
  subtasks?: string[] // Array of template strings
}

export interface TemplateVariable {
  name: string
  label: string
  type: 'text' | 'date' | 'number' | 'select'
  defaultValue?: string
  options?: string[] // For select type
  required?: boolean
}

export class TemplateService {
  private static templatesKey = 'ticktick_task_templates'

  static getTemplates(): TaskTemplate[] {
    const data = localStorage.getItem(this.templatesKey)
    if (!data) return []
    return JSON.parse(data).map((t: any) => ({
      ...t,
      createdAt: new Date(t.createdAt)
    }))
  }

  static addTemplate(template: Omit<TaskTemplate, 'id' | 'createdAt' | 'usedCount'>): TaskTemplate {
    const templates = this.getTemplates()
    const newTemplate: TaskTemplate = {
      ...template,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      usedCount: 0
    }
    templates.push(newTemplate)
    this.saveTemplates(templates)
    return newTemplate
  }

  static updateTemplate(templateId: string, updates: Partial<TaskTemplate>): void {
    const templates = this.getTemplates()
    const index = templates.findIndex(t => t.id === templateId)
    if (index !== -1) {
      templates[index] = { ...templates[index], ...updates }
      this.saveTemplates(templates)
    }
  }

  static deleteTemplate(templateId: string): void {
    const templates = this.getTemplates().filter(t => t.id !== templateId)
    this.saveTemplates(templates)
  }

  static getTemplate(templateId: string): TaskTemplate | undefined {
    return this.getTemplates().find(t => t.id === templateId)
  }

  static processTemplate(template: TaskTemplate, variableValues: Record<string, string>): Omit<Task, 'id' | 'createdAt'> {
    const { template: templateData } = template

    // Process title
    let title = this.replaceVariables(templateData.title, variableValues)

    // Process notes
    let notes = templateData.notes ? this.replaceVariables(templateData.notes, variableValues) : undefined

    // Process due date
    let dueDate: Date | undefined
    if (templateData.dueDate) {
      const dateStr = this.replaceVariables(templateData.dueDate, variableValues)
      dueDate = this.parseDate(dateStr)
    }

    // Process reminder date
    let reminderDate: Date | undefined
    if (templateData.reminderDate) {
      const dateStr = this.replaceVariables(templateData.reminderDate, variableValues)
      reminderDate = this.parseDate(dateStr)
    }

    // Process tags
    const tags = templateData.tags?.map(tag => this.replaceVariables(tag, variableValues))

    // Process subtasks
    const subtasks = templateData.subtasks?.map(subtask => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: this.replaceVariables(subtask, variableValues),
      isCompleted: false,
      createdAt: new Date()
    }))

    // Increment usage count
    this.incrementUsageCount(template.id)

    return {
      title,
      notes,
      priority: templateData.priority || Priority.None,
      tags,
      dueDate,
      reminderDate,
      subtasks,
      isCompleted: false,
      listId: '', // Will be set by caller
      completedAt: undefined
    }
  }

  private static replaceVariables(text: string, values: Record<string, string>): string {
    let result = text
    // Replace {{variable}} with values
    result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return values[varName] || match
    })
    return result
  }

  private static parseDate(dateStr: string): Date | undefined {
    if (!dateStr) return undefined

    // Try parsing as ISO string
    const isoDate = new Date(dateStr)
    if (!isNaN(isoDate.getTime())) {
      return isoDate
    }

    // Try parsing relative dates
    const now = new Date()
    const lowerStr = dateStr.toLowerCase().trim()

    if (lowerStr === 'today' || lowerStr === 'сегодня') {
      return now
    }

    if (lowerStr === 'tomorrow' || lowerStr === 'завтра') {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow
    }

    // Try parsing "in N days"
    const daysMatch = dateStr.match(/in\s+(\d+)\s+days?/i) || dateStr.match(/через\s+(\d+)\s+дн/i)
    if (daysMatch) {
      const days = parseInt(daysMatch[1])
      const futureDate = new Date(now)
      futureDate.setDate(futureDate.getDate() + days)
      return futureDate
    }

    return undefined
  }

  private static incrementUsageCount(templateId: string): void {
    const templates = this.getTemplates()
    const template = templates.find(t => t.id === templateId)
    if (template) {
      template.usedCount++
      this.saveTemplates(templates)
    }
  }

  private static saveTemplates(templates: TaskTemplate[]): void {
    localStorage.setItem(this.templatesKey, JSON.stringify(templates))
  }

  static extractVariables(templateText: string): string[] {
    const matches = templateText.match(/\{\{(\w+)\}\}/g)
    if (!matches) return []
    return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))]
  }

  static getDefaultTemplates(): Omit<TaskTemplate, 'id' | 'createdAt' | 'usedCount'>[] {
    return [
      {
        name: 'Встреча',
        description: 'Шаблон для создания задачи-встречи',
        template: {
          title: 'Встреча: {{name}}',
          notes: 'Встреча с {{name}}\nДата: {{date}}\nМесто: {{location}}',
          priority: Priority.Medium,
          tags: ['встреча', '{{tag}}'],
          dueDate: '{{date}}',
          reminderDate: '{{date}}'
        },
        variables: [
          { name: 'name', label: 'Имя', type: 'text', required: true },
          { name: 'date', label: 'Дата', type: 'date', required: true },
          { name: 'location', label: 'Место', type: 'text' },
          { name: 'tag', label: 'Тег', type: 'text' }
        ]
      },
      {
        name: 'Задача с подзадачами',
        description: 'Шаблон для задачи с несколькими подзадачами',
        template: {
          title: '{{title}}',
          notes: '{{description}}',
          priority: Priority.High,
          subtasks: [
            '{{subtask1}}',
            '{{subtask2}}',
            '{{subtask3}}'
          ]
        },
        variables: [
          { name: 'title', label: 'Название задачи', type: 'text', required: true },
          { name: 'description', label: 'Описание', type: 'text' },
          { name: 'subtask1', label: 'Подзадача 1', type: 'text' },
          { name: 'subtask2', label: 'Подзадача 2', type: 'text' },
          { name: 'subtask3', label: 'Подзадача 3', type: 'text' }
        ]
      },
      {
        name: 'Повторяющаяся задача',
        description: 'Шаблон для ежедневных/еженедельных задач',
        template: {
          title: '{{task}}',
          notes: 'Ежедневная задача',
          priority: Priority.Medium,
          tags: ['повторяющаяся', '{{frequency}}'],
          dueDate: 'today'
        },
        variables: [
          { name: 'task', label: 'Задача', type: 'text', required: true },
          { name: 'frequency', label: 'Частота', type: 'select', options: ['ежедневно', 'еженедельно', 'ежемесячно'] }
        ]
      }
    ]
  }
}
