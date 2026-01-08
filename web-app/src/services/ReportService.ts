import { Task, TaskList } from '../types/Task'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export interface ReportData {
  title: string
  period: string
  totalTasks: number
  completedTasks: number
  activeTasks: number
  completionRate: number
  tasksByPriority: {
    high: number
    medium: number
    low: number
    none: number
  }
  tasksByList: Array<{
    listName: string
    count: number
  }>
  tasksByDate: Array<{
    date: string
    completed: number
    created: number
  }>
  topTags: Array<{
    tag: string
    count: number
  }>
}

export class ReportService {
  static generateReportData(
    tasks: Task[],
    lists: TaskList[],
    period: 'week' | 'month' | 'all' = 'all'
  ): ReportData {
    const now = new Date()
    let startDate: Date
    let endDate: Date = now
    let periodLabel: string

    if (period === 'week') {
      startDate = startOfWeek(now)
      endDate = endOfWeek(now)
      periodLabel = `Week of ${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
    } else if (period === 'month') {
      startDate = startOfMonth(now)
      endDate = endOfMonth(now)
      periodLabel = format(now, 'MMMM yyyy')
    } else {
      startDate = new Date(Math.min(...tasks.map(t => new Date(t.createdAt).getTime())))
      periodLabel = 'All Time'
    }

    const filteredTasks = tasks.filter(t => {
      const created = new Date(t.createdAt)
      return created >= startDate && created <= endDate
    })

    const completed = filteredTasks.filter(t => t.isCompleted)
    const active = filteredTasks.filter(t => !t.isCompleted)

    // Tasks by priority
    const tasksByPriority = {
      high: active.filter(t => t.priority === 'high').length,
      medium: active.filter(t => t.priority === 'medium').length,
      low: active.filter(t => t.priority === 'low').length,
      none: active.filter(t => t.priority === 'none').length
    }

    // Tasks by list
    const tasksByList = lists.map(list => ({
      listName: list.name,
      count: filteredTasks.filter(t => t.listId === list.id).length
    })).filter(item => item.count > 0)

    // Tasks by date
    const dateMap = new Map<string, { completed: number; created: number }>()
    filteredTasks.forEach(task => {
      const dateKey = format(new Date(task.createdAt), 'yyyy-MM-dd')
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { completed: 0, created: 0 })
      }
      const data = dateMap.get(dateKey)!
      data.created++
      if (task.isCompleted && task.completedAt) {
        const completedKey = format(new Date(task.completedAt), 'yyyy-MM-dd')
        if (!dateMap.has(completedKey)) {
          dateMap.set(completedKey, { completed: 0, created: 0 })
        }
        dateMap.get(completedKey)!.completed++
      }
    })

    const tasksByDate = Array.from(dateMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Top tags
    const tagCounts = new Map<string, number>()
    filteredTasks.forEach(task => {
      task.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    const topTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      title: 'TickTick Task Report',
      period: periodLabel,
      totalTasks: filteredTasks.length,
      completedTasks: completed.length,
      activeTasks: active.length,
      completionRate: filteredTasks.length > 0 
        ? (completed.length / filteredTasks.length) * 100 
        : 0,
      tasksByPriority,
      tasksByList,
      tasksByDate,
      topTags
    }
  }

  static async exportToPDF(reportData: ReportData): Promise<void> {
    // Simple PDF generation using browser print
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups to generate PDF')
      return
    }

    const html = this.generateReportHTML(reportData)
    printWindow.document.write(html)
    printWindow.document.close()
    
    // Wait for content to load
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  private static generateReportHTML(data: ReportData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${data.title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #333;
    }
    h1 { color: #007AFF; margin-bottom: 10px; }
    h2 { color: #5856D6; margin-top: 30px; margin-bottom: 15px; }
    .header { margin-bottom: 30px; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    .stat-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #007AFF;
    }
    .stat-label {
      color: #666;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #007AFF;
      color: white;
    }
    .progress-bar {
      width: 100%;
      height: 24px;
      background-color: #f0f0f0;
      border-radius: 12px;
      overflow: hidden;
      margin: 10px 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #007AFF, #34C759);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.title}</h1>
    <p><strong>Period:</strong> ${data.period}</p>
    <p><strong>Generated:</strong> ${format(new Date(), 'MMMM d, yyyy HH:mm')}</p>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${data.totalTasks}</div>
      <div class="stat-label">Total Tasks</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.completedTasks}</div>
      <div class="stat-label">Completed</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.activeTasks}</div>
      <div class="stat-label">Active</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.completionRate.toFixed(1)}%</div>
      <div class="stat-label">Completion Rate</div>
    </div>
  </div>

  <div class="progress-bar">
    <div class="progress-fill" style="width: ${data.completionRate}%">
      ${data.completionRate.toFixed(1)}%
    </div>
  </div>

  <h2>Tasks by Priority</h2>
  <table>
    <tr>
      <th>Priority</th>
      <th>Count</th>
    </tr>
    <tr><td>High</td><td>${data.tasksByPriority.high}</td></tr>
    <tr><td>Medium</td><td>${data.tasksByPriority.medium}</td></tr>
    <tr><td>Low</td><td>${data.tasksByPriority.low}</td></tr>
    <tr><td>None</td><td>${data.tasksByPriority.none}</td></tr>
  </table>

  <h2>Tasks by List</h2>
  <table>
    <tr>
      <th>List</th>
      <th>Tasks</th>
    </tr>
    ${data.tasksByList.map(item => `
      <tr>
        <td>${item.listName}</td>
        <td>${item.count}</td>
      </tr>
    `).join('')}
  </table>

  ${data.topTags.length > 0 ? `
    <h2>Top Tags</h2>
    <table>
      <tr>
        <th>Tag</th>
        <th>Usage</th>
      </tr>
      ${data.topTags.map(item => `
        <tr>
          <td>${item.tag}</td>
          <td>${item.count}</td>
        </tr>
      `).join('')}
    </table>
  ` : ''}

  <h2>Daily Activity</h2>
  <table>
    <tr>
      <th>Date</th>
      <th>Created</th>
      <th>Completed</th>
    </tr>
    ${data.tasksByDate.slice(-14).map(item => `
      <tr>
        <td>${format(new Date(item.date), 'MMM d, yyyy')}</td>
        <td>${item.created}</td>
        <td>${item.completed}</td>
      </tr>
    `).join('')}
  </table>
</body>
</html>
    `
  }
}

