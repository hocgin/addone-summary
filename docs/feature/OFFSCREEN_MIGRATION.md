# Offscreen API 迁移说明

## 问题描述

Chrome 扩展的 Manifest V3 不允许在 `extension_pages` 中使用 `'unsafe-eval'` 和 `'wasm-eval'`，这导致 WebLLM 无法直接在 background script 或 popup 中运行。

## 解决方案

使用 Chrome 的 **Offscreen API** 创建一个独立的上下文来运行 WebLLM，这样可以绕过 CSP 限制。

## 技术架构

### 之前的架构

```
┌─────────────────────────────────────┐
│         Background Script           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      WebLLM Manager         │   │
│  │  (直接在 background 中运行)   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**问题：** 违反 CSP 策略，无法加载 WebAssembly

### 现在的架构

```
┌─────────────────────────────────────┐
│         Background Script           │
│  (消息路由和协调)                    │
└─────────────┬───────────────────────┘
              │ chrome.runtime.sendMessage
              ↓
┌─────────────────────────────────────┐
│      Offscreen Document             │
│  (src/offscreen.html)               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      WebLLM Manager         │   │
│  │  (在独立上下文中运行)          │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## 文件变更

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/offscreen.html` | Offscreen 文档的 HTML 页面 |
| `src/offscreen.ts` | Offscreen 文档的主逻辑，运行 WebLLM |

### 修改文件

| 文件 | 变更说明 |
|------|----------|
| `manifest.json` | 添加 `offscreen` 权限，移除 CSP 配置 |
| `src/background.ts` | 使用 Offscreen API，通过消息传递与 WebLLM 通信 |
| `vite.config.ts` | 添加 offscreen.html 到构建配置 |

### 删除内容

- 移除了 `manifest.json` 中的 `content_security_policy` 配置
- background.ts 中不再直接实例化 WebLLMManager

## 消息流程

### 1. 模型初始化

```
用户点击下载
    ↓
onboarding.js → background.ts (PRELOAD_MODEL)
    ↓
background.ts → 创建 offscreen 文档
    ↓
background.ts → offscreen.ts (INITIALIZE_MODEL)
    ↓
offscreen.ts → 初始化 WebLLM
    ↓
offscreen.ts → background.ts (MODEL_PROGRESS)
    ↓
background.ts → onboarding.js (MODEL_DOWNLOAD_PROGRESS)
```

### 2. 生成摘要

```
用户点击开始分析
    ↓
popup.tsx → background.ts (SUMMARIZE_PAGE)
    ↓
background.ts → 创建 offscreen 文档
    ↓
background.ts → 提取页面内容
    ↓
background.ts → offscreen.ts (SUMMARIZE)
    ↓
offscreen.ts → WebLLM 生成摘要
    ↓
offscreen.ts → background.ts (结果)
    ↓
background.ts → popup.tsx (摘要数据)
```

## 关键代码

### 创建 Offscreen 文档

```typescript
async function ensureOffscreenDocument(): Promise<void> {
  if (offscreenCreated) return

  const runtime = chrome.runtime as any
  const existingContexts = await runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('src/offscreen.html')]
  })

  if (existingContexts && existingContexts.length > 0) {
    offscreenCreated = true
    return
  }

  const offscreen = chrome.offscreen as any
  await offscreen.createDocument({
    url: chrome.runtime.getURL('src/offscreen.html'),
    reasons: ['WORKERS'],
    justification: 'WebLLM 需要 WebAssembly 支持'
  })

  offscreenCreated = true
}
```

### 消息通信

```typescript
// Background → Offscreen
chrome.runtime.sendMessage({
  type: 'INITIALIZE_MODEL'
})

// Offscreen → Background
chrome.runtime.sendMessage({
  type: 'MODEL_PROGRESS',
  progress: 0.5,
  stage: '下载模型文件'
})
```

## 优势

1. **符合 CSP 规范** - Offscreen 文档有自己的上下文，不受 extension_pages CSP 限制
2. **隔离性更好** - WebLLM 运行在独立上下文中，不会影响主扩展
3. **更稳定** - WebLLM 的崩溃不会导致整个扩展崩溃
4. **符合最佳实践** - 这是 Chrome 官方推荐的处理复杂计算的方法

## 兼容性

- Chrome 109+ 支持 Offscreen API
- WebLLM 需要 WebGPU 支持 (Chrome 113+)

## 测试步骤

1. 重新加载扩展
2. 打开 onboarding 页面
3. 点击 "开始设置"
4. 点击 "立即下载模型"
5. 观察是否能正常下载和使用

## 调试

### 查看 Background 日志
```
chrome://extensions/ → Service Worker
```

### 查看 Offscreen 日志
1. 打开 offscreen.html 页面
2. 右键 → 检查 → Console

## 下一步

1. 在 Chrome 中重新加载扩展
2. 测试模型下载功能
3. 测试摘要生成功能
4. 观察日志输出
