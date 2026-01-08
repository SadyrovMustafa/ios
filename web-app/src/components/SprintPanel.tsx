import { useState, useEffect } from 'react'
import { TaskManager } from '../services/TaskManager'
import { SprintService, Sprint } from '../services/SprintService'
import { ProjectService } from '../services/ProjectService'
import { format } from 'date-fns'
import { toastService } from '../services/ToastService'
import './SprintPanel.css'

interface SprintPanelProps {
  taskManager: TaskManager
  onClose: () => void
}

export default function SprintPanel({ taskManager, onClose }: SprintPanelProps) {
  const [projects, setProjects] = useState(ProjectService.getAllProjects())
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null)
  const [showCreateSprint, setShowCreateSprint] = useState(false)
  const [newSprintName, setNewSprintName] = useState('')
  const [newSprintGoal, setNewSprintGoal] = useState('')
  const [newSprintStartDate, setNewSprintStartDate] = useState('')
  const [newSprintEndDate, setNewSprintEndDate] = useState('')

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProjectId) {
      loadSprints()
    }
  }, [selectedProjectId])

  const loadProjects = () => {
    setProjects(ProjectService.getAllProjects())
  }

  const loadSprints = () => {
    if (selectedProjectId) {
      const projectSprints = SprintService.getSprintsForProject(selectedProjectId)
      setSprints(projectSprints)
    }
  }

  const handleCreateSprint = () => {
    if (!newSprintName.trim() || !selectedProjectId || !newSprintStartDate || !newSprintEndDate) {
      toastService.error('Заполните все обязательные поля')
      return
    }

    const sprint = SprintService.createSprint(
      selectedProjectId,
      newSprintName.trim(),
      new Date(newSprintStartDate),
      new Date(newSprintEndDate),
      newSprintGoal.trim() || undefined
    )

    toastService.success('Спринт создан')
    setShowCreateSprint(false)
    setNewSprintName('')
    setNewSprintGoal('')
    setNewSprintStartDate('')
    setNewSprintEndDate('')
    loadSprints()
  }

  const handleStartSprint = (sprintId: string) => {
    SprintService.startSprint(sprintId)
    toastService.success('Спринт запущен')
    loadSprints()
    if (selectedSprint?.id === sprintId) {
      const updated = SprintService.getSprint(sprintId)
      if (updated) setSelectedSprint(updated)
    }
  }

  const handleCompleteSprint = (sprintId: string) => {
    SprintService.completeSprint(sprintId)
    toastService.success('Спринт завершен')
    loadSprints()
    if (selectedSprint?.id === sprintId) {
      const updated = SprintService.getSprint(sprintId)
      if (updated) setSelectedSprint(updated)
    }
  }

  const handleAddTaskToSprint = (sprintId: string, taskId: string) => {
    SprintService.addTaskToSprint(sprintId, taskId)
    toastService.success('Задача добавлена в спринт')
    loadSprints()
    if (selectedSprint?.id === sprintId) {
      const updated = SprintService.getSprint(sprintId)
      if (updated) setSelectedSprint(updated)
    }
  }

  const sprintStats = selectedSprint
    ? SprintService.getSprintStatistics(selectedSprint, taskManager.getTasks())
    : null

  const availableTasks = taskManager.getTasks().filter(t => !t.isCompleted)

  return (
    <div className="sprint-overlay" onClick={onClose}>
      <div className="sprint-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sprint-header">
          <h2>🏃 Спринты</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="sprint-content">
          <div className="project-selector">
            <label>Выберите проект:</label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value)
                setSelectedSprint(null)
              }}
              className="form-select"
            >
              <option value="">Выберите проект...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.icon} {project.name}
                </option>
              ))}
            </select>
          </div>

          {selectedProjectId && (
            <>
              <div className="sprint-actions">
                <button
                  className="btn-primary"
                  onClick={() => setShowCreateSprint(!showCreateSprint)}
                >
                  {showCreateSprint ? '✕ Отмена' : '+ Создать спринт'}
                </button>
              </div>

              {showCreateSprint && (
                <div className="create-sprint-form">
                  <div className="form-group">
                    <label>Название спринта *</label>
                    <input
                      type="text"
                      value={newSprintName}
                      onChange={(e) => setNewSprintName(e.target.value)}
                      className="form-input"
                      placeholder="Например: Спринт 1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Цель спринта</label>
                    <textarea
                      value={newSprintGoal}
                      onChange={(e) => setNewSprintGoal(e.target.value)}
                      className="form-textarea"
                      rows={3}
                      placeholder="Цель спринта..."
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Дата начала *</label>
                      <input
                        type="date"
                        value={newSprintStartDate}
                        onChange={(e) => setNewSprintStartDate(e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Дата окончания *</label>
                      <input
                        type="date"
                        value={newSprintEndDate}
                        onChange={(e) => setNewSprintEndDate(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <button onClick={handleCreateSprint} className="btn-primary">
                    Создать спринт
                  </button>
                </div>
              )}

              <div className="sprints-list">
                <h3>Спринты проекта ({sprints.length})</h3>
                {sprints.length === 0 ? (
                  <p className="empty-state">Нет спринтов. Создайте первый спринт!</p>
                ) : (
                  sprints.map(sprint => (
                    <div
                      key={sprint.id}
                      className={`sprint-item ${selectedSprint?.id === sprint.id ? 'selected' : ''}`}
                      onClick={() => setSelectedSprint(sprint)}
                    >
                      <div className="sprint-item-info">
                        <h4>{sprint.name}</h4>
                        <div className="sprint-dates">
                          {format(new Date(sprint.startDate), 'dd.MM.yyyy')} - {format(new Date(sprint.endDate), 'dd.MM.yyyy')}
                        </div>
                        <div className={`sprint-status sprint-status-${sprint.status}`}>
                          {sprint.status === 'planned' && '⏳ Запланирован'}
                          {sprint.status === 'active' && '🔄 Активен'}
                          {sprint.status === 'completed' && '✅ Завершен'}
                          {sprint.status === 'cancelled' && '❌ Отменен'}
                        </div>
                      </div>
                      <div className="sprint-item-actions">
                        {sprint.status === 'planned' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartSprint(sprint.id)
                            }}
                            className="btn-secondary-small"
                          >
                            Запустить
                          </button>
                        )}
                        {sprint.status === 'active' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCompleteSprint(sprint.id)
                            }}
                            className="btn-secondary-small"
                          >
                            Завершить
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {selectedSprint && (
                <div className="sprint-details">
                  <div className="sprint-details-header">
                    <h3>{selectedSprint.name}</h3>
                    {selectedSprint.goal && (
                      <p className="sprint-goal">{selectedSprint.goal}</p>
                    )}
                  </div>

                  {sprintStats && (
                    <div className="sprint-stats">
                      <div className="stat-item">
                        <span className="stat-label">Всего задач:</span>
                        <span className="stat-value">{sprintStats.totalTasks}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Выполнено:</span>
                        <span className="stat-value">{sprintStats.completedTasks}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Процент выполнения:</span>
                        <span className="stat-value">{sprintStats.completionRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  )}

                  <div className="sprint-tasks-section">
                    <h4>Задачи в спринте ({selectedSprint.tasks.length})</h4>
                    <div className="tasks-list">
                      {selectedSprint.tasks.length === 0 ? (
                        <p className="empty-state">Нет задач в спринте</p>
                      ) : (
                        selectedSprint.tasks.map(taskId => {
                          const task = taskManager.getTasks().find(t => t.id === taskId)
                          return task ? (
                            <div key={taskId} className="task-item">
                              <span className={task.isCompleted ? 'completed' : ''}>
                                {task.title}
                              </span>
                              <span className="task-status">
                                {task.isCompleted ? '✅' : '⏳'}
                              </span>
                            </div>
                          ) : null
                        })
                      )}
                    </div>
                    <div className="add-task-section">
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddTaskToSprint(selectedSprint.id, e.target.value)
                            e.target.value = ''
                          }
                        }}
                        className="form-select"
                      >
                        <option value="">Добавить задачу...</option>
                        {availableTasks
                          .filter(t => !selectedSprint.tasks.includes(t.id))
                          .map(task => (
                            <option key={task.id} value={task.id}>
                              {task.title}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

