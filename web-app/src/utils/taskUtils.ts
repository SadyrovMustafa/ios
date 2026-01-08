import { Task, Priority } from '../types/Task'

export function filterTasks(
  tasks: Task[],
  searchQuery: string,
  priorityFilter: Priority | 'all',
  statusFilter: 'all' | 'active' | 'completed'
): Task[] {
  let filtered = [...tasks]

  // Search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(task =>
      task.title.toLowerCase().includes(query) ||
      task.notes.toLowerCase().includes(query)
    )
  }

  // Priority filter
  if (priorityFilter !== 'all') {
    filtered = filtered.filter(task => task.priority === priorityFilter)
  }

  // Status filter
  if (statusFilter === 'active') {
    filtered = filtered.filter(task => !task.isCompleted)
  } else if (statusFilter === 'completed') {
    filtered = filtered.filter(task => task.isCompleted)
  }

  return filtered
}

export function sortTasks(
  tasks: Task[],
  sortBy: 'date' | 'priority' | 'title',
  sortOrder: 'asc' | 'desc'
): Task[] {
  const sorted = [...tasks]

  sorted.sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'date':
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0
        comparison = dateA - dateB
        break
      case 'priority':
        const priorityOrder = {
          [Priority.High]: 3,
          [Priority.Medium]: 2,
          [Priority.Low]: 1,
          [Priority.None]: 0
        }
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
        break
      case 'title':
        comparison = a.title.localeCompare(b.title)
        break
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  return sorted
}

export function isOverdue(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const taskDate = new Date(date)
  taskDate.setHours(0, 0, 0, 0)
  return taskDate < today
}

export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  )
}

