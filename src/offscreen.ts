import { WebLLMManager } from './lib/webllm-manager'
import type { WebLLMProgress } from './types'
import { ERROR_MESSAGES } from './utils/constants'

console.log('[Offscreen] Offscreen document loaded')

const webllmManager = WebLLMManager.getInstance()

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Offscreen] 收到消息:', message.type, '来自:', sender.url)

  if (message.type === 'INITIALIZE_MODEL') {
    console.log('[Offscreen] 开始处理 INITIALIZE_MODEL')
    handleInitializeModel(sendResponse)
    return true // 保持消息通道开放
  }

  if (message.type === 'SUMMARIZE') {
    console.log('[Offscreen] 开始处理 SUMMARIZE')
    handleSummarize(message.text, sendResponse)
    return true // 保持消息通道开放
  }

  if (message.type === 'CHECK_STATUS') {
    console.log('[Offscreen] 处理 CHECK_STATUS')
    const status = {
      isReady: webllmManager.isReady(),
      progress: webllmManager.getInitProgress()
    }
    console.log('[Offscreen] 状态:', status)
    sendResponse(status)
    return false // 同步响应，不需要保持通道开放
  }

  console.log('[Offscreen] 未知消息类型:', message.type)
  return false
})

async function handleInitializeModel(sendResponse: (response: any) => void) {
  try {
    console.log('[Offscreen] 开始初始化模型...')
    console.log('[Offscreen] 模型当前状态:', {
      isReady: webllmManager.isReady(),
      initProgress: webllmManager.getInitProgress()
    })

    // 检查 WebGPU 可用性
    if (typeof GPU === 'undefined') {
      throw new Error('WebGPU 不可用，请使用 Chrome 113+ 并启用 WebGPU')
    }

    console.log('[Offscreen] WebGPU 可用，开始初始化...')

    await webllmManager.initialize((progressReport: WebLLMProgress) => {
      console.log('[Offscreen] 进度更新:', progressReport)
      // 发送进度更新到 background
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
      }).catch((err) => {
        console.log('[Offscreen] 发送进度失败:', err)
      })
    })

    console.log('[Offscreen] 模型初始化完成')
    sendResponse({ success: true })
  } catch (error) {
    console.error('[Offscreen] 初始化失败:', error)
    console.error('[Offscreen] 错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })

    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : ERROR_MESSAGES.MODEL_LOAD_FAILED,
      details: {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : undefined
      }
    })
  }
}

async function handleSummarize(text: string, sendResponse: (response: any) => void) {
  try {
    if (!webllmManager.isReady()) {
      throw new Error('模型未初始化')
    }

    console.log('[Offscreen] 开始生成摘要...')
    const summary = await webllmManager.summarize(text, (progress) => {
      chrome.runtime.sendMessage({
        type: 'GENERATION_PROGRESS',
        progress
      }).catch(() => {})
    })

    console.log('[Offscreen] 摘要生成完成:', summary)
    sendResponse({ success: true, data: summary })
  } catch (error) {
    console.error('[Offscreen] 生成失败:', error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERATION_FAILED
    })
  }
}

console.log('[Offscreen] 消息监听器已设置')
