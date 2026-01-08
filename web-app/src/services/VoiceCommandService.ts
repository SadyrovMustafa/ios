export interface VoiceCommand {
  action: 'create' | 'complete' | 'delete' | 'search' | 'show'
  taskTitle?: string
  taskId?: string
  query?: string
}

export class VoiceCommandService {
  private static recognition: any = null

  static initialize(): boolean {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      this.recognition = new SpeechRecognition()
      this.recognition.continuous = false
      this.recognition.interimResults = false
      this.recognition.lang = 'ru-RU'
      return true
    }
    return false
  }

  static async listenForCommand(): Promise<VoiceCommand | null> {
    if (!this.recognition) {
      if (!this.initialize()) {
        throw new Error('Speech recognition not supported')
      }
    }

    return new Promise((resolve, reject) => {
      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase()
        const command = this.parseCommand(transcript)
        resolve(command)
      }

      this.recognition.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`))
      }

      this.recognition.onend = () => {
        // Recognition ended
      }

      this.recognition.start()
    })
  }

  private static parseCommand(transcript: string): VoiceCommand | null {
    // Создать задачу
    if (transcript.includes('создай') || transcript.includes('добавь') || transcript.includes('новая задача')) {
      const titleMatch = transcript.match(/(?:создай|добавь|новая задача)\s+(.+)/i)
      return {
        action: 'create',
        taskTitle: titleMatch ? titleMatch[1].trim() : 'Новая задача'
      }
    }

    // Выполнить задачу
    if (transcript.includes('выполни') || transcript.includes('заверши') || transcript.includes('сделано')) {
      const titleMatch = transcript.match(/(?:выполни|заверши|сделано)\s+(.+)/i)
      return {
        action: 'complete',
        taskTitle: titleMatch ? titleMatch[1].trim() : undefined
      }
    }

    // Удалить задачу
    if (transcript.includes('удали') || transcript.includes('убрать')) {
      const titleMatch = transcript.match(/(?:удали|убрать)\s+(.+)/i)
      return {
        action: 'delete',
        taskTitle: titleMatch ? titleMatch[1].trim() : undefined
      }
    }

    // Поиск
    if (transcript.includes('найди') || transcript.includes('поиск') || transcript.includes('покажи')) {
      const queryMatch = transcript.match(/(?:найди|поиск|покажи)\s+(.+)/i)
      return {
        action: 'search',
        query: queryMatch ? queryMatch[1].trim() : undefined
      }
    }

    // Показать задачи
    if (transcript.includes('покажи задачи') || transcript.includes('мои задачи')) {
      return {
        action: 'show'
      }
    }

    return null
  }

  static stopListening(): void {
    if (this.recognition) {
      this.recognition.stop()
    }
  }
}

