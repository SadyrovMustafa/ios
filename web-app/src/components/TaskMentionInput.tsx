import { useState, useRef, useEffect } from 'react'
import { LocalAuthService } from '../services/LocalAuthService'
import { MentionService } from '../services/MentionService'
import './TaskMentionInput.css'

interface TaskMentionInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function TaskMentionInput({
  value,
  onChange,
  placeholder = 'Введите текст...',
  className = ''
}: TaskMentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionIndex, setSuggestionIndex] = useState(-1)
  const [filteredUsers, setFilteredUsers] = useState<Array<{ id: string; name: string }>>([])
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const availableUsers = LocalAuthService.getAllUsers().map(u => ({ id: u.id, name: u.name }))

  const handleInputChange = (newValue: string) => {
    onChange(newValue)

    // Check for @ mentions
    const cursorPos = (inputRef.current as HTMLInputElement)?.selectionStart || newValue.length
    const textBeforeCursor = newValue.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      const query = textBeforeCursor.substring(lastAtIndex + 1).toLowerCase()
      const spaceIndex = query.indexOf(' ')

      if (spaceIndex === -1 && query.length > 0) {
        const filtered = availableUsers.filter(user =>
          user.name.toLowerCase().startsWith(query)
        )
        setFilteredUsers(filtered)
        setShowSuggestions(filtered.length > 0)
        setSuggestionIndex(-1)
      } else {
        setShowSuggestions(false)
      }
    } else {
      setShowSuggestions(false)
    }
  }

  const handleSelectUser = (user: { id: string; name: string }) => {
    const input = inputRef.current as HTMLInputElement
    if (!input) return

    const cursorPos = input.selectionStart || value.length
    const textBeforeCursor = value.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    const textAfterCursor = value.substring(cursorPos)

    if (lastAtIndex !== -1) {
      const newText =
        value.substring(0, lastAtIndex) +
        `@${user.name} ` +
        textAfterCursor
      onChange(newText)
      setShowSuggestions(false)
      setTimeout(() => {
        input.focus()
        const newCursorPos = lastAtIndex + user.name.length + 2
        input.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSuggestionIndex(prev =>
          prev < filteredUsers.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1))
      } else if (e.key === 'Enter' && suggestionIndex >= 0) {
        e.preventDefault()
        handleSelectUser(filteredUsers[suggestionIndex])
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
      }
    }
  }

  // Extract mentions from value
  const mentions = MentionService.parseMentions(value, availableUsers)

  return (
    <div className={`task-mention-input-container ${className}`}>
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="task-mention-input"
      />
      {showSuggestions && filteredUsers.length > 0 && (
        <div className="mention-suggestions">
          {filteredUsers.map((user, index) => (
            <div
              key={user.id}
              className={`suggestion-item ${index === suggestionIndex ? 'selected' : ''}`}
              onClick={() => handleSelectUser(user)}
              onMouseEnter={() => setSuggestionIndex(index)}
            >
              <span className="suggestion-icon">👤</span>
              <span className="suggestion-name">{user.name}</span>
            </div>
          ))}
        </div>
      )}
      {mentions.length > 0 && (
        <div className="mentions-preview">
          <span className="mentions-label">Упомянуты:</span>
          {mentions.map(mention => (
            <span key={mention.userId} className="mention-tag">
              @{mention.userName}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

