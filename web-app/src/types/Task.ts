export interface Task {
  id: string
  title: string
  notes: string
  isCompleted: boolean
  dueDate?: Date
  priority: Priority
  listId: string
  createdAt: Date
  completedAt?: Date
  tags?: string[]
  subtasks?: Subtask[]
  recurring?: RecurringPattern
  reminderDate?: Date
  parentTaskId?: string
  attachmentIds?: string[]
  dependsOn?: string[] // IDs of tasks this task depends on
  blockedBy?: string[] // IDs of tasks that depend on this task
  milestoneId?: string // Linked milestone
  assigneeId?: string // Assigned user ID
  customFieldValues?: Record<string, any> // Custom field values
  approvalId?: string // Linked approval
  okrKeyResultId?: string // Linked OKR key result
}

export interface Subtask {
  id: string
  title: string
  isCompleted: boolean
  createdAt: Date
  completedAt?: Date
}

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  interval: number
  endDate?: Date
  daysOfWeek?: number[] // 0 = Sunday, 1 = Monday, etc.
  dayOfMonth?: number
}

export enum Priority {
  None = 'none',
  Low = 'low',
  Medium = 'medium',
  High = 'high'
}

export interface TaskList {
  id: string
  name: string
  color: string
  icon: string
  backgroundImage?: string
  backgroundColor?: string
}

export const PriorityColors: Record<Priority, string> = {
  [Priority.None]: '#8E8E93',
  [Priority.Low]: '#007AFF',
  [Priority.Medium]: '#FF9500',
  [Priority.High]: '#FF3B30'
}

export const PriorityLabels: Record<Priority, string> = {
  [Priority.None]: 'None',
  [Priority.Low]: 'Low',
  [Priority.Medium]: 'Medium',
  [Priority.High]: 'High'
}

