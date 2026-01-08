import { useState, useEffect } from 'react'
import { Task } from '../types/Task'
import { TaskAssignmentService, TaskAssignment } from '../services/TaskAssignmentService'
import { LocalAuthService } from '../services/LocalAuthService'
import { toastService } from '../services/ToastService'
import { format } from 'date-fns'
import './TaskAssignmentPanel.css'

interface TaskAssignmentPanelProps {
  task: Task
  onClose: () => void
  onUpdate?: () => void
}

export default function TaskAssignmentPanel({ task, onClose, onUpdate }: TaskAssignmentPanelProps) {
  const [assignment, setAssignment] = useState<TaskAssignment | undefined>()
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [status, setStatus] = useState<TaskAssignment['status']>('pending')
  const users = LocalAuthService.getAllUsers()
  const currentUser = LocalAuthService.getCurrentUser()

  useEffect(() => {
    loadAssignment()
  }, [task.id])

  const loadAssignment = () => {
    const existing = TaskAssignmentService.getAssignment(task.id)
    setAssignment(existing)
    if (existing) {
      setSelectedUserId(existing.assignedTo)
      setStatus(existing.status)
    }
  }

  const handleAssign = () => {
    if (!selectedUserId || !currentUser) {
      toastService.error('Выберите пользователя')
      return
    }

    TaskAssignmentService.assignTask(task.id, selectedUserId, currentUser.id)
    toastService.success('Задача назначена')
    loadAssignment()
    onUpdate?.()
  }

  const handleUnassign = () => {
    TaskAssignmentService.unassignTask(task.id)
    toastService.info('Назначение отменено')
    setAssignment(undefined)
    setSelectedUserId('')
    onUpdate?.()
  }

  const handleStatusChange = (newStatus: TaskAssignment['status']) => {
    if (assignment) {
      TaskAssignmentService.updateAssignmentStatus(task.id, newStatus)
      setStatus(newStatus)
      toastService.success('Статус обновлен')
      loadAssignment()
      onUpdate?.()
    }
  }

  const assignedUser = assignment ? users.find(u => u.id === assignment.assignedTo) : null
  const assignedByUser = assignment ? users.find(u => u.id === assignment.assignedBy) : null

  return (
    <div className="task-assignment-overlay" onClick={onClose}>
      <div className="task-assignment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="task-assignment-header">
          <h2>👤 Назначение задачи</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="task-assignment-content">
          <div className="task-info">
            <h3>{task.title}</h3>
          </div>

          {assignment ? (
            <div className="assignment-info">
              <div className="assigned-to">
                <label>Назначено:</label>
                <div className="user-info">
                  <span className="user-name">{assignedUser?.name || 'Unknown'}</span>
                  <span className="user-email">{assignedUser?.email}</span>
                </div>
              </div>

              <div className="assigned-by">
                <label>Назначил:</label>
                <span>{assignedByUser?.name || 'Unknown'}</span>
              </div>

              <div className="assigned-at">
                <label>Дата назначения:</label>
                <span>{format(new Date(assignment.assignedAt), 'dd.MM.yyyy HH:mm')}</span>
              </div>

              <div className="status-section">
                <label>Статус:</label>
                <div className="status-buttons">
                  {(['pending', 'in_progress', 'completed', 'cancelled'] as TaskAssignment['status'][]).map(s => (
                    <button
                      key={s}
                      className={`status-btn ${status === s ? 'active' : ''}`}
                      onClick={() => handleStatusChange(s)}
                    >
                      {s === 'pending' && '⏳ Ожидает'}
                      {s === 'in_progress' && '🔄 В работе'}
                      {s === 'completed' && '✅ Выполнено'}
                      {s === 'cancelled' && '❌ Отменено'}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleUnassign} className="btn-danger">
                Отменить назначение
              </button>
            </div>
          ) : (
            <div className="assign-form">
              <div className="form-group">
                <label>Назначить пользователю:</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="form-select"
                >
                  <option value="">Выберите пользователя...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAssign}
                disabled={!selectedUserId}
                className="btn-primary"
              >
                Назначить задачу
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

