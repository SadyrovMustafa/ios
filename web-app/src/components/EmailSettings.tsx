import { useState, useEffect } from 'react'
import { emailService, EmailConfig } from '../services/EmailService'
import { toastService } from '../services/ToastService'
import './EmailSettings.css'

export default function EmailSettings() {
  const [config, setConfig] = useState<EmailConfig>({
    provider: 'resend',
    fromEmail: '',
    fromName: 'TickTick'
  })
  const [isConfigured, setIsConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('')

  useEffect(() => {
    const savedConfig = emailService.loadConfig()
    if (savedConfig) {
      setConfig(savedConfig)
      setIsConfigured(true)
    }
  }, [])

  const handleProviderChange = (provider: EmailConfig['provider']) => {
    setConfig({ ...config, provider })
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Validate required fields
      if (!config.apiKey && config.provider !== 'custom') {
        toastService.error('Пожалуйста, введите API ключ')
        return
      }

      if (!config.fromEmail) {
        toastService.error('Пожалуйста, введите email отправителя')
        return
      }

      // Initialize email service
      emailService.initialize(config)
      setIsConfigured(true)
      toastService.success('Настройки email сохранены!')
    } catch (error) {
      console.error('Failed to save email config:', error)
      toastService.error('Не удалось сохранить настройки')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmail) {
      toastService.error('Введите email для теста')
      return
    }

    if (!emailService.isEmailConfigured()) {
      toastService.error('Сначала настройте email сервис')
      return
    }

    setIsLoading(true)
    try {
      const success = await emailService.sendEmail({
        to: testEmail,
        subject: 'Тестовое письмо от TickTick',
        html: `
          <h2>Это тестовое письмо</h2>
          <p>Если вы получили это письмо, значит настройки email работают правильно!</p>
          <p>Теперь вы будете получать уведомления на email.</p>
        `
      })

      if (success) {
        toastService.success('Тестовое письмо отправлено! Проверьте почту.')
        setTestEmail('')
      } else {
        toastService.error('Не удалось отправить тестовое письмо')
      }
    } catch (error) {
      console.error('Failed to send test email:', error)
      toastService.error('Ошибка при отправке тестового письма')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="email-settings">
      <h2 className="settings-title">Настройки Email</h2>
      <p className="settings-description">
        Настройте отправку email-уведомлений. Поддерживаются различные провайдеры.
      </p>

      <div className="email-config">
        <div className="form-group">
          <label className="form-label">Провайдер</label>
          <select
            className="form-select"
            value={config.provider}
            onChange={(e) => handleProviderChange(e.target.value as EmailConfig['provider'])}
          >
            <option value="resend">Resend (рекомендуется)</option>
            <option value="sendgrid">SendGrid</option>
            <option value="mailgun">Mailgun</option>
            <option value="smtp">SMTP (требует сервер)</option>
            <option value="custom">Custom API</option>
          </select>
          <p className="form-hint">
            {config.provider === 'resend' && 'Бесплатный тариф: 3000 писем/месяц. Простая настройка.'}
            {config.provider === 'sendgrid' && 'Бесплатный тариф: 100 писем/день. Надежный сервис.'}
            {config.provider === 'mailgun' && 'Бесплатный тариф: 5000 писем/месяц. Хорошая доставляемость.'}
            {config.provider === 'smtp' && 'Требует настройки серверной части (serverless function).'}
            {config.provider === 'custom' && 'Используйте свой API endpoint для отправки email.'}
          </p>
        </div>

        {config.provider !== 'custom' && (
          <div className="form-group">
            <label className="form-label">API Ключ</label>
            <input
              type="password"
              className="form-input"
              placeholder="Введите API ключ"
              value={config.apiKey || ''}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            />
            <p className="form-hint">
              {config.provider === 'resend' && (
                <>
                  Получите API ключ на{' '}
                  <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer">
                    resend.com/api-keys
                  </a>
                </>
              )}
              {config.provider === 'sendgrid' && (
                <>
                  Получите API ключ на{' '}
                  <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer">
                    sendgrid.com
                  </a>
                </>
              )}
              {config.provider === 'mailgun' && (
                <>
                  Получите API ключ на{' '}
                  <a href="https://app.mailgun.com/app/account/security/api_keys" target="_blank" rel="noopener noreferrer">
                    mailgun.com
                  </a>
                </>
              )}
              {config.provider === 'smtp' && 'API ключ не требуется для SMTP'}
            </p>
          </div>
        )}

        {config.provider === 'custom' && (
          <div className="form-group">
            <label className="form-label">API Endpoint URL</label>
            <input
              type="text"
              className="form-input"
              placeholder="https://your-api.com/send-email"
              value={localStorage.getItem('ticktick_custom_email_api') || ''}
              onChange={(e) => localStorage.setItem('ticktick_custom_email_api', e.target.value)}
            />
            <p className="form-hint">
              URL вашего API endpoint для отправки email. Должен принимать POST запросы с полями: to, subject, html, text
            </p>
          </div>
        )}

        {config.provider === 'smtp' && (
          <div className="smtp-config">
            <div className="form-group">
              <label className="form-label">SMTP Host</label>
              <input
                type="text"
                className="form-input"
                placeholder="smtp.gmail.com"
                value={config.smtpHost || ''}
                onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">SMTP Port</label>
              <input
                type="number"
                className="form-input"
                placeholder="587"
                value={config.smtpPort || ''}
                onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">SMTP User</label>
              <input
                type="text"
                className="form-input"
                placeholder="your-email@gmail.com"
                value={config.smtpUser || ''}
                onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">SMTP Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Введите пароль"
                value={config.smtpPassword || ''}
                onChange={(e) => setConfig({ ...config, smtpPassword: e.target.value })}
              />
            </div>
            <p className="form-hint warning">
              ⚠️ SMTP требует настройки serverless function или backend API. 
              Используйте провайдеры API (Resend, SendGrid) для более простой настройки.
            </p>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email отправителя</label>
          <input
            type="email"
            className="form-input"
            placeholder="noreply@ticktick.app"
            value={config.fromEmail || ''}
            onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
          />
          <p className="form-hint">
            Email адрес, с которого будут отправляться письма. Должен быть подтвержден у провайдера.
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Имя отправителя</label>
          <input
            type="text"
            className="form-input"
            placeholder="TickTick"
            value={config.fromName || ''}
            onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
          />
        </div>

        <div className="form-actions">
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Сохранение...' : 'Сохранить настройки'}
          </button>
        </div>

        {isConfigured && (
          <div className="test-email-section">
            <h3 className="section-title">Тестовая отправка</h3>
            <div className="test-email-form">
              <input
                type="email"
                className="form-input"
                placeholder="Введите email для теста"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <button
                className="btn-secondary"
                onClick={handleTestEmail}
                disabled={isLoading || !testEmail}
              >
                Отправить тестовое письмо
              </button>
            </div>
          </div>
        )}

        <div className="email-info">
          <h3 className="section-title">Какие письма будут отправляться?</h3>
          <ul className="email-list">
            <li>✅ Приветственное письмо при регистрации</li>
            <li>✅ Уведомления о назначении задач</li>
            <li>✅ Напоминания о сроках выполнения</li>
            <li>✅ Сброс пароля</li>
            <li>✅ Еженедельные отчеты (опционально)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

