import { useState, useEffect } from 'react'
import { Task, TaskList, Priority, PriorityColors, PriorityLabels, RecurringPattern } from '../types/Task'
import { TaskManager } from '../services/TaskManager'
import { format } from 'date-fns'
import TagsInput from './TagsInput'
import TagHierarchyEditor from './TagHierarchyEditor'
import SubtaskList from './SubtaskList'
import RecurringTaskModal from './RecurringTaskModal'
import FileAttachment from './FileAttachment'
import MarkdownEditor from './MarkdownEditor'
import TaskDependencies from './TaskDependencies'
import TaskChat from './TaskChat'
import VoiceNote from './VoiceNote'
import CameraCapture from './CameraCapture'
import ContextMenu, { ContextMenuItem } from './ContextMenu'
import LocationReminder from './LocationReminder'
import FocusStatsPanel from './FocusStatsPanel'
import TimeEstimatePanel from './TimeEstimatePanel'
import SmartDateInput from './SmartDateInput'
import TaskHistory from './TaskHistory'
import SmartReminderPanel from './SmartReminderPanel'
import TaskAssignmentPanel from './TaskAssignmentPanel'
import TaskMentionInput from './TaskMentionInput'
import { TimeEstimateService } from '../services/TimeEstimateService'
import { NotificationSoundService } from '../services/NotificationSoundService'
import { TaskHistoryService } from '../services/TaskHistoryService'
import { ArchiveService } from '../services/ArchiveService'
import { toastService } from '../services/ToastService'
import { useRef } from 'react'
import './Modal.css'

interface TaskDetailModalProps {
  task: Task
  onClose: () => void
  onUpdate: (task: Task) => void
  onDelete: (taskId: string) => void
  taskManager: TaskManager
}

