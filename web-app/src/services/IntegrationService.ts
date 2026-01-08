export class IntegrationService {
  // Calendar integration (iCal format)
  static exportToCalendar(tasks: Array<{ title: string; dueDate?: Date; notes?: string }>): string {
    let ical = 'BEGIN:VCALENDAR\n'
    ical += 'VERSION:2.0\n'
    ical += 'PRODID:-//TickTick//Task Manager//EN\n'
    ical += 'CALSCALE:GREGORIAN\n'

    tasks.forEach((task, index) => {
      if (!task.dueDate) return
      
      const startDate = new Date(task.dueDate)
      const endDate = new Date(startDate)
      endDate.setHours(endDate.getHours() + 1)

      ical += 'BEGIN:VEVENT\n'
      ical += `UID:task-${index}-${Date.now()}@ticktick\n`
      ical += `DTSTART:${this.formatDateForICal(startDate)}\n`
      ical += `DTEND:${this.formatDateForICal(endDate)}\n`
      ical += `SUMMARY:${this.escapeICal(task.title)}\n`
      if (task.notes) {
        ical += `DESCRIPTION:${this.escapeICal(task.notes)}\n`
      }
      ical += 'END:VEVENT\n'
    })

    ical += 'END:VCALENDAR\n'
    return ical
  }

  static downloadCalendar(tasks: Array<{ title: string; dueDate?: Date; notes?: string }>): void {
    const ical = this.exportToCalendar(tasks)
    const blob = new Blob([ical], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'ticktick-tasks.ics'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Email integration
  static shareViaEmail(tasks: Array<{ title: string; isCompleted: boolean }>): void {
    const subject = encodeURIComponent('My Tasks from TickTick')
    const completed = tasks.filter(t => t.isCompleted).length
    const active = tasks.filter(t => !t.isCompleted).length
    const body = encodeURIComponent(
      `Tasks Summary:\n\n` +
      `Total: ${tasks.length}\n` +
      `Completed: ${completed}\n` +
      `Active: ${active}\n\n` +
      tasks.map(t => `${t.isCompleted ? '✓' : '○'} ${t.title}`).join('\n')
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  private static formatDateForICal(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  private static escapeICal(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
  }
}

