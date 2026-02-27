#!/bin/bash

# 模型下载功能测试脚本

echo "🧪 WebLLM-X 模型下载测试工具"
echo "=================================="
echo ""

PROJECT_DIR="/Users/hocgin/Projects/web-llm-x"
cd "$PROJECT_DIR"

# 检查是否已构建
if [ ! -d "dist" ] || [ "src/onboarding.html" -nt "dist/src/onboarding.html" ]; then
  echo "📦 构建项目..."
  pnpm build
  echo "✅ 构建完成"
else
  echo "✅ 项目已构建（最新）"
fi

echo ""
echo "📋 模型下载测试步骤:"
echo ""
echo "1️⃣  重置引导状态"
echo "   在 Chrome DevTools Console 中执行："
echo "   chrome.storage.local.remove('onboardingCompleted')"
echo ""
echo "2️⃣ 重新加载扩展"
echo "   - 访问 chrome://extensions/"
echo "   - 找到扩展，点击刷新按钮 🔄"
echo ""
echo "3️⃣ 打开引导页面"
echo "   - 点击扩展图标"
echo "   - 或访问: chrome-extension://<id>/src/onboarding.html"
echo ""
echo "4️⃣ 完成引导流程"
echo "   - 点击「开始设置」"
echo "   - 查看 WebGPU 检查结果"
echo "   - 点击「立即下载模型」"
echo ""
echo "5️⃣ 观察下载进度"
echo "   ✅ 进度条从 0% 到 100%"
echo "   ✅ 当前阶段文字更新"
echo "   ✅ 下载详情实时显示（已下载、速度、剩余时间）"
echo "   ✅ 时间轴逐步激活（5 个阶段）"
echo "   ✅ 完成后自动跳转到完成页面"
echo ""
echo "📊 下载进度检查点:"
echo ""
echo "  进度    | 阶段                    | 检查项"
echo " --------|------------------------|--------------------------"
echo "  0-10%   | 初始化 WebGPU 环境      | 阶段文字正确显示"
echo "  10-20%  | 加载模型配置            | 第1-2个时间轴点激活"
echo "  20-50%  | 下载模型文件            | 下载详情显示"
echo "  50-80%  | 编译模型到 WebGPU       | 第4个时间轴点激活"
echo "  80-100% | 准备完成                | 所有时间轴点激活"
echo "  100%    | 下载完成                | 自动跳转到完成页面"
echo ""
echo "🔍 调试方法:"
echo ""
echo "查看 onboarding.html 日志:"
echo "  onboarding.html 页面 → 右键 → 检查 → Console"
echo ""
echo "查看 background.js 日志:"
echo "  chrome://extensions/ → Service Worker → Console"
echo ""
echo "重置并重新测试:"
echo "  chrome.storage.local.remove('onboardingCompleted')"
echo "  然后重新打开引导页面"
echo ""
echo "💡 提示:"
echo "  - 首次下载需要 3-15 分钟（取决于网络）"
echo "  - 模型会缓存，后续启动只需 5-10 秒"
echo "  - 可以点击「后台下载」让下载在后台继续"
echo ""
echo "❓ 需要打开 Chrome 扩展页面吗? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
  open -a "Google Chrome" "chrome://extensions/"
  echo "✅ 已打开 Chrome 扩展页面"
fi

echo ""
echo "📚 详细文档: $PROJECT_DIR/MODEL_DOWNLOAD_GUIDE.md"
echo ""
echo "✨ 祝测试顺利！"
