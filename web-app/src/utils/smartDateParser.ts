import { addDays, addWeeks, addMonths, addYears, startOfWeek, nextDay, parse, format, isToday, isTomorrow, isYesterday } from 'date-fns'
import { ru } from 'date-fns/locale'

export interface ParsedDate {
  date: Date | null
  text: string
  isValid: boolean
}

const DAYS_OF_WEEK: Record<string, number> = {
  'понедельник': 1,
  'вторник': 2,
  'среда': 3,
  'четверг': 4,
  'пятница': 5,
  'суббота': 6,
  'воскресенье': 0,
  'пн': 1,
  'вт': 2,
  'ср': 3,
  'чт': 4,
  'пт': 5,
  'сб': 6,
  'вс': 0
}

export function parseSmartDate(input: string): ParsedDate {
  if (!input || !input.trim()) {
    return { date: null, text: input, isValid: false }
  }

  const text = input.trim().toLowerCase()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Сегодня
  if (text === 'сегодня' || text === 'today') {
    return { date: new Date(today), text: 'Сегодня', isValid: true }
  }

  // Завтра
  if (text === 'завтра' || text === 'tomorrow') {
    return { date: addDays(today, 1), text: 'Завтра', isValid: true }
  }

  // Вчера
  if (text === 'вчера' || text === 'yesterday') {
    return { date: addDays(today, -1), text: 'Вчера', isValid: true }
  }

  // Послезавтра
  if (text === 'послезавтра' || text === 'day after tomorrow') {
    return { date: addDays(today, 2), text: 'Послезавтра', isValid: true }
  }

  // Через N дней
  const daysMatch = text.match(/через\s+(\d+)\s+дн/i) || text.match(/(\d+)\s+дн/i)
  if (daysMatch) {
    const days = parseInt(daysMatch[1])
    const date = addDays(today, days)
    return { date, text: `Через ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`, isValid: true }
  }

  // Через неделю
  if (text.includes('через неделю') || text.includes('next week')) {
    const date = addWeeks(today, 1)
    return { date, text: 'Через неделю', isValid: true }
  }

  // Через месяц
  if (text.includes('через месяц') || text.includes('next month')) {
    const date = addMonths(today, 1)
    return { date, text: 'Через месяц', isValid: true }
  }

  // Через год
  if (text.includes('через год') || text.includes('next year')) {
    const date = addYears(today, 1)
    return { date, text: 'Через год', isValid: true }
  }

  // Дни недели
  for (const [dayName, dayNumber] of Object.entries(DAYS_OF_WEEK)) {
    if (text.includes(dayName)) {
      const date = nextDay(today, dayNumber as 0 | 1 | 2 | 3 | 4 | 5 | 6)
      const dayNames = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']
      return { date, text: dayNames[dayNumber], isValid: true }
    }
  }

  // В конце недели
  if (text.includes('конец недели') || text.includes('end of week')) {
    const date = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 })
    return { date, text: 'Конец недели', isValid: true }
  }

  // В начале следующего месяца
  if (text.includes('начало месяца') || text.includes('start of month')) {
    const date = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    return { date, text: 'Начало месяца', isValid: true }
  }

  // В конце месяца
  if (text.includes('конец месяца') || text.includes('end of month')) {
    const date = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return { date, text: 'Конец месяца', isValid: true }
  }

  // Попытка парсинга стандартных форматов дат
  const dateFormats = [
    'dd.MM.yyyy',
    'dd/MM/yyyy',
    'yyyy-MM-dd',
    'dd-MM-yyyy',
    'MM/dd/yyyy'
  ]

  for (const formatStr of dateFormats) {
    try {
      const parsed = parse(text, formatStr, new Date())
      if (!isNaN(parsed.getTime())) {
        parsed.setHours(12, 0, 0, 0)
        return { date: parsed, text: format(parsed, 'dd.MM.yyyy'), isValid: true }
      }
    } catch (e) {
      // Продолжаем попытки
    }
  }

  // Если ничего не подошло, возвращаем исходный текст
  return { date: null, text: input, isValid: false }
}

export function formatSmartDate(date: Date): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)

  if (isToday(date)) {
    return 'Сегодня'
  }

  if (isTomorrow(date)) {
    return 'Завтра'
  }

  if (isYesterday(date)) {
    return 'Вчера'
  }

  const diffDays = Math.floor((dateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 2) {
    return 'Послезавтра'
  }

  if (diffDays === -1) {
    return 'Вчера'
  }

  if (diffDays > 0 && diffDays <= 7) {
    return format(date, 'EEEE', { locale: ru })
  }

  return format(date, 'dd.MM.yyyy')
}

