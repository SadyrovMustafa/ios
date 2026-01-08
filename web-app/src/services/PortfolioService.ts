import { Project } from './ProjectService'
import { Task } from '../types/Task'

export interface Portfolio {
  id: string
  name: string
  description?: string
  projectIds: string[]
  color: string
  icon: string
  ownerId: string
  createdAt: Date
}

export class PortfolioService {
  private static portfoliosKey = 'ticktick_portfolios'

  static createPortfolio(
    name: string,
    ownerId: string,
    description?: string,
    color: string = '#007AFF',
    icon: string = '📊'
  ): Portfolio {
    const portfolios = this.getAllPortfolios()
    const newPortfolio: Portfolio = {
      id: `portfolio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      projectIds: [],
      color,
      icon,
      ownerId,
      createdAt: new Date()
    }

    portfolios.push(newPortfolio)
    this.savePortfolios(portfolios)

    return newPortfolio
  }

  static updatePortfolio(portfolioId: string, updates: Partial<Omit<Portfolio, 'id' | 'createdAt' | 'ownerId'>>): void {
    const portfolios = this.getAllPortfolios()
    const portfolio = portfolios.find(p => p.id === portfolioId)
    if (portfolio) {
      Object.assign(portfolio, updates)
      this.savePortfolios(portfolios)
    }
  }

  static deletePortfolio(portfolioId: string): void {
    const portfolios = this.getAllPortfolios().filter(p => p.id !== portfolioId)
    this.savePortfolios(portfolios)
  }

  static getPortfolio(portfolioId: string): Portfolio | undefined {
    return this.getAllPortfolios().find(p => p.id === portfolioId)
  }

  static getAllPortfolios(): Portfolio[] {
    const data = localStorage.getItem(this.portfoliosKey)
    if (!data) return []
    return JSON.parse(data).map((p: any) => ({
      ...p,
      createdAt: new Date(p.createdAt)
    }))
  }

  static getPortfoliosForUser(userId: string): Portfolio[] {
    return this.getAllPortfolios().filter(p => p.ownerId === userId)
  }

  static addProjectToPortfolio(portfolioId: string, projectId: string): void {
    const portfolios = this.getAllPortfolios()
    const portfolio = portfolios.find(p => p.id === portfolioId)
    if (portfolio && !portfolio.projectIds.includes(projectId)) {
      portfolio.projectIds.push(projectId)
      this.savePortfolios(portfolios)
    }
  }

  static removeProjectFromPortfolio(portfolioId: string, projectId: string): void {
    const portfolios = this.getAllPortfolios()
    const portfolio = portfolios.find(p => p.id === portfolioId)
    if (portfolio) {
      portfolio.projectIds = portfolio.projectIds.filter(id => id !== projectId)
      this.savePortfolios(portfolios)
    }
  }

  static getPortfolioStatistics(
    portfolioId: string,
    projects: Project[],
    tasks: Task[]
  ): {
    totalProjects: number
    totalTasks: number
    completedTasks: number
    completionRate: number
    projectsByStatus: Record<string, number>
  } {
    const portfolio = this.getPortfolio(portfolioId)
    if (!portfolio) {
      return {
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
        projectsByStatus: {}
      }
    }

    const portfolioProjects = projects.filter(p => portfolio.projectIds.includes(p.id))
    const projectListIds = portfolioProjects.flatMap(p => p.lists)
    const portfolioTasks = tasks.filter(t => projectListIds.includes(t.listId))

    const completedTasks = portfolioTasks.filter(t => t.isCompleted).length
    const completionRate = portfolioTasks.length > 0 
      ? (completedTasks / portfolioTasks.length) * 100 
      : 0

    return {
      totalProjects: portfolioProjects.length,
      totalTasks: portfolioTasks.length,
      completedTasks,
      completionRate,
      projectsByStatus: {
        active: portfolioProjects.length,
        completed: 0 // Can be enhanced with project status
      }
    }
  }

  private static savePortfolios(portfolios: Portfolio[]): void {
    localStorage.setItem(this.portfoliosKey, JSON.stringify(portfolios))
  }
}

