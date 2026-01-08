import { useState } from 'react'
import { EmailToTaskService } from '../services/EmailToTaskService'
import { TaskManager } from '../services/TaskManager'
import { toastService } from '../services/ToastService'
import './EmailToTaskPanel.css'

interface EmailToTaskPanelProps {
  taskManager: TaskManager
  onClose?: () => void
}

export default function EmailToTaskPanel({ taskManager, onClose }: EmailToTaskPanelProps) {
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailFrom, setEmailFrom] = useState('')

  const handleCreateTask = () => {
    if (!emailSubject.trim()) {
      toastService.error('Введите тему письма')
      return
    }

    const emailTask = {
      subject: emailSubject,
      body: emailBody,
      from: emailFrom || 'unknown@email.com',
      date: new Date()
    }

    try {
      const taskData = EmailToTaskService.parseEmailToTask(emailTask)
      const createdTask = taskManager.addTask({
        title: taskData.title,
        notes: taskData.notes,
        listId: taskManager.getLists()[0]?.id || '',
        isCompleted: false,
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        tags: taskData.tags
      })

      toastService.success(`Задача "${createdTask.title}" создана из email`)
      
      // Очистка формы
      setEmailSubject('')
      setEmailBody('')
      setEmailFrom('')
      
      if (onClose) onClose()
    } catch (error: any) {
      toastService.error(error.message || 'Ошибка создания задачи из email')
    }
  }

  return (
    <div className={`email-to-task-panel ${onClose ? 'modal' : ''}`}>
      {onClose && (
        <div className="email-to-task-header">
          <h2>📧 Создать задачу из Email</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      )}

      <div className="email-to-task-content">
        <div className="form-group">
          <label>От кого:</label>
          <input
            type="email"
            value={emailFrom}
            onChange={(e) => setEmailFrom(e.target.value)}
            placeholder="sender@example.com"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Тема письма:</label>
          <input
            type="text"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            placeholder="Тема письма (станет названием задачи)"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label>Текст письма:</label>
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            placeholder="Текст письма (станет заметками задачи)"
            className="form-textarea"
            rows={6}
          />
          <div className="form-hint">
            💡 Используйте #тег для добавления тегов, "due: дата" для установки срока
          </div>
        </div>

        <div className="form-actions">
          <button onClick={handleCreateTask} className="btn-primary">
            ✅ Создать задачу
          </button>
          <button onClick={onClose} className="btn-secondary">
            Отмена
          </button>
        </div>

        <div className="email-integration-info">
          <h4>Интеграция с Email сервисами</h4>
          <p>
            Для автоматического создания задач из email требуется настройка бэкенда.
            Сейчас вы можете вручную вводить данные из письма.
          </p>
          <p className="info-note">
            В будущем: интеграция с Gmail, Outlook, IMAP для автоматического создания задач.
          </p>
        </div>
      </div>
    </div>
  )
}

