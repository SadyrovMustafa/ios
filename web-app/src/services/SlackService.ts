export class SlackService {
  private static webhookUrl = 'YOUR_SLACK_WEBHOOK_URL'

  static async sendNotification(message: string, channel?: string): Promise<void> {
    if (!this.webhookUrl || this.webhookUrl === 'YOUR_SLACK_WEBHOOK_URL') {
      throw new Error('Slack webhook URL not configured')
    }

    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: message,
        channel: channel || '#general'
      })
    })
  }

  static async notifyTaskCreated(taskTitle: string, assignee?: string): Promise<void> {
    await this.sendNotification(`✅ New task created: *${taskTitle}*${assignee ? ` (assigned to ${assignee})` : ''}`)
  }

  static async notifyTaskCompleted(taskTitle: string, completedBy?: string): Promise<void> {
    await this.sendNotification(`🎉 Task completed: *${taskTitle}*${completedBy ? ` by ${completedBy}` : ''}`)
  }

  static async notifyTaskOverdue(taskTitle: string): Promise<void> {
    await this.sendNotification(`⚠️ Task overdue: *${taskTitle}*`)
  }
}

