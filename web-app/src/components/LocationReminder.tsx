import { useState, useEffect } from 'react'
import { LocationService, Location, LocationReminder as LocationReminderType } from '../services/LocationService'
import { toastService } from '../services/ToastService'
import './LocationReminder.css'

interface LocationReminderProps {
  taskId: string
  onClose: () => void
}

export default function LocationReminder({ taskId, onClose }: LocationReminderProps) {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [reminders, setReminders] = useState<LocationReminderType[]>([])
  const [radius, setRadius] = useState(100)
  const [locationName, setLocationName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadReminders()
    getCurrentLocation()

    const unsubscribe = LocationService.onLocationChange((location) => {
      setCurrentLocation(location)
    })

    return unsubscribe
  }, [])

  const loadReminders = () => {
    setReminders(LocationService.getRemindersForTask(taskId))
  }

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true)
      const location = await LocationService.getCurrentLocation()
      const address = await LocationService.getAddress(location)
      setCurrentLocation({ ...location, address, name: locationName || address })
      toastService.success('Местоположение определено')
    } catch (error: any) {
      toastService.error(error.message || 'Не удалось определить местоположение')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddReminder = async () => {
    if (!currentLocation) {
      toastService.error('Сначала определите местоположение')
      return
    }

    try {
      const reminder = LocationService.addLocationReminder({
        taskId,
        location: {
          ...currentLocation,
          name: locationName || currentLocation.address || 'Место'
        },
        radius,
        isActive: true
      })
      toastService.success('Напоминание по местоположению добавлено')
      loadReminders()
      setLocationName('')
    } catch (error: any) {
      toastService.error(error.message || 'Ошибка добавления напоминания')
    }
  }

  const handleRemoveReminder = (reminderId: string) => {
    LocationService.removeLocationReminder(reminderId)
    toastService.info('Напоминание удалено')
    loadReminders()
  }

  return (
    <div className="location-reminder-overlay" onClick={onClose}>
      <div className="location-reminder-modal" onClick={(e) => e.stopPropagation()}>
        <div className="location-reminder-header">
          <h2>📍 Напоминание по местоположению</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="location-reminder-content">
          <div className="location-section">
            <h3>Текущее местоположение</h3>
            {isLoading ? (
              <p>Определение местоположения...</p>
            ) : currentLocation ? (
              <div className="location-info">
                <p><strong>Адрес:</strong> {currentLocation.address || 'Не определен'}</p>
                <p><strong>Координаты:</strong> {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}</p>
                <button onClick={getCurrentLocation} className="btn-secondary">
                  🔄 Обновить
                </button>
              </div>
            ) : (
              <button onClick={getCurrentLocation} className="btn-primary">
                📍 Определить местоположение
              </button>
            )}
          </div>

          <div className="reminder-form">
            <h3>Добавить напоминание</h3>
            <div className="form-group">
              <label>Название места:</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Например: Дом, Офис, Магазин"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Радиус (метры): {radius}m</label>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="form-range"
              />
            </div>
            <button
              onClick={handleAddReminder}
              disabled={!currentLocation}
              className="btn-primary"
            >
              ➕ Добавить напоминание
            </button>
          </div>

          <div className="reminders-list">
            <h3>Активные напоминания</h3>
            {reminders.length === 0 ? (
              <p className="empty-state">Нет активных напоминаний</p>
            ) : (
              reminders.map(reminder => (
                <div key={reminder.id} className="reminder-item">
                  <div className="reminder-info">
                    <strong>{reminder.location.name || 'Место'}</strong>
                    <span>Радиус: {reminder.radius}m</span>
                    {reminder.location.address && (
                      <span className="reminder-address">{reminder.location.address}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveReminder(reminder.id)}
                    className="btn-danger"
                  >
                    Удалить
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

