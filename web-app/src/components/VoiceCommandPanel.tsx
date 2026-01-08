import { useState, useEffect } from 'react'
import { VoiceCommandService, VoiceCommand } from '../services/VoiceCommandService'
import './VoiceCommandPanel.css'

interface VoiceCommandPanelProps {
  onCommand: (command: VoiceCommand) => void
  onClose?: () => void
}

export default function VoiceCommandPanel({ onCommand, onClose }: VoiceCommandPanelProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null)

  useEffect(() => {
    setIsSupported(VoiceCommandService.initialize())
  }, [])

  const handleStartListening = async () => {
    if (!isSupported) {
      alert('Голосовые команды не поддерживаются в вашем браузере')
      return
    }

    try {
      setIsListening(true)
      const command = await VoiceCommandService.listenForCommand()
      if (command) {
        setLastCommand(command)
        onCommand(command)
      }
    } catch (error: any) {
      console.error('Voice command error:', error)
      alert(error.message || 'Ошибка распознавания голоса')
    } finally {
      setIsListening(false)
    }
  }

  const handleStopListening = () => {
    VoiceCommandService.stopListening()
    setIsListening(false)
  }

  return (
    <div className={`voice-command-panel ${onClose ? 'modal' : ''}`}>
      {onClose && (
        <div className="voice-command-header">
          <h2>🗣️ Голосовые команды</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      )}

      <div className="voice-command-content">
        {!isSupported ? (
          <div className="not-supported">
            <p>Голосовые команды не поддерживаются в вашем браузере.</p>
            <p>Используйте Chrome или Edge для этой функции.</p>
          </div>
        ) : (
          <>
            <div className="voice-command-controls">
              {!isListening ? (
                <button onClick={handleStartListening} className="voice-start-btn">
                  🎤 Начать прослушивание
                </button>
              ) : (
                <button onClick={handleStopListening} className="voice-stop-btn">
                  ⏹️ Остановить
                </button>
              )}
            </div>

            {isListening && (
              <div className="listening-indicator">
                <div className="pulse-ring"></div>
                <div className="pulse-ring"></div>
                <div className="pulse-ring"></div>
                <span>Слушаю...</span>
              </div>
            )}

            {lastCommand && (
              <div className="last-command">
                <h4>Последняя команда:</h4>
                <div className="command-info">
                  <span className="command-action">{lastCommand.action}</span>
                  {lastCommand.taskTitle && (
                    <span className="command-title">{lastCommand.taskTitle}</span>
                  )}
                  {lastCommand.query && (
                    <span className="command-query">{lastCommand.query}</span>
                  )}
                </div>
              </div>
            )}

            <div className="voice-commands-help">
              <h4>Доступные команды:</h4>
              <ul>
                <li>"Создай задача [название]" - создать задачу</li>
                <li>"Выполни [название]" - выполнить задачу</li>
                <li>"Удали [название]" - удалить задачу</li>
                <li>"Найди [запрос]" - поиск задач</li>
                <li>"Покажи задачи" - показать все задачи</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

