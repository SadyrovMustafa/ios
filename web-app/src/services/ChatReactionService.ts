import { ChatReaction } from './TaskChatService'
import { LocalAuthService } from './LocalAuthService'

export class ChatReactionService {
  private static reactionsKey = 'ticktick_chat_reactions'

  static addReaction(messageId: string, emoji: string, userId: string): ChatReaction {
    const reactions = this.getAllReactions()
    const user = LocalAuthService.getUserById(userId)
    
    // Remove existing reaction from this user for this message
    const filtered = reactions.filter(r => !(r.messageId === messageId && r.userId === userId && r.emoji === emoji))
    
    const newReaction: ChatReaction & { messageId: string } = {
      messageId,
      emoji,
      userId,
      userName: user?.name || 'Unknown',
      timestamp: new Date()
    }
    
    filtered.push(newReaction)
    this.saveReactions(filtered)

    return newReaction
  }

  static removeReaction(messageId: string, emoji: string, userId: string): void {
    const reactions = this.getAllReactions().filter(
      r => !(r.messageId === messageId && r.emoji === emoji && r.userId === userId)
    )
    this.saveReactions(reactions)
  }

  static getReactionsForMessage(messageId: string): ChatReaction[] {
    return this.getAllReactions()
      .filter(r => r.messageId === messageId)
      .map(({ messageId, ...reaction }) => reaction)
  }

  static getReactionCounts(messageId: string): Record<string, number> {
    const reactions = this.getAllReactions().filter(r => r.messageId === messageId)
    const counts: Record<string, number> = {}
    
    reactions.forEach(r => {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1
    })
    
    return counts
  }

  static hasUserReacted(messageId: string, emoji: string, userId: string): boolean {
    return this.getAllReactions().some(
      r => r.messageId === messageId && r.emoji === emoji && r.userId === userId
    )
  }

  private static getAllReactions(): Array<ChatReaction & { messageId: string }> {
    const data = localStorage.getItem(this.reactionsKey)
    if (!data) return []
    return JSON.parse(data).map((r: any) => ({
      ...r,
      timestamp: new Date(r.timestamp)
    }))
  }

  private static saveReactions(reactions: Array<ChatReaction & { messageId: string }>): void {
    localStorage.setItem(this.reactionsKey, JSON.stringify(reactions))
  }
}

