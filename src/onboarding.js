let currentStep = 1
let progressListenerRegistered = false

function showStep(stepNumber) {
  // 隐藏所有步骤
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'))
  // 显示当前步骤
  document.getElementById(`step-${stepNumber}`).classList.add('active')
  // 更新进度条
  for (let i = 1; i <= 4; i++) {
    const progressEl = document.getElementById(`progress-${i}`)
    if (i <= stepNumber) {
      progressEl.classList.add('active')
    } else {
      progressEl.classList.remove('active')
    }
  }
  currentStep = stepNumber
}

// 确保已注册进度监听器
function ensureProgressListener() {
  if (progressListenerRegistered) return

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'MODEL_PROGRESS') {
      console.log('[Onboarding] 进度更新:', message)

      const progress = message.progress * 100
      document.getElementById('download-progress').style.width = `${progress}%`
      document.getElementById('download-percent').textContent = `${Math.round(progress)}%`

      if (message.stage) {
        document.getElementById('download-stage').textContent = message.stage
        updateTimeline(message.progress)
      }

      if (message.details) {
        const { downloaded, total, speed, remaining } = message.details
        if (downloaded) document.getElementById('downloaded-size').textContent = downloaded
        if (total) document.getElementById('total-size').textContent = total
        if (speed) document.getElementById('download-speed').textContent = speed
        if (remaining) document.getElementById('remaining-time').textContent = remaining
      }

      // 更新状态文本
      const statusEl = document.getElementById('download-status')
      if (progress < 20) {
        statusEl.textContent = '正在初始化 AI 模型...'
      } else if (progress < 50) {
        statusEl.textContent = '正在下载模型文件...'
      } else if (progress < 80) {
        statusEl.textContent = '正在编译模型...'
      } else if (progress < 100) {
        statusEl.textContent = '即将完成...'
      }

      // 下载完成
      if (message.progress >= 1) {
        setTimeout(() => {
          showStep(4)
        }, 500)
      }
    }
  })

  progressListenerRegistered = true
}

// 发送消息到 offscreen document（通过 background）
async function sendToOffscreen(type, data = {}) {
  console.log('[Onboarding] 发送到 offscreen:', type, data)

  try {
    const response = await chrome.runtime.sendMessage({
      type,
      ...data
    })

    console.log('[Onboarding] 收到响应:', response)
    return response
  } catch (error) {
    console.error('[Onboarding] 发送消息失败:', error)
    throw error
  }
}

async function checkWebGPU() {
  showStep(2)

  const icon = document.getElementById('check-icon')
  const title = document.getElementById('check-title')
  const desc = document.getElementById('check-desc')
  const infoBox = document.getElementById('check-info')
  const buttons = document.getElementById('check-buttons')

  try {
    const response = await chrome.runtime.sendMessage({ type: 'CHECK_WEBGPU' })
    const supported = response?.supported || false

    if (supported) {
      icon.textContent = '✅'
      icon.classList.add('success')
      title.textContent = '设备支持 WebGPU'
      desc.textContent = '太好了！您的设备支持 WebGPU，可以使用本地 AI 功能。'

      infoBox.style.display = 'block'
      document.getElementById('check-info-title').textContent = '接下来：'
      document.getElementById('check-info-list').innerHTML = `
        <li>下载轻量级 AI 模型（约 1GB）</li>
        <li>首次下载需要 3-15 分钟</li>
        <li>之后会自动缓存，无需重复下载</li>
      `

      buttons.style.display = 'flex'
      document.getElementById('check-next-btn').addEventListener('click', startDownload)
    } else {
      icon.textContent = '⚠️'
      icon.classList.add('error')
      title.textContent = '设备不支持 WebGPU'
      desc.textContent = '抱歉，您的设备当前不支持 WebGPU，无法使用本地 AI 功能。'

      infoBox.style.display = 'block'
      infoBox.classList.add('error')
      document.getElementById('check-info-title').textContent = '可能的原因：'
      document.getElementById('check-info-list').innerHTML = `
        <li>Chrome 版本过低（需要 113+）</li>
        <li>WebGPU 功能未启用</li>
        <li>显卡不支持 WebGPU</li>
      `

      buttons.style.display = 'flex'
      document.getElementById('check-next-btn').style.display = 'none'
    }
  } catch (error) {
    console.error('WebGPU check failed:', error)
    icon.textContent = '❌'
    title.textContent = '检查失败'
    desc.textContent = '无法检测 WebGPU 支持，请稍后重试。'
  }
}

