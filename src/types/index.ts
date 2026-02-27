export interface StructuredSummary {
  abstract: string
  keyPoints: string[]
  topics: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  confidence: number
}

export interface SummarizeRequest {
  type: 'SUMMARIZE_PAGE'
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

export interface ExtractContentMessage {
  type: 'EXTRACT_CONTENT'
}

export interface ExtractedContent {
  type: 'CONTENT_EXTRACTED'
  text: string
  url: string
  title: string
}

