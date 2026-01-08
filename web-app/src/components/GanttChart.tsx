import { useMemo } from 'react'
import { Task } from '../types/Task'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays } from 'date-fns'
import './GanttChart.css'

interface GanttChartProps {
  tasks: Task[]
}

export default function GanttChart({ tasks }: GanttChartProps) {
  const ganttData = useMemo(() => {
    const tasksWithDates = tasks.filter(t => t.dueDate && !t.isCompleted)
    const now = new Date()
    const weekStart = startOfWeek(now)
    const weekEnd = endOfWeek(now)
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

    return {
      days,
      tasks: tasksWithDates.map(task => {
        const startDate = task.createdAt ? new Date(task.createdAt) : new Date()
        const endDate = task.dueDate ? new Date(task.dueDate) : new Date()
        const duration = differenceInDays(endDate, startDate) + 1
        const offset = differenceInDays(startDate, weekStart)
        
        return {
          ...task,
          startDate,
          endDate,
          duration: Math.max(1, duration),
          offset: Math.max(0, offset)
        }
      })
    }
  }, [tasks])

  return (
    <div className="gantt-chart">
      <h2 className="gantt-title">📅 Gantt Chart</h2>
      
      <div className="gantt-container">
        <div className="gantt-header">
          <div className="gantt-task-header">Task</div>
          <div className="gantt-timeline">
            {ganttData.days.map((day, i) => (
              <div key={i} className="gantt-day-header">
                {format(day, 'EEE')}
                <div className="gantt-day-number">{format(day, 'd')}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="gantt-body">
          {ganttData.tasks.map(task => (
            <div key={task.id} className="gantt-row">
              <div className="gantt-task-name">{task.title}</div>
              <div className="gantt-timeline">
                {ganttData.days.map((day, i) => {
                  const taskStart = task.offset
                  const taskEnd = task.offset + task.duration
                  const isInRange = i >= taskStart && i < taskEnd
                  const isStart = i === taskStart
                  const isEnd = i === taskEnd - 1
                  
                  return (
                    <div
                      key={i}
                      className={`gantt-cell ${isInRange ? 'active' : ''} ${isStart ? 'start' : ''} ${isEnd ? 'end' : ''}`}
                      style={{
                        backgroundColor: isInRange ? (task.priority === 'high' ? '#FF3B30' : 
                                                      task.priority === 'medium' ? '#FF9500' : 
                                                      task.priority === 'low' ? '#007AFF' : '#8E8E93') : 'transparent'
                      }}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {ganttData.tasks.length === 0 && (
        <div className="gantt-empty">
          <p>No tasks with due dates for this week</p>
        </div>
      )}
    </div>
  )
}

