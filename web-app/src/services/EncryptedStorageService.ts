import { EncryptionService } from './EncryptionService'

export class EncryptedStorageService {
  private static encryptionKey: CryptoKey | null = null
  private static isEncryptionEnabled = false

  static async enableEncryption(password: string): Promise<void> {
    const salt = EncryptionService.generateSalt()
    const key = await EncryptionService.deriveKeyFromPassword(password, salt)
    
    // Сохраняем salt (не зашифрованный)
    localStorage.setItem('ticktick_encryption_salt', btoa(String.fromCharCode(...salt)))
    
    this.encryptionKey = key
    this.isEncryptionEnabled = true
    
    // Перешифровываем существующие данные
    await this.reencryptAllData()
  }

  static async disableEncryption(password: string): Promise<boolean> {
    if (!this.isEncryptionEnabled) return true

    // Проверяем пароль
    const saltData = localStorage.getItem('ticktick_encryption_salt')
    if (!saltData) return false

    const salt = Uint8Array.from(atob(saltData), c => c.charCodeAt(0))
    const key = await EncryptionService.deriveKeyFromPassword(password, salt)

    // Расшифровываем все данные
    await this.decryptAllData(key)

    this.encryptionKey = null
    this.isEncryptionEnabled = false
    localStorage.removeItem('ticktick_encryption_salt')

    return true
  }

  static async saveEncrypted(key: string, data: any): Promise<void> {
    if (!this.isEncryptionEnabled || !this.encryptionKey) {
      // Сохраняем без шифрования
      localStorage.setItem(key, JSON.stringify(data))
      return
    }

    const jsonData = JSON.stringify(data)
    const encrypted = await EncryptionService.encrypt(jsonData, this.encryptionKey)
    localStorage.setItem(key, encrypted)
  }

  static async loadDecrypted(key: string): Promise<any | null> {
    const encrypted = localStorage.getItem(key)
    if (!encrypted) return null

    if (!this.isEncryptionEnabled || !this.encryptionKey) {
      // Загружаем без расшифровки
      try {
        return JSON.parse(encrypted)
      } catch {
        return null
      }
    }

    try {
      const decrypted = await EncryptionService.decrypt(encrypted, this.encryptionKey)
      return JSON.parse(decrypted)
    } catch (error) {
      console.error('Decryption error:', error)
      return null
    }
  }

  private static async reencryptAllData(): Promise<void> {
    if (!this.encryptionKey) return

    const keys = ['ticktick_tasks', 'ticktick_lists', 'ticktick_tags']
    
    for (const key of keys) {
      const data = localStorage.getItem(key)
      if (data) {
        try {
          const parsed = JSON.parse(data)
          await this.saveEncrypted(key, parsed)
        } catch (error) {
          console.error(`Failed to reencrypt ${key}:`, error)
        }
      }
    }
  }

  private static async decryptAllData(key: CryptoKey): Promise<void> {
    const keys = ['ticktick_tasks', 'ticktick_lists', 'ticktick_tags']
    
    for (const storageKey of keys) {
      const encrypted = localStorage.getItem(storageKey)
      if (encrypted) {
        try {
          const decrypted = await EncryptionService.decrypt(encrypted, key)
          const parsed = JSON.parse(decrypted)
          localStorage.setItem(storageKey, JSON.stringify(parsed))
        } catch (error) {
          console.error(`Failed to decrypt ${storageKey}:`, error)
        }
      }
    }
  }

  static isEnabled(): boolean {
    return this.isEncryptionEnabled
  }
}

