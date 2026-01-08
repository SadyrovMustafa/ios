@echo off
echo ====================================
echo   TickTick Web App - Запуск
echo ====================================
echo.

cd /d "%~dp0"

echo Проверка Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ОШИБКА: Node.js не установлен!
    echo Скачайте с https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js найден!
echo.

echo Установка зависимостей...
call npm install
if %errorlevel% neq 0 (
    echo ОШИБКА при установке зависимостей!
    pause
    exit /b 1
)

echo.
echo Запуск приложения...
echo Приложение откроется в браузере автоматически.
echo Для остановки нажмите Ctrl+C
echo.

call npm run dev

pause

