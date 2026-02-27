import { WebLLMManager } from './lib/webllm-manager'
import type { WebLLMProgress } from './types'

console.log('[Sandbox] 沙盒页面已加载')

const webllmManager = WebLLMManager.getInstance()

// 发送 READY 消息通知父窗口
postMessage('READY', {})

// 日志函数
function log(message: string, type: 'info' | 'error' | 'success' = 'info') {
  const logDiv = document.getElementById('log')!
  const logItem = document.createElement('div')
  logItem.className = `log-item ${type}`
  logItem.textContent = `[${new Date().toLocaleTimeString()}] ${message}`
  logDiv.appendChild(logItem)
  console.log(`[Sandbox] ${message}`)
}

// 发送消息到父窗口
function postMessage(type: string, data: any = {}) {
  window.parent.postMessage({
    source: 'webllm-sandbox',
    type,
    ...data
  }, '*')
}

// 监听来自父窗口的消息
window.addEventListener('message', async (event) => {
  // 忽略来自不同源的消息（安全检查）
  if (event.source === window) return

  const message = event.data
  if (message.source !== 'webllm-extension') return

  log(`收到消息: ${message.type}`)

  if (message.type === 'INITIALIZE_MODEL') {
    await handleInitializeModel()
  }

  if (message.type === 'SUMMARIZE') {
    await handleSummarize(message.text)
  }

  if (message.type === 'CHECK_STATUS') {
    const status = {
      isReady: webllmManager.isReady(),
      progress: webllmManager.getInitProgress()
    }
    postMessage('STATUS', status)
  }
})

async function handleInitializeModel() {
  try {
    log('开始初始化模型...', 'info')

    if (typeof GPU === 'undefined') {
      throw new Error('WebGPU 不可用')
    }

    log('WebGPU 可用，开始初始化...', 'success')

    await webllmManager.initialize((progressReport: WebLLMProgress) => {
      log(`进度: ${(progressReport.progress * 100).toFixed(1)}% - ${progressReport.stage || ''}`)

      postMessage('PROGRESS', {
        progress: progressReport.progress,
        stage: progressReport.stage,
        details: {
          downloaded: progressReport.downloaded,
          total: progressReport.total,
          speed: progressReport.speed,
          remaining: progressReport.remaining
        }
      })
    })

    log('模型初始化完成', 'success')
    postMessage('INIT_SUCCESS', { success: true })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    log(`初始化失败: ${errorMsg}`, 'error')
    console.error('[Sandbox] 初始化失败:', error)

    postMessage('INIT_ERROR', {
      success: false,
      error: errorMsg,
      details: {
        message: errorMsg,
        name: error instanceof Error ? error.name : undefined
      }
    })
  }
}

async function handleSummarize(text: string) {
  try {
    log('开始生成摘要...', 'info')

    if (!webllmManager.isReady()) {
      throw new Error('模型未初始化')
    }

    const summary = await webllmManager.summarize(text, (progress) => {
      postMessage('GENERATION_PROGRESS', { progress })
    })

    log('摘要生成完成', 'success')
    postMessage('SUMMARIZE_SUCCESS', { success: true, data: summary })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    log(`生成失败: ${errorMsg}`, 'error')
    console.error('[Sandbox] 生成失败:', error)

    postMessage('SUMMARIZE_ERROR', {
      success: false,
      error: errorMsg
    })
  }
}

log('沙盒页面准备就绪，等待消息...', 'success')
