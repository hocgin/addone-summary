import React from 'react'
import './ErrorView.css'

interface ErrorViewProps {
  error: string
  onRetry: () => void
}

export const ErrorView: React.FC<ErrorViewProps> = ({ error, onRetry }) => {
  return (
    <div className="error-view">
      <div className="error-icon">⚠️</div>
      <h2 className="error-title">处理失败</h2>
      <p className="error-message">{error}</p>

      <div className="error-actions">
        <button className="retry-button" onClick={onRetry}>
          重试
        </button>
      </div>

      <div className="error-tips">
        <p className="tips-title">可能的原因：</p>
        <ul className="tips-list">
          <li>设备内存不足</li>
          <li>网络连接不稳定</li>
          <li>浏览器不支持 WebGPU</li>
          <li>页面内容无法访问</li>
        </ul>
      </div>
    </div>
  )
}
