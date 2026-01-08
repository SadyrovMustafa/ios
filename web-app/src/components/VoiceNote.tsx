import { useState, useRef, useEffect } from 'react'
import './VoiceNote.css'

interface VoiceNoteProps {
  onSave: (audioUrl: string, transcript: string) => void
  onClose: () => void
}

export default function VoiceNote({ onSave, onClose }: VoiceNoteProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'ru-RU'

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        setTranscript(prev => prev + finalTranscript + interimTranscript)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      // Start audio recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start()
      }

      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Не удалось начать запись. Проверьте разрешения микрофона.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
  }

  const handleSave = () => {
    if (audioUrl) {
      onSave(audioUrl, transcript)
      onClose()
    }
  }

  const handleDelete = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    setTranscript('')
  }

  return (
    <div className="voice-note-overlay" onClick={onClose}>
      <div className="voice-note-modal" onClick={(e) => e.stopPropagation()}>
        <div className="voice-note-header">
          <h2>🎤 Голосовая заметка</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="voice-note-content">
          <div className="recording-controls">
            {!isRecording ? (
              <button
                className="record-btn"
                onClick={startRecording}
                disabled={isProcessing}
              >
                🎤 Начать запись
              </button>
            ) : (
              <button
                className="stop-btn"
                onClick={stopRecording}
              >
                ⏹️ Остановить
              </button>
            )}
          </div>

          {isRecording && (
            <div className="recording-indicator">
              <div className="pulse-dot"></div>
              <span>Идет запись...</span>
            </div>
          )}

          {transcript && (
            <div className="transcript-section">
              <label>Транскрипт:</label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="transcript-textarea"
                placeholder="Текст появится здесь..."
              />
            </div>
          )}

          {audioUrl && (
            <div className="audio-preview">
              <label>Аудио:</label>
              <audio controls src={audioUrl} className="audio-player" />
            </div>
          )}
        </div>

        <div className="voice-note-actions">
          {audioUrl && (
            <>
              <button onClick={handleDelete} className="delete-btn">
                Удалить
              </button>
              <button onClick={handleSave} className="save-btn">
                Сохранить
              </button>
            </>
          )}
          <button onClick={onClose} className="cancel-btn">
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}

