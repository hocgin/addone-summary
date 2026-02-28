import React, { useState, useEffect } from 'react'
import { AVAILABLE_MODELS } from '../utils/constants'
import type { ModelConfig } from '../types'
import './ModelSelector.css'

interface ModelSelectorProps {
  currentModel: string
  onModelChange: (modelId: string) => void
  disabled?: boolean
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  currentModel,
  onModelChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null)

  useEffect(() => {
    const model = AVAILABLE_MODELS.find(m => m.id === currentModel)
    setSelectedModel(model || AVAILABLE_MODELS[1]) // 默认 Llama 3.2
  }, [currentModel])

  if (!selectedModel) return null

  return (
    <div className="model-selector">
      <button
        className="model-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        title={disabled ? '正在分析中，无法切换模型' : '切换模型'}
      >
        <div className="model-info">
          <span className="model-name">{selectedModel.name}</span>
          <span className="model-description">{selectedModel.description}</span>
        </div>
        <svg
          className={`model-selector-arrow ${isOpen ? 'open' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="model-dropdown">
          {AVAILABLE_MODELS.map((model) => (
            <button
              key={model.id}
              className={`model-option ${model.id === currentModel ? 'active' : ''}`}
              onClick={() => {
                onModelChange(model.id)
                setIsOpen(false)
              }}
            >
              <div className="model-option-info">
                <span className="model-option-name">{model.name}</span>
                <span className="model-option-desc">{model.description}</span>
              </div>
              <span className="model-option-size">{model.size}</span>
              {model.id === currentModel && (
                <svg className="model-option-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
