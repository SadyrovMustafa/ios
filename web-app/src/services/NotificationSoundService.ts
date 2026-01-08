export interface SoundConfig {
  enabled: boolean
  volume: number // 0-1
  soundType: 'default' | 'bell' | 'chime' | 'pop' | 'ding' | 'custom'
  customSoundUrl?: string
}

export class NotificationSoundService {
  private static configKey = 'ticktick_sound_config'
  private static audioContext: AudioContext | null = null

  static getConfig(): SoundConfig {
    const data = localStorage.getItem(this.configKey)
    if (!data) {
      return {
        enabled: true,
        volume: 0.5,
        soundType: 'default'
      }
    }
    return JSON.parse(data)
  }

  static setConfig(config: SoundConfig): void {
    localStorage.setItem(this.configKey, JSON.stringify(config))
  }

  static async playSound(type: 'task-complete' | 'task-created' | 'reminder' | 'error' = 'task-complete'): Promise<void> {
    const config = this.getConfig()
    if (!config.enabled) return

    try {
      const audio = new Audio()
      audio.volume = config.volume

      switch (config.soundType) {
        case 'default':
          audio.src = this.getDefaultSound(type)
          break
        case 'bell':
          audio.src = this.getBellSound()
          break
        case 'chime':
          audio.src = this.getChimeSound()
          break
        case 'pop':
          audio.src = this.getPopSound()
          break
        case 'ding':
          audio.src = this.getDingSound()
          break
        case 'custom':
          if (config.customSoundUrl) {
            audio.src = config.customSoundUrl
          } else {
            audio.src = this.getDefaultSound(type)
          }
          break
      }

      await audio.play()
    } catch (error) {
      console.error('Error playing sound:', error)
      // Fallback to Web Audio API
      this.playTone(type)
    }
  }

  private static getDefaultSound(type: string): string {
    // Используем data URI для простых звуков
    return this.getToneDataUri(type)
  }

  private static getBellSound(): string {
    return this.getToneDataUri('bell')
  }

  private static getChimeSound(): string {
    return this.getToneDataUri('chime')
  }

  private static getPopSound(): string {
    return this.getToneDataUri('pop')
  }

  private static getDingSound(): string {
    return this.getToneDataUri('ding')
  }

  private static getToneDataUri(type: string): string {
    // Генерируем простой тон через Web Audio API
    return '' // Будет использоваться playTone
  }

  private static playTone(type: string): void {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      const ctx = this.audioContext
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      const config = this.getConfig()
      gainNode.gain.value = config.volume

      switch (type) {
        case 'task-complete':
          oscillator.frequency.value = 800
          oscillator.type = 'sine'
          break
        case 'task-created':
          oscillator.frequency.value = 600
          oscillator.type = 'sine'
          break
        case 'reminder':
          oscillator.frequency.value = 1000
          oscillator.type = 'sine'
          break
        case 'error':
          oscillator.frequency.value = 400
          oscillator.type = 'square'
          break
        default:
          oscillator.frequency.value = 600
          oscillator.type = 'sine'
      }

      oscillator.start()
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      oscillator.stop(ctx.currentTime + 0.3)
    } catch (error) {
      console.error('Error playing tone:', error)
    }
  }

  static async testSound(): Promise<void> {
    await this.playSound('task-complete')
  }
}

