import { useState, useEffect } from 'react'
import { Task, TaskList, Priority, PriorityColors, PriorityLabels, RecurringPattern } from '../types/Task'
import { TaskManager } from '../services/TaskManager'
import TagsInput from './TagsInput'
import TagHierarchyEditor from './TagHierarchyEditor'
import SubtaskList from './SubtaskList'
import RecurringTaskModal from './RecurringTaskModal'
import FileAttachment from './FileAttachment'
import MarkdownEditor from './MarkdownEditor'
import VoiceInput from './VoiceInput'
import SmartDateInput from './SmartDateInput'
import './Modal.css'

interface AddTaskModalProps {
  onClose: () => void
  onAdd: (task: Omit<Task, 'id' | 'createdAt'>) => Task
  defaultListId?: string
  taskManager: TaskManager
}

export default function AddTaskModal({
  onClose,
  onAdd,
  defaultListId,
  taskManager
}: AddTaskModalProps) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [listId, setListId] = useState(defaultListId || '')
  const [hasDueDate, setHasDueDate] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Priority>(Priority.None)
  const [lists, setLists] = useState<TaskList[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [subtasks, setSubtasks] = useState<Task['subtasks']>([])
  const [hasReminder, setHasReminder] = useState(false)
  const [reminderDate, setReminderDate] = useState('')
  const [showRecurring, setShowRecurring] = useState(false)
  const [recurring, setRecurring] = useState<RecurringPattern | undefined>()

  useEffect(() => {
    const loadedLists = taskManager.getLists()
    setLists(loadedLists)
    if (!listId && loadedLists.length > 0) {
      setListId(loadedLists[0].id)
    }
  }, [taskManager, listId])

  const [newTaskId] = useState(() => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const createdTask = onAdd({
      title: title.trim(),
      notes: notes.trim(),
      listId,
      isCompleted: false,
      priority,
      dueDate: hasDueDate && dueDate ? new Date(dueDate) : undefined,
      tags: tags.length > 0 ? tags : undefined,
      subtasks: subtasks && subtasks.length > 0 ? subtasks : undefined,
      reminderDate: hasReminder && reminderDate ? new Date(reminderDate) : undefined,
      recurring
    })

    // Move files from temp ID to actual task ID
    if (createdTask && newTaskId) {
      try {
        const files = await FileStorageService.getFilesForTask(newTaskId)
        for (const file of files) {
          // Re-save with correct task ID
          const response = await fetch(file.data)
          const blob = await response.blob()
          const newFile = new File([blob], file.fileName, { type: file.fileType })
          await FileStorageService.saveFile(newFile, createdTask.id)
          await FileStorageService.deleteFile(file.id)
        }
      } catch (error) {
        console.error('Failed to move files:', error)
      }
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Task</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes (optional)"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">List</label>
            <select
              className="form-select"
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              required
            >
              {lists.map(list => (
                <option key={list.id} value={list.id}>
                  {list.icon} {list.name}
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
              <>
                <SmartDateInput
                  value={dueDate}
                  onChange={(value) => setDueDate(value)}
                  placeholder='Дата или "завтра", "через неделю"...'
                />
                <input
                  type="datetime-local"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{ marginTop: '8px' }}
                />
              </>
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
              onUpdate={(newSubtasks) => setSubtasks(newSubtasks)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Attachments</label>
            {newTaskId && <FileAttachment taskId={newTaskId} readOnly={false} />}
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
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!title.trim()}>
              Save
            </button>
          </div>
        </form>

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
      </div>
    </div>
  )
}

