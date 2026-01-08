import { useState } from 'react'
import { RecurringPattern } from '../types/Task'
import './Modal.css'

interface RecurringTaskModalProps {
  onClose: () => void
  onSave: (pattern: RecurringPattern) => void
  initialPattern?: RecurringPattern
}

export default function RecurringTaskModal({
  onClose,
  onSave,
  initialPattern
}: RecurringTaskModalProps) {
  const [type, setType] = useState<RecurringPattern['type']>(
    initialPattern?.type || 'daily'
  )
  const [interval, setInterval] = useState(initialPattern?.interval || 1)
  const [hasEndDate, setHasEndDate] = useState(!!initialPattern?.endDate)
  const [endDate, setEndDate] = useState(
    initialPattern?.endDate
      ? new Date(initialPattern.endDate).toISOString().split('T')[0]
      : ''
  )
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initialPattern?.daysOfWeek || []
  )

  const daysOfWeek = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' }
  ]

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  const handleSave = () => {
    const pattern: RecurringPattern = {
      type,
      interval,
      endDate: hasEndDate && endDate ? new Date(endDate) : undefined,
      daysOfWeek: type === 'weekly' ? selectedDays : undefined,
      dayOfMonth: type === 'monthly' ? parseInt(endDate.split('-')[2]) : undefined
    }
    onSave(pattern)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Recurring Task</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-form">
          <div className="form-group">
            <label className="form-label">Repeat</label>
            <select
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value as RecurringPattern['type'])}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {type !== 'daily' && (
            <div className="form-group">
              <label className="form-label">Every</label>
              <input
                type="number"
                className="form-input"
                min="1"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
              />
              <span className="form-hint">
                {type === 'weekly' && 'week(s)'}
                {type === 'monthly' && 'month(s)'}
                {type === 'yearly' && 'year(s)'}
              </span>
            </div>
          )}

          {type === 'weekly' && (
            <div className="form-group">
              <label className="form-label">Days of week</label>
              <div className="days-selector">
                {daysOfWeek.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    className={`day-btn ${selectedDays.includes(day.value) ? 'active' : ''}`}
                    onClick={() => handleDayToggle(day.value)}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-checkbox-label">
              <input
                type="checkbox"
                checked={hasEndDate}
                onChange={(e) => setHasEndDate(e.target.checked)}
              />
              <span>End date</span>
            </label>
            {hasEndDate && (
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

