# WebLLM-X - Chrome 网页内容总结插件

使用本地 AI 模型在浏览器中智能总结网页内容的 Chrome 扩展。

## 功能特点

- **本地处理**：所有内容在本地处理，保护隐私
- **智能提取**：自动提取页面关键内容，过滤无关信息
- **结构化摘要**：生成包含摘要、关键点、话题标签和情感分析的结构化摘要
- **轻量级模型**：使用 Llama-3.2-1B-Instruct 模型，资源占用小

## 技术栈

- React 18 + TypeScript
- Vite + CRXJS（开发构建）
- WebLLM（本地 AI 推理）
- Chrome Extension Manifest V3

## 开发

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 加载扩展到 Chrome

1. 打开 Chrome 扩展管理页面：`chrome://extensions/`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目的 `dist` 目录

## 使用说明

1. 浏览任意网页
2. 点击浏览器工具栏中的扩展图标
3. 首次使用会自动下载 AI 模型（约 1GB）
4. 等待分析完成，查看结构化摘要

## 系统要求

- Chrome 113+ 或支持 WebGPU 的浏览器
- 至少 2GB 可用内存
- 推荐：独立显卡

## 项目结构

```
web-llm-x/
├── src/
│   ├── background/        # Service Worker（后台脚本）
│   ├── components/        # React UI 组件
│   ├── content-scripts/   # 内容脚本（页面内容提取）
│   ├── lib/              # WebLLM 管理器
│   ├── utils/            # 工具函数
│   ├── types/            # TypeScript 类型定义
│   ├── popup.tsx         # Popup 入口
│   └── background.ts     # Service Worker 入口
├── public/               # 静态资源
│   └── icons/           # 扩展图标
├── manifest.json         # 扩展清单
└── package.json          # 项目配置
```

## 待实现功能

- [ ] 设置页面（模型选择、摘要长度）
- [ ] 历史记录保存
- [ ] 快捷键支持
- [ ] 导出为 Markdown
- [ ] 多语言支持

## License

MIT
