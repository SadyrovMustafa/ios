import { Task, TaskList } from '../types/Task'

export interface QueuedChange {
  id: string
  type: 'create' | 'update' | 'delete'
  entityType: 'task' | 'list'
  entityId: string
  data?: Task | TaskList
  timestamp: Date
  synced: boolean
}

export class OfflineQueue {
  private static queueKey = 'ticktick_offline_queue'
  private static dbName = 'TickTickOffline'
  private static dbVersion = 1

  static async initializeDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('queue')) {
          const store = db.createObjectStore('queue', { keyPath: 'id' })
          store.createIndex('synced', 'synced', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  static async addChange(change: Omit<QueuedChange, 'id' | 'synced'>): Promise<void> {
    const db = await this.initializeDB()
    const queuedChange: QueuedChange = {
      ...change,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      synced: false
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['queue'], 'readwrite')
      const store = transaction.objectStore('queue')
      const request = store.add(queuedChange)

      request.onsuccess = () => {
        // Trigger background sync if available
        if ('serviceWorker' in navigator && 'sync' in (self as any).registration) {
          (self as any).registration.sync.register('sync-tasks')
        }
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  static async getPendingChanges(): Promise<QueuedChange[]> {
    const db = await this.initializeDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['queue'], 'readonly')
      const store = transaction.objectStore('queue')
      const index = store.index('synced')
      const request = index.getAll(false)

      request.onsuccess = () => {
        const changes = request.result || []
        resolve(changes.map(c => ({
          ...c,
          timestamp: new Date(c.timestamp),
          data: c.data ? (c.entityType === 'task' ? {
            ...c.data,
            createdAt: new Date(c.data.createdAt),
            dueDate: c.data.dueDate ? new Date(c.data.dueDate) : undefined,
            completedAt: c.data.completedAt ? new Date(c.data.completedAt) : undefined
          } : c.data) : undefined
        })))
      }
      request.onerror = () => reject(request.error)
    })
  }

  static async markAsSynced(changeId: string): Promise<void> {
    const db = await this.initializeDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['queue'], 'readwrite')
      const store = transaction.objectStore('queue')
      const getRequest = store.get(changeId)

      getRequest.onsuccess = () => {
        const change = getRequest.result
        if (change) {
          change.synced = true
          store.put(change)
        }
        resolve()
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  static async clearSynced(): Promise<void> {
    const db = await this.initializeDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['queue'], 'readwrite')
      const store = transaction.objectStore('queue')
      const index = store.index('synced')
      const request = index.openCursor(IDBKeyRange.only(true))

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  static async getQueueSize(): Promise<number> {
    const changes = await this.getPendingChanges()
    return changes.length
  }
}

