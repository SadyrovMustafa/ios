export interface EmailTask {
  subject: string
  body: string
  from: string
  date: Date
}

export class EmailToTaskService {
  private static emailKey = 'ticktick_email_tasks'
  private static webhookUrl: string | null = null

  static setWebhookUrl(url: string): void {
    this.webhookUrl = url
  }

  static parseEmailToTask(email: EmailTask): {
    title: string
    notes: string
    priority: 'none' | 'low' | 'medium' | 'high'
    dueDate?: Date
    tags?: string[]
  } {
    // Извлекаем название задачи из темы письма
    let title = email.subject.trim()
    
    // Убираем префиксы типа "Re:", "Fwd:"
    title = title.replace(/^(Re:|Fwd:|RE:|FWD:)\s*/i, '')

    // Извлекаем приоритет из темы
    let priority: 'none' | 'low' | 'medium' | 'high' = 'none'
    if (/\b(urgent|срочно|важно|important)\b/i.test(title)) {
      priority = 'high'
    } else if (/\b(priority|приоритет)\b/i.test(title)) {
      priority = 'medium'
    }

    // Извлекаем дату из тела письма (используем умный парсер)
    let dueDate: Date | undefined
    const dateMatch = email.body.match(/(?:due|deadline|срок|к|до)\s*:?\s*(.+?)(?:\n|$)/i)
    if (dateMatch) {
      try {
        const { parseSmartDate } = require('../utils/smartDateParser')
        const parsed = parseSmartDate(dateMatch[1].trim())
        if (parsed.isValid && parsed.date) {
          dueDate = parsed.date
        }
      } catch (e) {
        // Игнорируем ошибки парсинга даты
      }
    }

    // Извлекаем теги из темы или тела
    const tags: string[] = []
    const tagMatch = email.body.match(/#(\w+)/g)
    if (tagMatch) {
      tags.push(...tagMatch.map(t => t.substring(1).toLowerCase()))
    }

    // Формируем заметки
    const notes = `Создано из email от ${email.from}\n\n${email.body}`

    return {
      title,
      notes,
      priority,
      dueDate,
      tags: tags.length > 0 ? tags : undefined
    }
  }

  static async createTaskFromEmail(email: EmailTask): Promise<string> {
    const taskData = this.parseEmailToTask(email)
    
    // Сохраняем email для истории
    const emails = this.getEmails()
    emails.push(email)
    this.saveEmails(emails)

    // Возвращаем данные задачи для создания
    return JSON.stringify(taskData)
  }

  static getEmails(): EmailTask[] {
    const data = localStorage.getItem(this.emailKey)
    if (!data) return []
    return JSON.parse(data).map((e: any) => ({
      ...e,
      date: new Date(e.date)
    }))
  }

  private static saveEmails(emails: EmailTask[]): void {
    localStorage.setItem(this.emailKey, JSON.stringify(emails))
  }

  // Для интеграции с email сервисами (требует бэкенд)
  static async setupEmailIntegration(email: string): Promise<boolean> {
    // В реальном приложении здесь была бы интеграция с email API
    // Например, через IMAP, Gmail API, Outlook API и т.д.
    // Это требует бэкенд сервера для безопасности
    
    console.log('Email integration setup (requires backend):', email)
    return false
  }
}

