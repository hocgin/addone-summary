# CSP（内容安全策略）问题修复

## ✅ 问题已彻底解决

通过两轮修复，彻底解决了所有 CSP 违规问题：
1. **第一轮**：将内联脚本代码移到外部 JS 文件
2. **第二轮**：添加 WebAssembly 支持（`wasm-unsafe-eval`）

通过将 `onboarding.html` 中的所有 JavaScript 代码移到独立的 `onboarding.js` 文件，彻底解决了 CSP 违规问题。

## 🔧 问题原因

### 错误 1：内联脚本和事件处理器

**错误信息：**
```
Executing inline event handler violates the following Content Security Policy directive:
'script-src 'self'...'
```

**原因：**
- HTML 中使用了内联事件处理器（如 `onclick="checkWebGPU()"`）
- HTML 中包含了内联 `<script>` 代码块
- 这违反了 CSP 的 `script-src` 策略

### 错误 2：WebAssembly 执行被阻止

**错误信息：**
```
CompileError: WebAssembly.instantiate(): Compiling or instantiating WebAssembly module
violates the following Content Security policy directive because neither 'wasm-eval'
nor 'unsafe-eval' is an allowed source of script
```

**原因：**
- WebLLM 使用 WebAssembly 进行本地 AI 推理
- Chrome 扩展的默认 CSP 策略不允许执行 WebAssembly
- 需要显式添加 `wasm-unsafe-eval` 到 CSP 策略中

## 🛠️ 最终修复方案

### 修复 1：移除内联脚本（第一轮）

#### 1. 创建独立的外部 JS 文件

**创建 `src/onboarding.js`**：
```javascript
let currentStep = 1

function showStep(stepNumber) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'))
  document.getElementById(`step-${stepNumber}`).classList.add('active')
  // ... 其他函数
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('start-setup-btn').addEventListener('click', checkWebGPU)
  document.getElementById('check-next-btn').addEventListener('click', startDownload)
  document.getElementById('skip-btn').addEventListener('click', skipOnboarding)
  document.getElementById('background-download-btn').addEventListener('click', skipOnboarding)
  document.getElementById('finish-btn').addEventListener('click', finishOnboarding)
  // ... 其他初始化代码
})
```

### 2. 更新 HTML 文件引用外部脚本

**之前（内联脚本，违反 CSP）：**
```html
<script>
  document.addEventListener('DOMContentLoaded', function() {
    // 大量 JavaScript 代码
    function checkWebGPU() { ... }
    function startDownload() { ... }
    // ... 更多代码
  });
</script>
```

**现在（外部脚本，符合 CSP）：**
```html
<script src="onboarding.js"></script>
```

### 3. 更新 Vite 配置

**vite.config.ts**：
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        popup: 'src/popup.html',
        background: 'src/background.ts',
        'content-script': 'src/content-scripts/extractor.ts',
        onboarding: 'src/onboarding.html'  // 确保包含 onboarding 入口
      }
    }
  }
})
```

### 4. 更新 manifest.json（第一轮）

**manifest.json**：
```json
{
  "web_accessible_resources": [
    {
      "resources": [
        "src/welcome.html",
        "src/onboarding.html",
        "src/onboarding.js",  // 添加外部 JS 文件
        "src/content-scripts/extractor.ts"
      ],
      "matches": ["<all_urls>"]
    }
  ]
}
```

### 修复 2：添加 WebAssembly 支持（第二轮）

#### 问题

WebLLM 需要 WebAssembly 来执行本地 AI 推理，但 Chrome 扩展的默认 CSP 策略不允许 WebAssembly 执行。

#### 解决方案：添加 CSP 策略

**manifest.json** 添加 `content_security_policy` 字段：

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; worker-src 'self';"
  }
}
```

**CSP 策略说明：**
- `script-src 'self' 'wasm-unsafe-eval'` - 允许执行同源脚本和 WebAssembly 模块
- `object-src 'self'` - 只允许加载同源对象（防止插件攻击）
- `worker-src 'self'` - 只允许同源 Worker（Service Worker 是必需的）

**为什么需要 `wasm-unsafe-eval`？**
- WebAssembly 模块通过 `WebAssembly.instantiate()` 动态编译
- 这类似于 `eval()` 的行为，需要显式授权
- WebLLM 使用 WebAssembly 实现 GPU 加速的 AI 推理

