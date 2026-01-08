/**
 * Dashboard Service - управление кастомными дашбордами
 */

export type WidgetType = 
  | 'task-list'
  | 'calendar'
  | 'stats'
  | 'chart'
  | 'pomodoro'
  | 'goals'
  | 'habits'
  | 'focus-time'

export interface WidgetConfig {
  id: string
  type: WidgetType
  title: string
  x: number
  y: number
  width: number
  height: number
  settings?: Record<string, any>
}

export interface Dashboard {
  id: string
  name: string
  widgets: WidgetConfig[]
  createdAt: Date
  updatedAt: Date
}

export class DashboardService {
  private static dashboardsKey = 'ticktick_dashboards'
  private static currentDashboardKey = 'ticktick_current_dashboard'

  static getAllDashboards(): Dashboard[] {
    const data = localStorage.getItem(this.dashboardsKey)
    if (!data) {
      // Create default dashboard
      const defaultDashboard = this.createDefaultDashboard()
      this.saveDashboards([defaultDashboard])
      return [defaultDashboard]
    }
    return JSON.parse(data).map((d: any) => ({
      ...d,
      createdAt: new Date(d.createdAt),
      updatedAt: new Date(d.updatedAt)
    }))
  }

  static getDashboard(dashboardId: string): Dashboard | null {
    const dashboards = this.getAllDashboards()
    return dashboards.find(d => d.id === dashboardId) || null
  }

  static getCurrentDashboard(): Dashboard {
    const currentId = localStorage.getItem(this.currentDashboardKey)
    if (currentId) {
      const dashboard = this.getDashboard(currentId)
      if (dashboard) return dashboard
    }
    const dashboards = this.getAllDashboards()
    return dashboards[0] || this.createDefaultDashboard()
  }

  static setCurrentDashboard(dashboardId: string): void {
    localStorage.setItem(this.currentDashboardKey, dashboardId)
  }

  static createDashboard(name: string): Dashboard {
    const dashboards = this.getAllDashboards()
    const newDashboard: Dashboard = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      widgets: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    dashboards.push(newDashboard)
    this.saveDashboards(dashboards)
    return newDashboard
  }

  static updateDashboard(dashboardId: string, updates: Partial<Dashboard>): Dashboard {
    const dashboards = this.getAllDashboards()
    const index = dashboards.findIndex(d => d.id === dashboardId)
    if (index === -1) {
      throw new Error('Dashboard not found')
    }
    dashboards[index] = {
      ...dashboards[index],
      ...updates,
      updatedAt: new Date()
    }
    this.saveDashboards(dashboards)
    return dashboards[index]
  }

  static deleteDashboard(dashboardId: string): void {
    const dashboards = this.getAllDashboards().filter(d => d.id !== dashboardId)
    this.saveDashboards(dashboards)
    
    // If deleted dashboard was current, set first as current
    const currentId = localStorage.getItem(this.currentDashboardKey)
    if (currentId === dashboardId && dashboards.length > 0) {
      this.setCurrentDashboard(dashboards[0].id)
    }
  }

  static addWidget(dashboardId: string, widget: Omit<WidgetConfig, 'id'>): WidgetConfig {
    const dashboard = this.getDashboard(dashboardId)
    if (!dashboard) {
      throw new Error('Dashboard not found')
    }

    const newWidget: WidgetConfig = {
      ...widget,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    dashboard.widgets.push(newWidget)
    this.updateDashboard(dashboardId, { widgets: dashboard.widgets })
    return newWidget
  }

  static updateWidget(dashboardId: string, widgetId: string, updates: Partial<WidgetConfig>): WidgetConfig {
    const dashboard = this.getDashboard(dashboardId)
    if (!dashboard) {
      throw new Error('Dashboard not found')
    }

    const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId)
    if (widgetIndex === -1) {
      throw new Error('Widget not found')
    }

    dashboard.widgets[widgetIndex] = {
      ...dashboard.widgets[widgetIndex],
      ...updates
    }

    this.updateDashboard(dashboardId, { widgets: dashboard.widgets })
    return dashboard.widgets[widgetIndex]
  }

  static deleteWidget(dashboardId: string, widgetId: string): void {
    const dashboard = this.getDashboard(dashboardId)
    if (!dashboard) {
      throw new Error('Dashboard not found')
    }

    dashboard.widgets = dashboard.widgets.filter(w => w.id !== widgetId)
    this.updateDashboard(dashboardId, { widgets: dashboard.widgets })
  }

  static updateWidgetLayout(dashboardId: string, widgetId: string, x: number, y: number, width: number, height: number): void {
    this.updateWidget(dashboardId, widgetId, { x, y, width, height })
  }

  private static createDefaultDashboard(): Dashboard {
    return {
      id: 'default',
      name: 'Мой дашборд',
      widgets: [
        {
          id: 'widget-1',
          type: 'task-list',
          title: 'Задачи на сегодня',
          x: 0,
          y: 0,
          width: 4,
          height: 3,
          settings: { listId: null, showCompleted: false }
        },
        {
          id: 'widget-2',
          type: 'stats',
          title: 'Статистика',
          x: 4,
          y: 0,
          width: 2,
          height: 3,
          settings: {}
        },
        {
          id: 'widget-3',
          type: 'calendar',
          title: 'Календарь',
          x: 0,
          y: 3,
          width: 6,
          height: 3,
          settings: {}
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  private static saveDashboards(dashboards: Dashboard[]): void {
    localStorage.setItem(this.dashboardsKey, JSON.stringify(dashboards))
  }
}

