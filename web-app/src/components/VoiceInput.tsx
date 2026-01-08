import { useState, useEffect, useRef } from 'react'
import './VoiceInput.css'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  onClose: () => void
}

export default function VoiceInput({ onTranscript, onClose }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser')
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
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

      setTranscript(finalTranscript + interimTranscript)
    }

    recognition.onerror = (event: any) => {
      setError(`Error: ${event.error}`)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setError(null)
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleSave = () => {
    if (transcript.trim()) {
      onTranscript(transcript.trim())
      onClose()
    }
  }

  if (error && !recognitionRef.current) {
    return (
      <div className="voice-input-overlay" onClick={onClose}>
        <div className="voice-input-modal" onClick={(e) => e.stopPropagation()}>
          <div className="voice-input-header">
            <h2>🎤 Voice Input</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="voice-input-content">
            <p className="error-message">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="voice-input-overlay" onClick={onClose}>
      <div className="voice-input-modal" onClick={(e) => e.stopPropagation()}>
        <div className="voice-input-header">
          <h2>🎤 Voice Input</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="voice-input-content">
          <div className="voice-visualizer">
            <div className={`voice-circle ${isListening ? 'listening' : ''}`}>
              {isListening ? '🎤' : '🔇'}
            </div>
            <p className="voice-status">
              {isListening ? 'Listening...' : 'Click to start recording'}
            </p>
          </div>

          <div className="voice-transcript">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your speech will appear here..."
              className="transcript-textarea"
            />
          </div>

          {error && (
            <p className="error-message">{error}</p>
          )}

          <div className="voice-actions">
            <button
              onClick={toggleListening}
              className={`voice-btn ${isListening ? 'stop' : 'start'}`}
            >
              {isListening ? '⏹️ Stop' : '▶️ Start Recording'}
            </button>
            <button
              onClick={handleSave}
              disabled={!transcript.trim()}
              className="voice-btn save"
            >
              ✓ Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

