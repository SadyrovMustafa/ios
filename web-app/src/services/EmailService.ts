/**
 * Email Service for sending emails via SMTP or Email API
 * Supports multiple providers: Resend, SendGrid, Mailgun, or custom SMTP
 */

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export interface EmailConfig {
  provider: 'resend' | 'sendgrid' | 'mailgun' | 'smtp' | 'custom'
  apiKey?: string
  fromEmail?: string
  fromName?: string
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPassword?: string
}

class EmailService {
  private config: EmailConfig | null = null
  private isConfigured = false

  /**
   * Initialize email service with configuration
   */
  initialize(config: EmailConfig): void {
    this.config = config
    this.isConfigured = true
    this.saveConfig(config)
  }

  /**
   * Load configuration from localStorage
   */
  loadConfig(): EmailConfig | null {
    const saved = localStorage.getItem('ticktick_email_config')
    if (saved) {
      try {
        this.config = JSON.parse(saved)
        this.isConfigured = true
        return this.config
      } catch (error) {
        console.error('Failed to load email config:', error)
      }
    }
    return null
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(config: EmailConfig): void {
    // Don't save sensitive data in localStorage in production
    // In production, this should be stored on the server
    const safeConfig = {
      provider: config.provider,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      // Don't save API keys in localStorage
    }
    localStorage.setItem('ticktick_email_config', JSON.stringify(safeConfig))
  }

  /**
   * Check if email service is configured
   */
  isEmailConfigured(): boolean {
    if (!this.isConfigured) {
      this.loadConfig()
    }
    return this.isConfigured && this.config !== null
  }

  /**
   * Send email using configured provider
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isEmailConfigured() || !this.config) {
      console.warn('Email service is not configured')
      return false
    }

    try {
      switch (this.config.provider) {
        case 'resend':
          return await this.sendViaResend(options)
        case 'sendgrid':
          return await this.sendViaSendGrid(options)
        case 'mailgun':
          return await this.sendViaMailgun(options)
        case 'smtp':
          return await this.sendViaSMTP(options)
        case 'custom':
          return await this.sendViaCustomAPI(options)
        default:
          console.error('Unknown email provider')
          return false
      }
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  /**
   * Send email via Resend API (recommended - simple and free tier)
   */
  private async sendViaResend(options: EmailOptions): Promise<boolean> {
    if (!this.config?.apiKey) {
      console.error('Resend API key is not configured')
      return false
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          from: this.config.fromEmail || 'TickTick <noreply@ticktick.app>',
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || this.stripHtml(options.html)
        })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Resend API error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Failed to send email via Resend:', error)
      return false
    }
  }

  /**
   * Send email via SendGrid API
   */
  private async sendViaSendGrid(options: EmailOptions): Promise<boolean> {
    if (!this.config?.apiKey) {
      console.error('SendGrid API key is not configured')
      return false
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: options.to }]
          }],
          from: {
            email: this.config.fromEmail || 'noreply@ticktick.app',
            name: this.config.fromName || 'TickTick'
          },
          subject: options.subject,
          content: [
            {
              type: 'text/html',
              value: options.html
            },
            {
              type: 'text/plain',
              value: options.text || this.stripHtml(options.html)
            }
          ]
        })
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('SendGrid API error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Failed to send email via SendGrid:', error)
      return false
    }
  }

  /**
   * Send email via Mailgun API
   */
  private async sendViaMailgun(options: EmailOptions): Promise<boolean> {
    if (!this.config?.apiKey) {
      console.error('Mailgun API key is not configured')
      return false
    }

    // Extract domain from API key or use default
    const domain = this.config.fromEmail?.split('@')[1] || 'mg.ticktick.app'

    try {
      const formData = new FormData()
      formData.append('from', this.config.fromEmail || `TickTick <noreply@${domain}>`)
      formData.append('to', options.to)
      formData.append('subject', options.subject)
      formData.append('html', options.html)
      if (options.text) {
        formData.append('text', options.text)
      }

      const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${this.config.apiKey}`)}`
        },
        body: formData
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Mailgun API error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Failed to send email via Mailgun:', error)
      return false
    }
  }

  /**
   * Send email via SMTP (requires serverless function)
   */
  private async sendViaSMTP(options: EmailOptions): Promise<boolean> {
    // SMTP requires server-side implementation
    // Use serverless function or backend API
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text
        })
      })

      if (!response.ok) {
        console.error('SMTP API error')
        return false
      }

      return true
    } catch (error) {
      console.error('Failed to send email via SMTP:', error)
      return false
    }
  }

  /**
   * Send email via custom API endpoint
   */
  private async sendViaCustomAPI(options: EmailOptions): Promise<boolean> {
    const apiUrl = localStorage.getItem('ticktick_custom_email_api')
    if (!apiUrl) {
      console.error('Custom email API URL is not configured')
      return false
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text
        })
      })

      if (!response.ok) {
        console.error('Custom API error')
        return false
      }

      return true
    } catch (error) {
      console.error('Failed to send email via custom API:', error)
      return false
    }
  }

  /**
   * Strip HTML tags from HTML string
   */
  private stripHtml(html: string): string {
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  /**
   * Generate email templates
   */
  generateWelcomeEmail(userName: string, userEmail: string): EmailOptions {
    return {
      to: userEmail,
      subject: 'Добро пожаловать в TickTick! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #007AFF; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Добро пожаловать в TickTick! 🎉</h1>
            </div>
            <div class="content">
              <p>Привет, <strong>${userName}</strong>!</p>
              <p>Спасибо за регистрацию в TickTick - вашем помощнике для управления задачами и повышения продуктивности.</p>
              
              <h2>Что дальше?</h2>
              <ul>
                <li>✅ Создайте свою первую задачу</li>
                <li>📅 Установите сроки выполнения</li>
                <li>🏷️ Организуйте задачи с помощью тегов</li>
                <li>👥 Пригласите команду для совместной работы</li>
                <li>📊 Отслеживайте свою продуктивность</li>
              </ul>

              <div style="text-align: center;">
                <a href="${window.location.origin}" class="button">Начать работу</a>
              </div>

              <p>Если у вас есть вопросы, мы всегда готовы помочь!</p>
              
              <p>Удачи в достижении ваших целей! 🚀</p>
              
              <p>С уважением,<br>Команда TickTick</p>
            </div>
            <div class="footer">
              <p>Это автоматическое письмо. Пожалуйста, не отвечайте на него.</p>
              <p>© ${new Date().getFullYear()} TickTick. Все права защищены.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Добро пожаловать в TickTick!

Привет, ${userName}!

Спасибо за регистрацию в TickTick - вашем помощнике для управления задачами и повышения продуктивности.

Что дальше?
- Создайте свою первую задачу
- Установите сроки выполнения
- Организуйте задачи с помощью тегов
- Пригласите команду для совместной работы
- Отслеживайте свою продуктивность

Начать работу: ${window.location.origin}

Если у вас есть вопросы, мы всегда готовы помочь!

Удачи в достижении ваших целей!

С уважением,
Команда TickTick
      `
    }
  }

  generatePasswordResetEmail(userName: string, userEmail: string, resetToken: string): EmailOptions {
    const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}&email=${encodeURIComponent(userEmail)}`
    
    return {
      to: userEmail,
      subject: 'Сброс пароля TickTick',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007AFF; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #007AFF; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Сброс пароля</h1>
            </div>
            <div class="content">
              <p>Привет, <strong>${userName}</strong>!</p>
              <p>Вы запросили сброс пароля для вашего аккаунта TickTick.</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Сбросить пароль</a>
              </div>

              <div class="warning">
                <p><strong>⚠️ Важно:</strong></p>
                <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
                <p>Ссылка действительна в течение 1 часа.</p>
              </div>

              <p>Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:</p>
              <p style="word-break: break-all; color: #007AFF;">${resetUrl}</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  }

  generateTaskAssignmentEmail(userName: string, userEmail: string, taskTitle: string, assignedBy: string): EmailOptions {
    return {
      to: userEmail,
      subject: `Вам назначена задача: ${taskTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007AFF; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #007AFF; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Новая задача назначена</h1>
            </div>
            <div class="content">
              <p>Привет, <strong>${userName}</strong>!</p>
              <p><strong>${assignedBy}</strong> назначил(а) вам задачу:</p>
              <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #007AFF;">
                <h2>${taskTitle}</h2>
              </div>
              <div style="text-align: center;">
                <a href="${window.location.origin}" class="button">Открыть задачу</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    }
  }
}

export const emailService = new EmailService()

