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

// 统一的消息监听器
chrome.runtime.onMessage.addListener((message: ChromeMessage, sender, sendResponse) => {
  // 1. 处理来自 offscreen 的进度消息转发
  if (sender.url && sender.url.includes('offscreen.html')) {
    if (message.type === 'MODEL_PROGRESS') {
      chrome.runtime.sendMessage(message).catch(() => {
        // 忽略错误
      })
    }
    // 不返回 true，因为不需要向 offscreen 发送响应
  }

  // console.log('[Background] 收到消息:', message.type)

  // 2. 处理打开引导页面请求
  if (message.type === 'OPEN_ONBOARDING') {
    chrome.storage.local.get(['onboardingCompleted']).then(async (result) => {
      try {
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
    })
    return true
  }

  // 3. 处理模型状态检查
  if (message.type === 'CHECK_MODEL_STATUS') {
    ensureOffscreenDocument().then(async (offscreenReady) => {
      try {
        if (!offscreenReady) {
          sendResponse({ isModelLoaded: false })
          return
        }

        const response = await chrome.runtime.sendMessage({
          type: 'CHECK_STATUS'
        }).catch(() => null)

        sendResponse({ isModelLoaded: response?.isReady || false })
      } catch (error) {
        sendResponse({ isModelLoaded: false })
      }
    })
    return true
  }

  // 4. 处理 WebGPU 检查
  if (message.type === 'CHECK_WEBGPU') {
    const supported = checkWebGPUAvailability()
    sendResponse({
      supported,
      message: supported ? '设备支持 WebGPU' : '设备不支持 WebGPU'
    })
    return true
  }

  // 5. 处理模型初始化（来自 onboarding 页面）
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

    ensureOffscreenDocument().then(async (offscreenReady) => {
      try {
        if (!offscreenReady) {
          sendResponse({
            success: false,
            error: '无法创建 offscreen document，请查看控制台了解详情'
          })
          return
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
    })
    return true
  }

  // 6. 处理模型预加载
  if (message.type === 'PRELOAD_MODEL') {
    sendResponse({ success: false, error: '请使用 onboarding 页面进行模型下载' })
    return true
  }

  // 7. 处理页面摘要
  if (message.type === 'SUMMARIZE_PAGE') {
    console.log('[Background] 处理 SUMMARIZE_PAGE')

    // 使用立即执行的异步函数来处理逻辑
    ;(async () => {
      try {
        // 1. 确保 Offscreen document 存在
        const offscreenReady = await ensureOffscreenDocument()
        if (!offscreenReady) {
          throw new Error('无法创建后台处理环境')
        }

        // 2. 检查模型状态
        const statusResponse = await chrome.runtime.sendMessage({
          type: 'CHECK_STATUS'
        }).catch((err) => {
          console.error('[Background] 检查模型状态失败:', err)
          return null
        })

        if (!statusResponse || !statusResponse.isReady) {
          console.log('[Background] 模型未就绪，尝试自动初始化...')

          // 尝试初始化
          const initResponse = await chrome.runtime.sendMessage({
            type: 'INITIALIZE_MODEL'
          }).catch(err => ({ success: false, error: err.message })) as { success: boolean; error?: string }

          if (!initResponse.success) {
            throw new Error(initResponse.error || ERROR_MESSAGES.MODEL_LOAD_FAILED)
          }
        }

        // 3. 获取目标标签页
        let activeTab = null
        const targetTabId = message.tabId  // 获取指定的标签页 ID

        if (targetTabId) {
          // 如果指定了标签页 ID，直接使用
          activeTab = await chrome.tabs.get(targetTabId).catch(() => null)
          console.log('[Background] 使用指定标签页:', targetTabId)
        } else if (sender.tab) {
          // 从标签页的 popup 或 content script 发送的消息
          activeTab = sender.tab
        } else {
          // 从 Side Panel 或其他地方发送的消息，需要获取当前活动标签页
          // 先尝试获取所有窗口，然后找到最近活动的窗口
          const windows = await chrome.windows.getAll({ populate: true })
          // 找到最近聚焦的窗口
          const lastFocusedWindow = windows.find(w => w.focused)
          // 或者最后一个窗口
          const targetWindow = lastFocusedWindow || windows[windows.length - 1]

          if (targetWindow && targetWindow.tabs) {
            // 找到该窗口中活动的标签页
            activeTab = targetWindow.tabs.find(t => t.active)
          }

          // 如果还是找不到，尝试直接查询当前窗口的活动标签页
          if (!activeTab) {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
            activeTab = tabs[0]
          }
        }

        if (!activeTab || !activeTab.id) {
          console.error('[Background] 无法获取当前标签页，sender:', sender)
          throw new Error('无法获取当前标签页')
        }

        console.log('[Background] 目标标签页:', activeTab.id, activeTab.url)

        // 4. 提取页面内容
        // 检查 URL 是否支持注入
        const tabUrl = activeTab.url || ''
        if (!tabUrl.startsWith('http://') && !tabUrl.startsWith('https://')) {
          throw new Error('无法在当前页面生成摘要（不支持的 URL 协议，需要 http/https）')
        }

        // 检查是否是特殊的搜索页面（这些页面可能有严格的 CSP 策略）
        const isSearchPage = /google\.|bing\.|baidu\.|duckduckgo\./i.test(tabUrl)
        if (isSearchPage) {
          console.warn('[Background] 检测到搜索页面，可能存在 CSP 限制')
        }

        let extractionResponse = null
        let lastError = null

        // 尝试多次提取内容
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`[Background] 提取内容尝试 ${attempt}/3...`)
            extractionResponse = await chrome.tabs.sendMessage(activeTab.id, {
              type: 'EXTRACT_CONTENT'
            })
            console.log('[Background] 提取成功')
            break
          } catch (err) {
            lastError = err
            console.error(`[Background] 尝试 ${attempt} 失败:`, err)

            // 如果是第一次失败，尝试注入 content script
            if (attempt === 1) {
              console.log('[Background] Content script 未加载，尝试注入...')
              try {
                await chrome.scripting.executeScript({
                  target: { tabId: activeTab.id },
                  files: ['content-script.js']
                })
                console.log('[Background] Content script 注入成功，等待初始化...')

                // 等待脚本执行和监听器注册
                await new Promise(resolve => setTimeout(resolve, 2000))

                // 验证脚本是否真的加载了
                try {
                  await chrome.tabs.sendMessage(activeTab.id, { type: 'PING' })
                  console.log('[Background] Content script 已就绪')
                } catch (pingErr) {
                  console.warn('[Background] Content script 响应验证失败，继续尝试...')
                }
              } catch (injectErr) {
                console.error('[Background] 注入脚本失败:', injectErr)

                // 检查是否是搜索页面
                if (isSearchPage) {
                  throw new Error('搜索页面（如 Google、百度）可能有严格的限制，无法注入脚本。请尝试在普通网页上使用此功能。')
                }
                throw new Error('无法注入 content script，请刷新页面后重试')
              }
            } else {
              // 后续重试之间也等待一下
              await new Promise(resolve => setTimeout(resolve, 800))
            }
          }
        }

        if (!extractionResponse || !extractionResponse.text) {
          console.error('[Background] 所有尝试均失败，最后错误:', lastError)
          throw new Error(ERROR_MESSAGES.EXTRACTION_FAILED)
        }

        if (!extractionResponse || !extractionResponse.text) {
          throw new Error(ERROR_MESSAGES.EXTRACTION_FAILED)
        }

        // 5. 发送摘要生成请求
        const summarizeResponse = await chrome.runtime.sendMessage({
          type: 'SUMMARIZE',
          text: extractionResponse.text
        }).catch((err) => {
          console.error('[Background] 发送摘要请求失败:', err)
          return { success: false, error: err.message }
        })

        // 6. 返回结果
        if (summarizeResponse.success) {
          sendResponse({
            success: true,
            data: summarizeResponse.data
          } as SummarizeResponse)
        } else {
          sendResponse({
            success: false,
            error: summarizeResponse.error || ERROR_MESSAGES.GENERATION_FAILED
          })
        }

      } catch (error) {
        console.error('[Background] 摘要生成失败:', error)
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN
        } as SummarizeResponse)
      }
    })()

    return true
  }

  return false
})

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('WebLLM-X Extension installed:', details.reason)

  if (details.reason === 'install') {
    try {
      // 设置点击图标打开 Side Panel
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

      await chrome.tabs.create({
        url: chrome.runtime.getURL('src/welcome.html'),
        active: true
      })
    } catch (error) {
      console.error('Failed to setup extension:', error)
    }
  }

  if (details.reason === 'update') {
    console.log('Extension updated to version:', chrome.runtime.getManifest().version)
  }
})

chrome.runtime.onStartup.addListener(async () => {
  console.log('WebLLM-X Extension started')
})

chrome.action.onClicked.addListener(async (tab) => {
  const result = await chrome.storage.local.get(['onboardingCompleted'])

  if (!result.onboardingCompleted) {
    // 尚未完成初始化，打开引导页
    // 注意：由于设置了 openPanelOnActionClick: true，SidePanel 也会打开
    // 我们可能需要在这里关闭它，或者引导页完成后自动处理
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/onboarding.html'),
      active: true
    })
  }
  if (!tab.url) return;
  const url = new URL(tab.url);
  if (url.origin) {
    await chrome.sidePanel.setOptions({
      tabId: tab.id,
      path: 'src/sidepanel.html',
      enabled: true
    });
  } else {
    // Disables the side panel on all other sites
    await chrome.sidePanel.setOptions({
      tabId: tab.id,
      enabled: false
    });
  }
})
