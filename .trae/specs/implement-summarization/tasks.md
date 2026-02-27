# Tasks

- [x] Task 1: 完善 `WebLLMManager` 实现
  - [x] SubTask 1.1: 修复 `summarize` 方法中的流式响应处理，正确累积 `delta.content`。
  - [x] SubTask 1.2: 优化 `parseSummary` 方法，增加对 Markdown JSON 代码块（```json ... ```）的清洗逻辑。
  - [x] SubTask 1.3: 确保 `progressCallback` 能正确反映生成进度。

- [x] Task 2: 实现 Background 摘要逻辑与状态检查
  - [x] SubTask 2.1: 在 `src/background.ts` 中实现 `SUMMARIZE_PAGE` 的处理逻辑。
  - [x] SubTask 2.2: 在执行摘要前，先检查 Offscreen/Sandbox 中的模型状态。如果不就绪，返回明确的 `MODEL_NOT_READY` 错误。
  - [x] SubTask 2.3: 获取当前活动标签页并发送 `EXTRACT_CONTENT` 消息。
  - [x] SubTask 2.4: 将提取的内容发送给 Offscreen 发送 `SUMMARIZE` 消息，并等待结果。
  - [x] SubTask 2.5: 将结果通过 `sendResponse` 返回给 Popup。

- [x] Task 3: 更新 Popup UI 逻辑与引导
  - [x] SubTask 3.1: 在 `src/App.tsx` 中添加对 `GENERATION_PROGRESS` 消息的监听。
  - [x] SubTask 3.2: 更新 `handleSummarize` 的错误处理逻辑。如果捕获到 `MODEL_NOT_READY` 错误，设置 `needsSetup` 状态为 `true`，从而显示 `SetupPromptView`。
  - [x] SubTask 3.3: 确保 `SetupPromptView` 能正确引导用户打开 `onboarding.html`。

- [x] Task 4: 验证与调试
  - [x] SubTask 4.1: 验证在未下载模型时点击生成，是否正确引导至 Onboarding 页。
  - [x] SubTask 4.2: 验证内容提取是否正常。
  - [x] SubTask 4.3: 验证模型初始化后摘要生成流程是否通畅。
