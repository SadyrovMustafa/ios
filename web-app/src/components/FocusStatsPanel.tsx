import { useState, useEffect } from 'react'
import { FocusStatsService, FocusSession } from '../services/FocusStatsService'
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { toastService } from '../services/ToastService'
import './FocusStatsPanel.css'

interface FocusStatsPanelProps {
  taskId?: string
  onClose?: () => void
}

export default function FocusStatsPanel({ taskId, onClose }: FocusStatsPanelProps) {
  const [isActive, setIsActive] = useState(false)
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null)
  const [todaySessions, setTodaySessions] = useState<FocusSession[]>([])
  const [totalToday, setTotalToday] = useState(0)
  const [streak, setStreak] = useState(0)
  const [averageDuration, setAverageDuration] = useState(0)

  useEffect(() => {
    loadStats()
    const interval = setInterval(() => {
      if (isActive) {
        loadActiveSession()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, taskId])

  const loadStats = () => {
    const today = new Date()
    const sessions = taskId
      ? FocusStatsService.getSessionsForTask(taskId)
      : FocusStatsService.getSessionsForDate(today)
    
    setTodaySessions(sessions)
    setTotalToday(FocusStatsService.getTotalFocusTime(today))
    setStreak(FocusStatsService.getFocusStreak())
    setAverageDuration(FocusStatsService.getAverageSessionDuration(7))
    loadActiveSession()
  }

  const loadActiveSession = () => {
    const session = FocusStatsService.getActiveSession()
    setActiveSession(session)
    setIsActive(!!session)
  }

  const handleStart = () => {
    const session = FocusStatsService.startSession(taskId)
    setActiveSession(session)
    setIsActive(true)
    toastService.success('Сессия фокуса начата')
  }

  const handleStop = () => {
    if (activeSession) {
      FocusStatsService.endSession(activeSession.id)
      toastService.success('Сессия фокуса завершена')
      loadStats()
    }
  }

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}ч ${minutes % 60}м`
    } else if (minutes > 0) {
      return `${minutes}м ${seconds % 60}с`
    } else {
      return `${seconds}с`
    }
  }

  const getCurrentDuration = (): number => {
    if (!activeSession) return 0
    return Date.now() - activeSession.startTime.getTime()
  }

  return (
    <div className={`focus-stats-panel ${onClose ? 'modal' : ''}`}>
      {onClose && (
        <div className="focus-stats-header">
          <h2>⏱️ Статистика фокуса</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      )}

      <div className="focus-stats-content">
        <div className="focus-controls">
          {!isActive ? (
            <button onClick={handleStart} className="start-focus-btn">
              ▶️ Начать сессию фокуса
            </button>
          ) : (
            <div className="active-session">
              <div className="session-timer">
                <div className="timer-display">
                  {formatDuration(getCurrentDuration())}
                </div>
                <button onClick={handleStop} className="stop-focus-btn">
                  ⏹️ Завершить
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Сегодня</div>
            <div className="stat-value">{formatDuration(totalToday)}</div>
            <div className="stat-sessions">{todaySessions.length} сессий</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Стрик</div>
            <div className="stat-value">{streak}</div>
            <div className="stat-sessions">дней подряд</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Средняя сессия</div>
            <div className="stat-value">{formatDuration(averageDuration)}</div>
            <div className="stat-sessions">за 7 дней</div>
          </div>
        </div>

        {todaySessions.length > 0 && (
          <div className="sessions-list">
            <h3>Сегодняшние сессии</h3>
            {todaySessions.map(session => (
              <div key={session.id} className="session-item">
                <div className="session-time">
                  {format(session.startTime, 'HH:mm')} - {session.endTime && format(session.endTime, 'HH:mm')}
                </div>
                <div className="session-duration">
                  {formatDuration(session.duration)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

