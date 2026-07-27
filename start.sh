#!/bin/bash

echo "========================================"
echo "  FlowSync 演示系统启动中..."
echo "========================================"
echo ""

cd "$(dirname "$0")/server"

if [ ! -d "node_modules" ]; then
    echo "[1/3] 首次启动，正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ 依赖安装失败，请检查网络或手动执行 npm install"
        read -p "按回车退出..."
        exit 1
    fi
else
    echo "[1/3] 依赖已安装，跳过..."
fi

echo ""
echo "[2/3] 启动后端服务..."
echo "    服务地址: http://localhost:3000"
echo "    演示页面: http://localhost:3000/index.html"
echo ""

sleep 1

if command -v open >/dev/null 2>&1; then
    echo "[3/3] 正在打开浏览器..."
    open "http://localhost:3000/index.html"
elif command -v xdg-open >/dev/null 2>&1; then
    echo "[3/3] 正在打开浏览器..."
    xdg-open "http://localhost:3000/index.html"
else
    echo "[3/3] 请手动打开浏览器访问 http://localhost:3000/index.html"
fi

echo ""
echo "========================================"
echo "  服务运行中，按 Ctrl+C 停止"
echo "========================================"
echo ""

npm start
