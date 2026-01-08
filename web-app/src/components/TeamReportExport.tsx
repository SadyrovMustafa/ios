import { useState } from 'react'
import { TaskManager } from '../services/TaskManager'
import { TaskAssignmentService } from '../services/TaskAssignmentService'
import { TeamActivityService } from '../services/TeamActivityService'
import { LocalAuthService } from '../services/LocalAuthService'
import { ExportImportService } from '../services/ExportImportService'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import { format } from 'date-fns'
import { toastService } from '../services/ToastService'
import './TeamReportExport.css'

interface TeamReportExportProps {
  taskManager: TaskManager
  onClose: () => void
}

export default function TeamReportExport({ taskManager, onClose }: TeamReportExportProps) {
  const [reportType, setReportType] = useState<'pdf' | 'excel'>('pdf')
  const [reportScope, setReportScope] = useState<'all' | 'assigned' | 'by-user'>('all')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('month')

  const users = LocalAuthService.getAllUsers()

  const generateReport = () => {
    try {
      const tasks = taskManager.getTasks()
      const lists = taskManager.getLists()
      const assignments = TaskAssignmentService.getAllAssignments()
      const statistics = TeamActivityService.getStatistics(tasks)

      if (reportType === 'pdf') {
        exportToPDF(tasks, lists, assignments, statistics)
      } else {
        exportToExcel(tasks, lists, assignments, statistics)
      }

      toastService.success('Отчет экспортирован')
    } catch (error) {
      console.error('Error generating report:', error)
      toastService.error('Ошибка при создании отчета')
    }
  }

  const exportToPDF = (
    tasks: any[],
    lists: any[],
    assignments: any[],
    statistics: any
  ) => {
    const doc = new jsPDF()
    let yPos = 20

    // Header
    doc.setFontSize(20)
    doc.text('Отчет команды TickTick', 105, yPos, { align: 'center' })
    yPos += 10

    doc.setFontSize(12)
    doc.text(`Дата создания: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 105, yPos, { align: 'center' })
    yPos += 15

    // Statistics
    doc.setFontSize(16)
    doc.text('Статистика', 10, yPos)
    yPos += 10

    doc.setFontSize(12)
    doc.text(`Всего задач: ${statistics.totalTasks}`, 10, yPos)
    yPos += 7
    doc.text(`Выполнено: ${statistics.completedTasks}`, 10, yPos)
    yPos += 7
    doc.text(`Активных пользователей: ${statistics.activeUsers}`, 10, yPos)
    yPos += 10

    // Tasks by user
    doc.setFontSize(16)
    doc.text('Задачи по пользователям', 10, yPos)
    yPos += 10

    doc.setFontSize(10)
    Object.entries(statistics.tasksByUser).forEach(([userId, stats]: [string, any]) => {
      const user = LocalAuthService.getUserById(userId)
      if (user && yPos > 280) {
        doc.addPage()
        yPos = 20
      }
      doc.text(`${user.name}:`, 10, yPos)
      yPos += 6
      doc.text(`  Создано: ${stats.created}`, 15, yPos)
      yPos += 6
      doc.text(`  Выполнено: ${stats.completed}`, 15, yPos)
      yPos += 6
      doc.text(`  Назначено: ${stats.assigned}`, 15, yPos)
      yPos += 8
    })

    // Top performers
    if (statistics.topPerformers.length > 0) {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
      doc.setFontSize(16)
      doc.text('Топ исполнителей', 10, yPos)
      yPos += 10

      doc.setFontSize(10)
      statistics.topPerformers.slice(0, 10).forEach((performer: any, index: number) => {
        if (yPos > 280) {
          doc.addPage()
          yPos = 20
        }
        doc.text(`${index + 1}. ${performer.userName} - ${performer.completed} задач`, 10, yPos)
        yPos += 7
      })
    }

    doc.save(`team-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
  }

  const exportToExcel = (
    tasks: any[],
    lists: any[],
    assignments: any[],
    statistics: any
  ) => {
    const workbook = XLSX.utils.book_new()

    // Tasks sheet
    const tasksData = tasks.map(task => {
      const assignment = TaskAssignmentService.getAssignment(task.id)
      const assignedUser = assignment ? LocalAuthService.getUserById(assignment.assignedTo) : null
      const list = lists.find(l => l.id === task.listId)

      return {
        'Название': task.title,
        'Список': list?.name || '',
        'Статус': task.isCompleted ? 'Выполнено' : 'Активно',
        'Приоритет': task.priority,
        'Срок': task.dueDate ? format(new Date(task.dueDate), 'dd.MM.yyyy') : '',
        'Исполнитель': assignedUser?.name || '',
        'Создано': format(new Date(task.createdAt), 'dd.MM.yyyy')
      }
    })

    const tasksSheet = XLSX.utils.json_to_sheet(tasksData)
    XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Задачи')

    // Statistics sheet
    const statsData = [
      ['Всего задач', statistics.totalTasks],
      ['Выполнено', statistics.completedTasks],
      ['Активных пользователей', statistics.activeUsers]
    ]

    const statsSheet = XLSX.utils.aoa_to_sheet(statsData)
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Статистика')

    // Users sheet
    const usersData = users.map(user => {
      const userStats = statistics.tasksByUser[user.id] || { created: 0, completed: 0, assigned: 0 }
      return {
        'Пользователь': user.name,
        'Email': user.email,
        'Создано задач': userStats.created,
        'Выполнено задач': userStats.completed,
        'Назначено задач': userStats.assigned
      }
    })

    const usersSheet = XLSX.utils.json_to_sheet(usersData)
    XLSX.utils.book_append_sheet(workbook, usersSheet, 'Пользователи')

    XLSX.writeFile(workbook, `team-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
  }

  return (
    <div className="team-report-overlay" onClick={onClose}>
      <div className="team-report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="team-report-header">
          <h2>📊 Экспорт отчета команды</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="team-report-content">
          <div className="report-options">
            <div className="form-group">
              <label>Тип отчета:</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    value="pdf"
                    checked={reportType === 'pdf'}
                    onChange={(e) => setReportType(e.target.value as 'pdf' | 'excel')}
                  />
                  PDF
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    value="excel"
                    checked={reportType === 'excel'}
                    onChange={(e) => setReportType(e.target.value as 'pdf' | 'excel')}
                  />
                  Excel
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Область отчета:</label>
              <select
                value={reportScope}
                onChange={(e) => setReportScope(e.target.value as 'all' | 'assigned' | 'by-user')}
                className="form-select"
              >
                <option value="all">Все задачи</option>
                <option value="assigned">Только назначенные</option>
                <option value="by-user">По пользователю</option>
              </select>
            </div>

            {reportScope === 'by-user' && (
              <div className="form-group">
                <label>Пользователь:</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="form-select"
                >
                  <option value="">Выберите пользователя...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Период:</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as 'week' | 'month' | 'all')}
                className="form-select"
              >
                <option value="week">Неделя</option>
                <option value="month">Месяц</option>
                <option value="all">Все время</option>
              </select>
            </div>
          </div>

          <div className="report-preview">
            <h3>Содержимое отчета:</h3>
            <ul>
              <li>Статистика команды</li>
              <li>Задачи по пользователям</li>
              <li>Топ исполнителей</li>
              <li>Детальная информация о задачах</li>
            </ul>
          </div>

          <button onClick={generateReport} className="btn-primary export-btn">
            📥 Экспортировать отчет
          </button>
        </div>
      </div>
    </div>
  )
}

