export class SecurityService {
  private static encryptionKey = 'ticktick_encryption_key'

  // Simple encryption (for demo - use proper encryption in production)
  static encrypt(data: string): string {
    // In production, use Web Crypto API or a proper encryption library
    return btoa(data) // Base64 encoding (not secure, just for demo)
  }

  static decrypt(encrypted: string): string {
    try {
      return atob(encrypted) // Base64 decoding
    } catch {
      return ''
    }
  }

  static async hashPassword(password: string): Promise<string> {
    // In production, use proper hashing (bcrypt, argon2, etc.)
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password)
    return passwordHash === hash
  }

  static generate2FACode(): string {
    // Generate 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  static async storeEncrypted(key: string, value: string): Promise<void> {
    const encrypted = this.encrypt(value)
    localStorage.setItem(key, encrypted)
  }

  static async getDecrypted(key: string): Promise<string | null> {
    const encrypted = localStorage.getItem(key)
    if (!encrypted) return null
    return this.decrypt(encrypted)
  }
}

