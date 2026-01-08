import { useState, useEffect, useRef } from 'react'
import './PomodoroTimer.css'

interface PomodoroTimerProps {
  onClose: () => void
  taskTitle?: string
}

export default function PomodoroTimer({ onClose, taskTitle }: PomodoroTimerProps) {
  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev === 0) {
            setMinutes((prevMin) => {
              if (prevMin === 0) {
                handleTimerComplete()
                return 0
              }
              return prevMin - 1
            })
            return 59
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  const handleTimerComplete = () => {
    setIsRunning(false)
    if (!isBreak) {
      setCompletedPomodoros((prev) => prev + 1)
      setIsBreak(true)
      setMinutes(5)
      setSeconds(0)
      
      // Notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro Complete!', {
          body: 'Time for a break!',
          icon: '/vite.svg'
        })
      }
    } else {
      setIsBreak(false)
      setMinutes(25)
      setSeconds(0)
    }
  }

  const handleStart = () => {
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setMinutes(isBreak ? 5 : 25)
    setSeconds(0)
  }

  const handleSkip = () => {
    setIsRunning(false)
    setIsBreak(!isBreak)
    setMinutes(isBreak ? 25 : 5)
    setSeconds(0)
  }

  const formatTime = (min: number, sec: number) => {
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const progress = isBreak
    ? ((5 * 60 - (minutes * 60 + seconds)) / (5 * 60)) * 100
    : ((25 * 60 - (minutes * 60 + seconds)) / (25 * 60)) * 100

  return (
    <div className="pomodoro-overlay" onClick={onClose}>
      <div className="pomodoro-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pomodoro-header">
          <h2>🍅 Pomodoro Timer</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {taskTitle && (
          <div className="pomodoro-task">
            <strong>Working on:</strong> {taskTitle}
          </div>
        )}

        <div className="pomodoro-content">
          <div className="pomodoro-timer">
            <div className="timer-circle" style={{
              background: `conic-gradient(var(--primary-color) ${progress}%, var(--background) ${progress}%)`
            }}>
              <div className="timer-inner">
                <div className="timer-time">{formatTime(minutes, seconds)}</div>
                <div className="timer-label">{isBreak ? 'Break' : 'Focus'}</div>
              </div>
            </div>
          </div>

          <div className="pomodoro-stats">
            <div className="pomodoro-stat">
              <span className="stat-label">Completed:</span>
              <span className="stat-value">{completedPomodoros}</span>
            </div>
          </div>

          <div className="pomodoro-controls">
            {!isRunning ? (
              <button className="pomodoro-btn start" onClick={handleStart}>
                ▶️ Start
              </button>
            ) : (
              <button className="pomodoro-btn pause" onClick={handlePause}>
                ⏸️ Pause
              </button>
            )}
            <button className="pomodoro-btn reset" onClick={handleReset}>
              🔄 Reset
            </button>
            <button className="pomodoro-btn skip" onClick={handleSkip}>
              ⏭️ Skip
            </button>
          </div>

          <div className="pomodoro-info">
            <p>💡 Focus for 25 minutes, then take a 5-minute break</p>
            <p>After 4 pomodoros, take a longer 15-30 minute break</p>
          </div>
        </div>
      </div>
    </div>
  )
}

