import { TaskManager } from '../services/TaskManager'
import './StatsPanel.css'

interface StatsPanelProps {
  taskManager: TaskManager
  listId?: string
}

export default function StatsPanel({ taskManager, listId }: StatsPanelProps) {
  const tasks = listId 
    ? taskManager.getTasksForList(listId)
    : taskManager.getTasks()

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.isCompleted).length
  const activeTasks = totalTasks - completedTasks
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const highPriorityTasks = tasks.filter(t => t.priority === 'high' && !t.isCompleted).length
  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate || t.isCompleted) return false
    return new Date(t.dueDate) < new Date() && !isToday(new Date(t.dueDate))
  }).length

  const todayTasks = taskManager.getTasksForToday().filter(t => !t.isCompleted).length

  return (
    <div className="stats-panel">
      <h3 className="stats-title">Statistics</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{totalTasks}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{activeTasks}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card stat-card-success">
          <div className="stat-value">{completedTasks}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card stat-card-primary">
          <div className="stat-value">{completionRate}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>
        {highPriorityTasks > 0 && (
          <div className="stat-card stat-card-warning">
            <div className="stat-value">{highPriorityTasks}</div>
            <div className="stat-label">High Priority</div>
          </div>
        )}
        {overdueTasks > 0 && (
          <div className="stat-card stat-card-danger">
            <div className="stat-value">{overdueTasks}</div>
            <div className="stat-label">Overdue</div>
          </div>
        )}
        {todayTasks > 0 && (
          <div className="stat-card stat-card-info">
            <div className="stat-value">{todayTasks}</div>
            <div className="stat-label">Due Today</div>
          </div>
        )}
      </div>
    </div>
  )
}

function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

