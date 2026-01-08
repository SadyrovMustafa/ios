import { useState, useEffect } from 'react'
import { LocalAuthService, User } from '../services/LocalAuthService'
import { toastService } from '../services/ToastService'
import EmailSettings from './EmailSettings'
import './UserAccount.css'

interface UserAccountProps {
  onClose: () => void
}

export default function UserAccount({ onClose }: UserAccountProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isSignIn, setIsSignIn] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showEmailSettings, setShowEmailSettings] = useState(false)

  useEffect(() => {
    const currentUser = LocalAuthService.getCurrentUser()
    setUser(currentUser)
    if (currentUser) {
      setEditedName(currentUser.name)
    }
  }, [])

  const handleSignIn = async () => {
    try {
      if (!email || !password) {
        toastService.error('Заполните все поля')
        return
      }

      const signedInUser = await LocalAuthService.signIn(email, password)
      setUser(signedInUser)
      setEditedName(signedInUser.name)
      toastService.success(`Добро пожаловать, ${signedInUser.name}!`)
    } catch (error: any) {
      toastService.error(error.message || 'Ошибка входа')
    }
  }

  const handleSignUp = async () => {
    try {
      if (!email || !password || !name) {
        toastService.error('Заполните все поля')
        return
      }

      if (password.length < 6) {
        toastService.error('Пароль должен быть не менее 6 символов')
        return
      }

      const newUser = await LocalAuthService.signUp(email, password, name)
      setUser(newUser)
      setEditedName(newUser.name)
      toastService.success(`Аккаунт создан! Добро пожаловать, ${newUser.name}!`)
    } catch (error: any) {
      toastService.error(error.message || 'Ошибка регистрации')
    }
  }

  const handleSignOut = () => {
    LocalAuthService.signOut()
    setUser(null)
    setEmail('')
    setPassword('')
    setName('')
    toastService.info('Вы вышли из аккаунта')
  }

  const handleUpdateProfile = async () => {
    if (!user) return

    try {
      const updated = await LocalAuthService.updateProfile(user.id, { name: editedName })
      setUser(updated)
      toastService.success('Профиль обновлен')
      setShowProfile(false)
    } catch (error: any) {
      toastService.error(error.message || 'Ошибка обновления профиля')
    }
  }

  const handleChangePassword = async () => {
    if (!user) return

    try {
      if (!oldPassword || !newPassword) {
        toastService.error('Заполните все поля')
        return
      }

      if (newPassword.length < 6) {
        toastService.error('Пароль должен быть не менее 6 символов')
        return
      }

      await LocalAuthService.changePassword(user.id, oldPassword, newPassword)
      toastService.success('Пароль изменен')
      setShowChangePassword(false)
      setOldPassword('')
      setNewPassword('')
    } catch (error: any) {
      toastService.error(error.message || 'Ошибка смены пароля')
    }
  }

  return (
    <div className="user-account-overlay" onClick={onClose}>
      <div className={`user-account-modal ${showEmailSettings ? 'has-email-settings' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="user-account-header">
          <h2>👤 Аккаунт</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="user-account-content">
          {!user ? (
            <div className="auth-section">
              <div className="auth-tabs">
                <button
                  className={`auth-tab ${isSignIn ? 'active' : ''}`}
                  onClick={() => setIsSignIn(true)}
                >
                  Вход
                </button>
                <button
                  className={`auth-tab ${!isSignIn ? 'active' : ''}`}
                  onClick={() => setIsSignIn(false)}
                >
                  Регистрация
                </button>
              </div>

              <div className="auth-form">
                {!isSignIn && (
                  <input
                    type="text"
                    placeholder="Имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="auth-input"
                  />
                )}
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                />
                <input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                />
                <button
                  onClick={isSignIn ? handleSignIn : handleSignUp}
                  className="auth-btn"
                >
                  {isSignIn ? 'Войти' : 'Зарегистрироваться'}
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-section">
              <div className="profile-header">
                <div className="profile-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                  <span className="profile-joined">
                    Присоединился: {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>

              {!showProfile && !showChangePassword && !showEmailSettings && (
                <div className="profile-actions">
                  <button
                    onClick={() => setShowProfile(true)}
                    className="profile-btn"
                  >
                    ✏️ Редактировать профиль
                  </button>
                  <button
                    onClick={() => setShowChangePassword(true)}
                    className="profile-btn"
                  >
                    🔒 Изменить пароль
                  </button>
                  <button
                    onClick={() => setShowEmailSettings(true)}
                    className="profile-btn"
                  >
                    📧 Настройки Email
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="profile-btn danger"
                  >
                    🚪 Выйти
                  </button>
                </div>
              )}

              {showEmailSettings && (
                <div className="email-settings-container">
                  <div className="email-settings-header">
                    <button
                      onClick={() => setShowEmailSettings(false)}
                      className="back-btn"
                    >
                      ← Назад
                    </button>
                  </div>
                  <EmailSettings />
                </div>
              )}

              {showProfile && (
                <div className="profile-edit">
                  <h4>Редактировать профиль</h4>
                  <input
                    type="text"
                    placeholder="Имя"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="auth-input"
                  />
                  <div className="profile-edit-actions">
                    <button
                      onClick={() => setShowProfile(false)}
                      className="btn-secondary"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      className="btn-primary"
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              )}

              {showChangePassword && (
                <div className="profile-edit">
                  <h4>Изменить пароль</h4>
                  <input
                    type="password"
                    placeholder="Текущий пароль"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="auth-input"
                  />
                  <input
                    type="password"
                    placeholder="Новый пароль"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="auth-input"
                  />
                  <div className="profile-edit-actions">
                    <button
                      onClick={() => {
                        setShowChangePassword(false)
                        setOldPassword('')
                        setNewPassword('')
                      }}
                      className="btn-secondary"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleChangePassword}
                      className="btn-primary"
                    >
                      Изменить
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

