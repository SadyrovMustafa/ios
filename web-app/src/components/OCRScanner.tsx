import { useState, useRef } from 'react'
import { OCRService, OCRResult } from '../services/OCRService'
import { TaskManager } from '../services/TaskManager'
import { toastService } from '../services/ToastService'
import './OCRScanner.css'

interface OCRScannerProps {
  taskManager: TaskManager
  onClose?: () => void
  onTasksCreated?: (taskCount: number) => void
}

export default function OCRScanner({ taskManager, onClose, onTasksCreated }: OCRScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<OCRResult | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [extractedTasks, setExtractedTasks] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toastService.error('Пожалуйста, выберите изображение')
      return
    }

    // Показываем превью
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    setIsProcessing(true)
    setResult(null)
    setExtractedTasks([])

    try {
      await OCRService.initialize()
      const ocrResult = await OCRService.recognizeText(file)
      setResult(ocrResult)
      
      // Извлекаем задачи из текста
      const tasks = OCRService.extractTasksFromText(ocrResult.text)
      setExtractedTasks(tasks)

      toastService.success('Текст распознан успешно!')
    } catch (error) {
      console.error('OCR error:', error)
      toastService.error('Ошибка распознавания текста. Убедитесь, что установлен tesseract.js')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateTasks = () => {
    if (extractedTasks.length === 0) {
      toastService.error('Нет задач для создания')
      return
    }

    const lists = taskManager.getLists()
    if (lists.length === 0) {
      toastService.error('Сначала создайте список задач')
      return
    }

    const defaultList = lists[0]
    let createdCount = 0

    extractedTasks.forEach(taskText => {
      if (taskText.trim().length > 0) {
        taskManager.addTask({
          title: taskText.trim(),
          notes: `Создано из OCR сканирования\n\nРаспознанный текст:\n${result?.text || ''}`,
          listId: defaultList.id,
          isCompleted: false,
          priority: 'none'
        })
        createdCount++
      }
    })

    toastService.success(`Создано ${createdCount} задач`)
    if (onTasksCreated) {
      onTasksCreated(createdCount)
    }
    if (onClose) {
      onClose()
    }
  }

  const handleCaptureFromCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      const video = document.createElement('video')
      video.srcObject = stream
      video.play()

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        stream.getTracks().forEach(track => track.stop())

        // Распознаем текст с canvas
        setIsProcessing(true)
        OCRService.recognizeTextFromCanvas(canvas)
          .then(ocrResult => {
            setResult(ocrResult)
            const tasks = OCRService.extractTasksFromText(ocrResult.text)
            setExtractedTasks(tasks)
            setPreview(canvas.toDataURL())
            toastService.success('Текст распознан успешно!')
          })
          .catch(error => {
            console.error('OCR error:', error)
            toastService.error('Ошибка распознавания текста')
          })
          .finally(() => {
            setIsProcessing(false)
          })
      })
    } catch (error) {
      console.error('Camera error:', error)
      toastService.error('Не удалось получить доступ к камере')
    }
  }

  return (
    <div className={`ocr-scanner ${onClose ? 'modal' : ''}`}>
      {onClose && (
        <div className="ocr-header">
          <h2>📷 Сканирование текста (OCR)</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      )}

      <div className="ocr-content">
        <div className="ocr-upload-section">
          <h3>Загрузить изображение</h3>
          <div className="upload-options">
            <button
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              📁 Выбрать файл
            </button>
            <button
              className="camera-btn"
              onClick={handleCaptureFromCamera}
              disabled={isProcessing}
            >
              📷 С камеры
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {preview && (
          <div className="ocr-preview">
            <h3>Превью изображения</h3>
            <img src={preview} alt="Preview" className="preview-image" />
          </div>
        )}

        {isProcessing && (
          <div className="ocr-processing">
            <div className="processing-spinner"></div>
            <p>Распознавание текста...</p>
          </div>
        )}

        {result && (
          <div className="ocr-result">
            <h3>Распознанный текст</h3>
            <div className="result-text">
              {result.text || <em>Текст не распознан</em>}
            </div>
            {result.confidence > 0 && (
              <div className="result-confidence">
                Уверенность: {Math.round(result.confidence)}%
              </div>
            )}
          </div>
        )}

        {extractedTasks.length > 0 && (
          <div className="extracted-tasks">
            <h3>Извлеченные задачи ({extractedTasks.length})</h3>
            <ul className="tasks-list">
              {extractedTasks.map((task, index) => (
                <li key={index} className="task-item">
                  {task}
                </li>
              ))}
            </ul>
            <button
              className="create-tasks-btn"
              onClick={handleCreateTasks}
            >
              ✅ Создать задачи
            </button>
          </div>
        )}

        <div className="ocr-info">
          <p>ℹ️ <strong>Примечание:</strong> Для работы OCR требуется библиотека tesseract.js. 
          Установите её командой: <code>npm install tesseract.js</code></p>
        </div>
      </div>
    </div>
  )
}

