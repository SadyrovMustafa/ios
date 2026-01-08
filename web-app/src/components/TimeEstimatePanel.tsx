import { useState, useEffect } from 'react'
import { TimeEstimateService } from '../services/TimeEstimateService'
import './TimeEstimatePanel.css'

interface TimeEstimatePanelProps {
  taskId: string
}

export default function TimeEstimatePanel({ taskId }: TimeEstimatePanelProps) {
  const [estimatedMinutes, setEstimatedMinutes] = useState(0)
  const [actualMinutes, setActualMinutes] = useState(0)
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    loadEstimate()
    checkTracking()
  }, [taskId])

  const loadEstimate = () => {
    const estimate = TimeEstimateService.getEstimate(taskId)
    if (estimate) {
      setEstimatedMinutes(estimate.estimatedMinutes)
      setActualMinutes(TimeEstimateService.getTotalTimeForTask(taskId))
    }
  }

  const checkTracking = () => {
    const estimate = TimeEstimateService.getEstimate(taskId)
    if (estimate && estimate.sessions.some(s => !s.endTime)) {
      setIsTracking(true)
    }
  }

  const handleSetEstimate = () => {
    const minutes = parseInt(prompt('Оценка времени (минуты):', estimatedMinutes.toString()) || '0')
    if (minutes > 0) {
      TimeEstimateService.setEstimate(taskId, minutes)
      setEstimatedMinutes(minutes)
    }
  }

  const handleStartTracking = () => {
    TimeEstimateService.startTracking(taskId)
    setIsTracking(true)
    loadEstimate()
  }

  const handleStopTracking = () => {
    TimeEstimateService.stopTracking(taskId)
    setIsTracking(false)
    loadEstimate()
  }

  return (
    <div className="time-estimate-panel">
      <div className="time-estimate-row">
        <div className="time-estimate-item">
          <label>Оценка:</label>
          <div className="time-value">
            {estimatedMinutes > 0 ? TimeEstimateService.formatTime(estimatedMinutes) : 'Не установлена'}
          </div>
          <button onClick={handleSetEstimate} className="btn-small">
            {estimatedMinutes > 0 ? 'Изменить' : 'Установить'}
          </button>
        </div>

        <div className="time-estimate-item">
          <label>Фактическое:</label>
          <div className="time-value">
            {TimeEstimateService.formatTime(actualMinutes)}
          </div>
        </div>
      </div>

      <div className="time-tracking-controls">
        {!isTracking ? (
          <button onClick={handleStartTracking} className="btn-primary btn-small">
            ▶️ Начать отслеживание
          </button>
        ) : (
          <button onClick={handleStopTracking} className="btn-danger btn-small">
            ⏹️ Остановить
          </button>
        )}
      </div>

      {estimatedMinutes > 0 && actualMinutes > 0 && (
        <div className="time-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min((actualMinutes / estimatedMinutes) * 100, 100)}%`,
                backgroundColor: actualMinutes > estimatedMinutes ? 'var(--danger-color)' : 'var(--success-color)'
              }}
            />
          </div>
          <div className="progress-text">
            {actualMinutes > estimatedMinutes
              ? `Превышено на ${TimeEstimateService.formatTime(actualMinutes - estimatedMinutes)}`
              : `Осталось ${TimeEstimateService.formatTime(estimatedMinutes - actualMinutes)}`}
          </div>
        </div>
      )}
    </div>
  )
}

