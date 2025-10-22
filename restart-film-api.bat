@echo off
echo 重启 film_api 服务...
echo.

cd /d D:\Desktop\jifen\film_api

echo 停止现有的 Node 进程...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq film_api*" 2>nul

echo.
echo 等待2秒...
timeout /t 2 /nobreak >nul

echo.
echo 启动 film_api 服务 (端口 4000)...
start "film_api" cmd /k "npm start"

echo.
echo ✅ film_api 服务已启动！
echo.
echo 请等待几秒后再测试签到接口
pause
