# 网页摘要功能 Spec

## Why
目前插件已具备基本的架构（Background, Offscreen, Sandbox），但核心的摘要功能尚未实现。`src/background.ts` 中的 `SUMMARIZE_PAGE` 处理器目前抛出未实现错误。用户需要能够点击插件图标，触发对当前网页内容的分析和摘要生成。
此外，必须确保在模型未下载或环境未就绪时，能够引导用户完成初始化（Onboarding）。

## What Changes
- **src/background.ts**:
  - 实现 `SUMMARIZE_PAGE` 消息处理逻辑。
  - 获取当前活动标签页。
  - 发送 `EXTRACT_CONTENT` 消息给 Content Script 提取内容。
  - 将提取的内容发送给 Offscreen Document 进行摘要生成。
  - 处理来自 Offscreen 的响应并返回给 Popup。
  - **新增**: 在处理摘要请求前，检查模型状态。如果未就绪，返回特定错误码以供前端识别。
- **src/lib/webllm-manager.ts**:
  - 修复 `summarize` 方法中的流式处理逻辑，确保能正确解析分块数据。
  - 增强 JSON 解析的鲁棒性，处理可能包含 Markdown 代码块的响应。
- **src/App.tsx**:
  - 添加对 `GENERATION_PROGRESS` 消息的监听和处理，以在 UI 上显示生成进度。
  - **新增**: 完善错误处理逻辑。如果收到"模型未初始化"或类似错误，显示引导页面入口（SetupPromptView）或直接提供跳转按钮，而不是仅显示错误信息。
- **src/types/index.ts** (可选):
  - 确认消息类型定义是否完整。

## Impact
- **Affected specs**: 网页摘要生成能力，用户引导流程。
- **Affected code**: `src/background.ts`, `src/lib/webllm-manager.ts`, `src/App.tsx`.

## ADDED Requirements
### Requirement: 网页内容摘要
系统应能够提取当前网页的正文内容，并使用本地 WebLLM 模型生成结构化摘要。

#### Scenario: 成功生成摘要
- **WHEN** 用户在 Popup 页面点击"开始生成"（或类似触发操作）。
- **THEN** 插件提取当前网页内容。
- **THEN** 插件调用 WebLLM 模型进行分析。
- **THEN** UI 显示生成进度。
- **THEN** 生成完成后，UI 展示摘要（包含摘要、关键点、话题、情感倾向等）。

### Requirement: 未初始化引导
如果模型尚未下载或环境未就绪（如 Offscreen 未创建、Model 未加载），系统应引导用户前往 Onboarding 页面。

#### Scenario: 模型未就绪
- **WHEN** 用户尝试生成摘要但模型未就绪。
- **THEN** UI 显示提示信息，说明需要先下载模型。
- **THEN** 提供"前往设置"或"下载模型"的按钮，点击后打开 `onboarding.html`。

## MODIFIED Requirements
### Requirement: 消息通信机制
完善 Popup -> Background -> Content Script / Offscreen 之间的消息传递，确保数据流转通畅。
