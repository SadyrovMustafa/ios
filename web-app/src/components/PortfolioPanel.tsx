import React, { useState, useEffect } from 'react'
import { PortfolioService, Portfolio } from '../services/PortfolioService'
import { ProjectService, Project } from '../services/ProjectService'
import { TaskManager } from '../services/TaskManager'
import { LocalAuthService } from '../services/LocalAuthService'
import './PortfolioPanel.css'

interface PortfolioPanelProps {
  onClose: () => void
}

export const PortfolioPanel: React.FC<PortfolioPanelProps> = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const currentUser = LocalAuthService.getCurrentUser()

  useEffect(() => {
    if (currentUser) {
      setPortfolios(PortfolioService.getPortfoliosForUser(currentUser.id))
      setProjects(ProjectService.getProjectsForUser(currentUser.id))
    }
  }, [currentUser])

  const handleCreatePortfolio = (name: string, description?: string) => {
    if (!currentUser) return
    PortfolioService.createPortfolio(name, currentUser.id, description)
    if (currentUser) {
      setPortfolios(PortfolioService.getPortfoliosForUser(currentUser.id))
    }
  }

  const handleAddProject = (portfolioId: string, projectId: string) => {
    PortfolioService.addProjectToPortfolio(portfolioId, projectId)
    if (currentUser) {
      setPortfolios(PortfolioService.getPortfoliosForUser(currentUser.id))
    }
  }

  const getStatistics = (portfolio: Portfolio) => {
    const allTasks = TaskManager.getTasks()
    return PortfolioService.getPortfolioStatistics(portfolio.id, projects, allTasks)
  }

  return (
    <div className="portfolio-panel">
      <div className="panel-header">
        <h2>📊 Портфолио</h2>
      </div>
      <div className="panel-content">
        <button className="btn-primary" onClick={() => {
          const name = prompt('Название портфолио:')
          if (name) handleCreatePortfolio(name)
        }}>+ Создать портфолио</button>
        <div className="portfolios-list">
          {portfolios.map(portfolio => {
            const stats = getStatistics(portfolio)
            return (
              <div key={portfolio.id} className="portfolio-card">
                <h3>{portfolio.name}</h3>
                <div className="portfolio-stats">
                  <span>Проектов: {stats.totalProjects}</span>
                  <span>Задач: {stats.totalTasks}</span>
                  <span>Выполнено: {stats.completedTasks}</span>
                  <span>Прогресс: {stats.completionRate.toFixed(0)}%</span>
                </div>
                <select onChange={(e) => {
                  if (e.target.value) {
                    handleAddProject(portfolio.id, e.target.value)
                    e.target.value = ''
                  }
                }}>
                  <option value="">+ Добавить проект</option>
                  {projects
                    .filter(p => !portfolio.projectIds.includes(p.id))
                    .map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                </select>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