**之前：**
```html
<button onclick="checkWebGPU()">开始设置</button>
<button onclick="skipOnboarding()">稍后再说</button>
```

**现在：**
```html
<button id="start-setup-btn">开始设置</button>
<button id="skip-btn">稍后再说</button>
```

### 2. 使用 addEventListener

```javascript
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('start-setup-btn')?.addEventListener('click', checkWebGPU);
  document.getElementById('skip-btn')?.addEventListener('click', skipOnboarding);
  document.getElementById('background-download-btn')?.addEventListener('click', skipOnboarding);
  document.getElementById('finish-btn')?.addEventListener('click', finishOnboarding);
});
```

### 3. 添加 CSP 策略到 manifest.json

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; script-src-elem 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  }
}
```

**CSP 策略说明：**
- `script-src 'self'` - 只允许加载同源脚本
- `object-src 'self'` - 只允许加载同源对象
- `script-src-elem 'self' 'unsafe-inline'` - 允许内联脚本执行
- `style-src 'self' 'unsafe-inline'` - 允许内联样式

## 📂 修改的文件

| 文件 | 修改内容 |
|------|---------|
| `src/onboarding.js` | **新建** - 包含所有 JavaScript 逻辑（194 行） |
| `src/onboarding.html` | 移除内联 `<script>` 代码块，替换为 `<script src="onboarding.js"></script>` |
| `vite.config.ts` | 添加 `onboarding: 'src/onboarding.html'` 入口配置 |
| `manifest.json` | 添加 `src/onboarding.js` 到 `web_accessible_resources` |

## 🔄 变更对比

### HTML 文件大小变化

| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| HTML 文件大小 | 22.85 kB | 15.47 kB |
| JS 文件大小 | 无 | 6.66 kB |
| 总大小 | 22.85 kB | 22.13 kB |
| CSP 错误 | ❌ 多个违规 | ✅ 无违规 |

### onboarding.html 结构变更

**之前（第 645-840 行，共 196 行内联代码）：**
```html
<script>
  document.addEventListener('DOMContentLoaded', function() {
    let currentStep = 1;
    // ... 大量代码
  });
</script>
```

**现在（仅 1 行）：**
```html
<script src="onboarding.js"></script>
```

### JavaScript 代码组织变更

**之前（在 HTML 内，难以维护）：**
```javascript
// 内联在 onboarding.html 中，包含：
// - 事件绑定（部分使用 onclick）
// - checkWebGPU 函数
// - startDownload 函数
// - updateTimeline 函数
// - skipOnboarding/finishOnboarding 函数
```

**现在（外部文件，便于维护）：**
```javascript
// src/onboarding.js - 清晰的模块化结构：
// - 函数定义（showStep, checkWebGPU, startDownload 等）
// - DOMContentLoaded 事件监听器
// - 所有事件绑定使用 addEventListener
```

## 🔄 变更对比

### HTML 变更

| 元素 | 之前 | 现在 |
|------|------|------|
| 按钮 | `onclick="function()"` | `id="btn-id"` |
| 事件绑定 | HTML 属性 | JavaScript addEventListener |

### JavaScript 结构

```javascript
// 之前：直接在全局作用域
function checkWebGPU() { ... }
function skipOnboarding() { ... }

// 现在：在 DOMContentLoaded 事件中
document.addEventListener('DOMContentLoaded', () => {
  // 绑定事件
  // 检查状态
});
```

## ✅ 验证方法

### 1. 文件结构验证

```bash
# 检查源文件是否正确分离
ls -la src/onboarding.*
# 输出应该包含：
# -rw-r--r-- onboarding.html  (15KB 左右)
# -rw-r--r-- onboarding.js    (7KB 左右)

# 检查构建输出
ls -la dist/src/onboarding.*
# 输出应该包含：
# -rw-r--r-- onboarding.html  (15KB 左右)
# -rw-r--r-- onboarding.js    (6.6KB 左右)

