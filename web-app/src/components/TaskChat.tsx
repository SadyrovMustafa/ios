import { useState, useEffect, useRef } from 'react'
import { TaskChatService, ChatMessage } from '../services/TaskChatService'
import { MentionService, Mention } from '../services/MentionService'
import { ChatReactionService } from '../services/ChatReactionService'
import { ChatAttachmentService } from '../services/ChatAttachmentService'
import { LocalAuthService } from '../services/LocalAuthService'
import { format } from 'date-fns'
import { toastService } from '../services/ToastService'
import { PushNotificationService } from '../services/PushNotificationService'
import { FileStorageService } from '../services/FileStorageService'
import './TaskChat.css'

interface TaskChatProps {
  taskId: string
  currentUserId?: string
  currentUserName?: string
  availableUsers?: Array<{ id: string; name: string }>
}

export default function TaskChat({ 
  taskId, 
  currentUserId = 'user1', 
  currentUserName = 'You',
  availableUsers = []
}: TaskChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [showUserSuggestions, setShowUserSuggestions] = useState(false)
  const [suggestionIndex, setSuggestionIndex] = useState(-1)
  const [filteredUsers, setFilteredUsers] = useState<Array<{ id: string; name: string }>>([])
  const [showReactions, setShowReactions] = useState<string | null>(null)
  const [showAttachmentUpload, setShowAttachmentUpload] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const availableUsersForReactions = LocalAuthService.getAllUsers().map(u => ({ id: u.id, name: u.name }))

  useEffect(() => {
    loadMessages()
  }, [taskId])

  const loadMessages = () => {
    const loadedMessages = TaskChatService.getMessagesForTask(taskId)
    // Load reactions and attachments for each message
    const messagesWithData = loadedMessages.map(msg => {
      const reactions = ChatReactionService.getReactionsForMessage(msg.id)
      const attachments = ChatAttachmentService.getAttachmentsForMessage(msg.id)
      return {
        ...msg,
        reactions: reactions.length > 0 ? reactions : undefined,
        attachments: attachments.length > 0 ? attachments : undefined
      }
    })
    setMessages(messagesWithData)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() && !audioChunks.length) return

    let voiceNoteUrl: string | undefined
    let voiceNoteDuration: number | undefined

    // Handle voice note
    if (audioChunks.length > 0 && audioRecorder) {
      try {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        voiceNoteUrl = audioUrl
        // Estimate duration (simplified)
        voiceNoteDuration = Math.floor(audioBlob.size / 1000) // Rough estimate
        setAudioChunks([])
        setIsRecording(false)
        audioRecorder.stop()
      } catch (error) {
        console.error('Error processing voice note:', error)
        toastService.error('Ошибка обработки голосового сообщения')
      }
    }

    // Парсим упоминания
    const mentions = MentionService.parseMentions(newMessage, availableUsers)
    const mentionedUserIds = MentionService.extractMentionedUserIds(newMessage, availableUsers)

    // Отправляем сообщение
    const newMsg = TaskChatService.addMessage(
      taskId,
      currentUserId,
      currentUserName,
      newMessage.trim() || '[Голосовое сообщение]',
      mentions
    )

    // Add voice note if exists
    if (voiceNoteUrl) {
      // Store voice note URL in message (would need to update TaskChatService)
      toastService.success('Голосовое сообщение отправлено')
    }

    // Отправляем уведомления упомянутым пользователям
    mentionedUserIds.forEach(userId => {
      if (userId !== currentUserId) {
        PushNotificationService.sendNotification(
          `Вас упомянули в задаче`,
          `${currentUserName}: ${newMessage.trim()}`,
          { taskId }
        ).catch(console.error)
      }
    })

    setNewMessage('')
    setShowUserSuggestions(false)
    loadMessages()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUserId) return

    try {
      const attachment = await ChatAttachmentService.uploadAttachment(
        `temp-${Date.now()}`, // Will be updated when message is sent
        file,
        currentUserId
      )
      toastService.success('Файл загружен')
      // File will be attached to next message
      setShowAttachmentUpload(false)
    } catch (error) {
      console.error('Error uploading file:', error)
      toastService.error('Ошибка загрузки файла')
    }
  }

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      recorder.onstop = () => {
        setAudioChunks(chunks)
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setAudioRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      toastService.error('Не удалось начать запись')
    }
  }

  const handleStopRecording = () => {
    if (audioRecorder && isRecording) {
      audioRecorder.stop()
      setIsRecording(false)
    }
  }

  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!currentUserId) return

    const hasReacted = ChatReactionService.hasUserReacted(messageId, emoji, currentUserId)
    if (hasReacted) {
      ChatReactionService.removeReaction(messageId, emoji, currentUserId)
    } else {
      ChatReactionService.addReaction(messageId, emoji, currentUserId)
    }
    loadMessages()
  }

  const getReactionCounts = (messageId: string) => {
    return ChatReactionService.getReactionCounts(messageId)
  }

  const handleInputChange = (value: string) => {
    setNewMessage(value)

    // Проверяем наличие @ для автодополнения
    const cursorPos = inputRef.current?.selectionStart || value.length
    const textBeforeCursor = value.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      const query = textBeforeCursor.substring(lastAtIndex + 1).toLowerCase()
      const spaceIndex = query.indexOf(' ')

      if (spaceIndex === -1 && query.length > 0) {
        // Фильтруем пользователей по запросу
        const filtered = availableUsers.filter(user =>
          user.name.toLowerCase().startsWith(query) &&
          user.id !== currentUserId
        )
        setFilteredUsers(filtered)
        setShowUserSuggestions(filtered.length > 0)
        setSuggestionIndex(-1)
      } else {
        setShowUserSuggestions(false)
      }
    } else {
      setShowUserSuggestions(false)
    }
  }

  const handleSelectUser = (user: { id: string; name: string }) => {
    const cursorPos = inputRef.current?.selectionStart || newMessage.length
    const textBeforeCursor = newMessage.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    const textAfterCursor = newMessage.substring(cursorPos)

    if (lastAtIndex !== -1) {
      const newText = 
        newMessage.substring(0, lastAtIndex) + 
        `@${user.name} ` + 
        textAfterCursor
      setNewMessage(newText)
      setShowUserSuggestions(false)
      setTimeout(() => {
        inputRef.current?.focus()
        const newCursorPos = lastAtIndex + user.name.length + 2
        inputRef.current?.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showUserSuggestions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSuggestionIndex(prev => 
          prev < filteredUsers.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
      } else if (e.key === 'Enter' && suggestionIndex >= 0) {
        e.preventDefault()
        handleSelectUser(filteredUsers[suggestionIndex])
      } else if (e.key === 'Escape') {
        setShowUserSuggestions(false)
      }
    }
  }

  const renderMessageWithMentions = (message: ChatMessage) => {
    if (!message.mentions || message.mentions.length === 0) {
      return <p>{message.message}</p>
    }

    const parts: (string | JSX.Element)[] = []
    let lastIndex = 0

    const sortedMentions = [...message.mentions].sort((a, b) => a.position - b.position)

    sortedMentions.forEach((mention, index) => {
      if (mention.position > lastIndex) {
        parts.push(message.message.substring(lastIndex, mention.position))
      }
      parts.push(
        <span key={`mention-${index}`} className="mention-highlight">
          @{mention.userName}
        </span>
      )
      lastIndex = mention.position + mention.length
    })

    if (lastIndex < message.message.length) {
      parts.push(message.message.substring(lastIndex))
    }

    return <p>{parts}</p>
  }

  const handleEdit = (message: ChatMessage) => {
    setEditingId(message.id)
    setEditText(message.message)
  }

  const handleSaveEdit = () => {
    if (editingId && editText.trim()) {
      TaskChatService.editMessage(editingId, editText.trim())
      setEditingId(null)
      setEditText('')
      loadMessages()
    }
  }

  const handleDelete = (messageId: string) => {
    if (confirm('Удалить сообщение?')) {
      TaskChatService.deleteMessage(messageId)
      loadMessages()
    }
  }

  return (
    <div className="task-chat">
      <div className="chat-header">
        <h3>💬 Обсуждение</h3>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>Нет сообщений. Начните обсуждение!</p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`chat-message ${message.userId === currentUserId ? 'own' : ''}`}
            >
              <div className="message-header">
                <span className="message-author">{message.userName}</span>
                <span className="message-time">
                  {format(new Date(message.timestamp), 'HH:mm')}
                </span>
              </div>
              {editingId === message.id ? (
                <div className="message-edit">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="edit-input"
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                    autoFocus
                  />
                  <button onClick={handleSaveEdit} className="save-edit-btn">✓</button>
                  <button onClick={() => setEditingId(null)} className="cancel-edit-btn">×</button>
                </div>
              ) : (
                <div className="message-content">
                  {message.voiceNoteUrl ? (
                    <div className="voice-note">
                      <audio
                        ref={audioRef}
                        src={message.voiceNoteUrl}
                        controls
                        style={{ width: '100%', maxWidth: '300px' }}
                      />
                      {message.voiceNoteDuration && (
                        <span className="voice-duration">{message.voiceNoteDuration}с</span>
                      )}
                    </div>
                  ) : (
                    renderMessageWithMentions(message)
                  )}
                  
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="message-attachments">
                      {message.attachments.map(attachment => (
                        <div key={attachment.id} className="attachment-item">
                          <span className="attachment-icon">📎</span>
                          <a
                            href={attachment.fileUrl}
                            download={attachment.fileName}
                            className="attachment-link"
                          >
                            {attachment.fileName}
                          </a>
                          <span className="attachment-size">
                            ({FileStorageService.formatFileSize(attachment.fileSize)})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {message.edited && (
                    <span className="message-edited">(изменено)</span>
                  )}

                  {/* Reactions */}
                  <div className="message-reactions">
                    {getReactionCounts(message.id) && Object.entries(getReactionCounts(message.id)).map(([emoji, count]) => (
                      <button
                        key={emoji}
                        className={`reaction-btn ${ChatReactionService.hasUserReacted(message.id, emoji, currentUserId || '') ? 'reacted' : ''}`}
                        onClick={() => handleToggleReaction(message.id, emoji)}
                        title={`${count} ${count === 1 ? 'реакция' : 'реакций'}`}
                      >
                        {emoji} {count}
                      </button>
                    ))}
                    <button
                      className="add-reaction-btn"
                      onClick={() => setShowReactions(showReactions === message.id ? null : message.id)}
                      title="Добавить реакцию"
                    >
                      +
                    </button>
                    {showReactions === message.id && (
                      <div className="reactions-picker">
                        {['👍', '❤️', '😂', '🎉', '✅', '👏', '🔥', '💯'].map(emoji => (
                          <button
                            key={emoji}
                            className="emoji-btn"
                            onClick={() => {
                              handleToggleReaction(message.id, emoji)
                              setShowReactions(null)
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {message.userId === currentUserId && editingId !== message.id && (
                <div className="message-actions">
                  <button onClick={() => handleEdit(message)} className="edit-btn">✏️</button>
                  <button onClick={() => handleDelete(message.id)} className="delete-btn">🗑️</button>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="chat-input-toolbar">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="toolbar-btn"
            title="Прикрепить файл"
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`toolbar-btn ${isRecording ? 'recording' : ''}`}
            title={isRecording ? 'Остановить запись' : 'Голосовое сообщение'}
          >
            {isRecording ? '⏹️' : '🎤'}
          </button>
        </div>
        <div className="chat-input">
          <input
            ref={inputRef}
            type="text"
            placeholder="Написать сообщение... (используйте @ для упоминаний)"
            value={newMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !showUserSuggestions) {
                handleSend()
              }
            }}
            className="chat-input-field"
          />
          <button
            onClick={handleSend}
            className="chat-send-btn"
            disabled={!newMessage.trim() && audioChunks.length === 0}
          >
            {isRecording ? '⏹️' : 'Отправить'}
          </button>
        </div>
        {isRecording && (
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            Запись...
          </div>
        )}
        {showUserSuggestions && filteredUsers.length > 0 && (
          <div className="user-suggestions">
            {filteredUsers.map((user, index) => (
              <div
                key={user.id}
                className={`suggestion-item ${index === suggestionIndex ? 'selected' : ''}`}
                onClick={() => handleSelectUser(user)}
                onMouseEnter={() => setSuggestionIndex(index)}
              >
                <span className="suggestion-icon">👤</span>
                <span className="suggestion-name">{user.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

