import { useState, useEffect } from 'react'
import { TaskManager } from '../services/TaskManager'
import { ProjectService, Project } from '../services/ProjectService'
import { RoleService, Role } from '../services/RoleService'
import { LocalAuthService } from '../services/LocalAuthService'
import { TaskList } from '../types/Task'
import { format } from 'date-fns'
import { toastService } from '../services/ToastService'
import './ProjectPanel.css'

interface ProjectPanelProps {
  taskManager: TaskManager
  onClose: () => void
}

export default function ProjectPanel({ taskManager, onClose }: ProjectPanelProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [newProjectColor, setNewProjectColor] = useState('#007AFF')
  const [newProjectIcon, setNewProjectIcon] = useState('📁')
  const [availableLists, setAvailableLists] = useState<TaskList[]>([])
  const currentUser = LocalAuthService.getCurrentUser()

  useEffect(() => {
    loadProjects()
    loadLists()
  }, [])

  const loadProjects = () => {
    if (currentUser) {
      const userProjects = ProjectService.getProjectsForUser(currentUser.id)
      setProjects(userProjects)
    }
  }

  const loadLists = () => {
    setAvailableLists(taskManager.getLists())
  }

  const handleCreateProject = () => {
    if (!newProjectName.trim() || !currentUser) {
      toastService.error('Введите название проекта')
      return
    }

    const project = ProjectService.createProject(
      newProjectName.trim(),
      newProjectDesc.trim() || undefined,
      currentUser.id,
      newProjectColor,
      newProjectIcon
    )

    toastService.success('Проект создан')
    setShowCreateProject(false)
    setNewProjectName('')
    setNewProjectDesc('')
    setNewProjectColor('#007AFF')
    setNewProjectIcon('📁')
    loadProjects()
  }

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Удалить проект? Все списки останутся, но будут удалены из проекта.')) {
      ProjectService.deleteProject(projectId)
      toastService.info('Проект удален')
      loadProjects()
      if (selectedProject?.id === projectId) {
        setSelectedProject(null)
      }
    }
  }

  const handleAddListToProject = (projectId: string, listId: string) => {
    ProjectService.addListToProject(projectId, listId)
    toastService.success('Список добавлен в проект')
    loadProjects()
    if (selectedProject) {
      const updated = ProjectService.getProject(selectedProject.id)
      if (updated) setSelectedProject(updated)
    }
  }

  const handleRemoveListFromProject = (projectId: string, listId: string) => {
    ProjectService.removeListFromProject(projectId, listId)
    toastService.info('Список удален из проекта')
    loadProjects()
    if (selectedProject) {
      const updated = ProjectService.getProject(selectedProject.id)
      if (updated) setSelectedProject(updated)
    }
  }

  const handleAddMember = (projectId: string, userId: string, role: Role) => {
    if (!currentUser) return
    ProjectService.addMember(projectId, userId, role, currentUser.id)
    toastService.success('Участник добавлен')
    loadProjects()
  }

  const handleRemoveMember = (projectId: string, userId: string) => {
    ProjectService.removeMember(projectId, userId)
    toastService.info('Участник удален')
    loadProjects()
  }

  const projectStats = selectedProject
    ? ProjectService.getProjectStatistics(selectedProject.id, taskManager.getTasks(), availableLists)
    : null

  const projectMembers = selectedProject
    ? RoleService.getProjectPermissions(selectedProject.id)
    : []

  return (
    <div className="project-overlay" onClick={onClose}>
      <div className="project-modal" onClick={(e) => e.stopPropagation()}>
        <div className="project-header">
          <h2>📁 Проекты</h2>
          <div className="header-actions">
            <button
              className="btn-primary"
              onClick={() => setShowCreateProject(!showCreateProject)}
            >
              {showCreateProject ? '✕ Отмена' : '+ Создать проект'}
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="project-content">
          {showCreateProject && (
            <div className="create-project-form">
              <div className="form-group">
                <label>Название проекта *</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="form-input"
                  placeholder="Например: Разработка приложения"
                />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="form-textarea"
                  rows={3}
                  placeholder="Описание проекта..."
                />
              </div>
              <div className="form-group">
                <label>Цвет</label>
                <input
                  type="color"
                  value={newProjectColor}
                  onChange={(e) => setNewProjectColor(e.target.value)}
                  className="form-color"
                />
              </div>
              <div className="form-group">
                <label>Иконка</label>
                <input
                  type="text"
                  value={newProjectIcon}
                  onChange={(e) => setNewProjectIcon(e.target.value)}
                  className="form-input"
                  placeholder="📁"
                />
              </div>
              <button onClick={handleCreateProject} className="btn-primary">
                Создать проект
              </button>
            </div>
          )}

          <div className="projects-grid">
            <div className="projects-list">
              <h3>Мои проекты ({projects.length})</h3>
              {projects.length === 0 ? (
                <p className="empty-state">Нет проектов. Создайте первый проект!</p>
              ) : (
                projects.map(project => (
                  <div
                    key={project.id}
                    className={`project-item ${selectedProject?.id === project.id ? 'selected' : ''}`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="project-item-header">
                      <span className="project-icon" style={{ color: project.color }}>
                        {project.icon}
                      </span>
                      <div className="project-item-info">
                        <h4>{project.name}</h4>
                        {project.description && (
                          <p className="project-desc">{project.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteProject(project.id)
                      }}
                      className="delete-project-btn"
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>

            {selectedProject && (
              <div className="project-details">
                <div className="project-details-header">
                  <h3>
                    <span style={{ color: selectedProject.color }}>
                      {selectedProject.icon}
                    </span>{' '}
                    {selectedProject.name}
                  </h3>
                </div>

                {selectedProject.description && (
                  <p className="project-description">{selectedProject.description}</p>
                )}

                <div className="project-stats">
                  <div className="stat-item">
                    <span className="stat-label">Всего задач:</span>
                    <span className="stat-value">{projectStats?.totalTasks || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Выполнено:</span>
                    <span className="stat-value">{projectStats?.completedTasks || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Списков:</span>
                    <span className="stat-value">{projectStats?.totalLists || 0}</span>
                  </div>
                </div>

                <div className="project-lists-section">
                  <h4>Списки в проекте</h4>
                  <div className="lists-list">
                    {selectedProject.lists.length === 0 ? (
                      <p className="empty-state">Нет списков в проекте</p>
                    ) : (
                      selectedProject.lists.map(listId => {
                        const list = availableLists.find(l => l.id === listId)
                        return list ? (
                          <div key={listId} className="list-item">
                            <span>{list.icon} {list.name}</span>
                            <button
                              onClick={() => handleRemoveListFromProject(selectedProject.id, listId)}
                              className="btn-danger-small"
                            >
                              Удалить
                            </button>
                          </div>
                        ) : null
                      })
                    )}
                  </div>
                  <div className="add-list-section">
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddListToProject(selectedProject.id, e.target.value)
                          e.target.value = ''
                        }
                      }}
                      className="form-select"
                    >
                      <option value="">Добавить список...</option>
                      {availableLists
                        .filter(list => !selectedProject.lists.includes(list.id))
                        .map(list => (
                          <option key={list.id} value={list.id}>
                            {list.icon} {list.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="project-members-section">
                  <h4>Участники</h4>
                  <div className="members-list">
                    {projectMembers.map(permission => {
                      const user = LocalAuthService.getUserById(permission.userId)
                      return user ? (
                        <div key={permission.userId} className="member-item">
                          <span>{user.name} ({permission.role})</span>
                          {selectedProject.ownerId === currentUser?.id && permission.userId !== selectedProject.ownerId && (
                            <button
                              onClick={() => handleRemoveMember(selectedProject.id, permission.userId)}
                              className="btn-danger-small"
                            >
                              Удалить
                            </button>
                          )}
                        </div>
                      ) : null
                    })}
                  </div>
                  {selectedProject.ownerId === currentUser?.id && (
                    <div className="add-member-section">
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            const [userId, role] = e.target.value.split('|')
                            handleAddMember(selectedProject.id, userId, role as Role)
                            e.target.value = ''
                          }
                        }}
                        className="form-select"
                      >
                        <option value="">Добавить участника...</option>
                        {LocalAuthService.getAllUsers()
                          .filter(u => !projectMembers.some(p => p.userId === u.id))
                          .map(user => (
                            <>
                              <option key={`${user.id}|editor`} value={`${user.id}|editor`}>
                                {user.name} (Редактор)
                              </option>
                              <option key={`${user.id}|viewer`} value={`${user.id}|viewer`}>
                                {user.name} (Просмотр)
                              </option>
                            </>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

