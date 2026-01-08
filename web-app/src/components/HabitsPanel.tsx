import { useState, useEffect } from 'react'
import { HabitsService, Habit, HabitCompletion } from '../services/HabitsService'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { toastService } from '../services/ToastService'
import './HabitsPanel.css'

interface HabitsPanelProps {
  onClose?: () => void
}

export default function HabitsPanel({ onClose }: HabitsPanelProps) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitColor, setNewHabitColor] = useState('#007AFF')
  const [newHabitIcon, setNewHabitIcon] = useState('✅')
  const [selectedWeek, setSelectedWeek] = useState(new Date())

  useEffect(() => {
    loadHabits()
  }, [])

  const loadHabits = () => {
    setHabits(HabitsService.getAllHabits())
  }

  const handleAddHabit = () => {
    if (!newHabitName.trim()) {
      toastService.error('Введите название привычки')
      return
    }

    HabitsService.addHabit({
      name: newHabitName,
      color: newHabitColor,
      icon: newHabitIcon
    })
    toastService.success('Привычка добавлена')
    setNewHabitName('')
    setNewHabitColor('#007AFF')
    setNewHabitIcon('✅')
    setShowAddForm(false)
    loadHabits()
  }

  const handleToggleHabit = (habitId: string, date: Date) => {
    const isCompleted = HabitsService.isHabitCompleted(habitId, date)
    if (isCompleted) {
      HabitsService.uncompleteHabit(habitId, date)
    } else {
      HabitsService.completeHabit(habitId, date)
    }
    loadHabits()
  }

  const handleDeleteHabit = (habitId: string) => {
    if (confirm('Удалить привычку?')) {
      HabitsService.deleteHabit(habitId)
      toastService.info('Привычка удалена')
      loadHabits()
    }
  }

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedWeek, { weekStartsOn: 1 }),
    end: endOfWeek(selectedWeek, { weekStartsOn: 1 })
  })

  return (
    <div className={`habits-panel ${onClose ? 'modal' : ''}`}>
      {onClose && (
        <div className="habits-header">
          <h2>🎯 Привычки</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      )}

      <div className="habits-content">
        <div className="habits-controls">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="add-habit-btn"
          >
            + Добавить привычку
          </button>
        </div>

        {showAddForm && (
          <div className="add-habit-form">
            <input
              type="text"
              placeholder="Название привычки"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              className="form-input"
            />
            <div className="form-row">
              <input
                type="color"
                value={newHabitColor}
                onChange={(e) => setNewHabitColor(e.target.value)}
                className="color-input"
              />
              <input
                type="text"
                placeholder="Иконка (эмодзи)"
                value={newHabitIcon}
                onChange={(e) => setNewHabitIcon(e.target.value)}
                className="icon-input"
                maxLength={2}
              />
            </div>
            <div className="form-actions">
              <button onClick={handleAddHabit} className="btn-primary">
                Добавить
              </button>
              <button onClick={() => setShowAddForm(false)} className="btn-secondary">
                Отмена
              </button>
            </div>
          </div>
        )}

        {habits.length === 0 ? (
          <div className="empty-state">
            <p>Нет привычек. Создайте первую!</p>
          </div>
        ) : (
          <div className="habits-list">
            {habits.map(habit => (
              <div key={habit.id} className="habit-card">
                <div className="habit-header">
                  <div className="habit-info">
                    <span className="habit-icon" style={{ color: habit.color }}>
                      {habit.icon}
                    </span>
                    <div>
                      <h3>{habit.name}</h3>
                      <div className="habit-stats">
                        <span>Стрик: {habit.streak} дней</span>
                        <span>Рекорд: {habit.longestStreak} дней</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="delete-habit-btn"
                  >
                    🗑️
                  </button>
                </div>

                <div className="habit-week">
                  {weekDays.map(day => {
                    const isCompleted = HabitsService.isHabitCompleted(habit.id, day)
                    const isToday = isSameDay(day, new Date())
                    return (
                      <button
                        key={day.toISOString()}
                        className={`habit-day ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''}`}
                        onClick={() => handleToggleHabit(habit.id, day)}
                        style={isCompleted ? { backgroundColor: habit.color, color: 'white' } : undefined}
                      >
                        <div className="day-name">{format(day, 'EEE')}</div>
                        <div className="day-number">{format(day, 'd')}</div>
                        {isCompleted && <span className="check-mark">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

