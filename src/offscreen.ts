import { WebLLMManager } from './lib/webllm-manager'
import type { WebLLMProgress } from './types'

console.log('[Offscreen] Offscreen document loaded')

const webllmManager = WebLLMManager.getInstance()

// 日志函数
function log(message: string, _type: 'info' | 'error' | 'success' = 'info') {
  console.log(`[Offscreen] ${message}`)
  const statusEl = document.getElementById('status')
  if (statusEl) {
    statusEl.textContent = message
  }
}

// 处理初始化
async function handleInitializeModel(sendResponse: (response: any) => void) {
  try {
    log('开始初始化模型...', 'info')

    if (typeof GPU === 'undefined') {
      throw new Error('WebGPU 不可用')
    }

    log('WebGPU 可用，开始初始化...', 'success')

    await webllmManager.initialize((progressReport: WebLLMProgress) => {
      log(`进度: ${(progressReport.progress * 100).toFixed(1)}% - ${progressReport.stage || ''}`)

      chrome.runtime.sendMessage({
        type: 'MODEL_PROGRESS',
        progress: progressReport.progress,
        stage: progressReport.stage,
        details: {
          downloaded: progressReport.downloaded,
          total: progressReport.total,
          speed: progressReport.speed,
          remaining: progressReport.remaining
        }
      }).catch((_err) => {
        // 忽略发送失败（可能是 popup 关闭了）
      })
    })

    log('模型初始化完成', 'success')
    sendResponse({ success: true })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    log(`初始化失败: ${errorMsg}`, 'error')
    console.error('[Offscreen] 初始化失败:', error)

    sendResponse({
      success: false,
      error: errorMsg,
      details: {
        message: errorMsg,
        name: error instanceof Error ? error.name : undefined
      }
    })
  }
}

// 处理摘要
async function handleSummarize(text: string, sendResponse: (response: any) => void) {
  try {
    log('开始生成摘要...', 'info')

    if (!webllmManager.isReady()) {
      throw new Error('模型未初始化')
    }

    const summary = await webllmManager.summarize(text, (progress) => {
      chrome.runtime.sendMessage({
        type: 'GENERATION_PROGRESS',
        progress
      }).catch(() => {})
    })

      console.log('text = ', text)
      console.log('summary = ', summary)
    log('摘要生成完成', 'success')
    sendResponse({ success: true, data: summary })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    log(`生成失败: ${errorMsg}`, 'error')
    console.error('[Offscreen] 生成失败:', error)

    sendResponse({
      success: false,
      error: errorMsg
    })
  }
}

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[Offscreen] 收到消息:', message.type)

  if (message.type === 'INITIALIZE_MODEL') {
    handleInitializeModel(sendResponse)
    return true // 保持消息通道开放
  }

  if (message.type === 'SUMMARIZE') {
    handleSummarize(message.text, sendResponse)
    return true // 保持消息通道开放
  }

  if (message.type === 'CHECK_STATUS') {
    const status = {
      isReady: webllmManager.isReady(),
      progress: webllmManager.getInitProgress()
    }
    sendResponse(status)
    return true
  }

  return false
})

