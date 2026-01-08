import React, { useState, useEffect } from 'react'
import { WorkloadService, WorkloadSummary } from '../services/WorkloadService'
import { TaskManager } from '../services/TaskManager'
import { LocalAuthService } from '../services/LocalAuthService'
import './WorkloadPanel.css'

interface WorkloadPanelProps {
  onClose: () => void
}

export const WorkloadPanel: React.FC<WorkloadPanelProps> = () => {
  const [workloads, setWorkloads] = useState<WorkloadSummary[]>([])
  const [weekStart, setWeekStart] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - date.getDay())
    return date
  })

  useEffect(() => {
    loadWorkloads()
  }, [weekStart])

  const loadWorkloads = () => {
    const currentUser = LocalAuthService.getCurrentUser()
    if (!currentUser) return

    const tasks = TaskManager.getTasks()
    // Assuming we have a way to get all user IDs
    const userIds = [currentUser.id] // Simplified - should get from team
    const summaries = WorkloadService.getTeamWorkload(userIds, tasks, weekStart)
    setWorkloads(summaries)
  }

  const overloadedUsers = workloads.filter(w => w.overloaded)

  return (
    <div className="workload-panel">
      <div className="panel-header">
        <h2>⚖️ Распределение нагрузки</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="panel-content">
        {overloadedUsers.length > 0 && (
          <div className="alert overloaded">
            <strong>Перегружено:</strong> {overloadedUsers.length} участников
          </div>
        )}
        <div className="workload-list">
          {workloads.map(workload => (
            <div key={workload.userId} className={`workload-card ${workload.overloaded ? 'overloaded' : ''}`}>
              <h3>Пользователь: {workload.userId}</h3>
              <div className="workload-stats">
                <div className="stat">
                  <span>Оценка часов:</span>
                  <span className={workload.overloaded ? 'overloaded-text' : ''}>
                    {workload.totalEstimatedHours.toFixed(1)}ч
                  </span>
                </div>
                <div className="stat">
                  <span>Задач:</span>
                  <span>{workload.taskCount}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${Math.min((workload.totalEstimatedHours / 40) * 100, 100)}%`,
                      backgroundColor: workload.overloaded ? '#f44336' : '#4caf50'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

