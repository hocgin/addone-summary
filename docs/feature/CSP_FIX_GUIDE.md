# CSP 修复备用方案

## 问题背景
Chrome 扩展 Manifest V3 对 WebAssembly 的 CSP 支持有限，`'wasm-eval'` 和 `'wasm-unsafe-eval'` 可能不被允许。

## 备用方案

### 方案 1: 移除 CSP 配置（推荐尝试）

如果 `'wasm-unsafe-eval'` 仍然不工作，可以尝试移除整个 CSP 配置：

```json
{
  "manifest_version": 3,
  // ... 其他配置 ...
  // 完全移除 content_security_policy 字段
}
```

**说明：** Chrome 会使用默认的严格 CSP 策略。WebLLM 可能需要特殊处理才能在默认策略下工作。

### 方案 2: 使用沙盒页面

将 WebLLM 运行在沙盒页面中：

1. **创建沙盒页面**
   - 添加 `sandbox.html` 页面
   - 在 manifest.json 中声明为沙盒页面

2. **manifest.json 配置**
   ```json
   {
     "sandbox": {
       "pages": ["sandbox.html"],
       "content_security_policy": "sandbox allow-scripts allow-popups; script-src 'self' 'unsafe-eval' 'unsafe-inline';"
     }
   }
   ```

3. **通过消息通信**
   - background script 通过 postMessage 与沙盒页面通信
   - 沙盒页面执行 WebLLM 操作

### 方案 3: 使用 Chrome 扩展的 Offscreen API

创建一个 offscreen 文档来运行 WebLLM：

1. **创建 offscreen.html**
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <script src="background.js"></script>
   </head>
   <body></body>
   </html>
   ```

2. **添加权限**
   ```json
   {
     "permissions": ["offscreen"]
   }
   ```

3. **在 background.ts 中创建 offscreen 文档**
   ```typescript
   chrome.offscreen.createDocument({
     url: 'offscreen.html',
     reasons: ['WEBLLM'],
     justification: '需要 WebAssembly 支持'
   })
   ```

## 当前状态

### 已尝试
- ✅ 使用 `'wasm-unsafe-eval'` 替代 `'wasm-eval'`

### 待测试
- ⏳ 在 Chrome 中重新加载扩展
- ⏳ 验证 WebLLM 是否能正常加载

## 下一步

请先尝试重新加载扩展。如果仍然出现 CSP 错误，请告诉我具体的错误信息，我会提供相应的备用方案。

## 参考资料

- [Chrome Extension CSP](https://developer.chrome.com/docs/extensions/mv3/content_security_policy/)
- [WebAssembly in Chrome Extensions](https://developer.chrome.com/docs/extensions/mv3/wasm/)
