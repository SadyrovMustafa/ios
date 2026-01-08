import { Task, TaskList } from '../types/Task'

export interface Suggestion {
  id: string
  type: 'task' | 'tag' | 'priority' | 'list' | 'dueDate'
  title: string
  description: string
  action: () => void
  confidence: number
}

export class AIService {
  static analyzeTasks(tasks: Task[], lists: TaskList[]): {
    suggestions: Suggestion[]
    insights: string[]
  } {
    const suggestions: Suggestion[] = []
    const insights: string[] = []

    // Analyze patterns
    const activeTasks = tasks.filter(t => !t.isCompleted)
    const completedTasks = tasks.filter(t => t.isCompleted)
    const overdueTasks = activeTasks.filter(t => {
      if (!t.dueDate) return false
      return new Date(t.dueDate) < new Date()
    })

    // Suggestion 1: Overdue tasks
    if (overdueTasks.length > 0) {
      suggestions.push({
        id: 'overdue',
        type: 'task',
        title: `${overdueTasks.length} overdue task(s)`,
        description: 'Consider completing or rescheduling these tasks',
        action: () => {},
        confidence: 0.9
      })
      insights.push(`You have ${overdueTasks.length} overdue task(s)`)
    }

    // Suggestion 2: High priority without due date
    const highPriorityNoDate = activeTasks.filter(
      t => t.priority === 'high' && !t.dueDate
    )
    if (highPriorityNoDate.length > 0) {
      suggestions.push({
        id: 'high_priority_no_date',
        type: 'dueDate',
        title: 'High priority tasks without dates',
        description: 'Add due dates to high priority tasks',
        action: () => {},
        confidence: 0.8
      })
    }

    // Suggestion 3: Tasks without tags
    const untaggedTasks = activeTasks.filter(
      t => !t.tags || t.tags.length === 0
    )
    if (untaggedTasks.length > 3) {
      suggestions.push({
        id: 'untagged',
        type: 'tag',
        title: 'Many tasks without tags',
        description: 'Add tags to better organize your tasks',
        action: () => {},
        confidence: 0.7
      })
    }

    // Suggestion 4: Tasks in Inbox
    const inboxList = lists.find(l => l.name.toLowerCase() === 'inbox')
    if (inboxList) {
      const inboxTasks = activeTasks.filter(t => t.listId === inboxList.id)
      if (inboxTasks.length > 5) {
        suggestions.push({
          id: 'inbox_overflow',
          type: 'list',
          title: 'Inbox has many tasks',
          description: 'Organize tasks into specific lists',
          action: () => {},
          confidence: 0.75
        })
      }
    }

    // Suggestion 5: Similar task names
    const taskTitles = activeTasks.map(t => t.title.toLowerCase())
    const duplicates = taskTitles.filter((title, index) => 
      taskTitles.indexOf(title) !== index
    )
    if (duplicates.length > 0) {
      suggestions.push({
        id: 'duplicates',
        type: 'task',
        title: 'Possible duplicate tasks',
        description: 'You may have duplicate tasks',
        action: () => {},
        confidence: 0.6
      })
    }

    // Insights
    const completionRate = tasks.length > 0 
      ? (completedTasks.length / tasks.length) * 100 
      : 0
    
    if (completionRate > 80) {
      insights.push('Great job! You have a high completion rate')
    } else if (completionRate < 50) {
      insights.push('Consider focusing on completing more tasks')
    }

    const avgTasksPerDay = completedTasks.length / Math.max(1, 
      Math.ceil((Date.now() - new Date(Math.min(...tasks.map(t => 
        new Date(t.createdAt).getTime()
      ))).getTime()) / (1000 * 60 * 60 * 24))
    )

    if (avgTasksPerDay > 5) {
      insights.push(`You're completing ${avgTasksPerDay.toFixed(1)} tasks per day on average`)
    }

    // Time-based suggestions
    const now = new Date()
    const hour = now.getHours()
    if (hour >= 6 && hour < 12) {
      insights.push('Good morning! Start with high priority tasks')
    } else if (hour >= 12 && hour < 18) {
      insights.push('Afternoon is great for medium priority tasks')
    } else if (hour >= 18 && hour < 22) {
      insights.push('Evening - plan tomorrow\'s tasks')
    }

    return { suggestions, insights }
  }

  static suggestTags(task: Task, allTasks: Task[]): string[] {
    const suggestions: string[] = []
    
    // Suggest based on title keywords
    const titleWords = task.title.toLowerCase().split(/\s+/)
    const commonWords = ['work', 'home', 'personal', 'urgent', 'important', 'meeting', 'call', 'email']
    
    commonWords.forEach(word => {
      if (titleWords.some(w => w.includes(word))) {
        suggestions.push(word)
      }
    })

    // Suggest based on similar tasks
    const similarTasks = allTasks.filter(t => {
      const similarity = this.calculateSimilarity(task.title, t.title)
      return similarity > 0.5 && t.tags && t.tags.length > 0
    })

    similarTasks.forEach(t => {
      t.tags?.forEach(tag => {
        if (!suggestions.includes(tag)) {
          suggestions.push(tag)
        }
      })
    })

    return suggestions.slice(0, 5)
  }

  static suggestPriority(task: Task): 'high' | 'medium' | 'low' | 'none' {
    let score = 0

    // Keywords
    const urgentKeywords = ['urgent', 'asap', 'important', 'critical', 'deadline']
    if (urgentKeywords.some(kw => task.title.toLowerCase().includes(kw))) {
      score += 3
    }

    // Due date proximity
    if (task.dueDate) {
      const daysUntil = Math.ceil(
        (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      if (daysUntil < 0) score += 3
      else if (daysUntil <= 1) score += 2
      else if (daysUntil <= 3) score += 1
    }

    // Has reminder
    if (task.reminderDate) score += 1

    if (score >= 3) return 'high'
    if (score >= 1) return 'medium'
    return 'low'
  }

  static suggestDueDate(task: Task): Date | null {
    // Suggest based on similar tasks
    // For now, suggest tomorrow for tasks without dates
    if (!task.dueDate) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(18, 0, 0, 0) // 6 PM
      return tomorrow
    }
    return null
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/)
    const words2 = str2.toLowerCase().split(/\s+/)
    const intersection = words1.filter(w => words2.includes(w))
    const union = [...new Set([...words1, ...words2])]
    return intersection.length / union.length
  }
}

