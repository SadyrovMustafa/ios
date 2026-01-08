import { useState, useEffect } from 'react'
import { TaskHistoryService, TaskHistoryEntry } from '../services/TaskHistoryService'
import { format } from 'date-fns'
import './TaskHistory.css'

interface TaskHistoryProps {
  taskId: string
  onClose?: () => void
}

export default function TaskHistory({ taskId, onClose }: TaskHistoryProps) {
  const [history, setHistory] = useState<TaskHistoryEntry[]>([])
  const [stats, setStats] = useState(TaskHistoryService.getHistoryStats(taskId))

  useEffect(() => {
    loadHistory()
  }, [taskId])

  const loadHistory = () => {
    const taskHistory = TaskHistoryService.getHistoryForTask(taskId)
    setHistory(taskHistory)
    setStats(TaskHistoryService.getHistoryStats(taskId))
  }

  const getActionLabel = (action: TaskHistoryEntry['action']): string => {
    const labels: Record<TaskHistoryEntry['action'], string> = {
      created: 'Создана',
      updated: 'Обновлена',
      completed: 'Выполнена',
      uncompleted: 'Отменено выполнение',
      deleted: 'Удалена',
      archived: 'Архивирована',
      restored: 'Восстановлена'
    }
    return labels[action] || action
  }

  const getActionIcon = (action: TaskHistoryEntry['action']): string => {
    const icons: Record<TaskHistoryEntry['action'], string> = {
      created: '➕',
      updated: '✏️',
      completed: '✅',
      uncompleted: '↩️',
      deleted: '🗑️',
      archived: '📦',
      restored: '📤'
    }
    return icons[action] || '📝'
  }

  const formatChange = (entry: TaskHistoryEntry): string => {
    if (entry.field && entry.oldValue !== undefined && entry.newValue !== undefined) {
      return `${entry.field}: "${entry.oldValue}" → "${entry.newValue}"`
    }
    return ''
  }

  return (
    <div className={`task-history ${onClose ? 'modal' : ''}`}>
      {onClose && (
        <div className="task-history-header">
          <h2>📜 История изменений</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      )}

      <div className="task-history-content">
        {stats.totalChanges > 0 && (
          <div className="history-stats">
            <div className="stat-item">
              <span className="stat-label">Всего изменений:</span>
              <span className="stat-value">{stats.totalChanges}</span>
            </div>
            {stats.lastChanged && (
              <div className="stat-item">
                <span className="stat-label">Последнее изменение:</span>
                <span className="stat-value">
                  {format(stats.lastChanged, 'dd.MM.yyyy HH:mm')}
                </span>
              </div>
            )}
            {stats.mostChangedField && (
              <div className="stat-item">
                <span className="stat-label">Чаще всего менялось:</span>
                <span className="stat-value">{stats.mostChangedField}</span>
              </div>
            )}
          </div>
        )}

        {history.length === 0 ? (
          <div className="empty-history">
            <p>История изменений пуста</p>
            <p className="empty-hint">Изменения будут отслеживаться автоматически</p>
          </div>
        ) : (
          <div className="history-timeline">
            {history.map((entry, index) => (
              <div key={entry.id} className="history-entry">
                <div className="history-entry-icon">
                  {getActionIcon(entry.action)}
                </div>
                <div className="history-entry-content">
                  <div className="history-entry-header">
                    <span className="history-action">{getActionLabel(entry.action)}</span>
                    <span className="history-time">
                      {format(entry.timestamp, 'dd.MM.yyyy HH:mm')}
                    </span>
                  </div>
                  {entry.field && (
                    <div className="history-change">
                      {formatChange(entry)}
                    </div>
                  )}
                  {entry.changes && Object.keys(entry.changes).length > 0 && (
                    <div className="history-changes">
                      {Object.entries(entry.changes).map(([key, value]) => (
                        <div key={key} className="history-change-item">
                          <strong>{key}:</strong> {String(value)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

