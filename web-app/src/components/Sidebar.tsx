import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { TaskList, Task } from '../types/Task'
import { TaskManager } from '../services/TaskManager'
import { ExportImportService } from '../services/ExportImportService'
import { LocalAuthService } from '../services/LocalAuthService'
import AddListModal from './AddListModal'
import ThemeToggle from './ThemeToggle'
import ExportImportModal from './ExportImportModal'
import AutomationRules from './AutomationRules'
import GamificationPanel from './GamificationPanel'
import AISuggestions from './AISuggestions'
import CloudSync from './CloudSync'
import CollaborationPanel from './CollaborationPanel'
import TemplatePanel from './TemplatePanel'
import PomodoroTimer from './PomodoroTimer'
import ProjectsPanel from './ProjectsPanel'
import ArchiveView from './ArchiveView'
import SprintView from './SprintView'
import SmartListsPanel from './SmartListsPanel'
import UserAccount from './UserAccount'
import AutoPlanningPanel from './AutoPlanningPanel'
import VoiceCommandPanel from './VoiceCommandPanel'
import ThemeSelector from './ThemeSelector'
import ListBackgroundSettings from './ListBackgroundSettings'
import FocusModeBlocker from './FocusModeBlocker'
import NotificationCenter from './NotificationCenter'
import OCRScanner from './OCRScanner'
import CloudFilePicker from './CloudFilePicker'
import { toastService } from '../services/ToastService'
import TeamActivityDashboard from './TeamActivityDashboard'
import ProjectPanel from './ProjectPanel'
import SprintPanel from './SprintPanel'
import RoleManagementPanel from './RoleManagementPanel'
import TeamReportExport from './TeamReportExport'
import CustomDashboard from './CustomDashboard'
import SocialPanel from './SocialPanel'
import { MilestonePanel } from './MilestonePanel'
import { CustomFieldPanel } from './CustomFieldPanel'
import { FormPanel } from './FormPanel'
import { PortfolioPanel } from './PortfolioPanel'
import { ApprovalPanel } from './ApprovalPanel'
import { WorkloadPanel } from './WorkloadPanel'
import { OKRPanel } from './OKRPanel'
import { ProofingPanel } from './ProofingPanel'
import { APIManagementPanel } from './APIManagementPanel'
import { ThemeService } from '../services/ThemeService'
import { NotificationService } from '../services/NotificationService'
import './Sidebar.css'

interface SidebarProps {
  lists: TaskList[]
  selectedListId: string | null
  onSelectList: (listId: string) => void
  onListsChange: () => void
  taskManager: TaskManager
}

