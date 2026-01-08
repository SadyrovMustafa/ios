import { useState } from 'react'
import { Task } from '../types/Task'
import './TaskGrouping.css'

export type GroupBy = 'none' | 'priority' | 'tags' | 'dueDate' | 'list' | 'status'

interface TaskGroupingProps {
  tasks: Task[]
  groupBy: GroupBy
  onGroupByChange: (groupBy: GroupBy) => void
  renderTasks: (tasks: Task[]) => React.ReactNode
}

export default function TaskGrouping({
  tasks,
  groupBy,
  onGroupByChange,
  renderTasks
}: TaskGroupingProps) {
  const groupedTasks = groupTasks(tasks, groupBy)

  return (
    <div className="task-grouping">
      <div className="grouping-controls">
        <label>Группировать по:</label>
        <select
          value={groupBy}
          onChange={(e) => onGroupByChange(e.target.value as GroupBy)}
          className="grouping-select"
        >
          <option value="none">Не группировать</option>
          <option value="priority">Приоритету</option>
          <option value="tags">Тегам</option>
          <option value="dueDate">Дате выполнения</option>
          <option value="list">Списку</option>
          <option value="status">Статусу</option>
        </select>
      </div>

      {groupBy === 'none' ? (
        renderTasks(tasks)
      ) : (
        <div className="grouped-tasks">
          {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
            <div key={groupName} className="task-group">
              <h3 className="group-header">{groupName}</h3>
              <div className="group-content">
                {renderTasks(groupTasks)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function groupTasks(tasks: Task[], groupBy: GroupBy): Record<string, Task[]> {
  const grouped: Record<string, Task[]> = {}

  tasks.forEach(task => {
    let groupName = 'Без группы'

    switch (groupBy) {
      case 'priority':
        groupName = task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
        break
      case 'tags':
        if (task.tags && task.tags.length > 0) {
          task.tags.forEach(tag => {
            if (!grouped[tag]) grouped[tag] = []
            grouped[tag].push(task)
          })
          return
        } else {
          groupName = 'Без тегов'
        }
        break
      case 'dueDate':
        if (task.dueDate) {
          const date = new Date(task.dueDate)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          const week = new Date(today)
          week.setDate(week.getDate() + 7)

          if (date < today) {
            groupName = 'Просроченные'
          } else if (date >= today && date < tomorrow) {
            groupName = 'Сегодня'
          } else if (date >= tomorrow && date < week) {
            groupName = 'На этой неделе'
          } else {
            groupName = date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
          }
        } else {
          groupName = 'Без даты'
        }
        break
      case 'list':
        groupName = task.listId || 'Без списка'
        break
      case 'status':
        groupName = task.isCompleted ? 'Выполненные' : 'Активные'
        break
    }

    if (!grouped[groupName]) {
      grouped[groupName] = []
    }
    grouped[groupName].push(task)
  })

  return grouped
}

