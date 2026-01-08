import { Priority } from '../types/Task'
import './FilterBar.css'

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void
  currentFilters: FilterOptions
}

export interface FilterOptions {
  priority: Priority | 'all'
  status: 'all' | 'active' | 'completed'
  sortBy: 'date' | 'priority' | 'title'
  sortOrder: 'asc' | 'desc'
}

export default function FilterBar({ onFilterChange, currentFilters }: FilterBarProps) {
  const handlePriorityChange = (priority: Priority | 'all') => {
    onFilterChange({ ...currentFilters, priority })
  }

  const handleStatusChange = (status: 'all' | 'active' | 'completed') => {
    onFilterChange({ ...currentFilters, status })
  }

  const handleSortChange = (sortBy: 'date' | 'priority' | 'title') => {
    const sortOrder = currentFilters.sortBy === sortBy && currentFilters.sortOrder === 'asc' 
      ? 'desc' 
      : 'asc'
    onFilterChange({ ...currentFilters, sortBy, sortOrder })
  }

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label className="filter-label">Priority:</label>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${currentFilters.priority === 'all' ? 'active' : ''}`}
            onClick={() => handlePriorityChange('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${currentFilters.priority === Priority.High ? 'active' : ''}`}
            onClick={() => handlePriorityChange(Priority.High)}
          >
            🔴 High
          </button>
          <button
            className={`filter-btn ${currentFilters.priority === Priority.Medium ? 'active' : ''}`}
            onClick={() => handlePriorityChange(Priority.Medium)}
          >
            🟠 Medium
          </button>
          <button
            className={`filter-btn ${currentFilters.priority === Priority.Low ? 'active' : ''}`}
            onClick={() => handlePriorityChange(Priority.Low)}
          >
            🔵 Low
          </button>
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label">Status:</label>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${currentFilters.status === 'all' ? 'active' : ''}`}
            onClick={() => handleStatusChange('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${currentFilters.status === 'active' ? 'active' : ''}`}
            onClick={() => handleStatusChange('active')}
          >
            Active
          </button>
          <button
            className={`filter-btn ${currentFilters.status === 'completed' ? 'active' : ''}`}
            onClick={() => handleStatusChange('completed')}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label">Sort by:</label>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${currentFilters.sortBy === 'date' ? 'active' : ''}`}
            onClick={() => handleSortChange('date')}
          >
            Date {currentFilters.sortBy === 'date' && (currentFilters.sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={`filter-btn ${currentFilters.sortBy === 'priority' ? 'active' : ''}`}
            onClick={() => handleSortChange('priority')}
          >
            Priority {currentFilters.sortBy === 'priority' && (currentFilters.sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={`filter-btn ${currentFilters.sortBy === 'title' ? 'active' : ''}`}
            onClick={() => handleSortChange('title')}
          >
            Title {currentFilters.sortBy === 'title' && (currentFilters.sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>
    </div>
  )
}

