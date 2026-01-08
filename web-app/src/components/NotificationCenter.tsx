import { useState, useEffect } from 'react'
import { NotificationService, Notification } from '../services/NotificationService'
import { LocalAuthService } from '../services/LocalAuthService'
import { format } from 'date-fns'
import { toastService } from '../services/ToastService'
import './NotificationCenter.css'

interface NotificationCenterProps {
  onClose: () => void
}

export default function NotificationCenter({ onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('unread')
  const currentUser = LocalAuthService.getCurrentUser()

  useEffect(() => {
    if (currentUser) {
      loadNotifications()
    }
  }, [currentUser, filter])

  const loadNotifications = () => {
    if (!currentUser) return
    const all = NotificationService.getNotificationsForUser(currentUser.id)
    setNotifications(filter === 'unread' ? all.filter(n => !n.read) : all)
  }

  const handleMarkAsRead = (notificationId: string) => {
    NotificationService.markAsRead(notificationId)
    loadNotifications()
  }

  const handleMarkAllAsRead = () => {
    if (!currentUser) return
    NotificationService.markAllAsRead(currentUser.id)
    toastService.success('Все уведомления прочитаны')
    loadNotifications()
  }

  const handleDelete = (notificationId: string) => {
    NotificationService.deleteNotification(notificationId)
    loadNotifications()
  }

  const unreadCount = currentUser ? NotificationService.getUnreadCount(currentUser.id) : 0

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_created': return '➕'
      case 'task_updated': return '✏️'
      case 'task_deleted': return '🗑️'
      case 'task_completed': return '✅'
      case 'comment_added': return '💬'
      case 'task_assigned': return '👤'
      case 'mention': return '🔔'
      case 'project_updated': return '📁'
      case 'sprint_started': return '🏃'
      case 'sprint_ended': return '🏁'
      default: return '📢'
    }
  }

  return (
    <div className="notification-center-overlay" onClick={onClose}>
      <div className="notification-center-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notification-center-header">
          <h2>🔔 Уведомления {unreadCount > 0 && `(${unreadCount})`}</h2>
          <div className="header-actions">
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="btn-secondary-small">
                Отметить все как прочитанные
              </button>
            )}
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="notification-center-content">
          <div className="notification-filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Все
            </button>
            <button
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Непрочитанные ({unreadCount})
            </button>
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <p>Нет уведомлений</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">
                      {format(new Date(notification.createdAt), 'dd.MM.yyyy HH:mm')}
                    </div>
                  </div>
                  <div className="notification-actions">
                    {!notification.read && (
                      <span className="unread-dot"></span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(notification.id)
                      }}
                      className="delete-btn"
                      title="Удалить"
                    >
                      🗑️
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

