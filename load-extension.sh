#!/bin/bash

# WebLLM-X Chrome 扩展快速加载脚本

echo "🚀 WebLLM-X Chrome 扩展加载工具"
echo "=================================="
echo ""

# 检查是否在项目目录
PROJECT_DIR="/Users/hocgin/Projects/web-llm-x"
if [ ! -d "$PROJECT_DIR" ]; then
  echo "❌ 错误: 项目目录不存在: $PROJECT_DIR"
  exit 1
fi

cd "$PROJECT_DIR"

# 检查 dist 目录
if [ ! -d "dist" ]; then
  echo "📦 构建项目..."
  pnpm build

  if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
  fi
  echo "✅ 构建完成"
else
  echo "📦 检查构建..."
  if [ "manifest.json" -nt "dist/manifest.json" ]; then
    echo "🔄 需要重新构建..."
    pnpm build
    echo "✅ 构建完成"
  else
    echo "✅ 构建已是最新"
  fi
fi

echo ""
echo "📂 构建输出位置: $PROJECT_DIR/dist"
echo ""
echo "📖 加载步骤:"
echo ""
echo "1. 在 Chrome 中打开: chrome://extensions/"
echo "2. 启用右上角的 '开发者模式'"
echo "3. 点击 '加载已解压的扩展程序'"
echo "4. 选择目录: $PROJECT_DIR/dist"
echo ""

# 检查 Chrome 是否存在
if [ -d "/Applications/Google Chrome.app" ]; then
  echo "🌐 是否现在打开 Chrome 并加载扩展? (y/n)"
  read -r response

  if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    # 打开 Chrome 扩展页面
    open -a "Google Chrome" "chrome://extensions/"
    echo "✅ 已打开 Chrome 扩展页面"
  fi
elif [ -d "/Applications/Google Chrome Canary.app" ]; then
  echo "🌐 检测到 Chrome Canary，是否打开? (y/n)"
  read -r response

  if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    open -a "Google Chrome Canary" "chrome://extensions/"
    echo "✅ 已打开 Chrome Canary 扩展页面"
  fi
fi

echo ""
echo "✨ 完成后记得测试以下功能:"
echo "   • 点击扩展图标打开 Popup"
echo "   • 检查 WebGPU 支持"
echo "   • 点击'开始分析'测试进度展示"
echo ""
echo "📝 详细测试指南: $PROJECT_DIR/TEST_GUIDE.md"
