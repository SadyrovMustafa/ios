import { useState, useEffect } from 'react'
import { TaskManager } from '../services/TaskManager'
import { RoleService, Role } from '../services/RoleService'
import { LocalAuthService } from '../services/LocalAuthService'
import { TaskList } from '../types/Task'
import { toastService } from '../services/ToastService'
import './RoleManagementPanel.css'

interface RoleManagementPanelProps {
  taskManager: TaskManager
  onClose: () => void
}

export default function RoleManagementPanel({ taskManager, onClose }: RoleManagementPanelProps) {
  const [lists, setLists] = useState<TaskList[]>([])
  const [selectedListId, setSelectedListId] = useState<string>('')
  const [permissions, setPermissions] = useState<Array<{ userId: string; role: Role }>>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<Role>('viewer')
  const currentUser = LocalAuthService.getCurrentUser()

  useEffect(() => {
    loadLists()
  }, [])

  useEffect(() => {
    if (selectedListId) {
      loadPermissions()
    }
  }, [selectedListId])

  const loadLists = () => {
    setLists(taskManager.getLists())
  }

  const loadPermissions = () => {
    if (selectedListId) {
      const listPermissions = RoleService.getListPermissionsForList(selectedListId)
      setPermissions(listPermissions.map(p => ({ userId: p.userId, role: p.role })))
    }
  }

  const handleGrantPermission = () => {
    if (!selectedListId || !selectedUserId || !currentUser) {
      toastService.error('Выберите список и пользователя')
      return
    }

    RoleService.grantListPermission(selectedListId, selectedUserId, selectedRole, currentUser.id)
    toastService.success('Права предоставлены')
    loadPermissions()
    setSelectedUserId('')
  }

  const handleRevokePermission = (userId: string) => {
    if (!selectedListId) return

    RoleService.revokeListPermission(selectedListId, userId)
    toastService.info('Права отозваны')
    loadPermissions()
  }

  const users = LocalAuthService.getAllUsers()
  const selectedList = lists.find(l => l.id === selectedListId)

  return (
    <div className="role-management-overlay" onClick={onClose}>
      <div className="role-management-modal" onClick={(e) => e.stopPropagation()}>
        <div className="role-management-header">
          <h2>🔐 Управление ролями</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="role-management-content">
          <div className="list-selector">
            <label>Выберите список:</label>
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="form-select"
            >
              <option value="">Выберите список...</option>
              {lists.map(list => (
                <option key={list.id} value={list.id}>
                  {list.icon} {list.name}
                </option>
              ))}
            </select>
          </div>

          {selectedList && (
            <>
              <div className="permissions-section">
                <h3>Права доступа к списку "{selectedList.name}"</h3>
                <div className="permissions-list">
                  {permissions.length === 0 ? (
                    <p className="empty-state">Нет настроенных прав. Только владелец имеет доступ.</p>
                  ) : (
                    permissions.map(permission => {
                      const user = users.find(u => u.id === permission.userId)
                      return user ? (
                        <div key={permission.userId} className="permission-item">
                          <div className="permission-user">
                            <span className="user-name">{user.name}</span>
                            <span className="user-email">{user.email}</span>
                          </div>
                          <div className="permission-role">
                            <span className={`role-badge role-${permission.role}`}>
                              {permission.role === 'owner' && '👑 Владелец'}
                              {permission.role === 'admin' && '⚙️ Администратор'}
                              {permission.role === 'editor' && '✏️ Редактор'}
                              {permission.role === 'viewer' && '👁️ Просмотр'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRevokePermission(permission.userId)}
                            className="btn-danger-small"
                            title="Отозвать права"
                          >
                            Удалить
                          </button>
                        </div>
                      ) : null
                    })
                  )}
                </div>
              </div>

              <div className="grant-permission-section">
                <h3>Предоставить права</h3>
                <div className="grant-form">
                  <div className="form-group">
                    <label>Пользователь:</label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="form-select"
                    >
                      <option value="">Выберите пользователя...</option>
                      {users
                        .filter(u => !permissions.some(p => p.userId === u.id))
                        .map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Роль:</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as Role)}
                      className="form-select"
                    >
                      <option value="viewer">👁️ Просмотр (только просмотр)</option>
                      <option value="editor">✏️ Редактор (создание и редактирование)</option>
                      <option value="admin">⚙️ Администратор (полный доступ, кроме удаления)</option>
                    </select>
                  </div>
                  <button
                    onClick={handleGrantPermission}
                    disabled={!selectedUserId}
                    className="btn-primary"
                  >
                    Предоставить права
                  </button>
                </div>
              </div>

              <div className="roles-info">
                <h4>Описание ролей:</h4>
                <ul className="roles-list">
                  <li>
                    <strong>👑 Владелец:</strong> Полный доступ, включая удаление списка
                  </li>
                  <li>
                    <strong>⚙️ Администратор:</strong> Полный доступ к задачам, но не может удалить список
                  </li>
                  <li>
                    <strong>✏️ Редактор:</strong> Может создавать и редактировать задачи
                  </li>
                  <li>
                    <strong>👁️ Просмотр:</strong> Только просмотр задач, без возможности редактирования
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

