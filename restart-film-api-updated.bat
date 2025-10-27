@echo off
echo ========================================
echo 重启 film_api 服务
echo ========================================
echo.

echo 正在停止 film_api 服务...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq film_api*" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo 正在启动 film_api 服务...
cd /d "%~dp0"
start "film_api" cmd /k "node app.js"

echo.
echo ========================================
echo film_api 服务已重启
echo ========================================
echo.
pause
