@echo off
chcp 65001 >nul
title FlowSync 演示系统

echo ========================================
echo   FlowSync 演示系统启动中...
echo ========================================
echo.

cd /d "%~dp0server"

if not exist "node_modules" (
    echo [1/3] 首次启动，正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo.
        echo ❌ 依赖安装失败，请检查网络或手动执行 npm install
        pause
        exit /b 1
    )
) else (
    echo [1/3] 依赖已安装，跳过...
)

echo.
echo [2/3] 启动后端服务...
echo     服务地址: http://localhost:3000
echo     演示页面: http://localhost:3000/index.html
echo.

start "" "http://localhost:3000/index.html"

echo [3/3] 正在打开浏览器...
echo.
echo ========================================
echo   服务运行中，按 Ctrl+C 停止
echo ========================================
echo.

call npm start

pause
