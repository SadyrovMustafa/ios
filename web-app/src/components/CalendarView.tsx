import { useState } from 'react'
import { Task } from '../types/Task'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns'
import './CalendarView.css'

interface CalendarViewProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  currentDate?: Date
}

export default function CalendarView({
  tasks,
  onTaskClick,
  currentDate = new Date()
}: CalendarViewProps) {
  const [viewDate, setViewDate] = useState(currentDate)
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false
      return isSameDay(new Date(task.dueDate), date) && !task.isCompleted
    })
  }

  const goToPreviousMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setViewDate(new Date())
  }

  const goToPreviousWeek = () => {
    setViewDate(subWeeks(viewDate, 1))
  }

  const goToNextWeek = () => {
    setViewDate(addWeeks(viewDate, 1))
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const firstDayOfWeek = getDay(monthStart)

  // Недельный вид
  const weekStart = startOfWeek(viewDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(viewDate, { weekStartsOn: 1 })
  const weekDaysList = eachDayOfInterval({ start: weekStart, end: weekEnd })

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <div className="calendar-nav-group">
          <button className="calendar-nav-btn" onClick={viewMode === 'month' ? goToPreviousMonth : goToPreviousWeek}>
            ‹
          </button>
          <h2 className="calendar-month-title">
            {viewMode === 'month' 
              ? format(viewDate, 'MMMM yyyy')
              : `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
            }
          </h2>
          <button className="calendar-nav-btn" onClick={viewMode === 'month' ? goToNextMonth : goToNextWeek}>
            ›
          </button>
        </div>
        <div className="calendar-controls">
          <button 
            className={`calendar-view-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            Месяц
          </button>
          <button 
            className={`calendar-view-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            Неделя
          </button>
          <button className="calendar-today-btn" onClick={goToToday}>
            Сегодня
          </button>
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="calendar-grid">
          {weekDays.map(day => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}

          {Array(firstDayOfWeek)
            .fill(null)
            .map((_, i) => (
              <div key={`empty-${i}`} className="calendar-day empty" />
            ))}

          {days.map(day => {
            const dayTasks = getTasksForDay(day)
            const isTodayDate = isToday(day)

            return (
              <div
                key={day.toISOString()}
                className={`calendar-day ${isTodayDate ? 'today' : ''}`}
              >
                <div className="calendar-day-number">{format(day, 'd')}</div>
                <div className="calendar-day-tasks">
                  {dayTasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      className="calendar-task-dot"
                      style={{
                        backgroundColor: task.priority === 'high' ? '#FF3B30' :
                          task.priority === 'medium' ? '#FF9500' :
                          task.priority === 'low' ? '#007AFF' : '#8E8E93'
                      }}
                      onClick={() => onTaskClick(task)}
                      title={task.title}
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="calendar-task-more">
                      +{dayTasks.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="calendar-week-view">
          <div className="week-header">
            <div className="week-time-column"></div>
            {weekDaysList.map(day => (
              <div key={day.toISOString()} className={`week-day-header ${isToday(day) ? 'today' : ''}`}>
                <div className="week-day-name">{format(day, 'EEE')}</div>
                <div className="week-day-number">{format(day, 'd')}</div>
              </div>
            ))}
          </div>
          <div className="week-content">
            <div className="week-time-column">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="week-hour">
                  {i.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>
            {weekDaysList.map(day => {
              const dayTasks = getTasksForDay(day)
              return (
                <div key={day.toISOString()} className={`week-day-column ${isToday(day) ? 'today' : ''}`}>
                  {dayTasks.map(task => {
                    const taskDate = task.dueDate ? new Date(task.dueDate) : new Date()
                    const hour = taskDate.getHours()
                    const minutes = taskDate.getMinutes()
                    const top = (hour * 60 + minutes) * 0.8 // Примерная высота
                    
                    return (
                      <div
                        key={task.id}
                        className="week-task-item"
                        style={{
                          top: `${top}px`,
                          backgroundColor: task.priority === 'high' ? '#FF3B30' :
                            task.priority === 'medium' ? '#FF9500' :
                            task.priority === 'low' ? '#007AFF' : '#8E8E93'
                        }}
                        onClick={() => onTaskClick(task)}
                        title={task.title}
                      >
                        <div className="week-task-time">{format(taskDate, 'HH:mm')}</div>
                        <div className="week-task-title">{task.title}</div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#FF3B30' }} />
          High Priority
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#FF9500' }} />
          Medium Priority
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#007AFF' }} />
          Low Priority
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#8E8E93' }} />
          No Priority
        </div>
      </div>
    </div>
  )
}

