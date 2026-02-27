# 快速参考卡片

## 🚀 快速加载

### 方法 1: 使用脚本（推荐）
```bash
cd /Users/hocgin/Projects/web-llm-x
./load-extension.sh
```

### 方法 2: 手动加载
1. 构建: `pnpm build`
2. 打开: `chrome://extensions/`
3. 启用"开发者模式"
4. 加载: `dist/` 目录

## 🎯 首次安装流程

**自动引导流程（新标签页）：**
1. 安装扩展后自动打开 welcome.html（新标签页）
2. welcome.html 自动打开 onboarding.html（新标签页）
3. 在独立标签页完成 4 步引导流程
4. 完成后关闭引导标签页
5. 以后点击图标显示正常 Popup

**重置引导（测试用）：**
```javascript
chrome.storage.local.remove('onboardingCompleted')
```

## 📍 关键路径

| 项目 | 路径 |
|------|------|
| 项目目录 | `/Users/hocgin/Projects/web-llm-x` |
| 构建输出 | `/Users/hocgin/Projects/web-llm-x/dist` |
| 扩展配置 | `dist/manifest.json` |
| 欢迎页面 | `dist/src/welcome.html` |
| 测试指南 | `TEST_GUIDE.md` |
| 引导文档 | `ONBOARDING_GUIDE.md` |

## 🧪 快速测试

1. **加载扩展到 Chrome**
   ```
   chrome://extensions/ → 开发者模式 → 加载 dist/
   ```

2. **首次安装**
   - 移除旧扩展（如果有）
   - 重新加载 dist/
   - 观察欢迎页面自动打开
   - 点击扩展图标完成引导

3. **日常使用**
   ```
   访问网页 → 点击扩展图标 → 开始分析
   ```

## 🐛 调试方法

| 调试目标 | 方法 |
|---------|------|
| Popup UI | 右键扩展图标 → 检查弹出窗口 |
| Background | chrome://extensions/ → Service Worker |
| Content Script | 页面 F12 → Console |

## ⚡ 常用命令

```bash
# 构建
pnpm build

# 开发模式
pnpm dev

# 重新加载扩展
# chrome://extensions/ → 点击刷新按钮

# 查看日志
# chrome://extensions/ → Service Worker 链接
```

## 📊 进度阶段

| 进度 | 阶段 | 说明 |
|------|------|------|
| 0-10% | 初始化环境 | WebGPU 检查 |
| 10-20% | 加载配置 | 读取模型元数据 |
| 20-50% | 下载模型 | 从 CDN 下载权重 |
| 50-80% | 编译模型 | WebGPU 编译 |
| 80-95% | 准备引擎 | 初始化完成 |
| 95-100% | 生成摘要 | AI 推理 |

## 🔧 系统要求

- **Chrome**: 113 或更高版本
- **WebGPU**: 必须启用（chrome://flags/）
- **内存**: 至少 2GB 可用
- **磁盘**: 约 1GB（模型缓存）

## 📝 预期日志

### Service Worker
```
[WebLLM-X Extension installed]
[WebLLM] 开始初始化模型...
[WebLLM] 进度: 45.0% | 阶段: 下载模型权重文件
[WebLLM] 模型初始化完成
```

### Popup
```
收到进度更新: {type: "PROGRESS_UPDATE", progress: 0.45, ...}
收到模型下载进度: {type: "MODEL_DOWNLOAD_PROGRESS", progress: 0.45}
```

## ⏱️ 性能预期

| 场景 | 首次使用 | 后续使用 |
|------|---------|---------|
| 模型加载 | 3-15 分钟 | 5-10 秒 |
| 内容提取 | <1 秒 | <1 秒 |
| 摘要生成 | 5-15 秒 | 5-15 秒 |
| 总计 | 3-15 分钟 | 10-30 秒 |

## 🆘 快速故障排除

| 问题 | 解决方法 |
|------|---------|
| 扩展图标不显示 | chrome://extensions/ 检查是否启用 |
| 点击无反应 | 检查 Popup 路径是否正确 |
| WebGPU 不可用 | 更新 Chrome + 启用 WebGPU flags |
| 一直加载 | 检查 Service Worker 日志 |
| 下载失败 | 检查网络连接 |

## 📚 文档索引

- `TEST_GUIDE.md` - 详细测试指南
- `ONBOARDING_GUIDE.md` - 引导流程说明
- `INSTALL.md` - 安装说明
- `POPUP_PROGRESS.md` - 进度展示文档
- `README.md` - 项目概述

## 🎯 测试清单

### 首次安装
- [ ] 扩展安装成功
- [ ] 欢迎页面自动打开
- [ ] 欢迎页面样式正常
- [ ] 点击"打开扩展设置"工作

### 引导流程
- [ ] welcome.html 自动打开
- [ ] 自动跳转到 onboarding.html
- [ ] Onboarding 步骤 1 显示
- [ ] WebGPU 检查正常
- [ ] 模型下载进度显示
- [ ] 完成页面显示
- [ ] 标签页自动关闭

### Popup 检查
- [ ] 未初始化时显示 SetupPromptView
- [ ] 点击"开始设置"打开 onboarding.html
- [ ] 初始化完成后显示 WelcomeView

### 日常使用
- [ ] 扩展图标显示正常
- [ ] Popup 打开
- [ ] WebGPU 可用
- [ ] 进度展示正常
- [ ] 摘要生成成功
- [ ] 复制功能工作

## 🧪 测试脚本

```bash
# 测试引导流程
./test-onboarding.sh

# 重新加载扩展
./load-extension.sh
```
