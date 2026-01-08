import { useState, useEffect } from 'react'
import { DashboardService, Dashboard, WidgetConfig, WidgetType } from '../services/DashboardService'
import { TaskManager } from '../services/TaskManager'
import { toastService } from '../services/ToastService'
import './CustomDashboard.css'

interface CustomDashboardProps {
  taskManager: TaskManager
}

export default function CustomDashboard({ taskManager }: CustomDashboardProps) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [showAddWidget, setShowAddWidget] = useState(false)
  const [selectedWidgetType, setSelectedWidgetType] = useState<WidgetType | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = () => {
    const current = DashboardService.getCurrentDashboard()
    setDashboard(current)
  }

  const handleAddWidget = (type: WidgetType) => {
    if (!dashboard) return

    const widget: Omit<WidgetConfig, 'id'> = {
      type,
      title: getWidgetTitle(type),
      x: 0,
      y: 0,
      width: getDefaultWidth(type),
      height: getDefaultHeight(type),
      settings: {}
    }

    DashboardService.addWidget(dashboard.id, widget)
    loadDashboard()
    setShowAddWidget(false)
    toastService.success('Виджет добавлен')
  }

  const handleDeleteWidget = (widgetId: string) => {
    if (!dashboard) return
    DashboardService.deleteWidget(dashboard.id, widgetId)
    loadDashboard()
    toastService.success('Виджет удален')
  }

  const handleUpdateWidget = (widgetId: string, updates: Partial<WidgetConfig>) => {
    if (!dashboard) return
    DashboardService.updateWidget(dashboard.id, widgetId, updates)
    loadDashboard()
  }

  const handleDragEnd = (widgetId: string, x: number, y: number) => {
    if (!dashboard) return
    const widget = dashboard.widgets.find(w => w.id === widgetId)
    if (widget) {
      DashboardService.updateWidgetLayout(dashboard.id, widgetId, x, y, widget.width, widget.height)
      loadDashboard()
    }
  }

  const handleResize = (widgetId: string, width: number, height: number) => {
    if (!dashboard) return
    const widget = dashboard.widgets.find(w => w.id === widgetId)
    if (widget) {
      DashboardService.updateWidgetLayout(dashboard.id, widgetId, widget.x, widget.y, width, height)
      loadDashboard()
    }
  }

  const getWidgetTitle = (type: WidgetType): string => {
    const titles: Record<WidgetType, string> = {
      'task-list': 'Список задач',
      'calendar': 'Календарь',
      'stats': 'Статистика',
      'chart': 'График',
      'pomodoro': 'Pomodoro',
      'goals': 'Цели',
      'habits': 'Привычки',
      'focus-time': 'Время фокуса'
    }
    return titles[type]
  }

  const getDefaultWidth = (type: WidgetType): number => {
    const widths: Record<WidgetType, number> = {
      'task-list': 4,
      'calendar': 6,
      'stats': 2,
      'chart': 4,
      'pomodoro': 2,
      'goals': 3,
      'habits': 3,
      'focus-time': 2
    }
    return widths[type]
  }

  const getDefaultHeight = (type: WidgetType): number => {
    const heights: Record<WidgetType, number> = {
      'task-list': 4,
      'calendar': 3,
      'stats': 2,
      'chart': 3,
      'pomodoro': 2,
      'goals': 3,
      'habits': 3,
      'focus-time': 2
    }
    return heights[type]
  }

  if (!dashboard) {
    return <div className="dashboard-loading">Загрузка дашборда...</div>
  }

  return (
    <div className="custom-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">{dashboard.name}</h1>
        <div className="dashboard-actions">
          <button
            className="btn-add-widget"
            onClick={() => setShowAddWidget(true)}
          >
            + Добавить виджет
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {dashboard.widgets.map(widget => (
          <DashboardWidget
            key={widget.id}
            widget={widget}
            taskManager={taskManager}
            onDelete={() => handleDeleteWidget(widget.id)}
            onUpdate={(updates) => handleUpdateWidget(widget.id, updates)}
            onDragEnd={(x, y) => handleDragEnd(widget.id, x, y)}
            onResize={(width, height) => handleResize(widget.id, width, height)}
          />
        ))}
      </div>

      {showAddWidget && (
        <div className="add-widget-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Добавить виджет</h2>
              <button className="close-btn" onClick={() => setShowAddWidget(false)}>×</button>
            </div>
            <div className="widget-types">
              {(['task-list', 'calendar', 'stats', 'chart', 'pomodoro', 'goals', 'habits', 'focus-time'] as WidgetType[]).map(type => (
                <button
                  key={type}
                  className="widget-type-btn"
                  onClick={() => handleAddWidget(type)}
                >
                  <span className="widget-icon">{getWidgetIcon(type)}</span>
                  <span className="widget-name">{getWidgetTitle(type)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface DashboardWidgetProps {
  widget: WidgetConfig
  taskManager: TaskManager
  onDelete: () => void
  onUpdate: (updates: Partial<WidgetConfig>) => void
  onDragEnd: (x: number, y: number) => void
  onResize: (width: number, height: number) => void
}

function DashboardWidget({ widget, taskManager, onDelete, onUpdate, onDragEnd, onResize }: DashboardWidgetProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [position, setPosition] = useState({ x: widget.x, y: widget.y })
  const [size, setSize] = useState({ width: widget.width, height: widget.height })

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) return
    setIsDragging(true)
    const startX = e.clientX - position.x * 100
    const startY = e.clientY - position.y * 100

    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(0, Math.floor((e.clientX - startX) / 100))
      const newY = Math.max(0, Math.floor((e.clientY - startY) / 100))
      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      onDragEnd(position.x, position.y)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = size.width
    const startHeight = size.height

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY
      const newWidth = Math.max(2, Math.min(6, Math.floor(startWidth + deltaX / 100)))
      const newHeight = Math.max(2, Math.min(6, Math.floor(startHeight + deltaY / 100)))
      setSize({ width: newWidth, height: newHeight })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      onResize(size.width, size.height)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      className={`dashboard-widget ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${position.x * 100}px`,
        top: `${position.y * 100}px`,
        width: `${size.width * 100}px`,
        height: `${size.height * 100}px`
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="widget-header">
        <h3 className="widget-title">{widget.title}</h3>
        <div className="widget-actions">
          <button className="widget-btn" onClick={onDelete}>×</button>
        </div>
      </div>
      <div className="widget-content">
        {renderWidgetContent(widget, taskManager)}
      </div>
      <div className="resize-handle" onMouseDown={handleResizeStart}></div>
    </div>
  )
}

function renderWidgetContent(widget: WidgetConfig, taskManager: TaskManager) {
  switch (widget.type) {
    case 'task-list':
      const tasks = taskManager.getTasksForToday().slice(0, 5)
      return (
        <div className="widget-task-list">
          {tasks.length === 0 ? (
            <p className="empty-state">Нет задач на сегодня</p>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="widget-task-item">
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => taskManager.toggleTaskCompletion(task)}
                />
                <span className={task.isCompleted ? 'completed' : ''}>{task.title}</span>
              </div>
            ))
          )}
        </div>
      )

    case 'stats':
      const allTasks = taskManager.getTasks()
      const completed = allTasks.filter(t => t.isCompleted).length
      const active = allTasks.filter(t => !t.isCompleted).length
      return (
        <div className="widget-stats">
          <div className="stat-item">
            <div className="stat-value">{active}</div>
            <div className="stat-label">Активных</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{completed}</div>
            <div className="stat-label">Выполнено</div>
          </div>
        </div>
      )

    case 'pomodoro':
      return (
        <div className="widget-pomodoro">
          <div className="pomodoro-timer">25:00</div>
          <button className="pomodoro-btn">Старт</button>
        </div>
      )

    case 'goals':
      return (
        <div className="widget-goals">
          <p className="empty-state">Цели будут здесь</p>
        </div>
      )

    case 'habits':
      return (
        <div className="widget-habits">
          <p className="empty-state">Привычки будут здесь</p>
        </div>
      )

    default:
      return <div className="widget-placeholder">Виджет {widget.type}</div>
  }
}

function getWidgetIcon(type: WidgetType): string {
  const icons: Record<WidgetType, string> = {
    'task-list': '📋',
    'calendar': '📅',
    'stats': '📊',
    'chart': '📈',
    'pomodoro': '🍅',
    'goals': '🎯',
    'habits': '📈',
    'focus-time': '⏱️'
  }
  return icons[type]
}

