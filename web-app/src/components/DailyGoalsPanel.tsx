import { useState, useEffect } from 'react'
import { DailyGoalsService, DailyGoal } from '../services/DailyGoalsService'
import { TaskManager } from '../services/TaskManager'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { toastService } from '../services/ToastService'
import './DailyGoalsPanel.css'

interface DailyGoalsPanelProps {
  taskManager: TaskManager
  onClose?: () => void
}

export default function DailyGoalsPanel({ taskManager, onClose }: DailyGoalsPanelProps) {
  const [today, setToday] = useState(new Date())
  const [goal, setGoal] = useState<DailyGoal | null>(null)
  const [targetTasks, setTargetTasks] = useState(5)
  const [completedToday, setCompletedToday] = useState(0)
  const [weekGoals, setWeekGoals] = useState<DailyGoal[]>([])

  useEffect(() => {
    loadGoal()
    loadWeekGoals()
    updateCompletedTasks()
  }, [today])

  const loadGoal = () => {
    const todayGoal = DailyGoalsService.getGoalForDate(today)
    setGoal(todayGoal)
    if (todayGoal) {
      setTargetTasks(todayGoal.targetTasks)
    }
  }

  const loadWeekGoals = () => {
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const goals = DailyGoalsService.getGoalsForWeek(weekStart)
    setWeekGoals(goals)
  }

  const updateCompletedTasks = () => {
    const tasks = taskManager.getTasks()
    const todayCompleted = tasks.filter(t => {
      if (!t.completedAt) return false
      return isSameDay(new Date(t.completedAt), today)
    }).length
    setCompletedToday(todayCompleted)
    
    if (goal) {
      DailyGoalsService.updateCompletedTasks(today, todayCompleted)
    }
  }

  const handleSetGoal = () => {
    if (targetTasks < 1) {
      toastService.error('Цель должна быть не менее 1 задачи')
      return
    }

    const newGoal = DailyGoalsService.setGoalForDate(today, targetTasks)
    setGoal(newGoal)
    toastService.success(`Цель установлена: ${targetTasks} задач`)
    loadWeekGoals()
  }

  const progress = goal ? DailyGoalsService.getProgress(today) : 0

  return (
    <div className={`daily-goals-panel ${onClose ? 'modal' : ''}`}>
      {onClose && (
        <div className="daily-goals-header">
          <h2>🎯 Ежедневные цели</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      )}

      <div className="daily-goals-content">
        <div className="today-goal">
          <h3>Сегодня ({format(today, 'd MMMM yyyy', { locale: require('date-fns/locale/ru') } || {})})</h3>
          <div className="goal-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="progress-text">
              {completedToday} / {goal?.targetTasks || targetTasks} задач
              {progress >= 100 && ' ✓'}
            </div>
          </div>

          <div className="goal-form">
            <label>Цель на сегодня:</label>
            <div className="goal-input-group">
              <input
                type="number"
                min="1"
                value={targetTasks}
                onChange={(e) => setTargetTasks(Number(e.target.value))}
                className="goal-input"
              />
              <button onClick={handleSetGoal} className="btn-primary">
                Установить
              </button>
            </div>
          </div>
        </div>

        <div className="week-goals">
          <h3>Неделя</h3>
          <div className="week-grid">
            {eachDayOfInterval({
              start: startOfWeek(today, { weekStartsOn: 1 }),
              end: endOfWeek(today, { weekStartsOn: 1 })
            }).map(day => {
              const dayGoal = weekGoals.find(g => g.date === format(day, 'yyyy-MM-dd'))
              const dayCompleted = taskManager.getTasks().filter(t => {
                if (!t.completedAt) return false
                return isSameDay(new Date(t.completedAt), day)
              }).length
              const dayProgress = dayGoal && dayGoal.targetTasks > 0
                ? Math.min((dayCompleted / dayGoal.targetTasks) * 100, 100)
                : 0

              return (
                <div
                  key={day.toISOString()}
                  className={`week-day ${isSameDay(day, today) ? 'today' : ''}`}
                >
                  <div className="day-name">{format(day, 'EEE', { locale: require('date-fns/locale/ru') } || {})}</div>
                  <div className="day-number">{format(day, 'd')}</div>
                  {dayGoal && (
                    <div className="day-progress">
                      <div className="day-progress-bar">
                        <div
                          className="day-progress-fill"
                          style={{ width: `${dayProgress}%` }}
                        />
                      </div>
                      <div className="day-stats">
                        {dayCompleted} / {dayGoal.targetTasks}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

