import { Task } from '../types/Task'
import './QuickActions.css'

interface QuickActionsProps {
  tasks: Task[]
  onBulkComplete: (taskIds: string[]) => void
  onBulkDelete: (taskIds: string[]) => void
  selectedTasks: string[]
  onSelectionChange: (taskIds: string[]) => void
}

export default function QuickActions({
  tasks,
  onBulkComplete,
  onBulkDelete,
  selectedTasks,
  onSelectionChange
}: QuickActionsProps) {
  const hasSelection = selectedTasks.length > 0

  const handleSelectAll = () => {
    if (selectedTasks.length === tasks.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(tasks.map(t => t.id))
    }
  }

  const handleBulkComplete = () => {
    onBulkComplete(selectedTasks)
    onSelectionChange([])
  }

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedTasks.length} task(s)?`)) {
      onBulkDelete(selectedTasks)
      onSelectionChange([])
    }
  }

  if (!hasSelection) return null

  return (
    <div className="quick-actions">
      <div className="quick-actions-content">
        <span className="selection-count">
          {selectedTasks.length} selected
        </span>
        <div className="quick-actions-buttons">
          <button
            className="quick-action-btn"
            onClick={handleSelectAll}
          >
            {selectedTasks.length === tasks.length ? 'Deselect All' : 'Select All'}
          </button>
          <button
            className="quick-action-btn quick-action-btn-success"
            onClick={handleBulkComplete}
          >
            ✓ Complete
          </button>
          <button
            className="quick-action-btn quick-action-btn-danger"
            onClick={handleBulkDelete}
          >
            🗑️ Delete
          </button>
          <button
            className="quick-action-btn"
            onClick={() => onSelectionChange([])}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

