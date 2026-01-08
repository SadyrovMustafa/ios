import { useState, useEffect } from 'react'
import { TemplateService, TaskTemplate } from '../services/TemplateService'
import { TaskManager } from '../services/TaskManager'
import './TemplatesPanel.css'

interface TemplatesPanelProps {
  taskManager: TaskManager
  onClose: () => void
  onSelectTemplate?: (template: TaskTemplate) => void
}

export default function TemplatesPanel({ taskManager, onClose, onSelectTemplate }: TemplatesPanelProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDesc, setTemplateDesc] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState('')

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = () => {
    setTemplates(TemplateService.getTemplates())
  }

  const handleCreateTemplate = () => {
    if (!templateName.trim() || !selectedTaskId) return

    const task = taskManager.getTasks().find(t => t.id === selectedTaskId)
    if (!task) return

    const templateTask = { ...task }
    delete (templateTask as any).id
    delete (templateTask as any).createdAt
    delete (templateTask as any).completedAt

    TemplateService.addTemplate({
      name: templateName,
      description: templateDesc,
      task: templateTask
    })

    setTemplateName('')
    setTemplateDesc('')
    setSelectedTaskId('')
    setShowCreate(false)
    loadTemplates()
  }

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Delete this template?')) {
      TemplateService.deleteTemplate(templateId)
      loadTemplates()
    }
  }

  const handleUseTemplate = (template: TaskTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template)
      onClose()
    }
  }

  return (
    <div className="templates-overlay" onClick={onClose}>
      <div className="templates-modal" onClick={(e) => e.stopPropagation()}>
        <div className="templates-header">
          <h2>📋 Task Templates</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="templates-content">
          <button
            className="create-template-btn"
            onClick={() => setShowCreate(!showCreate)}
          >
            + Create Template from Task
          </button>

          {showCreate && (
            <div className="create-template-form">
              <input
                type="text"
                placeholder="Template name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="template-input"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                className="template-input"
              />
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="template-select"
              >
                <option value="">Select a task...</option>
                {taskManager.getTasks().map(task => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
              <button
                onClick={handleCreateTemplate}
                disabled={!templateName.trim() || !selectedTaskId}
                className="save-template-btn"
              >
                Create Template
              </button>
            </div>
          )}

          <div className="templates-list">
            {templates.length === 0 ? (
              <p className="no-templates">No templates yet. Create one from an existing task!</p>
            ) : (
              templates.map(template => (
                <div key={template.id} className="template-item">
                  <div className="template-info">
                    <h3>{template.name}</h3>
                    {template.description && (
                      <p className="template-desc">{template.description}</p>
                    )}
                    <div className="template-preview">
                      <strong>Task:</strong> {template.task.title}
                      {template.task.priority !== 'none' && (
                        <span className="template-priority"> • {template.task.priority}</span>
                      )}
                    </div>
                  </div>
                  <div className="template-actions">
                    {onSelectTemplate && (
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="use-template-btn"
                      >
                        Use
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="delete-template-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

