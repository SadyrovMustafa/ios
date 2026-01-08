import { useState, useEffect } from 'react'
import { ArchiveService } from '../services/ArchiveService'
import { Task, TaskList } from '../types/Task'
import { TaskManager } from '../services/TaskManager'
import './ArchiveView.css'

interface ArchiveViewProps {
  taskManager: TaskManager
  onClose: () => void
}

export default function ArchiveView({ taskManager, onClose }: ArchiveViewProps) {
  const [archivedTasks, setArchivedTasks] = useState<Array<Task & { archivedAt: Date }>>([])
  const [archivedLists, setArchivedLists] = useState<Array<TaskList & { archivedAt: Date }>>([])
  const [activeTab, setActiveTab] = useState<'tasks' | 'lists'>('tasks')

  useEffect(() => {
    loadArchived()
  }, [])

  const loadArchived = () => {
    setArchivedTasks(ArchiveService.getArchivedTasks())
    setArchivedLists(ArchiveService.getArchivedLists())
  }

  const handleRestoreTask = (taskId: string) => {
    const task = ArchiveService.restoreTask(taskId)
    if (task) {
      taskManager.addTask(task)
      loadArchived()
    }
  }

  const handleRestoreList = (listId: string) => {
    const list = ArchiveService.restoreList(listId)
    if (list) {
      taskManager.addList(list)
      loadArchived()
    }
  }

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Permanently delete this archived task?')) {
      ArchiveService.deleteArchivedTask(taskId)
      loadArchived()
    }
  }

  const handleDeleteList = (listId: string) => {
    if (confirm('Permanently delete this archived list?')) {
      ArchiveService.deleteArchivedList(listId)
      loadArchived()
    }
  }

  return (
    <div className="archive-overlay" onClick={onClose}>
      <div className="archive-modal" onClick={(e) => e.stopPropagation()}>
        <div className="archive-header">
          <h2>📦 Archive</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="archive-tabs">
          <button
            className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks ({archivedTasks.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'lists' ? 'active' : ''}`}
            onClick={() => setActiveTab('lists')}
          >
            Lists ({archivedLists.length})
          </button>
        </div>

        <div className="archive-content">
          {activeTab === 'tasks' ? (
            archivedTasks.length === 0 ? (
              <p className="empty-state">No archived tasks</p>
            ) : (
              <div className="archived-items">
                {archivedTasks.map(task => (
                  <div key={task.id} className="archived-item">
                    <div className="item-info">
                      <h3>{task.title}</h3>
                      <p className="archived-date">
                        Archived: {new Date(task.archivedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="item-actions">
                      <button
                        onClick={() => handleRestoreTask(task.id)}
                        className="restore-btn"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            archivedLists.length === 0 ? (
              <p className="empty-state">No archived lists</p>
            ) : (
              <div className="archived-items">
                {archivedLists.map(list => (
                  <div key={list.id} className="archived-item">
                    <div className="item-info">
                      <h3>{list.icon} {list.name}</h3>
                      <p className="archived-date">
                        Archived: {new Date(list.archivedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="item-actions">
                      <button
                        onClick={() => handleRestoreList(list.id)}
                        className="restore-btn"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handleDeleteList(list.id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

