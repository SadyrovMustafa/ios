import { useState } from 'react'
import { Subtask } from '../types/Task'
import './SubtaskList.css'

interface SubtaskListProps {
  subtasks: Subtask[]
  onUpdate: (subtasks: Subtask[]) => void
}

export default function SubtaskList({ subtasks, onUpdate }: SubtaskListProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleAdd = () => {
    if (!newSubtaskTitle.trim()) return

    const newSubtask: Subtask = {
      id: `${Date.now()}-${Math.random()}`,
      title: newSubtaskTitle.trim(),
      isCompleted: false,
      createdAt: new Date()
    }

    onUpdate([...subtasks, newSubtask])
    setNewSubtaskTitle('')
  }

  const handleToggle = (id: string) => {
    onUpdate(
      subtasks.map(st =>
        st.id === id
          ? {
              ...st,
              isCompleted: !st.isCompleted,
              completedAt: !st.isCompleted ? new Date() : undefined
            }
          : st
      )
    )
  }

  const handleDelete = (id: string) => {
    onUpdate(subtasks.filter(st => st.id !== id))
  }

  const handleEdit = (id: string, newTitle: string) => {
    onUpdate(
      subtasks.map(st =>
        st.id === id ? { ...st, title: newTitle } : st
      )
    )
    setEditingId(null)
  }

  return (
    <div className="subtask-list">
      <div className="subtask-header">
        <h4 className="subtask-title">Subtasks</h4>
        <span className="subtask-count">
          {subtasks.filter(st => st.isCompleted).length} / {subtasks.length}
        </span>
      </div>

      <div className="subtask-items">
        {subtasks.map(subtask => (
          <div key={subtask.id} className="subtask-item">
            <button
              className="subtask-checkbox"
              onClick={() => handleToggle(subtask.id)}
            >
              {subtask.isCompleted ? '✓' : ''}
            </button>
            {editingId === subtask.id ? (
              <input
                type="text"
                className="subtask-input"
                defaultValue={subtask.title}
                onBlur={(e) => handleEdit(subtask.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEdit(subtask.id, e.currentTarget.value)
                  }
                  if (e.key === 'Escape') {
                    setEditingId(null)
                  }
                }}
                autoFocus
              />
            ) : (
              <span
                className={`subtask-text ${subtask.isCompleted ? 'completed' : ''}`}
                onDoubleClick={() => setEditingId(subtask.id)}
              >
                {subtask.title}
              </span>
            )}
            <button
              className="subtask-delete"
              onClick={() => handleDelete(subtask.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="subtask-add">
        <input
          type="text"
          className="subtask-add-input"
          placeholder="Add subtask..."
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAdd()
            }
          }}
        />
        <button className="subtask-add-btn" onClick={handleAdd}>
          +
        </button>
      </div>
    </div>
  )
}

