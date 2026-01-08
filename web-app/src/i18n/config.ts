import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      'app.title': 'TickTick',
      'task.new': 'New Task',
      'task.complete': 'Complete',
      'task.delete': 'Delete',
      'list.new': 'New List',
      'search.placeholder': 'Search tasks...',
      'filter.all': 'All',
      'filter.active': 'Active',
      'filter.completed': 'Completed',
      'stats.total': 'Total Tasks',
      'stats.active': 'Active',
      'stats.completed': 'Completed'
    }
  },
  ru: {
    translation: {
      'app.title': 'TickTick',
      'task.new': 'Новая задача',
      'task.complete': 'Выполнить',
      'task.delete': 'Удалить',
      'list.new': 'Новый список',
      'search.placeholder': 'Поиск задач...',
      'filter.all': 'Все',
      'filter.active': 'Активные',
      'filter.completed': 'Выполненные',
      'stats.total': 'Всего задач',
      'stats.active': 'Активных',
      'stats.completed': 'Выполнено'
    }
  },
  kk: {
    translation: {
      'app.title': 'TickTick',
      'task.new': 'Жаңа тапсырма',
      'task.complete': 'Орындау',
      'task.delete': 'Жою',
      'list.new': 'Жаңа тізім',
      'search.placeholder': 'Тапсырмаларды іздеу...',
      'filter.all': 'Барлығы',
      'filter.active': 'Белсенді',
      'filter.completed': 'Орындалған',
      'stats.total': 'Барлық тапсырмалар',
      'stats.active': 'Белсенді',
      'stats.completed': 'Орындалды'
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: navigator.language.split('-')[0] || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n

