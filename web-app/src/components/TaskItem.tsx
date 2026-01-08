import { useState, useEffect, useRef } from 'react'
import { Task, PriorityColors } from '../types/Task'
import { format, isToday } from 'date-fns'
import { FileStorageService } from '../services/FileStorageService'
import { TagColorService } from '../services/TagColorService'
import { NotificationSoundService } from '../services/NotificationSoundService'
import { VibrationService } from '../services/VibrationService'
import ContextMenu, { ContextMenuItem } from './ContextMenu'
import GestureHandler from './GestureHandler'
import './TaskItem.css'

interface TaskItemProps {
  task: Task
  onToggleComplete: () => void
  onDelete: () => void
  onClick: () => void
}

export default function TaskItem({
  task,
  onToggleComplete,
  onDelete,
  onClick
}: TaskItemProps) {
  const [hasAttachments, setHasAttachments] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const itemRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkAttachments = async () => {
      try {
        const files = await FileStorageService.getFilesForTask(task.id)
        setHasAttachments(files.length > 0)
      } catch (error) {
        // Ignore errors
      }
    }
    checkAttachments()
  }, [task.id])

  // Настройка жестов свайпа
  useEffect(() => {
    if (!itemRef.current) return

    let startX = 0
    let startY = 0
    let isSwiping = false

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      startX = touch.clientX
      startY = touch.clientY
      isSwiping = true
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping) return
      const touch = e.touches[0]
      const deltaX = Math.abs(touch.clientX - startX)
      const deltaY = Math.abs(touch.clientY - startY)
      
      if (deltaX > 10 || deltaY > 10) {
        e.preventDefault()
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - startX
      const deltaY = touch.clientY - startY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      if (distance >= 50) {
        const absX = Math.abs(deltaX)
        const absY = Math.abs(deltaY)

        if (absX > absY) {
          if (deltaX > 0) {
            // Свайп вправо - выполнить
            VibrationService.vibrateSwipe()
            onToggleComplete()
          } else {
            // Свайп влево - удалить
            VibrationService.vibrateSwipe()
            onDelete()
          }
        }
      }

      isSwiping = false
    }

    const element = itemRef.current
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onDelete, onToggleComplete])

  const isOverdue = task.dueDate && 
    new Date(task.dueDate) < new Date() && 
    !task.isCompleted &&
    !isToday(new Date(task.dueDate))

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const contextMenuItems: ContextMenuItem[] = [
    {
      label: task.isCompleted ? 'Отметить невыполненной' : 'Выполнить',
      icon: task.isCompleted ? '↩️' : '✓',
      action: onToggleComplete
    },
    {
      label: 'Удалить',
      icon: '🗑️',
      action: () => {
        if (confirm('Удалить задачу?')) {
          onDelete()
        }
      }
    }
  ]

  return (
    <GestureHandler
      onLongPress={() => {
        setContextMenu({ x: 0, y: 0 })
      }}
      onDoubleTap={onClick}
      onSwipeLeft={onDelete}
      onSwipeRight={onToggleComplete}
    >
      <div
        ref={itemRef}
        className={`task-item ${task.isCompleted ? 'completed' : ''} ${swipeOffset !== 0 ? 'swiping' : ''}`}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        style={{
          transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : undefined,
          transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none'
        }}
      >
      <button
        className="task-checkbox"
        onClick={(e) => {
          e.stopPropagation()
          VibrationService.vibrateTaskComplete()
          onToggleComplete()
        }}
        aria-label={task.isCompleted ? 'Uncomplete task' : 'Complete task'}
      >
        {task.isCompleted ? '✓' : ''}
      </button>

      <div className="task-content">
        <div className="task-title-row">
          <h3 className={`task-title ${task.isCompleted ? 'strikethrough' : ''}`}>
            {task.title}
          </h3>
          {task.priority !== 'none' && (
            <span
              className={`task-priority task-priority-${task.priority}`}
              style={{ backgroundColor: PriorityColors[task.priority] }}
              title={`Приоритет: ${task.priority}`}
            />
          )}
        </div>

        {task.notes && (
          <p className="task-notes">{task.notes}</p>
        )}

            {task.tags && task.tags.length > 0 && (
              <div className="task-tags">
                {task.tags.map(tag => {
                  const tagColor = TagColorService.getColorForTag(tag)
                  return (
                    <span
                      key={tag}
                      className="task-tag"
                      style={{
                        backgroundColor: tagColor,
                        color: 'white'
                      }}
                    >
                      {tag}
                    </span>
                  )
                })}
              </div>
            )}

        {task.subtasks && task.subtasks.length > 0 && (
          <div className="task-subtasks-indicator">
            📝 {task.subtasks.filter(st => st.isCompleted).length} / {task.subtasks.length} subtasks
          </div>
        )}

        <div className="task-meta">
        {hasAttachments && (
          <span className="task-attachment-indicator" title="Has attachments">
            📎
          </span>
        )}
        {task.recurring && (
          <span className="task-recurring-indicator" title={`Repeats ${task.recurring.type}`}>
            🔄
          </span>
        )}
        {task.reminderDate && (
          <span className="task-reminder-indicator" title="Has reminder">
            🔔
          </span>
        )}
          {task.dueDate && (
            <span className={`task-due-date ${isOverdue ? 'overdue' : ''}`}>
              📅 {format(new Date(task.dueDate), 'MMM d, yyyy HH:mm')}
            </span>
          )}
        </div>
      </div>

      <button
        className="task-delete"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        aria-label="Delete task"
      >
        🗑️
      </button>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
      </div>
    </GestureHandler>
  )
}

