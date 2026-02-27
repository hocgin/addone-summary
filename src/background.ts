import type { ChromeMessage, SummarizeResponse, ProgressUpdate } from './types'
import { ERROR_MESSAGES } from './utils/constants'

declare global {
  const GPU: unknown
}

// 检查 Chrome 版本是否支持 offscreen API
function isOffscreenAPISupported(): boolean {
  // Service worker 中无法访问 navigator，直接检查 API
  const hasAPI = typeof chrome.offscreen !== 'undefined'
  console.log(`[Background] offscreen API 可用: ${hasAPI}`)
  if (!hasAPI) {
    console.error('[Background] chrome.offscreen 未定义，可能需要更新 Chrome 版本到 109+')
  }
  return hasAPI
}

// Offscreen document 管理
let offscreenDocumentCreated = false

async function ensureOffscreenDocument(): Promise<boolean> {
  if (offscreenDocumentCreated) {
    return true
  }

  // 检查 chrome.offscreen API 是否可用
  if (!chrome.offscreen) {
    console.error('[Background] chrome.offscreen API 不可用，请确保使用 Chrome 109+')
    return false
  }

  try {
    // 检查是否已存在 offscreen document
    const existingContexts = await (chrome.runtime as any).getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    })

    if (existingContexts && existingContexts.length > 0) {
      offscreenDocumentCreated = true
      console.log('[Background] Offscreen document 已存在')
      return true
    }

    // 创建 offscreen document
    console.log('[Background] 正在创建 offscreen document...')
    await (chrome.offscreen as any).createDocument({
      url: chrome.runtime.getURL('src/offscreen.html'),
      reasons: ['WORKERS'],
      justification: 'WebLLM 需要在独立上下文中运行以避免阻塞主线程'
    })

    offscreenDocumentCreated = true
    console.log('[Background] Offscreen document 已创建')
    return true
  } catch (error: any) {
    // 如果已经存在，视为成功
    if (error?.message?.includes('already exists')) {
      offscreenDocumentCreated = true
      return true
    }
    console.error('[Background] 创建 offscreen document 失败:', error)
    return false
  }
}

function checkWebGPUAvailability(): boolean {
  return typeof GPU !== 'undefined'
}

function sendProgressToPopup(
  progress: number,
  message: string,
  stage?: string,
  details?: {
    downloaded?: string
    total?: string
    speed?: string
    remaining?: string
  }
): void {
  const update: ProgressUpdate = {
    type: 'PROGRESS_UPDATE',
    progress,
    message,
    stage,
    details
  }

  console.log('发送进度更新:', update)

  chrome.runtime.sendMessage(update).catch((err) => {
    console.log('发送进度更新失败 (popup 可能已关闭):', err)
  })
}

// 导出以避免 unused 警告，后续实现摘要功能时会用到
export { sendProgressToPopup }

// 转发来自 offscreen document 的进度消息到所有扩展页面
chrome.runtime.onMessage.addListener((message, sender) => {
  // 只处理来自 offscreen document 的进度消息
  // 检查 sender.url 是否包含 offscreen.html
  if (sender.url && sender.url.includes('offscreen.html')) {
    if (message.type === 'MODEL_PROGRESS') {
      // 转发到所有监听的页面（如 onboarding 页面）
      chrome.runtime.sendMessage(message).catch(() => {
        console.log('[Background] 转发进度消息失败（可能没有监听器）')
      })
    }
  }
  return false
})

// 统一的消息监听器
chrome.runtime.onMessage.addListener(
  async (message: ChromeMessage, _sender, sendResponse) => {
    console.log('[Background] 收到消息:', message.type)

    // 处理打开引导页面请求
    if (message.type === 'OPEN_ONBOARDING') {
      try {
        const result = await chrome.storage.local.get(['onboardingCompleted'])
        if (!result.onboardingCompleted) {
          await chrome.tabs.create({
            url: chrome.runtime.getURL('src/onboarding.html'),
            active: true
          })
        }
        sendResponse({ success: true })
      } catch (error) {
        console.error('Failed to open onboarding:', error)
        sendResponse({ success: false, error: String(error) })
      }
      return true
    }

    // 处理模型状态检查
    if (message.type === 'CHECK_MODEL_STATUS') {
      sendResponse({ isModelLoaded: false })
      return true
    }

    // 处理 WebGPU 检查
    if (message.type === 'CHECK_WEBGPU') {
      const supported = checkWebGPUAvailability()
      sendResponse({
        supported,
        message: supported ? '设备支持 WebGPU' : '设备不支持 WebGPU'
      })
      return true
    }

    // 处理模型初始化（来自 onboarding 页面）
    if (message.type === 'INITIALIZE_MODEL') {
      console.log('[Background] 处理 INITIALIZE_MODEL 请求')

      // 检查 offscreen API 支持
      if (!isOffscreenAPISupported()) {
        sendResponse({
          success: false,
          error: '您的浏览器不支持 Offscreen API。请使用 Chrome 109 或更高版本。'
        })
        return true
      }

      try {
        const offscreenReady = await ensureOffscreenDocument()
        if (!offscreenReady) {
          sendResponse({
            success: false,
            error: '无法创建 offscreen document，请查看控制台了解详情'
          })
          return true
        }

        // 转发消息到 offscreen document
        const response = await chrome.runtime.sendMessage({
          type: 'INITIALIZE_MODEL'
        }) as { success: boolean; error?: string }

        sendResponse(response)
      } catch (error) {
        console.error('[Background] 初始化模型失败:', error)
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : ERROR_MESSAGES.MODEL_LOAD_FAILED
        })
      }
      return true
    }

    // 处理模型预加载
    if (message.type === 'PRELOAD_MODEL') {
      sendResponse({ success: false, error: '请使用 onboarding 页面进行模型下载' })
      return true
    }

    // 处理页面摘要
    if (message.type === 'SUMMARIZE_PAGE') {
      console.log('[Background] 处理 SUMMARIZE_PAGE')
      try {
        if (!checkWebGPUAvailability()) {
          sendResponse({
            success: false,
            error: ERROR_MESSAGES.WEBGPU_NOT_AVAILABLE
          } as SummarizeResponse)
          return true
        }

        // TODO: 实现摘要生成逻辑
        // 需要在 popup 页面中也创建沙盒 iframe

        throw new Error('摘要功能开发中，请先完成 onboarding')
      } catch (error) {
        console.error('[Background] 摘要生成失败:', error)
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN
        } as SummarizeResponse)
      }
      return true
    }

    return false
  }
)

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('WebLLM-X Extension installed:', details.reason)

  if (details.reason === 'install') {
    try {
      await chrome.tabs.create({
        url: chrome.runtime.getURL('src/welcome.html'),
        active: true
      })
    } catch (error) {
      console.error('Failed to open welcome page:', error)
    }
  }

  if (details.reason === 'update') {
    console.log('Extension updated to version:', chrome.runtime.getManifest().version)
  }
})

chrome.runtime.onStartup.addListener(() => {
  console.log('WebLLM-X Extension started')
})

chrome.action.onClicked.addListener(async () => {
  const result = await chrome.storage.local.get(['onboardingCompleted'])
  if (!result.onboardingCompleted) {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/onboarding.html'),
      active: true
    })
  }
})
