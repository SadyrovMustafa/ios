import { useMemo, useRef } from 'react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Task } from '../types/Task'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { ChartExportService } from '../services/ChartExportService'
import { toastService } from '../services/ToastService'
import './ChartsView.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface ChartsViewProps {
  tasks: Task[]
}

export default function ChartsView({ tasks }: ChartsViewProps) {
  const handleExportChart = async (chartId: string, format: 'png' | 'pdf') => {
    try {
      if (format === 'png') {
        await ChartExportService.exportChartToImage(chartId, `chart-${Date.now()}.png`)
        toastService.success('График экспортирован как PNG')
      } else {
        await ChartExportService.exportChartToPDF(chartId, `chart-${Date.now()}.pdf`)
        toastService.success('График экспортирован как PDF')
      }
    } catch (error) {
      toastService.error('Ошибка при экспорте графика')
    }
  }
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const completionData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return date
    })

    return {
      labels: last30Days.map(d => format(d, 'MMM d')),
      datasets: [{
        label: 'Completed',
        data: last30Days.map(date => {
          return tasks.filter(t => {
            if (!t.completedAt) return false
            return isSameDay(new Date(t.completedAt), date)
          }).length
        }),
        borderColor: '#34C759',
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        tension: 0.4
      }, {
        label: 'Created',
        data: last30Days.map(date => {
          return tasks.filter(t => {
            return isSameDay(new Date(t.createdAt), date)
          }).length
        }),
        borderColor: '#007AFF',
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        tension: 0.4
      }]
    }
  }, [tasks])

  const priorityData = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.isCompleted)
    return {
      labels: ['High', 'Medium', 'Low', 'None'],
      datasets: [{
        data: [
          activeTasks.filter(t => t.priority === 'high').length,
          activeTasks.filter(t => t.priority === 'medium').length,
          activeTasks.filter(t => t.priority === 'low').length,
          activeTasks.filter(t => t.priority === 'none').length
        ],
        backgroundColor: [
          '#FF3B30',
          '#FF9500',
          '#007AFF',
          '#8E8E93'
        ]
      }]
    }
  }, [tasks])

  const weeklyData = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now)
    const weekEnd = endOfWeek(now)
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

    return {
      labels: weekDays.map(d => format(d, 'EEE')),
      datasets: [{
        label: 'Tasks Completed',
        data: weekDays.map(date => {
          return tasks.filter(t => {
            if (!t.completedAt) return false
            return isSameDay(new Date(t.completedAt), date)
          }).length
        }),
        backgroundColor: '#007AFF'
      }]
    }
  }, [tasks])

  return (
    <div className="charts-view">
      <div className="charts-header">
        <h2 className="charts-title">📊 Analytics Charts</h2>
        <div className="export-buttons">
          <button
            onClick={() => handleExportChart('activity-chart', 'png')}
            className="export-btn"
          >
            📥 PNG
          </button>
          <button
            onClick={() => handleExportChart('activity-chart', 'pdf')}
            className="export-btn"
          >
            📥 PDF
          </button>
        </div>
      </div>
      
      <div className="charts-grid">
        <div className="chart-card" id="activity-chart">
          <h3>Activity (30 days)</h3>
          <Line data={completionData} options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' as const },
              title: { display: false }
            }
          }} />
        </div>

        <div className="chart-card">
          <h3>Priority Distribution</h3>
          <Doughnut data={priorityData} options={{
            responsive: true,
            plugins: {
              legend: { position: 'bottom' as const }
            }
          }} />
        </div>

        <div className="chart-card">
          <h3>This Week</h3>
          <Bar data={weeklyData} options={{
            responsive: true,
            plugins: {
              legend: { display: false }
            }
          }} />
        </div>
      </div>
    </div>
  )
}

