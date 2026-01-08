export class GoogleCalendarService {
  private static clientId = 'YOUR_GOOGLE_CLIENT_ID'
  private static apiKey = 'YOUR_GOOGLE_API_KEY'
  private static scope = 'https://www.googleapis.com/auth/calendar'

  static async authorize(): Promise<string | null> {
    return new Promise((resolve) => {
      // Google OAuth 2.0 flow
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=token&scope=${encodeURIComponent(this.scope)}`
      
      const popup = window.open(authUrl, 'Google Auth', 'width=500,height=600')
      
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          popup?.close()
          window.removeEventListener('message', messageListener)
          resolve(event.data.token)
        }
      }
      
      window.addEventListener('message', messageListener)
    })
  }

  static async syncTasksToCalendar(tasks: Array<{ title: string; dueDate?: Date; notes?: string }>): Promise<void> {
    const token = await this.authorize()
    if (!token) throw new Error('Authorization failed')

    for (const task of tasks) {
      if (!task.dueDate) continue

      const event = {
        summary: task.title,
        description: task.notes || '',
        start: {
          dateTime: new Date(task.dueDate).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      }

      await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      })
    }
  }

  static async getCalendarEvents(startDate: Date, endDate: Date): Promise<any[]> {
    const token = await this.authorize()
    if (!token) throw new Error('Authorization failed')

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${startDate.toISOString()}&timeMax=${endDate.toISOString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    const data = await response.json()
    return data.items || []
  }
}

