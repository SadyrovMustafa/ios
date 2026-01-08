# 🚀 Быстрый старт: Сборка Android APK

## ⚡ Быстрая установка (3 шага)

### 1️⃣ Установить зависимости

```bash
cd web-app
npm install
```

### 2️⃣ Настроить Android проект

**Windows:**
```bash
android-setup.bat
```

**Linux/Mac:**
```bash
chmod +x android-setup.sh
./android-setup.sh
```

**Или вручную:**
```bash
npm run build
npm run cap:add:android
npm run cap:sync
```

### 3️⃣ Собрать APK

**Вариант A: Через Android Studio (рекомендуется)**
```bash
npm run cap:open:android
```
Затем в Android Studio: **Build → Build APK(s)**

**Вариант B: Через командную строку**
```bash
cd android
./gradlew assembleDebug
```

APK будет в: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📱 Установка на устройство

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔄 Обновление после изменений

```bash
npm run build
npm run cap:sync
npm run cap:open:android
```

Затем соберите APK заново в Android Studio.

---

## ❓ Проблемы?

Смотрите полное руководство: [ANDROID_BUILD_GUIDE.md](./ANDROID_BUILD_GUIDE.md)

---

**Готово!** 🎉 Ваше Android приложение готово к использованию!

