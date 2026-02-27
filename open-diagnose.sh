#!/bin/bash

EXTENSION_ID="feejbfakkcdikfemhhpgoakhbbijhhcl"

echo "🔍 正在打开诊断页面..."
echo ""

# 检查是否在 macOS 上
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "chrome-extension://$EXTENSION_ID/diagnose.html"
else
    # Linux
    xdg-open "chrome-extension://$EXTENSION_ID/diagnose.html" 2>/dev/null || \
    google-chrome "chrome-extension://$EXTENSION_ID/diagnose.html" 2>/dev/null || \
    echo "请手动在 Chrome 中打开: chrome-extension://$EXTENSION_ID/diagnose.html"
fi

echo ""
echo "如果页面无法打开，请确认："
echo "1. 扩展已正确加载到 Chrome"
echo "2. 扩展 ID 是: $EXTENSION_ID"
echo "3. 手动在地址栏输入: chrome-extension://$EXTENSION_ID/diagnose.html"
