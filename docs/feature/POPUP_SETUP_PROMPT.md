# Popup 模型初始化检查功能

## ✅ 功能完成

Popup 现在会自动检查模型是否已初始化，如果未完成则引导用户到引导页面完成设置。

## 🎯 功能说明

### 检测流程

```
用户点击扩展图标
    ↓
Popup 打开
    ↓
App.tsx 检查模型状态
    ↓
    ├─ 已初始化 → 显示 WelcomeView（正常界面）
    │
    └─ 未初始化 → 显示 SetupPromptView（设置提示）
           ↓
       用户点击"开始设置"按钮
           ↓
       打开 onboarding.html（新标签页）
           ↓
       完成模型下载和初始化
```

### 三种 Popup 状态

| 状态 | 说明 | 显示 |
|------|------|------|
| 检查中 | 正在向 background 查询模型状态 | 加载动画 |
| 需要设置 | 模型未初始化 | SetupPromptView |
| 已就绪 | 模型已初始化 | WelcomeView |

## 🎨 SetupPromptView 界面

```
┌─────────────────────────────────┐
│                                 │
│            ⚙️                  │
│       需要完成初始化设置        │
│                                 │
│  首次使用需要下载 AI 模型文件   │
│  （约 1GB），完成后即可开始使用  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ ① 检查设备支持          │  │
│  │    检测 WebGPU 可用性    │  │
│  ├───────────────────────────┤  │
│  │ ② 下载 AI 模型          │  │
│  │    约 1GB，首次使用需要  │  │
│  ├───────────────────────────┤  │
│  │ ③ 开始使用              │  │
│  │    智能分析网页内容      │  │
│  └───────────────────────────┘  │
│                                 │
│  ⏱️ 3-15分钟  💾 1GB  🔒 本地  │
│                                 │
│  ┌───────────────────────────┐  │
│  │      开始设置              │  │
│  └───────────────────────────┘  │
│                                 │
│  模型下载完成后会自动缓存     │
└─────────────────────────────────┘
```

## 🔧 技术实现

### 1. App.tsx 状态检查

```typescript
const [isCheckingModel, setIsCheckingModel] = useState(true)
const [needsSetup, setNeedsSetup] = useState(false)

useEffect(() => {
  // 检查模型状态
  chrome.runtime.sendMessage({ type: 'CHECK_MODEL_STATUS' }, (response) => {
    setIsCheckingModel(false)

    if (chrome.runtime.lastError) {
      setNeedsSetup(true)
    } else if (response?.isModelLoaded) {
      setNeedsSetup(false)
    } else {
      setNeedsSetup(true)
    }
  })
}, [])
```

### 2. 条件渲染

```typescript
// 检查中
if (isCheckingModel) {
  return <div className="app-container checking">...</div>
}

// 需要设置
if (needsSetup && status === 'idle') {
  return (
    <div className="app-container">
      <SetupPromptView onSetup={openOnboarding} />
    </div>
  )
}

// 正常界面
return (
  <div className="app-container">
    <WelcomeView onStart={handleSummarize} isModelLoaded={isModelLoaded} />
    ...
  </div>
)
```

### 3. 打开引导页面

```typescript
const openOnboarding = () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('src/onboarding.html')
  })
}
```

## 📂 新增文件

| 文件 | 说明 |
|------|------|
| `src/components/SetupPromptView.tsx` | 设置提示组件 |
| `src/components/SetupPromptView.css` | 设置提示样式 |

## 🔄 用户场景

### 场景 1: 首次使用

```
1. 用户安装扩展
2. 点击扩展图标
3. Popup 显示 SetupPromptView
4. 用户点击"开始设置"
5. 打开 onboarding.html
6. 完成模型下载
7. 再次点击图标 → 显示正常 WelcomeView
```

### 场景 2: 模型未初始化

```
1. 用户清理了浏览器数据
2. 点击扩展图标
3. Popup 显示 SetupPromptView
4. 引导到 onboarding.html 重新下载
```

### 场景 3: 已完成设置

```
1. 用户点击扩展图标
2. Popup 直接显示 WelcomeView
3. 可以正常使用功能
```

## 🧪 测试方法

### 测试未初始化状态

```javascript
// 1. 模拟未初始化状态（在 background.js Console 中）
webllmManager.dispose()

// 2. 关闭并重新打开 Popup
// 应该看到 SetupPromptView
```

### 测试已初始化状态

```javascript
// 确保模型已加载
// 打开 Popup 应该看到 WelcomeView
```

### 重置测试

```javascript
// 清除所有数据
chrome.storage.local.clear()

// 刷新扩展
chrome://extensions/ → 刷新按钮

// 应该显示 SetupPromptView
```

## 📊 对比表

| 之前 | 现在 |
|------|------|
| Popup 不检查模型状态 | 自动检查模型状态 |
| 未初始化也显示正常界面 | 显示设置提示界面 |
| 用户不知道需要下载 | 明确引导用户下载 |
| 点击"开始分析"才报错 | 提前引导到设置页面 |

## 🎯 用户体验改进

### 清晰的引导

1. **首次安装**
   - ✅ 明确告知需要下载模型
   - ✅ 说明预计时间和大
   - ✅ 一键跳转到设置页面

2. **状态提示**
   - ✅ 检查中显示加载动画
   - ✅ 未初始化显示设置提示
   - ✅ 已初始化显示正常界面

3. **操作便捷**
   - ✅ 单击即可打开设置页面
   - ✅ 在新标签页中完成设置
   - ✅ 完成后直接可用

## 📝 完整流程图

```
安装扩展
    ↓
点击图标
    ↓
┌─────────────────────┐
│  Popup 打开          │
│  检查模型状态        │
└──────┬──────────────┘
       │
       ├─ 已初始化 → WelcomeView
       │                    ↓
       │               点击"开始分析"
       │                    ↓
       │               使用功能
       │
       └─ 未初始化 → SetupPromptView
                          ↓
                       点击"开始设置"
                          ↓
                  onboarding.html (新标签页)
                          ↓
                       完成模型下载
                          ↓
                       再次点击图标
                          ↓
                       WelcomeView (正常)
```

## 🔍 调试技巧

### 查看 Popup 状态

```javascript
// 在 Popup DevTools Console 中
chrome.runtime.sendMessage({ type: 'CHECK_MODEL_STATUS' }, (response) => {
  console.log('模型状态:', response)
})

// 或检查 storage
chrome.storage.local.get(['onboardingCompleted'], (result) => {
  console.log('引导完成:', result)
})
```

### 查看 Background 状态

```javascript
// 在 background.js Console 中
webllmManager.isReady()  // true/false
```

## ✅ 总结

Popup 现在能够：

1. ✅ 自动检测模型是否已初始化
2. ✅ 未初始化时显示友好的设置提示
3. ✅ 一键跳转到引导页面完成设置
4. ✅ 初始化完成后正常显示主界面

这样用户永远不会遇到"不知道该做什么"的情况！
