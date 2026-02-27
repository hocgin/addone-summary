import React, { useState, useEffect } from 'react'
import './OnboardingView.css'

interface OnboardingViewProps {
  onComplete: () => void
  isModelLoaded: boolean
}

type Step = 'welcome' | 'check' | 'download' | 'complete'

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete, isModelLoaded }) => {
  const [currentStep, setCurrentStep] = useState<Step>('welcome')
  const [webgpuSupported, setWebgpuSupported] = useState<boolean | null>(null)
  const [modelProgress, setModelProgress] = useState(0)
  const [isChecking, setIsChecking] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (isModelLoaded) {
      setCurrentStep('complete')
    }
  }, [isModelLoaded])

  const checkWebGPU = async () => {
    setIsChecking(true)

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_WEBGPU'
      })

      setWebgpuSupported(response?.supported || false)
      setCurrentStep('check')
    } catch (error) {
      console.error('WebGPU check failed:', error)
      setWebgpuSupported(false)
      setCurrentStep('check')
    } finally {
      setIsChecking(false)
    }
  }

  const startDownload = async () => {
    setIsDownloading(true)
    setCurrentStep('download')

    try {
      // 开始模型下载
      const response = await chrome.runtime.sendMessage({
        type: 'PRELOAD_MODEL'
      })

      if (response?.success) {
        // 监听进度更新
        const listener = (message: any) => {
          if (message.type === 'MODEL_DOWNLOAD_PROGRESS') {
            setModelProgress(message.progress * 100)

            if (message.progress >= 1) {
              setIsDownloading(false)
              setCurrentStep('complete')
              chrome.runtime.onMessage.removeListener(listener)
            }
          }
        }

        chrome.runtime.onMessage.addListener(listener)
      }
    } catch (error) {
      console.error('Model download failed:', error)
      setIsDownloading(false)
    }
  }

  const skipDownload = () => {
    // 保存已跳过的状态
    chrome.storage.local.set({ onboardingCompleted: true })
    onComplete()
  }

  const finishOnboarding = () => {
    chrome.storage.local.set({ onboardingCompleted: true })
    onComplete()
  }

  return (
    <div className="onboarding-view">
      {currentStep === 'welcome' && (
        <WelcomeStep
          onStart={checkWebGPU}
          isChecking={isChecking}
        />
      )}

      {currentStep === 'check' && (
        <CheckResultStep
          webgpuSupported={webgpuSupported}
          onNext={webgpuSupported ? startDownload : undefined}
          onSkip={skipDownload}
        />
      )}

      {currentStep === 'download' && (
        <DownloadStep
          progress={modelProgress}
          isDownloading={isDownloading}
          onComplete={() => setCurrentStep('complete')}
        />
      )}

      {currentStep === 'complete' && (
        <CompleteStep onFinish={finishOnboarding} />
      )}
    </div>
  )
}

// 欢迎步骤
const WelcomeStep: React.FC<{
  onStart: () => void
  isChecking: boolean
}> = ({ onStart, isChecking }) => {
  return (
    <div className="onboarding-step">
      <div className="step-icon">🎉</div>
      <h2 className="step-title">欢迎使用 WebLLM-X</h2>
      <p className="step-description">
        本地 AI 网页内容总结工具，无需联网，保护隐私
      </p>

      <div className="feature-list">
        <div className="feature-item">
          <span className="feature-icon">✨</span>
          <span className="feature-text">本地处理，数据不上传</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">⚡</span>
          <span className="feature-text">智能提取关键信息</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🎯</span>
          <span className="feature-text">结构化摘要生成</span>
        </div>
      </div>

      <div className="step-info">
        <p className="info-title">首次使用需要：</p>
        <ul className="info-list">
          <li>检查设备是否支持 WebGPU</li>
          <li>下载 AI 模型文件（约 1GB）</li>
          <li>初始化推理引擎</li>
        </ul>
      </div>

      <button
        className="primary-button"
        onClick={onStart}
        disabled={isChecking}
      >
        {isChecking ? '检查中...' : '开始设置'}
      </button>
    </div>
  )
}

