@echo off
REM Скрипт для автоматической настройки Android проекта (Windows)

echo 🚀 Настройка Android проекта для TickTick...

REM Проверка Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js не установлен. Установите Node.js v18+
    exit /b 1
)

echo ✅ Node.js установлен
node --version

REM Проверка npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm не установлен
    exit /b 1
)

echo ✅ npm установлен
npm --version

REM Установка зависимостей
echo 📦 Установка зависимостей...
call npm install

REM Сборка веб-приложения
echo 🏗️ Сборка веб-приложения...
call npm run build

REM Добавление Android платформы
if not exist "android" (
    echo 📱 Добавление Android платформы...
    call npm run cap:add:android
)

REM Синхронизация
echo 🔄 Синхронизация файлов...
call npm run cap:sync

echo ✅ Настройка завершена!
echo.
echo 📝 Следующие шаги:
echo 1. Откройте Android Studio
echo 2. File → Open → выберите папку 'android'
echo 3. Дождитесь синхронизации Gradle
echo 4. Build → Build APK(s)
echo.
echo Или используйте команду: npm run cap:open:android

pause

