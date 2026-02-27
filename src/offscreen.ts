console.log('[Offscreen] Offscreen document loaded')

// 获取 sandbox iframe 并设置正确的 URL
const sandboxIframe = document.getElementById('sandbox-iframe') as HTMLIFrameElement
sandboxIframe.src = chrome.runtime.getURL('src/sandbox.html')
console.log('[Offscreen] Sandbox iframe URL:', sandboxIframe.src)

// 等待 sandbox iframe 加载完成
let sandboxReady = false
let pendingResponse: ((response: any) => void) | null = null

// 监听来自 sandbox iframe 的消息
window.addEventListener('message', (event) => {
  // 安全检查：确保消息来自 sandbox iframe
  if (event.source !== sandboxIframe.contentWindow) return

  const message = event.data
  if (message.source !== 'webllm-sandbox') return

  console.log('[Offscreen] 收到来自 Sandbox 的消息:', message.type)

  // 处理 sandbox 的 READY 消息
  if (message.type === 'READY') {
    sandboxReady = true
    console.log('[Offscreen] Sandbox iframe 已就绪')
    return
  }

  // 处理进度消息
  if (message.type === 'PROGRESS') {
    chrome.runtime.sendMessage({
      type: 'MODEL_PROGRESS',
      progress: message.progress,
      stage: message.stage,
      details: message.details
    }).catch((err) => {
      console.log('[Offscreen] 发送进度失败:', err)
    })
    return
  }

  // 处理生成进度
  if (message.type === 'GENERATION_PROGRESS') {
    chrome.runtime.sendMessage({
      type: 'GENERATION_PROGRESS',
      progress: message.progress
    }).catch(() => {})
    return
  }

  // 处理状态检查
  if (message.type === 'STATUS') {
    if (pendingResponse) {
      pendingResponse(message)
      pendingResponse = null
    }
    return
  }

  // 处理初始化结果
  if (message.type === 'INIT_SUCCESS' || message.type === 'INIT_ERROR') {
    if (pendingResponse) {
      pendingResponse(message)
      pendingResponse = null
    }
    return
  }

  // 处理摘要结果
  if (message.type === 'SUMMARIZE_SUCCESS' || message.type === 'SUMMARIZE_ERROR') {
    if (pendingResponse) {
      pendingResponse(message)
      pendingResponse = null
    }
    return
  }
})

// 向 sandbox iframe 发送消息
function sendToSandbox(type: string, data: any = {}): void {
  if (!sandboxReady) {
    console.log('[Offscreen] Sandbox 尚未就绪，等待...')
    // 等待 sandbox 准备好
    const checkReady = setInterval(() => {
      if (sandboxReady) {
        clearInterval(checkReady)
        sandboxIframe.contentWindow?.postMessage({
          source: 'webllm-extension',
          type,
          ...data
        }, '*')
      }
    }, 100)
    return
  }

  sandboxIframe.contentWindow?.postMessage({
    source: 'webllm-extension',
    type,
    ...data
  }, '*')
}

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Offscreen] 收到来自 Background 的消息:', message.type, '来自:', sender.url)

  if (message.type === 'INITIALIZE_MODEL') {
    console.log('[Offscreen] 转发 INITIALIZE_MODEL 到 Sandbox')
    pendingResponse = sendResponse
    sendToSandbox('INITIALIZE_MODEL')
    return true // 保持消息通道开放
  }

  if (message.type === 'SUMMARIZE') {
    console.log('[Offscreen] 转发 SUMMARIZE 到 Sandbox')
    pendingResponse = sendResponse
    sendToSandbox('SUMMARIZE', { text: message.text })
    return true // 保持消息通道开放
  }

  if (message.type === 'CHECK_STATUS') {
    console.log('[Offscreen] 转发 CHECK_STATUS 到 Sandbox')
    pendingResponse = sendResponse
    sendToSandbox('CHECK_STATUS')
    return true // 保持消息通道开放
  }

  console.log('[Offscreen] 未知消息类型:', message.type)
  return false
})

console.log('[Offscreen] 消息代理已设置')
