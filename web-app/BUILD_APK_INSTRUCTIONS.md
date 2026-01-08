# 📱 Инструкция по сборке APK

## ✅ Что уже сделано

1. ✅ Веб-приложение собрано (`dist/`)
2. ✅ Android проект создан (`android/`)
3. ✅ Файлы синхронизированы
4. ✅ Gradle wrapper готов

## ⚠️ Что нужно сделать

Для сборки APK нужен **Android SDK**. Есть 2 варианта:

---

## 🎯 Вариант 1: Через Android Studio (РЕКОМЕНДУЕТСЯ)

### Шаг 1: Установить Android Studio

1. Скачайте [Android Studio](https://developer.android.com/studio)
2. Установите Android Studio
3. При первом запуске установите Android SDK (через SDK Manager)

### Шаг 2: Открыть проект

```bash
cd web-app
npm run cap:open:android
```

Или вручную:
- Откройте Android Studio
- File → Open
- Выберите папку `web-app/android`

### Шаг 3: Дождаться синхронизации Gradle

Android Studio автоматически синхронизирует проект.

### Шаг 4: Собрать APK

1. В Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Дождитесь завершения сборки
3. APK будет в: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🎯 Вариант 2: Через командную строку

### Шаг 1: Установить Android SDK

1. Установите Android Studio (для получения SDK)
2. Или скачайте [Command Line Tools](https://developer.android.com/studio#command-tools)

### Шаг 2: Настроить переменные окружения

**Windows:**
```powershell
# Найти путь к SDK (обычно в Android Studio)
# Например: C:\Users\YourName\AppData\Local\Android\Sdk

# Установить переменную окружения
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\YourName\AppData\Local\Android\Sdk', 'User')
```

**Linux/Mac:**
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Шаг 3: Создать local.properties

Создайте файл `web-app/android/local.properties`:

```properties
sdk.dir=C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
```

(Замените путь на ваш реальный путь к SDK)

### Шаг 4: Собрать APK

```bash
cd web-app/android
.\gradlew.bat assembleDebug    # Windows
# или
./gradlew assembleDebug        # Linux/Mac
```

APK будет в: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📱 Установка APK на устройство

### Через ADB:

```bash
# Подключите устройство через USB
# Включите "Отладка по USB" в настройках разработчика

adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Через файловый менеджер:

1. Скопируйте APK на устройство
2. Откройте файловый менеджер
3. Нажмите на APK файл
4. Разрешите установку из неизвестных источников (если нужно)
5. Установите приложение

---

## 🔄 Обновление приложения

После изменений в коде:

```bash
cd web-app
npm run build
npm run cap:sync
npm run cap:open:android
```

Затем соберите APK заново в Android Studio.

---

## ✅ Текущий статус

- ✅ Веб-приложение собрано
- ✅ Android проект создан
- ✅ Файлы синхронизированы
- ⏳ Требуется Android SDK для сборки APK

**Следующий шаг:** Установите Android Studio и соберите APK через него (Вариант 1).

---

## 🆘 Проблемы?

### "SDK location not found"

**Решение:** Создайте `android/local.properties` с путем к SDK:
```properties
sdk.dir=C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
```

### "Gradle sync failed"

**Решение:**
1. File → Invalidate Caches / Restart в Android Studio
2. Проверьте версию Java (должна быть 17+)

### "Build failed"

**Решение:**
1. Очистите проект: `cd android && ./gradlew clean`
2. Пересоберите: `./gradlew assembleDebug`

---

**Готово!** 🎉 После установки Android Studio вы сможете собрать APK!

