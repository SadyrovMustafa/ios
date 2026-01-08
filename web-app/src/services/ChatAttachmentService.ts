import { ChatAttachment } from './TaskChatService'
import { FileStorageService } from './FileStorageService'
import { LocalAuthService } from './LocalAuthService'

export class ChatAttachmentService {
  static async uploadAttachment(
    messageId: string,
    file: File,
    uploadedBy: string
  ): Promise<ChatAttachment> {
    // Save file using FileStorageService
    const fileUrl = await FileStorageService.saveFileForChat(messageId, file)
    
    const attachment: ChatAttachment = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileUrl,
      uploadedBy,
      uploadedAt: new Date()
    }

    // Save attachment metadata
    const attachments = this.getAllAttachments()
    attachments.push({ ...attachment, messageId })
    this.saveAttachments(attachments)

    return attachment
  }

  static getAttachmentsForMessage(messageId: string): ChatAttachment[] {
    return this.getAllAttachments()
      .filter(a => a.messageId === messageId)
      .map(({ messageId, ...attachment }) => attachment)
  }

  static deleteAttachment(attachmentId: string): void {
    const attachments = this.getAllAttachments().filter(a => a.id !== attachmentId)
    this.saveAttachments(attachments)
  }

  private static getAllAttachments(): Array<ChatAttachment & { messageId: string }> {
    const data = localStorage.getItem('ticktick_chat_attachments')
    if (!data) return []
    return JSON.parse(data).map((a: any) => ({
      ...a,
      uploadedAt: new Date(a.uploadedAt)
    }))
  }

  private static saveAttachments(attachments: Array<ChatAttachment & { messageId: string }>): void {
    localStorage.setItem('ticktick_chat_attachments', JSON.stringify(attachments))
  }
}

