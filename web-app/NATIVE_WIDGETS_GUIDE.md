# 📱 Руководство по нативным виджетам

## 🎯 Обзор

Для создания нативных виджетов для Windows/Mac/Linux и мобильных устройств есть несколько подходов.

---

## 🖥️ Виджеты для Desktop (Windows/Mac/Linux)

### Вариант 1: Electron (рекомендуется)

**Преимущества:**
- ✅ Один код для всех платформ
- ✅ Доступ к нативным API
- ✅ Виджеты через системные API
- ✅ Простая разработка

**Недостатки:**
- ⚠️ Больший размер приложения
- ⚠️ Больше потребление ресурсов

**Реализация:**

1. **Установка Electron:**
```bash
npm install --save-dev electron electron-builder
```

2. **Создать `electron/main.js`:**
```javascript
const { app, BrowserWindow, Tray, Menu } = require('electron')
const path = require('path')

let tray = null
let widgetWindow = null

function createWidget() {
  widgetWindow = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  widgetWindow.loadURL('http://localhost:3000/widget')
  widgetWindow.setPosition(100, 100)
}

app.whenReady().then(() => {
  // Create system tray icon
  tray = new Tray(path.join(__dirname, 'icon.png'))
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Показать виджет', click: () => createWidget() },
    { label: 'Выход', click: () => app.quit() }
  ])
  
  tray.setToolTip('TickTick')
  tray.setContextMenu(contextMenu)
  
  createWidget()
})
```

3. **Обновить `package.json`:**
```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron": "electron .",
    "electron:build": "electron-builder"
  }
}
```

---

### Вариант 2: Tauri (легковесная альтернатива)

**Преимущества:**
- ✅ Меньший размер приложения
- ✅ Лучшая производительность
- ✅ Безопасность

**Реализация:**

1. **Установка Tauri:**
```bash
npm install --save-dev @tauri-apps/cli
```

2. **Создать виджет через Tauri API**

---

### Вариант 3: Системные виджеты

#### Windows Widgets (Windows 11)
- Использовать Windows Widgets API
- Создать отдельное приложение-виджет

#### macOS Widgets
- Использовать WidgetKit (Swift/SwiftUI)
- Создать отдельное расширение

#### Linux Widgets
- Использовать Plasmoids (KDE)
- Использовать GNOME Shell Extensions

---

## 📱 Виджеты для мобильных (iOS/Android)

### iOS Widgets (WidgetKit)

**Требования:**
- Xcode
- Swift/SwiftUI
- iOS 14+

**Структура:**
```
ios/
├── TickTick/
│   ├── TickTickWidget/
│   │   ├── TickTickWidget.swift
│   │   ├── TickTickWidgetBundle.swift
│   │   └── Info.plist
│   └── TickTick/
│       └── App.swift
```

**Пример виджета:**
```swift
import WidgetKit
import SwiftUI

struct TickTickWidget: Widget {
    let kind: String = "TickTickWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            TickTickWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("TickTick Tasks")
        .description("Показывает задачи на сегодня")
    }
}
```

---

### Android Widgets (App Widgets)

**Требования:**
- Android Studio
- Kotlin/Java
- Android API 31+

**Структура:**
```
android/
├── app/
│   └── src/
│       └── main/
│           ├── java/
│           │   └── TickTickWidgetProvider.kt
│           └── res/
│               └── xml/
│                   └── widget_info.xml
```

**Пример виджета:**
```kotlin
class TickTickWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }
}
```

---

## 🚀 React Native приложение

### Создание проекта

```bash
# Создать новый проект
npx react-native init TickTickMobile

# Или использовать Expo (проще)
npx create-expo-app TickTickMobile
```

### Структура проекта

```
TickTickMobile/
├── src/
│   ├── components/
│   ├── screens/
│   ├── services/
│   └── navigation/
├── ios/
│   └── TickTickWidget/ (iOS виджет)
├── android/
│   └── app/
│       └── src/
│           └── main/
│               └── java/
│                   └── TickTickWidgetProvider.kt (Android виджет)
└── package.json
```

### Интеграция с веб-версией

**Вариант 1: Общий код**
- Вынести бизнес-логику в отдельный пакет
- Использовать React Native для UI
- Синхронизация через API

**Вариант 2: WebView**
- Встроить веб-версию в React Native
- Добавить нативные функции (виджеты, push)

---

## 📋 План реализации

### Этап 1: Desktop виджеты (Electron)
1. ✅ Создать Electron приложение
2. ✅ Интегрировать веб-версию
3. ✅ Создать системный трей
4. ✅ Создать виджет-окно
5. ✅ Добавить нативные уведомления

**Время:** 8-12 часов

### Этап 2: iOS виджеты
1. ✅ Создать iOS проект
2. ✅ Добавить Widget Extension
3. ✅ Реализовать виджет
4. ✅ Интеграция с данными

**Время:** 6-8 часов

### Этап 3: Android виджеты
1. ✅ Создать Android проект
2. ✅ Реализовать AppWidgetProvider
3. ✅ Создать layout виджета
4. ✅ Интеграция с данными

**Время:** 6-8 часов

### Этап 4: React Native приложение
1. ✅ Создать проект
2. ✅ Настроить навигацию
3. ✅ Интегрировать сервисы
4. ✅ Добавить виджеты
5. ✅ Тестирование

**Время:** 40-60 часов

---

## 🔧 Технические детали

### Синхронизация данных

**Для виджетов:**
- Использовать SharedPreferences (Android)
- Использовать UserDefaults (iOS)
- Использовать localStorage (Electron)
- Синхронизация через API

### Обновление виджетов

**iOS:**
```swift
WidgetCenter.shared.reloadAllTimelines()
```

**Android:**
```kotlin
val updateIntent = Intent(context, TickTickWidgetProvider::class.java)
updateIntent.action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
context.sendBroadcast(updateIntent)
```

---

## 📚 Ресурсы

- [Electron Documentation](https://www.electronjs.org/docs)
- [Tauri Documentation](https://tauri.app/)
- [WidgetKit (iOS)](https://developer.apple.com/documentation/widgetkit)
- [App Widgets (Android)](https://developer.android.com/guide/topics/appwidgets)
- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)

---

## 💡 Рекомендации

1. **Начните с Electron** - проще всего для desktop
2. **Используйте Expo** - для быстрого старта с React Native
3. **Создайте API** - для синхронизации между платформами
4. **Тестируйте на реальных устройствах** - виджеты работают по-разному

---

**Готово к реализации!** 🚀

