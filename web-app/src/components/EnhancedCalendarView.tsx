import { useState } from 'react'
import { Task } from '../types/Task'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, getDay, startOfDay, addDays, subDays } from 'date-fns'
import './EnhancedCalendarView.css'

interface EnhancedCalendarViewProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  currentDate?: Date
}

type ViewMode = 'month' | 'week' | 'day'

export default function EnhancedCalendarView({
  tasks,
  onTaskClick,
  currentDate = new Date()
}: EnhancedCalendarViewProps) {
  const [viewDate, setViewDate] = useState(currentDate)
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate || task.isCompleted) return false
      return isSameDay(new Date(task.dueDate), date)
    })
  }

  const goToPrevious = () => {
    const newDate = new Date(viewDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() - 1)
    }
    setViewDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(viewDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setViewDate(newDate)
  }

  const goToToday = () => {
    setViewDate(new Date())
  }

  const renderMonthView = () => {
    const monthStart = startOfDay(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1))
    const monthEnd = startOfDay(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0))
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const firstDayOfWeek = getDay(monthStart)

    return (
      <div className="calendar-month-view">
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
          {Array(firstDayOfWeek).fill(null).map((_, i) => (
            <div key={`empty-${i}`} className="calendar-day empty" />
          ))}
          {days.map(day => {
            const dayTasks = getTasksForDay(day)
            return (
              <div
                key={day.toISOString()}
                className={`calendar-day ${isToday(day) ? 'today' : ''}`}
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
                    <div className="calendar-task-more">+{dayTasks.length - 3}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(viewDate, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(viewDate, { weekStartsOn: 0 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

    return (
      <div className="calendar-week-view">
        <div className="week-header">
          {weekDays.map(day => (
            <div key={day.toISOString()} className="week-day-header">
              <div className="week-day-name">{format(day, 'EEE')}</div>
              <div className={`week-day-number ${isToday(day) ? 'today' : ''}`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        <div className="week-content">
          {weekDays.map(day => {
            const dayTasks = getTasksForDay(day)
            return (
              <div key={day.toISOString()} className="week-day-column">
                {dayTasks.map(task => (
                  <div
                    key={task.id}
                    className="week-task-item"
                    onClick={() => onTaskClick(task)}
                  >
                    <div className="task-time">
                      {task.dueDate ? format(new Date(task.dueDate), 'HH:mm') : ''}
                    </div>
                    <div className="task-title">{task.title}</div>
                    {task.priority !== 'none' && (
                      <div
                        className="task-priority-indicator"
                        style={{
                          backgroundColor: task.priority === 'high' ? '#FF3B30' :
                            task.priority === 'medium' ? '#FF9500' : '#007AFF'
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const dayTasks = getTasksForDay(viewDate)
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="calendar-day-view">
        <div className="day-header">
          <div className="day-date">{format(viewDate, 'EEEE, MMMM d, yyyy')}</div>
        </div>
        <div className="day-timeline">
          {hours.map(hour => {
            const hourTasks = dayTasks.filter(task => {
              if (!task.dueDate) return false
              const taskHour = new Date(task.dueDate).getHours()
              return taskHour === hour
            })

            return (
              <div key={hour} className="timeline-hour">
                <div className="hour-label">{format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}</div>
                <div className="hour-tasks">
                  {hourTasks.map(task => (
                    <div
                      key={task.id}
                      className="timeline-task"
                      onClick={() => onTaskClick(task)}
                    >
                      <div className="timeline-task-title">{task.title}</div>
                      {task.notes && (
                        <div className="timeline-task-notes">{task.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="enhanced-calendar-view">
      <div className="calendar-header">
        <div className="calendar-controls">
          <button className="nav-btn" onClick={goToPrevious}>‹</button>
          <h2 className="calendar-title">
            {viewMode === 'month' && format(viewDate, 'MMMM yyyy')}
            {viewMode === 'week' && `Week of ${format(startOfWeek(viewDate), 'MMM d')}`}
            {viewMode === 'day' && format(viewDate, 'MMMM d, yyyy')}
          </h2>
          <button className="nav-btn" onClick={goToNext}>›</button>
          <button className="today-btn" onClick={goToToday}>Today</button>
        </div>
        <div className="view-mode-selector">
          <button
            className={`mode-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            Month
          </button>
          <button
            className={`mode-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            Week
          </button>
          <button
            className={`mode-btn ${viewMode === 'day' ? 'active' : ''}`}
            onClick={() => setViewMode('day')}
          >
            Day
          </button>
        </div>
      </div>

      <div className="calendar-content">
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </div>
    </div>
  )
}

