import { Task, TaskList } from '../types/Task'

export interface SmartListRule {
  id: string
  name: string
  conditions: SmartListCondition[]
  createdAt: Date
}

export interface SmartListCondition {
  field: 'title' | 'notes' | 'priority' | 'dueDate' | 'tags' | 'isCompleted' | 'listId'
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'in' | 'notIn'
  value: any
}

export class SmartListService {
  private static rulesKey = 'ticktick_smart_list_rules'

  static getRules(): SmartListRule[] {
    const data = localStorage.getItem(this.rulesKey)
    if (!data) return []
    return JSON.parse(data).map((r: any) => ({
      ...r,
      createdAt: new Date(r.createdAt)
    }))
  }

  static addRule(rule: Omit<SmartListRule, 'id' | 'createdAt'>): SmartListRule {
    const rules = this.getRules()
    const newRule: SmartListRule = {
      ...rule,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    }
    rules.push(newRule)
    this.saveRules(rules)
    return newRule
  }

  static updateRule(rule: SmartListRule): void {
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

  static getTasksForRule(rule: SmartListRule, allTasks: Task[]): Task[] {
    return allTasks.filter(task => this.matchesRule(task, rule))
  }

  static matchesRule(task: Task, rule: SmartListRule): boolean {
    return rule.conditions.every(condition => this.matchesCondition(task, condition))
  }

  private static matchesCondition(task: Task, condition: SmartListCondition): boolean {
    const fieldValue = this.getFieldValue(task, condition.field)

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase())
      case 'greaterThan':
        return fieldValue > condition.value
      case 'lessThan':
        return fieldValue < condition.value
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue)
      case 'notIn':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue)
      default:
        return false
    }
  }

  private static getFieldValue(task: Task, field: string): any {
    switch (field) {
      case 'title':
        return task.title
      case 'notes':
        return task.notes
      case 'priority':
        return task.priority
      case 'dueDate':
        return task.dueDate ? new Date(task.dueDate).getTime() : null
      case 'tags':
        return task.tags || []
      case 'isCompleted':
        return task.isCompleted
      case 'listId':
        return task.listId
      default:
        return null
    }
  }

  private static saveRules(rules: SmartListRule[]): void {
    localStorage.setItem(this.rulesKey, JSON.stringify(rules))
  }
}

