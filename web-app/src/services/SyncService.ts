import { Task, TaskList } from '../types/Task'

export interface SyncState {
  lastSyncTime: Date
  version: number
  deviceId: string
  changes: SyncChange[]
}

export interface SyncChange {
  id: string
  type: 'create' | 'update' | 'delete'
  entityType: 'task' | 'list'
  entityId: string
  data?: Task | TaskList
  timestamp: Date
}

export class SyncService {
  private static syncStateKey = 'ticktick_sync_state'
  private static changesKey = 'ticktick_sync_changes'
  private static deviceIdKey = 'ticktick_device_id'

  static getDeviceId(): string {
    let deviceId = localStorage.getItem(this.deviceIdKey)
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem(this.deviceIdKey, deviceId)
    }
    return deviceId
  }

  static getSyncState(): SyncState {
    const data = localStorage.getItem(this.syncStateKey)
    if (!data) {
      return {
        lastSyncTime: new Date(0),
        version: 1,
        deviceId: this.getDeviceId(),
        changes: []
      }
    }
    const parsed = JSON.parse(data)
    return {
      ...parsed,
      lastSyncTime: new Date(parsed.lastSyncTime),
      changes: parsed.changes.map((c: any) => ({
        ...c,
        timestamp: new Date(c.timestamp)
      }))
    }
  }

  static saveSyncState(state: SyncState): void {
    localStorage.setItem(this.syncStateKey, JSON.stringify(state))
  }

  static addChange(change: Omit<SyncChange, 'id' | 'timestamp'>): void {
    const state = this.getSyncState()
    const newChange: SyncChange = {
      ...change,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }
    state.changes.push(newChange)
    this.saveSyncState(state)
  }

  static getPendingChanges(): SyncChange[] {
    const state = this.getSyncState()
    return state.changes
  }

  static clearChanges(): void {
    const state = this.getSyncState()
    state.changes = []
    state.lastSyncTime = new Date()
    state.version++
    this.saveSyncState(state)
  }

  static prepareForCloudSync(): {
    deviceId: string
    changes: SyncChange[]
    version: number
  } {
    const state = this.getSyncState()
    return {
      deviceId: state.deviceId,
      changes: state.changes,
      version: state.version
    }
  }

  static applyCloudChanges(changes: SyncChange[]): {
    tasks: Task[]
    lists: TaskList[]
  } {
    const tasks: Task[] = []
    const lists: TaskList[] = []

    changes.forEach(change => {
      if (change.entityType === 'task' && change.data) {
        tasks.push(change.data as Task)
      } else if (change.entityType === 'list' && change.data) {
        lists.push(change.data as TaskList)
      }
    })

    return { tasks, lists }
  }

  static markSynced(): void {
    const state = this.getSyncState()
    state.lastSyncTime = new Date()
    state.changes = []
    this.saveSyncState(state)
  }
}

