import { useMemo } from 'react'
import { Task } from '../types/Task'
import { TimeTrackingService } from '../services/TimeTrackingService'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, differenceInDays } from 'date-fns'
import './EnhancedAnalytics.css'

interface EnhancedAnalyticsProps {
  tasks: Task[]
}

export default function EnhancedAnalytics({ tasks }: EnhancedAnalyticsProps) {
  const timeStats = useMemo(() => {
    const entries = TimeTrackingService.getEntries()
    const totalMinutes = entries
      .filter(e => e.duration)
      .reduce((total, e) => total + (e.duration || 0), 0)
    
    const productivityByHour = TimeTrackingService.getProductivityByHour()
    const mostProductiveHour = productivityByHour.reduce((max, current) =>
      current.minutes > max.minutes ? current : max
    , productivityByHour[0] || { hour: 0, minutes: 0 })

    return {
      totalMinutes,
      totalHours: Math.floor(totalMinutes / 60),
      productivityByHour,
      mostProductiveHour
    }
  }, [])

  const periodComparison = useMemo(() => {
    const now = new Date()
    const thisWeekStart = startOfWeek(now)
    const thisWeekEnd = endOfWeek(now)
    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(thisWeekEnd)
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7)

    const thisWeekTasks = tasks.filter(t => {
      if (!t.completedAt) return false
      const completed = new Date(t.completedAt)
      return completed >= thisWeekStart && completed <= thisWeekEnd
    })

    const lastWeekTasks = tasks.filter(t => {
      if (!t.completedAt) return false
      const completed = new Date(t.completedAt)
      return completed >= lastWeekStart && completed <= lastWeekEnd
    })

    return {
      thisWeek: thisWeekTasks.length,
      lastWeek: lastWeekTasks.length,
      change: thisWeekTasks.length - lastWeekTasks.length,
      changePercent: lastWeekTasks.length > 0
        ? ((thisWeekTasks.length - lastWeekTasks.length) / lastWeekTasks.length) * 100
        : 0
    }
  }, [tasks])

  const averageCompletionTime = useMemo(() => {
    const completedTasks = tasks.filter(t => t.isCompleted && t.completedAt && t.createdAt)
    if (completedTasks.length === 0) return null

    const totalDays = completedTasks.reduce((total, task) => {
      const created = new Date(task.createdAt)
      const completed = new Date(task.completedAt!)
      const days = differenceInDays(completed, created)
      return total + Math.max(0, days)
    }, 0)

    return Math.round(totalDays / completedTasks.length)
  }, [tasks])

  return (
    <div className="enhanced-analytics">
      <h2 className="analytics-title">📈 Enhanced Analytics</h2>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>⏱️ Time Tracking</h3>
          <div className="stat-large">
            <div className="stat-value">{timeStats.totalHours}</div>
            <div className="stat-label">Total Hours Tracked</div>
          </div>
          {timeStats.mostProductiveHour.minutes > 0 && (
            <div className="stat-info">
              Most productive: {timeStats.mostProductiveHour.hour}:00
              ({timeStats.mostProductiveHour.minutes} min)
            </div>
          )}
        </div>

        <div className="analytics-card">
          <h3>📊 Week Comparison</h3>
          <div className="comparison-stats">
            <div className="comparison-item">
              <span className="comparison-label">This Week:</span>
              <span className="comparison-value">{periodComparison.thisWeek}</span>
            </div>
            <div className="comparison-item">
              <span className="comparison-label">Last Week:</span>
              <span className="comparison-value">{periodComparison.lastWeek}</span>
            </div>
            <div className={`comparison-change ${periodComparison.change >= 0 ? 'positive' : 'negative'}`}>
              {periodComparison.change >= 0 ? '↑' : '↓'} {Math.abs(periodComparison.change)} 
              ({periodComparison.changePercent >= 0 ? '+' : ''}{periodComparison.changePercent.toFixed(1)}%)
            </div>
          </div>
        </div>

        {averageCompletionTime !== null && (
          <div className="analytics-card">
            <h3>⚡ Average Completion Time</h3>
            <div className="stat-large">
              <div className="stat-value">{averageCompletionTime}</div>
              <div className="stat-label">Days</div>
            </div>
            <div className="stat-info">
              Average time from creation to completion
            </div>
          </div>
        )}

        <div className="analytics-card">
          <h3>🕐 Productivity by Hour</h3>
          <div className="hourly-chart">
            {timeStats.productivityByHour.map((item, index) => {
              const maxMinutes = Math.max(...timeStats.productivityByHour.map(i => i.minutes), 1)
              const height = (item.minutes / maxMinutes) * 100
              return (
                <div key={index} className="hour-bar">
                  <div
                    className="bar-fill"
                    style={{ height: `${height}%` }}
                    title={`${item.hour}:00 - ${item.minutes} min`}
                  />
                  <div className="bar-label">{item.hour}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

