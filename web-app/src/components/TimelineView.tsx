import { useMemo } from 'react'
import { Task } from '../types/Task'
import { format, startOfDay, endOfDay, isSameDay, isAfter, isBefore } from 'date-fns'
import './TimelineView.css'

interface TimelineViewProps {
  tasks: Task[]
  date?: Date
}

export default function TimelineView({ tasks, date = new Date() }: TimelineViewProps) {
  const timelineData = useMemo(() => {
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)
    
    const dayTasks = tasks.filter(task => {
      if (task.isCompleted) return false
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      return isSameDay(taskDate, date) || (isAfter(taskDate, dayStart) && isBefore(taskDate, dayEnd))
    })

    // Group by hour
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const tasksByHour = hours.map(hour => {
      return dayTasks.filter(task => {
        if (!task.dueDate) return false
        const taskHour = new Date(task.dueDate).getHours()
        return taskHour === hour
      })
    })

    return { hours, tasksByHour, dayTasks }
  }, [tasks, date])

  return (
    <div className="timeline-view">
      <h2 className="timeline-title">⏰ Timeline - {format(date, 'MMMM d, yyyy')}</h2>
      
      <div className="timeline-container">
        {timelineData.hours.map((hour, index) => {
          const hourTasks = timelineData.tasksByHour[index]
          return (
            <div key={hour} className="timeline-hour">
              <div className="timeline-hour-label">
                {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
              </div>
              <div className="timeline-hour-content">
                {hourTasks.length > 0 ? (
                  <div className="timeline-tasks">
                    {hourTasks.map(task => (
                      <div
                        key={task.id}
                        className="timeline-task"
                        style={{
                          borderLeftColor: task.priority === 'high' ? '#FF3B30' :
                                          task.priority === 'medium' ? '#FF9500' :
                                          task.priority === 'low' ? '#007AFF' : '#8E8E93'
                        }}
                      >
                        <div className="timeline-task-title">{task.title}</div>
                        {task.dueDate && (
                          <div className="timeline-task-time">
                            {format(new Date(task.dueDate), 'HH:mm')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="timeline-empty">—</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {timelineData.dayTasks.length === 0 && (
        <div className="timeline-empty-day">
          <p>No tasks scheduled for this day</p>
        </div>
      )}
    </div>
  )
}

