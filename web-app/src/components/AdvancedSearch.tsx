import { useState } from 'react'
import { Task, Priority } from '../types/Task'
import './AdvancedSearch.css'

interface AdvancedSearchProps {
  onSearch: (query: AdvancedSearchQuery) => void
  onClose: () => void
}

export interface AdvancedSearchQuery {
  text: string
  tags: string[]
  priority: Priority | 'all'
  status: 'all' | 'active' | 'completed'
  hasDueDate: boolean | null
  dueDateFrom?: Date
  dueDateTo?: Date
  hasSubtasks: boolean | null
  hasRecurring: boolean | null
}

export default function AdvancedSearch({ onSearch, onClose }: AdvancedSearchProps) {
  const [query, setQuery] = useState<AdvancedSearchQuery>({
    text: '',
    tags: [],
    priority: 'all',
    status: 'all',
    hasDueDate: null,
    hasSubtasks: null,
    hasRecurring: null
  })
  const [tagInput, setTagInput] = useState('')
  const [showDateRange, setShowDateRange] = useState(false)

  const handleTagAdd = () => {
    if (tagInput.trim() && !query.tags.includes(tagInput.trim())) {
      setQuery({
        ...query,
        tags: [...query.tags, tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const handleTagRemove = (tag: string) => {
    setQuery({
      ...query,
      tags: query.tags.filter(t => t !== tag)
    })
  }

  const handleSearch = () => {
    onSearch(query)
  }

  const handleReset = () => {
    const resetQuery: AdvancedSearchQuery = {
      text: '',
      tags: [],
      priority: 'all',
      status: 'all',
      hasDueDate: null,
      hasSubtasks: null,
      hasRecurring: null
    }
    setQuery(resetQuery)
    onSearch(resetQuery)
  }

  return (
    <div className="advanced-search-overlay" onClick={onClose}>
      <div className="advanced-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="advanced-search-header">
          <h2>Advanced Search</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="advanced-search-content">
          <div className="search-field">
            <label>Text Search</label>
            <input
              type="text"
              placeholder="Search in title and notes..."
              value={query.text}
              onChange={(e) => setQuery({ ...query, text: e.target.value })}
            />
          </div>

          <div className="search-field">
            <label>Tags</label>
            <div className="tags-input-container">
              <input
                type="text"
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleTagAdd()
                  }
                }}
              />
              <button onClick={handleTagAdd}>+</button>
            </div>
            {query.tags.length > 0 && (
              <div className="tags-list">
                {query.tags.map(tag => (
                  <span key={tag} className="tag">
                    {tag}
                    <button onClick={() => handleTagRemove(tag)}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="search-field">
            <label>Priority</label>
            <select
              value={query.priority}
              onChange={(e) => setQuery({ ...query, priority: e.target.value as Priority | 'all' })}
            >
              <option value="all">All</option>
              <option value={Priority.High}>High</option>
              <option value={Priority.Medium}>Medium</option>
              <option value={Priority.Low}>Low</option>
              <option value={Priority.None}>None</option>
            </select>
          </div>

          <div className="search-field">
            <label>Status</label>
            <select
              value={query.status}
              onChange={(e) => setQuery({ ...query, status: e.target.value as 'all' | 'active' | 'completed' })}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="search-field">
            <label>
              <input
                type="checkbox"
                checked={query.hasDueDate === true}
                onChange={(e) => setQuery({ ...query, hasDueDate: e.target.checked ? true : null })}
              />
              Has due date
            </label>
            {query.hasDueDate && (
              <div className="date-range">
                <input
                  type="date"
                  onChange={(e) => setQuery({ ...query, dueDateFrom: e.target.value ? new Date(e.target.value) : undefined })}
                />
                <span>to</span>
                <input
                  type="date"
                  onChange={(e) => setQuery({ ...query, dueDateTo: e.target.value ? new Date(e.target.value) : undefined })}
                />
              </div>
            )}
          </div>

          <div className="search-field">
            <label>
              <input
                type="checkbox"
                checked={query.hasSubtasks === true}
                onChange={(e) => setQuery({ ...query, hasSubtasks: e.target.checked ? true : null })}
              />
              Has subtasks
            </label>
          </div>

          <div className="search-field">
            <label>
              <input
                type="checkbox"
                checked={query.hasRecurring === true}
                onChange={(e) => setQuery({ ...query, hasRecurring: e.target.checked ? true : null })}
              />
              Recurring task
            </label>
          </div>
        </div>

        <div className="advanced-search-actions">
          <button className="btn-secondary" onClick={handleReset}>Reset</button>
          <button className="btn-primary" onClick={handleSearch}>Search</button>
        </div>
      </div>
    </div>
  )
}

