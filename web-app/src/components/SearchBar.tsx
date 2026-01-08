import { useState, useEffect, useRef } from 'react'
import './SearchBar.css'

interface SearchBarProps {
  onSearch: (query: string) => void
  onAdvancedSearch?: () => void
  placeholder?: string
}

export default function SearchBar({ onSearch, onAdvancedSearch, placeholder = 'Search tasks...' }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'ru-RU'

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setQuery(transcript)
        onSearch(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onSearch])

  const startVoiceSearch = () => {
    if (!recognitionRef.current) {
      alert('Голосовой поиск не поддерживается в вашем браузере')
      return
    }

    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch (error) {
      console.error('Error starting voice search:', error)
      setIsListening(false)
    }
  }

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    onSearch(value)
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
  }

  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
      />
      <div className="search-actions">
        {('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && (
          <button
            className={`search-voice ${isListening ? 'listening' : ''}`}
            onClick={isListening ? stopVoiceSearch : startVoiceSearch}
            aria-label="Voice search"
            title={isListening ? 'Остановить запись' : 'Голосовой поиск'}
          >
            {isListening ? '⏹️' : '🎤'}
          </button>
        )}
        {query && (
          <button className="search-clear" onClick={handleClear} aria-label="Clear search">
            ×
          </button>
        )}
        {onAdvancedSearch && (
          <button className="search-advanced" onClick={onAdvancedSearch} aria-label="Advanced search">
            ⚙️
          </button>
        )}
      </div>
    </div>
  )
}

