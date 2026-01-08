import { useState } from 'react'
import './ChecklistInNotes.css'

interface ChecklistItem {
  id: string
  text: string
  checked: boolean
}

interface ChecklistInNotesProps {
  items: ChecklistItem[]
  onChange: (items: ChecklistItem[]) => void
}

export default function ChecklistInNotes({ items, onChange }: ChecklistInNotesProps) {
  const [newItem, setNewItem] = useState('')

  const handleAdd = () => {
    if (!newItem.trim()) return
    const newItems = [...items, {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: newItem.trim(),
      checked: false
    }]
    onChange(newItems)
    setNewItem('')
  }

  const handleToggle = (id: string) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    )
    onChange(updated)
  }

  const handleDelete = (id: string) => {
    onChange(items.filter(item => item.id !== id))
  }

  const handleEdit = (id: string, text: string) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, text } : item
    )
    onChange(updated)
  }

  return (
    <div className="checklist-in-notes">
      <div className="checklist-items">
        {items.map(item => (
          <div key={item.id} className="checklist-item">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => handleToggle(item.id)}
              className="checklist-checkbox"
            />
            <input
              type="text"
              value={item.text}
              onChange={(e) => handleEdit(item.id, e.target.value)}
              className={`checklist-text ${item.checked ? 'checked' : ''}`}
            />
            <button
              onClick={() => handleDelete(item.id)}
              className="checklist-delete"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="checklist-add">
        <input
          type="text"
          placeholder="Add checklist item..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          className="checklist-input"
        />
        <button onClick={handleAdd} className="checklist-add-btn">
          Add
        </button>
      </div>
    </div>
  )
}

