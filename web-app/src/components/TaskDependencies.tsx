import { useState, useEffect } from 'react'
import { Task } from '../types/Task'
import { TaskManager } from '../services/TaskManager'
import './TaskDependencies.css'

interface TaskDependenciesProps {
  task: Task
  taskManager: TaskManager
  onUpdate: (task: Task) => void
  onClose: () => void
}

export default function TaskDependencies({ task, taskManager, onUpdate, onClose }: TaskDependenciesProps) {
  const [dependencies, setDependencies] = useState<string[]>(task.dependsOn || [])
  const [blockedBy, setBlockedBy] = useState<string[]>(task.blockedBy || [])
  const [allTasks, setAllTasks] = useState<Task[]>([])

  useEffect(() => {
    setAllTasks(taskManager.getTasks().filter(t => t.id !== task.id && !t.isCompleted))
  }, [taskManager, task.id])

  const handleAddDependency = (taskId: string) => {
    if (!dependencies.includes(taskId)) {
      const newDeps = [...dependencies, taskId]
      setDependencies(newDeps)
      onUpdate({ ...task, dependsOn: newDeps })
    }
  }

  const handleRemoveDependency = (taskId: string) => {
    const newDeps = dependencies.filter(id => id !== taskId)
    setDependencies(newDeps)
    onUpdate({ ...task, dependsOn: newDeps.length > 0 ? newDeps : undefined })
  }

  const handleAddBlockedBy = (taskId: string) => {
    if (!blockedBy.includes(taskId)) {
      const newBlocked = [...blockedBy, taskId]
      setBlockedBy(newBlocked)
      onUpdate({ ...task, blockedBy: newBlocked })
    }
  }

  const handleRemoveBlockedBy = (taskId: string) => {
    const newBlocked = blockedBy.filter(id => id !== taskId)
    setBlockedBy(newBlocked)
    onUpdate({ ...task, blockedBy: newBlocked.length > 0 ? newBlocked : undefined })
  }

  const getCriticalPath = (): string[] => {
    const visited = new Set<string>()
    const path: string[] = []

    const dfs = (taskId: string) => {
      if (visited.has(taskId)) return
      visited.add(taskId)
      const t = allTasks.find(ta => ta.id === taskId)
      if (t && t.dependsOn) {
        t.dependsOn.forEach(depId => dfs(depId))
      }
      path.push(taskId)
    }

    dfs(task.id)
    return path.reverse()
  }

  const criticalPath = getCriticalPath()

  return (
    <div className="dependencies-overlay" onClick={onClose}>
      <div className="dependencies-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dependencies-header">
          <h2>🔗 Task Dependencies</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="dependencies-content">
          <div className="dependency-section">
            <h3>Depends On (must complete first)</h3>
            <div className="dependency-list">
              {dependencies.map(depId => {
                const depTask = allTasks.find(t => t.id === depId)
                return depTask ? (
                  <div key={depId} className="dependency-item">
                    <span>{depTask.title}</span>
                    <button
                      onClick={() => handleRemoveDependency(depId)}
                      className="remove-btn"
                    >
                      ×
                    </button>
                  </div>
                ) : null
              })}
            </div>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddDependency(e.target.value)
                  e.target.value = ''
                }
              }}
              className="dependency-select"
            >
              <option value="">Add dependency...</option>
              {allTasks
                .filter(t => !dependencies.includes(t.id))
                .map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
            </select>
          </div>

          <div className="dependency-section">
            <h3>Blocked By (blocks these tasks)</h3>
            <div className="dependency-list">
              {blockedBy.map(blockId => {
                const blockTask = allTasks.find(t => t.id === blockId)
                return blockTask ? (
                  <div key={blockId} className="dependency-item">
                    <span>{blockTask.title}</span>
                    <button
                      onClick={() => handleRemoveBlockedBy(blockId)}
                      className="remove-btn"
                    >
                      ×
                    </button>
                  </div>
                ) : null
              })}
            </div>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddBlockedBy(e.target.value)
                  e.target.value = ''
                }
              }}
              className="dependency-select"
            >
              <option value="">Add blocked task...</option>
              {allTasks
                .filter(t => !blockedBy.includes(t.id))
                .map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
            </select>
          </div>

          {criticalPath.length > 1 && (
            <div className="critical-path-section">
              <h3>Critical Path</h3>
              <div className="critical-path">
                {criticalPath.map((taskId, index) => {
                  const t = allTasks.find(ta => ta.id === taskId) || task
                  return (
                    <div key={taskId} className="path-item">
                      {index > 0 && <span className="path-arrow">→</span>}
                      <span className={taskId === task.id ? 'current-task' : ''}>
                        {t.title}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

