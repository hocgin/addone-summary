export interface StructuredSummary {
  abstract: string
  keyPoints: string[]
  topics: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  confidence: number
  tabId?: number  // 记录来源标签页 ID
  pageTitle?: string  // 记录页面标题
  pageUrl?: string  // 记录页面 URL
}

/**
 * JSON 解析错误类型
 */
export enum ParseErrorType {
  /** markdown 代码块提取失败 */
  MARKDOWN_EXTRACT_FAILED = 'MARKDOWN_EXTRACT_FAILED',
  /** 花括号边界查找失败 */
  BRACE_BOUNDARY_FAILED = 'BRACE_BOUNDARY_FAILED',
  /** jsonrepair 修复失败 */
  JSON_REPAIR_FAILED = 'JSON_REPAIR_FAILED',
  /** 结构验证失败 */
  STRUCTURE_VALIDATION_FAILED = 'STRUCTURE_VALIDATION_FAILED',
  /** 内容解析错误 */
  CONTENT_PARSE_ERROR = 'CONTENT_PARSE_ERROR'
}

/**
 * 内容提取错误类型
 */
export enum ExtractErrorType {
  /** Readability 解析失败 */
  READABILITY_FAILED = 'READABILITY_FAILED',
  /** 内容过短 */
  CONTENT_TOO_SHORT = 'CONTENT_TOO_SHORT',
  /** 内容为空 */
  CONTENT_EMPTY = 'CONTENT_EMPTY',
  /** 降级提取失败 */
  FALLBACK_FAILED = 'FALLBACK_FAILED'
}

/**
 * 解析结果元数据
 */
export interface ParseResultMetadata {
  /** 使用的解析方法 */
  parseMethod: 'markdown-code-block' | 'brace-boundaries' | 'jsonrepair' | 'fallback'
  /** 解析耗时（毫秒） */
  parseTimeMs: number
  /** 原始响应长度 */
  rawResponseLength: number
  /** 是否经过修复 */
  wasRepaired: boolean
}

/**
 * 内容提取结果
 */
export interface ExtractionResult {
  /** 提取的文本内容 */
  text: string
  /** 内容质量评估 */
  quality: 'high' | 'medium' | 'low'
  /** 是否验证通过 */
  valid: boolean
  /** 验证失败原因（如果有） */
  reason?: string
  /** 字符数 */
  characterCount: number
  /** 单词数 */
  wordCount: number
  /** 提取方法 */
  method: 'readability' | 'fallback'
}

export interface SummarizeRequest {
  type: 'SUMMARIZE_PAGE'
  tabId?: number  // 可选的标签页 ID，用于重试时指定目标标签页
}

export interface CheckModelStatusRequest {
  type: 'CHECK_MODEL_STATUS'
}

export interface OpenOnboardingRequest {
  type: 'OPEN_ONBOARDING'
}

export interface CheckWebGPURequest {
  type: 'CHECK_WEBGPU'
}

export interface CheckWebGPUResponse {
  supported: boolean
  message?: string
}

export interface PreloadModelRequest {
  type: 'PRELOAD_MODEL'
}

export interface PreloadModelResponse {
  success: boolean
  error?: string
}

export interface ModelDownloadProgress {
  type: 'MODEL_DOWNLOAD_PROGRESS'
  progress: number
  stage?: string
  details?: {
    downloaded?: string
    total?: string
    speed?: string
    remaining?: string
  }
}

export interface CheckModelStatusResponse {
  isModelLoaded: boolean
}

export interface SummarizeResponse {
  success: boolean
  data?: StructuredSummary
  error?: string
}

export interface ProgressUpdate {
  type: 'PROGRESS_UPDATE'
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

export interface WebLLMProgress {
  progress: number
  timeElapsed: number
  stage?: string
  downloaded?: string
  total?: string
  speed?: string
  remaining?: string
}

export interface ModelInitProgress extends WebLLMProgress {
  model: string
  isInitializing: boolean
}

// Offscreen 相关消息类型
export interface ModelProgressMessage {
  type: 'MODEL_PROGRESS'
  progress: number
  stage?: string
  details?: {
    downloaded?: string
    total?: string
    speed?: string
    remaining?: string
  }
}

export interface GenerationProgressMessage {
  type: 'GENERATION_PROGRESS'
  progress: number
}

export interface InitializeModelMessage {
  type: 'INITIALIZE_MODEL'
}

export interface CheckStatusMessage {
  type: 'CHECK_STATUS'
}

export interface SummarizeMessage {
  type: 'SUMMARIZE'
  text: string
}

export type ChromeMessage =
  | SummarizeRequest
  | ProgressUpdate
  | CheckModelStatusRequest
  | OpenOnboardingRequest
  | CheckWebGPURequest
  | PreloadModelRequest
  | ModelDownloadProgress
  | ModelProgressMessage
  | GenerationProgressMessage
  | InitializeModelMessage
  | SwitchModelRequest

export interface ExtractContentMessage {
  type: 'EXTRACT_CONTENT'
}

export interface ExtractedContent {
  type: 'CONTENT_EXTRACTED'
  text: string
  url: string
  title: string
}

/**
 * 模型配置信息
 */
export interface ModelConfig {
  id: string
  name: string
  description: string
  size: string
}

/**
 * 模型选择设置
 */
export interface ModelSettings {
  selectedModel: string
}

/**
 * 切换模型请求
 */
export interface SwitchModelRequest {
  type: 'SWITCH_MODEL'
  modelId: string
}

/**
 * 切换模型响应
 */
export interface SwitchModelResponse {
  success: boolean
  error?: string
}
