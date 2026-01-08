import { useState, useEffect } from 'react'
import { parseSmartDate, formatSmartDate } from '../utils/smartDateParser'
import './SmartDateInput.css'

interface SmartDateInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  showSmartSuggestions?: boolean
}

export default function SmartDateInput({
  value,
  onChange,
  placeholder = 'Дата или "завтра", "через неделю"...',
  showSmartSuggestions = true
}: SmartDateInputProps) {
  const [inputValue, setInputValue] = useState(value)
  const [parsedDate, setParsedDate] = useState<{ date: Date | null; text: string; isValid: boolean } | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    if (newValue.trim()) {
      const parsed = parseSmartDate(newValue)
      setParsedDate(parsed)
      
      if (parsed.isValid && parsed.date) {
        // Автоматически форматируем в datetime-local формат
        const dateStr = new Date(parsed.date).toISOString().slice(0, 16)
        onChange(dateStr)
      } else {
        onChange(newValue)
      }
    } else {
      setParsedDate(null)
      onChange('')
    }
  }

  const suggestions = [
    'Сегодня',
    'Завтра',
    'Послезавтра',
    'Через неделю',
    'Через месяц',
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота',
    'Воскресенье',
    'Конец недели',
    'Конец месяца'
  ]

  const handleSuggestionClick = (suggestion: string) => {
    const parsed = parseSmartDate(suggestion)
    if (parsed.isValid && parsed.date) {
      const dateStr = new Date(parsed.date).toISOString().slice(0, 16)
      setInputValue(suggestion)
      onChange(dateStr)
      setShowSuggestions(false)
    }
  }

  return (
    <div className="smart-date-input">
      <input
        type="text"
        className="smart-date-input-field"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
      />
      
      {parsedDate && parsedDate.isValid && (
        <div className="smart-date-preview">
          ✓ {parsedDate.text} ({parsedDate.date ? formatSmartDate(parsedDate.date) : ''})
        </div>
      )}

      {showSuggestions && showSmartSuggestions && (
        <div className="smart-date-suggestions">
          {suggestions.map(suggestion => (
            <button
              key={suggestion}
              type="button"
              className="smart-date-suggestion"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

