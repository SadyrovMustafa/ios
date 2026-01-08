import React, { useState, useEffect } from 'react'
import { CustomFieldService, CustomField, CustomFieldType } from '../services/CustomFieldService'
import { Task } from '../types/Task'
import './CustomFieldPanel.css'

interface CustomFieldPanelProps {
  projectId?: string
  listId?: string
  task?: Task
  onClose: () => void
}

export const CustomFieldPanel: React.FC<CustomFieldPanelProps> = ({ projectId, listId, task, onClose }) => {
  const [fields, setFields] = useState<CustomField[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newField, setNewField] = useState({
    name: '',
    type: 'text' as CustomFieldType,
    required: false,
    options: [] as string[]
  })

  useEffect(() => {
    loadFields()
  }, [projectId, listId])

  const loadFields = () => {
    let projectFields: CustomField[] = []
    if (listId) {
      projectFields = CustomFieldService.getFieldsForList(listId, projectId)
    } else if (projectId) {
      projectFields = CustomFieldService.getFieldsForProject(projectId)
    } else {
      projectFields = CustomFieldService.getAllFields().filter(f => !f.projectId && !f.listId)
    }
    setFields(projectFields)
  }

  const handleCreateField = () => {
    if (!newField.name) return

    CustomFieldService.createField(
      newField.name,
      newField.type,
      projectId,
      listId,
      newField.required,
      newField.type === 'dropdown' || newField.type === 'multiselect' ? newField.options.map((opt, i) => ({
        id: `opt-${i}`,
        label: opt
      })) : undefined
    )

    setNewField({ name: '', type: 'text', required: false, options: [] })
    setShowAddModal(false)
    loadFields()
  }

  const handleSetValue = (fieldId: string, value: any) => {
    if (task) {
      CustomFieldService.setFieldValue(task.id, fieldId, value)
      loadFields()
    }
  }

  const renderFieldInput = (field: CustomField) => {
    if (!task) return null

    const currentValue = CustomFieldService.getFieldValue(task.id, field.id)

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={currentValue || ''}
            onChange={(e) => handleSetValue(field.id, e.target.value)}
            placeholder={field.name}
            required={field.required}
          />
        )
      case 'number':
        return (
          <input
            type="number"
            value={currentValue || ''}
            onChange={(e) => handleSetValue(field.id, parseFloat(e.target.value) || 0)}
            placeholder={field.name}
            required={field.required}
          />
        )
      case 'date':
        return (
          <input
            type="date"
            value={currentValue || ''}
            onChange={(e) => handleSetValue(field.id, e.target.value)}
            required={field.required}
          />
        )
      case 'dropdown':
        return (
          <select
            value={currentValue || ''}
            onChange={(e) => handleSetValue(field.id, e.target.value)}
            required={field.required}
          >
            <option value="">Выберите...</option>
            {field.options?.map(opt => (
              <option key={opt.id} value={opt.label}>{opt.label}</option>
            ))}
          </select>
        )
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={currentValue || false}
            onChange={(e) => handleSetValue(field.id, e.target.checked)}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="custom-field-panel">
      <div className="panel-header">
        <h2>📋 Кастомные поля</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="panel-content">
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          + Создать поле
        </button>

        <div className="fields-list">
          {fields.map(field => (
            <div key={field.id} className="field-item">
              <div className="field-header">
                <span className="field-name">{field.name}</span>
                <span className="field-type">{field.type}</span>
                {field.required && <span className="required-badge">Обязательное</span>}
              </div>
              {task && (
                <div className="field-input">
                  {renderFieldInput(field)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Создать поле</h3>
            <input
              type="text"
              placeholder="Название поля"
              value={newField.name}
              onChange={(e) => setNewField({ ...newField, name: e.target.value })}
            />
            <select
              value={newField.type}
              onChange={(e) => setNewField({ ...newField, type: e.target.value as CustomFieldType })}
            >
              <option value="text">Текст</option>
              <option value="number">Число</option>
              <option value="date">Дата</option>
              <option value="dropdown">Выпадающий список</option>
              <option value="multiselect">Множественный выбор</option>
              <option value="checkbox">Чекбокс</option>
            </select>
            <label>
              <input
                type="checkbox"
                checked={newField.required}
                onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
              />
              Обязательное поле
            </label>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleCreateField}>Создать</button>
              <button onClick={() => setShowAddModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

