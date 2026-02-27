# 消息传递调试指南

## 问题现象

`[Onboarding] 收到响应: undefined`

## 问题分析

这个问题表明 background script 没有正确响应 `PRELOAD_MODEL` 消息。可能的原因：

1. **Background script 未正确处理消息** - 消息监听器逻辑有问题
2. **sendResponse 未被调用** - 异步处理时没有正确返回 true
3. **Offscreen 文档创建失败** - 导致后续步骤无法执行
4. **消息路由问题** - 多个监听器冲突

## 调试步骤

### 第一步：检查 Background 日志

1. 打开 `chrome://extensions/`
2. 找到 "WebLLM-X" 扩展
3. 点击 "Service Worker" 链接
4. 查看控制台输出

**预期日志：**
```
[Background] 收到消息: PRELOAD_MODEL 来自: chrome-extension://...
[Background] 处理 PRELOAD_MODEL
[Background] WebGPU 检查通过，开始初始化...
[Background] 创建 offscreen 文档...
[Background] Offscreen 文档创建成功
[Background] 发送初始化请求到 offscreen...
[Background] 收到 offscreen 初始化响应: { success: true }
```

### 第二步：检查 Onboarding 页面日志

1. 在 onboarding 页面右键点击
2. 选择 "检查" 或 "Inspect"
3. 切换到 "Console" 标签页

**预期日志：**
```
[Onboarding] 发送 PRELOAD_MODEL 请求...
[Onboarding] 进度监听器已设置
[Onboarding] 发送消息到 background...
[Onboarding] 回调被调用，响应: { success: true }
[Onboarding] runtime.lastError: undefined
[Onboarding] 收到响应: { success: true }
[Onboarding] 模型预加载成功
```

### 第三步：检查 Offscreen 文档日志

1. 在 `chrome://extensions/` 页面
2. 找到 "检查视图: src/offscreen.html"（如果存在）
3. 点击查看 offscreen 文档的控制台

**预期日志：**
```
[Offscreen] Offscreen document loaded
[Offscreen] 消息监听器已设置
[Offscreen] 收到消息: INITIALIZE_MODEL
[Offscreen] 开始初始化模型...
[WebLLM] 开始初始化模型...
```

## 常见问题排查

### 问题 1: `[Background] 收到消息` 没有出现

**原因：** Background script 未正确加载或崩溃

**解决方案：**
1. 在 `chrome://extensions/` 中重新加载扩展
2. 检查 Background 日志是否有错误
3. 确认 manifest.json 中的 background 配置正确

### 问题 2: `[Background] 创建 offscreen 文档失败`

**原因：** Offscreen API 不可用或权限不足

**解决方案：**
1. 检查 Chrome 版本（需要 109+）
2. 确认 manifest.json 中包含 `offscreen` 权限
3. 查看具体的错误信息

### 问题 3: `[Background] 发送消息到 offscreen 失败`

**原因：** Offscreen 文档未完全加载或消息监听器未设置

**解决方案：**
1. 增加等待时间（当前是 500ms）
2. 检查 offscreen 文档是否正确加载
3. 确认 offscreen.ts 中的消息监听器已设置

### 问题 4: `[Onboarding] runtime.lastError` 有错误信息

**常见错误：**

**"The message port closed before a response was received"**
- Background script 崩溃或重新加载
- 消息监听器返回 false 但需要异步处理

**"Could not establish connection"**
- Background script 未运行
- Extension 上下文无效

## 手动测试命令

### 在 Background Console 中运行

```javascript
// 检查 WebGPU
typeof GPU !== 'undefined'

// 检查 offscreen 状态
chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })

// 手动创建 offscreen 文档
chrome.offscreen.createDocument({
  url: chrome.runtime.getURL('src/offscreen.html'),
  reasons: ['WORKERS'],
  justification: '测试'
})

// 发送测试消息到 offscreen
chrome.runtime.sendMessage({ type: 'CHECK_STATUS' }, (resp) => console.log('响应:', resp))
```

### 在 Onboarding Console 中运行

```javascript
// 测试 basic 消息
chrome.runtime.sendMessage({ type: 'CHECK_WEBGPU' }, (resp) => {
  console.log('WebGPU 检查结果:', resp)
})

// 检查 lastError
chrome.runtime.sendMessage({ type: 'CHECK_MODEL_STATUS' }, (resp) => {
  console.log('响应:', resp)
  console.log('lastError:', chrome.runtime.lastError)
})
```

## 修改说明

### Background Script 改进

1. **合并消息监听器** - 将两个监听器合并为一个，避免冲突
2. **增加日志** - 所有关键步骤都有详细日志
3. **更好的错误处理** - 捕获并记录所有错误
4. **增加延迟** - 等待 500ms 确保 offscreen 文档加载完成

### Onboarding Script 改进

1. **先设置监听器** - 在发送请求之前设置进度监听器
2. **使用回调** - 使用回调方式而不是 Promise，更可靠
3. **检查 lastError** - 记录 chrome.runtime.lastError
4. **详细日志** - 记录每一步的状态

## 下一步操作

1. **重新加载扩展**
   ```
   chrome://extensions/ → 找到 WebLLM-X → 点击刷新
   ```

2. **打开所有控制台**
   - Background Service Worker 控制台
   - Onboarding 页面控制台
   - Offscreen 文档控制台（如果已创建）

3. **重置引导状态**
   ```javascript
   chrome.storage.local.remove('onboardingCompleted')
   ```

4. **测试下载流程**
   - 打开 onboarding 页面
   - 点击 "开始设置"
   - 点击 "立即下载模型"
   - 观察所有控制台的日志输出

5. **提供日志信息**
   - 如果问题仍然存在，请提供：
     - Background 控制台的完整日志
     - Onboarding 控制台的完整日志
     - 任何错误堆栈信息

## 临时解决方案

如果 offscreen API 仍然有问题，可以考虑：

### 方案 A: 使用沙盒页面

创建一个普通的 HTML 页面（不是 offscreen），在 iframe 中运行：

```html
<iframe src="sandbox.html" sandbox="allow-scripts"></iframe>
```

### 方案 B: 简化实现

暂时移除 offscreen API，回到之前的实现，但需要处理 CSP 问题的备用方案（如使用外部服务器）。

## 技术细节

### 消息传递流程

```
Onboarding Page
    ↓ chrome.runtime.sendMessage({ type: 'PRELOAD_MODEL' })
    ↓ (等待响应)
Background Script
    ↓ 创建 offscreen 文档
    ↓ chrome.runtime.sendMessage({ type: 'INITIALIZE_MODEL' })
    ↓ (等待响应)
Offscreen Document
    ↓ 初始化 WebLLM
    ↓ chrome.runtime.sendMessage({ type: 'MODEL_PROGRESS' })
    ↓ (持续发送进度)
Background Script
    ↓ 转发进度消息
    ↓ chrome.runtime.sendMessage({ type: 'MODEL_DOWNLOAD_PROGRESS' })
Onboarding Page
    ↓ 更新 UI
```

### 关键点

1. **异步响应** - Chrome 消息传递支持异步响应，但需要返回 `true`
2. **消息通道** - 如果不返回 `true`，消息通道会立即关闭
3. **错误处理** - 必须检查 `chrome.runtime.lastError`
