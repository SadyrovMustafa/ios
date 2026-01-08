import { Task } from '../types/Task'

export interface FileAttachmentData {
  id: string
  taskId: string
  fileName: string
  fileType: string
  fileSize: number
  data: string // base64 или blob URL
  uploadedAt: Date
}

export class FileStorageService {
  private static dbName = 'TickTickFiles'
  private static dbVersion = 1
  private static storeName = 'attachments'

  static async initializeDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('taskId', 'taskId', { unique: false })
        }
      }
    })
  }

  static async saveFile(file: File, taskId: string): Promise<FileAttachmentData> {
    const db = await this.initializeDB()
    const data = await this.fileToBase64(file)

    const attachment: FileAttachmentData = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      data,
      uploadedAt: new Date()
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.add(attachment)

      request.onsuccess = () => resolve(attachment)
      request.onerror = () => reject(request.error)
    })
  }

  static async saveFileForChat(messageId: string, file: File): Promise<string> {
    // Use taskId as messageId for storage
    const attachment = await this.saveFile(file, messageId)
    return attachment.data // Return base64 data URL
  }

  static async getFilesForTask(taskId: string): Promise<FileAttachmentData[]> {
    const db = await this.initializeDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('taskId')
      const request = index.getAll(taskId)

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  static async deleteFile(fileId: string): Promise<void> {
    const db = await this.initializeDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(fileId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  static async deleteFilesForTask(taskId: string): Promise<void> {
    const files = await this.getFilesForTask(taskId)
    await Promise.all(files.map(file => this.deleteFile(file.id)))
  }

  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  static createFileUrl(data: string): string {
    return data // Already base64 data URL
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }
}

