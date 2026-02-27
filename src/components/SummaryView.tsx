import React from 'react'
import type { StructuredSummary } from '../types'
import './SummaryView.css'

interface SummaryViewProps {
  data: StructuredSummary & { title?: string; url?: string }
  onReset: () => void
  onRetry: () => void
}

const getSentimentIcon = (sentiment: string): string => {
  switch (sentiment) {
    case 'positive':
      return '😊'
    case 'negative':
      return '😟'
    default:
      return '😐'
  }
}

const getSentimentLabel = (sentiment: string): string => {
  switch (sentiment) {
    case 'positive':
      return '积极'
    case 'negative':
      return '消极'
    default:
      return '中性'
  }
}

const getSentimentClass = (sentiment: string): string => {
  switch (sentiment) {
    case 'positive':
      return 'sentiment-positive'
    case 'negative':
      return 'sentiment-negative'
    default:
      return 'sentiment-neutral'
  }
}

export const SummaryView: React.FC<SummaryViewProps> = ({ data, onReset, onRetry }) => {
  const handleCopy = async () => {
    const text = `
# ${data.title || '网页摘要'}

## 摘要
${data.abstract}

## 关键要点
${data.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

## 话题标签
${data.topics.map(tag => `#${tag}`).join(' ')}

## 情感分析
${getSentimentLabel(data.sentiment)} (可信度: ${Math.round(data.confidence * 100)}%)

来源: ${data.url}
    `.trim()

    try {
      await navigator.clipboard.writeText(text)
      alert('已复制到剪贴板')
    } catch {
      alert('复制失败')
    }
  }

  return (
    <div className="summary-view">
      <div className="summary-header">
        <h2>分析完成</h2>
        <div className="header-actions">
          <button className="icon-button" onClick={handleCopy} title="复制">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          <button className="icon-button" onClick={onReset} title="关闭">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="summary-content">
        {data.title && (
          <div className="page-info">
            <h3 className="page-title">{data.title}</h3>
          </div>
        )}

        <section className="summary-section">
          <h4 className="section-title">摘要</h4>
          <p className="abstract-text">{data.abstract}</p>
        </section>

        <section className="summary-section">
          <h4 className="section-title">关键要点</h4>
          <ul className="key-points-list">
            {data.keyPoints.map((point, index) => (
              <li key={index} className="key-point-item">{point}</li>
            ))}
          </ul>
        </section>

        <section className="summary-section">
          <h4 className="section-title">话题标签</h4>
          <div className="topics-container">
            {data.topics.map((topic, index) => (
              <span key={index} className="topic-tag">#{topic}</span>
            ))}
          </div>
        </section>

        <section className="summary-section">
          <h4 className="section-title">情感分析</h4>
          <div className={`sentiment-badge ${getSentimentClass(data.sentiment)}`}>
            <span className="sentiment-icon">{getSentimentIcon(data.sentiment)}</span>
            <span className="sentiment-label">{getSentimentLabel(data.sentiment)}</span>
            <span className="sentiment-confidence">
              可信度: {Math.round(data.confidence * 100)}%
            </span>
          </div>
        </section>
      </div>

      {/* 底部操作栏 */}
      <div className="summary-footer">
        <button className="retry-button" onClick={onRetry}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          重新生成
        </button>
      </div>
    </div>
  )
}
