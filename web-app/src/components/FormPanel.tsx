import React, { useState, useEffect } from 'react'
import { FormService, Form, FormField, FormFieldType } from '../services/FormService'
import { ProjectService } from '../services/ProjectService'
import { TaskManager } from '../services/TaskManager'
import { LocalAuthService } from '../services/LocalAuthService'
import './FormPanel.css'

interface FormPanelProps {
  projectId: string
  onClose: () => void
}

export const FormPanel: React.FC<FormPanelProps> = ({ projectId, onClose }) => {
  const [forms, setForms] = useState<Form[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedForm, setSelectedForm] = useState<Form | null>(null)
  const currentUser = LocalAuthService.getCurrentUser()

  useEffect(() => {
    loadForms()
  }, [projectId])

  const loadForms = () => {
    setForms(FormService.getFormsForProject(projectId))
  }

  const handleCreateForm = (name: string, description?: string) => {
    if (!currentUser) return
    FormService.createForm(name, projectId, currentUser.id, description, undefined, true)
    loadForms()
    setShowAddModal(false)
  }

  const handleAddField = (formId: string, field: Omit<FormField, 'id'>) => {
    const newField: FormField = {
      ...field,
      id: `field-${Date.now()}`
    }
    FormService.addFieldToForm(formId, newField)
    loadForms()
  }

  const copyPublicUrl = (form: Form) => {
    if (form.publicUrl) {
      const url = `${window.location.origin}/form/${form.publicUrl}`
      navigator.clipboard.writeText(url)
      alert('Ссылка скопирована!')
    }
  }

  return (
    <div className="form-panel">
      <div className="panel-header">
        <h2>📝 Формы</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="panel-content">
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Создать форму</button>
        <div className="forms-list">
          {forms.map(form => (
            <div key={form.id} className="form-card">
              <h3>{form.name}</h3>
              <p>{form.description}</p>
              <div className="form-actions">
                <button onClick={() => setSelectedForm(form)}>Редактировать</button>
                {form.publicUrl && (
                  <button onClick={() => copyPublicUrl(form)}>Копировать ссылку</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Создать форму</h3>
            <input type="text" placeholder="Название" id="form-name" />
            <textarea placeholder="Описание" id="form-desc" />
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => {
                const name = (document.getElementById('form-name') as HTMLInputElement)?.value
                const desc = (document.getElementById('form-desc') as HTMLTextAreaElement)?.value
                if (name) handleCreateForm(name, desc)
              }}>Создать</button>
              <button onClick={() => setShowAddModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

