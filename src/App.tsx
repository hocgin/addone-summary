import { useState, useEffect } from 'react'
import { WelcomeView } from './components/WelcomeView'
import { SetupPromptView } from './components/SetupPromptView'
import './App.css'

function App() {
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [isCheckingModel, setIsCheckingModel] = useState(true)
  const [isModelLoaded, setIsModelLoaded] = useState(false)

  useEffect(() => {
    // 检查 onboarding 状态
    chrome.storage.local.get(['onboardingCompleted'], (result) => {
      const completed = !!result.onboardingCompleted
      setOnboardingCompleted(completed)
      setNeedsSetup(!completed)
    })

    // 检查模型状态
    chrome.runtime.sendMessage({ type: 'CHECK_MODEL_STATUS' }, (response) => {
      setIsCheckingModel(false)
      if (response?.isModelLoaded) {
        setIsModelLoaded(true)
      }
    })
  }, [])

  const handleOpenSidePanel = async () => {
    // 获取当前标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab.id) {
        // 打开侧边栏
        await chrome.sidePanel.open({ tabId: tab.id });
        // 发送开始摘要的消息
        setTimeout(() => {
            chrome.runtime.sendMessage({ type: 'START_SUMMARY' })
        }, 500)
        window.close()
    }
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
        <p>正在检查状态...</p>
      </div>
    )
  }

  // 如果需要设置，显示设置提示界面
  if (needsSetup) {
    return (
      <div className="app-container">
        <SetupPromptView onSetup={openOnboarding} />
      </div>
    )
  }

  return (
    <div className="app-container">
       <WelcomeView
          onStart={handleOpenSidePanel}
          isModelLoaded={isModelLoaded}
          canStart={onboardingCompleted}
          isPageSupported={true}
        />
    </div>
  )
}

export default App