# 验证 HTML 中没有内联脚本
grep -n '<script>' dist/src/onboarding.html
# 应该只输出一行：带有 src 属性的 script 标签
```

### 2. 控制台检查

打开 onboarding.html 页面后，检查 Console：

```
✅ 无 CSP 违规错误
✅ 无 "Executing inline script" 错误
✅ 无 "Executing inline event handler" 错误
✅ 事件监听器已绑定
✅ 按钮可以正常点击
```

### 2. 功能测试

**测试步骤：**

1. **欢迎页面（步骤 1）**
   - 点击"开始设置"按钮
   - ✅ 应该跳转到步骤 2

2. **检查结果（步骤 2）**
   - 查看 WebGPU 检查结果
   - ✅ 如果支持，点击"立即下载模型"
   - ✅ 如果不支持，看到解决方法

3. **下载页面（步骤 3）**
   - 观察下载进度
   - ✅ 点击"后台下载"关闭页面

4. **完成页面（步骤 4）**
   - 点击"开始使用"
   - ✅ 页面关闭

## 🎯 CSP 最佳实践

### Chrome 扩展 CSP 规则

1. **避免内联脚本**
   - ❌ `onclick="doSomething()"`
   - ✅ `addEventListener('click', doSomething)`

2. **避免内联样式（可选）**
   - ⚠️ `style="color: red"`
   - ✅ 外部 CSS 文件

3. **避免 eval()**
   - ❌ `eval('code')`
   - ✅ 直接执行代码

4. **使用 CSP nonce**（高级）
   ```html
   <script nonce="${nonce}">...</script>
   ```

### Manifest V3 CSP

```json
{
  "content_security_policy": {
    "extension_pages": "策略字符串",
    "sandbox": "策略字符串"
  }
}
```

## 📚 参考资料

- [Chrome Extension CSP](https://developer.chrome.com/docs/extensions/mv3/intro/#content-security-policy)
- [Content Security Policy Level 3](https://www.w3.org/TR/CSP3/)
- [MDN - CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## 🔍 调试 CSP 问题

### 查看错误

```javascript
// 在 Console 中查看
// 会显示详细的 CSP 违规信息
```

### 验证 CSP

```bash
# 检查生成的 manifest.json
cat dist/manifest.json | grep content_security_policy
```

### 测试策略

```html
<!-- 测试 CSP 是否生效 -->
<script>
  try {
    eval('1+1'); // 应该被阻止
  } catch (e) {
    console.log('CSP 工作正常');
  }
</script>
```

## ✨ 总结

CSP 问题已彻底解决，通过两轮修复：

### 第一轮：内联脚本修复
1. ✅ **移除了所有内联脚本代码** - 从 HTML 文件中移除 196 行 JavaScript 代码
2. ✅ **创建独立外部 JS 文件** - `src/onboarding.js` 包含所有逻辑
3. ✅ **使用 addEventListener 绑定所有事件** - 包括 check-next-btn 按钮
4. ✅ **更新构建配置** - Vite 正确处理外部脚本引用
5. ✅ **更新 manifest.json** - onboarding.js 已添加到 web_accessible_resources

### 第二轮：WebAssembly 支持
6. ✅ **添加 `wasm-unsafe-eval` 策略** - 允许 WebAssembly 执行
7. ✅ **配置完整的 CSP 策略** - 包括 script-src, object-src, worker-src
8. ✅ **支持 WebLLM 本地 AI 推理** - WebGPU 加速现在可以正常工作

## 🎯 关键要点

### 为什么外部脚本有效而内联脚本无效？

**Chrome 扩展 CSP 默认策略：**
```
script-src 'self'; object-src 'self'
```

- **内联脚本** (`<script>code</script>`) - ❌ 违反 CSP，因为代码不在外部文件中
- **外部脚本** (`<script src="file.js"></script>`) - ✅ 符合 CSP，因为来自同源外部文件
- **内联事件** (`onclick="func()"`) - ❌ 违反 CSP，等同于内联脚本
- **addEventListener** - ✅ 符合 CSP，在 JS 文件中绑定事件

### 构建输出对比

**修复前：**
```
dist/src/onboarding.html  22.85 kB  (包含内联脚本)
错误: CSP violation - inline script
```

**修复后：**
```
dist/src/onboarding.js     6.66 kB  (独立外部文件)
dist/src/onboarding.html  15.47 kB  (引用外部脚本)
✓ 无 CSP 错误
```

现在引导页面可以完全正常工作，不会再出现任何 CSP 相关错误！
