export class VibrationService {
  private static isSupported(): boolean {
    return 'vibrate' in navigator
  }

  static vibrate(pattern: number | number[]): boolean {
    if (!this.isSupported()) {
      return false
    }

    try {
      navigator.vibrate(pattern)
      return true
    } catch (error) {
      console.error('Vibration error:', error)
      return false
    }
  }

  static vibrateShort(): boolean {
    return this.vibrate(50)
  }

  static vibrateMedium(): boolean {
    return this.vibrate(100)
  }

  static vibrateLong(): boolean {
    return this.vibrate(200)
  }

  static vibrateSuccess(): boolean {
    // Короткая вибрация для успешного действия
    return this.vibrate([50, 30, 50])
  }

  static vibrateError(): boolean {
    // Длинная вибрация для ошибки
    return this.vibrate([100, 50, 100, 50, 100])
  }

  static vibrateWarning(): boolean {
    // Средняя вибрация для предупреждения
    return this.vibrate([100, 30, 100])
  }

  static vibrateTaskComplete(): boolean {
    // Специальная вибрация для выполнения задачи
    return this.vibrate([30, 20, 30, 20, 30])
  }

  static vibrateTaskCreated(): boolean {
    // Вибрация для создания задачи
    return this.vibrate([50, 20, 50])
  }

  static vibrateSwipe(): boolean {
    // Вибрация при свайпе
    return this.vibrate(30)
  }

  static stop(): void {
    if (this.isSupported()) {
      navigator.vibrate(0)
    }
  }
}