export default function Sidebar({
  lists,
  selectedListId,
  onSelectList,
  onListsChange,
  taskManager
}: SidebarProps) {
  const location = useLocation()
  const [showAddList, setShowAddList] = useState(false)
  const [showExportImport, setShowExportImport] = useState(false)
  const [showAutomation, setShowAutomation] = useState(false)
  const [showGamification, setShowGamification] = useState(false)
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [showCloudSync, setShowCloudSync] = useState(false)
  const [showCollaboration, setShowCollaboration] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showPomodoro, setShowPomodoro] = useState(false)
  const [showProjects, setShowProjects] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const [showSprint, setShowSprint] = useState(false)
  const [showSmartLists, setShowSmartLists] = useState(false)
  const [showUserAccount, setShowUserAccount] = useState(false)
  const [showAutoPlanning, setShowAutoPlanning] = useState(false)
  const [showVoiceCommands, setShowVoiceCommands] = useState(false)
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const [showListBackground, setShowListBackground] = useState(false)
  const [selectedListForBackground, setSelectedListForBackground] = useState<TaskList | null>(null)
  const [showFocusModeBlocker, setShowFocusModeBlocker] = useState(false)
  const [showOCRScanner, setShowOCRScanner] = useState(false)
  const [showCloudFilePicker, setShowCloudFilePicker] = useState(false)
  const [showNotificationCenter, setShowNotificationCenter] = useState(false)
  const [showTeamActivity, setShowTeamActivity] = useState(false)
  const [showProjectPanel, setShowProjectPanel] = useState(false)
  const [showSprintPanel, setShowSprintPanel] = useState(false)
  const [showRoleManagement, setShowRoleManagement] = useState(false)
  const [showTeamReport, setShowTeamReport] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [showSocial, setShowSocial] = useState(false)
  const [showMilestone, setShowMilestone] = useState(false)
  const [showCustomFields, setShowCustomFields] = useState(false)
  const [showForms, setShowForms] = useState(false)
  const [showPortfolio, setShowPortfolio] = useState(false)
  const [showApproval, setShowApproval] = useState(false)
  const [showWorkload, setShowWorkload] = useState(false)
  const [showOKR, setShowOKR] = useState(false)
  const [showProofing, setShowProofing] = useState(false)
  const [showAPIManagement, setShowAPIManagement] = useState(false)
  const [selectedProjectForAsana, setSelectedProjectForAsana] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState(LocalAuthService.getCurrentUser())
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    // Check for user changes and notifications
    const interval = setInterval(() => {
      const user = LocalAuthService.getCurrentUser()
      if (user?.id !== currentUser?.id) {
        setCurrentUser(user)
      }
      if (user) {
        const count = NotificationService.getUnreadCount(user.id)
        setUnreadNotifications(count)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [currentUser])

  const getTaskCount = (listId: string) => {
    return taskManager.getTasksForList(listId).length
  }

  const getTodayCount = () => {
    return taskManager.getTasksForToday().length
  }

  const getAllTasksCount = () => {
    return taskManager.getTasks().length
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">TickTick</h1>
        <div className="header-buttons">
          <button
            className="notification-btn"
            onClick={() => setShowNotificationCenter(true)}
            title="Уведомления"
          >
            🔔
            {unreadNotifications > 0 && (
              <span className="notification-badge">{unreadNotifications}</span>
            )}
          </button>
          <button
            className="user-account-btn"
            onClick={() => setShowUserAccount(true)}
            title={currentUser ? currentUser.name : 'Войти в аккаунт'}
          >
            {currentUser ? '👤' : '🔓'}
          </button>
          <ThemeToggle />
          <button
            className="theme-selector-btn"
            onClick={() => setShowThemeSelector(true)}
            title="Выбрать тему"
          >
            🎨
          </button>
          <button
            className="add-list-btn"
            onClick={() => setShowAddList(true)}
            aria-label="Add list"
          >
            +
          </button>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <h2 className="nav-section-title">Quick Views</h2>
          <Link
            to="/today"
            className={`nav-item ${location.pathname === '/today' ? 'active' : ''}`}
          >
            <span className="nav-icon">☀️</span>
            <span className="nav-label">Today</span>
            <span className="nav-count">{getTodayCount()}</span>
          </Link>
          <Link
            to="/all"
            className={`nav-item ${location.pathname === '/all' ? 'active' : ''}`}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">All Tasks</span>
            <span className="nav-count">{getAllTasksCount()}</span>
          </Link>
          <Link
            to="/calendar"
            className={`nav-item ${location.pathname === '/calendar' ? 'active' : ''}`}
          >
            <span className="nav-icon">📅</span>
            <span className="nav-label">Calendar</span>
          </Link>
          <Link
            to="/analytics"
            className={`nav-item ${location.pathname === '/analytics' ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Analytics</span>
          </Link>
          <Link
            to="/kanban"
            className={`nav-item ${location.pathname === '/kanban' ? 'active' : ''}`}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">Kanban</span>
          </Link>
          <button
            className="nav-item nav-button"
            onClick={() => setShowAISuggestions(true)}
          >
            <span className="nav-icon">🤖</span>
            <span className="nav-label">AI Suggestions</span>
          </button>
          <button
            className="nav-item nav-button"
            onClick={() => setShowPomodoro(true)}
          >
            <span className="nav-icon">🍅</span>
            <span className="nav-label">Pomodoro</span>
          </button>
          <button
            className="nav-item nav-button"
            onClick={() => setShowAutoPlanning(true)}
          >
            <span className="nav-icon">🤖</span>
            <span className="nav-label">Автопланирование</span>
          </button>
          <button
            className="nav-item nav-button"
            onClick={() => setShowVoiceCommands(true)}
          >
            <span className="nav-icon">🗣️</span>
            <span className="nav-label">Голосовые команды</span>
          </button>
          <button
            className="nav-item nav-button"
            onClick={() => setShowSprint(true)}
          >
            <span className="nav-icon">🏃</span>
            <span className="nav-label">Sprints</span>
          </button>
          <button
            className="nav-item nav-button"
            onClick={() => setShowTeamActivity(true)}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Активность команды</span>
          </button>
          <button
            className="nav-item nav-button"
            onClick={() => setShowProjectPanel(true)}
          >
            <span className="nav-icon">📁</span>
            <span className="nav-label">Проекты</span>
          </button>
          <button
            className="nav-item nav-button"
            onClick={() => setShowSprintPanel(true)}
          >
            <span className="nav-icon">🏃</span>
            <span className="nav-label">Спринты</span>
          </button>
          <button
            className="nav-item nav-button"
            onClick={() => setShowRoleManagement(true)}
          >
            <span className="nav-icon">🔐</span>
            <span className="nav-label">Роли и права</span>
          </button>
          <button
            className="nav-item nav-button"
            onClick={() => setShowTeamReport(true)}
          >
            <span className="nav-icon">📥</span>
            <span className="nav-label">Экспорт отчетов</span>
          </button>
          <button
            className="nav-item nav-button"
            onClick={() => {
              const projectId = prompt('ID проекта:')
              if (projectId) {
                setSelectedProjectForAsana(projectId)
                setShowMilestone(true)
              }
            }}
          >
            <span className="nav-icon">🎯</span>
            <span className="nav-label">Милистоуны</span>
          </button>
          <button
            className="nav-item nav-button"
            onClick={() => setShowCustomFields(true)}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">Кастомные поля</span>
          </button>
          <button
            className="nav-item nav-button"
            onClick={() => {
              const projectId = prompt('ID проекта:')
              if (projectId) {
                setSelectedProjectForAsana(projectId)
                setShowForms(true)
              }
            }}
          >
            <span className="nav-icon">📝</span>
            <span className="nav-label">Формы</span>
          </button>
          <button
            className="nav-item nav-button"
            onClick={() => setShowPortfolio(true)}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Портфолио</span>
          </button>
          <button
            className="nav-item nav-button"
            onClick={() => setShowApproval(true)}
          >
            <span className="nav-icon">✅</span>
            <span className="nav-label">Утверждения</span>
          </button>
          <button
            className="nav-item nav-button"
            onClick={() => setShowWorkload(true)}
          >
            <span className="nav-icon">⚖️</span>
            <span className="nav-label">Нагрузка</span>
          </button>
          <button
            className="nav-item nav-button"
            onClick={() => {
              const projectId = prompt('ID проекта (опционально):')
              setSelectedProjectForAsana(projectId || null)
              setShowOKR(true)
            }}
          >
            <span className="nav-icon">🎯</span>
            <span className="nav-label">OKR</span>
          </button>
          <button
            className="nav-item nav-button"
            onClick={() => setShowAPIManagement(true)}
          >
            <span className="nav-icon">🔌</span>
            <span className="nav-label">API Management</span>
          </button>
        </div>

        <div className="nav-section">
          <h2 className="nav-section-title">Lists</h2>
          {lists.map(list => (
            <Link
              key={list.id}
              to={`/list/${list.id}`}
              className={`nav-item ${selectedListId === list.id ? 'active' : ''}`}
              onClick={() => onSelectList(list.id)}
            >
              <span className="nav-icon" style={{ color: list.color }}>
                {list.icon}
              </span>
              <span className="nav-label">{list.name}</span>
              <span className="nav-count">{getTaskCount(list.id)}</span>
              <button
                className="list-background-btn"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSelectedListForBackground(list)
                  setShowListBackground(true)
                }}
                title="Настройки фона"
              >
                🖼️
              </button>
            </Link>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <button
          className="sidebar-footer-btn"
          onClick={() => setShowProjects(true)}
          title="Projects & Folders"
        >
          📁 Projects
        </button>
        <button
          className="sidebar-footer-btn"
          onClick={() => setShowArchive(true)}
          title="Archive"
        >
          📦 Archive
        </button>
        <button
          className="sidebar-footer-btn"
          onClick={() => setShowGamification(true)}
          title="Gamification"
        >
          🎮 Gamification
        </button>
        <button
          className="sidebar-footer-btn"
          onClick={() => setShowAutomation(true)}
          title="Automation Rules"
        >
          ⚙️ Automation
        </button>
        <button
          className="sidebar-footer-btn"
          onClick={() => setShowExportImport(true)}
          title="Export / Import"
        >
          📤 Export/Import
        </button>
        <button
          className="sidebar-footer-btn"
          onClick={() => {
            const dailyGoalsPanel = document.querySelector('.daily-goals-panel')
            if (dailyGoalsPanel) {
              (dailyGoalsPanel as HTMLElement).style.display = 'block'
            }
          }}
          title="Daily Goals"
        >
          🎯 Goals
        </button>
        <button
          className="sidebar-footer-btn"
          onClick={() => {
            const habitsPanel = document.querySelector('.habits-panel')
            if (habitsPanel) {
              (habitsPanel as HTMLElement).style.display = 'block'
            }
          }}
          title="Habits"
        >
          🔄 Habits
        </button>
        <button
          className="sidebar-footer-btn"
          onClick={() => setShowFocusModeBlocker(true)}
          title="Блокировка сайтов"
        >
          🚫 Блокировка
        </button>
        <button
          className="sidebar-footer-btn"
          onClick={() => setShowOCRScanner(true)}
          title="OCR Сканирование"
        >
          📷 OCR
        </button>
        <button
          className="sidebar-footer-btn"
          onClick={() => setShowCloudFilePicker(true)}
          title="Облачные хранилища"
        >
          ☁️ Облако
        </button>
      </div>

      {showAddList && (
        <AddListModal
          onClose={() => setShowAddList(false)}
          onAdd={(list) => {
            taskManager.addList(list)
            onListsChange()
            setShowAddList(false)
          }}
        />
      )}

      {showGamification && (
        <GamificationPanel
          taskManager={taskManager}
          onClose={() => setShowGamification(false)}
        />
      )}

      {showAISuggestions && (
        <AISuggestions
          taskManager={taskManager}
          onClose={() => setShowAISuggestions(false)}
        />
      )}

      {showCloudSync && (
        <CloudSync
          taskManager={taskManager}
          onClose={() => setShowCloudSync(false)}
        />
      )}

      {showCollaboration && (
        <CollaborationPanel
          taskManager={taskManager}
          onClose={() => setShowCollaboration(false)}
        />
      )}

      {showPomodoro && (
        <PomodoroTimer
          onClose={() => setShowPomodoro(false)}
        />
      )}

      {showProjects && (
        <ProjectsPanel
          taskManager={taskManager}
          onClose={() => setShowProjects(false)}
        />
      )}

      {showArchive && (
        <ArchiveView
          taskManager={taskManager}
          onClose={() => setShowArchive(false)}
        />
      )}

      {showSprint && (
        <SprintView
          taskManager={taskManager}
          onClose={() => setShowSprint(false)}
        />
      )}

      {showSmartLists && (
        <SmartListsPanel
          taskManager={taskManager}
          onClose={() => setShowSmartLists(false)}
        />
      )}

      {showUserAccount && (
        <UserAccount
          onClose={() => {
            setShowUserAccount(false)
            setCurrentUser(LocalAuthService.getCurrentUser())
          }}
        />
      )}

      {showTemplates && (
        <TemplatePanel
          taskManager={taskManager}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {showAutomation && (
        <AutomationRules
          taskManager={taskManager}
          onClose={() => setShowAutomation(false)}
        />
      )}

          {showExportImport && (
            <ExportImportModal
              onClose={() => setShowExportImport(false)}
              tasks={taskManager.getTasks()}
              lists={lists}
              onImport={(importedTasks: Task[], importedLists: TaskList[]) => {
                // Clear existing data
                const allTasks = taskManager.getTasks()
                const allLists = taskManager.getLists()
                
                // Delete all existing tasks and lists
                allTasks.forEach(task => taskManager.deleteTask(task.id))
                allLists.forEach(list => taskManager.deleteList(list.id))
                
                // Import new data
                importedLists.forEach(list => taskManager.addList(list))
                importedTasks.forEach(task => {
                  taskManager.addTask({
                    ...task,
                    listId: task.listId || importedLists[0]?.id || ''
                  })
                })
                
                onListsChange()
                setShowExportImport(false)
              }}
            />
          )}

          {showAutoPlanning && (
            <AutoPlanningPanel
              taskManager={taskManager}
              onClose={() => setShowAutoPlanning(false)}
            />
          )}

          {showVoiceCommands && (
            <VoiceCommandPanel
              onCommand={(command) => {
                // Обработка голосовых команд
                console.log('Voice command:', command)
                // Здесь можно добавить логику обработки команд
              }}
              onClose={() => setShowVoiceCommands(false)}
            />
          )}

          {showThemeSelector && (
            <ThemeSelector
              onClose={() => setShowThemeSelector(false)}
            />
          )}

          {showListBackground && selectedListForBackground && (
            <ListBackgroundSettings
              list={selectedListForBackground}
              onUpdate={(updatedList) => {
                const lists = taskManager.getLists()
                const index = lists.findIndex(l => l.id === updatedList.id)
                if (index !== -1) {
                  lists[index] = updatedList
                  // Сохраняем через TaskManager
                  taskManager.deleteList(updatedList.id)
                  taskManager.addList(updatedList)
                  onListsChange()
                }
                setShowListBackground(false)
                setSelectedListForBackground(null)
              }}
              onClose={() => {
                setShowListBackground(false)
                setSelectedListForBackground(null)
              }}
            />
          )}

          {showFocusModeBlocker && (
            <FocusModeBlocker
              onClose={() => setShowFocusModeBlocker(false)}
            />
          )}

          {showOCRScanner && (
            <OCRScanner
              taskManager={taskManager}
              onClose={() => setShowOCRScanner(false)}
              onTasksCreated={(count) => {
                onListsChange()
                toastService.success(`Создано ${count} задач из OCR`)
              }}
            />
          )}

          {showCloudFilePicker && (
            <CloudFilePicker
              taskId=""
              onClose={() => setShowCloudFilePicker(false)}
            />
          )}

      {showNotificationCenter && (
        <NotificationCenter onClose={() => setShowNotificationCenter(false)} />
      )}

      {showTeamActivity && (
        <TeamActivityDashboard
          taskManager={taskManager}
          onClose={() => setShowTeamActivity(false)}
        />
      )}

      {showProjectPanel && (
        <ProjectPanel
          taskManager={taskManager}
          onClose={() => setShowProjectPanel(false)}
        />
      )}

      {showSprintPanel && (
        <SprintPanel
          taskManager={taskManager}
          onClose={() => setShowSprintPanel(false)}
        />
      )}

      {showRoleManagement && (
        <RoleManagementPanel
          taskManager={taskManager}
          onClose={() => setShowRoleManagement(false)}
        />
      )}

      {showTeamReport && (
        <TeamReportExport
          taskManager={taskManager}
          onClose={() => setShowTeamReport(false)}
        />
      )}

      {showDashboard && (
        <div className="modal-overlay" onClick={() => setShowDashboard(false)}>
          <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎨 Кастомный дашборд</h2>
              <button className="close-btn" onClick={() => setShowDashboard(false)}>×</button>
            </div>
            <CustomDashboard taskManager={taskManager} />
          </div>
        </div>
      )}

      {showSocial && (
        <div className="modal-overlay" onClick={() => setShowSocial(false)}>
          <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🌐 Социальная продуктивность</h2>
              <button className="close-btn" onClick={() => setShowSocial(false)}>×</button>
            </div>
            <SocialPanel />
          </div>
        </div>
      )}

      {showMilestone && selectedProjectForAsana && (
        <MilestonePanel
          projectId={selectedProjectForAsana}
          onClose={() => {
            setShowMilestone(false)
            setSelectedProjectForAsana(null)
          }}
        />
      )}

      {showCustomFields && (
        <CustomFieldPanel
          onClose={() => setShowCustomFields(false)}
        />
      )}

      {showForms && selectedProjectForAsana && (
        <FormPanel
          projectId={selectedProjectForAsana}
          onClose={() => {
            setShowForms(false)
            setSelectedProjectForAsana(null)
          }}
        />
      )}

      {showPortfolio && (
        <PortfolioPanel
          onClose={() => setShowPortfolio(false)}
        />
      )}

      {showApproval && (
        <ApprovalPanel
          onClose={() => setShowApproval(false)}
        />
      )}

      {showWorkload && (
        <WorkloadPanel
          onClose={() => setShowWorkload(false)}
        />
      )}

      {showOKR && (
        <OKRPanel
          projectId={selectedProjectForAsana || undefined}
          onClose={() => {
            setShowOKR(false)
            setSelectedProjectForAsana(null)
          }}
        />
      )}

      {showAPIManagement && (
        <APIManagementPanel
          onClose={() => setShowAPIManagement(false)}
        />
      )}
    </aside>
  )
}

