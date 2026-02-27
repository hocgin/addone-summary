import { useState, useEffect, useCallback, useRef } from 'react'
import { WelcomeView } from './components/WelcomeView'
import { LoadingView } from './components/LoadingView'
import { SummaryView } from './components/SummaryView'
import { ErrorView } from './components/ErrorView'
import { SetupPromptView } from './components/SetupPromptView'
import { ERROR_MESSAGES } from './utils/constants'
import type { StructuredSummary, ProgressUpdate } from './types'
import './App.css'

type Status = 'idle' | 'loading' | 'done' | 'error'

interface PageInfo {
  title: string
  url: string
}

function SidePanelApp() {
  const [status, setStatus] = useState<Status>('idle')
  const [summary, setSummary] = useState<StructuredSummary | null>(null)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [stage, setStage] = useState('')
  const [details, setDetails] = useState<{
    downloaded?: string
    total?: string
    speed?: string
    remaining?: string
  }>({})
  const [error, setError] = useState('')
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [isCheckingModel, setIsCheckingModel] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)
  const listenerRef = useRef<((message: ProgressUpdate | any) => void) | null>(null)

  const [onboardingCompleted, setOnboardingCompleted] = useState(false)
  const [pageInfo, setPageInfo] = useState<PageInfo>({ title: '', url: '' })

  const handleProgressMessage = useCallback((message: ProgressUpdate | any) => {
    if (message.type === 'PROGRESS_UPDATE') {
      console.log('收到进度更新:', message)
      setProgress(message.progress)
      setMessage(message.message)
      setStage(message.stage || '')
      setDetails(message.details || {})
    } else if (message.type === 'MODEL_DOWNLOAD_PROGRESS') {
      console.log('收到模型下载进度:', message)
      // 用于 onboarding 页面的下载进度
    } else if (message.type === 'GENERATION_PROGRESS') {
      console.log('收到生成进度:', message)
      setProgress(message.progress)
    } else if (message.type === 'MODEL_PROGRESS') {
      // 收到模型初始化进度，显示加载界面
      if (status === 'idle' && !isModelLoaded) {
        setStatus('loading')
        setMessage('正在初始化模型...')
      }
      setProgress(message.progress)
      if (message.stage) setStage(message.stage)
    }
  }, [status, isModelLoaded])

  const handleSummarize = async () => {
    setStatus('loading')
    setProgress(0)
    setMessage('正在初始化 AI 模型...')
    setStage('')
    setDetails({})
    setError('')

    try {
      console.log('发送 SUMMARIZE_PAGE 请求')
      const response = await chrome.runtime.sendMessage({
        type: 'SUMMARIZE_PAGE'
      })

      console.log('收到响应:', response)

      if (response?.success) {
        setSummary(response.data)
        setIsModelLoaded(true)
        setStatus('done')
      } else {
        if (response?.error === ERROR_MESSAGES.MODEL_NOT_READY) {
          setNeedsSetup(true)
          setStatus('idle')
          return
        }
        setError(response?.error || '未知错误')
        setStatus('error')
      }
    } catch (err) {
      console.error('请求失败:', err)
      const errorMsg = err instanceof Error ? err.message : '未知错误'
      
      // 处理不支持的 URL 协议
      if (errorMsg.includes('不支持的 URL 协议')) {
        setError('无法在当前页面生成摘要。请在普通的网页（如 http/https）上使用此功能。')
      } else {
        setError(errorMsg)
      }
      setStatus('error')
    }
  }

  useEffect(() => {
    // 检查 onboarding 状态
    chrome.storage.local.get(['onboardingCompleted'], (result) => {
      const completed = !!result.onboardingCompleted
      setOnboardingCompleted(completed)
      setNeedsSetup(!completed)

      if (!completed) {
        // 如果未完成初始化，自动打开引导页
        chrome.tabs.create({
          url: chrome.runtime.getURL('src/onboarding.html')
        })
      } else {
        // 检查模型状态（但不自动开始分析）
        chrome.runtime.sendMessage({ type: 'CHECK_MODEL_STATUS' }, (response) => {
          setIsCheckingModel(false)
          if (response?.isModelLoaded) {
            setIsModelLoaded(true)
          }
        })
      }
    })

    // 获取当前活动标签页信息
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        setPageInfo({
          title: tabs[0].title || '未知页面',
          url: tabs[0].url || ''
        })
      }
    })

    // 移除旧的监听器
    if (listenerRef.current) {
      chrome.runtime.onMessage.removeListener(listenerRef.current)
    }

    // 注册新的监听器
    listenerRef.current = handleProgressMessage
    chrome.runtime.onMessage.addListener(handleProgressMessage)

    // 清理函数
    return () => {
      if (listenerRef.current) {
        chrome.runtime.onMessage.removeListener(listenerRef.current)
        listenerRef.current = null
      }
    }
  }, [handleProgressMessage])

  const handleReset = () => {
    setStatus('idle')
    setSummary(null)
    setProgress(0)
    setMessage('')
    setStage('')
    setDetails({})
    setError('')
  }

  const openOnboarding = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/onboarding.html')
    })
  }

  // 检查模型状态
  if (isCheckingModel) {
    return (
      <div className="app-container checking">
        <div className="checking-spinner"></div>
        <p>正在检查模型状态...</p>
      </div>
    )
  }

  // 如果需要设置，显示设置提示界面
  if (needsSetup && status === 'idle') {
    return (
      <div className="app-container">
        <SetupPromptView onSetup={openOnboarding} />
      </div>
    )
  }

  return (
    <div className="app-container">
      {/* 显示页面标题 */}
      {pageInfo.title && (
        <div className="page-info">
          <div className="page-title" title={pageInfo.url}>
            <span className="page-icon">📄</span>
            {pageInfo.title}
          </div>
        </div>
      )}

      {status === 'idle' && !needsSetup && (
        <WelcomeView
          onStart={handleSummarize}
          isModelLoaded={isModelLoaded}
          canStart={onboardingCompleted}
        />
      )}
      {status === 'loading' && (
        <LoadingView progress={progress} message={message} stage={stage} details={details} />
      )}
      {status === 'done' && summary && (
        <SummaryView data={summary} onReset={handleReset} />
      )}
      {status === 'error' && (
        <ErrorView error={error} onRetry={handleSummarize} />
      )}
    </div>
  )
}

export default SidePanelApp
