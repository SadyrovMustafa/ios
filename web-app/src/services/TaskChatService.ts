import { Task } from '../types/Task'
import { Mention } from './MentionService'

export interface ChatReaction {
  emoji: string
  userId: string
  userName: string
  timestamp: Date
}

export interface ChatAttachment {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  fileUrl: string
  uploadedBy: string
  uploadedAt: Date
}

export interface ChatMessage {
  id: string
  taskId: string
  userId: string
  userName: string
  message: string
  timestamp: Date
  edited?: boolean
  editedAt?: Date
  mentions?: Mention[]
  reactions?: ChatReaction[]
  attachments?: ChatAttachment[]
  voiceNoteUrl?: string
  voiceNoteDuration?: number
}

export class TaskChatService {
  private static messagesKey = 'ticktick_task_chat'

  static getMessagesForTask(taskId: string): ChatMessage[] {
    const allMessages = this.getAllMessages()
    return allMessages
      .filter(m => m.taskId === taskId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  static addMessage(
    taskId: string, 
    userId: string, 
    userName: string, 
    message: string,
    mentions?: Mention[]
  ): ChatMessage {
    const allMessages = this.getAllMessages()
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      userId,
      userName,
      message,
      timestamp: new Date(),
      mentions
    }
    allMessages.push(newMessage)
    this.saveMessages(allMessages)
    return newMessage
  }

  static editMessage(messageId: string, newMessage: string): void {
    const allMessages = this.getAllMessages()
    const message = allMessages.find(m => m.id === messageId)
    if (message) {
      message.message = newMessage
      message.edited = true
      message.editedAt = new Date()
      this.saveMessages(allMessages)
    }
  }

  static deleteMessage(messageId: string): void {
    const allMessages = this.getAllMessages().filter(m => m.id !== messageId)
    this.saveMessages(allMessages)
  }

  static getAllMessages(): ChatMessage[] {
    const data = localStorage.getItem(this.messagesKey)
    if (!data) return []
    return JSON.parse(data).map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
      editedAt: m.editedAt ? new Date(m.editedAt) : undefined
    }))
  }

  private static saveMessages(messages: ChatMessage[]): void {
    localStorage.setItem(this.messagesKey, JSON.stringify(messages))
  }
}

