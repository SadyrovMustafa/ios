import { useState, useEffect } from 'react'
import { Task } from '../types/Task'
import { AutoPlanningService, PlannedTask } from '../services/AutoPlanningService'
import { TaskManager } from '../services/TaskManager'
import { format } from 'date-fns'
import { toastService } from '../services/ToastService'
import './AutoPlanningPanel.css'

interface AutoPlanningPanelProps {
  taskManager: TaskManager
  onClose?: () => void
}

export default function AutoPlanningPanel({ taskManager, onClose }: AutoPlanningPanelProps) {
  const [plannedTasks, setPlannedTasks] = useState<PlannedTask[]>([])
  const [availableHours, setAvailableHours] = useState(8)
  const [startTime, setStartTime] = useState(new Date())

  useEffect(() => {
    planTasks()
  }, [availableHours, startTime])

  const planTasks = () => {
    const tasks = taskManager.getTasks().filter(t => !t.isCompleted)
    const planned = AutoPlanningService.planTasks(tasks, availableHours, startTime)
    setPlannedTasks(planned)
  }

  const handleApplyPlan = () => {
    plannedTasks.forEach(planned => {
      const task = taskManager.getTasks().find(t => t.id === planned.task.id)
      if (task && !task.dueDate) {
        taskManager.updateTask({
          ...task,
          dueDate: planned.scheduledTime
        })
      }
    })
    toastService.success(`План применен к ${plannedTasks.length} задачам`)
    if (onClose) onClose()
  }

  return (
    <div className={`auto-planning-panel ${onClose ? 'modal' : ''}`}>
      {onClose && (
        <div className="auto-planning-header">
          <h2>🤖 Автоматическое планирование</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      )}

      <div className="auto-planning-content">
        <div className="planning-settings">
          <div className="setting-group">
            <label>Доступно часов:</label>
            <input
              type="number"
              min="1"
              max="24"
              value={availableHours}
              onChange={(e) => setAvailableHours(Number(e.target.value))}
              className="setting-input"
            />
          </div>
          <div className="setting-group">
            <label>Начало работы:</label>
            <input
              type="datetime-local"
              value={format(startTime, "yyyy-MM-dd'T'HH:mm")}
              onChange={(e) => setStartTime(new Date(e.target.value))}
              className="setting-input"
            />
          </div>
        </div>

        <div className="planned-tasks-list">
          <h3>План на день</h3>
          {plannedTasks.length === 0 ? (
            <p className="empty-state">Нет задач для планирования</p>
          ) : (
            <>
              {plannedTasks.map((planned, index) => (
                <div key={planned.task.id} className="planned-task-item">
                  <div className="planned-task-time">
                    {format(planned.scheduledTime, 'HH:mm')}
                  </div>
                  <div className="planned-task-content">
                    <div className="planned-task-title">{planned.task.title}</div>
                    <div className="planned-task-meta">
                      <span>⏱️ {AutoPlanningService.formatTime(planned.estimatedDuration)}</span>
                      <span>📝 {planned.reason}</span>
                    </div>
                  </div>
                  <div className="planned-task-priority">
                    {planned.task.priority !== 'none' && (
                      <span className={`priority-badge priority-${planned.task.priority}`}>
                        {planned.task.priority}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div className="planning-summary">
                <div className="summary-item">
                  <span>Всего задач:</span>
                  <strong>{plannedTasks.length}</strong>
                </div>
                <div className="summary-item">
                  <span>Общее время:</span>
                  <strong>
                    {AutoPlanningService.formatTime(
                      plannedTasks.reduce((sum, p) => sum + p.estimatedDuration, 0)
                    )}
                  </strong>
                </div>
              </div>
              <button onClick={handleApplyPlan} className="btn-primary apply-plan-btn">
                ✅ Применить план
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

