import { useState, useEffect } from 'react'
import { Task } from '../types/Task'
import { TaskManager } from '../services/TaskManager'
import { format, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval } from 'date-fns'
import './SprintView.css'

interface Sprint {
  id: string
  name: string
  startDate: Date
  endDate: Date
  goal: string
  tasks: string[]
}

interface SprintViewProps {
  taskManager: TaskManager
  onClose: () => void
}

export default function SprintView({ taskManager, onClose }: SprintViewProps) {
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [sprintName, setSprintName] = useState('')
  const [sprintGoal, setSprintGoal] = useState('')
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null)

  useEffect(() => {
    loadSprints()
  }, [])

  const loadSprints = () => {
    const data = localStorage.getItem('ticktick_sprints')
    if (data) {
      setSprints(JSON.parse(data).map((s: any) => ({
        ...s,
        startDate: new Date(s.startDate),
        endDate: new Date(s.endDate)
      })))
    }
  }

  const handleCreateSprint = () => {
    if (!sprintName.trim()) return

    const now = new Date()
    const start = startOfWeek(now)
    const end = endOfWeek(now)

    const newSprint: Sprint = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: sprintName,
      goal: sprintGoal,
      startDate: start,
      endDate: end,
      tasks: []
    }

    const updated = [...sprints, newSprint]
    localStorage.setItem('ticktick_sprints', JSON.stringify(updated))
    setSprints(updated)
    setSprintName('')
    setSprintGoal('')
    setShowCreate(false)
  }

  const handleDeleteSprint = (sprintId: string) => {
    if (confirm('Delete this sprint?')) {
      const updated = sprints.filter(s => s.id !== sprintId)
      localStorage.setItem('ticktick_sprints', JSON.stringify(updated))
      setSprints(updated)
    }
  }

  const getSprintProgress = (sprint: Sprint) => {
    const sprintTasks = taskManager.getTasks().filter(t => sprint.tasks.includes(t.id))
    if (sprintTasks.length === 0) return 0
    const completed = sprintTasks.filter(t => t.isCompleted).length
    return (completed / sprintTasks.length) * 100
  }

  return (
    <div className="sprint-overlay" onClick={onClose}>
      <div className="sprint-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sprint-header">
          <h2>🏃 Sprints</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="sprint-content">
          <button
            className="create-sprint-btn"
            onClick={() => setShowCreate(!showCreate)}
          >
            + Create Sprint
          </button>

          {showCreate && (
            <div className="create-sprint-form">
              <input
                type="text"
                placeholder="Sprint name"
                value={sprintName}
                onChange={(e) => setSprintName(e.target.value)}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Sprint goal (optional)"
                value={sprintGoal}
                onChange={(e) => setSprintGoal(e.target.value)}
                className="form-input"
              />
              <button onClick={handleCreateSprint} className="save-btn">
                Create
              </button>
            </div>
          )}

          <div className="sprints-list">
            {sprints.map(sprint => {
              const progress = getSprintProgress(sprint)
              const daysLeft = Math.ceil((sprint.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              
              return (
                <div key={sprint.id} className="sprint-card">
                  <div className="sprint-info">
                    <h3>{sprint.name}</h3>
                    {sprint.goal && <p className="sprint-goal">{sprint.goal}</p>}
                    <div className="sprint-dates">
                      {format(sprint.startDate, 'MMM d')} - {format(sprint.endDate, 'MMM d, yyyy')}
                    </div>
                    <div className="sprint-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="progress-text">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="sprint-stats">
                      <span>{sprint.tasks.length} tasks</span>
                      <span>{daysLeft} days left</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSprint(sprint.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              )
            })}
          </div>

          {sprints.length === 0 && (
            <p className="empty-state">No sprints yet. Create your first sprint!</p>
          )}
        </div>
      </div>
    </div>
  )
}

