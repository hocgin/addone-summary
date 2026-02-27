# 沙盒页面架构说明

## 概述

使用 Chrome 扩展的**沙盒页面**功能来运行 WebLLM，绕过扩展主上下文的 CSP 限制。

## 架构设计

### 组件关系

```
┌─────────────────────────────────────────────────────┐
│              Chrome Extension Context                │
│                   (严格 CSP)                         │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │         Background Service Worker          │    │
│  │                                          │    │
│  │  • 创建隐藏的 iframe                       │    │
│  │  • 通过 postMessage 与沙盒通信             │    │
│  │  • 与 popup/onboarding 通信                │    │
│  └──────────────┬─────────────────────────────┘    │
│                 │                                    │
│                 │ iframe (hidden)                   │
│                 ↓                                    │
│  ┌────────────────────────────────────────────┐    │
│  │           Sandbox Page                     │    │
│  │        src/sandbox.html                     │    │
│  │                                          │    │
│  │  • 独立的 CSP (允许 wasm-eval)             │    │
│  │  • 运行 WebLLM Manager                     │    │
│  │  • 通过 postMessage 响应消息                │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## 消息流程

### 初始化流程

```
用户点击下载
    ↓
onboarding.js → background.ts (PRELOAD_MODEL)
    ↓
background.ts 创建隐藏的 iframe
    ↓
iframe 加载 sandbox.html
    ↓
sandbox.ts 初始化，发送 READY 消息
    ↓
background.ts 发送 INITIALIZE_MODEL 到沙盒
    ↓
sandbox.ts 初始化 WebLLM
    ↓
sandbox.ts 发送 PROGRESS 消息（进度更新）
    ↓
background.ts 转发 MODEL_DOWNLOAD_PROGRESS
    ↓
onboarding.js 更新 UI
```

### 摘要生成流程

```
用户点击开始分析
    ↓
popup.tsx → background.ts (SUMMARIZE_PAGE)
    ↓
background.ts 提取页面内容
    ↓
background.ts 发送 SUMMARIZE 到沙盒
    ↓
sandbox.ts 调用 WebLLM 生成摘要
    ↓
sandbox.ts 返回 SUMMARIZE_SUCCESS
    ↓
background.ts 转发结果到 popup
```

## 文件结构

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/sandbox.html` | 沙盒页面 HTML |
| `src/sandbox.ts` | 沙盒页面逻辑 |

### 修改文件

| 文件 | 变更 |
|------|------|
| `manifest.json` | 添加 `sandbox` 配置，移除 `offscreen` 权限 |
| `src/background.ts` | 使用 iframe + postMessage 而不是 offscreen API |
| `vite.config.ts` | 替换 offscreen 为 sandbox |

### 移除文件（可删除）

| 文件 | 说明 |
|------|------|
| `src/offscreen.html` | 不再需要 |
| `src/offscreen.ts` | 不再需要 |

## 关键代码

### manifest.json - 沙盒配置

```json
{
  "sandbox": {
    "pages": ["src/sandbox.html"],
    "content_security_policy": "sandbox allow-scripts; script-src 'self' 'unsafe-eval' 'unsafe-inline'; worker-src 'self' blob:"
  }
}
```

**说明：**
- `pages`: 指定哪些页面是沙盒页面
- `content_security_policy`: 沙盒页面自己的 CSP，允许 `unsafe-eval`

### background.ts - 创建 iframe

```typescript
function ensureSandboxFrame(): HTMLIFrameElement {
  if (sandboxFrame) return sandboxFrame

  sandboxFrame = document.createElement('iframe')
  sandboxFrame.style.display = 'none'
  sandboxFrame.src = chrome.runtime.getURL('src/sandbox.html')
  document.documentElement.appendChild(sandboxFrame)

  return sandboxFrame
}
```

### background.ts - 发送消息到沙盒

```typescript
function sendToSandbox(type: string, data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const frame = ensureSandboxFrame()
    const window = frame.contentWindow

    const messageHandler = (event: MessageEvent) => {
      if (event.data.source !== 'webllm-sandbox') return
      // 处理响应...
      resolve(event.data)
    }

    window.addEventListener('message', messageHandler)

    window.postMessage({
      source: 'webllm-extension',
      type,
      ...data
    }, '*')
  })
}
```

### sandbox.ts - 监听消息

```typescript
window.addEventListener('message', async (event) => {
  if (event.data.source !== 'webllm-extension') return

  if (event.data.type === 'INITIALIZE_MODEL') {
    await handleInitializeModel()
  }

  // 返回结果
  window.parent.postMessage({
    source: 'webllm-sandbox',
    type: 'INIT_SUCCESS',
    success: true
  }, '*')
})
```

## 安全考虑

### postMessage 安全

1. **源验证** - 检查 `event.source`
2. **类型验证** - 检查 `message.source` 标识
3. **数据验证** - 验证消息数据的格式

### CSP 隔离

- 沙盒页面无法访问 `chrome.*` API
- 沙盒页面无法访问扩展 storage
- 沙盒页面只能通过 postMessage 与扩展通信

## 优势

1. **绕过 CSP 限制** - 沙盒页面有独立的 CSP，允许 WebAssembly
2. **保持扩展内** - 不需要打开额外的标签页
3. **更好的隔离** - WebLLM 运行在隔离的沙盒环境中
4. **符合最佳实践** - 这是 Chrome 推荐的运行复杂代码的方式

## 限制

1. **无 chrome API** - 沙盒页面无法直接访问 chrome API
2. **消息传递开销** - 需要通过 postMessage 通信
3. **调试稍复杂** - 需要在 iframe 中查看日志

## 调试方法

### 查看沙盒页面日志

1. 在 Background Service Worker 控制台运行：
   ```javascript
   // 显示沙盒 iframe
   const iframe = document.querySelector('iframe')
   if (iframe) {
     iframe.style.display = 'block'
     iframe.style.width = '600px'
     iframe.style.height = '400px'
     iframe.style.position = 'fixed'
     iframe.style.top = '10px'
     iframe.style.right = '10px'
     iframe.style.zIndex = '9999'
   }
   ```

2. 右键点击沙盒区域 → 检查 → Console

### 查看消息传递

在沙盒页面的控制台中：
```javascript
// 监听所有消息
window.addEventListener('message', console.log)
```

## 测试步骤

1. **重新加载扩展**
   ```
   chrome://extensions/ → 找到 WebLLM-X → 点击刷新
   ```

2. **重置引导状态**
   ```javascript
   chrome.storage.local.remove('onboardingCompleted')
   ```

3. **测试下载流程**
   - 打开 onboarding 页面
   - 点击 "开始设置"
   - 点击 "立即下载模型"
   - 观察沙盒页面的日志输出

4. **验证沙盒页面创建**
   - 在 Background Service Worker 控制台
   - 检查是否有 iframe 元素
   - 查看网络请求是否包含 sandbox.html

## 下一步

请重新加载扩展并测试！如果遇到任何问题，请提供：
- Background Service Worker 控制台日志
- 沙盒页面日志（如果可见）
- 任何错误信息
