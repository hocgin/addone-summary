#!/bin/bash

# WebLLM-X Onboarding 测试脚本（标签页版本）

echo "🧪 WebLLM-X Onboarding 测试工具"
echo "=================================="
echo ""

PROJECT_DIR="/Users/hocgin/Projects/web-llm-x"
cd "$PROJECT_DIR"

# 检查是否已构建
if [ ! -d "dist" ]; then
  echo "📦 构建项目..."
  pnpm build
  echo "✅ 构建完成"
else
  echo "✅ 项目已构建"
fi

echo ""
echo "📋 测试步骤:"
echo ""
echo "1. 清除旧的扩展数据"
echo "   - 访问 chrome://extensions/"
echo "   - 找到 '网页内容总结 - WebLLM-X'"
echo "   - 点击 '移除'"
echo ""
echo "2. 重新加载扩展"
echo "   - 点击 '加载已解压的扩展程序'"
echo "   - 选择: $PROJECT_DIR/dist"
echo ""
echo "3. 观察欢迎页面（自动打开）"
echo "   - welcome.html 应该在新标签页中自动打开"
echo "   - 检查页面样式和内容"
echo "   - 应该自动跳转到 onboarding.html"
echo ""
echo "4. 完成引导流程"
echo "   - 在 onboarding.html 标签页中完成 4 步流程"
echo "   - 开始设置 → 检查 WebGPU → 下载模型 → 完成"
echo ""
echo "5. 测试日常使用"
echo "   - 点击扩展图标"
echo "   - 应该看到正常的 Popup（WelcomeView）"
echo "   - 不应该再打开 onboarding.html"
echo ""
echo "🔧 调试工具:"
echo ""
echo "重置引导状态（在任意标签页 Console 中执行）:"
echo "  chrome.storage.local.remove('onboardingCompleted')"
echo ""
echo "查看引导页面日志:"
echo "  在 onboarding.html 标签页 → 右键 → 检查 → Console"
echo ""
echo "查看 Background 日志:"
echo "  chrome://extensions/ → Service Worker"
echo ""
echo "🌐 打开引导页面（手动）:"
echo "  chrome-extension://<extension-id>/src/onboarding.html"
echo ""
echo "❓ 需要打开 Chrome 扩展页面吗? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
  open -a "Google Chrome" "chrome://extensions/"
  echo "✅ 已打开 Chrome 扩展页面"
fi

echo ""
echo "📚 详细文档:"
echo "  - $PROJECT_DIR/ONBOARDING_TAB_UPDATE.md"
echo "  - $PROJECT_DIR/ONBOARDING_GUIDE.md"
echo ""
echo "✨ 祝测试顺利！"
