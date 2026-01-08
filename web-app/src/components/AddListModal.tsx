import { useState } from 'react'
import { TaskList } from '../types/Task'
import './Modal.css'

interface AddListModalProps {
  onClose: () => void
  onAdd: (list: Omit<TaskList, 'id'>) => void
}

const colors = ['#007AFF', '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#5856D6', '#FF2D55', '#8E8E93']
const icons = ['📥', '☀️', '📅', '👤', '💼', '🏠', '❤️', '⭐', '🚩', '📝']

export default function AddListModal({ onClose, onAdd }: AddListModalProps) {
  const [name, setName] = useState('')
  const [selectedColor, setSelectedColor] = useState(colors[0])
  const [selectedIcon, setSelectedIcon] = useState(icons[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onAdd({
      name: name.trim(),
      color: selectedColor,
      icon: selectedIcon
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New List</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">List Name *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter list name"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-picker">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  className="color-option"
                  style={{
                    backgroundColor: color,
                    border: selectedColor === color ? '3px solid var(--text-primary)' : 'none'
                  }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Icon</label>
            <div className="icon-picker">
              {icons.map(icon => (
                <button
                  key={icon}
                  type="button"
                  className={`icon-option ${selectedIcon === icon ? 'selected' : ''}`}
                  onClick={() => setSelectedIcon(icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!name.trim()}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