export default function TaskDetailModal({
  task,
  onClose,
  onUpdate,
  onDelete,
  taskManager
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes)
  const [listId, setListId] = useState(task.listId)
  const [hasDueDate, setHasDueDate] = useState(!!task.dueDate)
  const [dueDate, setDueDate] = useState(
    task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm") : ''
  )
  const [priority, setPriority] = useState<Priority>(task.priority)
  const [lists] = useState<TaskList[]>(taskManager.getLists())
  const [tags, setTags] = useState<string[]>(task.tags || [])
  const [subtasks, setSubtasks] = useState<Task['subtasks']>(task.subtasks || [])
  const [hasReminder, setHasReminder] = useState(!!task.reminderDate)
  const [reminderDate, setReminderDate] = useState(
    task.reminderDate ? format(new Date(task.reminderDate), "yyyy-MM-dd'T'HH:mm") : ''
  )
  const [showRecurring, setShowRecurring] = useState(false)
  const [recurring, setRecurring] = useState<RecurringPattern | undefined>(task.recurring)
  const [showDependencies, setShowDependencies] = useState(false)
  const [showLocationReminder, setShowLocationReminder] = useState(false)
  const [showSmartReminder, setShowSmartReminder] = useState(false)
  const [showTaskAssignment, setShowTaskAssignment] = useState(false)
  const [showFocusStats, setShowFocusStats] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showVoiceNote, setShowVoiceNote] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const taskRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTitle(task.title)
    setNotes(task.notes)
    setListId(task.listId)
    setHasDueDate(!!task.dueDate)
    setDueDate(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm") : '')
    setPriority(task.priority)
    setTags(task.tags || [])
    setSubtasks(task.subtasks || [])
    setHasReminder(!!task.reminderDate)
    setReminderDate(task.reminderDate ? format(new Date(task.reminderDate), "yyyy-MM-dd'T'HH:mm") : '')
    setRecurring(task.recurring)
  }, [task])

  const handleSave = () => {
    const oldTask = task
    const updatedTask: Task = {
      ...task,
      title: title.trim(),
      notes: notes.trim(),
      listId,
      priority,
      dueDate: hasDueDate && dueDate ? new Date(dueDate) : undefined,
      tags: tags.length > 0 ? tags : undefined,
      subtasks: subtasks && subtasks.length > 0 ? subtasks : undefined,
      reminderDate: hasReminder && reminderDate ? new Date(reminderDate) : undefined,
      recurring
    }
    
    // Отслеживаем изменения для истории
    const changes: Partial<Task> = {}
    if (oldTask.title !== updatedTask.title) {
      TaskHistoryService.addEntry({
        taskId: task.id,
        action: 'updated',
        field: 'title',
        oldValue: oldTask.title,
        newValue: updatedTask.title,
        changes: { title: updatedTask.title }
      })
    }
    if (oldTask.priority !== updatedTask.priority) {
      TaskHistoryService.addEntry({
        taskId: task.id,
        action: 'updated',
        field: 'priority',
        oldValue: oldTask.priority,
        newValue: updatedTask.priority,
        changes: { priority: updatedTask.priority }
      })
    }
    if (oldTask.listId !== updatedTask.listId) {
      TaskHistoryService.addEntry({
        taskId: task.id,
        action: 'updated',
        field: 'listId',
        oldValue: oldTask.listId,
        newValue: updatedTask.listId,
        changes: { listId: updatedTask.listId }
      })
    }
    
    onUpdate(updatedTask)
    setIsEditing(false)
  }

  const list = lists.find(l => l.id === listId)

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={taskRef}
        className="modal-content modal-content-large"
        onClick={(e) => e.stopPropagation()}
        onContextMenu={handleContextMenu}
      >
        <div className="modal-header">
          <h2 className="modal-title">Task Details</h2>
          <div>
            {!isEditing && (
              <button className="btn-secondary" onClick={() => setIsEditing(true)}>
                Edit
              </button>
            )}
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>

        {isEditing ? (
          <div className="modal-form">
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label className="form-label">List</label>
              <select
                className="form-select"
                value={listId}
                onChange={(e) => setListId(e.target.value)}
              >
                {lists.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.icon} {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  checked={hasDueDate}
                  onChange={(e) => setHasDueDate(e.target.checked)}
                />
                <span>Set due date</span>
              </label>
              {hasDueDate && (
                <input
                  type="datetime-local"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Tags</label>
              <TagsInput
                tags={tags}
                onChange={setTags}
                suggestions={[]}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Subtasks</label>
              <SubtaskList
                subtasks={subtasks || []}
                onUpdate={setSubtasks}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Attachments</label>
              <FileAttachment taskId={task.id} readOnly={false} />
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <div className="priority-buttons">
                {Object.values(Priority).map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`priority-btn ${priority === p ? 'active' : ''}`}
                    onClick={() => setPriority(p)}
                    style={{
                      borderColor: priority === p ? PriorityColors[p] : 'transparent'
                    }}
                  >
                    <span
                      className="priority-dot"
                      style={{ backgroundColor: PriorityColors[p] }}
                    />
                    {PriorityLabels[p]}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  checked={hasReminder}
                  onChange={(e) => setHasReminder(e.target.checked)}
                />
                <span>Set reminder</span>
              </label>
              {hasReminder && (
                <input
                  type="datetime-local"
                  className="form-input"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                />
              )}
            </div>

            <div className="form-group">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowRecurring(true)}
              >
                {recurring ? '🔄 Edit Recurring' : '🔄 Set Recurring'}
              </button>
              {recurring && (
                <span className="recurring-info">
                  Repeats: {recurring.type} (every {recurring.interval})
                </span>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  onDelete(task.id)
                }}
              >
                Delete
              </button>
              <div>
                <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="button" className="btn-primary" onClick={handleSave}>
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="task-detail-content">
            <div className="task-detail-header">
              <h3 className={`task-detail-title ${task.isCompleted ? 'completed' : ''}`}>
                {task.title}
              </h3>
            </div>

            {task.notes && (
              <div className="task-detail-section">
                <h4 className="task-detail-section-title">Notes</h4>
                <MarkdownEditor value={task.notes} onChange={() => {}} />
              </div>
            )}

            <div className="task-detail-section">
              <h4 className="task-detail-section-title">Обсуждение</h4>
              <TaskChat 
                taskId={task.id}
                availableUsers={taskManager.getLists().flatMap(list => 
                  // В реальном приложении здесь будут пользователи из CollaborationService
                  [{ id: 'user1', name: 'You' }, { id: 'user2', name: 'Team Member' }]
                )}
              />
            </div>

            {task.tags && task.tags.length > 0 && (
              <div className="task-detail-section">
                <h4 className="task-detail-section-title">Tags</h4>
                <div className="task-detail-tags">
                  {task.tags.map(tag => (
                    <span key={tag} className="task-detail-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {task.subtasks && task.subtasks.length > 0 && (
              <div className="task-detail-section">
                <h4 className="task-detail-section-title">Subtasks</h4>
                <SubtaskList
                  subtasks={task.subtasks}
                  onUpdate={(newSubtasks) => {
                    const updatedTask = { ...task, subtasks: newSubtasks }
                    onUpdate(updatedTask)
                  }}
                />
              </div>
            )}

            <div className="task-detail-section">
              <h4 className="task-detail-section-title">Attachments</h4>
              <FileAttachment taskId={task.id} readOnly={!isEditing} />
            </div>

            <div className="task-detail-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 className="task-detail-section-title">Dependencies</h4>
                <button
                  onClick={() => setShowDependencies(true)}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  Manage
                </button>
              </div>
              {(task.dependsOn && task.dependsOn.length > 0) || (task.blockedBy && task.blockedBy.length > 0) ? (
                <div>
                  {task.dependsOn && task.dependsOn.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Depends on:</strong> {task.dependsOn.length} task(s)
                    </div>
                  )}
                  {task.blockedBy && task.blockedBy.length > 0 && (
                    <div>
                      <strong>Blocks:</strong> {task.blockedBy.length} task(s)
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>No dependencies</p>
              )}
            </div>

            {showDependencies && (
              <TaskDependencies
                task={task}
                taskManager={taskManager}
                onUpdate={onUpdate}
                onClose={() => setShowDependencies(false)}
              />
            )}

            <div className="task-detail-section">
              <h4 className="task-detail-section-title">Время выполнения</h4>
              <TimeEstimatePanel taskId={task.id} />
            </div>

            <div className="task-detail-section">
              <h4 className="task-detail-section-title">Details</h4>
              <div className="task-detail-info">
                {list && (
                  <div className="task-detail-row">
                    <span className="task-detail-label">List:</span>
                    <span>{list.icon} {list.name}</span>
                  </div>
                )}
                {task.dueDate && (
                  <div className="task-detail-row">
                    <span className="task-detail-label">Due Date:</span>
                    <span>{format(new Date(task.dueDate), 'MMM d, yyyy HH:mm')}</span>
                  </div>
                )}
                {task.reminderDate && (
                  <div className="task-detail-row">
                    <span className="task-detail-label">Reminder:</span>
                    <span>🔔 {format(new Date(task.reminderDate), 'MMM d, yyyy HH:mm')}</span>
                  </div>
                )}
                {task.recurring && (
                  <div className="task-detail-row">
                    <span className="task-detail-label">Recurring:</span>
                    <span>
                      🔄 {task.recurring.type} (every {task.recurring.interval})
                      {task.recurring.endDate && ` until ${format(new Date(task.recurring.endDate), 'MMM d, yyyy')}`}
                    </span>
                  </div>
                )}
                <div className="task-detail-row">
                  <span className="task-detail-label">Priority:</span>
                  <span>
                    <span
                      className={`priority-dot priority-${task.priority}`}
                      style={{ backgroundColor: PriorityColors[task.priority] }}
                    />
                    {PriorityLabels[task.priority]}
                  </span>
                </div>
              </div>
            </div>

            <div className="task-detail-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 className="task-detail-section-title">Дополнительно</h4>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowTaskAssignment(true)}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  👤 Назначить задачу
                </button>
                <button
                  onClick={() => setShowLocationReminder(true)}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  📍 Напоминание по местоположению
                </button>
                <button
                  onClick={() => setShowSmartReminder(true)}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  ⏰ Умные напоминания
                </button>
                <button
                  onClick={() => setShowFocusStats(true)}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  ⏱️ Статистика фокуса
                </button>
                <button
                  onClick={() => setShowHistory(true)}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  📜 История изменений
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-danger"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this task?')) {
                    onDelete(task.id)
                  }
                }}
              >
                Delete Task
              </button>
            </div>
          </div>
        )}

        {showRecurring && (
          <RecurringTaskModal
            onClose={() => setShowRecurring(false)}
            onSave={(pattern) => {
              setRecurring(pattern)
              setShowRecurring(false)
            }}
            initialPattern={recurring}
          />
        )}

        {showVoiceNote && (
          <VoiceNote
            onSave={(audioUrl, transcript) => {
              setNotes(notes + `\n\n🎤 Голосовая заметка:\n${transcript}\n\n[Аудио](${audioUrl})`)
              toastService.success('Голосовая заметка добавлена')
              setShowVoiceNote(false)
            }}
            onClose={() => setShowVoiceNote(false)}
          />
        )}

        {showCamera && (
          <CameraCapture
            onCapture={(imageData) => {
              setNotes(notes + `\n\n![Фото](${imageData})`)
              toastService.success('Фото добавлено')
              setShowCamera(false)
            }}
            onClose={() => setShowCamera(false)}
          />
        )}

        {showLocationReminder && (
          <LocationReminder
            taskId={task.id}
            onClose={() => setShowLocationReminder(false)}
          />
        )}

        {showSmartReminder && (
          <SmartReminderPanel
            task={task}
            onClose={() => setShowSmartReminder(false)}
          />
        )}

        {showTaskAssignment && (
          <TaskAssignmentPanel
            task={task}
            onClose={() => setShowTaskAssignment(false)}
            onUpdate={() => {
              onUpdate(task)
            }}
          />
        )}

        {showFocusStats && (
          <FocusStatsPanel
            taskId={task.id}
            onClose={() => setShowFocusStats(false)}
          />
        )}

        {showHistory && (
          <TaskHistory
            taskId={task.id}
            onClose={() => setShowHistory(false)}
          />
        )}

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={[
              {
                label: 'Редактировать',
                icon: '✏️',
                action: () => setIsEditing(true)
              },
              {
                label: 'Архивировать',
                icon: '📦',
                action: () => {
                  ArchiveService.archiveTask(task)
                  TaskHistoryService.addEntry({
                    taskId: task.id,
                    action: 'archived'
                  })
                  onDelete(task.id)
                  toastService.info('Задача архивирована')
                  onClose()
                }
              },
              { divider: true },
              {
                label: 'Удалить',
                icon: '🗑️',
                action: () => {
                  if (confirm('Удалить задачу?')) {
                    TaskHistoryService.addEntry({
                      taskId: task.id,
                      action: 'deleted'
                    })
                    onDelete(task.id)
                    toastService.success('Задача удалена')
                    onClose()
                  }
                }
              }
            ]}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>
    </div>
  )
}

