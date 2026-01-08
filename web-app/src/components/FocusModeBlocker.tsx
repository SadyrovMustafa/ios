import { useState, useEffect } from 'react'
import { SiteBlockerService, BlockedSite } from '../services/SiteBlockerService'
import { toastService } from '../services/ToastService'
import './FocusModeBlocker.css'

interface FocusModeBlockerProps {
  onClose?: () => void
}

export default function FocusModeBlocker({ onClose }: FocusModeBlockerProps) {
  const [isEnabled, setIsEnabled] = useState(SiteBlockerService.isBlockingEnabled())
  const [blockedSites, setBlockedSites] = useState<BlockedSite[]>([])
  const [newDomain, setNewDomain] = useState('')

  useEffect(() => {
    loadSites()
  }, [])

  useEffect(() => {
    SiteBlockerService.setBlockingEnabled(isEnabled)
    if (isEnabled) {
      SiteBlockerService.checkAndBlock()
    }
  }, [isEnabled])

  const loadSites = () => {
    setBlockedSites(SiteBlockerService.getBlockedSites())
  }

  const handleToggle = () => {
    setIsEnabled(!isEnabled)
    toastService.success(isEnabled ? 'Блокировка сайтов отключена' : 'Блокировка сайтов включена')
  }

  const handleAddSite = () => {
    if (!newDomain.trim()) {
      toastService.error('Введите домен')
      return
    }

    try {
      SiteBlockerService.addBlockedSite(newDomain.trim())
      setNewDomain('')
      loadSites()
      toastService.success('Сайт добавлен в список блокировки')
    } catch (error) {
      toastService.error('Неверный формат домена')
    }
  }

  const handleRemoveSite = (siteId: string) => {
    if (confirm('Удалить сайт из списка блокировки?')) {
      SiteBlockerService.removeBlockedSite(siteId)
      loadSites()
      toastService.success('Сайт удален')
    }
  }

  const handleToggleSite = (siteId: string) => {
    SiteBlockerService.toggleSite(siteId)
    loadSites()
  }

  const handleAddDefaults = () => {
    if (confirm('Добавить популярные отвлекающие сайты?')) {
      SiteBlockerService.addDefaultSites()
      loadSites()
      toastService.success('Стандартные сайты добавлены')
    }
  }

  return (
    <div className={`focus-mode-blocker ${onClose ? 'modal' : ''}`}>
      {onClose && (
        <div className="blocker-header">
          <h2>🚫 Блокировка сайтов</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      )}

      <div className="blocker-content">
        <div className="blocker-toggle-section">
          <div className="toggle-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={handleToggle}
                className="toggle-checkbox"
              />
              <span className="toggle-text">Включить блокировку сайтов</span>
            </label>
            <p className="toggle-description">
              Блокирует доступ к отвлекающим сайтам во время работы
            </p>
          </div>
        </div>

        {isEnabled && (
          <>
            <div className="blocker-add-section">
              <h3>Добавить сайт</h3>
              <div className="add-site-form">
                <input
                  type="text"
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSite()}
                  className="domain-input"
                />
                <button onClick={handleAddSite} className="add-btn">
                  Добавить
                </button>
              </div>
              <button onClick={handleAddDefaults} className="add-defaults-btn">
                Добавить стандартные сайты
              </button>
            </div>

            <div className="blocked-sites-list">
              <h3>Заблокированные сайты ({blockedSites.length})</h3>
              {blockedSites.length === 0 ? (
                <p className="empty-list">Нет заблокированных сайтов</p>
              ) : (
                <div className="sites-list">
                  {blockedSites.map(site => (
                    <div key={site.id} className="site-item">
                      <label className="site-toggle">
                        <input
                          type="checkbox"
                          checked={site.enabled}
                          onChange={() => handleToggleSite(site.id)}
                        />
                        <span className="site-domain">{site.domain}</span>
                      </label>
                      <button
                        onClick={() => handleRemoveSite(site.id)}
                        className="remove-btn"
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="blocker-info">
              <p>ℹ️ <strong>Примечание:</strong> Блокировка работает только в рамках этого приложения. 
              Для полной блокировки используйте расширение браузера или настройки системы.</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

