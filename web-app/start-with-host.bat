@echo off
echo ====================================
echo   TickTick Web App - Запуск с доступом из сети
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
echo Получение IP адреса...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found
)
:found
echo Ваш IP адрес: %IP%
echo.
echo Запуск приложения с доступом из сети...
echo На iPhone откройте Safari и введите: http://%IP%:3000
echo Для остановки нажмите Ctrl+C
echo.

call npm run dev -- --host

pause

