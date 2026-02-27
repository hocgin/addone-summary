# 模型初始化进度展示

## 更新内容

已增强模型初始化进度展示，现在显示以下详细信息：

### 新增功能

1. **阶段性进度指示**
   - 初始化环境
   - 加载模型权重
   - 下载模型文件
   - 编译模型
   - 准备推理引擎

2. **详细下载信息**
   - 已下载大小
   - 总大小
   - 下载速度
   - 剩余时间

3. **改进的 UI**
   - 阶段标签显示
   - 进度详情网格
   - 更清晰的视觉反馈

## 进度展示效果

### LoadingView 界面

```
┌─────────────────────────────────┐
│         (旋转加载图标)            │
│                                 │
│     AI 正在分析中               │
│     下载模型文件... 45%          │
│                                 │
│  ████████░░░░░░░░░░░  45%      │
│                                 │
│  ┌─────────┬─────────┬─────────┐│
│  │ 已下载  │下载速度 │剩余时间 ││
│  │ 450 MB  │ 2.3MB/s │ 240秒   ││
│  └─────────┴─────────┴─────────┘│
│                                 │
│  ⚙️  📄  🤖                     │
│  ✓   ✓   ○                      │
└─────────────────────────────────┘
```

## 技术实现

### 数据流

1. **WebLLMManager** (webllm-manager.ts)
   - 监听模型初始化进度
   - 计算下载速度和剩余时间
   - 确定当前阶段

2. **Background Service Worker** (background.ts)
   - 接收 WebLLM 进度更新
   - 转换为 ProgressUpdate 消息
   - 发送到 Popup

3. **App Component** (App.tsx)
   - 监听 PROGRESS_UPDATE 消息
   - 更新进度状态
   - 传递给 LoadingView

4. **LoadingView** (LoadingView.tsx)
   - 显示进度条
   - 显示阶段信息
   - 显示下载详情

### 类型定义

```typescript
// WebLLMProgress - WebLLM 进度报告
interface WebLLMProgress {
  progress: number        // 0-1
  timeElapsed: number     // 毫秒
  stage?: string          // 当前阶段
  downloaded?: string     // 已下载大小
  total?: string          // 总大小
  speed?: string          // 下载速度
  remaining?: string      // 剩余时间
}

// ProgressUpdate - 发送到 Popup 的消息
interface ProgressUpdate {
  type: 'PROGRESS_UPDATE'
  progress: number
  message: string
  stage?: string
  details?: {
    downloaded?: string
    total?: string
    speed?: string
    remaining?: string
  }
}
```

## 阶段划分

模型初始化分为以下阶段：

| 进度范围 | 阶段 | 说明 |
|---------|------|------|
| 0-10% | 初始化环境 | WebGPU 上下文创建 |
| 10-30% | 加载模型权重 | 读取模型配置 |
| 30-60% | 下载模型文件 | 从 CDN 下载权重 |
| 60-90% | 编译模型 | WebGPU 编译 |
| 90-100% | 准备推理引擎 | 初始化完成 |

## 首次加载时间估算

基于网络速度的估算：

| 网络速度 | 模型下载 | 总耗时 |
|---------|---------|--------|
| 10 Mbps | ~13 分钟 | ~15 分钟 |
| 50 Mbps | ~2.5 分钟 | ~4 分钟 |
| 100 Mbps | ~1.2 分钟 | ~2.5 分钟 |
| 1 Gbps | ~8 秒 | ~30 秒 |

注意：首次加载后，模型会被缓存，后续启动时间约 5-10 秒。
