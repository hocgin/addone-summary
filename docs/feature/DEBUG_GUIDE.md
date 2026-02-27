# 模型下载调试指南

## 问题描述
弹窗提示"模型下载失败: 未知错误"，但网络显示正在下载。

## 快速诊断步骤

### 1. 查看 Background Script 日志

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 找到 "WebLLM-X" 扩展
4. 点击 "Service Worker" 链接
5. 查看控制台输出

**预期日志输出：**
```
[Background] 收到 PRELOAD_MODEL 请求
[Background] WebGPU 检查通过，开始初始化...
[Background] 模型当前状态: { isReady: false, initProgress: 0 }
[Background] 开始初始化 WebLLM...
[WebLLM] 开始初始化模型...
[WebLLM] 进度: 5.0% | 阶段: 初始化 WebGPU 环境
[WebLLM] 进度: 45.0% | 阶段: 下载模型文件
```

### 2. 查看 Onboarding 页面日志

1. 在 onboarding 页面上右键点击
2. 选择 "检查" 或 "Inspect"
3. 切换到 "Console" 标签页
4. 点击 "开始设置" 和 "立即下载模型"

**预期日志输出：**
```
[Onboarding] 发送 PRELOAD_MODEL 请求...
[Onboarding] 收到响应: { success: true }
[Onboarding] 模型预加载成功
[Onboarding] 收到进度更新: { type: "MODEL_DOWNLOAD_PROGRESS", progress: 0.05, ... }
```

## 常见问题诊断

### 问题 1: WebGPU 不可用

**症状：**
- 日志显示 `[Background] WebGPU 不可用`
- 错误提示："您的浏览器不支持 WebGPU"

**解决方案：**
1. 检查 Chrome 版本（需要 113+）
2. 访问 `chrome://flags/`
3. 搜索 "WebGPU" 并启用相关选项
4. 重启浏览器

### 问题 2: 消息传递超时

**症状：**
- 日志显示 `[Onboarding] 请求超时`
- Background script 无日志输出

**可能原因：**
1. Background script 尚未完全加载
2. Chrome 消息通道阻塞
3. 扩展重新加载中

**解决方案：**
1. 在 `chrome://extensions/` 中刷新扩展
2. 完全关闭并重新打开 Chrome
3. 检查是否有其他扩展冲突

### 问题 3: 网络问题

**症状：**
- 日志显示下载进度缓慢
- 下载进度卡在某个百分比
- 网络显示正在下载但前端显示错误

**解决方案：**
1. 检查网络连接
2. 尝试使用 VPN（某些地区可能限制访问模型源）
3. 清除浏览器缓存后重试

### 问题 4: 内存不足

**症状：**
- 下载过程中浏览器崩溃
- 日志显示内存相关错误
- 进度卡在编译阶段

**解决方案：**
1. 关闭其他标签页和应用程序
2. 尝试使用更小的模型
3. 在 `chrome://flags/` 中启用 "WebGPU Developer Features"

## 高级调试

### 启用详细日志

在浏览器控制台中运行：
```javascript
// 启用所有日志
localStorage.setItem('debug', 'true')

// 查看存储的模型
indexedDB.open('webllm').onsuccess = (e) => {
  const db = e.target.result
  console.log('IndexedDB:', db)
}
```

### 手动检查模型状态

在 background script 控制台中运行：
```javascript
// 检查 WebLLM 引擎状态
const manager = window.webllmManager
console.log('Model Ready:', manager?.isReady())
console.log('Init Progress:', manager?.getInitProgress())
```

### 清除缓存并重试

```javascript
// 在控制台中运行
indexedDB.deleteDatabase('webllm')
chrome.storage.local.clear()
location.reload()
```

## 改进说明

本次更新改进了以下内容：

### 1. 增强的日志记录
- 所有关键步骤都有详细的日志输出
- 错误信息包含完整的堆栈跟踪
- 区分不同来源的日志（[Background]、[Onboarding]、[WebLLM]）

### 2. 更好的错误处理
- 增加超时保护机制
- 即使收到错误响应也继续监听进度
- 提供备用监听器处理消息通道问题

### 3. 诊断信息
- 记录模型当前状态
- 记录 WebGPU 检查结果
- 记录进度更新的详细信息

## 下一步操作

1. **重新构建项目**
   ```bash
   pnpm build
   ```

2. **重新加载扩展**
   - 在 `chrome://extensions/` 中点击刷新按钮

3. **重置引导状态**
   ```javascript
   chrome.storage.local.remove('onboardingCompleted')
   ```

4. **重新测试**
   - 打开扩展
   - 观察控制台日志
   - 截图保存任何错误信息

## 仍然无法解决？

如果问题仍然存在，请提供以下信息：

1. **环境信息**
   - Chrome 版本
   - 操作系统版本
   - 显卡型号

2. **日志输出**
   - Background script 的完整日志
   - Onboarding 页面的完整日志
   - 网络请求的详细信息

3. **复现步骤**
   - 具体操作步骤
   - 错误出现的时机
   - 是否每次都出现
