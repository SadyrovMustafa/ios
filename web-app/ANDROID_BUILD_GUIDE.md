# 📱 Руководство по сборке Android APK

## 📋 Требования

### Обязательные:
1. **Node.js** (v18 или выше)
2. **npm** или **yarn**
3. **Java JDK 17** (для Android сборки)
4. **Android Studio** (для сборки APK)
5. **Android SDK** (через Android Studio)

### Рекомендуемые:
- Android Studio Arctic Fox или новее
- Android SDK API Level 33+
- Gradle 8.0+

---

## 🚀 Шаг 1: Установка зависимостей

```bash
cd web-app
npm install
```

Это установит все необходимые пакеты, включая Capacitor и его плагины.

---

## 🔧 Шаг 2: Сборка веб-приложения

```bash
npm run build
```

Это создаст оптимизированную версию приложения в папке `dist/`.

---

## 📦 Шаг 3: Инициализация Capacitor и Android

```bash
# Добавить Android платформу
npm run cap:add:android

# Синхронизировать файлы
npm run cap:sync
```

---

## 🎨 Шаг 4: Настройка Android проекта

### 4.1. Открыть проект в Android Studio

```bash
npm run cap:open:android
```

Или вручную:
- Откройте Android Studio
- File → Open
- Выберите папку `web-app/android`

### 4.2. Настроить иконку приложения

1. Создайте иконку 1024x1024px
2. Поместите в `android/app/src/main/res/mipmap-*/ic_launcher.png`
3. Или используйте [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/)

### 4.3. Настроить Splash Screen

Splash screen уже настроен в `capacitor.config.ts`. При необходимости измените:
- `android/app/src/main/res/drawable/splash.xml`
- `android/app/src/main/res/values/styles.xml`

---

## 🔐 Шаг 5: Настройка разрешений

Откройте `android/app/src/main/AndroidManifest.xml` и убедитесь, что есть необходимые разрешения:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

---

## 🏗️ Шаг 6: Сборка APK

### Вариант 1: Через Android Studio (рекомендуется)

1. Откройте проект в Android Studio
2. Build → Build Bundle(s) / APK(s) → Build APK(s)
3. APK будет создан в `android/app/build/outputs/apk/debug/app-debug.apk`

### Вариант 2: Через командную строку

```bash
cd android
./gradlew assembleDebug
```

APK будет в `android/app/build/outputs/apk/debug/app-debug.apk`

### Вариант 3: Release APK (для публикации)

```bash
cd android
./gradlew assembleRelease
```

**Важно:** Для release APK нужно настроить подпись:
1. Создайте keystore: `keytool -genkey -v -keystore ticktick-release.keystore -alias ticktick -keyalg RSA -keysize 2048 -validity 10000`
2. Настройте `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('ticktick-release.keystore')
            storePassword 'your-password'
            keyAlias 'ticktick'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
        }
    }
}
```

---

## 🔄 Шаг 7: Обновление приложения

После изменений в веб-коде:

```bash
# 1. Собрать веб-версию
npm run build

# 2. Синхронизировать с Android
npm run cap:sync

# 3. Открыть в Android Studio
npm run cap:open:android

# 4. Собрать APK заново
```

---

## 📱 Шаг 8: Установка APK на устройство

### Через ADB (Android Debug Bridge):

```bash
# Подключите устройство через USB
# Включите "Отладка по USB" в настройках разработчика

# Установить APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Через файловый менеджер:

1. Скопируйте APK на устройство
2. Откройте файловый менеджер
3. Нажмите на APK файл
4. Разрешите установку из неизвестных источников (если нужно)
5. Установите приложение

---

## 🐛 Решение проблем

### Проблема: "Gradle sync failed"

**Решение:**
1. Проверьте версию Java (должна быть 17)
2. Обновите Gradle в `android/gradle/wrapper/gradle-wrapper.properties`
3. File → Invalidate Caches / Restart в Android Studio

### Проблема: "SDK location not found"

**Решение:**
1. Установите Android SDK через Android Studio
2. Настройте переменную окружения `ANDROID_HOME`

### Проблема: "Build failed"

**Решение:**
1. Очистите проект: `cd android && ./gradlew clean`
2. Удалите папку `.gradle` в `android`
3. Пересоберите: `./gradlew assembleDebug`

### Проблема: Приложение не открывается

**Решение:**
1. Проверьте логи: `adb logcat | grep -i capacitor`
2. Убедитесь, что `webDir` в `capacitor.config.ts` указывает на `dist`
3. Проверьте, что сборка веб-версии прошла успешно

---

## 📝 Полезные команды

```bash
# Полная сборка и синхронизация
npm run cap:build:android

# Только синхронизация
npm run cap:sync

# Открыть Android Studio
npm run cap:open:android

# Просмотр логов устройства
adb logcat

# Очистка проекта
cd android && ./gradlew clean
```

---

## 🎯 Следующие шаги

1. **Тестирование:** Установите APK на реальное устройство и протестируйте
2. **Оптимизация:** Настройте ProGuard для уменьшения размера APK
3. **Публикация:** Подготовьте release версию для Google Play Store
4. **Иконки:** Создайте адаптивные иконки для разных разрешений
5. **Splash Screen:** Настройте кастомный splash screen

---

## 📚 Дополнительные ресурсы

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Gradle User Guide](https://docs.gradle.org/current/userguide/userguide.html)

---

**Готово!** 🎉 Теперь у вас есть Android APK приложение!

