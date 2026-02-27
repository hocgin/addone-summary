import React from 'react'
import './WelcomeView.css'

interface WelcomeViewProps {
  onStart: () => void
  isModelLoaded: boolean
  canStart: boolean
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onStart, isModelLoaded, canStart }) => {
  return (
    <div className="welcome-view">
      <div className="welcome-header">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="30" fill="url(#gradient)" />
          <path d="M20 32L28 40L44 24" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <h1>网页内容总结</h1>
        <p className="subtitle">使用本地 AI 智能分析当前网页</p>
      </div>

      <div className="welcome-features">
        <div className="feature-item">
          <div className="feature-icon">📝</div>
          <div className="feature-text">提取关键信息</div>
        </div>
        <div className="feature-item">
          <div className="feature-icon">🎯</div>
          <div className="feature-text">生成结构化摘要</div>
        </div>
        <div className="feature-item">
          <div className="feature-icon">🔒</div>
          <div className="feature-text">本地处理，保护隐私</div>
        </div>
      </div>

      <button className="start-button" onClick={onStart} disabled={!canStart}>
        {canStart ? '开始分析' : '请先完成设置'}
      </button>

      {!isModelLoaded && canStart && (
        <p className="loading-hint">点击开始后将自动加载模型</p>
      )}
      
      {!canStart && (
        <p className="loading-hint">首次使用需要下载 AI 模型（约 1GB）</p>
      )}
    </div>
  )
}