async function startDownload() {
  showStep(3)

  const statusEl = document.getElementById('download-status')
  const stageEl = document.getElementById('download-stage')

  try {
    statusEl.textContent = '正在初始化下载...'
    console.log('[Onboarding] 开始下载流程...')

    // 确保进度监听器已注册
    ensureProgressListener()

    // 发送初始化请求到 offscreen document
    console.log('[Onboarding] 发送初始化请求到 offscreen...')
    const response = await sendToOffscreen('INITIALIZE_MODEL')

    console.log('[Onboarding] 初始化响应:', response)

    if (response && response.success) {
      statusEl.textContent = '下载已开始...'
      console.log('[Onboarding] 模型初始化已开始')
    } else {
      throw new Error(response?.error || '未知错误')
    }
  } catch (error) {
    console.error('[Onboarding] 下载请求失败:', error)

    // 显示错误信息
    if (statusEl) {
      statusEl.textContent = '初始化失败: ' + error.message
      statusEl.style.color = '#f44336'
    }

    const currentStepEl = document.getElementById(`step-${currentStep}`)
    if (currentStepEl) {
      const errorSection = document.createElement('div')
      errorSection.className = 'error-section'
      errorSection.innerHTML = `
        <div class="error-icon">⚠️</div>
        <h3>模型初始化失败</h3>
        <p class="error-message">${error.message}</p>
        <div class="error-details">
          <p><strong>可能的原因：</strong></p>
          <ul>
            <li>网络连接问题 - 模型需要从远程服务器下载</li>
            <li>WebGPU 不可用 - 需要 Chrome 113+ 并启用 WebGPU</li>
            <li>内存不足 - 需要至少 2GB 可用内存</li>
            <li>浏览器兼容性问题</li>
          </ul>
        </div>
        <button class="retry-button" onclick="location.reload()">重新加载页面</button>
      `
      currentStepEl.appendChild(errorSection)
    }
  }
}

// 更新时间轴显示
function updateTimeline(progress) {
  const steps = [
    { id: 'timeline-step-1', threshold: 0 },
    { id: 'timeline-step-2', threshold: 0.1 },
    { id: 'timeline-step-3', threshold: 0.2 },
    { id: 'timeline-step-4', threshold: 0.5 },
    { id: 'timeline-step-5', threshold: 0.8 }
  ]

  steps.forEach((step) => {
    const el = document.getElementById(step.id)
    if (progress >= step.threshold) {
      el.classList.add('active')
    } else {
      el.classList.remove('active')
    }
  })
}

async function skipOnboarding() {
  await chrome.storage.local.set({ onboardingCompleted: true })
  window.close()
}

async function finishOnboarding() {
  await chrome.storage.local.set({ onboardingCompleted: true })
  window.close()
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  // 绑定按钮事件
  document.getElementById('start-setup-btn').addEventListener('click', checkWebGPU)
  document.getElementById('skip-btn').addEventListener('click', skipOnboarding)
  document.getElementById('background-download-btn').addEventListener('click', skipOnboarding)
  document.getElementById('finish-btn').addEventListener('click', finishOnboarding)

  // 检查是否已完成引导
  chrome.storage.local.get(['onboardingCompleted'], (result) => {
    if (result.onboardingCompleted) {
      // 已完成，关闭页面
      window.close()
    }
  })

  console.log('[Onboarding] 页面已加载，等待用户操作')
})
