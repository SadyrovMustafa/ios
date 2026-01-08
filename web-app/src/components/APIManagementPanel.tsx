import React, { useState, useEffect } from 'react'
import { APIService, APIKey, APIPermission } from '../services/APIService'
import { LocalAuthService } from '../services/LocalAuthService'
import { toastService } from '../services/ToastService'
import './APIManagementPanel.css'

interface APIManagementPanelProps {
  onClose: () => void
}

export const APIManagementPanel: React.FC<APIManagementPanelProps> = ({ onClose }) => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<APIPermission[]>(['tasks:read'])
  const [newKey, setNewKey] = useState<string | null>(null)
  const currentUser = LocalAuthService.getCurrentUser()

  useEffect(() => {
    loadAPIKeys()
  }, [])

  const loadAPIKeys = () => {
    if (currentUser) {
      const keys = APIService.getAllAPIKeys().filter(k => k.userId === currentUser.id)
      setApiKeys(keys)
    }
  }

  const handleCreateKey = () => {
    if (!newKeyName.trim() || !currentUser) {
      toastService.error('Введите название ключа')
      return
    }

    const created = APIService.createAPIKey(newKeyName, currentUser.id, selectedPermissions)
    setNewKey(created.key)
    setNewKeyName('')
    setSelectedPermissions(['tasks:read'])
    setShowCreateModal(false)
    loadAPIKeys()
    toastService.success('API ключ создан! Сохраните его - он больше не будет показан.')
  }

  const handleDeleteKey = (keyId: string) => {
    if (!confirm('Удалить API ключ? Это действие нельзя отменить.')) return
    if (!currentUser) return

    try {
      APIService.deleteAPIKey(keyId, currentUser.id)
      loadAPIKeys()
      toastService.success('API ключ удален')
    } catch (error: any) {
      toastService.error(error.message)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toastService.success('Скопировано в буфер обмена')
  }

  const allPermissions: APIPermission[] = [
    'tasks:read',
    'tasks:write',
    'tasks:delete',
    'lists:read',
    'lists:write',
    'lists:delete',
    'projects:read',
    'projects:write',
    'users:read'
  ]

  const togglePermission = (permission: APIPermission) => {
    if (selectedPermissions.includes(permission)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permission))
    } else {
      setSelectedPermissions([...selectedPermissions, permission])
    }
  }

  if (!currentUser) {
    return (
      <div className="api-panel">
        <div className="panel-header">
          <h2>🔌 API Management</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="panel-content">
          <p>Войдите в систему для управления API ключами</p>
        </div>
      </div>
    )
  }

  return (
    <div className="api-panel">
      <div className="panel-header">
        <h2>🔌 API Management</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="panel-content">
        <div className="api-info">
          <h3>REST API</h3>
          <p>Используйте API для интеграции с внешними приложениями</p>
          <p className="api-base-url">
            <strong>Base URL:</strong> <code>{window.location.origin}/api/v1</code>
            <button onClick={() => copyToClipboard(`${window.location.origin}/api/v1`)}>📋</button>
          </p>
        </div>

        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Создать API ключ
        </button>

        {newKey && (
          <div className="new-key-alert">
            <h4>⚠️ Сохраните ваш API ключ!</h4>
            <p>Этот ключ будет показан только один раз</p>
            <div className="api-key-display">
              <code>{newKey}</code>
              <button onClick={() => copyToClipboard(newKey)}>📋 Копировать</button>
            </div>
            <button onClick={() => setNewKey(null)}>Закрыть</button>
          </div>
        )}

        <div className="api-keys-list">
          <h3>Ваши API ключи</h3>
          {apiKeys.length === 0 ? (
            <p className="empty-state">Нет созданных API ключей</p>
          ) : (
            apiKeys.map(key => (
              <div key={key.id} className="api-key-item">
                <div className="key-info">
                  <h4>{key.name}</h4>
                  <p className="key-meta">
                    Создан: {key.createdAt.toLocaleDateString()}
                    {key.lastUsed && ` • Использован: ${key.lastUsed.toLocaleDateString()}`}
                  </p>
                  <div className="permissions">
                    <strong>Права:</strong>
                    <span>{key.permissions.join(', ')}</span>
                  </div>
                  <div className="key-value">
                    <code>{key.key.substring(0, 20)}...</code>
                  </div>
                </div>
                <button className="btn-danger" onClick={() => handleDeleteKey(key.id)}>
                  Удалить
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Создать API ключ</h3>
            <input
              type="text"
              placeholder="Название ключа"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
            <div className="permissions-selector">
              <h4>Права доступа:</h4>
              {allPermissions.map(permission => (
                <label key={permission} className="permission-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(permission)}
                    onChange={() => togglePermission(permission)}
                  />
                  <span>{permission}</span>
                </label>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleCreateKey}>Создать</button>
              <button onClick={() => setShowCreateModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

