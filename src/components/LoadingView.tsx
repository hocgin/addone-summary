import React from 'react'
import './LoadingView.css'

interface LoadingViewProps {
  progress: number
  message: string
  stage?: string
  details?: {
    downloaded?: string
    total?: string
    speed?: string
    remaining?: string
  }
}

export const LoadingView: React.FC<LoadingViewProps> = ({ progress, message, stage, details }) => {
  const hasDetails = details && (details.downloaded || details.speed || details.remaining)

  return (
    <div className="loading-view">
      <div className="loading-animation">
        <div className="spinner"></div>
      </div>

      <h2 className="loading-title">AI 正在分析中</h2>
      <p className="loading-message">{message}</p>

      {stage && <p className="loading-stage">{stage}</p>}

      <div className="progress-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="progress-text">{Math.round(progress)}%</span>
      </div>

      {hasDetails && (
        <div className="progress-details">
          {details.downloaded && details.total && (
            <div className="detail-item">
              <span className="detail-label">已下载</span>
              <span className="detail-value">{details.downloaded} / {details.total}</span>
            </div>
          )}
          {details.speed && (
            <div className="detail-item">
              <span className="detail-label">下载速度</span>
              <span className="detail-value">{details.speed}</span>
            </div>
          )}
          {details.remaining && (
            <div className="detail-item">
              <span className="detail-label">剩余时间</span>
              <span className="detail-value">{details.remaining}</span>
            </div>
          )}
        </div>
      )}

      <div className="loading-steps">
        <div className={`step ${progress >= 0 ? 'active' : ''}`}>
          <span className="step-icon">⚙️</span>
          <span className="step-text">初始化模型</span>
        </div>
        <div className={`step ${progress >= 30 ? 'active' : ''}`}>
          <span className="step-icon">📄</span>
          <span className="step-text">提取内容</span>
        </div>
        <div className={`step ${progress >= 50 ? 'active' : ''}`}>
          <span className="step-icon">🤖</span>
          <span className="step-text">生成摘要</span>
        </div>
      </div>
    </div>
  )
}
