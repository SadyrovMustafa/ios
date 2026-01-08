export interface BlockedSite {
  id: string
  domain: string
  enabled: boolean
  createdAt: Date
}

export class SiteBlockerService {
  private static blockedSitesKey = 'ticktick_blocked_sites'
  private static isBlockingEnabledKey = 'ticktick_site_blocking_enabled'

  static isBlockingEnabled(): boolean {
    const enabled = localStorage.getItem(this.isBlockingEnabledKey)
    return enabled ? JSON.parse(enabled) : false
  }

  static setBlockingEnabled(enabled: boolean): void {
    localStorage.setItem(this.isBlockingEnabledKey, JSON.stringify(enabled))
    this.updateBlocking()
  }

  static getBlockedSites(): BlockedSite[] {
    const data = localStorage.getItem(this.blockedSitesKey)
    if (!data) return []
    return JSON.parse(data).map((site: any) => ({
      ...site,
      createdAt: new Date(site.createdAt)
    }))
  }

  static addBlockedSite(domain: string): BlockedSite {
    const sites = this.getBlockedSites()
    const newSite: BlockedSite = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      domain: domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, ''),
      enabled: true,
      createdAt: new Date()
    }
    sites.push(newSite)
    this.saveBlockedSites(sites)
    this.updateBlocking()
    return newSite
  }

  static removeBlockedSite(siteId: string): void {
    const sites = this.getBlockedSites().filter(s => s.id !== siteId)
    this.saveBlockedSites(sites)
    this.updateBlocking()
  }

  static toggleSite(siteId: string): void {
    const sites = this.getBlockedSites()
    const site = sites.find(s => s.id === siteId)
    if (site) {
      site.enabled = !site.enabled
      this.saveBlockedSites(sites)
      this.updateBlocking()
    }
  }

  static isSiteBlocked(url: string): boolean {
    if (!this.isBlockingEnabled()) return false

    const blockedSites = this.getBlockedSites().filter(s => s.enabled)
    if (blockedSites.length === 0) return false

    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()

      return blockedSites.some(site => {
        const domain = site.domain.toLowerCase()
        return hostname === domain || hostname.endsWith('.' + domain)
      })
    } catch {
      return false
    }
  }

  static getDefaultBlockedSites(): string[] {
    return [
      'facebook.com',
      'twitter.com',
      'instagram.com',
      'youtube.com',
      'reddit.com',
      'tiktok.com',
      'pinterest.com',
      'linkedin.com'
    ]
  }

  static addDefaultSites(): void {
    const defaultSites = this.getDefaultBlockedSites()
    const existingSites = this.getBlockedSites()
    const existingDomains = new Set(existingSites.map(s => s.domain))

    defaultSites.forEach(domain => {
      if (!existingDomains.has(domain)) {
        this.addBlockedSite(domain)
      }
    })
  }

  private static saveBlockedSites(sites: BlockedSite[]): void {
    localStorage.setItem(this.blockedSitesKey, JSON.stringify(sites))
  }

  private static updateBlocking(): void {
    // В реальном приложении здесь будет логика блокировки через Web Extension API
    // Для PWA мы можем только предупреждать пользователя
    if (this.isBlockingEnabled()) {
      const blockedSites = this.getBlockedSites().filter(s => s.enabled)
      console.log(`Site blocking enabled for ${blockedSites.length} sites`)
      
      // Показываем предупреждение при попытке открыть заблокированный сайт
      window.addEventListener('beforeunload', (e) => {
        if (this.isSiteBlocked(window.location.href)) {
          e.preventDefault()
          e.returnValue = 'Этот сайт заблокирован в режиме фокуса'
          return e.returnValue
        }
      })
    }
  }

  static checkAndBlock(): void {
    if (this.isBlockingEnabled() && this.isSiteBlocked(window.location.href)) {
      // Перенаправляем на страницу блокировки
      const blockedPage = document.createElement('div')
      blockedPage.id = 'site-blocked-overlay'
      blockedPage.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          color: white;
          text-align: center;
          padding: 20px;
        ">
          <div>
            <h1 style="font-size: 32px; margin-bottom: 20px;">🚫 Сайт заблокирован</h1>
            <p style="font-size: 18px; margin-bottom: 30px;">
              Этот сайт заблокирован в режиме фокуса.<br>
              Вернитесь к работе над задачами!
            </p>
            <button onclick="window.location.href='/'" style="
              padding: 12px 24px;
              background: #007AFF;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
            ">
              Вернуться к задачам
            </button>
          </div>
        </div>
      `
      document.body.appendChild(blockedPage)
    }
  }
}

