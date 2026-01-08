import { useState, useEffect } from 'react'
import { TaskManager } from '../services/TaskManager'
import { TeamActivityService, TeamStatistics } from '../services/TeamActivityService'
import { LocalAuthService } from '../services/LocalAuthService'
import { format } from 'date-fns'
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
import './TeamActivityDashboard.css'

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

interface TeamActivityDashboardProps {
  taskManager: TaskManager
  onClose: () => void
}

export default function TeamActivityDashboard({ taskManager, onClose }: TeamActivityDashboardProps) {
  const [statistics, setStatistics] = useState<TeamStatistics | null>(null)
  const [activityData, setActivityData] = useState<Array<{ date: string; count: number }>>([])

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = () => {
    const tasks = taskManager.getTasks()
    const stats = TeamActivityService.getStatistics(tasks)
    setStatistics(stats)

    const chartData = TeamActivityService.getActivityChartData(30)
    setActivityData(chartData)
  }

  if (!statistics) {
    return (
      <div className="team-activity-overlay" onClick={onClose}>
        <div className="team-activity-modal" onClick={(e) => e.stopPropagation()}>
          <div className="loading">Загрузка...</div>
        </div>
      </div>
    )
  }

  const users = LocalAuthService.getAllUsers()

  // Chart data for activity over time
  const activityChartData = {
    labels: activityData.map(d => format(new Date(d.date), 'dd.MM')),
    datasets: [
      {
        label: 'Активность',
        data: activityData.map(d => d.count),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }
    ]
  }

  // Chart data for tasks by user
  const tasksByUserData = {
    labels: users.map(u => u.name),
    datasets: [
      {
        label: 'Создано',
        data: users.map(u => statistics.tasksByUser[u.id]?.created || 0),
        backgroundColor: 'rgba(54, 162, 235, 0.5)'
      },
      {
        label: 'Выполнено',
        data: users.map(u => statistics.tasksByUser[u.id]?.completed || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.5)'
      }
    ]
  }

  // Chart data for completion rate
  const completionRate = statistics.totalTasks > 0
    ? (statistics.completedTasks / statistics.totalTasks) * 100
    : 0

  const completionData = {
    labels: ['Выполнено', 'Не выполнено'],
    datasets: [
      {
        data: [statistics.completedTasks, statistics.totalTasks - statistics.completedTasks],
        backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)']
      }
    ]
  }

  return (
    <div className="team-activity-overlay" onClick={onClose}>
      <div className="team-activity-modal" onClick={(e) => e.stopPropagation()}>
        <div className="team-activity-header">
          <h2>📊 Активность команды</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="team-activity-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{statistics.totalTasks}</div>
              <div className="stat-label">Всего задач</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{statistics.completedTasks}</div>
              <div className="stat-label">Выполнено</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{statistics.activeUsers}</div>
              <div className="stat-label">Активных пользователей</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{completionRate.toFixed(1)}%</div>
              <div className="stat-label">Процент выполнения</div>
            </div>
          </div>

          <div className="charts-section">
            <div className="chart-container">
              <h3>Активность за последние 30 дней</h3>
              <Line data={activityChartData} options={{ responsive: true }} />
            </div>

            <div className="chart-container">
              <h3>Задачи по пользователям</h3>
              <Bar data={tasksByUserData} options={{ responsive: true }} />
            </div>

            <div className="chart-container">
              <h3>Процент выполнения</h3>
              <Doughnut data={completionData} options={{ responsive: true }} />
            </div>
          </div>

          <div className="top-performers-section">
            <h3>Топ исполнителей</h3>
            <div className="performers-list">
              {statistics.topPerformers.length === 0 ? (
                <p className="empty-state">Нет данных</p>
              ) : (
                statistics.topPerformers.map((performer, index) => (
                  <div key={performer.userId} className="performer-item">
                    <div className="performer-rank">#{index + 1}</div>
                    <div className="performer-info">
                      <div className="performer-name">{performer.userName}</div>
                      <div className="performer-stats">
                        Выполнено задач: {performer.completed}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="users-stats-section">
            <h3>Статистика по пользователям</h3>
            <div className="users-stats-list">
              {users.map(user => {
                const userStats = statistics.tasksByUser[user.id] || { created: 0, completed: 0, assigned: 0 }
                return (
                  <div key={user.id} className="user-stats-item">
                    <div className="user-stats-name">{user.name}</div>
                    <div className="user-stats-details">
                      <span>Создано: {userStats.created}</span>
                      <span>Выполнено: {userStats.completed}</span>
                      <span>Назначено: {userStats.assigned}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

