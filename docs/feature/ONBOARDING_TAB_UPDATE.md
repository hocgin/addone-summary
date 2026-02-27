# 引导页面新标签页实现

## ✅ 更新完成

引导流程现在在独立标签页中展示，不再在 Popup 中显示。

## 📋 实现变更

### 之前：Popup 内引导

```
用户点击扩展图标
    ↓
Popup 打开
    ↓
在 Popup 中显示 OnboardingView 组件
    ↓
引导流程占用 Popup 空间
```

### 现在：独立标签页引导

```
扩展安装 → 自动打开 welcome.html
    ↓
welcome.html → 打开 onboarding.html（新标签页）
    ↓
onboarding.html 显示完整引导流程
    ↓
完成后关闭标签页
    ↓
用户点击扩展图标 → 正常 Popup 显示
```

## 🔧 技术变更

### 1. 创建独立的 onboarding.html

**位置：** `src/onboarding.html`

**特点：**
- 完全独立的 HTML 页面
- 内嵌所有样式和脚本
- 紫色渐变精美设计
- 4 步引导流程

### 2. 移除 Popup 中的 OnboardingView

**App.tsx 简化：**
```typescript
// 之前：管理 onboarding/main 两种模式
type ViewMode = 'onboarding' | 'main'

// 现在：只有主界面
// Popup 只负责日常功能，不处理引导
```

### 3. Background 处理引导流程

**新增功能：**

| 事件 | 行为 |
|------|------|
| 安装扩展 | 打开 welcome.html |
| 点击图标（未引导） | 打开 onboarding.html |
| onboarding.html 完成 | 关闭标签页，保存状态 |

### 4. 权限更新

**manifest.json 添加：**
```json
"permissions": [
  "activeTab",
  "scripting",
  "storage",
  "tabs"  // 新增：用于打开新标签页
]
```

### 5. 欢迎页面更新

**welcome.html：**
```javascript
// 之前：发送消息给 background
chrome.runtime.sendMessage({ type: 'OPEN_ONBOARDING' })

// 现在：直接创建新标签页
chrome.tabs.create({
  url: chrome.runtime.getURL('src/onboarding.html')
})
```

## 📂 文件变更

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/onboarding.html` | ✨ 新建 | 独立引导页面 |
| `src/App.tsx` | 🔧 修改 | 移除 OnboardingView |
| `src/background.ts` | 🔧 修改 | 添加图标点击处理 |
| `src/types/index.ts` | 🔧 修改 | 添加 OpenOnboardingRequest |
| `manifest.json` | 🔧 修改 | 添加 tabs 权限 |
| `src/welcome.html` | 🔧 修改 | 打开 onboarding.html |

**删除/不再使用：**
- `src/components/OnboardingView.tsx` - 不再需要
- `src/components/OnboardingView.css` - 不再需要

## 🎨 onboarding.html 预览

**整体布局：**
```
┌─────────────────────────────────────────┐
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  进度条
│                                         │
│              [步骤图标]                 │
│            步骤标题                     │
│            步骤描述                     │
│                                         │
│              [内容区域]                 │
│                                         │
│            [按钮组]                     │
└─────────────────────────────────────────┘
```

**4 个步骤：**

1. **欢迎**
   - 🎉 图标
   - 功能介绍列表
   - "开始设置"按钮

2. **检查 WebGPU**
   - ✅ / ⚠️ 结果图标
   - 支持状态说明
   - "立即下载模型"或"稍后再说"

3. **下载模型**
   - 旋转加载动画
   - 进度条（0-100%）
   - 下载信息
   - "后台下载"按钮

4. **完成**
   - ✓ 成功动画
   - 使用指南
   - "开始使用"按钮

## 🔄 用户流程

### 首次安装

```
1. 加载扩展到 Chrome
    ↓
2. 自动打开 welcome.html（新标签页）
    ↓
3. welcome.html 自动打开 onboarding.html
    ↓
4. 用户完成 4 步引导流程
    ↓
5. onboarding.html 关闭
    ↓
6. 以后点击扩展图标显示正常 Popup
```

### 重复安装/重置

```javascript
// 重置引导状态
chrome.storage.local.remove('onboardingCompleted')

// 刷新扩展
// chrome://extensions/ → 刷新按钮

// 下次点击图标会打开 onboarding.html
```

## 🧪 测试方法

### 1. 首次安装测试

```bash
# 清除旧扩展
chrome://extensions/ → 移除扩展

# 重新加载
pnpm build
# 加载 dist/ 目录

# 观察
# - welcome.html 自动打开
# - 自动跳转到 onboarding.html
```

### 2. 引导流程测试

**在新打开的 onboarding.html 标签页中：**
1. 点击"开始设置"→ 检查 WebGPU
2. 查看 WebGPU 检查结果
3. 点击"立即下载模型"→ 显示下载进度
4. 完成后查看完成页面
5. 点击"开始使用"→ 标签页关闭

### 3. 日常使用测试

```
完成后，点击扩展图标
    ↓
应该看到正常的 Popup
    ↓
WelcomeView（不是 OnboardingView）
```

### 4. 重置测试

```javascript
// 在 Console 中执行
chrome.storage.local.remove('onboardingCompleted')

// 刷新扩展
chrome://extensions/ → 刷新按钮

// 再次点击扩展图标
// 应该打开 onboarding.html
```

## 📊 对比表

| 特性 | Popup 引导 | 标签页引导 ✅ |
|------|-----------|--------------|
| 空间 | 有限（360px 宽） | 充足（浏览器标签页） |
| 持续性 | 关闭 Popup 丢失 | 保持状态 |
| 体验 | 受限 | 完整网页体验 |
| 设计 | 需适应小尺寸 | 自由设计 |
| 后台任务 | 关闭即中断 | 可继续下载 |
| 用户友好 | 一般 | 更好 |

## 🎯 优势

1. **更好的用户体验**
   - 完整的浏览器标签页
   - 不受 Popup 尺寸限制
   - 可以展示更多信息

2. **更灵活的设计**
   - 使用完整的 CSS 和 HTML
   - 不需要适应小尺寸
   - 更精美的视觉效果

3. **更好的状态管理**
   - 独立页面，状态不丢失
   - 用户可以切换标签页
   - 支持后台下载

4. **更简单的代码**
   - App.tsx 更简洁
   - 不需要复杂的视图模式切换
   - 职责分离更清晰

## 📚 相关文件

- `src/onboarding.html` - 独立引导页面
- `src/welcome.html` - 欢迎入口页面
- `ONBOARDING_GUIDE.md` - 引导流程文档（需更新）

## ✅ 总结

引导流程现在在独立标签页中展示，用户体验更佳，代码更简洁！

下次测试时，应该看到：
1. 安装后打开 welcome.html
2. 自动跳转到 onboarding.html（新标签页）
3. 完成引导后标签页关闭
4. 以后点击图标显示正常 Popup
