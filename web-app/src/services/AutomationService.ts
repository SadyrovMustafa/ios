import { Task } from '../types/Task'

export interface AutomationRule {
  id: string
  name: string
  enabled: boolean
  conditions: AutomationCondition[]
  actions: AutomationAction[]
  createdAt: Date
}

export interface AutomationCondition {
  type: 'tag' | 'priority' | 'list' | 'dueDate' | 'titleContains' | 'hasSubtasks'
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'exists'
  value: string | number | boolean
}

export interface AutomationAction {
  type: 'addTag' | 'setPriority' | 'moveToList' | 'setReminder' | 'addSubtask'
  value: string | number
}

export class AutomationService {
  private static rulesKey = 'ticktick_automation_rules'

  static getRules(): AutomationRule[] {
    const data = localStorage.getItem(this.rulesKey)
    if (!data) return []
    return JSON.parse(data).map((rule: any) => ({
      ...rule,
      createdAt: new Date(rule.createdAt)
    }))
  }

  static addRule(rule: Omit<AutomationRule, 'id' | 'createdAt'>): AutomationRule {
    const rules = this.getRules()
    const newRule: AutomationRule = {
      ...rule,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    }
    rules.push(newRule)
    this.saveRules(rules)
    return newRule
  }

  static updateRule(rule: AutomationRule): void {
    const rules = this.getRules()
    const index = rules.findIndex(r => r.id === rule.id)
    if (index !== -1) {
      rules[index] = rule
      this.saveRules(rules)
    }
  }

  static deleteRule(ruleId: string): void {
    const rules = this.getRules().filter(r => r.id !== ruleId)
    this.saveRules(rules)
  }

  static applyRules(task: Task): Task {
    const rules = this.getRules().filter(r => r.enabled)
    let updatedTask = { ...task }

    rules.forEach(rule => {
      if (this.checkConditions(updatedTask, rule.conditions)) {
        updatedTask = this.applyActions(updatedTask, rule.actions)
      }
    })

    return updatedTask
  }

  private static checkConditions(task: Task, conditions: AutomationCondition[]): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'tag':
          if (condition.operator === 'exists') {
            return task.tags && task.tags.length > 0
          }
          return task.tags?.includes(condition.value as string) || false
        case 'priority':
          return task.priority === condition.value
        case 'list':
          return task.listId === condition.value
        case 'dueDate':
          if (!task.dueDate) return false
          const taskDate = new Date(task.dueDate).getTime()
          const conditionDate = condition.value as number
          if (condition.operator === 'greaterThan') {
            return taskDate > conditionDate
          }
          return taskDate < conditionDate
        case 'titleContains':
          return task.title.toLowerCase().includes((condition.value as string).toLowerCase())
        case 'hasSubtasks':
          return !!(task.subtasks && task.subtasks.length > 0) === condition.value
        default:
          return false
      }
    })
  }

  private static applyActions(task: Task, actions: AutomationAction[]): Task {
    let updatedTask = { ...task }

    actions.forEach(action => {
      switch (action.type) {
        case 'addTag':
          if (!updatedTask.tags) updatedTask.tags = []
          if (!updatedTask.tags.includes(action.value as string)) {
            updatedTask.tags.push(action.value as string)
          }
          break
        case 'setPriority':
          updatedTask.priority = action.value as Task['priority']
          break
        case 'moveToList':
          updatedTask.listId = action.value as string
          break
        case 'setReminder':
          updatedTask.reminderDate = new Date(action.value as number)
          break
        case 'addSubtask':
          if (!updatedTask.subtasks) updatedTask.subtasks = []
          updatedTask.subtasks.push({
            id: `${Date.now()}-${Math.random()}`,
            title: action.value as string,
            isCompleted: false,
            createdAt: new Date()
          })
          break
      }
    })

    return updatedTask
  }

  private static saveRules(rules: AutomationRule[]): void {
    localStorage.setItem(this.rulesKey, JSON.stringify(rules))
  }
}

