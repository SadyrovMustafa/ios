export interface Mention {
  userId: string
  userName: string
  position: number // Позиция в тексте
  length: number // Длина упоминания
}

export class MentionService {
  private static readonly MENTION_PATTERN = /@(\w+)/g

  static parseMentions(text: string, availableUsers: Array<{ id: string; name: string }>): Mention[] {
    const mentions: Mention[] = []
    let match

    while ((match = this.MENTION_PATTERN.exec(text)) !== null) {
      const mentionText = match[1].toLowerCase()
      const user = availableUsers.find(
        u => u.name.toLowerCase() === mentionText || u.id.toLowerCase() === mentionText
      )

      if (user) {
        mentions.push({
          userId: user.id,
          userName: user.name,
          position: match.index,
          length: match[0].length
        })
      }
    }

    return mentions
  }

  static formatMessageWithMentions(
    text: string,
    mentions: Mention[],
    currentUserId: string
  ): string {
    let formatted = text
    let offset = 0

    // Сортируем упоминания по позиции (с конца, чтобы не сбить индексы)
    const sortedMentions = [...mentions].sort((a, b) => b.position - a.position)

    sortedMentions.forEach(mention => {
      const mentionText = `@${mention.userName}`
      const before = formatted.substring(0, mention.position + offset)
      const after = formatted.substring(mention.position + offset + mention.length)
      formatted = before + mentionText + after
      offset += mentionText.length - mention.length
    })

    return formatted
  }

  static highlightMentions(text: string, mentions: Mention[]): string {
    let result = text
    let offset = 0

    const sortedMentions = [...mentions].sort((a, b) => b.position - a.position)

    sortedMentions.forEach(mention => {
      const start = mention.position + offset
      const end = start + mention.length
      const mentionText = result.substring(start, end)
      const highlighted = `<span class="mention-highlight" data-user-id="${mention.userId}">${mentionText}</span>`
      result = result.substring(0, start) + highlighted + result.substring(end)
      offset += highlighted.length - mention.length
    })

    return result
  }

  static extractMentionedUserIds(text: string, availableUsers: Array<{ id: string; name: string }>): string[] {
    const mentions = this.parseMentions(text, availableUsers)
    return [...new Set(mentions.map(m => m.userId))]
  }
}

