import { useState, useEffect } from 'react'
import { ProjectService, Project, Folder } from '../services/ProjectService'
import { TaskList } from '../types/Task'
import { TaskManager } from '../services/TaskManager'
import './ProjectsPanel.css'

interface ProjectsPanelProps {
  taskManager: TaskManager
  onClose: () => void
}

export default function ProjectsPanel({ taskManager, onClose }: ProjectsPanelProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [activeTab, setActiveTab] = useState<'projects' | 'folders'>('projects')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [selectedLists, setSelectedLists] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setProjects(ProjectService.getProjects())
    setFolders(ProjectService.getFolders())
  }

  const lists = taskManager.getLists()

  const handleCreateProject = () => {
    if (!newName.trim()) return
    ProjectService.addProject({
      name: newName,
      description: newDescription,
      color: '#007AFF',
      icon: '📁',
      listIds: selectedLists
    })
    setNewName('')
    setNewDescription('')
    setSelectedLists([])
    setShowCreate(false)
    loadData()
  }

  const handleCreateFolder = () => {
    if (!newName.trim()) return
    ProjectService.addFolder({
      name: newName,
      color: '#007AFF',
      icon: '📂',
      listIds: selectedLists
    })
    setNewName('')
    setSelectedLists([])
    setShowCreate(false)
    loadData()
  }

  const handleDelete = (id: string, type: 'project' | 'folder') => {
    if (confirm(`Delete this ${type}?`)) {
      if (type === 'project') {
        ProjectService.deleteProject(id)
      } else {
        ProjectService.deleteFolder(id)
      }
      loadData()
    }
  }

  return (
    <div className="projects-overlay" onClick={onClose}>
      <div className="projects-modal" onClick={(e) => e.stopPropagation()}>
        <div className="projects-header">
          <h2>📁 Projects & Folders</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="projects-tabs">
          <button
            className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            Projects
          </button>
          <button
            className={`tab-btn ${activeTab === 'folders' ? 'active' : ''}`}
            onClick={() => setActiveTab('folders')}
          >
            Folders
          </button>
        </div>

        <div className="projects-content">
          <button
            className="create-btn"
            onClick={() => setShowCreate(!showCreate)}
          >
            + Create {activeTab === 'projects' ? 'Project' : 'Folder'}
          </button>

          {showCreate && (
            <div className="create-form">
              <input
                type="text"
                placeholder="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="form-input"
              />
              {activeTab === 'projects' && (
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="form-input"
                />
              )}
              <div className="lists-selection">
                <label>Select Lists:</label>
                {lists.map(list => (
                  <label key={list.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedLists.includes(list.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLists([...selectedLists, list.id])
                        } else {
                          setSelectedLists(selectedLists.filter(id => id !== list.id))
                        }
                      }}
                    />
                    {list.icon} {list.name}
                  </label>
                ))}
              </div>
              <button
                onClick={activeTab === 'projects' ? handleCreateProject : handleCreateFolder}
                className="save-btn"
              >
                Create
              </button>
            </div>
          )}

          <div className="items-list">
            {activeTab === 'projects' ? (
              projects.length === 0 ? (
                <p className="empty-state">No projects yet</p>
              ) : (
                projects.map(project => (
                  <div key={project.id} className="item-card">
                    <div className="item-header">
                      <span className="item-icon">{project.icon}</span>
                      <div className="item-info">
                        <h3>{project.name}</h3>
                        {project.description && <p>{project.description}</p>}
                        <span className="item-count">
                          {project.listIds.length} list(s)
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(project.id, 'project')}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )
            ) : (
              folders.length === 0 ? (
                <p className="empty-state">No folders yet</p>
              ) : (
                folders.map(folder => (
                  <div key={folder.id} className="item-card">
                    <div className="item-header">
                      <span className="item-icon">{folder.icon}</span>
                      <div className="item-info">
                        <h3>{folder.name}</h3>
                        <span className="item-count">
                          {folder.listIds.length} list(s)
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(folder.id, 'folder')}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

