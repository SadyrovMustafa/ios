import { useMemo } from 'react'
import { Task } from '../types/Task'
import { format, startOfYear, endOfYear, eachDayOfInterval, isSameDay, getDay } from 'date-fns'
import './HeatmapView.css'

interface HeatmapViewProps {
  tasks: Task[]
}

export default function HeatmapView({ tasks }: HeatmapViewProps) {
  const yearData = useMemo(() => {
    const now = new Date()
    const yearStart = startOfYear(now)
    const yearEnd = endOfYear(now)
    const days = eachDayOfInterval({ start: yearStart, end: yearEnd })

    const activityMap = new Map<string, number>()

    tasks.forEach(task => {
      // Count created tasks
      const createdDate = format(new Date(task.createdAt), 'yyyy-MM-dd')
      activityMap.set(createdDate, (activityMap.get(createdDate) || 0) + 1)

      // Count completed tasks
      if (task.isCompleted && task.completedAt) {
        const completedDate = format(new Date(task.completedAt), 'yyyy-MM-dd')
        activityMap.set(completedDate, (activityMap.get(completedDate) || 0) + 1)
      }
    })

    // Find max activity for normalization
    const maxActivity = Math.max(...Array.from(activityMap.values()), 1)

    return {
      days,
      activityMap,
      maxActivity
    }
  }, [tasks])

  const getActivityLevel = (date: Date): number => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const activity = yearData.activityMap.get(dateKey) || 0
    return activity
  }

  const getIntensity = (activity: number): string => {
    if (activity === 0) return 'level-0'
    const level = Math.min(4, Math.ceil((activity / yearData.maxActivity) * 4))
    return `level-${level}`
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // Group days by weeks
  const weeks: Date[][] = []
  let currentWeek: Date[] = []
  const firstDayOfYear = yearData.days[0]
  const firstDayOfWeek = getDay(firstDayOfYear)

  // Add empty cells for days before year start
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(new Date(0))
  }

  yearData.days.forEach(day => {
    const dayOfWeek = getDay(day)
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push([...currentWeek])
      currentWeek = []
    }
    currentWeek.push(day)
  })

  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  // Get month labels
  const monthLabels: { week: number; month: string }[] = []
  const monthStarts = new Set<number>()
  yearData.days.forEach((day, index) => {
    if (day.getDate() === 1) {
      const weekIndex = Math.floor(index / 7)
      if (!monthStarts.has(weekIndex)) {
        monthStarts.add(weekIndex)
        monthLabels.push({
          week: weekIndex,
          month: months[day.getMonth()]
        })
      }
    }
  })

  return (
    <div className="heatmap-view">
      <h1 className="heatmap-title">Activity Heatmap</h1>
      <p className="heatmap-subtitle">Your task activity throughout the year</p>

      <div className="heatmap-container">
        <div className="heatmap-sidebar">
          <div className="weekday-labels">
            {weekDays.map(day => (
              <div key={day} className="weekday-label">{day}</div>
            ))}
          </div>
        </div>

        <div className="heatmap-content">
          <div className="month-labels">
            {monthLabels.map((label, i) => (
              <div
                key={i}
                className="month-label"
                style={{ gridColumn: label.week + 2 }}
              >
                {label.month}
              </div>
            ))}
          </div>

          <div className="heatmap-grid">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="heatmap-week">
                {week.map((day, dayIndex) => {
                  if (day.getTime() === 0) {
                    return <div key={`empty-${dayIndex}`} className="heatmap-day empty" />
                  }

                  const activity = getActivityLevel(day)
                  const intensity = getIntensity(activity)
                  const isToday = isSameDay(day, new Date())

                  return (
                    <div
                      key={day.toISOString()}
                      className={`heatmap-day ${intensity} ${isToday ? 'today' : ''}`}
                      title={`${format(day, 'MMM d, yyyy')}: ${activity} task(s)`}
                    >
                      {activity > 0 && <span className="activity-count">{activity}</span>}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="heatmap-legend">
        <span className="legend-label">Less</span>
        <div className="legend-colors">
          <div className="legend-color level-0" />
          <div className="legend-color level-1" />
          <div className="legend-color level-2" />
          <div className="legend-color level-3" />
          <div className="legend-color level-4" />
        </div>
        <span className="legend-label">More</span>
      </div>

      <div className="heatmap-stats">
        <div className="heatmap-stat">
          <span className="stat-label">Total Days Active:</span>
          <span className="stat-value">
            {Array.from(yearData.activityMap.values()).filter(v => v > 0).length}
          </span>
        </div>
        <div className="heatmap-stat">
          <span className="stat-label">Most Active Day:</span>
          <span className="stat-value">
            {(() => {
              let maxDate = ''
              let maxActivity = 0
              yearData.activityMap.forEach((activity, date) => {
                if (activity > maxActivity) {
                  maxActivity = activity
                  maxDate = date
                }
              })
              return maxDate ? format(new Date(maxDate), 'MMM d, yyyy') : 'N/A'
            })()}
          </span>
        </div>
      </div>
    </div>
  )
}

