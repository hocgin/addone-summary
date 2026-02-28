# 网页内容总结 - WebLLM-X

> 使用本地 AI 智能分析网页内容，生成结构化摘要的 Chrome 浏览器扩展

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Chrome Version](https://img.shields.io/badge/Chrome-113%2B-green.svg)](https://www.google.com/chrome/)

## 特性

### 核心功能

- **本地 AI 分析** - 使用 WebLLM 在浏览器中运行 AI 模型，无需服务器
- **智能摘要生成** - 自动生成网页内容的结构化摘要
- **关键要点提取** - 提取 3-5 个关键要点，快速了解文章主旨
- **话题标签** - 自动生成 3-5 个话题标签
- **情感分析** - 分析文章的情感倾向（积极/中性/消极）
- **多语言支持** - 根据系统语言自动生成对应语言内容
- **模型切换** - 支持 5 种不同规模的 AI 模型
- **自动分析** - Side Panel 首次展开时自动分析当前网页

### 技术优势

- **隐私保护** - 所有数据处理在本地完成，不上传到服务器
- **WebGPU 加速** - 利用 GPU 加速推理，提升性能
- **离线可用** - 模型下载后可离线使用
- **实时进度** - 显示模型下载和生成的实时进度
- **智能重试** - 自动处理网络错误和重试逻辑

## 安装使用

### 系统要求

- Chrome 113+ 或支持 WebGPU 的 Chromium 浏览器
- 支持 WebGPU 的显卡（推荐）

### 安装步骤

1. **下载扩展**
   ```bash
   git clone https://github.com/hocgin/addone-summary
   cd addone-summary
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **构建项目**
   ```bash
   pnpm build
   ```

4. **加载到 Chrome**
   - 打开 Chrome，访问 `chrome://extensions/`
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目的 `dist` 目录

5. **首次使用**
   - 点击扩展图标打开 Side Panel
   - 首次使用会自动打开引导页面
   - 选择并下载 AI 模型（约 0.8-2.5GB）
   - 下载完成后即可开始使用

### 使用方法

1. **分析网页**
   - 访问任意网页（新闻、博客等）
   - 点击扩展图标打开 Side Panel
   - Side Panel 会自动分析当前网页
   - 或点击"开始分析"按钮手动触发

2. **切换模型**
   - 在 Side Panel 顶部点击模型选择器
   - 选择适合的模型：
     - **Phi-3.5 Mini (1B)** - 最快，适合快速摘要
     - **Llama 3.2 (1B)** - 快速，平衡性能（默认）
     - **Qwen 2 (1.5B)** - 中文支持好
     - **Gemma 2 (2B)** - 质量更高
     - **Phi-3 Mini (3.8B)** - 最佳质量

3. **重新生成**
   - 点击"重新生成"按钮使用相同页面重新分析
   - 切换到新网页会自动开始分析

## 支持的 AI 模型

| 模型 | 大小 | 特点 | 推荐场景 |
|------|------|------|----------|
| Phi-3.5 Mini | ~0.8GB | 最快速度 | 快速浏览大量网页 |
| Llama 3.2 | ~0.8GB | 平衡性能 | 日常使用（默认） |
| Qwen 2 | ~1.0GB | 中文优化 | 中文网页分析 |
| Gemma 2 | ~1.5GB | 高质量 | 需要更准确的摘要 |
| Phi-3 Mini | ~2.5GB | 最佳质量 | 重要文档分析 |

## 技术栈

### 核心技术

- **WebLLM** - 本地 LLM 推理引擎（[@mlc-ai/web-llm](https://github.com/mlc-ai/web-llm)）
- **React** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具

### 内容提取

- **Readability** - Mozilla 的网页内容提取库
- **多层级降级策略** - 确保内容提取成功率

### AI 增强

- **TypeBox** - JSON Schema 验证
- **jsonrepair** - AI 输出修复
- **结构化输出** - 使用 response_format 确保输出格式

## 开发指南

### 项目结构

```
addone-summary/
├── src/
│   ├── components/          # React 组件
│   │   ├── WelcomeView.tsx
│   │   ├── LoadingView.tsx
│   │   ├── SummaryView.tsx
│   │   ├── ErrorView.tsx
│   │   ├── SetupPromptView.tsx
│   │   └── ModelSelector.tsx
│   ├── content-scripts/     # 内容脚本
│   │   └── extractor.ts     # 网页内容提取
│   ├── lib/                 # 核心库
│   │   └── webllm-manager.ts # WebLLM 管理器
│   ├── utils/               # 工具函数
│   │   ├── prompts.ts       # AI 提示词
│   │   └── constants.ts     # 常量定义
│   ├── types/               # 类型定义
│   │   └── index.ts
│   ├── background.ts        # 后台服务
│   ├── offscreen.ts         # Offscreen 文档
│   ├── sidepanel.html       # Side Panel 入口
│   └── onboarding.html      # 引导页面
├── public/                  # 静态资源
│   └── icons/               # 图标
├── docs/                    # 文档
│   └── feature/             # 功能文档
├── manifest.json            # 扩展配置
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式（热重载）
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview

# 代码检查
pnpm lint
```

### 添加新模型

编辑 `src/utils/constants.ts`：

```typescript
export const AVAILABLE_MODELS = [
  {
    id: 'Your-Model-ID',
    name: '模型名称',
    description: '模型描述',
    size: '~1.0GB'
  },
  // ... 其他模型
]
```

### 自定义提示词

编辑 `src/utils/prompts.ts`：

```typescript
export const Prompts = {
  System: {
    DEFAULT: '你的系统提示词'
  },
  User: {
    SUMMARIZE: (text: string) => `你的用户提示词: ${text}`
  }
}
```

## 工作原理

### 架构概览

```
┌─────────────┐
│   Side Panel    │ ← 用户界面
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Background SW  │ ← 消息路由、标签页管理
└──────┬──────────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌──────────────┐  ┌──────────────┐
│ Content Script│  │  Offscreen   │
│  (提取网页内容) │  │  (AI 推理)   │
└──────────────┘  └──────────────┘
```

### 数据流

1. **内容提取**
   - Content Script 使用 Readability 提取网页文本
   - 验证内容质量（长度、格式）
   - 发送到 Background

2. **AI 推理**
   - Background 转发到 Offscreen Document
   - WebLLM 加载模型并生成摘要
   - 使用 TypeBox Schema 验证输出

3. **结果展示**
   - Background 返回结构化摘要
   - Side Panel 显示摘要、要点、话题、情感

### 关键技术点

- **Offscreen Document** - WebLLM 需要在独立上下文运行
- **Content Security Policy** - 允许 WebGPU WASM 执行
- **JSON 解析增强** - 三层解析策略（代码块 → 花括号 → jsonrepair）
- **智能重试** - 3 次重试 + 脚本注入 + 连接验证

## 常见问题

### WebGPU 不可用

**问题**: 提示"您的浏览器不支持 WebGPU"

**解决方案**:
1. 更新 Chrome 到最新版本
2. 启用 WebGPU: 访问 `chrome://flags/#enable-unsafe-webgpu`
3. 检查显卡驱动是否最新

### 模型下载失败

**问题**: 模型下载中断或失败

**解决方案**:
1. 检查网络连接
2. 使用 VPN（某些地区可能限制访问 Hugging Face）
3. 清除缓存后重试

### 内容提取失败

**问题**: 提示"页面内容提取失败"

**解决方案**:
1. 确保页面是普通网页（http/https）
2. 某些搜索页面（Google、百度）可能不支持
3. 刷新页面后重试

### 内存不足

**问题**: 提示"设备内存不足"

**解决方案**:
1. 关闭其他标签页
2. 切换到更小的模型（如 Phi-3.5 Mini）
3. 关闭其他占用内存的应用

## 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 遵循 ESLint 配置
- 使用 TypeScript 类型注解
- 编写清晰的注释
- 遵循现有代码风格

## 参考资源

- [WebLLM 官方文档](https://webllm.mlc.ai/)
- [Chrome 扩展开发指南](https://developer.chrome.com/docs/extensions/)
- [WebGPU 规范](https://www.w3.org/TR/webgpu/)
- [Readability 项目](https://github.com/mozilla/readability)

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 致谢

- [WebLLM](https://github.com/mlc-ai/web-llm) - 本地 LLM 推理引擎
- [Readability](https://github.com/mozilla/readability) - 网页内容提取
- [Chrome Extension Samples](https://github.com/GoogleChrome/chrome-extensions-samples) - 扩展示例代码

---

**享受本地 AI 带来的智能网页分析体验！**
