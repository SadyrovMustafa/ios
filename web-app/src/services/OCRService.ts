// OCR Service using Tesseract.js
// Note: Requires tesseract.js library: npm install tesseract.js

export interface OCRResult {
  text: string
  confidence: number
  words: Array<{
    text: string
    bbox: { x0: number; y0: number; x1: number; y1: number }
    confidence: number
  }>
}

export class OCRService {
  private static worker: any = null
  private static isInitialized = false

  static async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Dynamic import of Tesseract.js
      let createWorker: any;
      try {
        const tesseract = await import('tesseract.js');
        createWorker = tesseract.createWorker;
      } catch (importError) {
        console.error('Failed to import tesseract.js:', importError);
        throw new Error('OCR library not available. Please ensure tesseract.js is installed: npm install tesseract.js');
      }
      
      this.worker = await createWorker('eng+rus', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
          }
        }
      })
      this.isInitialized = true
      console.log('OCR Service initialized')
    } catch (error) {
      console.error('Failed to initialize OCR:', error)
      throw new Error('OCR initialization failed. Please install tesseract.js: npm install tesseract.js')
    }
  }

  static async recognizeText(imageFile: File | Blob | string): Promise<OCRResult> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.worker) {
      throw new Error('OCR worker not initialized')
    }

    try {
      const { data } = await this.worker.recognize(imageFile)
      
      return {
        text: data.text.trim(),
        confidence: data.confidence || 0,
        words: data.words?.map((word: any) => ({
          text: word.text,
          bbox: word.bbox,
          confidence: word.confidence || 0
        })) || []
      }
    } catch (error) {
      console.error('OCR recognition failed:', error)
      throw new Error('Failed to recognize text from image')
    }
  }

  static async recognizeTextFromImageUrl(imageUrl: string): Promise<OCRResult> {
    return this.recognizeText(imageUrl)
  }

  static async recognizeTextFromCanvas(canvas: HTMLCanvasElement): Promise<OCRResult> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('Failed to convert canvas to blob'))
          return
        }
        try {
          const result = await this.recognizeText(blob)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }, 'image/png')
    })
  }

  static async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
      this.isInitialized = false
    }
  }

  static extractTasksFromText(text: string): string[] {
    // Простое извлечение задач из текста
    // Ищем строки, начинающиеся с дефиса, номера или маркера
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    const tasks: string[] = []

    lines.forEach(line => {
      const trimmed = line.trim()
      // Проверяем паттерны: "- задача", "1. задача", "• задача", "* задача"
      if (/^[-•*]\s/.test(trimmed) || /^\d+[.)]\s/.test(trimmed)) {
        tasks.push(trimmed.replace(/^[-•*\d.)]\s*/, '').trim())
      } else if (trimmed.length > 3) {
        // Если строка достаточно длинная, считаем её задачей
        tasks.push(trimmed)
      }
    })

    return tasks
  }
}

