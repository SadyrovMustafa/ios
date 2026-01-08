import { useState, useEffect } from 'react'
import { SmartReminderService, SmartReminder, ReminderConditions } from '../services/SmartReminderService'
import { Task } from '../types/Task'
import { LocationService, Location } from '../services/LocationService'
import { toastService } from '../services/ToastService'
import { format } from 'date-fns'
import './SmartReminderPanel.css'

interface SmartReminderPanelProps {
  task: Task
  onClose: () => void
}

export default function SmartReminderPanel({ task, onClose }: SmartReminderPanelProps) {
  const [reminders, setReminders] = useState<SmartReminder[]>([])
  const [reminderType, setReminderType] = useState<SmartReminder['type']>('time')
  const [conditions, setConditions] = useState<ReminderConditions>({})
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)

  useEffect(() => {
    loadReminders()
    if (reminderType === 'location') {
      getCurrentLocation()
    }
  }, [reminderType])

  const loadReminders = () => {
    setReminders(SmartReminderService.getRemindersForTask(task.id))
  }

  const getCurrentLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation()
      const address = await LocationService.getAddress(location)
      setCurrentLocation({ ...location, address, name: address })
      setConditions(prev => ({ ...prev, location: { ...location, address, name: address } }))
    } catch (error: any) {
      toastService.error('Не удалось определить местоположение')
    }
  }

  const handleAddReminder = () => {
    try {
      SmartReminderService.addReminder(task.id, conditions, reminderType)
      toastService.success('Умное напоминание добавлено')
      loadReminders()
      setConditions({})
    } catch (error: any) {
      toastService.error('Ошибка добавления напоминания')
    }
  }

  const handleRemoveReminder = (reminderId: string) => {
    SmartReminderService.removeReminder(reminderId)
    toastService.info('Напоминание удалено')
    loadReminders()
  }

  const handleToggleReminder = (reminderId: string) => {
    SmartReminderService.toggleReminder(reminderId)
    loadReminders()
  }

  const renderTimeConditions = () => (
    <div className="reminder-conditions">
      <div className="form-group">
        <label>Точное время:</label>
        <input
          type="datetime-local"
          value={conditions.time ? format(new Date(conditions.time), "yyyy-MM-dd'T'HH:mm") : ''}
          onChange={(e) => setConditions(prev => ({ ...prev, time: e.target.value ? new Date(e.target.value) : undefined }))}
          className="form-input"
        />
      </div>
      <div className="form-group">
        <label>Дни недели:</label>
        <div className="days-selector">
          {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map((day, index) => (
            <button
              key={index}
              type="button"
              className={`day-btn ${conditions.daysOfWeek?.includes(index) ? 'active' : ''}`}
              onClick={() => {
                const days = conditions.daysOfWeek || []
                const newDays = days.includes(index)
                  ? days.filter(d => d !== index)
                  : [...days, index]
                setConditions(prev => ({ ...prev, daysOfWeek: newDays.length > 0 ? newDays : undefined }))
              }}
            >
              {day}
            </button>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label>Временной диапазон:</label>
        <div className="time-range">
          <input
            type="time"
            value={conditions.timeRange?.start || ''}
            onChange={(e) => setConditions(prev => ({
              ...prev,
              timeRange: { start: e.target.value, end: prev.timeRange?.end || '23:59' }
            }))}
            className="form-input"
          />
          <span>—</span>
          <input
            type="time"
            value={conditions.timeRange?.end || ''}
            onChange={(e) => setConditions(prev => ({
              ...prev,
              timeRange: { start: prev.timeRange?.start || '00:00', end: e.target.value }
            }))}
            className="form-input"
          />
        </div>
      </div>
    </div>
  )

  const renderLocationConditions = () => (
    <div className="reminder-conditions">
      {currentLocation ? (
        <div className="location-info">
          <p><strong>Местоположение:</strong> {currentLocation.address || 'Определено'}</p>
          <p><strong>Координаты:</strong> {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}</p>
        </div>
      ) : (
        <button onClick={getCurrentLocation} className="btn-secondary">
          📍 Определить текущее местоположение
        </button>
      )}
      <div className="form-group">
        <label>Радиус (метры): {conditions.locationRadius || 100}m</label>
        <input
          type="range"
          min="50"
          max="1000"
          step="50"
          value={conditions.locationRadius || 100}
          onChange={(e) => setConditions(prev => ({ ...prev, locationRadius: Number(e.target.value) }))}
          className="form-range"
        />
      </div>
    </div>
  )

  const renderActivityConditions = () => (
    <div className="reminder-conditions">
      <div className="form-group">
        <label>После выполнения задачи:</label>
        <input
          type="text"
          placeholder="ID задачи"
          value={conditions.afterTaskId || ''}
          onChange={(e) => setConditions(prev => ({ ...prev, afterTaskId: e.target.value || undefined }))}
          className="form-input"
        />
      </div>
      <div className="form-group">
        <label>После времени работы (минуты):</label>
        <input
          type="number"
          min="1"
          value={conditions.afterTimeSpent || ''}
          onChange={(e) => setConditions(prev => ({ ...prev, afterTimeSpent: e.target.value ? Number(e.target.value) : undefined }))}
          className="form-input"
        />
      </div>
    </div>
  )

  const renderContextConditions = () => (
    <div className="reminder-conditions">
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={conditions.appOpen || false}
            onChange={(e) => setConditions(prev => ({ ...prev, appOpen: e.target.checked || undefined }))}
          />
          При открытии приложения
        </label>
      </div>
      <div className="form-group">
        <label>Активность устройства:</label>
        <select
          value={conditions.deviceActivity || ''}
          onChange={(e) => setConditions(prev => ({ ...prev, deviceActivity: e.target.value as 'idle' | 'active' || undefined }))}
          className="form-select"
        >
          <option value="">Не выбрано</option>
          <option value="idle">Неактивно</option>
          <option value="active">Активно</option>
        </select>
      </div>
    </div>
  )

  return (
    <div className="smart-reminder-overlay" onClick={onClose}>
      <div className="smart-reminder-modal" onClick={(e) => e.stopPropagation()}>
        <div className="smart-reminder-header">
          <h2>⏰ Умные напоминания</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="smart-reminder-content">
          <div className="reminder-type-selector">
            <h3>Тип напоминания</h3>
            <div className="type-buttons">
              {(['time', 'location', 'activity', 'context'] as SmartReminder['type'][]).map(type => (
                <button
                  key={type}
                  className={`type-btn ${reminderType === type ? 'active' : ''}`}
                  onClick={() => {
                    setReminderType(type)
                    setConditions({})
                  }}
                >
                  {type === 'time' && '⏰ Время'}
                  {type === 'location' && '📍 Местоположение'}
                  {type === 'activity' && '🎯 Активность'}
                  {type === 'context' && '🔔 Контекст'}
                </button>
              ))}
            </div>
          </div>

          <div className="reminder-form">
            <h3>Условия</h3>
            {reminderType === 'time' && renderTimeConditions()}
            {reminderType === 'location' && renderLocationConditions()}
            {reminderType === 'activity' && renderActivityConditions()}
            {reminderType === 'context' && renderContextConditions()}

            <button
              onClick={handleAddReminder}
              className="btn-primary"
              disabled={!canAddReminder()}
            >
              ➕ Добавить напоминание
            </button>
          </div>

          <div className="reminders-list">
            <h3>Активные напоминания ({reminders.length})</h3>
            {reminders.length === 0 ? (
              <p className="empty-state">Нет активных напоминаний</p>
            ) : (
              reminders.map(reminder => (
                <div key={reminder.id} className="reminder-item">
                  <div className="reminder-info">
                    <div className="reminder-type-badge">
                      {reminder.type === 'time' && '⏰'}
                      {reminder.type === 'location' && '📍'}
                      {reminder.type === 'activity' && '🎯'}
                      {reminder.type === 'context' && '🔔'}
                      {reminder.type}
                    </div>
                    <div className="reminder-details">
                      {formatReminderDetails(reminder)}
                    </div>
                    {reminder.lastTriggered && (
                      <div className="reminder-last-triggered">
                        Последний раз: {format(new Date(reminder.lastTriggered), 'dd.MM.yyyy HH:mm')}
                      </div>
                    )}
                  </div>
                  <div className="reminder-actions">
                    <button
                      onClick={() => handleToggleReminder(reminder.id)}
                      className={`toggle-btn ${reminder.isActive ? 'active' : ''}`}
                      title={reminder.isActive ? 'Деактивировать' : 'Активировать'}
                    >
                      {reminder.isActive ? '✓' : '○'}
                    </button>
                    <button
                      onClick={() => handleRemoveReminder(reminder.id)}
                      className="remove-btn"
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const canAddReminder = (): boolean => {
    switch (reminderType) {
      case 'time':
        return !!(conditions.time || (conditions.daysOfWeek && conditions.daysOfWeek.length > 0))
      case 'location':
        return !!conditions.location
      case 'activity':
        return !!(conditions.afterTaskId || conditions.afterTimeSpent)
      case 'context':
        return !!(conditions.appOpen || conditions.deviceActivity)
      default:
        return false
    }
  }

  const formatReminderDetails = (reminder: SmartReminder): string => {
    const { conditions } = reminder
    switch (reminder.type) {
      case 'time':
        if (conditions.time) {
          return `Время: ${format(new Date(conditions.time), 'dd.MM.yyyy HH:mm')}`
        }
        if (conditions.daysOfWeek && conditions.daysOfWeek.length > 0) {
          const days = conditions.daysOfWeek.map(d => ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][d]).join(', ')
          const timeRange = conditions.timeRange ? ` (${conditions.timeRange.start}-${conditions.timeRange.end})` : ''
          return `Дни: ${days}${timeRange}`
        }
        return 'Время не задано'
      case 'location':
        return conditions.location?.address || `Радиус: ${conditions.locationRadius || 100}m`
      case 'activity':
        if (conditions.afterTaskId) {
          return `После задачи: ${conditions.afterTaskId}`
        }
        if (conditions.afterTimeSpent) {
          return `После ${conditions.afterTimeSpent} минут работы`
        }
        return 'Условия не заданы'
      case 'context':
        if (conditions.appOpen) {
          return 'При открытии приложения'
        }
        if (conditions.deviceActivity) {
          return `Устройство: ${conditions.deviceActivity === 'idle' ? 'неактивно' : 'активно'}`
        }
        return 'Условия не заданы'
      default:
        return 'Неизвестный тип'
    }
  }
}

