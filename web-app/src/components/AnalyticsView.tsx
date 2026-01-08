import { useState, useMemo } from 'react'
import { Task, TaskList } from '../types/Task'
import { TaskManager } from '../services/TaskManager'
import { ReportService } from '../services/ReportService'
import HeatmapView from './HeatmapView'
import ChartsView from './ChartsView'
import GanttChart from './GanttChart'
import TimelineView from './TimelineView'
import EnhancedAnalytics from './EnhancedAnalytics'
import { lazy, Suspense } from 'react'
import './AnalyticsView.css'

const LazyEnhancedAnalytics = lazy(() => import('./EnhancedAnalytics'))

interface AnalyticsViewProps {
  taskManager: TaskManager
  listId?: string
}

export default function AnalyticsView({ taskManager, listId }: AnalyticsViewProps) {
  const [viewMode, setViewMode] = useState<'stats' | 'heatmap' | 'charts' | 'gantt' | 'timeline' | 'enhanced'>('stats')
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | 'all'>('all')
  
  const tasks = useMemo(() => {
    return listId ? taskManager.getTasksForList(listId) : taskManager.getTasks()
  }, [taskManager, listId])

  const lists = useMemo(() => {
    return taskManager.getLists()
  }, [taskManager])

  const handleExportPDF = async () => {
    const reportData = ReportService.generateReportData(tasks, lists, reportPeriod)
    await ReportService.exportToPDF(reportData)
  }

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(t => t.isCompleted).length
    const active = total - completed
    const completionRate = total > 0 ? (completed / total) * 100 : 0

    const byPriority = {
      high: tasks.filter(t => t.priority === 'high' && !t.isCompleted).length,
      medium: tasks.filter(t => t.priority === 'medium' && !t.isCompleted).length,
      low: tasks.filter(t => t.priority === 'low' && !t.isCompleted).length,
      none: tasks.filter(t => t.priority === 'none' && !t.isCompleted).length
    }

    const overdue = tasks.filter(t => {
      if (!t.dueDate || t.isCompleted) return false
      return new Date(t.dueDate) < new Date()
    }).length

    const withTags = tasks.filter(t => t.tags && t.tags.length > 0).length
    const withSubtasks = tasks.filter(t => t.subtasks && t.subtasks.length > 0).length
    const recurring = tasks.filter(t => t.recurring).length

    const completedThisWeek = tasks.filter(t => {
      if (!t.completedAt) return false
      const completed = new Date(t.completedAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return completed >= weekAgo
    }).length

    const completedThisMonth = tasks.filter(t => {
      if (!t.completedAt) return false
      const completed = new Date(t.completedAt)
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return completed >= monthAgo
    }).length

    return {
      total,
      completed,
      active,
      completionRate,
      byPriority,
      overdue,
      withTags,
      withSubtasks,
      recurring,
      completedThisWeek,
      completedThisMonth
    }
  }, [tasks])

  return (
    <div className="analytics-view">
      <div className="analytics-header">
        <h1 className="analytics-title">Analytics</h1>
        <div className="analytics-controls">
          <div className="view-mode-selector">
            <button
              className={`mode-btn ${viewMode === 'stats' ? 'active' : ''}`}
              onClick={() => setViewMode('stats')}
            >
              📊 Stats
            </button>
            <button
              className={`mode-btn ${viewMode === 'charts' ? 'active' : ''}`}
              onClick={() => setViewMode('charts')}
            >
              📈 Charts
            </button>
            <button
              className={`mode-btn ${viewMode === 'heatmap' ? 'active' : ''}`}
              onClick={() => setViewMode('heatmap')}
            >
              🔥 Heatmap
            </button>
            <button
              className={`mode-btn ${viewMode === 'gantt' ? 'active' : ''}`}
              onClick={() => setViewMode('gantt')}
            >
              📅 Gantt
            </button>
            <button
              className={`mode-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
            >
              ⏰ Timeline
            </button>
            <button
              className={`mode-btn ${viewMode === 'enhanced' ? 'active' : ''}`}
              onClick={() => setViewMode('enhanced')}
            >
              📈 Enhanced
            </button>
          </div>
          {viewMode === 'stats' && (
            <div className="report-controls">
              <select
                className="period-select"
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value as 'week' | 'month' | 'all')}
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
              <button className="export-pdf-btn" onClick={handleExportPDF}>
                📄 Export PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'heatmap' ? (
        <HeatmapView tasks={tasks} />
      ) : viewMode === 'charts' ? (
        <ChartsView tasks={tasks} />
      ) : viewMode === 'gantt' ? (
        <GanttChart tasks={tasks} />
      ) : viewMode === 'timeline' ? (
        <TimelineView tasks={tasks} />
      ) : viewMode === 'enhanced' ? (
        <Suspense fallback={<div>Loading...</div>}>
          <LazyEnhancedAnalytics tasks={tasks} />
        </Suspense>
      ) : (
        <>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Overview</h3>
          <div className="stat-row">
            <span>Total Tasks:</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="stat-row">
            <span>Active:</span>
            <strong>{stats.active}</strong>
          </div>
          <div className="stat-row">
            <span>Completed:</span>
            <strong>{stats.completed}</strong>
          </div>
          <div className="stat-row">
            <span>Completion Rate:</span>
            <strong>{stats.completionRate.toFixed(1)}%</strong>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Completion Rate</h3>
          <div className="progress-bar-container">
            <div 
              className="progress-bar"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <div className="progress-text">
            {stats.completionRate.toFixed(1)}% completed
          </div>
        </div>

        <div className="analytics-card">
          <h3>By Priority</h3>
          <div className="priority-stats">
            <div className="priority-stat">
              <span className="priority-dot high" />
              <span>High: {stats.byPriority.high}</span>
            </div>
            <div className="priority-stat">
              <span className="priority-dot medium" />
              <span>Medium: {stats.byPriority.medium}</span>
            </div>
            <div className="priority-stat">
              <span className="priority-dot low" />
              <span>Low: {stats.byPriority.low}</span>
            </div>
            <div className="priority-stat">
              <span className="priority-dot none" />
              <span>None: {stats.byPriority.none}</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Activity</h3>
          <div className="stat-row">
            <span>Completed this week:</span>
            <strong>{stats.completedThisWeek}</strong>
          </div>
          <div className="stat-row">
            <span>Completed this month:</span>
            <strong>{stats.completedThisMonth}</strong>
          </div>
          <div className="stat-row">
            <span>Overdue:</span>
            <strong className={stats.overdue > 0 ? 'warning' : ''}>{stats.overdue}</strong>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Features Usage</h3>
          <div className="stat-row">
            <span>Tasks with tags:</span>
            <strong>{stats.withTags}</strong>
          </div>
          <div className="stat-row">
            <span>Tasks with subtasks:</span>
            <strong>{stats.withSubtasks}</strong>
          </div>
          <div className="stat-row">
            <span>Recurring tasks:</span>
            <strong>{stats.recurring}</strong>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Productivity Score</h3>
          <div className="score-display">
            {(() => {
              const score = Math.min(100, Math.round(
                (stats.completionRate * 0.4) +
                ((stats.completedThisWeek / Math.max(1, stats.active)) * 30) +
                ((stats.overdue === 0 ? 1 : 0) * 30)
              ))
              return (
                <>
                  <div className="score-value">{score}</div>
                  <div className="score-label">/ 100</div>
                </>
              )
            })()}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  )
}

