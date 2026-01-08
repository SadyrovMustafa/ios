import { useState, KeyboardEvent, useEffect } from 'react'
import { TagColorService } from '../services/TagColorService'
import './TagsInput.css'

interface TagsInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  showColors?: boolean
  onTagColorChange?: (tag: string, color: string) => void
}

export default function TagsInput({ tags, onChange, suggestions = [], showColors = true, onTagColorChange }: TagsInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [editingTag, setEditingTag] = useState<string | null>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      const newTag = inputValue.trim().toLowerCase()
      if (!tags.includes(newTag)) {
        onChange([...tags, newTag])
      }
      setInputValue('')
      setShowSuggestions(false)
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  const handleRemove = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (!tags.includes(suggestion)) {
      onChange([...tags, suggestion])
    }
    setInputValue('')
    setShowSuggestions(false)
  }

  const filteredSuggestions = suggestions.filter(
    s => !tags.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <div className="tags-input">
      <div className="tags-container">
        {tags.map(tag => {
          const tagColor = showColors ? TagColorService.getColorForTag(tag) : undefined
          return (
            <span
              key={tag}
              className="tag"
              style={tagColor ? { backgroundColor: tagColor, color: 'white' } : undefined}
              onContextMenu={(e) => {
                if (showColors) {
                  e.preventDefault()
                  setEditingTag(tag)
                }
              }}
            >
              {tag}
              <button
                className="tag-remove"
                onClick={() => handleRemove(tag)}
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          )
        })}
        <input
          type="text"
          className="tags-input-field"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowSuggestions(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={tags.length === 0 ? 'Add tags...' : ''}
        />
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="tags-suggestions">
          {filteredSuggestions.map(suggestion => (
            <button
              key={suggestion}
              className="tags-suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {editingTag && (
        <div className="tag-color-picker">
          <h4>Выберите цвет для "{editingTag}"</h4>
          <div className="color-options">
            {['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#5AC8FA', '#000000'].map(color => (
              <button
                key={color}
                className="color-option"
                style={{ backgroundColor: color }}
                onClick={() => {
                  TagColorService.setColorForTag(editingTag, color)
                  if (onTagColorChange) {
                    onTagColorChange(editingTag, color)
                  }
                  setEditingTag(null)
                }}
              />
            ))}
          </div>
          <button onClick={() => setEditingTag(null)} className="btn-secondary">
            Отмена
          </button>
        </div>
      )}
    </div>
  )
}

