import React, { useState, useEffect } from 'react'
import { MilestoneService, Milestone } from '../services/MilestoneService'
import { ProjectService } from '../services/ProjectService'
import { TaskManager } from '../services/TaskManager'
import { Task } from '../types/Task'
import './MilestonePanel.css'

interface MilestonePanelProps {
  projectId: string
  onClose: () => void
}

export const MilestonePanel: React.FC<MilestonePanelProps> = ({ projectId, onClose }) => {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    description: '',
    dueDate: '',
    color: '#007AFF'
  })

  useEffect(() => {
    loadMilestones()
    loadTasks()
  }, [projectId])

  const loadMilestones = () => {
    const projectMilestones = MilestoneService.getMilestonesForProject(projectId)
    setMilestones(projectMilestones)
  }

  const loadTasks = () => {
    const project = ProjectService.getProject(projectId)
    if (project) {
      const allTasks = TaskManager.getTasks()
      const projectTasks = allTasks.filter(t => project.lists.includes(t.listId))
      setTasks(projectTasks)
    }
  }

  const handleCreateMilestone = () => {
    if (!newMilestone.name || !newMilestone.dueDate) return

    MilestoneService.createMilestone(
      newMilestone.name,
      projectId,
      new Date(newMilestone.dueDate),
      newMilestone.description || undefined,
      newMilestone.color
    )

    setNewMilestone({ name: '', description: '', dueDate: '', color: '#007AFF' })
    setShowAddModal(false)
    loadMilestones()
  }

  const handleDeleteMilestone = (milestoneId: string) => {
    if (confirm('Удалить милистоун?')) {
      MilestoneService.deleteMilestone(milestoneId)
      loadMilestones()
    }
  }

  const handleToggleComplete = (milestone: Milestone) => {
    MilestoneService.updateMilestone(milestone.id, { completed: !milestone.completed })
    loadMilestones()
  }

  const handleLinkTask = (milestoneId: string, taskId: string) => {
    MilestoneService.linkTaskToMilestone(milestoneId, taskId)
    loadMilestones()
  }

  const handleUnlinkTask = (milestoneId: string, taskId: string) => {
    MilestoneService.unlinkTaskFromMilestone(milestoneId, taskId)
    loadMilestones()
  }

  const getMilestoneProgress = (milestone: Milestone) => {
    return MilestoneService.getMilestoneProgress(milestone.id, tasks)
  }

  const upcomingMilestones = MilestoneService.getUpcomingMilestones(7)
  const overdueMilestones = MilestoneService.getOverdueMilestones()

  return (
    <div className="milestone-panel">
      <div className="milestone-panel-header">
        <h2>🎯 Милистоуны</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="milestone-panel-content">
        <div className="milestone-alerts">
          {overdueMilestones.length > 0 && (
            <div className="alert overdue">
              <strong>Просрочено:</strong> {overdueMilestones.length} милистоунов
            </div>
          )}
          {upcomingMilestones.length > 0 && (
            <div className="alert upcoming">
              <strong>Скоро:</strong> {upcomingMilestones.length} милистоунов в ближайшие 7 дней
            </div>
          )}
        </div>

        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          + Создать милистоун
        </button>

        <div className="milestones-list">
          {milestones.map(milestone => {
            const progress = getMilestoneProgress(milestone)
            const milestoneTasks = MilestoneService.getTasksForMilestone(milestone.id, tasks)
            const isOverdue = !milestone.completed && milestone.dueDate < new Date()
            const daysUntil = Math.ceil((milestone.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

            return (
              <div key={milestone.id} className={`milestone-card ${milestone.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
                <div className="milestone-header">
                  <div className="milestone-info">
                    <h3>{milestone.name}</h3>
                    {milestone.description && <p>{milestone.description}</p>}
                    <div className="milestone-meta">
                      <span>📅 {milestone.dueDate.toLocaleDateString()}</span>
                      {!milestone.completed && (
                        <span className={isOverdue ? 'overdue-text' : ''}>
                          {isOverdue ? `Просрочено на ${Math.abs(daysUntil)} дн.` : `Осталось ${daysUntil} дн.`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="milestone-actions">
                    <button onClick={() => handleToggleComplete(milestone)}>
                      {milestone.completed ? '✓' : '○'}
                    </button>
                    <button onClick={() => handleDeleteMilestone(milestone.id)}>🗑️</button>
                  </div>
                </div>

                <div className="milestone-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${progress.percentage}%`, backgroundColor: milestone.color }}
                    />
                  </div>
                  <span>{progress.completed} / {progress.total} задач</span>
                </div>

                <div className="milestone-tasks">
                  <strong>Задачи:</strong>
                  <div className="task-links">
                    {milestoneTasks.map(task => (
                      <span key={task.id} className="task-link">
                        {task.title}
                        <button onClick={() => handleUnlinkTask(milestone.id, task.id)}>×</button>
                      </span>
                    ))}
                    <select 
                      onChange={(e) => {
                        if (e.target.value) {
                          handleLinkTask(milestone.id, e.target.value)
                          e.target.value = ''
                        }
                      }}
                    >
                      <option value="">+ Добавить задачу</option>
                      {tasks
                        .filter(t => !milestone.taskIds.includes(t.id))
                        .map(task => (
                          <option key={task.id} value={task.id}>{task.title}</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Создать милистоун</h3>
            <input
              type="text"
              placeholder="Название"
              value={newMilestone.name}
              onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
            />
            <textarea
              placeholder="Описание"
              value={newMilestone.description}
              onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
            />
            <input
              type="date"
              value={newMilestone.dueDate}
              onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
            />
            <input
              type="color"
              value={newMilestone.color}
              onChange={(e) => setNewMilestone({ ...newMilestone, color: e.target.value })}
            />
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleCreateMilestone}>Создать</button>
              <button onClick={() => setShowAddModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

