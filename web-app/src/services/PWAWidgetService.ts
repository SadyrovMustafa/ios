export class PWAWidgetService {
  static async registerWidget(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready
      
      // Для iOS 14.3+ и Android
      if ('updateViaCache' in registration) {
        // Widget API доступен
        return true
      }
    } catch (error) {
      console.error('Widget registration error:', error)
    }

    return false
  }

  static getWidgetData(): {
    totalTasks: number
    activeTasks: number
    completedToday: number
    overdueTasks: number
  } {
    // Получаем данные из localStorage
    const tasksData = localStorage.getItem('ticktick_tasks')
    if (!tasksData) {
      return {
        totalTasks: 0,
        activeTasks: 0,
        completedToday: 0,
        overdueTasks: 0
      }
    }

    const tasks = JSON.parse(tasksData)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const activeTasks = tasks.filter((t: any) => !t.isCompleted)
    const completedToday = tasks.filter((t: any) => {
      if (!t.completedAt) return false
      const completed = new Date(t.completedAt)
      completed.setHours(0, 0, 0, 0)
      return completed.getTime() === today.getTime()
    }).length

    const overdueTasks = tasks.filter((t: any) => {
      if (t.isCompleted || !t.dueDate) return false
      const due = new Date(t.dueDate)
      due.setHours(0, 0, 0, 0)
      return due < today
    }).length

    return {
      totalTasks: tasks.length,
      activeTasks: activeTasks.length,
      completedToday,
      overdueTasks
    }
  }

  static async updateWidget(): Promise<void> {
    // Обновляем данные виджета через Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        const widgetData = this.getWidgetData()
        
        // Отправляем данные в Service Worker
        registration.active?.postMessage({
          type: 'UPDATE_WIDGET',
          data: widgetData
        })
      } catch (error) {
        console.error('Widget update error:', error)
      }
    }
  }
}

