import React from 'react'
import './SetupPromptView.css'

interface SetupPromptViewProps {
  onSetup: () => void
}

export const SetupPromptView: React.FC<SetupPromptViewProps> = ({ onSetup }) => {
  return (
    <div className="setup-prompt-view">
      <div className="setup-icon">⚙️</div>
      <h2 className="setup-title">需要完成初始化设置</h2>
      <p className="setup-description">
        首次使用需要下载 AI 模型文件（约 1GB），完成后即可开始使用。
      </p>

      <div className="setup-steps">
        <div className="setup-step">
          <div className="step-number">1</div>
          <div className="step-content">
            <div className="step-title">检查设备支持</div>
            <div className="step-desc">检测 WebGPU 可用性</div>
          </div>
        </div>

        <div className="setup-step">
          <div className="step-number">2</div>
          <div className="step-content">
            <div className="step-title">下载 AI 模型</div>
            <div className="step-desc">约 1GB，首次使用需要</div>
          </div>
        </div>

        <div className="setup-step">
          <div className="step-number">3</div>
          <div className="step-content">
            <div className="step-title">开始使用</div>
            <div className="step-desc">智能分析网页内容</div>
          </div>
        </div>
      </div>

      <div className="setup-info">
        <div className="info-item">
          <span className="info-icon">⏱️</span>
          <div className="info-text">
            <div className="info-title">预计时间</div>
            <div className="info-value">3-15 分钟</div>
          </div>
        </div>

        <div className="info-item">
          <span className="info-icon">💾</span>
          <div className="info-text">
            <div className="info-title">模型大小</div>
            <div className="info-value">约 1GB</div>
          </div>
        </div>

        <div className="info-item">
          <span className="info-icon">🔒</span>
          <div className="info-text">
            <div className="info-title">隐私保护</div>
            <div className="info-value">本地处理</div>
          </div>
        </div>
      </div>

      <button className="setup-button" onClick={onSetup}>
        开始设置
      </button>

      <p className="setup-note">
        模型下载完成后会自动缓存，下次无需重复下载
      </p>
    </div>
  )
}
