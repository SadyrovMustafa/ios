import { useState, useEffect, useRef } from 'react'
import { Task } from '../types/Task'
import TaskItem from './TaskItem'
import './MultiSelectTaskList.css'

interface MultiSelectTaskListProps {
  tasks: Task[]
  onToggleComplete: (task: Task) => void
  onDelete: (taskId: string) => void
  onClick: (task: Task) => void
  onBulkAction?: (taskIds: string[], action: 'delete' | 'complete' | 'archive') => void
}

export default function MultiSelectTaskList({
  tasks,
  onToggleComplete,
  onDelete,
  onClick,
  onBulkAction
}: MultiSelectTaskListProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + A для выбора всех
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && isMultiSelectMode) {
        e.preventDefault()
        setSelectedTasks(new Set(tasks.map(t => t.id)))
      }

      // Escape для выхода из режима
      if (e.key === 'Escape' && isMultiSelectMode) {
        setIsMultiSelectMode(false)
        setSelectedTasks(new Set())
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMultiSelectMode, tasks])

  const toggleSelection = (taskId: string) => {
    const newSelection = new Set(selectedTasks)
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId)
    } else {
      newSelection.add(taskId)
    }
    setSelectedTasks(newSelection)

    if (!isMultiSelectMode && newSelection.size > 0) {
      setIsMultiSelectMode(true)
    }
    if (newSelection.size === 0) {
      setIsMultiSelectMode(false)
    }
  }

  const handleTaskClick = (task: Task, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey || isMultiSelectMode) {
      e.stopPropagation()
      toggleSelection(task.id)
    } else {
      onClick(task)
    }
  }

  const handleBulkAction = (action: 'delete' | 'complete' | 'archive') => {
    if (selectedTasks.size === 0 || !onBulkAction) return

    onBulkAction(Array.from(selectedTasks), action)
    setSelectedTasks(new Set())
    setIsMultiSelectMode(false)
  }

  const selectAll = () => {
    setSelectedTasks(new Set(tasks.map(t => t.id)))
    setIsMultiSelectMode(true)
  }

  const clearSelection = () => {
    setSelectedTasks(new Set())
    setIsMultiSelectMode(false)
  }

  return (
    <div className="multi-select-container" ref={containerRef}>
      {isMultiSelectMode && (
        <div className="multi-select-toolbar">
          <div className="selection-info">
            Выбрано: {selectedTasks.size} из {tasks.length}
          </div>
          <div className="toolbar-actions">
            <button
              onClick={selectAll}
              className="toolbar-btn"
              disabled={selectedTasks.size === tasks.length}
            >
              Выбрать все
            </button>
            <button
              onClick={clearSelection}
              className="toolbar-btn"
            >
              Снять выбор
            </button>
            {onBulkAction && (
              <>
                <button
                  onClick={() => handleBulkAction('complete')}
                  className="toolbar-btn success"
                >
                  ✓ Выполнить
                </button>
                <button
                  onClick={() => handleBulkAction('archive')}
                  className="toolbar-btn"
                >
                  📦 Архивировать
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="toolbar-btn danger"
                >
                  🗑️ Удалить
                </button>
              </>
            )}
            <button
              onClick={clearSelection}
              className="toolbar-btn"
            >
              ✕ Отмена
            </button>
          </div>
        </div>
      )}

      <div className="multi-select-hint">
        {!isMultiSelectMode && (
          <span className="hint-text">
            💡 Удерживайте Ctrl/Cmd и кликайте для выбора нескольких задач
          </span>
        )}
      </div>

      <div className="task-list">
        {tasks.map(task => (
          <div
            key={task.id}
            className={`task-wrapper ${selectedTasks.has(task.id) ? 'selected' : ''}`}
            onClick={(e) => handleTaskClick(task, e)}
          >
            {isMultiSelectMode && (
              <div className="selection-checkbox">
                <input
                  type="checkbox"
                  checked={selectedTasks.has(task.id)}
                  onChange={() => toggleSelection(task.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <TaskItem
              task={task}
              onToggleComplete={() => onToggleComplete(task)}
              onDelete={() => onDelete(task.id)}
              onClick={() => onClick(task)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