// 检查结果步骤
const CheckResultStep: React.FC<{
  webgpuSupported: boolean | null
  onNext?: () => void
  onSkip: () => void
}> = ({ webgpuSupported, onNext, onSkip }) => {
  if (webgpuSupported === null) {
    return <div className="onboarding-step">检查中...</div>
  }

  return (
    <div className="onboarding-step">
      {webgpuSupported ? (
        <>
          <div className="step-icon success">✅</div>
          <h2 className="step-title">设备支持 WebGPU</h2>
          <p className="step-description">
            太好了！您的设备支持 WebGPU，可以使用本地 AI 功能。
          </p>

          <div className="step-info">
            <p className="info-title">接下来：</p>
            <ul className="info-list">
              <li>下载轻量级 AI 模型（约 1GB）</li>
              <li>首次下载需要 3-15 分钟</li>
              <li>之后会自动缓存，无需重复下载</li>
            </ul>
          </div>

          <div className="button-group">
            <button className="primary-button" onClick={onNext}>
              立即下载模型
            </button>
            <button className="secondary-button" onClick={onSkip}>
              稍后再说
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="step-icon error">⚠️</div>
          <h2 className="step-title">设备不支持 WebGPU</h2>
          <p className="step-description">
            抱歉，您的设备当前不支持 WebGPU，无法使用本地 AI 功能。
          </p>

          <div className="step-info error">
            <p className="info-title">可能的原因：</p>
            <ul className="info-list">
              <li>Chrome 版本过低（需要 113+）</li>
              <li>WebGPU 功能未启用</li>
              <li>显卡不支持 WebGPU</li>
            </ul>
          </div>

          <div className="step-info">
            <p className="info-title">解决方法：</p>
            <ol className="info-list">
              <li>更新 Chrome 到最新版本</li>
              <li>访问 chrome://flags/</li>
              <li>搜索 "WebGPU" 并启用</li>
              <li>重启浏览器后重新检查</li>
            </ol>
          </div>

          <div className="button-group">
            <button className="secondary-button" onClick={onSkip}>
              稍后再试
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// 下载步骤
const DownloadStep: React.FC<{
  progress: number
  isDownloading: boolean
  onComplete: () => void
}> = ({ progress, isDownloading, onComplete }) => {
  useEffect(() => {
    if (progress >= 100 && !isDownloading) {
      onComplete()
    }
  }, [progress, isDownloading, onComplete])

  return (
    <div className="onboarding-step">
      <div className="loading-spinner"></div>
      <h2 className="step-title">正在下载 AI 模型</h2>
      <p className="step-description">
        首次使用需要下载模型文件，请耐心等待...
      </p>

      <div className="progress-section">
        <div className="progress-bar-large">
          <div
            className="progress-fill-large"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="progress-percent">{Math.round(progress)}%</span>
      </div>

      <div className="download-info">
        <div className="info-item">
          <span className="info-label">下载大小</span>
          <span className="info-value">~1000 MB</span>
        </div>
        <div className="info-item">
          <span className="info-label">预计时间</span>
          <span className="info-value">3-15 分钟</span>
        </div>
      </div>

      <div className="step-tips">
        <p className="tips-title">提示：</p>
        <ul className="tips-list">
          <li>下载期间可以继续浏览其他网页</li>
          <li>模型会自动缓存，下次无需重新下载</li>
          <li>如果下载失败，可以稍后重试</li>
        </ul>
      </div>

      <button
        className="secondary-button"
        onClick={() => window.close()}
      >
        后台下载
      </button>
    </div>
  )
}

// 完成步骤
const CompleteStep: React.FC<{
  onFinish: () => void
}> = ({ onFinish }) => {
  return (
    <div className="onboarding-step">
      <div className="step-icon success">🎉</div>
      <h2 className="step-title">设置完成！</h2>
      <p className="step-description">
        模型已准备就绪，现在可以开始使用 AI 总结功能了。
      </p>

      <div className="success-animation">
        <div className="checkmark">✓</div>
      </div>

      <div className="step-info">
        <p className="info-title">如何使用：</p>
        <ol className="info-list">
          <li>浏览任意网页</li>
          <li>点击工具栏中的扩展图标</li>
          <li>点击"开始分析"按钮</li>
          <li>查看 AI 生成的摘要</li>
        </ol>
      </div>

      <button className="primary-button" onClick={onFinish}>
        开始使用
      </button>
    </div>
  )
}
