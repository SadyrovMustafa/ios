# 📱 Настройка React Native приложения

## 🚀 Быстрый старт

### Вариант 1: Expo (рекомендуется для начала)

```bash
# Установить Expo CLI
npm install -g expo-cli

# Создать проект
npx create-expo-app TickTickMobile --template

# Перейти в папку
cd TickTickMobile

# Запустить
npm start
```

### Вариант 2: React Native CLI

```bash
# Установить React Native CLI
npm install -g react-native-cli

# Создать проект
npx react-native init TickTickMobile

# Запустить iOS
cd ios && pod install && cd ..
npx react-native run-ios

# Запустить Android
npx react-native run-android
```

---

## 📁 Структура проекта

```
TickTickMobile/
├── src/
│   ├── components/          # React компоненты
│   │   ├── TaskItem.tsx
│   │   ├── TaskList.tsx
│   │   └── ...
│   ├── screens/              # Экраны приложения
│   │   ├── HomeScreen.tsx
│   │   ├── TaskDetailScreen.tsx
│   │   └── ...
│   ├── services/             # Бизнес-логика
│   │   ├── TaskService.ts
│   │   ├── StorageService.ts
│   │   └── ...
│   ├── navigation/           # Навигация
│   │   └── AppNavigator.tsx
│   └── utils/
├── ios/                      # iOS нативный код
│   ├── TickTick/
│   └── TickTickWidget/      # iOS виджет
├── android/                  # Android нативный код
│   ├── app/
│   └── TickTickWidget/      # Android виджет
└── package.json
```

---

## 🔗 Интеграция с веб-версией

### Общий код

1. **Создать shared пакет:**
```bash
mkdir ticktick-shared
cd ticktick-shared
npm init -y
```

2. **Скопировать сервисы:**
```typescript
// ticktick-shared/src/services/TaskManager.ts
// Скопировать из web-app/src/services/TaskManager.ts
```

3. **Использовать в React Native:**
```typescript
import { TaskManager } from 'ticktick-shared'
```

### Синхронизация через API

1. **Создать REST API** (Node.js/Express)
2. **Использовать в React Native:**
```typescript
import axios from 'axios'

const API_URL = 'https://api.ticktick.app'

export const syncTasks = async () => {
  const response = await axios.get(`${API_URL}/tasks`)
  return response.data
}
```

---

## 📱 Виджеты

### iOS Widget (WidgetKit)

1. **Добавить Widget Extension в Xcode**
2. **Создать виджет:**
```swift
import WidgetKit
import SwiftUI

struct TasksWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: "TasksWidget",
            provider: TasksProvider()
        ) { entry in
            TasksWidgetView(entry: entry)
        }
    }
}
```

### Android Widget

1. **Создать AppWidgetProvider:**
```kotlin
class TasksWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // Обновить виджет
    }
}
```

---

## 🔔 Push уведомления

### Expo

```bash
npm install expo-notifications
```

```typescript
import * as Notifications from 'expo-notifications'

// Запросить разрешение
const { status } = await Notifications.requestPermissionsAsync()

// Отправить уведомление
await Notifications.scheduleNotificationAsync({
  content: {
    title: "Новая задача",
    body: "Не забудьте выполнить задачу",
  },
  trigger: { seconds: 2 },
})
```

### React Native

```bash
npm install @react-native-firebase/messaging
```

---

## 💾 Хранилище данных

### AsyncStorage

```bash
npm install @react-native-async-storage/async-storage
```

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'

// Сохранить
await AsyncStorage.setItem('tasks', JSON.stringify(tasks))

// Загрузить
const tasks = await AsyncStorage.getItem('tasks')
```

---

## 🎨 UI компоненты

### React Native Elements

```bash
npm install react-native-elements react-native-vector-icons
```

### React Native Paper

```bash
npm install react-native-paper
```

---

## 📚 Полезные библиотеки

```json
{
  "dependencies": {
    "@react-navigation/native": "^6.0.0",
    "@react-navigation/stack": "^6.0.0",
    "react-native-gesture-handler": "^2.0.0",
    "react-native-reanimated": "^3.0.0",
    "react-native-safe-area-context": "^4.0.0",
    "react-native-screens": "^3.0.0",
    "@react-native-async-storage/async-storage": "^1.17.0",
    "expo-notifications": "~0.20.0",
    "date-fns": "^2.30.0"
  }
}
```

---

## 🚀 Деплой

### iOS (App Store)

1. Создать Apple Developer аккаунт
2. Настроить сертификаты
3. Собрать через Xcode
4. Загрузить в App Store Connect

### Android (Google Play)

1. Создать Google Play Developer аккаунт
2. Собрать APK/AAB
3. Загрузить в Google Play Console

---

**Готово к разработке!** 📱

