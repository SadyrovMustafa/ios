import { useState, useEffect } from 'react'
import { TemplateService, TaskTemplate, TemplateVariable } from '../services/TemplateService'
import { TaskManager } from '../services/TaskManager'
import { toastService } from '../services/ToastService'
import { format } from 'date-fns'
import './TemplatePanel.css'

interface TemplatePanelProps {
  taskManager: TaskManager
  onClose: () => void
  onTaskCreated?: () => void
}

export default function TemplatePanel({ taskManager, onClose, onTaskCreated }: TemplatePanelProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null)
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    title: '',
    notes: '',
    priority: 'none' as const
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    if (selectedTemplate) {
      // Initialize variable values with defaults
      const values: Record<string, string> = {}
      selectedTemplate.variables.forEach(variable => {
        if (variable.defaultValue) {
          values[variable.name] = variable.defaultValue
        } else if (variable.type === 'date') {
          values[variable.name] = format(new Date(), 'yyyy-MM-dd')
        } else {
          values[variable.name] = ''
        }
      })
      setVariableValues(values)
    }
  }, [selectedTemplate])

  const loadTemplates = () => {
    const loadedTemplates = TemplateService.getTemplates()
    if (loadedTemplates.length === 0) {
      // Add default templates
      const defaults = TemplateService.getDefaultTemplates()
      defaults.forEach(template => TemplateService.addTemplate(template))
      setTemplates(TemplateService.getTemplates())
    } else {
      setTemplates(loadedTemplates)
    }
  }

  const handleCreateTask = () => {
    if (!selectedTemplate) return

    try {
      const lists = taskManager.getLists()
      if (lists.length === 0) {
        toastService.error('Сначала создайте список')
        return
      }

      const taskData = TemplateService.processTemplate(selectedTemplate, variableValues)
      const task = taskManager.addTask({
        ...taskData,
        listId: lists[0].id
      })

      toastService.success(`Задача "${task.title}" создана из шаблона`)
      if (onTaskCreated) {
        onTaskCreated()
      }
      setSelectedTemplate(null)
      setVariableValues({})
    } catch (error: any) {
      toastService.error('Ошибка создания задачи: ' + error.message)
    }
  }

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.title) {
      toastService.error('Заполните обязательные поля')
      return
    }

    // Extract variables from template
    const variables: TemplateVariable[] = []
    const titleVars = TemplateService.extractVariables(newTemplate.title)
    const notesVars = TemplateService.extractVariables(newTemplate.notes)
    const allVars = [...new Set([...titleVars, ...notesVars])]

    allVars.forEach(varName => {
      variables.push({
        name: varName,
        label: varName.charAt(0).toUpperCase() + varName.slice(1),
        type: 'text',
        required: false
      })
    })

    TemplateService.addTemplate({
      name: newTemplate.name,
      description: newTemplate.description,
      template: {
        title: newTemplate.title,
        notes: newTemplate.notes || undefined,
        priority: newTemplate.priority
      },
      variables
    })

    toastService.success('Шаблон создан')
    loadTemplates()
    setShowCreateTemplate(false)
    setNewTemplate({ name: '', description: '', title: '', notes: '', priority: 'none' })
  }

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Удалить шаблон?')) {
      TemplateService.deleteTemplate(templateId)
      toastService.info('Шаблон удален')
      loadTemplates()
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null)
      }
    }
  }

  return (
    <div className="template-overlay" onClick={onClose}>
      <div className="template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-header">
          <h2>📝 Шаблоны задач</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="template-content">
          <div className="templates-list-section">
            <div className="section-header">
              <h3>Шаблоны ({templates.length})</h3>
              <button
                className="btn-secondary"
                onClick={() => setShowCreateTemplate(!showCreateTemplate)}
              >
                {showCreateTemplate ? '✕ Отмена' : '+ Создать шаблон'}
              </button>
            </div>

            {showCreateTemplate && (
              <div className="create-template-form">
                <div className="form-group">
                  <label>Название шаблона *</label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    className="form-input"
                    placeholder="Например: Встреча"
                  />
                </div>
                <div className="form-group">
                  <label>Описание</label>
                  <input
                    type="text"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Название задачи * (используйте {{variable}})</label>
                  <input
                    type="text"
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                    className="form-input"
                    placeholder="Например: Встреча с {{name}}"
                  />
                </div>
                <div className="form-group">
                  <label>Заметки (используйте {{variable}})</label>
                  <textarea
                    value={newTemplate.notes}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, notes: e.target.value }))}
                    className="form-textarea"
                    rows={3}
                    placeholder="Например: Встреча с {{name}} в {{location}}"
                  />
                </div>
                <button onClick={handleCreateTemplate} className="btn-primary">
                  Создать шаблон
                </button>
              </div>
            )}

            <div className="templates-list">
              {templates.map(template => (
                <div
                  key={template.id}
                  className={`template-item ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="template-item-info">
                    <h4>{template.name}</h4>
                    {template.description && (
                      <p className="template-description">{template.description}</p>
                    )}
                    <div className="template-meta">
                      <span>Использовано: {template.usedCount}</span>
                      <span>•</span>
                      <span>Переменных: {template.variables.length}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTemplate(template.id)
                    }}
                    className="delete-template-btn"
                    title="Удалить"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>

          {selectedTemplate && (
            <div className="template-preview-section">
              <h3>Заполните переменные</h3>
              <div className="variables-form">
                {selectedTemplate.variables.map(variable => (
                  <div key={variable.name} className="form-group">
                    <label>
                      {variable.label}
                      {variable.required && <span className="required">*</span>}
                    </label>
                    {variable.type === 'text' && (
                      <input
                        type="text"
                        value={variableValues[variable.name] || ''}
                        onChange={(e) => setVariableValues(prev => ({
                          ...prev,
                          [variable.name]: e.target.value
                        }))}
                        className="form-input"
                        placeholder={variable.defaultValue || `Введите ${variable.label.toLowerCase()}`}
                        required={variable.required}
                      />
                    )}
                    {variable.type === 'date' && (
                      <input
                        type="date"
                        value={variableValues[variable.name] || format(new Date(), 'yyyy-MM-dd')}
                        onChange={(e) => setVariableValues(prev => ({
                          ...prev,
                          [variable.name]: e.target.value
                        }))}
                        className="form-input"
                        required={variable.required}
                      />
                    )}
                    {variable.type === 'number' && (
                      <input
                        type="number"
                        value={variableValues[variable.name] || ''}
                        onChange={(e) => setVariableValues(prev => ({
                          ...prev,
                          [variable.name]: e.target.value
                        }))}
                        className="form-input"
                        required={variable.required}
                      />
                    )}
                    {variable.type === 'select' && variable.options && (
                      <select
                        value={variableValues[variable.name] || ''}
                        onChange={(e) => setVariableValues(prev => ({
                          ...prev,
                          [variable.name]: e.target.value
                        }))}
                        className="form-select"
                        required={variable.required}
                      >
                        <option value="">Выберите...</option>
                        {variable.options.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>

              <div className="template-preview">
                <h4>Предпросмотр</h4>
                <div className="preview-content">
                  <p><strong>Название:</strong> {previewText(selectedTemplate.template.title, variableValues)}</p>
                  {selectedTemplate.template.notes && (
                    <p><strong>Заметки:</strong> {previewText(selectedTemplate.template.notes, variableValues)}</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleCreateTask}
                className="btn-primary create-task-btn"
                disabled={!canCreateTask()}
              >
                ✅ Создать задачу из шаблона
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const previewText = (text: string, values: Record<string, string>): string => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return values[varName] || match
    })
  }

  const canCreateTask = (): boolean => {
    if (!selectedTemplate) return false
    return selectedTemplate.variables
      .filter(v => v.required)
      .every(v => variableValues[v.name] && variableValues[v.name].trim() !== '')
  }
}

