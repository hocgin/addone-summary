# 查看 Offscreen 文档日志的方法

## 方法 1: 通过 chrome://extensions/（推荐）

1. 打开 `chrome://extensions/`
2. 确保 "开发者模式" 已开启（右上角开关）
3. 找到 "WebLLM-X" 扩展
4. 向下滚动找到 "检查视图" 部分
5. 应该会看到类似 `src/offscreen.html` 的条目
6. 点击该条目即可打开 offscreen 文档的开发者工具

## 方法 2: 如果没有看到 "检查视图"

如果 offscreen 文档还没有创建，先触发它：

1. 打开 onboarding 页面
2. 点击 "开始设置"
3. 点击 "立即下载模型"
4. 快速回到 `chrome://extensions/`
5. 刷新页面，应该就能看到 offscreen 文档了

## 方法 3: 通过 Background Console 手动创建

在 Background Service Worker 控制台中运行：

```javascript
chrome.offscreen.createDocument({
  url: chrome.runtime.getURL('src/offscreen.html'),
  reasons: ['WORKERS'],
  justification: '调试'
})
```

然后刷新扩展页面，应该就能看到 "检查视图" 了。

## 预期的 Offscreen 日志

正常的日志应该类似：

```
[Offscreen] Offscreen document loaded
[Offscreen] 消息监听器已设置
[Offscreen] 收到消息: INITIALIZE_MODEL
[Offscreen] 开始处理 INITIALIZE_MODEL
[Offscreen] 开始初始化模型...
[Offscreen] 模型当前状态: { isReady: false, initProgress: 0 }
[WebLLM] 开始初始化模型...
[WebLLM] 进度: 5.0% | 阶段: 初始化 WebGPU 环境
...
```

## 如果看到错误

### "WebGPU not available"
- 设备不支持 WebGPU
- 需要更新 Chrome 或启用 WebGPU

### "Failed to fetch"
- 网络问题
- 模型下载源无法访问
- 可能需要代理或 VPN

### "Out of memory"
- 设备内存不足
- 关闭其他标签页或应用

### "timeout"
- 下载超时
- 网络速度慢
- 模型文件太大

## 完整的调试步骤

1. 打开所有三个控制台
   - Background Service Worker
   - Onboarding 页面
   - Offscreen 文档

2. 清空所有控制台（右键 → Clear console）

3. 开始下载流程

4. 观察日志输出顺序

5. 如果有错误，复制完整的错误堆栈

## 常见问题

### Q: Offscreen 文档创建后立即消失
A: 可能是初始化时崩溃了。检查是否有未捕获的异常。

### Q: 看不到 "检查视图"
A: Offscreen 文档可能还没创建，或者创建失败了。先触发下载流程。

### Q: 日志太多，找不到关键信息
A: 使用过滤功能。在控制台搜索框输入关键：
- `[Offscreen]`
- `[WebLLM]`
- `error`
- `failed`

## 下一步

请查看 Offscreen 文档的日志，然后告诉我看到了什么。特别关注：

1. 是否有 `[WebLLM] 开始初始化模型...` 这条日志？
2. 是否有任何错误信息（红色）？
3. 最后一条日志是什么？
